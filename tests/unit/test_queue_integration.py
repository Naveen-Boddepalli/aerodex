"""Job queue against a real Postgres — plan §5.4.

Skipped unless a database is reachable. SKIP LOCKED semantics cannot be tested
against a mock: the whole point is what two concurrent transactions do.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from aerodex.db import queue
from aerodex.db.connection import dsn

psycopg = pytest.importorskip("psycopg")


def _connect():
    try:
        return psycopg.connect(dsn(), connect_timeout=3)
    except Exception as exc:  # pragma: no cover - environment dependent
        pytest.skip(f"no database at {dsn()}: {exc}")


@pytest.fixture
def conn():
    c = _connect()
    with c.cursor() as cur:
        cur.execute("DELETE FROM job WHERE kind = 'test_collect'")
    c.commit()
    yield c
    with c.cursor() as cur:
        cur.execute("DELETE FROM job WHERE kind = 'test_collect'")
    c.commit()
    c.close()


PAST = datetime.now(UTC) - timedelta(minutes=1)


def test_enqueue_then_dequeue(conn):
    jid = queue.enqueue(conn, "test_collect", {"route": "DEL-BOM", "h": 7}, PAST, slot="morning")
    assert jid is not None
    jobs = queue.dequeue(conn, "test_collect", limit=10)
    assert [j.id for j in jobs] == [jid]
    assert jobs[0].payload["route"] == "DEL-BOM"
    assert jobs[0].attempts == 1


def test_enqueue_is_idempotent_per_stratum_slot(conn):
    payload = {"route": "DEL-BLR", "h": 14}
    first = queue.enqueue(conn, "test_collect", payload, PAST)
    second = queue.enqueue(conn, "test_collect", payload, PAST)
    assert first is not None and second is None, "re-running a slot must not double-collect"


def test_skip_locked_prevents_double_claim(conn):
    """The invariant SKIP LOCKED exists for: two workers, disjoint claims."""
    for i in range(4):
        queue.enqueue(conn, "test_collect", {"n": i}, PAST)

    other = _connect()
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id FROM job WHERE kind='test_collect' AND status='pending'
                   ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 2"""
            )
            mine = {r[0] for r in cur.fetchall()}
        # conn still holds its locks here; the second worker must see none of them
        with other.cursor() as cur:
            cur.execute(
                """SELECT id FROM job WHERE kind='test_collect' AND status='pending'
                   ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 2"""
            )
            theirs = {r[0] for r in cur.fetchall()}
        assert len(mine) == 2 and len(theirs) == 2
        assert mine.isdisjoint(theirs), "two workers claimed the same job"
    finally:
        conn.rollback()
        other.rollback()
        other.close()


def test_failure_retries_then_dies(conn):
    jid = queue.enqueue(conn, "test_collect", {"x": 1}, PAST, max_attempts=2)
    queue.dequeue(conn, "test_collect")
    assert queue.fail(conn, jid, "boom") == "pending"      # attempt 1 -> retry
    queue.dequeue(conn, "test_collect")
    assert queue.fail(conn, jid, "boom") == "dead"         # attempt 2 -> dead
    assert queue.dequeue(conn, "test_collect") == [], "a dead job must not be re-served"


def test_complete_clears_the_job(conn):
    jid = queue.enqueue(conn, "test_collect", {"y": 2}, PAST)
    queue.dequeue(conn, "test_collect")
    queue.complete(conn, jid)
    assert queue.stats(conn, "test_collect").get("done") == 1


def test_future_jobs_are_not_served_early(conn):
    """A slot scheduled for 20:00 must not run at 13:00."""
    queue.enqueue(conn, "test_collect", {"z": 3}, datetime.now(UTC) + timedelta(hours=2))
    assert queue.dequeue(conn, "test_collect") == []


def test_reap_returns_abandoned_jobs(conn):
    jid = queue.enqueue(conn, "test_collect", {"w": 4}, PAST)
    queue.dequeue(conn, "test_collect")
    with conn.cursor() as cur:
        cur.execute("UPDATE job SET locked_at = now() - interval '2 hours' WHERE id=%s", (jid,))
    conn.commit()
    assert queue.reap_stale(conn, older_than_minutes=30) == 1
    assert [j.id for j in queue.dequeue(conn, "test_collect")] == [jid]
