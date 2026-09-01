"""The optimised matching path against the obvious one.

``compute_index`` no longer filters the panel per stratum and intersects two
pandas Series; it pivots the medians into one matrix and matches with a boolean
mask. That is a ~12x speedup on the 30-period demo panel and it must be a
speedup only — same medians, same matched set, same order into ``mean()``,
because float summation is order-dependent and M6 diffs the output hash.

``tests/golden`` pins the frozen panel. This pins the shapes that panel does not
have: strata that vanish for a period, a stratum too thin to report, and
relatives outside the clip band.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from aerodex.config import MethodologyConfig
from aerodex.index.aggregate import lowe
from aerodex.index.elementary import jevons, price_relatives
from aerodex.index.engine import compute_index
from aerodex.index.impute import stratum_group_mean

CONFIG = MethodologyConfig.load()


def _reference_index(
    panel: pd.DataFrame, config: MethodologyConfig, weights: dict | None = None
) -> pd.DataFrame:
    """The engine written the slow, obvious way, as the thing to be equal to."""
    periods = sorted(panel["period"].unique())
    work = panel.copy()
    work["route"] = work["origin"] + "-" + work["destination"]
    work["stratum"] = [
        f"{o}-{d}@{h}d"
        for o, d, h in zip(work["origin"], work["destination"], work["horizon_days"],
                           strict=True)
    ]
    all_strata = sorted(work["stratum"].unique())
    stratum_route = dict(zip(work["stratum"], work["route"], strict=True))

    if weights is None:
        stratum_weights = {s: 1.0 for s in all_strata}
    else:
        counts: dict[str, int] = {}
        for s in all_strata:
            counts[stratum_route[s]] = counts.get(stratum_route[s], 0) + 1
        stratum_weights = {
            s: float(weights.get(stratum_route[s], 0.0)) / counts[stratum_route[s]]
            for s in all_strata
        }

    level = config.base_value
    rows = [{"period": periods[0], "value": level, "index_ratio": 1.0}]

    for prev, cur in zip(periods[:-1], periods[1:], strict=True):
        ratios = {}
        for s in all_strata:
            cur_df = work[(work["period"] == cur) & (work["stratum"] == s)]
            prev_df = work[(work["period"] == prev) & (work["stratum"] == s)]
            rel = price_relatives(cur_df, prev_df)
            ratios[s] = (
                float("nan")
                if len(rel) < config.min_matched_quotes
                else jevons(rel, clip=config.relative_clip)
            )

        imp = stratum_group_mean(
            pd.Series(ratios, dtype="float64"),
            groups=stratum_route,
            weights=stratum_weights,
            max_weight_share=config.max_imputed_share,
        )
        ratio, _ = lowe(imp.values, stratum_weights)
        if np.isfinite(ratio):
            level = level * ratio
        rows.append({"period": cur, "value": float(level), "index_ratio": float(ratio)})

    return pd.DataFrame(rows)


def _panel(rows: list[tuple]) -> pd.DataFrame:
    return pd.DataFrame(
        rows,
        columns=[
            "period", "origin", "destination", "horizon_days",
            "itinerary_key", "fare_inr_paise",
        ],
    )


def _grid(periods, strata, items=4, drift=1.02) -> pd.DataFrame:
    """A dense panel: every item priced in every period.

    Every item moves at its **own** rate, and every stratum at its own too. That
    matters more than it looks: with one shared drift, any subset of items gives
    the same Jevons, so a test comparing two matching implementations would pass
    even if they disagreed about which items matched.
    """
    rows = []
    for p_i, period in enumerate(periods):
        for s_i, (origin, dest, horizon) in enumerate(strata):
            for k in range(items):
                rate = drift + 0.013 * k - 0.004 * s_i
                rows.append((
                    period, origin, dest, horizon,
                    f"{origin}|{dest}|h{horizon}|F{k}",
                    int(500_000 * (1 + 0.11 * k) * rate**p_i),
                ))
    return _panel(rows)


PERIODS = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]
STRATA = [("DEL", "BOM", 7), ("DEL", "BOM", 14), ("BLR", "MAA", 7), ("CCU", "HYD", 21)]
WEIGHTS = {"DEL-BOM": 0.5, "BLR-MAA": 0.3, "CCU-HYD": 0.2}


def _assert_matches_reference(panel, weights=None):
    fast = compute_index(panel, CONFIG, weights=weights)
    slow = _reference_index(panel, CONFIG, weights=weights)
    assert list(fast["period"]) == list(slow["period"])
    # Bit equality, not approx: a last-ulp difference here is a changed
    # published number as far as the output hash is concerned.
    np.testing.assert_array_equal(fast["value"].to_numpy(), slow["value"].to_numpy())
    np.testing.assert_array_equal(
        fast["index_ratio"].to_numpy()[1:], slow["index_ratio"].to_numpy()[1:]
    )


def test_matches_reference_on_a_dense_panel():
    _assert_matches_reference(_grid(PERIODS, STRATA))


def test_matches_reference_with_route_weights():
    _assert_matches_reference(_grid(PERIODS, STRATA), weights=WEIGHTS)


def test_matches_reference_when_a_stratum_drops_out_for_a_period():
    """A collection hole: the stratum has no rows at all in one period."""
    df = _grid(PERIODS, STRATA)
    hole = (df["period"] == PERIODS[2]) & (df["horizon_days"] == 14)
    _assert_matches_reference(df[~hole].reset_index(drop=True), weights=WEIGHTS)


def test_matches_reference_when_items_do_not_overlap_between_periods():
    """The schedule changed: this period's items are not last period's."""
    df = _grid(PERIODS, STRATA)
    swapped = (df["period"] == PERIODS[1]) & (df["destination"] == "MAA")
    df.loc[swapped, "itinerary_key"] = df.loc[swapped, "itinerary_key"] + "-newsched"
    _assert_matches_reference(df, weights=WEIGHTS)


def test_matches_reference_when_only_some_strata_clear_the_matched_floor():
    """One thin stratum among reporting ones: imputed, while the rest report."""
    df = _grid(PERIODS, STRATA, items=4)
    assert CONFIG.min_matched_quotes > 2, "fixture assumes a floor above 2"
    thin = (df["horizon_days"] == 14) & df["itinerary_key"].str.endswith(("F2", "F3"))
    df = df[~thin].reset_index(drop=True)

    out = compute_index(df, CONFIG, weights=WEIGHTS)
    assert (out["coverage_ratio"].iloc[1:] < 1.0).all(), "the thin stratum should not report"
    assert (out["imputed_weight_share"].iloc[1:] > 0.0).all()
    _assert_matches_reference(df, weights=WEIGHTS)


def test_matches_reference_when_a_relative_falls_outside_the_clip_band():
    """A fortyfold overnight move is a parse error; the clip band drops it."""
    df = _grid(PERIODS, STRATA, items=6)
    _low, high = CONFIG.relative_clip
    outlier = (df["period"] == PERIODS[1]) & (df["itinerary_key"].str.endswith("F0"))
    df.loc[outlier, "fare_inr_paise"] = (df.loc[outlier, "fare_inr_paise"] * 40).astype(int)
    assert high < 40, "fixture assumes the multiplier clears the clip ceiling"

    clean = compute_index(_grid(PERIODS, STRATA, items=6), CONFIG, weights=WEIGHTS)
    clipped = compute_index(df, CONFIG, weights=WEIGHTS)
    assert not clipped["index_ratio"].equals(clean["index_ratio"]), (
        "the outlier must reach the clip band, or this test proves nothing"
    )
    assert (clipped["index_ratio"].iloc[1:] < high).all(), "an unclipped 40x would show here"
    _assert_matches_reference(df, weights=WEIGHTS)


def test_matches_reference_with_repeated_quotes_per_item():
    """Several sources quoting one flight collapse to that item's *median*.

    Three quotes, one of them far out, so the median and the mean of the item
    differ — with two quotes, or with three symmetric ones, this would pass
    against a mean and prove nothing.
    """
    a = _grid(PERIODS, STRATA)
    b = _grid(PERIODS, STRATA, drift=1.03)
    c = _grid(PERIODS, STRATA, drift=1.03)
    c["fare_inr_paise"] = c["fare_inr_paise"] * 3
    df = pd.concat([a, b, c]).reset_index(drop=True)

    per_item = df.groupby(["period", "itinerary_key"])["fare_inr_paise"]
    assert (per_item.median() != per_item.mean()).any(), "fixture must separate the two"
    _assert_matches_reference(df, weights=WEIGHTS)


def test_matches_reference_when_clipping_takes_a_stratum_below_the_floor():
    """The matched floor is counted before the clip band, not after.

    A stratum with four matched items, three of them clipped away as parse
    errors, reports on the one survivor: it *had* enough matched items. Counting
    after the clip would silently impute it instead.
    """
    df = _grid(PERIODS, STRATA, items=4)
    _low, high = CONFIG.relative_clip
    wrecked = (
        (df["period"] == PERIODS[1])
        & (df["horizon_days"] == 21)
        & df["itinerary_key"].str.endswith(("F0", "F1", "F2"))
    )
    df.loc[wrecked, "fare_inr_paise"] = (df.loc[wrecked, "fare_inr_paise"] * 40).astype(int)
    assert high < 40 and CONFIG.min_matched_quotes > 1

    out = compute_index(df, CONFIG, weights=WEIGHTS)
    assert out["coverage_ratio"].iloc[1] == 1.0, (
        "the stratum had 4 matched items and must still report on the survivor"
    )
    _assert_matches_reference(df, weights=WEIGHTS)


def test_a_stratum_with_no_matched_items_is_imputed_not_dropped():
    df = _grid(PERIODS, STRATA)
    hole = (df["period"] == PERIODS[2]) & (df["horizon_days"] == 14)
    out = compute_index(df[~hole].reset_index(drop=True), CONFIG, weights=WEIGHTS)
    # DEL-BOM@14d cannot report for the two pairs touching the hole, but its
    # route sibling can, so it is imputed rather than left missing.
    holed = out.loc[out["period"] == PERIODS[2]]
    assert holed["coverage_ratio"].iloc[0] < 1.0
    assert holed["imputed_weight_share"].iloc[0] > 0.0
    assert holed["index_ratio"].notna().all()


def test_quote_counts_are_per_period_row_counts():
    df = _grid(PERIODS, STRATA)
    out = compute_index(df, CONFIG)
    assert list(out["n_quotes"]) == [int((df["period"] == p).sum()) for p in PERIODS]


def test_periods_with_no_overlap_at_all_yield_a_nan_ratio():
    """Nothing matched anywhere: the engine reports NaN, it does not invent 1.0."""
    df = _grid(PERIODS[:2], STRATA)
    second = df["period"] == PERIODS[1]
    df.loc[second, "itinerary_key"] = df.loc[second, "itinerary_key"] + "-x"
    out = compute_index(df, CONFIG)
    assert pd.isna(out["index_ratio"].iloc[1])
    assert out["value"].iloc[1] == pytest.approx(CONFIG.base_value)
    assert out["coverage_ratio"].iloc[1] == 0.0
