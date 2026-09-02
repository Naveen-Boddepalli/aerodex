"""index_point and adapter_health persistence.

These two tables are what the API's database path reads, and until now nothing
wrote them — a deployment with a live database served the frozen demo dataset
for every index endpoint because the tables behind them were empty.

Driven against a stand-in for psycopg: the assertions are about the parameters
and the transaction discipline, and CI's Postgres is exercised by
``test_queue_integration``.
"""

from __future__ import annotations

from datetime import UTC, date, datetime

import pandas as pd
import pytest

from aerodex.acquire.collect import CollectionReport
from aerodex.config import MethodologyConfig
from aerodex.db.records import record_adapter_health, store_index_points

CONFIG = MethodologyConfig.load()
COMPUTED_AT = datetime(2026, 10, 1, 3, 0, tzinfo=UTC)


class FakeCursor:
    def __init__(self, conn):
        self.conn = conn

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def _record(self, sql, rows):
        if self.conn.fail:
            raise RuntimeError("simulated write failure")
        self.conn.statements.append(sql)
        self.conn.params.extend(rows)

    def execute(self, sql, params=()):
        self._record(sql, [params])

    def executemany(self, sql, params, returning=False):
        self._record(sql, list(params))


class FakeConn:
    def __init__(self, fail=False):
        self.fail = fail
        self.statements: list[str] = []
        self.params: list[tuple] = []
        self.commits = 0
        self.rollbacks = 0

    def cursor(self):
        return FakeCursor(self)

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def _index_frame(periods=("2026-09-28", "2026-09-29", "2026-09-30")) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "period": p,
                "value": 100.0 + i,
                "index_ratio": 1.0 + i / 100,
                "imputed_weight_share": 0.01,
                "coverage_ratio": 0.99,
                "n_quotes": 2500 + i,
                "panel_hash": "p" * 64,
                "weights_vintage": CONFIG.weights_vintage,
            }
            for i, p in enumerate(periods)
        ]
    )


# -- index_point -------------------------------------------------------------


def test_every_period_is_written_once():
    conn = FakeConn()
    n = store_index_points(conn, _index_frame(), CONFIG, computed_at=COMPUTED_AT)
    assert n == len(conn.params) == 3
    assert conn.commits == 1
    assert len(conn.statements) == 1, "one batched statement, not one per period"


def test_the_config_hash_of_the_run_is_stamped_on_every_row():
    """M6: a stored number that cannot name its methodology is not reproducible."""
    conn = FakeConn()
    store_index_points(conn, _index_frame(), CONFIG, computed_at=COMPUTED_AT)
    assert {p[7] for p in conn.params} == {CONFIG.hash}
    assert {p[8] for p in conn.params} == {CONFIG.weights_vintage}
    assert {p[9] for p in conn.params} == {"p" * 64}


def test_the_revision_window_decides_what_is_still_provisional():
    conn = FakeConn()
    store_index_points(
        conn, _index_frame(), CONFIG,
        computed_at=COMPUTED_AT,
        provisional_before=date(2026, 9, 29),
    )
    by_period = {p[0]: p[10] for p in conn.params}
    assert by_period == {
        "2026-09-28": False,   # older than the cutoff — frozen
        "2026-09-29": True,    # on the cutoff — still open
        "2026-09-30": True,
    }


def test_a_period_that_could_not_be_computed_is_not_stored():
    """A NaN index value is a coverage failure, not a number to persist."""
    df = _index_frame()
    df.loc[1, "value"] = float("nan")
    conn = FakeConn()
    assert store_index_points(conn, df, CONFIG, computed_at=COMPUTED_AT) == 2
    assert "2026-09-29" not in {p[0] for p in conn.params}


def test_the_upsert_will_not_overwrite_a_frozen_period():
    """The revision policy freezes a number; a recompute must not rewrite it."""
    conn = FakeConn()
    store_index_points(conn, _index_frame(), CONFIG, computed_at=COMPUTED_AT)
    sql = conn.statements[0]
    assert "ON CONFLICT (period, frequency, series, config_hash) DO UPDATE" in sql
    assert "WHERE index_point.is_provisional" in sql


def test_a_failed_write_rolls_back_and_raises():
    conn = FakeConn(fail=True)
    with pytest.raises(RuntimeError):
        store_index_points(conn, _index_frame(), CONFIG, computed_at=COMPUTED_AT)
    assert (conn.rollbacks, conn.commits) == (1, 0)


# -- adapter_health ----------------------------------------------------------


def test_adapter_health_records_the_slot_outcome():
    conn = FakeConn()
    report = CollectionReport(scheduled=420, succeeded=417, failed=3)
    record_adapter_health(conn, "fixture", "morning", date(2026, 9, 30), report, tier=1)

    (source, slot, observed_on, scheduled, succeeded, failed, tier) = conn.params[0]
    assert (source, slot, observed_on) == ("fixture", "morning", date(2026, 9, 30))
    assert (scheduled, succeeded, failed, tier) == (420, 417, 3, 1)
    assert conn.commits == 1


def test_rerunning_a_slot_replaces_its_numbers_rather_than_doubling_them():
    conn = FakeConn()
    record_adapter_health(
        conn, "fixture", "morning", date(2026, 9, 30), CollectionReport(scheduled=1)
    )
    assert "ON CONFLICT (source, slot, observed_on) DO UPDATE" in conn.statements[0]


def test_adapter_health_failure_rolls_back():
    conn = FakeConn(fail=True)
    with pytest.raises(RuntimeError):
        record_adapter_health(
            conn, "fixture", "morning", date(2026, 9, 30), CollectionReport()
        )
    assert (conn.rollbacks, conn.commits) == (1, 0)
