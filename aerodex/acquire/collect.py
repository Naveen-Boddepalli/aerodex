"""The collection path: job -> adapter -> normalise -> validate -> store.

This is the impure half of the system. Everything time-, network- and
database-dependent lives on this side of the line so that
:mod:`aerodex.index.engine` can stay a pure function (plan §5.5).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from aerodex.acquire.base import Adapter, SearchRequest, SourceBlocked
from aerodex.config import PanelConfig
from aerodex.normalise import itinerary_key, normalise_quotes
from aerodex.validate import validate_batch

IST = timezone(timedelta(hours=5, minutes=30))


@dataclass
class CollectionReport:
    """What one slot's collection actually achieved — the M3 instrument."""

    scheduled: int = 0
    succeeded: int = 0
    failed: int = 0
    quotes_valid: int = 0
    quotes_quarantined: int = 0
    #: Observations actually committed to quote_raw. Counted separately from
    #: quotes_valid because "the adapter parsed it" and "the archive has it" are
    #: different facts, and M6 rests on the second one.
    quotes_stored: int = 0
    store_failures: int = 0
    blocked_sources: set[str] = field(default_factory=set)
    errors: list[str] = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        return self.succeeded / self.scheduled if self.scheduled else 0.0


def build_requests(
    panel: PanelConfig, slot: str, *, today: date, cabin: str = "economy"
) -> list[SearchRequest]:
    """Every (route, horizon) for one slot. ``today`` is passed in, not read
    from the clock, so a collection run can be replayed for a past date."""
    out: list[SearchRequest] = []
    for r in panel.routes:
        for h in panel.horizons:
            out.append(
                SearchRequest(
                    origin=r["origin"],
                    destination=r["destination"],
                    departure_date=today + timedelta(days=h),
                    horizon_days=h,
                    slot=slot,
                    cabin=cabin,
                )
            )
    return out


def collect(
    adapter: Adapter,
    requests: list[SearchRequest],
    validation_config: dict,
    *,
    now: datetime,
    conn=None,
) -> CollectionReport:
    """Run one adapter over a list of requests.

    Args:
        now: the actual collection time, passed in rather than read, and
            recorded on every observation (plan §5.1 — a slot is a ±15 min
            window, so the real timestamp is what makes late collection
            degrade gracefully instead of silently corrupting the stratum).
        conn: optional database connection. Without it, this collects and
            validates but stores nothing — the mode used by tests.
    """
    report = CollectionReport(scheduled=len(requests))

    for req in requests:
        try:
            quotes = adapter.emit(req, now)
        except SourceBlocked as exc:
            # Plan §5.2: when a source blocks, drop it and publish the coverage
            # ratio. Never retry harder, never evade.
            report.blocked_sources.add(adapter.name)
            report.failed += 1
            report.errors.append(f"{adapter.name} blocked on {req.stratum}: {exc}")
            break
        except Exception as exc:
            report.failed += 1
            report.errors.append(f"{adapter.name} failed on {req.stratum}: {exc}")
            continue

        clean = normalise_quotes(quotes)
        valid, held = validate_batch(clean, validation_config)

        report.succeeded += 1
        report.quotes_valid += len(valid)
        report.quotes_quarantined += len(held)

        if conn is not None:
            try:
                report.quotes_stored += _store(conn, adapter, quotes, valid, held)
            except Exception as exc:
                # _store has already rolled back, so the connection is usable
                # for the next stratum. One unstorable slot is a lost stratum;
                # a poisoned connection would be a lost slot.
                report.store_failures += 1
                report.errors.append(f"store failed on {req.stratum}: {exc}")

    return report


def _store(conn, adapter: Adapter, raw_quotes, valid, held) -> int:
    """Write quote_raw (append-only) and quote_clean in one transaction.

    Returns the number of quote_raw rows written.

    One transaction per stratum-slot rather than one per collection run: a
    collector killed mid-slot should lose the stratum it was on, not the two
    hours of strata behind it.

    On failure the transaction is rolled back before the exception leaves.
    Without that, psycopg leaves the connection in an aborted transaction and
    *every* subsequent stratum in the run fails with "current transaction is
    aborted" — one bad row turning into a lost slot.
    """
    if not raw_quotes and not valid and not held:
        return 0
    try:
        with conn.cursor() as cur:
            raw_ids = _insert_raw(cur, adapter, raw_quotes)
            _insert_clean(cur, [(c, "valid", None) for c in valid], raw_ids)
            _insert_clean(cur, [(c, "quarantined", r) for c, r in held], raw_ids)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return len(raw_quotes)


_INSERT_RAW = """
    INSERT INTO quote_raw (collected_at, slot, source, origin, destination,
        departure_date, horizon_days, cabin, fare_inr_paise, carrier,
        flight_number, stops, duration_minutes, is_refundable,
        baggage_included, seats_remaining, payload, raw_sha256,
        adapter_version, acquisition_tier)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s)
    RETURNING id
"""

_INSERT_CLEAN = """
    INSERT INTO quote_clean (raw_id, collected_at, slot, source, origin, destination,
        departure_date, horizon_days, cabin, fare_inr_paise, carrier, carrier_type,
        stops, departure_time_bucket, duration_minutes, is_refundable,
        baggage_included, itinerary_key, validation_status, quarantine_reason)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::validation_status,%s)
    ON CONFLICT (itinerary_key, collected_at, source) DO NOTHING
"""


def _insert_raw(cur, adapter: Adapter, quotes) -> dict[tuple[str, int, str], int]:
    """Append the batch to quote_raw, returning a lookup to its new ids.

    Batched through ``executemany`` rather than a statement per quote: a full
    panel slot is ~2,500 observations, and a round trip each is the difference
    between a slot that finishes inside its ±15 minute window and one that does
    not.

    The lookup is keyed on ``(itinerary_key, fare, source)`` — the same key
    :func:`aerodex.normalise.normalise_quotes` derived the clean rows from, so
    every clean row can name the archived raw row it came from instead of the
    placeholder zero that used to be stored there. M6 is an audit trail from a
    published number back to a raw response; a clean row that cannot name its
    raw row is a broken link in it.
    """
    if not quotes:
        return {}

    params = [
        (
            q.collected_at, q.request.slot, q.source, q.request.origin,
            q.request.destination, q.request.departure_date, q.request.horizon_days,
            q.request.cabin, q.fare_inr_paise, q.carrier, q.flight_number, q.stops,
            q.duration_minutes, q.is_refundable, q.baggage_included,
            q.seats_remaining, json.dumps(q.payload, sort_keys=True), q.raw_sha256,
            adapter.version, int(q.tier),
        )
        for q in quotes
    ]

    # psycopg >= 3.1: executemany(returning=True) leaves one result set per
    # statement, walked with nextset().
    cur.executemany(_INSERT_RAW, params, returning=True)
    ids: list[int] = []
    while True:
        row = cur.fetchone()
        ids.append(int(row[0]) if row else 0)
        if not cur.nextset():
            break

    if len(ids) != len(quotes):  # pragma: no cover - driver contract
        raise RuntimeError(
            f"quote_raw returned {len(ids)} ids for {len(quotes)} quotes; "
            "cannot attribute clean rows to their raw rows"
        )
    return {
        (itinerary_key(q), int(q.fare_inr_paise), q.source): i
        for q, i in zip(quotes, ids, strict=True)
    }


def _insert_clean(cur, rows, raw_ids: dict[tuple[str, int, str], int]) -> None:
    """Append normalised rows to quote_clean, each pointing at its raw row."""
    if not rows:
        return
    cur.executemany(
        _INSERT_CLEAN,
        [
            (
                raw_ids.get((c.itinerary_key, int(c.fare_inr_paise), c.raw_source), 0),
                c.collected_at, c.slot, c.raw_source, c.origin, c.destination,
                c.departure_date, c.horizon_days, c.cabin, c.fare_inr_paise, c.carrier,
                c.carrier_type, c.stops, c.departure_time_bucket, c.duration_minutes,
                c.is_refundable, c.baggage_included, c.itinerary_key, status, reason,
            )
            for c, status, reason in rows
        ],
    )
