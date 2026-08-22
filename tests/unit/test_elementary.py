"""Jevons properties — plan §5.5 rejects Carli and Dutot for specific reasons.
These tests assert those reasons hold, not just that the code runs."""

import numpy as np
import pandas as pd
import pytest

from aerodex.index.elementary import jevons, jevons_from_panel, price_relatives


def test_jevons_is_geometric_mean():
    # (1 * 2 * 0.5) ** (1/3) == 1.0 exactly
    assert jevons(pd.Series([1.0, 2.0, 0.5])) == pytest.approx(1.0)


def test_jevons_no_change_is_one():
    assert jevons(pd.Series([1.0] * 10)) == pytest.approx(1.0)


def test_jevons_is_time_reversible():
    """Jevons(p1/p0) * Jevons(p0/p1) == 1. Carli fails this; it is the bias."""
    rel = pd.Series([0.8, 1.3, 2.0, 0.55])
    assert jevons(rel) * jevons(1 / rel) == pytest.approx(1.0)


def test_carli_would_be_upward_biased():
    """The documented reason Carli is rejected (plan §5.5)."""
    rel = pd.Series([0.5, 2.0])
    carli = rel.mean()                 # 1.25
    assert jevons(rel) == pytest.approx(1.0)
    assert carli > jevons(rel)


def test_jevons_invariant_to_unit_scaling():
    """Dutot is not unit-invariant; Jevons is. Scaling both periods by any
    constant must not move the index."""
    base = pd.DataFrame({"itinerary_key": list("abcd"), "fare_inr_paise": [100, 200, 300, 400]})
    cur = pd.DataFrame({"itinerary_key": list("abcd"), "fare_inr_paise": [110, 210, 330, 380]})
    a, _ = jevons_from_panel(cur, base)
    scaled = cur.assign(fare_inr_paise=cur.fare_inr_paise * 7)
    scaled_base = base.assign(fare_inr_paise=base.fare_inr_paise * 7)
    b, _ = jevons_from_panel(scaled, scaled_base)
    assert a == pytest.approx(b)


def test_no_underflow_on_large_panel():
    """Direct product form underflows; log-space must not."""
    rel = pd.Series([0.5] * 2000)
    assert jevons(rel) == pytest.approx(0.5)


def test_zero_and_negative_fares_dropped_not_infinite():
    """A zero fare is a parse failure, not a free flight."""
    assert jevons(pd.Series([1.0, 0.0, 2.0, -1.0])) == pytest.approx(np.sqrt(2.0))


def test_all_invalid_returns_nan_not_exception():
    assert np.isnan(jevons(pd.Series([0.0, -1.0])))
    assert np.isnan(jevons(pd.Series([], dtype=float)))


def test_clip_drops_implausible_relatives():
    rel = pd.Series([1.0, 1.0, 99.0])
    assert jevons(rel, clip=(0.2, 5.0)) == pytest.approx(1.0)


def test_price_relatives_are_matched_model_only():
    """Unmatched items must not contribute — that is what 'matched' means."""
    base = pd.DataFrame({"itinerary_key": ["a", "b"], "fare_inr_paise": [100, 100]})
    cur = pd.DataFrame({"itinerary_key": ["b", "c"], "fare_inr_paise": [150, 999]})
    rel = price_relatives(cur, base)
    assert list(rel.index) == ["b"]
    assert rel["b"] == pytest.approx(1.5)


def test_thin_stratum_returns_nan_for_imputation():
    """Below min_matched the stratum is imputed, not published on 2 matches."""
    base = pd.DataFrame({"itinerary_key": ["a", "b"], "fare_inr_paise": [100, 100]})
    cur = pd.DataFrame({"itinerary_key": ["a", "b"], "fare_inr_paise": [120, 120]})
    val, n = jevons_from_panel(cur, base, min_matched=3)
    assert n == 2 and np.isnan(val)


def test_duplicate_quotes_collapse_by_median():
    """Two sources quoting the same itinerary must not double-weight it."""
    base = pd.DataFrame({"itinerary_key": ["a"] * 3, "fare_inr_paise": [100, 100, 100]})
    cur = pd.DataFrame({"itinerary_key": ["a"] * 3, "fare_inr_paise": [140, 150, 160]})
    rel = price_relatives(cur, base)
    assert len(rel) == 1 and rel["a"] == pytest.approx(1.5)
