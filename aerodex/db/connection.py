"""Connection handling. The engine never imports this — see engine.py's docstring."""

from __future__ import annotations

import os
from contextlib import contextmanager

DEFAULT_DSN = "postgresql://aerodex:aerodex@localhost:5433/aerodex"


def dsn() -> str:
    """DSN from ``AERODEX_DSN``, falling back to the local compose database."""
    return os.environ.get("AERODEX_DSN", DEFAULT_DSN)


@contextmanager
def connect(dsn_str: str | None = None):
    """Yield a psycopg connection. Imported lazily so that non-DB code paths
    (the engine, the tests that matter for M6) never need psycopg installed."""
    import psycopg

    conn = psycopg.connect(dsn_str or dsn())
    try:
        yield conn
    finally:
        conn.close()


def apply_schema(conn, schema_path: str | None = None) -> None:
    """Apply schema.sql. Idempotent — every statement is IF NOT EXISTS or
    guarded, so this is safe to run on an existing database."""
    from pathlib import Path

    path = Path(schema_path) if schema_path else Path(__file__).parent / "schema.sql"
    with conn.cursor() as cur:
        cur.execute(path.read_text())
    conn.commit()
