"""Generate the demo dataset — demo/ (see demo/README.md).

SYNTHETIC. Every fare here comes from the fixture adapter, not from a real
source. Nothing in demo/ is a measurement and none of it may be published as
one; the publisher refuses it unless ``--allow-synthetic`` is passed, which is
the whole point of that flag existing.

What this exists for: a demo needs a panel with more than four periods and
more than three routes, so the dashboard has a real series to draw and the
coverage/imputation machinery has something to act on. Regenerating it must
not require Docker, a database or a network.

Deterministic: fixed dates, hash-seeded adapter, no clock and no network.
Re-running reproduces every file byte-for-byte.

    uv run python scripts/make_demo_data.py

Shape: the full 60-route panel x 7 horizons x 30 daily periods, morning slot,
collected through the real path (adapter -> normalise -> validate) so the rows
are schema-correct by construction rather than by hand.

On top of the adapter's own fare movement this applies a *documented* demand
factor keyed on the departure date, because the raw fixture fare is hash noise
and a flat index makes for a demo that shows nothing:

  * festival     — departures inside a window from config/calendar.yaml carry
                   a surge, ramped in over the window's own lead_days. The
                   panel is constant-horizon, so a festival arrives in the
                   1-day and 60-day strata on different collection dates. That
                   staggering is the effect worth showing.
  * weekend      — Friday and Sunday departures cost more than midweek.
  * trend        — a mild secular drift across the month.

The same shaping convention as tests/golden/panel.csv, which builds in a
"deliberate upward trend" for the same reason. It is disclosed in
demo/README.md and demo/MANIFEST.json, and it is the only reason a number in
demo/ moves in a way a fixture fare would not.

Two panels are written:

  demo/panel.csv.gz         a small coverage hole; imputed weight stays under
                            the M5 ceiling, so the run produces artifacts.
  demo/breach/panel.csv.gz  a large hole that breaches M5, so the refusal path
                            has something to refuse. This one produces no
                            artifacts, by design.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from aerodex.acquire.adapters.fixture import FixtureAdapter  # noqa: E402
from aerodex.acquire.base import SearchRequest  # noqa: E402
from aerodex.acquire.collect import IST, build_requests  # noqa: E402
from aerodex.config import (  # noqa: E402
    CalendarConfig,
    MethodologyConfig,
    PanelConfig,
    canonical_json,
)
from aerodex.index.engine import compute_index, output_hash, panel_hash  # noqa: E402
from aerodex.normalise import normalise_quotes  # noqa: E402
from aerodex.publish.artifacts import (  # noqa: E402
    PublicationRefused,
    build_artifacts,
    write_artifacts,
)
from aerodex.validate import validate_batch  # noqa: E402

OUT_DIR = ROOT / "demo"

#: The base period declared in config/methodology.yaml. Starting the demo
#: series anywhere else would put the index's own base month outside the data.
START = date(2026, 9, 1)
DAYS = 30
SLOT = "morning"

#: Columns the engine needs, plus the hedonic characteristics the dashboard
#: shows. Same column set as tests/golden/panel.csv.
PANEL_COLUMNS = [
    "period", "origin", "destination", "horizon_days", "itinerary_key",
    "fare_inr_paise", "carrier", "stops", "duration_minutes",
    "departure_time_bucket",
]

# --- the coverage holes -----------------------------------------------------
# Cut on (route, horizon, period) rather than whole routes on purpose. A route
# that vanishes entirely leaves its horizon group with nothing to impute from,
# so the strata are dropped and renormalised away — coverage falls but the
# imputed share stays zero, which demonstrates nothing about M5. Cutting only
# some of a route's horizons leaves siblings reporting, so the gap is actually
# imputed and the published share moves.

#: Small hole: two horizons of one mid-weight route, for four days.
HOLE = {
    "route": ("BLR", "CCU"),
    "horizons": (1, 3),
    "periods": tuple(str(START + timedelta(days=d)) for d in (11, 12, 13, 14)),
}

#: Large hole: five horizons across the three heaviest routes, for three days.
BREACH_HOLE = {
    "routes": (("DEL", "BOM"), ("BOM", "DEL"), ("DEL", "BLR")),
    "horizons": (1, 3, 7, 14, 21),
    "periods": tuple(str(START + timedelta(days=d)) for d in (20, 21, 22)),
}


class DemandShapedFixture(FixtureAdapter):
    """Fixture fares, scaled by a disclosed demand factor on the departure date.

    Still synthetic, still ``source='fixture'``, still refused by the publisher.
    The scaling only makes the movement legible; it does not make it real.
    """

    def __init__(self, calendar: CalendarConfig, *, first_departure: date) -> None:
        self._calendar = calendar
        self._first_departure = first_departure
        self._windows = [
            (
                date.fromisoformat(str(f["start"])),
                date.fromisoformat(str(f["end"])),
                int(f.get("lead_days", 0)),
                str(f["name"]),
            )
            for f in calendar.raw.get("festivals", [])
        ]

    def festival_factor(self, d: date) -> tuple[float, str | None]:
        """Surge multiplier for a departure date, and the festival responsible.

        Inside the window it is the full surge. Before it, the booking run-up
        ramps linearly across the festival's own ``lead_days`` — fares move
        ahead of the event, which is the behaviour the panel is meant to catch.
        """
        best, name = 1.0, None
        for start, end, lead, fname in self._windows:
            if start <= d <= end:
                factor = 1.35
            elif lead and start - timedelta(days=lead) <= d < start:
                progress = 1.0 - (start - d).days / lead
                factor = 1.0 + 0.25 * progress
            else:
                continue
            if factor > best:
                best, name = factor, fname
        return best, name

    def demand_factor(self, d: date) -> float:
        festival, _ = self.festival_factor(d)
        weekday = d.weekday()                      # Mon=0 .. Sun=6
        weekend = {4: 1.08, 5: 1.04, 6: 1.08}.get(weekday, 1.0)
        trend = 1.0 + 0.0002 * (d - self._first_departure).days
        return festival * weekend * trend

    def search(self, request: SearchRequest, **kwargs) -> Any:
        body = super().search(request, **kwargs)
        factor = self.demand_factor(request.departure_date)
        body = dict(body)
        body["itineraries"] = [
            {**it, "total_fare_paise": int(round(it["total_fare_paise"] * factor))}
            for it in body["itineraries"]
        ]
        return body


def collect_panel(
    adapter: DemandShapedFixture,
    panel_cfg: PanelConfig,
    meth: MethodologyConfig,
    *,
    start: date,
    days: int,
) -> tuple[pd.DataFrame, dict]:
    """Run the real collection path for each day and return a long panel."""
    rows: list[dict] = []
    stats = {"raw": 0, "valid": 0, "quarantined": 0}

    for offset in range(days):
        day = start + timedelta(days=offset)
        # The actual collection time, as plan §5.1 requires. Derived from the
        # slot, not from the clock, so a rerun reproduces the same timestamps.
        slot_cfg = next(s for s in panel_cfg.slots if s["id"] == SLOT)
        hh, mm = (int(x) for x in str(slot_cfg["local_time"]).split(":"))
        collected_at = datetime.combine(day, time(hh, mm), tzinfo=IST)

        quotes = []
        for req in build_requests(panel_cfg, SLOT, today=day):
            quotes.extend(adapter.emit(req, collected_at))

        clean = normalise_quotes(quotes)
        valid, held = validate_batch(clean, meth.raw)
        stats["raw"] += len(quotes)
        stats["valid"] += len(valid)
        stats["quarantined"] += len(held)

        for c in valid:
            rows.append(
                {
                    "period": str(day),
                    "origin": c.origin,
                    "destination": c.destination,
                    "horizon_days": c.horizon_days,
                    "itinerary_key": c.itinerary_key,
                    "fare_inr_paise": c.fare_inr_paise,
                    "carrier": c.carrier,
                    "stops": c.stops,
                    "duration_minutes": c.duration_minutes,
                    "departure_time_bucket": c.departure_time_bucket,
                }
            )

    df = pd.DataFrame(rows, columns=PANEL_COLUMNS)
    df = df.sort_values(
        ["period", "origin", "destination", "horizon_days", "itinerary_key"]
    ).reset_index(drop=True)
    return df, stats


def punch_hole(df: pd.DataFrame, route, horizons, periods) -> pd.DataFrame:
    """Remove (route, horizon, period) cells — a source that stopped reporting."""
    o, d = route
    mask = (
        (df["origin"] == o)
        & (df["destination"] == d)
        & (df["horizon_days"].isin(horizons))
        & (df["period"].isin(periods))
    )
    return df[~mask].reset_index(drop=True)


def write_panel(df: pd.DataFrame, path: Path) -> None:
    """Write a panel as gzipped CSV.

    Gzipped because the uncompressed pair is ~12 MiB and this is checked in.
    ``pandas.read_csv`` decompresses by extension, so
    ``aerodex index --panel-csv demo/panel.csv.gz`` needs no special handling.

    ``mtime=0`` because gzip stamps the current time into the header by
    default, which would give this file a new sha256 on every regeneration and
    make the manifest's digests worthless as a change signal.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(
        path,
        index=False,
        lineterminator="\n",
        compression={"method": "gzip", "mtime": 0},
    )


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out", default=str(OUT_DIR), help="output directory")
    p.add_argument("--start", default=str(START), help="first collection date")
    p.add_argument("--days", type=int, default=DAYS, help="number of daily periods")
    args = p.parse_args(argv)

    out = Path(args.out)
    start = date.fromisoformat(args.start)
    meth = MethodologyConfig.load()
    panel_cfg = PanelConfig.load()
    cal = CalendarConfig.load()

    # Departures reach one horizon past the last collection date.
    first_departure = start + timedelta(days=min(panel_cfg.horizons))
    adapter = DemandShapedFixture(cal, first_departure=first_departure)

    print(f"collecting {args.days} daily periods from {start} "
          f"({len(panel_cfg.routes)} routes x {len(panel_cfg.horizons)} horizons, slot={SLOT})")
    full, stats = collect_panel(adapter, panel_cfg, meth, start=start, days=args.days)
    print(f"  raw={stats['raw']} valid={stats['valid']} quarantined={stats['quarantined']}")

    # --- the publishable panel ---------------------------------------------
    main_panel = punch_hole(full, HOLE["route"], HOLE["horizons"], HOLE["periods"])
    write_panel(main_panel, out / "panel.csv.gz")

    weights = {k: float(v) for k, v in panel_cfg.weights().items()}
    index_df = compute_index(main_panel, meth, weights=weights)
    index_df.to_csv(out / "index.csv", index=False, lineterminator="\n")
    index_df.to_json(out / "index.json", orient="records", indent=2)

    breached = bool(index_df["imputation_ceiling_breached"].any())
    print(f"\n  panel.csv.gz : {len(main_panel)} rows, {main_panel['period'].nunique()} periods")
    print(f"  index     : {index_df['value'].iloc[0]:.4f} -> {index_df['value'].iloc[-1]:.4f}"
          f"  (min {index_df['value'].min():.4f}, max {index_df['value'].max():.4f})")
    print(f"  max imputed share : {index_df['imputed_weight_share'].max():.5f}"
          f"  (M5 ceiling {meth.max_imputed_share})")
    print(f"  min coverage      : {index_df['coverage_ratio'].min():.5f}")
    print(f"  M5 breached       : {breached}")

    # --- M6 fixtures --------------------------------------------------------
    # Frozen hashes in the shape `aerodex verify` expects, so the demo can
    # drive the reproducibility check over 30 periods rather than the golden
    # panel's four:
    #     aerodex verify --panel-csv demo/panel.csv.gz \
    #                    --hashes    demo/expected_hashes.json
    unweighted_hash = output_hash(compute_index(main_panel, meth))
    weighted_hash = output_hash(index_df)
    (out / "expected_hashes.json").write_text(
        json.dumps(
            {
                "output_hash": unweighted_hash,
                "weighted_output_hash": weighted_hash,
                "panel_hash": panel_hash(main_panel),
                "config_hash": meth.hash,
                "weights_vintage": meth.weights_vintage,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )

    # --- artifacts ----------------------------------------------------------
    art_dir = out / "artifacts"
    if art_dir.exists():
        shutil.rmtree(art_dir)
    artifacts = build_artifacts(
        index_df, meth, sources={"fixture"}, allow_synthetic=True
    )
    written = write_artifacts(artifacts, art_dir)
    print(f"\n  artifacts : {', '.join(sorted(p.name for p in written))}")

    # The refusal is the guarantee. Assert it still fires on this exact panel,
    # so a demo can never accidentally ship fixture data as a measurement.
    try:
        build_artifacts(index_df, meth, sources={"fixture"})
        raise SystemExit("FATAL: publisher accepted a fixture-only panel")
    except PublicationRefused as exc:
        print(f"  publisher refuses without --allow-synthetic: {str(exc)[:70]}...")

    # --- the M5 breach panel ------------------------------------------------
    breach = full
    for route in BREACH_HOLE["routes"]:
        breach = punch_hole(
            breach, route, BREACH_HOLE["horizons"], BREACH_HOLE["periods"]
        )
    write_panel(breach, out / "breach" / "panel.csv.gz")
    breach_idx = compute_index(breach, meth, weights=weights)
    breach_idx.to_csv(out / "breach" / "index.csv", index=False, lineterminator="\n")
    breach_periods = [
        str(r) for r in breach_idx[breach_idx["imputation_ceiling_breached"]]["period"]
    ]
    try:
        build_artifacts(breach_idx, meth, sources={"fixture"}, allow_synthetic=True)
        refusal = None
    except PublicationRefused as exc:
        refusal = str(exc)
    print(f"\n  breach/panel.csv.gz : {len(breach)} rows, "
          f"max imputed share {breach_idx['imputed_weight_share'].max():.5f}")
    print(f"  breached periods : {breach_periods}")
    print(f"  publisher refuses: {refusal is not None}")
    if refusal is None:
        raise SystemExit("FATAL: the breach panel did not breach — retune BREACH_HOLE")

    # --- festival calendar, for whoever explains the shape ------------------
    festivals = []
    for offset in range(args.days + max(panel_cfg.horizons) + 1):
        d = first_departure + timedelta(days=offset)
        factor, name = adapter.festival_factor(d)
        if name:
            festivals.append(
                {"departure_date": str(d), "festival": name, "factor": round(factor, 4)}
            )

    # --- manifest -----------------------------------------------------------
    manifest = {
        "generated_by": "scripts/make_demo_data.py",
        "synthetic": True,
        "warning": (
            "Fixture-derived. Not a measurement, not publishable as one. "
            "The publisher refuses this data unless allow_synthetic=True."
        ),
        "source": "fixture",
        "start": str(start),
        "days": args.days,
        "slot": SLOT,
        "routes": len(panel_cfg.routes),
        "horizons": panel_cfg.horizons,
        "strata": len(panel_cfg.strata()),
        "quotes": {"collected": stats["raw"], "valid": stats["valid"],
                   "quarantined": stats["quarantined"]},
        "demand_shaping": {
            "festival": "config/calendar.yaml windows, 1.35x inside, ramped over lead_days",
            "weekend": "Fri/Sun 1.08x, Sat 1.04x",
            "trend": "1.0002x per day of departure date",
        },
        "panel": {
            "rows": len(main_panel),
            "periods": int(main_panel["period"].nunique()),
            "panel_hash": panel_hash(main_panel),
            "coverage_hole": {
                "route": "-".join(HOLE["route"]),
                "horizons": list(HOLE["horizons"]),
                "periods": list(HOLE["periods"]),
            },
        },
        "index": {
            "first": {"period": str(index_df["period"].iloc[0]),
                      "value": round(float(index_df["value"].iloc[0]), 6)},
            "last": {"period": str(index_df["period"].iloc[-1]),
                     "value": round(float(index_df["value"].iloc[-1]), 6)},
            "min_value": round(float(index_df["value"].min()), 6),
            "max_value": round(float(index_df["value"].max()), 6),
            "max_imputed_weight_share": round(
                float(index_df["imputed_weight_share"].max()), 6),
            "min_coverage_ratio": round(float(index_df["coverage_ratio"].min()), 6),
            "imputation_ceiling_breached": breached,
            "output_hash": output_hash(index_df),
        },
        "breach": {
            "rows": len(breach),
            "breached_periods": breach_periods,
            "max_imputed_weight_share": round(
                float(breach_idx["imputed_weight_share"].max()), 6),
            "output_hash": output_hash(breach_idx),
            "refusal": refusal,
        },
        "festival_departures": festivals,
        "config_hash": meth.hash,
        "panel_config_hash": panel_cfg.hash,
        "calendar_config_hash": cal.hash,
        "weights_vintage": meth.weights_vintage,
    }

    # README.md is hand-written documentation, not generated data; hashing it
    # would make the manifest go stale on every prose edit.
    files = sorted(
        f
        for f in out.rglob("*")
        if f.is_file() and f.name not in {"MANIFEST.json", "README.md"}
    )
    manifest["files"] = {
        str(f.relative_to(out)): {"bytes": f.stat().st_size, "sha256": sha256_file(f)}
        for f in files
    }

    (out / "MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True, default=str) + "\n"
    )

    total = sum(v["bytes"] for v in manifest["files"].values())
    print(f"\nwrote {len(manifest['files']) + 1} files to {out.relative_to(ROOT)}/"
          f" ({total / 1_048_576:.1f} MiB)")
    print(f"manifest digest: {hashlib.sha256(canonical_json(manifest).encode()).hexdigest()[:16]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
