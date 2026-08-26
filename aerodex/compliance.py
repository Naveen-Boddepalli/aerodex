"""Compliance rules as runtime assertions — plan §7.

The SIH pitch rests on these being true. They live here, enforced at run time,
so that violating one requires deliberately editing a file called
``compliance.py`` rather than quietly adding a header somewhere.

Every acquisition path must route through :func:`assert_request_allowed` before
a request leaves the process. There is no bypass flag, on purpose.
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass, field
from enum import StrEnum
from urllib.parse import urlparse

from aerodex import __version__

# --- Constants the pitch depends on -----------------------------------------

#: Minimum seconds between two requests to the same host (plan §7).
MIN_INTERVAL_PER_HOST_S: float = 20.0

#: User-Agent identifies the project and links to the repo (plan §7).
REPO_URL = "https://github.com/Naveen-Boddepalli/aerodex"
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


@dataclass(frozen=True)
class RobotsResponse:
    """What the server said when asked for robots.txt.

    Status is carried explicitly because "no robots.txt exists" and "the server
    could not be reached" are different facts with opposite consequences, and a
    bare response body cannot tell them apart.
    """

    status: int
    text: str = ""


#: 4xx codes that mean "access is controlled here", not "no rules exist".
#: RFC 9309 §2.3.1.3 permits treating any 4xx as unrestricted, but a robots.txt
#: behind auth or a rate limiter is a signal about automation, not an absence of
#: one, so these stay disallowed.
RESTRICTIVE_STATUSES = frozenset({401, 403, 429})


class RobotsVerdict(StrEnum):
    """Why a host was allowed or refused. Recorded so decisions are auditable."""

    PARSED = "parsed"                  # 2xx: real rules, applied
    NO_RULES = "no_rules"              # 4xx: RFC 9309 "unavailable" => unrestricted
    ACCESS_CONTROLLED = "access_controlled"   # 401/403/429 => refuse
    UNREACHABLE = "unreachable"        # 5xx or transport failure => refuse
    MALFORMED_INTENT = "malformed_intent"     # absolute-URL Disallow => refuse path


def normalise_robots(body: str) -> tuple[list[str], list[str]]:
    """Rewrite malformed absolute-URL ``Disallow`` directives to path form.

    RFC 9309 requires a ``Disallow`` value to be a path. Some sites write a full
    URL instead — SpiceJet publishes ``Disallow: https://www.spicejet.com/api/v1``.
    ``urllib.robotparser`` compares that literal against request *paths*, never
    matches, and silently reports the URL as allowed.

    The intent is unambiguous, so the malformed line is rewritten to its path and
    honoured. Reading permission out of a syntax error is exactly the move this
    module exists to prevent.

    It also drops **empty ``Disallow:`` lines**, which are the more dangerous
    defect. Per RFC 9309 an empty value imposes no restriction — it is a no-op.
    ``urllib.robotparser`` instead turns it into an allow-everything rule at
    that position and, because the stdlib matches *first rule wins* rather than
    RFC 9309's *most specific match*, it then shadows every rule after it.
    SpiceJet's live robots.txt opens with exactly that line, so parsed verbatim
    it grants blanket permission to the whole site including ``/cgi-bin/``.

    The residual divergence from RFC 9309 (first-match vs longest-match) only
    ever makes us refuse more than a conformant parser would, which is the safe
    direction, so it is left alone.

    Returns:
        ``(normalised_lines, anomalies)`` — anomalies are the original lines,
        for logging and for the S3 source report.
    """
    out: list[str] = []
    anomalies: list[str] = []
    dropped_blanks = 0
    for line in body.splitlines():
        stripped = line.strip()

        # Blank lines are dropped before parsing. RFC 9309 and Google both
        # delimit a group by its User-agent line; blank lines are ignorable
        # whitespace. urllib.robotparser instead treats a blank line as the end
        # of a record, so a file that writes
        #     User-agent: *
        #     <blank>
        #     Disallow: /api/
        # parses to ZERO entries and every rule silently vanishes. ixigo's live
        # robots.txt has exactly that shape. Removing blank lines is safe: a
        # following User-agent line still closes the previous group correctly.
        if not stripped:
            dropped_blanks += 1
            continue

        field, sep, value = stripped.partition(":")
        name = field.strip().lower()

        if sep and name == "disallow" and not value.strip():
            anomalies.append(f"{stripped}  (empty Disallow dropped: would shadow later rules)")
            continue
        if sep and name in {"disallow", "allow"} and "://" in value:
            path = urlparse(value.strip()).path or "/"
            out.append(f"{field.strip()}: {path}")
            anomalies.append(stripped)
            continue
        out.append(line)
    return out, anomalies


# --- RFC 9309 matcher -------------------------------------------------------
#
# urllib.robotparser is not used. Measured against real files from the S3 spike
# it failed four independent ways, each one turning a Disallow into an allow:
#
#   1. a blank line between `User-agent:` and its rules discards every rule
#   2. an empty `Disallow:` becomes allow-everything and shadows later rules
#   3. `*` and `$` path wildcards (RFC 9309 §2.2.3) are unimplemented, so
#      `Disallow: /flights/search*` matches nothing at all
#   4. rules match first-wins instead of RFC 9309 §2.2.2 most-specific-wins
#
# Every failure mode grants access the site refused. This matcher implements
# §2.2.2 (most specific match, Allow wins ties) and §2.2.3 (`*`, `$`).


@dataclass(frozen=True)
class _Rule:
    allow: bool
    pattern: str
    regex: re.Pattern[str]


def _compile_pattern(pattern: str) -> re.Pattern[str]:
    """RFC 9309 §2.2.3: ``*`` matches any sequence, trailing ``$`` anchors."""
    anchored = pattern.endswith("$")
    body = pattern[:-1] if anchored else pattern
    out = "".join(".*" if ch == "*" else re.escape(ch) for ch in body)
    return re.compile("^" + out + ("$" if anchored else ""))


class RobotsRules:
    """Parsed robots.txt with RFC 9309 matching semantics."""

    def __init__(self, groups: dict[str, list[_Rule]]) -> None:
        self.groups = groups

    @classmethod
    def parse(cls, lines: list[str]) -> RobotsRules:
        groups: dict[str, list[_Rule]] = {}
        current: list[str] = []
        expecting_agents = True

        for raw in lines:
            line = raw.split("#", 1)[0].strip()
            if not line:
                continue
            field, sep, value = line.partition(":")
            if not sep:
                continue
            name, value = field.strip().lower(), value.strip()

            if name == "user-agent":
                if not expecting_agents:
                    current = []
                    expecting_agents = True
                current.append(value.lower())
                groups.setdefault(value.lower(), [])
            elif name in {"allow", "disallow"}:
                expecting_agents = False
                if not value:
                    continue  # empty value is a no-op, never a blanket grant
                rule = _Rule(name == "allow", value, _compile_pattern(value))
                for agent in current:
                    groups[agent].append(rule)
        return cls(groups)

    def _group_for(self, user_agent: str) -> list[_Rule]:
        """Longest matching product token wins; `*` is the fallback."""
        ua = user_agent.lower()
        best, best_len = None, -1
        for agent, rules in self.groups.items():
            if agent == "*":
                continue
            if agent and agent in ua and len(agent) > best_len:
                best, best_len = rules, len(agent)
        if best is not None:
            return best
        return self.groups.get("*", [])

    def can_fetch(self, user_agent: str, url: str) -> bool:
        parsed = urlparse(url)
        path = parsed.path or "/"
        if parsed.query:
            path = f"{path}?{parsed.query}"

        winner: _Rule | None = None
        for rule in self._group_for(user_agent):
            if rule.regex.match(path) and (
                winner is None
                or len(rule.pattern) > len(winner.pattern)
                # RFC 9309 §2.2.2: on equal specificity, Allow wins
                or (len(rule.pattern) == len(winner.pattern) and rule.allow)
            ):
                winner = rule
        return True if winner is None else winner.allow


@dataclass
class RobotsCache:
    """Parses and honours robots.txt per source, checked at run time (plan §7).

    Status handling, deliberately not uniform:

    * **2xx** — parse and apply the rules.
    * **404/410 and other 4xx** — the server is telling us no robots.txt exists.
      RFC 9309 §2.3.1.3 treats that as unrestricted, and so do we. This matters:
      API subdomains routinely return 404 here, and refusing them all would make
      every tier-2 endpoint permanently unusable on a technicality.
    * **401/403/429** — access is controlled or we are being throttled. Refuse.
    * **5xx or transport failure** — unreachable. Refuse. An unreachable
      robots.txt is not permission; it is the absence of permission.
    """

    ttl_s: float = 3600.0
    _entries: dict[str, tuple[float, RobotsRules | None, str]] = field(
        default_factory=dict
    )
    #: Malformed directives seen per origin, for reporting.
    anomalies: dict[str, list[str]] = field(default_factory=dict)

    @staticmethod
    def _coerce(result) -> RobotsResponse:
        """Accept a RobotsResponse, or a plain body string meaning HTTP 200."""
        if isinstance(result, RobotsResponse):
            return result
        return RobotsResponse(status=200, text=str(result))

    def _lookup(self, url: str, fetch) -> tuple[RobotsRules | None, str]:
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        cached = self._entries.get(origin)
        if cached and (time.monotonic() - cached[0]) < self.ttl_s:
            return cached[1], cached[2]

        try:
            resp = self._coerce(fetch(f"{origin}/robots.txt"))
        except Exception:
            rp, verdict = None, RobotsVerdict.UNREACHABLE
        else:
            if resp.status in RESTRICTIVE_STATUSES:
                rp, verdict = None, RobotsVerdict.ACCESS_CONTROLLED
            elif 500 <= resp.status <= 599:
                rp, verdict = None, RobotsVerdict.UNREACHABLE
            elif 400 <= resp.status <= 499:
                rp, verdict = None, RobotsVerdict.NO_RULES
            elif 200 <= resp.status <= 299:
                lines, anomalies = normalise_robots(resp.text)
                if anomalies:
                    self.anomalies[origin] = anomalies
                rp = RobotsRules.parse(lines)
                verdict = RobotsVerdict.PARSED
            else:
                rp, verdict = None, RobotsVerdict.UNREACHABLE

        self._entries[origin] = (time.monotonic(), rp, verdict)
        return rp, verdict

    def check(self, url: str, fetch) -> tuple[bool, str]:
        """Return ``(allowed, verdict)`` so callers can log *why*."""
        rp, verdict = self._lookup(url, fetch)
        if verdict == RobotsVerdict.NO_RULES:
            return True, verdict
        if rp is None:
            return False, verdict
        allowed = rp.can_fetch(USER_AGENT, url)
        if not allowed and self.anomalies.get(f"{urlparse(url).scheme}://{urlparse(url).netloc}"):
            return False, RobotsVerdict.MALFORMED_INTENT
        return allowed, verdict

    def allows(self, url: str, fetch) -> bool:
        return self.check(url, fetch)[0]


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
