"""Normalisation rules — the itinerary key is the crux (plan §5.5)."""

from datetime import date, datetime, timedelta, timezone

import pytest

from aerodex.acquire.base import Quote, SearchRequest
from aerodex.normalise import departure_time_bucket, itinerary_key, normalise_quotes

NOW = datetime(2026, 9, 1, 7, 0, tzinfo=timezone.utc)


def _q(*, horizon=7, coll_date=date(2026, 9, 1), flight="6E1033", fare=500000,
       stops=0, dep="08:30", source="fixture"):
    req = SearchRequest("DEL", "BOM", coll_date + timedelta(days=horizon), horizon, "morning")
    return Quote(source=source, request=req, collected_at=NOW, fare_inr_paise=fare,
                 carrier=flight[:2], flight_number=flight, stops=stops,
                 departure_time=dep, raw_sha256="x" * 64)


def test_same_flight_same_horizon_matches_across_collection_days():
    """The constant-horizon panel depends on this: different departure dates,
    same product. If this breaks, the index flatlines at its base value."""
    day1 = _q(coll_date=date(2026, 9, 1))
    day2 = _q(coll_date=date(2026, 9, 2))
    assert day1.request.departure_date != day2.request.departure_date
    assert itinerary_key(day1) == itinerary_key(day2)


def test_different_horizons_do_not_collide():
    """Same flight number at 7d and 14d are different products, and would
    otherwise collide on (itinerary_key, collected_at, source)."""
    assert itinerary_key(_q(horizon=7)) != itinerary_key(_q(horizon=14))


def test_key_ignores_fare_and_source():
    assert itinerary_key(_q(fare=100000)) == itinerary_key(_q(fare=900000))
    assert itinerary_key(_q(source="a")) == itinerary_key(_q(source="b"))


def test_key_distinguishes_stops_and_time_bucket():
    assert itinerary_key(_q(stops=0)) != itinerary_key(_q(stops=1))
    assert itinerary_key(_q(dep="08:30")) != itinerary_key(_q(dep="21:30"))


@pytest.mark.parametrize("hhmm,expected", [
    ("00:15", "early_morning"), ("05:59", "early_morning"), ("06:00", "morning"),
    ("11:59", "morning"), ("12:00", "afternoon"), ("17:00", "evening"),
    ("21:00", "night"), ("23:59", "night"),
])
def test_time_buckets(hhmm, expected):
    assert departure_time_bucket(hhmm) == expected


@pytest.mark.parametrize("bad", [None, "", "notatime", "99:00"])
def test_unparseable_time_returns_none_not_a_wrong_bucket(bad):
    assert departure_time_bucket(bad) is None


def test_dedup_keeps_lowest_fare_across_sources():
    """A traveller comparing sources pays the lowest offer."""
    out = normalise_quotes([_q(fare=700000, source="a"), _q(fare=500000, source="b")])
    assert len(out) == 1 and out[0].fare_inr_paise == 500000


def test_carrier_type_tagging():
    assert normalise_quotes([_q(flight="6E100")])[0].carrier_type == "low_cost"
    assert normalise_quotes([_q(flight="AI100")])[0].carrier_type == "full_service"
