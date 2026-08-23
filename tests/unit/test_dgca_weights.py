"""Unit tests for scripts/parse_dgca_weights.py — Spike S4.

These tests are purely in-process: no network calls, no YAML mutation.
They cover the three functions with clear contracts:

* city_to_iata       — name → IATA mapping, edge cases
* compute_route_traffic — aggregation + bidirectionality + alias folding
* build_weights      — normalisation, proxy assignment, sum-to-one
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Ensure the scripts directory is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "scripts"))
from parse_dgca_weights import build_weights, city_to_iata, compute_route_traffic


# ---------------------------------------------------------------------------
# city_to_iata
# ---------------------------------------------------------------------------

class TestCityToIata:
    def test_known_major_cities(self):
        assert city_to_iata("DELHI") == "DEL"
        assert city_to_iata("MUMBAI") == "BOM"
        assert city_to_iata("BANGALORE") == "BLR"
        assert city_to_iata("BENGALURU") == "BLR"  # alias
        assert city_to_iata("KOLKATA") == "CCU"
        assert city_to_iata("CHENNAI") == "MAA"
        assert city_to_iata("HYDERABAD") == "HYD"

    def test_tier2_panel_cities(self):
        assert city_to_iata("CHANDIGARH") == "IXC"
        assert city_to_iata("ADAMPUR") == "IXC"   # military alias → same code
        assert city_to_iata("SRINAGAR") == "SXR"
        assert city_to_iata("AMRITSAR") == "ATQ"
        assert city_to_iata("VISAKHAPATNAM") == "VTZ"
        assert city_to_iata("VIZAG") == "VTZ"

    def test_delhi_aliases_all_map_to_del(self):
        for name in ("DELHI", "NEW DELHI", "GHAZIABAD", "HINDON AIRPORT"):
            assert city_to_iata(name) == "DEL", f"{name} should map to DEL"

    def test_goa_aliases(self):
        assert city_to_iata("GOA") == "GOX"
        assert city_to_iata("MOPA") == "GOX"

    def test_case_insensitive(self):
        assert city_to_iata("mumbai") == "BOM"
        assert city_to_iata("Delhi") == "DEL"

    def test_unknown_city_returns_none(self):
        assert city_to_iata("ATLANTIS") is None
        assert city_to_iata("") is None


# ---------------------------------------------------------------------------
# compute_route_traffic
# ---------------------------------------------------------------------------

def _make_rows(entries: list[tuple]) -> list[dict]:
    """Helper: (year, month, city1, city2, pax_to, pax_from) → row dicts."""
    return [
        {
            "year": y, "month": m,
            "city1": c1.upper(), "city2": c2.upper(),
            "pax_to_city2": to, "pax_from_city2": fr,
        }
        for y, m, c1, c2, to, fr in entries
    ]


class TestComputeRouteTraffic:
    def test_basic_aggregation(self):
        rows = _make_rows([
            (2025, 1, "DELHI", "MUMBAI", 100_000, 90_000),
            (2025, 2, "DELHI", "MUMBAI", 110_000, 95_000),
        ])
        traffic = compute_route_traffic(rows, 2025)
        key = ("BOM", "DEL")
        assert key in traffic
        assert traffic[key] == pytest.approx(395_000)

    def test_bidirectional_symmetry(self):
        """City1↔City2 reversed rows should fold into the same canonical key."""
        rows = _make_rows([
            (2025, 1, "BANGALORE", "MUMBAI", 80_000, 0),
            (2025, 1, "MUMBAI", "BANGALORE", 0, 70_000),
        ])
        traffic = compute_route_traffic(rows, 2025)
        key = ("BLR", "BOM")
        assert key in traffic
        assert traffic[key] == pytest.approx(150_000)

    def test_alias_folding(self):
        """ADAMPUR and CHANDIGARH both → IXC; should not create two keys."""
        rows = _make_rows([
            (2025, 3, "ADAMPUR", "DELHI", 5_000, 4_800),
            (2025, 3, "CHANDIGARH", "DELHI", 12_000, 11_500),
        ])
        traffic = compute_route_traffic(rows, 2025)
        # Both rows map to (DEL, IXC)
        assert len(traffic) == 1
        assert ("DEL", "IXC") in traffic
        assert traffic[("DEL", "IXC")] == pytest.approx(33_300)

    def test_same_iata_after_mapping_skipped(self):
        """DELHI and GHAZIABAD both map to DEL; the intra-DEL row should be skipped."""
        rows = _make_rows([
            (2025, 1, "DELHI", "GHAZIABAD", 99_999, 88_888),
            (2025, 1, "DELHI", "MUMBAI", 50_000, 45_000),
        ])
        traffic = compute_route_traffic(rows, 2025)
        assert ("DEL", "DEL") not in traffic
        assert ("BOM", "DEL") in traffic

    def test_unknown_city_skipped(self):
        rows = _make_rows([
            (2025, 1, "ATLANTIS", "DELHI", 1_000, 900),
            (2025, 1, "MUMBAI", "DELHI", 200_000, 180_000),
        ])
        traffic = compute_route_traffic(rows, 2025)
        assert len(traffic) == 1  # ATLANTIS row skipped

    def test_wrong_year_raises(self):
        rows = _make_rows([(2024, 1, "DELHI", "MUMBAI", 1, 1)])
        with pytest.raises(ValueError, match="No data found for year 2025"):
            compute_route_traffic(rows, 2025)

    def test_multiple_months_aggregated(self):
        rows = _make_rows([
            (2025, m, "DELHI", "BANGALORE", 50_000, 48_000) for m in range(1, 13)
        ])
        traffic = compute_route_traffic(rows, 2025)
        assert traffic[("BLR", "DEL")] == pytest.approx(12 * 98_000)


# ---------------------------------------------------------------------------
# build_weights
# ---------------------------------------------------------------------------

class TestBuildWeights:
    def _routes(self, pairs: list[tuple[str, str]]) -> list[dict]:
        return [{"origin": o, "destination": d} for o, d in pairs]

    def test_sum_to_one(self):
        routes = self._routes([("DEL", "BOM"), ("DEL", "BLR"), ("BOM", "BLR")])
        traffic = {("BOM", "DEL"): 1_000_000, ("BLR", "DEL"): 600_000, ("BLR", "BOM"): 400_000}
        weights, _, _ = build_weights(routes, traffic)
        assert sum(weights.values()) == pytest.approx(1.0, abs=1e-9)

    def test_relative_order_preserved(self):
        routes = self._routes([("DEL", "BOM"), ("DEL", "BLR")])
        traffic = {("BOM", "DEL"): 2_000_000, ("BLR", "DEL"): 500_000}
        weights, _, _ = build_weights(routes, traffic)
        assert weights["DEL-BOM"] > weights["DEL-BLR"]

    def test_missing_route_gets_proxy_not_zero(self):
        routes = self._routes([("DEL", "BOM"), ("DEL", "SXR")])
        traffic = {("BOM", "DEL"): 1_000_000}  # SXR not in traffic
        weights, matched, missing = build_weights(routes, traffic)
        assert "DEL-SXR" in missing
        assert weights["DEL-SXR"] > 0, "Proxy route must not have zero weight"
        assert sum(weights.values()) == pytest.approx(1.0, abs=1e-9)

    def test_all_missing_still_sums_to_one(self):
        """Edge case: no routes have traffic data at all."""
        routes = self._routes([("DEL", "SXR"), ("DEL", "GAU")])
        traffic: dict = {}
        weights, matched, missing = build_weights(routes, traffic)
        assert matched == []
        assert set(missing) == {"DEL-SXR", "DEL-GAU"}
        assert sum(weights.values()) == pytest.approx(1.0, abs=1e-9)

    def test_returns_matched_and_missing_lists(self):
        routes = self._routes([("DEL", "BOM"), ("DEL", "SXR")])
        traffic = {("BOM", "DEL"): 500_000}
        _, matched, missing = build_weights(routes, traffic)
        assert "DEL-BOM" in matched
        assert "DEL-SXR" in missing
