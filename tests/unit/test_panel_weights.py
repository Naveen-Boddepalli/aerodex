"""Validation of the shipped config/panel.yaml weights.

The S4 unit tests exercise the parser against synthetic rows. Nothing checked
the artefact the parser actually produces — so a bad regenerate, a partial
write, or a hand-edit would ship silently. These tests read the real file.
"""

from __future__ import annotations

import pytest

from aerodex.config import MethodologyConfig, PanelConfig

PANEL = PanelConfig.load()
METH = MethodologyConfig.load()
WEIGHTS = PANEL.weights()


def test_every_route_has_a_weight():
    missing = sorted(k for k, v in WEIGHTS.items() if v is None)
    assert missing == [], f"routes without a weight: {missing}"


def test_weights_sum_to_one():
    assert sum(float(v) for v in WEIGHTS.values()) == pytest.approx(1.0, abs=1e-6)


def test_weights_are_positive():
    """A zero or negative weight silently removes a route from the index."""
    bad = {k: v for k, v in WEIGHTS.items() if float(v) <= 0}
    assert bad == {}


def test_no_single_route_dominates():
    """A weight above ~15% means the mapping folded several cities together —
    the failure mode that put Adampur's traffic into Chandigarh."""
    worst = max(WEIGHTS.items(), key=lambda kv: float(kv[1]))
    assert float(worst[1]) < 0.15, f"{worst[0]} carries {float(worst[1]):.1%} of index weight"


def test_trunk_routes_outrank_thin_routes():
    """Sanity-check the ordering against known Indian traffic reality."""
    assert float(WEIGHTS["DEL-BOM"]) > float(WEIGHTS["DEL-JAI"])
    assert float(WEIGHTS["DEL-BLR"]) > float(WEIGHTS["BOM-TRV"])
    assert float(WEIGHTS["DEL-BOM"]) == max(float(v) for v in WEIGHTS.values())


def test_vintage_is_declared_and_not_a_placeholder():
    vintage = PANEL.raw["weights_vintage"]
    assert vintage and "placeholder" not in vintage.lower()


def test_panel_and_methodology_vintages_agree():
    """Both files stamp published output. If they diverge, the vintage recorded
    on an index_point no longer identifies the weights that produced it."""
    assert PANEL.raw["weights_vintage"] == METH.weights_vintage


def test_both_directions_of_a_pair_carry_equal_weight():
    """Documents the deliberate choice: directional strata are weighted by their
    city pair's total traffic. If this ever fails, the weighting model changed
    and the methodology note needs updating with it."""
    for a, b in [("DEL", "BOM"), ("BLR", "DEL"), ("BOM", "MAA")]:
        assert float(WEIGHTS[f"{a}-{b}"]) == pytest.approx(float(WEIGHTS[f"{b}-{a}"]))
