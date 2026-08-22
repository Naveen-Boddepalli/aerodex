"""Imputation — plan §5.5, metric M5.

The rule the plan insists on: missing-data handling is explicit, never silent.
Every imputed stratum is recorded, and the imputed share of index weight is
published alongside the index point. If the share exceeds the configured
ceiling, the run does not quietly publish a prettier number — it flags.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd


@dataclass
class ImputationResult:
    values: pd.Series
    imputed_keys: list[str] = field(default_factory=list)
    imputed_weight_share: float = 0.0
    exceeded_ceiling: bool = False


def stratum_group_mean(
    stratum_index: pd.Series,
    groups: dict[str, str],
    weights: dict[str, float],
    *,
    max_weight_share: float = 0.05,
) -> ImputationResult:
    """Fill missing strata with the geometric mean movement of their group.

    A stratum with no group sibling that reported stays missing — inventing a
    number from the global mean would hide exactly the coverage failure that
    M5 exists to surface.
    """
    s = pd.to_numeric(stratum_index, errors="coerce").copy()
    grp = pd.Series(groups).reindex(s.index)

    observed = s.notna() & (s > 0)
    group_geo = (
        np.log(s[observed]).groupby(grp[observed]).mean().pipe(np.exp)
        if observed.any()
        else pd.Series(dtype="float64")
    )

    imputed: list[str] = []
    for key in s.index[~observed]:
        g = grp.get(key)
        if g is not None and g in group_geo.index and np.isfinite(group_geo[g]):
            s.loc[key] = float(group_geo[g])
            imputed.append(str(key))

    w = pd.Series(weights, dtype="float64").reindex(s.index).fillna(0.0)
    total = float(w.sum())
    share = float(w.reindex(imputed).sum() / total) if total > 0 and imputed else 0.0

    return ImputationResult(
        values=s,
        imputed_keys=imputed,
        imputed_weight_share=share,
        exceeded_ceiling=share > max_weight_share,
    )
