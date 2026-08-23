#!/usr/bin/env python3
"""Spike S4 — Parse DGCA weights into the 60-route panel.

Downloads the Vonter/india-aviation-traffic city-pair CSV (ODbL), maps city
names to IATA codes, sums bidirectional passengers for the most recent full
calendar year available, normalises the result and writes ``weight`` fields
into ``config/panel.yaml``.

Usage::

    uv run python scripts/parse_dgca_weights.py [--year 2025] [--dry-run]

Outputs
-------
* Mutates ``config/panel.yaml`` in-place (unless ``--dry-run``).
* Prints a coverage table so you can see which routes matched and which fell
  back to airport-level proxies or got zero traffic.

Attribution
-----------
Route traffic data sourced from DGCA via
https://github.com/Vonter/india-aviation-traffic (ODbL).
"""

from __future__ import annotations

import argparse
import io
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any

import yaml

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
PANEL_YAML = REPO_ROOT / "config" / "panel.yaml"

#: Bump whenever CITY_TO_IATA changes. The vintage must identify the weights,
#: not just the source year - a mapping correction moves published numbers, and
#: two different weight sets sharing one vintage string breaks the audit trail
#: that M6 rests on.
#:   r2 - ADAMPUR unfolded from IXC (was inflating Chandigarh by 2.1% of pax)
MAPPING_REVISION = "r2"

DGCA_CSV_URL = (
    "https://raw.githubusercontent.com/Vonter/india-aviation-traffic/"
    "main/aggregated/domestic/city.csv"
)

# ---------------------------------------------------------------------------
# City-name → IATA mapping
# The DGCA dataset uses DGCA city/airport names which differ from IATA codes.
# Multiple city names can map to the same IATA code when a metro is served by
# several airports (e.g. Delhi NCR: DELHI, GHAZIABAD, HINDON AIRPORT → DEL).
# We use the principal commercial airport for each city.
# ---------------------------------------------------------------------------
CITY_TO_IATA: dict[str, str] = {
    # Major metros
    "DELHI": "DEL",
    "MUMBAI": "BOM",
    "BANGALORE": "BLR",
    "BENGALURU": "BLR",
    "KOLKATA": "CCU",
    "CHENNAI": "MAA",
    "HYDERABAD": "HYD",
    # Tier-2 cities in panel
    "AHMEDABAD": "AMD",
    "PUNE": "PNQ",
    # Deliberate city-level roll-up, documented in methodology.yaml:
    # DGCA reports a single "GOA" city covering both Goa airports (Dabolim GOI
    # and Manohar/Mopa GOX). The panel samples GOX, so Goa city traffic is
    # attributed to GOX. GOX is Manohar (Mopa) - it is NOT Dabolim.
    "GOA": "GOX",
    "MOPA": "GOX",          # Manohar International, should DGCA split it out
    "COCHIN": "COK",
    "KOCHI": "COK",
    "JAIPUR": "JAI",
    "LUCKNOW": "LKO",
    "CHANDIGARH": "IXC",
    # NOT an alias of Chandigarh: Adampur (Jalandhar) is its own airport, ~90 km
    # away. Folding it into IXC inflated Chandigarh by 2.1% of 2025 pax. It is
    # mapped to its real code so it is classified, not silently dropped; AIP is
    # not in the panel, so it contributes nothing.
    "ADAMPUR": "AIP",
    "PATNA": "PAT",
    "GUWAHATI": "GAU",
    "BHUBANESWAR": "BBI",
    "VARANASI": "VNS",
    "SRINAGAR": "SXR",
    "AMRITSAR": "ATQ",
    "INDORE": "IDR",
    "NAGPUR": "NAG",
    "THIRUVANANTHAPURAM": "TRV",
    "TRIVANDRUM": "TRV",
    "VISAKHAPATNAM": "VTZ",
    "VIZAG": "VTZ",
    # Extra aliases that appear in the dataset
    "NEW DELHI": "DEL",
    "GHAZIABAD": "DEL",     # Hindon serves NCR; rolled into DEL
    "HINDON AIRPORT": "DEL",
    "NAVI MUMBAI": "BOM",
    "BANGALORE CITY": "BLR",
    # Cities NOT in our panel (mapped to prevent accidents)
    "CALICUT": "CCJ",
    "KOZHIKODE": "CCJ",
    "MANGALORE": "IXE",
    "MANGALURU": "IXE",
    "COIMBATORE": "CJB",
    "MADURAI": "IXM",
    "RAIPUR": "RPR",
    "BHOPAL": "BHO",
    "RANCHI": "IXR",
}


def city_to_iata(name: str) -> str | None:
    """Return IATA code for a DGCA city name, or None if not mapped."""
    return CITY_TO_IATA.get(name.strip().upper())


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def fetch_csv(url: str) -> str:
    """Download the CSV and return its text content."""
    print(f"Fetching {url} ...")
    with urllib.request.urlopen(url, timeout=30) as resp:  # noqa: S310
        return resp.read().decode("utf-8")


def parse_csv(text: str) -> list[dict[str, Any]]:
    """Parse the city.csv into a list of row dicts."""
    import csv
    rows = []
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        rows.append({
            "year": int(row["Year"]),
            "month": int(row["Month"]),
            "city1": row["City1"].strip().upper(),
            "city2": row["City2"].strip().upper(),
            "pax_to_city2": float(row["PaxToCity2"] or 0),
            "pax_from_city2": float(row["PaxFromCity2"] or 0),
        })
    return rows


# ---------------------------------------------------------------------------
# Weight computation
# ---------------------------------------------------------------------------

def months_present(rows: list[dict[str, Any]], year: int) -> set[int]:
    """Calendar months with data for *year*."""
    return {r["month"] for r in rows if r["year"] == year}


def compute_route_traffic(
    rows: list[dict[str, Any]],
    year: int,
    *,
    allow_partial: bool = False,
) -> dict[tuple[str, str], float]:
    """Sum bidirectional passenger traffic per IATA O-D pair for *year*.

    Returns a dict keyed by canonical ``(orig, dest)`` tuple where
    ``orig < dest`` alphabetically (routes are symmetric in DGCA data).
    """
    traffic: dict[tuple[str, str], float] = {}

    year_rows = [r for r in rows if r["year"] == year]
    if not year_rows:
        raise ValueError(f"No data found for year {year} in the DGCA CSV.")

    # An annual weight vintage built from a partial year is silently wrong: it
    # is seasonally skewed, and the vintage string still reads as authoritative.
    missing_months = sorted(set(range(1, 13)) - months_present(rows, year))
    if missing_months and not allow_partial:
        raise ValueError(
            f"Year {year} is incomplete - missing month(s) {missing_months}. "
            "Annual weights from a partial year are seasonally skewed. Use a "
            "complete year, or pass --allow-partial and record the limitation "
            "in the weights vintage."
        )

    for row in year_rows:
        orig_iata = city_to_iata(row["city1"])
        dest_iata = city_to_iata(row["city2"])
        if orig_iata is None or dest_iata is None:
            continue  # city not in our mapping — skip
        if orig_iata == dest_iata:
            continue  # same airport after mapping (e.g. Delhi aliases)

        key: tuple[str, str] = tuple(sorted([orig_iata, dest_iata]))  # type: ignore[assignment]
        pax = row["pax_to_city2"] + row["pax_from_city2"]
        traffic[key] = traffic.get(key, 0.0) + pax

    return traffic


def build_weights(
    panel_routes: list[dict],
    traffic: dict[tuple[str, str], float],
) -> tuple[dict[str, float], list[str], list[str]]:
    """Map panel routes to traffic figures and normalise.

    Returns
    -------
    weights  : ``{ORIG-DEST: normalised_weight}``
    matched  : list of route strings that had DGCA data
    missing  : list of routes with no traffic data (get proxy min weight)
    """
    raw: dict[str, float] = {}
    matched: list[str] = []
    missing: list[str] = []

    for r in panel_routes:
        orig, dest = r["origin"], r["destination"]
        key: tuple[str, str] = tuple(sorted([orig, dest]))  # type: ignore[assignment]
        pax = traffic.get(key, 0.0)
        route = f"{orig}-{dest}"
        if pax > 0:
            raw[route] = pax
            matched.append(route)
        else:
            raw[route] = 0.0
            missing.append(route)

    # Assign minimum proxy weight so missing strata still participate.
    min_pax = min((v for v in raw.values() if v > 0), default=1.0)
    for route in missing:
        raw[route] = min_pax * 0.1   # 10% of the smallest observed route

    total = sum(raw.values())
    weights = {route: pax / total for route, pax in raw.items()}
    return weights, matched, missing


# ---------------------------------------------------------------------------
# YAML update (regex-based to preserve comments)
# ---------------------------------------------------------------------------

def update_panel_yaml(
    path: Path,
    weights: dict[str, float],
    vintage: str,
    dry_run: bool,
) -> None:
    """Write normalised weights back into panel.yaml preserving all comments."""
    text = path.read_text(encoding="utf-8")

    def replace_weight(m: re.Match) -> str:
        orig = m.group(1)
        dest = m.group(2)
        route = f"{orig}-{dest}"
        w = weights.get(route)
        if w is None:
            return m.group(0)  # leave unchanged if not in our map
        return f"{{origin: {orig}, destination: {dest}, weight: {w:.8f}}}"

    new_text, n_subs = re.subn(
        r"\{origin:\s*(\w+),\s*destination:\s*(\w+),\s*weight:\s*"
        r"(?:null|-?\d[\d.e+-]*)\}",
        replace_weight,
        text,
    )
    # This rewrite is regex-based so that comments survive, which means it only
    # matches the inline-mapping form. Reformat panel.yaml to block style and it
    # would match nothing, write nothing, and report success. Fail loudly instead.
    if n_subs != len(weights):
        raise RuntimeError(
            f"panel.yaml rewrite matched {n_subs} route entries but {len(weights)} "
            "weights were computed. The file's formatting no longer matches the "
            "expected inline form `{origin: XXX, destination: YYY, weight: ...}`; "
            "panel.yaml has NOT been modified."
        )

    # Update weights_vintage line
    new_text = re.sub(
        r'(weights_vintage:\s*")[^"]*(")',
        rf'\g<1>{vintage}\g<2>',
        new_text,
    )

    if dry_run:
        print("\n--- DRY RUN: panel.yaml routes section (first 35) ---")
        in_routes = False
        count = 0
        for line in new_text.splitlines():
            if line.strip().startswith("routes:"):
                in_routes = True
            if in_routes:
                print(line)
                count += 1
                if count > 35:
                    print("  ...")
                    break
        return

    path.write_text(new_text, encoding="utf-8")
    print(f"\nWrote {path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--year", type=int, default=2025,
        help="Calendar year to use for traffic weights (default: 2025)",
    )
    parser.add_argument(
        "--url", default=DGCA_CSV_URL,
        help="Override the DGCA CSV URL (e.g. a local file:// path for offline testing)",
    )
    parser.add_argument(
        "--allow-partial", action="store_true",
        help="Accept an incomplete calendar year (seasonally skewed; not for publication)",
    )
    parser.add_argument(
        "--allow-proxy", action="store_true",
        help="Write weights even when some routes fall back to proxy traffic",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be written without touching panel.yaml",
    )
    args = parser.parse_args(argv)

    # 1. Fetch and parse
    if args.url.startswith("file://"):
        csv_text = Path(args.url[7:]).read_text(encoding="utf-8")
        print(f"Reading local file {args.url[7:]} ...")
    else:
        csv_text = fetch_csv(args.url)
    rows = parse_csv(csv_text)

    # 2. Find the most recent year with data if requested year is absent
    available_years = sorted({r["year"] for r in rows}, reverse=True)
    year = args.year
    if year not in available_years:
        year = available_years[0]
        print(f"WARNING: year {args.year} not found in dataset; using {year} instead.")

    traffic = compute_route_traffic(rows, year, allow_partial=args.allow_partial)
    print(f"Aggregated {len(traffic)} unique IATA O-D pairs for {year}.")

    # 3. Load panel
    panel_raw = yaml.safe_load(PANEL_YAML.read_text(encoding="utf-8"))
    panel_routes = panel_raw["routes"]

    # 4. Build weights
    weights, matched, missing = build_weights(panel_routes, traffic)

    # 5. Coverage report
    print(f"\n{'Route':<14}  {'Pax (annual)':<16}  {'Weight':>10}  Status")
    print("-" * 60)
    for r in panel_routes:
        orig, dest = r["origin"], r["destination"]
        route = f"{orig}-{dest}"
        key: tuple[str, str] = tuple(sorted([orig, dest]))  # type: ignore[assignment]
        pax = traffic.get(key, 0.0)
        status = "matched" if route in matched else "PROXY (min traffic)"
        print(f"{route:<14}  {pax:>16,.0f}  {weights[route]:>10.6f}  {status}")

    n_missing = len(missing)
    coverage_pct = 100 * len(matched) / len(panel_routes)
    print(f"\nCoverage: {len(matched)}/{len(panel_routes)} routes matched directly "
          f"({coverage_pct:.1f}%).")
    if n_missing:
        print(f"Proxy routes: {', '.join(missing)}")
        print("\nAction required: add entries to CITY_TO_IATA in this script, or")
        print("document the proxy weight in the methodology.")

    vintage = f"dgca-{year}-city-pairs-{MAPPING_REVISION}"
    if sorted(set(range(1, 13)) - months_present(rows, year)):
        vintage += "-partial"
    print(f"\nWeight vintage : {vintage}")
    print(f"Sum of weights : {sum(weights.values()):.10f}  (should be 1.0)")

    # 6. Write - but never leave a partially-sourced vintage behind. A run that
    #    exits non-zero must not have mutated the config it reports as unusable.
    if n_missing and not args.allow_proxy:
        print(
            f"\nREFUSING to write: {n_missing} route(s) have no DGCA traffic and "
            "would receive proxy weights. Add the missing cities to CITY_TO_IATA, "
            "or pass --allow-proxy to accept documented proxies.",
            file=sys.stderr,
        )
        return 1

    update_panel_yaml(PANEL_YAML, weights, vintage, dry_run=args.dry_run)

    if not args.dry_run:
        print("\nNext steps:")
        print("  1. Update weights_vintage in config/methodology.yaml to match.")
        print(f"     Set: weights_vintage: \"{vintage}\"")
        print("  2. Re-freeze golden tests (config hash will change):")
        print("     uv run pytest tests/golden/ -q  # confirm they fail")
        print("     uv run python -m aerodex.cli verify  # recompute expected_hashes.json")
        print("  3. Commit config/panel.yaml, config/methodology.yaml, tests/golden/.")
        print(f"  4. Note vintage '{vintage}' and coverage {coverage_pct:.1f}% in commit message.")

    return 0 if n_missing == 0 else 1  # non-zero exit if proxy routes remain


if __name__ == "__main__":
    sys.exit(main())
