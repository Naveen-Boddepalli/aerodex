"""Adapter contract — plan §5.2, §6.

One file per source under ``adapters/``; failures are isolated there. The
contract is deliberately narrow: ``search() -> parse() -> emit()``. An adapter
that needs more than this is usually an adapter reaching for tier 3 when a
tier-2 endpoint exists.

The three-tier ladder (plan §5.2), cheapest first:

  1. documented public JSON endpoint  -> httpx
  2. internal XHR endpoint + headers  -> httpx        (10-50x cheaper than 3)
  3. full Playwright render                            (last resort)

On 2 OCPU the difference between starting at tier 2 and starting at tier 3 is
a panel of 60 routes versus a panel of 10.
"""

from __future__ import annotations

import hashlib
import json
from abc import ABC, abstractmethod
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import IntEnum
from typing import Any

from aerodex.compliance import (
    USER_AGENT,
    HostRateLimiter,
    RobotsCache,
    assert_no_personal_data,
    assert_request_allowed,
)


class Tier(IntEnum):
    """Acquisition tier. Lower is cheaper and more stable."""

    PUBLIC_JSON = 1
    INTERNAL_XHR = 2
    RENDER = 3


@dataclass(frozen=True)
class SearchRequest:
    """One stratum-slot's worth of work."""

    origin: str
    destination: str
    departure_date: date
    horizon_days: int
    slot: str
    cabin: str = "economy"

    @property
    def stratum(self) -> str:
        return f"{self.origin}-{self.destination}@{self.horizon_days}d"


@dataclass
class Quote:
    """One parsed fare observation, pre-normalisation.

    ``fare_inr_paise`` is in minor units on purpose: floats do not belong
    anywhere near a published price statistic.
    """

    source: str
    request: SearchRequest
    collected_at: datetime          # the ACTUAL collection time, never nominal
    fare_inr_paise: int
    carrier: str | None = None
    flight_number: str | None = None
    stops: int | None = None
    departure_time: str | None = None
    arrival_time: str | None = None
    duration_minutes: int | None = None
    fare_brand: str | None = None
    is_refundable: bool | None = None
    baggage_included: bool | None = None
    seats_remaining: int | None = None
    aircraft_type: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)
    raw_sha256: str = ""
    tier: Tier = Tier.PUBLIC_JSON

    def validate(self) -> None:
        """Structural checks that must hold before a quote reaches the DB."""
        assert_no_personal_data(self.payload)
        if self.fare_inr_paise <= 0:
            raise ValueError(f"non-positive fare from {self.source}: {self.fare_inr_paise}")
        if not self.raw_sha256:
            raise ValueError("raw_sha256 is required; M6 depends on it")


class AcquisitionError(RuntimeError):
    """Recoverable adapter failure. The source is degraded, not the run."""


class SourceBlocked(AcquisitionError):
    """The source refused us. Drop the source and publish the coverage ratio.

    Plan §5.2: redundancy across sources instead of evasion. Raising this is
    the correct response to a block — never retry harder, never disguise.
    """


class Adapter(ABC):
    """Base class for a fare source.

    Subclasses implement :meth:`search` and :meth:`parse`. They must not make
    network calls except through :meth:`fetch`, which is the only path that
    passes the compliance gate.
    """

    #: Stable source identifier; becomes the ``source`` column and metric label.
    name: str = ""
    #: Bumped whenever parsing changes, so archived rows stay interpretable.
    version: str = "0.1.0"
    #: The lowest tier this adapter has been shown to work at.
    tier: Tier = Tier.PUBLIC_JSON
    #: Host used for robots.txt and pacing.
    base_url: str = ""

    def __init__(
        self,
        *,
        limiter: HostRateLimiter | None = None,
        robots: RobotsCache | None = None,
    ) -> None:
        if not self.name:
            raise ValueError(f"{type(self).__name__} must set a name")
        self.limiter = limiter or HostRateLimiter()
        self.robots = robots or RobotsCache()

    # -- the only network path ------------------------------------------------

    def headers(self) -> dict[str, str]:
        """Realistic headers that still identify the project (plan §7)."""
        return {
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/html;q=0.9",
            "Accept-Language": "en-IN,en;q=0.9",
        }

    def fetch(self, url: str, *, client, fetch_robots) -> Any:
        """Compliance-gated fetch. Blocks for pacing, raises on any violation."""
        headers = self.headers()
        assert_request_allowed(
            url,
            headers,
            robots=self.robots,
            limiter=self.limiter,
            fetch_robots=fetch_robots,
        )
        return client(url, headers=headers)

    @staticmethod
    def hash_raw(body: str | bytes) -> str:
        """SHA-256 of the raw response. Archived; the body itself is not (§7)."""
        data = body.encode("utf-8") if isinstance(body, str) else body
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def canonical_payload(obj: Any) -> dict:
        """Payload stored in quote_raw.payload — parsed JSON only, never HTML."""
        return json.loads(json.dumps(obj, sort_keys=True, default=str))

    # -- the contract ---------------------------------------------------------

    @abstractmethod
    def search(self, request: SearchRequest, **kwargs) -> Any:
        """Retrieve the raw response for one stratum-slot."""

    @abstractmethod
    def parse(self, raw: Any, request: SearchRequest, collected_at: datetime) -> Iterable[Quote]:
        """Turn a raw response into Quotes. Must not perform I/O."""

    def emit(self, request: SearchRequest, collected_at: datetime, **kwargs) -> list[Quote]:
        """search -> parse -> validate. The method the collector calls."""
        raw = self.search(request, **kwargs)
        quotes = list(self.parse(raw, request, collected_at))
        for q in quotes:
            q.validate()
        return quotes

    def canary(self) -> bool:
        """Live structural check — does this source still look like itself?

        Run by tests/canary; a failure degrades the source before a slot is
        silently lost. Default is 'unknown', which counts as a failure.
        """
        return False
