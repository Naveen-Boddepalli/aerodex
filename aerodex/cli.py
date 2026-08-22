"""AeroDex command line.

    aerodex init-db          apply the schema
    aerodex panel            show the panel's shape and sizing
    aerodex collect          run one slot's collection
    aerodex index            compute the index from the database
    aerodex verify           re-run a stored index and diff the hash (M6)
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, time, timezone

from aerodex.acquire.collect import IST
from aerodex.config import MethodologyConfig, PanelConfig


def _cmd_panel(args) -> int:
    panel = PanelConfig.load()
    meth = MethodologyConfig.load()
    strata = panel.strata()
    print(f"routes           : {len(panel.routes)}")
    print(f"horizons         : {panel.horizons}")
    print(f"slots            : {[s['id'] for s in panel.slots]}")
    print(f"strata           : {len(strata)}")
    print(f"stratum-slots/day: {panel.stratum_slots_per_day()}")
    print(f"panel hash       : {panel.hash}")
    print(f"config hash      : {meth.hash}")
    print(f"weights vintage  : {meth.weights_vintage}")
    unweighted = [k for k, v in panel.weights().items() if v is None]
    if unweighted:
        print(f"\nWARNING: {len(unweighted)} routes have no weight (Phase 0 spike S4 pending).")
        print("         The index will run with uniform weights and must not be published.")
    return 0


def _cmd_init_db(args) -> int:
    from aerodex.db.connection import apply_schema, connect, dsn

    print(f"applying schema to {dsn()}")
    with connect() as conn:
        apply_schema(conn)
    print("schema applied")
    return 0


def _cmd_collect(args) -> int:
    from aerodex.acquire.adapters import REGISTRY
    from aerodex.acquire.collect import build_requests, collect

    panel = PanelConfig.load()
    meth = MethodologyConfig.load()

    adapter_cls = REGISTRY.get(args.source)
    if adapter_cls is None:
        print(f"unknown source {args.source!r}; available: {sorted(REGISTRY)}", file=sys.stderr)
        return 2

    today = date.fromisoformat(args.date) if args.date else date.today()
    requests = build_requests(panel, args.slot, today=today)

    # The observation timestamp. For a live run this is the real clock — plan
    # §5.1 requires recording the ACTUAL collection time, not the nominal slot.
    # For a replay (--date in the past) it is that date at the slot's local
    # time, otherwise every backfilled day would be stamped with today and the
    # periods would collapse into one.
    if args.date and today != date.today():
        slot_cfg = next(s for s in panel.slots if s["id"] == args.slot)
        hh, mm = (int(x) for x in str(slot_cfg["local_time"]).split(":"))
        collected_at = datetime.combine(today, time(hh, mm), tzinfo=IST)
    else:
        collected_at = datetime.now(timezone.utc)
    if args.limit:
        requests = requests[: args.limit]

    conn_ctx = None
    conn = None
    if args.store:
        from aerodex.db.connection import connect

        conn_ctx = connect()
        conn = conn_ctx.__enter__()

    try:
        report = collect(adapter_cls(), requests, meth.raw, now=collected_at, conn=conn)
    finally:
        if conn_ctx is not None:
            conn_ctx.__exit__(None, None, None)

    print(f"slot            : {args.slot} ({today}, collected_at={collected_at:%Y-%m-%d %H:%M %Z})")
    print(f"source          : {args.source}")
    print(f"scheduled       : {report.scheduled}")
    print(f"succeeded       : {report.succeeded}")
    print(f"failed          : {report.failed}")
    print(f"success rate    : {report.success_rate:.1%}  (M3 target >= 95%)")
    print(f"valid quotes    : {report.quotes_valid}")
    print(f"quarantined     : {report.quotes_quarantined}")
    if report.blocked_sources:
        print(f"BLOCKED sources : {sorted(report.blocked_sources)}")
    for err in report.errors[:5]:
        print(f"  ! {err}")
    return 0 if report.success_rate >= 0.95 else 1


def _cmd_index(args) -> int:
    import pandas as pd

    from aerodex.index.engine import compute_index, output_hash

    meth = MethodologyConfig.load()

    if args.panel_csv:
        panel_df = pd.read_csv(args.panel_csv)
    else:
        from aerodex.db.connection import connect

        with connect() as conn:
            panel_df = pd.read_sql_query(
                """
                SELECT date_trunc('day', collected_at)::date::text AS period,
                       origin, destination, horizon_days, itinerary_key, fare_inr_paise
                  FROM quote_clean
                 WHERE validation_status = 'valid'
                """,
                conn,
            )

    if panel_df.empty:
        print("no panel data", file=sys.stderr)
        return 2

    out = compute_index(panel_df, meth)
    cols = ["period", "value", "index_ratio", "imputed_weight_share",
            "coverage_ratio", "n_quotes", "imputation_ceiling_breached"]
    print(out[cols].to_string(index=False))
    print(f"\noutput hash: {output_hash(out)}")

    breached = out["imputation_ceiling_breached"].any()
    if breached:
        print(
            f"\nWARNING: imputed weight share exceeded "
            f"{meth.max_imputed_share:.0%} (M5) in at least one period.",
            file=sys.stderr,
        )
    if args.out:
        out.to_json(args.out, orient="records", indent=2)
        print(f"wrote {args.out}")
    return 1 if breached else 0


def _cmd_verify(args) -> int:
    """M6: recompute an archived panel and diff the hash."""
    import pandas as pd

    from aerodex.index.engine import compute_index, output_hash

    expected = json.loads(open(args.hashes).read())
    panel_df = pd.read_csv(args.panel_csv)
    meth = MethodologyConfig.load()

    got = output_hash(compute_index(panel_df, meth))
    ok = got == expected["output_hash"]
    print(f"expected: {expected['output_hash']}")
    print(f"actual  : {got}")
    print("REPRODUCIBLE" if ok else "MISMATCH — a published number moved")
    return 0 if ok else 1


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="aerodex", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("panel", help="show panel shape and sizing").set_defaults(fn=_cmd_panel)
    sub.add_parser("init-db", help="apply the schema").set_defaults(fn=_cmd_init_db)

    c = sub.add_parser("collect", help="run one slot's collection")
    c.add_argument("--source", default="fixture")
    c.add_argument("--slot", default="morning", choices=["morning", "afternoon", "evening"])
    c.add_argument("--date", help="collection date, YYYY-MM-DD (default: today)")
    c.add_argument("--limit", type=int, help="cap requests, for smoke tests")
    c.add_argument("--store", action="store_true", help="write to the database")
    c.set_defaults(fn=_cmd_collect)

    i = sub.add_parser("index", help="compute the index")
    i.add_argument("--panel-csv", help="read the panel from CSV instead of the database")
    i.add_argument("--out", help="write the index as JSON")
    i.set_defaults(fn=_cmd_index)

    v = sub.add_parser("verify", help="M6 reproducibility check")
    v.add_argument("--panel-csv", default="tests/golden/panel.csv")
    v.add_argument("--hashes", default="tests/golden/expected_hashes.json")
    v.set_defaults(fn=_cmd_verify)

    args = p.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
