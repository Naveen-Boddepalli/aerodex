"""Elementary aggregation — Jevons index (plan §5.5).

Jevons is the geometric mean of price relatives. It is chosen over Carli
(known upward bias) and Dutot (not invariant to units, wrong for heterogeneous
items). Computed in log space: the geometric mean of many relatives underflows
in direct product form well before the panel gets large.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def relatives_from_medians(cur: pd.Series, bas: pd.Series) -> pd.Series:
    """Matched-model relatives from two already-aggregated median series.

    Split out of :func:`price_relatives` so a caller holding many strata can
    take the median once for the whole panel instead of once per stratum per
    period. Both series must be indexed by the item key and ordered as
    ``groupby(key).median()`` leaves them (sorted), so that ``matched`` comes
    out in the same order either way: ``jevons`` means logs, and float
    summation is order-dependent.

    ``engine.compute_index`` no longer goes through here — it pivots the
    medians into one matrix and matches with a boolean mask — but it reproduces
    exactly this ordering, and :mod:`tests.unit.test_elementary` pins the two
    against each other.
    """
    matched = cur.index.intersection(bas.index)
    if len(matched) == 0:
        return pd.Series(dtype="float64", name="relative")
    rel = (cur.loc[matched] / bas.loc[matched]).astype("float64")
    rel.name = "relative"
    return rel


def price_relatives(
    current: pd.DataFrame,
    base: pd.DataFrame,
    *,
    key: str = "itinerary_key",
    price: str = "fare_inr_paise",
) -> pd.Series:
    """Matched-model price relatives p_t / p_0, indexed by ``key``.

    Only items present in *both* periods contribute — that is what "matched"
    means, and it is why quality adjustment (hedonic.py) is needed separately.
    """
    return relatives_from_medians(
        current.groupby(key)[price].median(),
        base.groupby(key)[price].median(),
    )


def jevons(
    relatives: pd.Series,
    *,
    clip: tuple[float, float] | None = None,
) -> float:
    """Geometric mean of price relatives.

    Args:
        relatives: price relatives p_t/p_0. Non-positive values are invalid
            (a fare of zero is a parse failure, not a free flight) and are
            dropped rather than silently producing -inf.
        clip: optional (low, high) band; relatives outside it are treated as
            data errors and dropped. Configured as ``elementary.relative_clip``.

    Returns:
        The Jevons elementary index as a ratio (1.0 = no change). NaN if no
        usable relatives remain — the caller decides whether to impute.
    """
    r = pd.to_numeric(relatives, errors="coerce").dropna()
    r = r[r > 0]
    if clip is not None:
        low, high = clip
        r = r[(r >= low) & (r <= high)]
    if len(r) == 0:
        return float("nan")
    return float(np.exp(np.log(r.to_numpy()).mean()))


def jevons_from_panel(
    current: pd.DataFrame,
    base: pd.DataFrame,
    *,
    min_matched: int = 3,
    clip: tuple[float, float] | None = None,
    key: str = "itinerary_key",
    price: str = "fare_inr_paise",
) -> tuple[float, int]:
    """Jevons index for one stratum, plus the matched-item count.

    Returns ``(nan, n)`` when ``n < min_matched``: a stratum thinner than the
    configured floor is imputed, not published on two coincidental matches.
    """
    rel = price_relatives(current, base, key=key, price=price)
    n = int(len(rel))
    if n < min_matched:
        return float("nan"), n
    return jevons(rel, clip=clip), n
