"""Validation and quarantine — plan §6, config ``validation:``.

A quote that fails is quarantined, not deleted: the quarantine queue is
evidence about a source's health, and silently dropping bad rows would make
the coverage ratio look better than the collection actually was.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from aerodex.normalise.normalise import CleanQuote


class ValidationOutcome(StrEnum):
    VALID = "valid"
    QUARANTINED = "quarantined"
    REJECTED = "rejected"


@dataclass
class ValidationResult:
    outcome: ValidationOutcome
    reason: str | None = None


def validate_quote(c: CleanQuote, config: dict) -> ValidationResult:
    """Apply the configured plausibility rules to one normalised quote."""
    v = config["validation"]
    fare_rupees = c.fare_inr_paise / 100.0

    if c.fare_inr_paise <= 0:
        return ValidationResult(ValidationOutcome.REJECTED, "non-positive fare")

    if fare_rupees < float(v["fare_min_inr"]):
        return ValidationResult(
            ValidationOutcome.QUARANTINED,
            f"fare Rs{fare_rupees:.0f} below floor Rs{v['fare_min_inr']}",
        )
    if fare_rupees > float(v["fare_max_inr"]):
        return ValidationResult(
            ValidationOutcome.QUARANTINED,
            f"fare Rs{fare_rupees:.0f} above ceiling Rs{v['fare_max_inr']}",
        )
    if c.duration_minutes is not None and c.duration_minutes > int(v["max_duration_minutes"]):
        return ValidationResult(
            ValidationOutcome.QUARANTINED, f"duration {c.duration_minutes}min implausible"
        )
    if c.duration_minutes is not None and c.duration_minutes <= 0:
        return ValidationResult(ValidationOutcome.QUARANTINED, "non-positive duration")
    if c.origin == c.destination:
        return ValidationResult(ValidationOutcome.REJECTED, "origin equals destination")
    if c.horizon_days < 0:
        return ValidationResult(ValidationOutcome.REJECTED, "negative booking horizon")

    return ValidationResult(ValidationOutcome.VALID)


def validate_batch(
    quotes: list[CleanQuote], config: dict
) -> tuple[list[CleanQuote], list[tuple[CleanQuote, str]]]:
    """Split a batch into (valid, [(quote, reason), ...])."""
    valid: list[CleanQuote] = []
    held: list[tuple[CleanQuote, str]] = []
    for c in quotes:
        res = validate_quote(c, config)
        if res.outcome is ValidationOutcome.VALID:
            valid.append(c)
        else:
            held.append((c, res.reason or res.outcome.value))
    return valid, held
