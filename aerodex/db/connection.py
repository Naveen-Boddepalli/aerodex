"""Connection handling. The engine never imports this — see engine.py's docstring."""

from __future__ import annotations

import os
from contextlib import contextmanager

DEFAULT_DSN = "postgresql://aerodex:aerodex@localhost:5433/aerodex"

#: Seconds to wait for a connection before giving up. libpq's own default is no
#: timeout at all, which means a DSN pointing at a filtered host hangs the
#: caller for the OS TCP timeout — minutes, on every request the API serves.
#: The database is either local or one hop away, so a few seconds is generous.
DEFAULT_CONNECT_TIMEOUT_S = int(os.environ.get("AERODEX_DB_CONNECT_TIMEOUT_S", "5"))


def dsn() -> str:
    """DSN from ``AERODEX_DSN``, falling back to the local compose database."""
    return os.environ.get("AERODEX_DSN", DEFAULT_DSN)


@contextmanager
def connect(dsn_str: str | None = None, *, connect_timeout: int | None = None):
    """Yield a psycopg connection. Imported lazily so that non-DB code paths
    (the engine, the tests that matter for M6) never need psycopg installed.

    ``connect_timeout`` defaults to :data:`DEFAULT_CONNECT_TIMEOUT_S`, and is
    left alone when the DSN already sets one — an explicit value in the DSN is
    an operator's decision, not something to silently override.
    """
    import psycopg
    from psycopg.conninfo import conninfo_to_dict, make_conninfo

    target = dsn_str or dsn()
    timeout = DEFAULT_CONNECT_TIMEOUT_S if connect_timeout is None else connect_timeout
    if timeout is not None and "connect_timeout" not in conninfo_to_dict(target):
        target = make_conninfo(target, connect_timeout=timeout)

    conn = psycopg.connect(target)
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
