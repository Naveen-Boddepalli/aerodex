"""Higher-level aggregation — Lowe/Laspeyres with fixed DGCA weights (plan §5.5).

Fisher and Törnqvist need current-period quantities this project does not have.
Lowe uses a fixed weight vintage, which is also what makes the index auditable:
the weights are a published artifact, not an estimate that moves every period.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def normalise_weights(weights: dict[str, float]) -> dict[str, float]:
    """Scale weights to sum to 1. Raises if the total is non-positive."""
    total = float(sum(weights.values()))
    if total <= 0:
        raise ValueError("weights must sum to a positive number")
    return {k: float(v) / total for k, v in weights.items()}


def lowe(
    stratum_index: pd.Series,
    weights: dict[str, float],
    *,
    renormalise_on_missing: bool = True,
) -> tuple[float, float]:
    """Weighted aggregate of stratum indices.

    Args:
        stratum_index: index ratios keyed by stratum id. NaN = not reported.
        weights: weight per stratum id, same key space.
        renormalise_on_missing: rescale the reporting strata's weights to sum
            to 1. When False, missing weight drags the index toward zero, which
            is always wrong — the option exists only to make that explicit.

    Returns:
        ``(index_ratio, reported_weight_share)``. The second value feeds M5:
        ``1 - reported_weight_share`` is the share that needed imputation.
    """
    s = pd.to_numeric(stratum_index, errors="coerce")
    w = pd.Series(weights, dtype="float64").reindex(s.index).fillna(0.0)

    total_weight = float(w.sum())
    if total_weight <= 0:
        return float("nan"), 0.0

    reported = s.notna() & (s > 0)
    reported_weight = float(w[reported].sum())
    share = reported_weight / total_weight

    if reported_weight <= 0:
        return float("nan"), 0.0

    ww = w[reported]
    if renormalise_on_missing:
        ww = ww / reported_weight
    else:
        ww = ww / total_weight

    # Aggregate in log space, consistent with the Jevons elementary level.
    value = float(np.exp(np.sum(ww.to_numpy() * np.log(s[reported].to_numpy()))))
    return value, share
