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
    # Stratum id is ``ORIG-DEST@Nd`` (the same shape as
    # ``SearchRequest.stratum``), built vectorised rather than with a per-row
    # f-string: one pass over the columns instead of one Python format call per
    # quote.
    work["route"] = work["origin"] + "-" + work["destination"]
    work["stratum"] = work["route"] + "@" + work["horizon_days"].astype(str) + "d"

    all_strata = sorted(work["stratum"].unique())
    route_of = work[["stratum", "route"]].drop_duplicates()
    stratum_route = dict(zip(route_of["stratum"], route_of["route"], strict=True))

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

    # Median fare per (period, stratum, item), taken once for the whole panel
    # and then pivoted into a dense item x period matrix.
    #
    # The comparison loop below used to hold one pandas Series per
    # (period, stratum) and intersect two of them per stratum per period pair —
    # tens of thousands of index joins and .loc lookups over the same rows,
    # which is where the runtime went. The matrix carries exactly the same
    # numbers: its rows are (stratum, itinerary_key) in sorted order, so each
    # stratum is one contiguous row block and a period pair's relatives are a
    # single vector division. Matching becomes a boolean mask instead of an
    # index join, and the surviving log-relatives still reach ``mean()`` in
    # sorted-key order — which matters, because float summation is
    # order-dependent and M6 diffs the output hash.
    medians = work.groupby(["period", "stratum", "itinerary_key"], sort=True)[
        "fare_inr_paise"
    ].median()
    wide = medians.unstack(level="period").reindex(columns=periods)
    prices = wide.to_numpy(dtype="float64", na_value=np.nan)

    # One contiguous row block per stratum, read straight off the sorted index.
    row_stratum = wide.index.get_level_values("stratum").to_numpy()
    edges = np.flatnonzero(row_stratum[1:] != row_stratum[:-1]) + 1
    blocks: dict[str, tuple[int, int]] = {
        row_stratum[lo]: (int(lo), int(hi))
        for lo, hi in zip(
            np.concatenate(([0], edges)),
            np.concatenate((edges, [len(row_stratum)])),
            strict=True,
        )
    }

    column_of = {p: i for i, p in enumerate(periods)}
    quotes_per_period = work["period"].value_counts()

    rows: list[dict] = []
    level = config.base_value

    # Base period: the index is 100 by definition, with no comparison behind it.
    rows.append(
        {
            "period": periods[0],
            "value": level,
            "index_ratio": 1.0,
            "imputed_weight_share": 0.0,
            "coverage_ratio": 1.0,
            "n_quotes": int(quotes_per_period.get(periods[0], 0)),
            "n_strata_reported": int(
                work.loc[work["period"] == periods[0], "stratum"].nunique()
            ),
            "imputation_ceiling_breached": False,
            "is_base": True,
        }
    )

    for prev, cur in zip(periods[:-1], periods[1:], strict=True):
        cur_col = prices[:, column_of[cur]]
        prev_col = prices[:, column_of[prev]]
        with np.errstate(divide="ignore", invalid="ignore"):
            rel = cur_col / prev_col
            log_rel = np.log(rel)

        # "Matched" means exactly what the index intersection meant: the item
        # carries a price in both periods.
        matched = ~(np.isnan(cur_col) | np.isnan(prev_col))
        # Jevons drops non-positive relatives (a zero fare is a parse failure)
        # and anything outside the configured clip band, as data errors.
        usable = matched & (rel > 0)
        if clip is not None:
            low, high = clip
            usable &= (rel >= low) & (rel <= high)

        ratios: dict[str, float] = {}
        for s in all_strata:
            span = blocks.get(s)
            if span is None:
                # A stratum priced in no period at all matches nothing, exactly
                # as the empty-slice path did before.
                ratios[s] = float("nan")
                continue
            lo, hi = span
            # A stratum thinner than the configured floor is imputed, not
            # published on two coincidental matches. The floor is checked on the
            # matched count, before the clip band drops outliers.
            if int(matched[lo:hi].sum()) < min_matched:
                ratios[s] = float("nan")
                continue
            kept = log_rel[lo:hi][usable[lo:hi]]
            ratios[s] = float(np.exp(kept.mean())) if kept.size else float("nan")

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
                "n_quotes": int(quotes_per_period.get(cur, 0)),
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
