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
from aerodex.normalise import normalise_quotes
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
            _store(conn, adapter, quotes, valid, held)

    return report


def _store(conn, adapter: Adapter, raw_quotes, valid, held) -> None:
    """Write quote_raw (append-only) and quote_clean in one transaction."""
    with conn.cursor() as cur:
        for q in raw_quotes:
            cur.execute(
                """
                INSERT INTO quote_raw (collected_at, slot, source, origin, destination,
                    departure_date, horizon_days, cabin, fare_inr_paise, carrier,
                    flight_number, stops, duration_minutes, is_refundable,
                    baggage_included, seats_remaining, payload, raw_sha256,
                    adapter_version, acquisition_tier)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s)
                """,
                (
                    q.collected_at, q.request.slot, q.source, q.request.origin,
                    q.request.destination, q.request.departure_date, q.request.horizon_days,
                    q.request.cabin, q.fare_inr_paise, q.carrier, q.flight_number, q.stops,
                    q.duration_minutes, q.is_refundable, q.baggage_included,
                    q.seats_remaining, json.dumps(q.payload, sort_keys=True), q.raw_sha256,
                    adapter.version, int(q.tier),
                ),
            )

        for c in valid:
            _insert_clean(cur, c, "valid", None)
        for c, reason in held:
            _insert_clean(cur, c, "quarantined", reason)
    conn.commit()


def _insert_clean(cur, c, status: str, reason: str | None) -> None:
    cur.execute(
        """
        INSERT INTO quote_clean (raw_id, collected_at, slot, source, origin, destination,
            departure_date, horizon_days, cabin, fare_inr_paise, carrier, carrier_type,
            stops, departure_time_bucket, duration_minutes, is_refundable,
            baggage_included, itinerary_key, validation_status, quarantine_reason)
        VALUES (0,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::validation_status,%s)
        ON CONFLICT (itinerary_key, collected_at, source) DO NOTHING
        """,
        (
            c.collected_at, c.slot, c.raw_source, c.origin, c.destination, c.departure_date,
            c.horizon_days, c.cabin, c.fare_inr_paise, c.carrier, c.carrier_type, c.stops,
            c.departure_time_bucket, c.duration_minutes, c.is_refundable,
            c.baggage_included, c.itinerary_key, status, reason,
        ),
    )
