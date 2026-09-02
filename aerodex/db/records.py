"""Persisting what a run produced — index points and adapter health.

The two tables the API reads and nothing wrote. ``index_point`` is the
database-side twin of the published artifacts, and ``adapter_health`` is where
the M3 collection metrics live; without these, a deployment with a live
database still served the frozen demo dataset for every index endpoint,
because the tables behind them were always empty.

Kept out of :mod:`aerodex.index.engine` on purpose: the engine is a pure
function (plan §5.5) and does not import psycopg. Computing a number and
storing one are different jobs, and only the first has to be reproducible.
"""

from __future__ import annotations

from datetime import date

import pandas as pd

from aerodex.config import MethodologyConfig

#: Recomputing a period under the *same* methodology is a refresh of that
#: number, not a second number — the unique key carries config_hash, so a
#: methodology change lands as a new row instead of overwriting the old one.
#: That is what makes the revision policy visible rather than destructive.
_UPSERT_INDEX_POINT = """
    INSERT INTO index_point (period, frequency, series, value, imputed_weight_share,
        coverage_ratio, n_quotes, config_hash, weights_vintage, panel_hash,
        is_provisional, computed_at)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ON CONFLICT (period, frequency, series, config_hash) DO UPDATE
       SET value                = EXCLUDED.value,
           imputed_weight_share = EXCLUDED.imputed_weight_share,
           coverage_ratio       = EXCLUDED.coverage_ratio,
           n_quotes             = EXCLUDED.n_quotes,
           weights_vintage      = EXCLUDED.weights_vintage,
           panel_hash           = EXCLUDED.panel_hash,
           is_provisional       = EXCLUDED.is_provisional,
           computed_at          = EXCLUDED.computed_at
     WHERE index_point.is_provisional
"""

_UPSERT_ADAPTER_HEALTH = """
    INSERT INTO adapter_health (source, slot, observed_on, scheduled, succeeded,
        failed, tier_used)
    VALUES (%s,%s::collection_slot,%s,%s,%s,%s,%s)
    ON CONFLICT (source, slot, observed_on) DO UPDATE
       SET scheduled = EXCLUDED.scheduled,
           succeeded = EXCLUDED.succeeded,
           failed    = EXCLUDED.failed,
           tier_used = EXCLUDED.tier_used
"""


def store_index_points(
    conn,
    index_df: pd.DataFrame,
    config: MethodologyConfig,
    *,
    computed_at,
    series: str = "headline",
    frequency: str = "daily",
    provisional_before: date | None = None,
) -> int:
    """Write a computed index into ``index_point``. Returns rows written.

    ``provisional_before`` is the cutoff the revision policy defines: periods
    older than it are frozen, everything newer is still provisional. Passed in
    rather than derived from the clock, so a backfill does not mark history
    provisional again just because it ran today.

    A period already frozen in the database is left alone — the ``WHERE
    index_point.is_provisional`` guard on the upsert means a recompute cannot
    silently rewrite a number that was published as final.
    """
    rows = [
        (
            str(r["period"]),
            frequency,
            series,
            float(r["value"]),
            float(r["imputed_weight_share"]),
            float(r["coverage_ratio"]),
            int(r["n_quotes"]),
            config.hash,
            str(r.get("weights_vintage", config.weights_vintage)),
            str(r.get("panel_hash", "")),
            provisional_before is None
            or date.fromisoformat(str(r["period"])) >= provisional_before,
            computed_at,
        )
        for _, r in index_df.iterrows()
        if pd.notna(r["value"])
    ]
    if not rows:
        return 0
    try:
        with conn.cursor() as cur:
            cur.executemany(_UPSERT_INDEX_POINT, rows)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return len(rows)


def record_adapter_health(
    conn, source: str, slot: str, observed_on: date, report, *, tier: int | None = None
) -> None:
    """Record one slot's collection outcome for a source — the M3 instrument.

    Upserts on (source, slot, observed_on): re-running a slot replaces its
    numbers rather than double-counting them, which is the same idempotence the
    job queue gives the collection itself.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(
                _UPSERT_ADAPTER_HEALTH,
                (
                    source, slot, observed_on, report.scheduled,
                    report.succeeded, report.failed, tier,
                ),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
