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


# --- robots.txt status semantics (S3 findings) ------------------------------
#
# "No robots.txt exists" and "the server could not be reached" are different
# facts with opposite consequences. Conflating them either bans every API
# subdomain or grants permission after an outage.

from aerodex.compliance import (  # noqa: E402
    RobotsResponse,
    RobotsVerdict,
    normalise_robots,
)


def _fetch(status, text=""):
    return lambda url: RobotsResponse(status=status, text=text)


def test_404_means_no_rules_not_refusal():
    """RFC 9309 §2.3.1.3: a 4xx is 'unavailable' => unrestricted.
    Akasa's API host returns 404 here; refusing it would ban every tier-2
    endpoint on a technicality."""
    allowed, verdict = RobotsCache().check("https://api.test/v1/fares", _fetch(404))
    assert allowed is True
    assert verdict == RobotsVerdict.NO_RULES


@pytest.mark.parametrize("status", [400, 404, 410, 418, 451])
def test_other_4xx_also_unrestricted(status):
    assert RobotsCache().allows("https://x.test/a", _fetch(status)) is True


@pytest.mark.parametrize("status", [401, 403, 429])
def test_access_controlled_statuses_refuse(status):
    """A robots.txt behind auth or a throttle is a signal about automation,
    not an absence of one."""
    allowed, verdict = RobotsCache().check("https://x.test/a", _fetch(status))
    assert allowed is False
    assert verdict == RobotsVerdict.ACCESS_CONTROLLED


@pytest.mark.parametrize("status", [500, 502, 503])
def test_5xx_refuses(status):
    allowed, verdict = RobotsCache().check("https://x.test/a", _fetch(status))
    assert allowed is False
    assert verdict == RobotsVerdict.UNREACHABLE


def test_transport_failure_still_refuses():
    """The original rule, preserved: an outage is not permission."""
    def boom(url):
        raise OSError("connection reset")
    allowed, verdict = RobotsCache().check("https://x.test/a", boom)
    assert allowed is False
    assert verdict == RobotsVerdict.UNREACHABLE


def test_200_parses_normally():
    allowed, verdict = RobotsCache().check(
        "https://x.test/ok", _fetch(200, "User-agent: *\nDisallow: /private\n")
    )
    assert allowed is True and verdict == RobotsVerdict.PARSED


# --- malformed absolute-URL Disallow ----------------------------------------


def test_absolute_url_disallow_is_honoured():
    """SpiceJet publishes `Disallow: https://www.spicejet.com/api/v1`.
    robotparser never matches that against a path and reports 'allowed'.
    Reading permission out of a syntax error is what compliance.py prevents."""
    body = (
        "User-agent: *\n"
        "Disallow: \n"
        "Disallow: /cgi-bin/\n"
        "Disallow: https://www.spicejet.com/api/v1\n"
    )
    cache = RobotsCache()
    assert cache.allows("https://www.spicejet.com/api/v1/search", _fetch(200, body)) is False


def test_stdlib_parser_would_have_allowed_it():
    """Documents the exact trap this fix closes — if this ever starts failing,
    the stdlib changed and the workaround can be revisited."""
    import urllib.robotparser

    rp = urllib.robotparser.RobotFileParser()
    rp.parse(["User-agent: *", "Disallow: https://www.spicejet.com/api/v1"])
    assert rp.can_fetch(USER_AGENT, "https://www.spicejet.com/api/v1/search") is True


def test_normalise_rewrites_and_reports():
    lines, anomalies = normalise_robots(
        "User-agent: *\nDisallow: https://h.test/api/v1\nDisallow: /ok\n"
    )
    assert "Disallow: /api/v1" in lines
    assert anomalies == ["Disallow: https://h.test/api/v1"]


def test_normalise_leaves_valid_directives_untouched():
    body = "User-agent: *\nDisallow: /a\nAllow: /b\nSitemap: https://h.test/sitemap.xml\n"
    lines, anomalies = normalise_robots(body)
    assert anomalies == []
    assert "Sitemap: https://h.test/sitemap.xml" in lines, "Sitemap URLs must not be rewritten"


def test_anomalies_are_recorded_for_reporting():
    cache = RobotsCache()
    cache.allows("https://s.test/x", _fetch(200, "User-agent: *\nDisallow: https://s.test/api\n"))
    assert cache.anomalies["https://s.test"] == ["Disallow: https://s.test/api"]


def test_unaffected_paths_still_allowed_on_malformed_file():
    """The fix must disallow the named path, not the whole host."""
    body = "User-agent: *\nDisallow: https://s.test/api/v1\n"
    assert RobotsCache().allows("https://s.test/public/page", _fetch(200, body)) is True


def test_empty_disallow_does_not_grant_blanket_permission():
    """SpiceJet's live file opens with a bare `Disallow:`. urllib.robotparser
    turns that into allow-everything and — matching first-rule-wins rather than
    RFC 9309's most-specific-match — lets it shadow every later rule."""
    body = (
        "User-agent: *\n"
        "Disallow: \n"
        "Disallow: /cgi-bin/\n"
        "Disallow: https://www.spicejet.com/api/v1\n"
    )
    cache = RobotsCache()
    fetch = _fetch(200, body)
    assert cache.allows("https://www.spicejet.com/cgi-bin/x", fetch) is False
    assert cache.allows("https://www.spicejet.com/api/v1/search", fetch) is False
    # ...while genuinely unrestricted paths stay allowed
    assert cache.allows("https://www.spicejet.com/about", fetch) is True


def test_empty_disallow_is_reported_as_an_anomaly():
    cache = RobotsCache()
    cache.allows("https://s2.test/x", _fetch(200, "User-agent: *\nDisallow: \n"))
    assert any("empty Disallow" in a for a in cache.anomalies["https://s2.test"])


def test_blank_line_after_user_agent_does_not_discard_rules():
    """ixigo writes `User-agent: *`, a blank line, then its Disallow rules.
    urllib.robotparser treats the blank line as end-of-record and parses ZERO
    entries, making every rule invisible. RFC 9309 and Google delimit groups by
    the User-agent line, not by blank lines."""
    body = "# a comment\nUser-agent: *\n\nDisallow: /api/\nDisallow: /flights/search\n"
    cache = RobotsCache()
    fetch = _fetch(200, body)
    assert cache.allows("https://www.ixigo.com/api/x", fetch) is False
    assert cache.allows("https://www.ixigo.com/flights/search", fetch) is False
    assert cache.allows("https://www.ixigo.com/cheap-flights/del-bom", fetch) is True


def test_stdlib_would_have_discarded_those_rules():
    """Documents the trap; if this starts failing the stdlib was fixed."""
    import urllib.robotparser

    rp = urllib.robotparser.RobotFileParser()
    rp.parse(["User-agent: *", "", "Disallow: /api/"])
    assert rp.entries == [] and rp.default_entry is None
    assert rp.can_fetch(USER_AGENT, "https://h.test/api/x") is True


def test_blank_line_removal_preserves_per_agent_groups():
    """Removing blank lines must not merge one agent's rules into another's."""
    body = (
        "User-agent: *\n\nDisallow: /a\n\n"
        "User-agent: BadBot\nDisallow: /\n"
    )
    cache = RobotsCache()
    fetch = _fetch(200, body)
    assert cache.allows("https://g.test/a", fetch) is False   # ours, from group 1
    assert cache.allows("https://g.test/b", fetch) is True    # not BadBot's blanket ban


# --- RFC 9309 matching semantics --------------------------------------------

from aerodex.compliance import RobotsRules  # noqa: E402


def _rules(*lines):
    return RobotsRules.parse(list(lines))


@pytest.mark.parametrize("path,allowed", [
    ("/flights/search", False),
    ("/flights/search?from=DEL", False),
    ("/flights/search/results", False),
    ("/flights/delhi-mumbai", True),
])
def test_star_wildcard_in_path(path, allowed):
    """Cleartrip and EaseMyTrip both rely on `Disallow: /path*`."""
    r = _rules("User-agent: *", "Disallow: /flights/search*")
    assert r.can_fetch(USER_AGENT, "https://h.test" + path) is allowed


@pytest.mark.parametrize("path,allowed", [("/x", False), ("/xy", True), ("/x/y", True)])
def test_dollar_anchor(path, allowed):
    r = _rules("User-agent: *", "Disallow: /x$")
    assert r.can_fetch(USER_AGENT, "https://h.test" + path) is allowed


def test_most_specific_match_wins_not_first():
    """RFC 9309 §2.2.2. The stdlib returns the first matching rule, which
    inverts the answer whenever a narrow Allow sits under a broad Disallow."""
    r = _rules("User-agent: *", "Disallow: /a/", "Allow: /a/public/")
    assert r.can_fetch(USER_AGENT, "https://h.test/a/private") is False
    assert r.can_fetch(USER_AGENT, "https://h.test/a/public/x") is True


def test_allow_wins_equal_length_tie():
    r = _rules("User-agent: *", "Disallow: /p", "Allow: /p")
    assert r.can_fetch(USER_AGENT, "https://h.test/p") is True


def test_query_string_is_part_of_the_match():
    r = _rules("User-agent: *", "Disallow: /*?appcode=")
    assert r.can_fetch(USER_AGENT, "https://h.test/f?appcode=1") is False
    assert r.can_fetch(USER_AGENT, "https://h.test/f?other=1") is True


def test_named_agent_group_beats_wildcard_group():
    r = _rules("User-agent: *", "Disallow: /", "User-agent: aerodex", "Allow: /")
    assert r.can_fetch(USER_AGENT, "https://h.test/anything") is True


def test_other_agents_blanket_ban_does_not_apply_to_us():
    r = _rules("User-agent: *", "Allow: /", "User-agent: BadBot", "Disallow: /")
    assert r.can_fetch(USER_AGENT, "https://h.test/x") is True


def test_no_matching_rule_means_allowed():
    r = _rules("User-agent: *", "Disallow: /private")
    assert r.can_fetch(USER_AGENT, "https://h.test/public") is True


def test_comments_are_stripped():
    r = _rules("User-agent: *  # everyone", "Disallow: /a  # secret")
    assert r.can_fetch(USER_AGENT, "https://h.test/a") is False
