#!/usr/bin/env python3
"""Write the API's OpenAPI document to docs/openapi.json.

The service serves this live at ``/openapi.json``, but an integrator
evaluating AeroDex — NSO, RBI, or a reviewer — should not have to stand up a
Python environment and a database to read the contract. Committing the
document makes the API surface reviewable from the repository alone, and makes
a change to it show up in a diff.

Serialised with sorted keys and a trailing newline so that re-running this on
an unchanged API produces a byte-identical file: a diff here means the API
actually moved, not that the exporter ran again.

Run::

    uv run python scripts/export_openapi.py

The CI lint job runs it with --check, which fails if the committed document is
stale rather than silently rewriting it.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "openapi.json"


def render() -> str:
    # Imported here rather than at module scope so --help works without the
    # application's dependencies installed.
    from aerodex.api import app

    return json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument(
        "--check",
        action="store_true",
        help="exit non-zero if the committed document is out of date, and write nothing",
    )
    args = p.parse_args(argv)

    spec = render()

    if args.check:
        current = OUT.read_text() if OUT.exists() else ""
        if current != spec:
            print(
                f"{OUT.relative_to(ROOT)} is out of date.\n"
                "Run `uv run python scripts/export_openapi.py` and commit the result.",
                file=sys.stderr,
            )
            return 1
        print(f"{OUT.relative_to(ROOT)} is up to date")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(spec)
    paths = len(json.loads(spec)["paths"])
    print(f"wrote {OUT.relative_to(ROOT)} ({paths} paths, {len(spec):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
