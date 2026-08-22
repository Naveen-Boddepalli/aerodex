"""Normalisation: quote_raw -> quote_clean (plan §5.3).

The job is to make two quotes for the same product comparable across sources
and across days. The itinerary key is the crux: too loose and unrelated fares
get matched (understating volatility), too tight and nothing matches at all
(collapsing the matched sample and forcing imputation).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from aerodex.acquire.base import Quote

#: Departure buckets, a hedonic characteristic (config/methodology.yaml).
_BUCKETS = [
    (0, 6, "early_morning"),
    (6, 12, "morning"),
    (12, 17, "afternoon"),
    (17, 21, "evening"),
    (21, 24, "night"),
]

LOW_COST_CARRIERS = frozenset({"6E", "SG", "QP", "G8", "IX"})


def departure_time_bucket(hhmm: str | None) -> str | None:
    """Map a HH:MM departure to its bucket. Returns None on unparseable input
    rather than guessing — a wrong bucket corrupts the hedonic model."""
    if not hhmm:
        return None
    try:
        hour = int(str(hhmm).split(":")[0])
    except (ValueError, IndexError):
        return None
    if not 0 <= hour <= 23:
        return None
    return next(name for lo, hi, name in _BUCKETS if lo <= hour < hi)


def carrier_type(carrier: str | None) -> str | None:
    if not carrier:
        return None
    return "low_cost" if carrier.upper() in LOW_COST_CARRIERS else "full_service"


def itinerary_key(q: Quote) -> str:
    """Stable identity of the product being priced.

    Keyed on the **booking horizon**, not the departure date. This is the crux
    of a constant-horizon panel: the matched product is "flight 6E1033, priced
    7 days before departure", and its price today is compared with its price
    7-days-before-departure yesterday. Those two observations necessarily have
    *different* departure dates — so including the departure date here would
    make every item unmatched, collapse the matched sample to zero, and pin the
    index at its base value forever.

    Excludes fare and seats_remaining (they move; that is the signal) and the
    source (the same flight quoted by two sources is one product, and must
    dedup to a single observation).
    """
    r = q.request
    return "|".join(
        [
            r.origin,
            r.destination,
            f"h{r.horizon_days}",
            str(q.flight_number or q.carrier or "?"),
            str(q.stops if q.stops is not None else "?"),
            departure_time_bucket(q.departure_time) or "?",
            r.cabin,
        ]
    )


@dataclass
class CleanQuote:
    """A normalised observation, ready for quote_clean."""

    raw_source: str
    collected_at: datetime
    slot: str
    origin: str
    destination: str
    departure_date: str
    horizon_days: int
    cabin: str
    fare_inr_paise: int
    carrier: str | None
    carrier_type: str | None
    stops: int | None
    departure_time_bucket: str | None
    duration_minutes: int | None
    is_refundable: bool | None
    baggage_included: bool | None
    itinerary_key: str

    def as_row(self) -> dict:
        return {
            "source": self.raw_source,
            "collected_at": self.collected_at,
            "slot": self.slot,
            "origin": self.origin,
            "destination": self.destination,
            "departure_date": self.departure_date,
            "horizon_days": self.horizon_days,
            "cabin": self.cabin,
            "fare_inr_paise": self.fare_inr_paise,
            "carrier": self.carrier,
            "carrier_type": self.carrier_type,
            "stops": self.stops,
            "departure_time_bucket": self.departure_time_bucket,
            "duration_minutes": self.duration_minutes,
            "is_refundable": self.is_refundable,
            "baggage_included": self.baggage_included,
            "itinerary_key": self.itinerary_key,
        }


def normalise_quote(q: Quote) -> CleanQuote:
    r = q.request
    return CleanQuote(
        raw_source=q.source,
        collected_at=q.collected_at,
        slot=r.slot,
        origin=r.origin,
        destination=r.destination,
        departure_date=str(r.departure_date),
        horizon_days=r.horizon_days,
        cabin=r.cabin,
        fare_inr_paise=int(q.fare_inr_paise),
        carrier=q.carrier,
        carrier_type=carrier_type(q.carrier),
        stops=q.stops,
        departure_time_bucket=departure_time_bucket(q.departure_time),
        duration_minutes=q.duration_minutes,
        is_refundable=q.is_refundable,
        baggage_included=q.baggage_included,
        itinerary_key=itinerary_key(q),
    )


def normalise_quotes(quotes: list[Quote]) -> list[CleanQuote]:
    """Normalise and deduplicate.

    Dedup rule: for one (itinerary_key, collection slot), keep the **lowest**
    all-inclusive fare across sources. The index measures what a traveller
    would pay, and a traveller comparing sources pays the lowest offer.
    """
    best: dict[tuple[str, str], CleanQuote] = {}
    for q in quotes:
        c = normalise_quote(q)
        key = (c.itinerary_key, c.slot)
        if key not in best or c.fare_inr_paise < best[key].fare_inr_paise:
            best[key] = c
    return list(best.values())
