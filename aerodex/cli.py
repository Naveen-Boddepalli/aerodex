"""AeroDex command line.

    aerodex init-db          apply the schema
    aerodex panel            show the panel's shape and sizing
    aerodex collect          run one slot's collection
    aerodex index            compute the index from the database
    aerodex index --publish  compute, then have the publisher accept or refuse it
    aerodex verify           re-run a stored index and diff the hash (M6)
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, date, datetime, time
from pathlib import Path

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
        print(f"\nWARNING: {len(unweighted)} routes have no weight (spike S4 pending).")
        print("         The index will run with uniform weights and must not be published.")
    else:
        total = sum(float(v) for v in panel.weights().values())
        print(f"weight coverage  : {len(panel.routes)}/{len(panel.routes)} (sum {total:.6f})")
        if panel.raw.get("weights_vintage") != meth.weights_vintage:
            print(
                f"\nWARNING: weights_vintage mismatch — panel.yaml "
                f"{panel.raw.get('weights_vintage')!r} vs methodology.yaml "
                f"{meth.weights_vintage!r}."
            )
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
        collected_at = datetime.now(UTC)
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

    # Route weights from panel.yaml. Passing None here silently reverts the
    # index to uniform weighting, which is what S4 existed to remove — so an
    # incomplete weight set is refused rather than quietly downgraded.
    panel_cfg = PanelConfig.load()
    route_weights = panel_cfg.weights()
    unweighted = sorted(k for k, v in route_weights.items() if v is None)
    if unweighted and not args.allow_unweighted:
        print(
            f"{len(unweighted)} route(s) have no weight, e.g. {unweighted[:3]}.\n"
            "Run scripts/parse_dgca_weights.py, or pass --allow-unweighted to "
            "compute an explicitly uniform-weighted index (not publishable).",
            file=sys.stderr,
        )
        return 2

    weights = None if unweighted else {k: float(v) for k, v in route_weights.items()}
    if weights is None:
        print("WARNING: computing with UNIFORM weights — not publishable.", file=sys.stderr)
    if panel_cfg.raw.get("weights_vintage") != meth.weights_vintage:
        print(
            f"WARNING: weights_vintage mismatch — panel.yaml says "
            f"{panel_cfg.raw.get('weights_vintage')!r}, methodology.yaml says "
            f"{meth.weights_vintage!r}. The published vintage will not identify "
            "the weights actually used.",
            file=sys.stderr,
        )

    out = compute_index(panel_df, meth, weights=weights)
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

    if args.publish:
        return _publish(out, meth, args)
    return 1 if breached else 0


def _publish(index_df, meth: MethodologyConfig, args) -> int:
    """Run a computed index through the publisher and report the verdict.

    Split out of ``_cmd_index`` so the refusal is the *last* thing on screen.
    The M5 warning above scrolls off the top of a 30-period table, which is how
    a refusal ends up looking like a footnote — the one thing the plan says it
    must never be.
    """
    from aerodex.publish.artifacts import (
        PublicationRefused,
        build_artifacts,
        write_artifacts,
    )

    sources = set(args.sources) if args.sources else None
    try:
        artifacts = build_artifacts(
            index_df, meth, sources=sources, allow_synthetic=args.allow_synthetic
        )
    except PublicationRefused as exc:
        # The verdict goes to stdout like verify's, not stderr: a refusal is the
        # designed outcome of this command, not a malfunction, and stderr is
        # unbuffered so it would jump ahead of the table when piped. Exit 3
        # carries the failure for anything scripting this.
        print("\nPUBLICATION REFUSED")
        print(f"  {exc}")
        print("\nNo artifacts were written.")
        return 3

    print(f"\nPUBLISHED  {artifacts.release_name}")
    if args.artifacts_dir:
        written = write_artifacts(artifacts, args.artifacts_dir)
        for path in sorted(written):
            print(f"  wrote {path}")
    else:
        print("  (dry run — pass --artifacts-dir to write the files)")
    return 0


def _cmd_verify(args) -> int:
    """M6: recompute an archived panel and diff the hash."""
    import pandas as pd

    from aerodex.index.engine import compute_index, output_hash

    expected = json.loads(Path(args.hashes).read_text())
    panel_df = pd.read_csv(args.panel_csv)
    meth = MethodologyConfig.load()

    checks: list[tuple[str, str, str]] = []

    got = output_hash(compute_index(panel_df, meth))
    checks.append(("unweighted", expected["output_hash"], got))

    # The weighted path is the one that gets published, so it is the one M6 is
    # actually about. Verifying only the unweighted path would let the weights
    # drift without the reproducibility check ever noticing.
    route_weights = PanelConfig.load().weights()
    if "weighted_output_hash" in expected and not any(v is None for v in route_weights.values()):
        weights = {k: float(v) for k, v in route_weights.items()}
        got_w = output_hash(compute_index(panel_df, meth, weights=weights))
        checks.append(("weighted", expected["weighted_output_hash"], got_w))

    ok = True
    for label, want, actual in checks:
        match = want == actual
        ok = ok and match
        print(f"{label:11} expected: {want}")
        print(f"{'':11} actual  : {actual}   {'OK' if match else 'MISMATCH'}")

    if "weights_vintage" in expected and expected["weights_vintage"] != meth.weights_vintage:
        print(f"\nWARNING: weights_vintage moved {expected['weights_vintage']!r} "
              f"-> {meth.weights_vintage!r} since the fixtures were frozen.")

    print("\nREPRODUCIBLE" if ok else "\nMISMATCH — a published number moved")
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
    i.add_argument("--allow-unweighted", action="store_true",
                   help="compute with uniform weights when panel weights are missing")
    i.add_argument("--publish", action="store_true",
                   help="run the result through the publisher; it refuses rather than "
                        "emitting an unpublishable release (exit 3)")
    i.add_argument("--source", action="append", dest="sources", metavar="NAME",
                   help="declare a panel source for the publisher's synthetic check "
                        "(repeatable, e.g. --source fixture)")
    i.add_argument("--allow-synthetic", action="store_true",
                   help="let a fixture-derived panel past the synthetic refusal — for "
                        "demos only, never a real release")
    i.add_argument("--artifacts-dir",
                   help="write the release here when the publisher accepts it")
    i.set_defaults(fn=_cmd_index)

    v = sub.add_parser("verify", help="M6 reproducibility check")
    v.add_argument("--panel-csv", default="tests/golden/panel.csv")
    v.add_argument("--hashes", default="tests/golden/expected_hashes.json")
    v.set_defaults(fn=_cmd_verify)

    args = p.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
