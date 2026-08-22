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
