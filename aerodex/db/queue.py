"""Job queue on Postgres — plan §5.4.

``SELECT ... FOR UPDATE SKIP LOCKED`` gives correct concurrent dequeue with no
new infrastructure: retries are a column, and job history is queryable with the
same SQL as everything else. Redis earns its place north of 10^5 tasks/day;
this project runs ~1,155.
"""

from __future__ import annotations

import json
import socket
from dataclasses import dataclass
from datetime import datetime
from typing import Any

WORKER_ID = f"{socket.gethostname()}:{__name__}"


@dataclass
class Job:
    id: int
    kind: str
    payload: dict
    scheduled_for: datetime
    attempts: int
    max_attempts: int
    slot: str | None = None
    source: str | None = None


def enqueue(conn, kind: str, payload: dict, scheduled_for: datetime,
            *, slot: str | None = None, source: str | None = None,
            max_attempts: int = 3) -> int | None:
    """Insert a job. Idempotent per (kind, scheduled_for, payload): re-running
    the scheduler for a slot cannot double-collect it."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO job (kind, payload, scheduled_for, slot, source, max_attempts)
            VALUES (%s, %s::jsonb, %s, %s, %s, %s)
            ON CONFLICT (kind, scheduled_for, payload) DO NOTHING
            RETURNING id
            """,
            (kind, json.dumps(payload, sort_keys=True), scheduled_for, slot, source, max_attempts),
        )
        row = cur.fetchone()
    conn.commit()
    return row[0] if row else None


def dequeue(conn, kind: str, *, limit: int = 1, worker: str = WORKER_ID) -> list[Job]:
    """Claim up to *limit* pending jobs.

    SKIP LOCKED is what makes this safe with several workers: a row already
    locked by another worker is passed over instead of blocking the scan.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            WITH claimed AS (
                SELECT id FROM job
                 WHERE kind = %s AND status = 'pending' AND scheduled_for <= now()
                 ORDER BY scheduled_for
                 FOR UPDATE SKIP LOCKED
                 LIMIT %s
            )
            UPDATE job j
               SET status = 'running', locked_at = now(), locked_by = %s,
                   attempts = j.attempts + 1
              FROM claimed c
             WHERE j.id = c.id
            RETURNING j.id, j.kind, j.payload, j.scheduled_for, j.attempts,
                      j.max_attempts, j.slot, j.source
            """,
            (kind, limit, worker),
        )
        rows = cur.fetchall()
    conn.commit()
    return [
        Job(id=r[0], kind=r[1], payload=r[2], scheduled_for=r[3], attempts=r[4],
            max_attempts=r[5], slot=r[6], source=r[7])
        for r in rows
    ]


def complete(conn, job_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE job SET status='done', completed_at=now(), last_error=NULL WHERE id=%s",
            (job_id,),
        )
    conn.commit()


def fail(conn, job_id: int, error: str) -> str:
    """Record a failure. A job past ``max_attempts`` becomes 'dead' rather than
    retrying forever — a dead job is a visible fact, an infinite retry is not.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE job
               SET status = CASE WHEN attempts >= max_attempts THEN 'dead'::job_status
                                 ELSE 'pending'::job_status END,
                   last_error = %s, locked_at = NULL, locked_by = NULL
             WHERE id = %s
            RETURNING status::text
            """,
            (error[:2000], job_id),
        )
        row = cur.fetchone()
    conn.commit()
    return row[0] if row else "unknown"


def reap_stale(conn, older_than_minutes: int = 30) -> int:
    """Return jobs stuck in 'running' (worker died mid-slot) to the queue."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE job SET status='pending', locked_at=NULL, locked_by=NULL
             WHERE status='running' AND locked_at < now() - (%s || ' minutes')::interval
            """,
            (older_than_minutes,),
        )
        n = cur.rowcount
    conn.commit()
    return n


def stats(conn, kind: str | None = None) -> dict[str, Any]:
    """Queue depth by status — the M3 instrument (plan §9)."""
    with conn.cursor() as cur:
        if kind:
            cur.execute(
                "SELECT status::text, count(*) FROM job WHERE kind=%s GROUP BY 1", (kind,)
            )
        else:
            cur.execute("SELECT status::text, count(*) FROM job GROUP BY 1")
        return dict(cur.fetchall())
