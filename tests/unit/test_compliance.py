"""Plan §7 rules. If one of these fails, the SIH pitch has become untrue."""

import pytest

from aerodex.compliance import (
    USER_AGENT,
    ComplianceError,
    HostRateLimiter,
    RobotsCache,
    assert_identifies_project,
    assert_no_auth,
    assert_no_personal_data,
    assert_request_allowed,
    redistributable,
)

OK = {"User-Agent": USER_AGENT}
ALLOW_ALL = "User-agent: *\nAllow: /\n"


@pytest.mark.parametrize("header", ["Authorization", "Cookie", "X-API-Key", "x-auth-token"])
def test_auth_headers_blocked(header):
    with pytest.raises(ComplianceError):
        assert_no_auth({**OK, header: "secret"})


def test_clean_headers_pass():
    assert_no_auth(OK)
    assert_identifies_project(OK)


@pytest.mark.parametrize("ua", ["curl/8.0", "Mozilla/5.0 (Windows NT 10.0)", ""])
def test_user_agent_must_identify_project(ua):
    with pytest.raises(ComplianceError):
        assert_identifies_project({"User-Agent": ua})


def test_user_agent_links_to_repo():
    assert "github.com" in USER_AGENT and USER_AGENT.startswith("AeroDex/")


@pytest.mark.parametrize("field", ["email", "passenger_name", "pnr", "phone", "card"])
def test_personal_data_blocked(field):
    with pytest.raises(ComplianceError):
        assert_no_personal_data({"fare_inr_paise": 500000, field: "x"})


def test_itinerary_attributes_allowed():
    assert_no_personal_data(
        {"fare_inr_paise": 500000, "carrier": "6E", "stops": 0, "duration_minutes": 125}
    )


def test_rate_limiter_enforces_20s_between_same_host():
    slept = []
    lim = HostRateLimiter()
    lim.wait("https://a.test/1", sleep=slept.append)
    lim.wait("https://a.test/2", sleep=slept.append)
    assert slept == [pytest.approx(20.0, abs=0.5)]


def test_rate_limiter_does_not_pace_across_hosts():
    slept = []
    lim = HostRateLimiter()
    lim.wait("https://a.test/1", sleep=slept.append)
    lim.wait("https://b.test/1", sleep=slept.append)
    assert slept == []


def test_rate_limiter_floor_cannot_be_lowered():
    """The 20s floor is not configurable below the plan's value."""
    with pytest.raises(ComplianceError):
        HostRateLimiter(0.1)


def test_unreachable_robots_means_disallowed():
    """Absence of robots.txt is not permission."""
    def boom(url):
        raise OSError("network down")
    assert RobotsCache().allows("https://x.test/search", boom) is False


def test_robots_disallow_is_honoured():
    cache = RobotsCache()
    robots = "User-agent: *\nDisallow: /search\n"
    assert cache.allows("https://y.test/search", lambda u: robots) is False


def test_robots_allow_passes():
    assert RobotsCache().allows("https://z.test/api", lambda u: ALLOW_ALL) is True


def test_full_gate_blocks_disallowed_url():
    with pytest.raises(ComplianceError, match="robots.txt"):
        assert_request_allowed(
            "https://q.test/search",
            OK,
            robots=RobotsCache(),
            limiter=HostRateLimiter(),
            fetch_robots=lambda u: "User-agent: *\nDisallow: /\n",
        )


def test_raw_body_is_not_redistributable():
    """Raw third-party content is not republished; the hash that preserves M6 is."""
    out = redistributable({"raw_body": "<html>", "raw_sha256": "ab" * 32, "fare_inr_paise": 1})
    assert "raw_body" not in out and out["raw_sha256"] == "ab" * 32
