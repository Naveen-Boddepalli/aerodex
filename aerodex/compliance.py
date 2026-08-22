"""Compliance rules as runtime assertions — plan §7.

The SIH pitch rests on these being true. They live here, enforced at run time,
so that violating one requires deliberately editing a file called
``compliance.py`` rather than quietly adding a header somewhere.

Every acquisition path must route through :func:`assert_request_allowed` before
a request leaves the process. There is no bypass flag, on purpose.
"""

from __future__ import annotations

import threading
import time
import urllib.robotparser
from dataclasses import dataclass, field
from urllib.parse import urlparse

from aerodex import __version__

# --- Constants the pitch depends on -----------------------------------------

#: Minimum seconds between two requests to the same host (plan §7).
MIN_INTERVAL_PER_HOST_S: float = 20.0

#: User-Agent identifies the project and links to the repo (plan §7).
REPO_URL = "https://github.com/aerodex/aerodex"
USER_AGENT = (
    f"AeroDex/{__version__} (+{REPO_URL}; "
    "official-statistics research; contact via repo issues)"
)

#: Header names that would imply an authenticated session. Never permitted.
FORBIDDEN_HEADERS = frozenset(
    {"authorization", "cookie", "x-api-key", "x-auth-token", "proxy-authorization"}
)

#: Fields that would constitute personal data. Never collected, ever (plan §7).
FORBIDDEN_FIELDS = frozenset(
    {
        "passenger_name", "name", "email", "phone", "mobile", "pnr",
        "passport", "dob", "date_of_birth", "address", "payment", "card",
        "traveller_id", "user_id", "loyalty_number",
    }
)


class ComplianceError(RuntimeError):
    """Raised when an action would violate a rule in plan §7."""


# --- Rate limiting ----------------------------------------------------------


class HostRateLimiter:
    """Enforces a minimum interval between requests to the same host.

    Process-wide and thread-safe. Blocks rather than raising: the correct
    behaviour when pacing is to wait, not to drop the observation.
    """

    def __init__(self, min_interval_s: float = MIN_INTERVAL_PER_HOST_S) -> None:
        if min_interval_s < MIN_INTERVAL_PER_HOST_S:
            raise ComplianceError(
                f"min_interval_s={min_interval_s} is below the floor of "
                f"{MIN_INTERVAL_PER_HOST_S}s required by plan §7"
            )
        self._min_interval = min_interval_s
        self._last: dict[str, float] = {}
        self._lock = threading.Lock()

    def wait(self, url: str, *, sleep=time.sleep, clock=time.monotonic) -> float:
        """Block until this host may be contacted again. Returns seconds waited."""
        host = urlparse(url).netloc.lower()
        with self._lock:
            now = clock()
            earliest = self._last.get(host, float("-inf")) + self._min_interval
            delay = max(0.0, earliest - now)
            self._last[host] = now + delay
        if delay:
            sleep(delay)
        return delay


# --- robots.txt -------------------------------------------------------------


@dataclass
class RobotsCache:
    """Parses and honours robots.txt per source, checked at run time (plan §7).

    A fetch failure is treated as *disallowed*. An unreachable robots.txt is not
    permission; it is absence of permission.
    """

    ttl_s: float = 3600.0
    _entries: dict[str, tuple[float, urllib.robotparser.RobotFileParser | None]] = field(
        default_factory=dict
    )

    def _parser(self, url: str, fetch) -> urllib.robotparser.RobotFileParser | None:
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        cached = self._entries.get(origin)
        if cached and (time.monotonic() - cached[0]) < self.ttl_s:
            return cached[1]
        try:
            body = fetch(f"{origin}/robots.txt")
            rp = urllib.robotparser.RobotFileParser()
            rp.parse(body.splitlines())
        except Exception:
            rp = None  # unreachable => disallowed
        self._entries[origin] = (time.monotonic(), rp)
        return rp

    def allows(self, url: str, fetch) -> bool:
        rp = self._parser(url, fetch)
        if rp is None:
            return False
        return rp.can_fetch(USER_AGENT, url)


# --- The gate ---------------------------------------------------------------


def assert_no_auth(headers: dict[str, str]) -> None:
    """No authentication, no account creation, no login-obtained cookies."""
    offending = sorted(k for k in headers if k.lower() in FORBIDDEN_HEADERS)
    if offending:
        raise ComplianceError(
            f"authenticated request blocked: header(s) {offending} are forbidden by plan §7"
        )


def assert_identifies_project(headers: dict[str, str]) -> None:
    """User-Agent must identify the project and link to the repo."""
    ua = next((v for k, v in headers.items() if k.lower() == "user-agent"), "")
    if not ua.startswith("AeroDex/") or REPO_URL not in ua:
        raise ComplianceError(
            "User-Agent must identify AeroDex and link to the repo (plan §7); "
            f"got {ua!r}. Use compliance.USER_AGENT."
        )


def assert_no_personal_data(record: dict) -> None:
    """No personal data collected, ever — fares and itinerary attributes only."""
    offending = sorted(k for k in record if k.lower() in FORBIDDEN_FIELDS)
    if offending:
        raise ComplianceError(
            f"record contains personal-data field(s) {offending}; forbidden by plan §7"
        )


def assert_request_allowed(
    url: str,
    headers: dict[str, str],
    *,
    robots: RobotsCache,
    limiter: HostRateLimiter,
    fetch_robots,
) -> None:
    """The single gate every outbound acquisition request passes through.

    Raises :class:`ComplianceError` on any violation; blocks for pacing.
    """
    assert_no_auth(headers)
    assert_identifies_project(headers)
    if not robots.allows(url, fetch_robots):
        raise ComplianceError(f"robots.txt disallows {url} for {USER_AGENT}")
    limiter.wait(url)


def redistributable(payload: dict) -> dict:
    """Raw third-party page content is not redistributed — only derived stats.

    Strips any raw-body field, keeping the hash that preserves M6.
    """
    return {k: v for k, v in payload.items() if k not in {"raw_body", "raw_html", "raw_text"}}
