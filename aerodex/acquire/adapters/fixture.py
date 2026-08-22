"""Deterministic offline adapter — NOT a data source.

Exists so the full path (scheduler -> adapter -> normalise -> validate ->
store -> index -> artifact) can be built and tested before Phase 0 spike S3
determines which real sources are usable. It makes no network calls.

Quotes it produces carry ``source='fixture'`` and must never reach a published
index: the publisher refuses a panel whose only source is this one.
"""

from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any, Iterable

from aerodex.acquire.base import Adapter, Quote, SearchRequest, Tier

CARRIERS = [("6E", "low_cost"), ("AI", "full_service"), ("UK", "full_service"),
            ("SG", "low_cost"), ("QP", "low_cost")]


class FixtureAdapter(Adapter):
    name = "fixture"
    version = "0.1.0"
    tier = Tier.PUBLIC_JSON
    base_url = "https://fixture.invalid"

    #: Refuses to be treated as a real source by the publisher.
    is_synthetic = True

    def search(self, request: SearchRequest, **kwargs) -> Any:
        """Derive a stable pseudo-response from the request. No I/O.

        The flight *roster* is seeded on the route and horizon only, so the
        same flight numbers recur every collection day — which is how real
        schedules behave, and what the matched-model comparison needs. Only
        the *fare* moves with the departure date. Seeding the roster on the
        date instead would invent a new airline schedule daily and leave the
        matched sample empty.
        """
        roster_seed = hashlib.sha256(
            f"{request.origin}{request.destination}{request.horizon_days}"
            f"{request.slot}".encode()
        ).digest()
        # separate stream for the price, so fares move while the roster does not
        price_seed = hashlib.sha256(
            f"{request.origin}{request.destination}{request.horizon_days}"
            f"{request.departure_date}".encode()
        ).digest()
        seed = roster_seed

        itineraries = []
        for i in range(6):
            carrier, carrier_type = CARRIERS[seed[i] % len(CARRIERS)]
            stops = 0 if seed[i + 6] % 4 else 1
            # base fare falls as the booking horizon lengthens
            base = (
                380000
                + (roster_seed[i + 12] % 90) * 2500
                + max(0, (30 - request.horizon_days)) * 8000
                # date-varying component: the movement the index is meant to measure
                + (price_seed[i] % 60) * 1800
            )
            itineraries.append(
                {
                    "carrier": carrier,
                    "carrier_type": carrier_type,
                    "flight_number": f"{carrier}{1000 + seed[i + 18] % 900}",
                    "total_fare_paise": int(base * (1 + 0.05 * i) * (1 + stops * 0.12)),
                    "stops": stops,
                    "departure_time": f"{6 + (seed[i] % 16):02d}:{(seed[i] % 12) * 5:02d}",
                    "duration_minutes": 105 + stops * 70 + seed[i + 6] % 40,
                    "refundable": bool(seed[i + 12] % 3 == 0),
                    "baggage_included": carrier_type == "full_service",
                    "seats_remaining": 1 + seed[i + 18] % 9,
                }
            )
        return {"itineraries": itineraries, "currency": "INR", "all_inclusive": True}

    def parse(
        self, raw: Any, request: SearchRequest, collected_at: datetime
    ) -> Iterable[Quote]:
        body = self.canonical_payload(raw)
        raw_hash = self.hash_raw(str(sorted(body.items())))
        for it in body["itineraries"]:
            yield Quote(
                source=self.name,
                request=request,
                collected_at=collected_at,
                fare_inr_paise=int(it["total_fare_paise"]),
                carrier=it["carrier"],
                flight_number=it["flight_number"],
                stops=int(it["stops"]),
                departure_time=it["departure_time"],
                duration_minutes=int(it["duration_minutes"]),
                is_refundable=bool(it["refundable"]),
                baggage_included=bool(it["baggage_included"]),
                seats_remaining=int(it["seats_remaining"]),
                payload=it,
                raw_sha256=raw_hash,
                tier=self.tier,
            )

    def canary(self) -> bool:
        return True
