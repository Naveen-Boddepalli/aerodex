"""Generate the frozen golden panel — tests/golden/panel.csv.

Deterministic: fixed seed, no clock, no network. Re-running this script must
reproduce the file byte-for-byte. It is checked in so that CI does not depend
on regenerating it; regenerate only when the panel *schema* changes, and
expect the golden hash to change with it (that is the point).
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tests" / "golden" / "panel.csv"

ROUTES = [("DEL", "BOM"), ("DEL", "BLR"), ("BOM", "BLR")]
HORIZONS = [7, 14, 30]
PERIODS = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]
CARRIERS = ["6E", "AI", "UK"]


def build() -> pd.DataFrame:
    rng = np.random.default_rng(20260822)
    rows = []
    for r_i, (o, d) in enumerate(ROUTES):
        for h in HORIZONS:
            base_fare = 450000 + r_i * 120000 + (30 - h) * 9000   # paise
            for it in range(6):
                carrier = CARRIERS[it % len(CARRIERS)]
                stops = 0 if it < 4 else 1
                key = f"{o}{d}-{carrier}-{h}-{it}"
                fare = base_fare * (1.0 + 0.06 * it)
                for p_i, period in enumerate(PERIODS):
                    drift = 1.0 + 0.011 * p_i            # deliberate upward trend
                    noise = float(rng.normal(1.0, 0.015))
                    rows.append(
                        {
                            "period": period,
                            "origin": o,
                            "destination": d,
                            "horizon_days": h,
                            "itinerary_key": key,
                            "fare_inr_paise": int(round(fare * drift * noise)),
                            "carrier": carrier,
                            "stops": stops,
                            "duration_minutes": 110 + 20 * stops + 5 * it,
                            "departure_time_bucket": ["morning", "afternoon", "evening"][it % 3],
                        }
                    )
    df = pd.DataFrame(rows)
    # A deliberate coverage hole: one stratum stops reporting in the last period.
    # It exercises imputation (M5) rather than pretending collection is perfect.
    hole = (df["period"] == PERIODS[-1]) & (df["origin"] == "BOM") & (df["horizon_days"] == 30)
    return df[~hole].sort_values(
        ["period", "origin", "destination", "horizon_days", "itinerary_key"]
    ).reset_index(drop=True)


if __name__ == "__main__":
    df = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False, lineterminator="\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(df)} rows, {df['period'].nunique()} periods")
    sys.exit(0)
