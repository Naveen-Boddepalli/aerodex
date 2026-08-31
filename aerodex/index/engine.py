"""The index engine — a pure function (plan §5.5).

    compute_index(panel: DataFrame, config: MethodologyConfig) -> DataFrame

No database access, no network, no clock reads inside it. Everything it needs
arrives as arguments. That single constraint is what makes M6 achievable: the
nightly reproducibility check re-reads an archived panel, re-runs this
function with the archived config, and diffs the output hash.

If you are about to add ``datetime.now()``, ``os.environ`` or a psycopg import
to this module: don't. Pass it in. The golden tests exist to catch it.
"""

from __future__ import annotations

import hashlib

import numpy as np
import pandas as pd

from aerodex.config import MethodologyConfig, canonical_json
from aerodex.index.aggregate import lowe
from aerodex.index.elementary import jevons, relatives_from_medians
from aerodex.index.impute import stratum_group_mean

#: Columns a panel must carry. Anything else is ignored by the engine.
REQUIRED_COLUMNS = frozenset(
    {"period", "origin", "destination", "horizon_days", "itinerary_key", "fare_inr_paise"}
)


def panel_hash(panel: pd.DataFrame) -> str:
    """Stable hash of the input panel — the M6 anchor for the data side.

    Sorted by the identity columns so that row order, which carries no meaning,
    cannot change the hash.
    """
    cols = sorted(REQUIRED_COLUMNS)
    df = panel[cols].sort_values(cols).reset_index(drop=True)
    payload = canonical_json(df.to_dict(orient="records"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _stratum_id(origin: str, destination: str, horizon: int) -> str:
    return f"{origin}-{destination}@{horizon}d"


def compute_index(
    panel: pd.DataFrame,
    config: MethodologyConfig,
    *,
    weights: dict[str, float] | None = None,
) -> pd.DataFrame:
    """Compute the chained index series from a long-format panel.

    Args:
        panel: one row per quote, with :data:`REQUIRED_COLUMNS`. ``period`` is
            an orderable period label (e.g. ``'2026-09-01'``); consecutive
            distinct values are compared pairwise.
        config: the methodology, carrying its own hash.
        weights: route weight per ``ORIG-DEST``. Uniform if None — acceptable
            only while the DGCA vintage is a placeholder, and recorded as such
            via ``config.weights_vintage``.

    Returns:
        One row per period with columns: period, value, index_ratio,
        imputed_weight_share, coverage_ratio, n_quotes, n_strata_reported,
        imputation_ceiling_breached, config_hash, panel_hash, weights_vintage.

        ``imputation_ceiling_breached`` is M5's alarm: True means the imputed
        share of index weight exceeded ``imputation.max_weight_share``. The
        engine still returns the number — suppressing it would hide the very
        coverage failure the metric exists to expose — but the publisher must
        not release a breached period silently.

    Raises:
        ValueError: if required columns are missing, or the panel has fewer
            than two periods (an index needs something to compare against).
    """
    missing = REQUIRED_COLUMNS - set(panel.columns)
    if missing:
        raise ValueError(f"panel missing required columns: {sorted(missing)}")

    periods = sorted(panel["period"].unique())
    if len(periods) < 2:
        raise ValueError(f"need >= 2 periods to compute an index, got {len(periods)}")

    p_hash = panel_hash(panel)
    clip = config.relative_clip
    min_matched = config.min_matched_quotes
    renorm = bool(config["aggregation"].get("renormalise_on_missing", True))
    max_imputed = config.max_imputed_share

    work = panel.copy()
    work["stratum"] = [
        _stratum_id(o, d, h)
        for o, d, h in zip(
            work["origin"], work["destination"], work["horizon_days"], strict=True
        )
    ]
    work["route"] = work["origin"] + "-" + work["destination"]

    all_strata = sorted(work["stratum"].unique())
    stratum_route = dict(zip(work["stratum"], work["route"], strict=True))

    if weights is None:
        stratum_weights = {s: 1.0 for s in all_strata}
    else:
        # Route weight is split evenly across that route's horizons.
        per_route_count: dict[str, int] = {}
        for s in all_strata:
            per_route_count[stratum_route[s]] = per_route_count.get(stratum_route[s], 0) + 1
        stratum_weights = {
            s: float(weights.get(stratum_route[s], 0.0)) / per_route_count[stratum_route[s]]
            for s in all_strata
        }

    # Median fare per (period, stratum, item), taken once for the whole panel.
    #
    # The inner loop below used to filter the panel to one stratum and call
    # groupby(...).median() on that slice, twice per stratum per period pair —
    # ~24k boolean masks and groupbys over the same rows, which is where all
    # the runtime went. Grouping by (period, stratum, key) up front partitions
    # the panel exactly the same way, so each group holds the same rows in the
    # same order and the medians are identical, not merely close.
    medians = work.groupby(["period", "stratum", "itinerary_key"], sort=True)[
        "fare_inr_paise"
    ].median()
    stratum_medians: dict[tuple[object, str], pd.Series] = {
        ps: grp.droplevel([0, 1]) for ps, grp in medians.groupby(level=[0, 1], sort=False)
    }

    rows: list[dict] = []
    level = config.base_value

    # Base period: the index is 100 by definition, with no comparison behind it.
    base_n = int((work["period"] == periods[0]).sum())
    rows.append(
        {
            "period": periods[0],
            "value": level,
            "index_ratio": 1.0,
            "imputed_weight_share": 0.0,
            "coverage_ratio": 1.0,
            "n_quotes": base_n,
            "n_strata_reported": int(work[work["period"] == periods[0]]["stratum"].nunique()),
            "imputation_ceiling_breached": False,
            "is_base": True,
        }
    )

    for prev, cur in zip(periods[:-1], periods[1:], strict=True):
        # Only the current period's rows are still needed directly, for the
        # quote count; the comparison itself reads the precomputed medians.
        cur_df = work[work["period"] == cur]

        ratios: dict[str, float] = {}
        matched_counts: dict[str, int] = {}
        for s in all_strata:
            cur_med = stratum_medians.get((cur, s))
            prev_med = stratum_medians.get((prev, s))
            if cur_med is None or prev_med is None:
                # A stratum absent from either period matches nothing, exactly
                # as the empty-slice path did before.
                r, n = float("nan"), 0
            else:
                rel = relatives_from_medians(cur_med, prev_med)
                n = int(len(rel))
                r = float("nan") if n < min_matched else jevons(rel, clip=clip)
            ratios[s] = r
            matched_counts[s] = n

        series = pd.Series(ratios, dtype="float64")
        reported = int(series.notna().sum())
        coverage = reported / len(all_strata) if all_strata else 0.0

        imp = stratum_group_mean(
            series,
            groups=stratum_route,
            weights=stratum_weights,
            max_weight_share=max_imputed,
        )
        ratio, _reported_share = lowe(
            imp.values, stratum_weights, renormalise_on_missing=renorm
        )

        if np.isfinite(ratio):
            level = level * ratio

        rows.append(
            {
                "period": cur,
                "value": float(level),
                "index_ratio": float(ratio) if np.isfinite(ratio) else float("nan"),
                "imputed_weight_share": float(imp.imputed_weight_share),
                "coverage_ratio": float(coverage),
                "n_quotes": int(len(cur_df)),
                "n_strata_reported": reported,
                "imputation_ceiling_breached": bool(imp.exceeded_ceiling),
                "is_base": False,
            }
        )

    out = pd.DataFrame(rows)
    out["config_hash"] = config.hash
    out["panel_hash"] = p_hash
    out["weights_vintage"] = config.weights_vintage
    return out


def output_hash(index_df: pd.DataFrame) -> str:
    """Hash of a computed index — what the nightly M6 check actually diffs.

    Values are rounded to 6 decimals before hashing: float noise below the
    published precision is not a reproducibility failure, but anything visible
    in a published number is.
    """
    df = index_df.copy()
    for col in ("value", "index_ratio", "imputed_weight_share", "coverage_ratio"):
        if col in df.columns:
            df[col] = df[col].astype("float64").round(6)
    df = df.sort_values("period").reset_index(drop=True)
    return hashlib.sha256(canonical_json(df.to_dict(orient="records")).encode()).hexdigest()
