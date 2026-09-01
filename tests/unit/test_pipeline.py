"""End-to-end pipeline on the fixture adapter, no database.

Regression guard for the flatline bug: if the matched sample empties, the
index sits at exactly its base value with perfect-looking inputs. That failure
mode is silent and reads as success, so it is tested explicitly.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

import pandas as pd
import pytest

from aerodex.acquire.adapters.fixture import FixtureAdapter
from aerodex.acquire.collect import build_requests, collect
from aerodex.config import MethodologyConfig, PanelConfig
from aerodex.index.engine import compute_index
from aerodex.normalise import normalise_quotes

CONFIG = MethodologyConfig.load()
PANEL = PanelConfig.load()


def _panel_frame(days: int = 4, strata_limit: int = 12) -> pd.DataFrame:
    adapter = FixtureAdapter()
    rows = []
    for d in range(days):
        collection_day = date(2026, 9, 1) + timedelta(days=d)
        reqs = build_requests(PANEL, "morning", today=collection_day)[:strata_limit]
        for req in reqs:
            for q in adapter.emit(req, datetime(2026, 9, 1 + d, 7, 0, tzinfo=UTC)):
                c = normalise_quotes([q])[0]
                rows.append(
                    {
                        "period": collection_day.isoformat(),
                        "origin": c.origin,
                        "destination": c.destination,
                        "horizon_days": c.horizon_days,
                        "itinerary_key": c.itinerary_key,
                        "fare_inr_paise": c.fare_inr_paise,
                    }
                )
    return pd.DataFrame(rows)


def test_pipeline_produces_a_moving_index():
    out = compute_index(_panel_frame(), CONFIG)
    assert len(out) == 4
    assert out["value"].iloc[0] == pytest.approx(100.0)
    # The index must actually move. All-100 means the matched sample collapsed.
    assert out["value"].nunique() > 1, "index flatlined — matched sample is empty"


def test_pipeline_achieves_full_coverage():
    """Every stratum reports; coverage < 1 here would be a matching failure,
    not a collection failure, because the fixture never fails to respond."""
    out = compute_index(_panel_frame(), CONFIG)
    assert (out["coverage_ratio"] == 1.0).all()
    assert (out["imputed_weight_share"] == 0.0).all()


def test_no_period_is_nan():
    out = compute_index(_panel_frame(), CONFIG)
    assert out["index_ratio"].iloc[1:].notna().all(), "a NaN ratio means zero matched items"


def test_index_movement_is_plausible():
    """A daily airfare index that moves 40% in a day is a bug, not a market."""
    out = compute_index(_panel_frame(), CONFIG)
    ratios = out["index_ratio"].iloc[1:]
    assert ((ratios > 0.7) & (ratios < 1.4)).all()


def test_collect_reports_full_success_on_fixture():
    reqs = build_requests(PANEL, "morning", today=date(2026, 9, 1))[:20]
    report = collect(
        FixtureAdapter(), reqs, CONFIG.raw, now=datetime(2026, 9, 1, tzinfo=UTC)
    )
    assert report.scheduled == 20
    assert report.succeeded == 20
    assert report.success_rate == 1.0
    assert report.quotes_valid > 0
    assert report.quotes_quarantined == 0


def test_engine_rejects_single_period_panel():
    df = _panel_frame(days=1)
    with pytest.raises(ValueError, match="2 periods"):
        compute_index(df, CONFIG)


def test_engine_rejects_missing_columns():
    df = _panel_frame().drop(columns=["itinerary_key"])
    with pytest.raises(ValueError, match="itinerary_key"):
        compute_index(df, CONFIG)


# ---------------------------------------------------------------------------
# The store path
#
# Exercised against a stand-in for psycopg rather than a live database: these
# are assertions about what `collect` does with a connection — batching, the
# raw -> clean link, and rollback — and CI has no Postgres. The stand-in
# implements the executemany(returning=True) / nextset() protocol the real
# driver documents, so a change to how the code walks that protocol fails here.
# ---------------------------------------------------------------------------


class FakeCursor:
    def __init__(self, conn):
        self.conn = conn
        self._results: list[tuple] = []

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def executemany(self, sql, params, returning=False):
        if self.conn.fail_on and self.conn.fail_on in sql:
            raise RuntimeError("simulated insert failure")
        table = "quote_raw" if "INTO quote_raw" in sql else "quote_clean"
        self.conn.batches.append((table, len(params)))
        self.conn.rows[table].extend(params)
        if returning:
            self._results = []
            for _ in params:
                self.conn.next_id += 1
                self._results.append((self.conn.next_id,))

    def fetchone(self):
        return self._results.pop(0) if self._results else None

    def nextset(self):
        return bool(self._results)


class FakeConn:
    def __init__(self, fail_on=None):
        self.fail_on = fail_on
        self.batches: list[tuple[str, int]] = []
        self.rows: dict[str, list] = {"quote_raw": [], "quote_clean": []}
        self.next_id = 0
        self.commits = 0
        self.rollbacks = 0

    def cursor(self):
        return FakeCursor(self)

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def _collect_into(conn, n_requests: int = 3):
    reqs = build_requests(PANEL, "morning", today=date(2026, 9, 1))[:n_requests]
    return collect(
        FixtureAdapter(), reqs, CONFIG.raw, now=datetime(2026, 9, 1, tzinfo=UTC), conn=conn
    )


def test_store_writes_every_quote_and_reports_what_it_stored():
    conn = FakeConn()
    report = _collect_into(conn)
    assert report.quotes_stored == len(conn.rows["quote_raw"]) > 0
    assert report.store_failures == 0
    assert len(conn.rows["quote_clean"]) == report.quotes_valid + report.quotes_quarantined


def test_store_batches_instead_of_one_round_trip_per_quote():
    """One executemany per table per stratum, not one execute per row."""
    conn = FakeConn()
    _collect_into(conn, n_requests=3)
    raw_batches = [n for table, n in conn.batches if table == "quote_raw"]
    assert len(raw_batches) == 3, "quote_raw should be written once per stratum"
    assert all(n > 1 for n in raw_batches), "the batch should carry the whole stratum"


def test_clean_rows_name_the_raw_row_they_came_from():
    """raw_id is the audit link back to the archived response; 0 is not a link."""
    conn = FakeConn()
    _collect_into(conn)
    raw_ids = {p[0] for p in conn.rows["quote_clean"]}
    assert 0 not in raw_ids, "a clean row with raw_id=0 cannot be traced to quote_raw"
    assert raw_ids <= {i + 1 for i in range(len(conn.rows["quote_raw"]))}


def test_a_failed_write_rolls_back_and_the_run_continues():
    """One bad stratum must not abort the transaction for every stratum after it."""
    conn = FakeConn(fail_on="INTO quote_clean")
    report = _collect_into(conn, n_requests=4)
    assert conn.rollbacks == 4, "each failure must roll back before the next stratum"
    assert report.store_failures == 4
    assert report.succeeded == 4, "collection succeeded; only the write failed"
    assert conn.commits == 0
