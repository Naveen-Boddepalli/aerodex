"""Fare decomposition, dedup, attribute tagging — plan §6."""

from aerodex.normalise.normalise import (
    departure_time_bucket,
    itinerary_key,
    normalise_quote,
    normalise_quotes,
)

__all__ = ["departure_time_bucket", "itinerary_key", "normalise_quote", "normalise_quotes"]
