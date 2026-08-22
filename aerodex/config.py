"""Configuration loading and hashing — plan §5.5, M6.

Every published number carries the hash of the config that produced it. The
hash is taken over a canonical serialisation, not the file bytes, so that
reordering keys or reflowing comments does not invent a spurious new vintage
— but changing any *value* always does.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

import yaml

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"


def canonical_json(obj: Any) -> str:
    """Deterministic serialisation: sorted keys, no incidental whitespace."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)


def config_hash(obj: Any) -> str:
    """SHA-256 over the canonical form. Stamped onto every index_point."""
    return hashlib.sha256(canonical_json(obj).encode("utf-8")).hexdigest()


def _load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


@dataclass(frozen=True)
class MethodologyConfig:
    """The methodology, frozen, with its own hash.

    Frozen because the engine is a pure function (plan §5.5): if the config
    could be mutated mid-run, the hash would no longer describe the output.
    """

    raw: dict
    hash: str

    @classmethod
    def load(cls, path: Path | None = None) -> MethodologyConfig:
        path = path or CONFIG_DIR / "methodology.yaml"
        raw = _load_yaml(path)
        return cls(raw=raw, hash=config_hash(raw))

    # -- typed accessors: fail loudly on a missing key, never silently default --

    def __getitem__(self, key: str) -> Any:
        return self.raw[key]

    @property
    def elementary_formula(self) -> str:
        return self.raw["elementary"]["formula"]

    @property
    def min_matched_quotes(self) -> int:
        return int(self.raw["elementary"]["min_matched_quotes"])

    @property
    def relative_clip(self) -> tuple[float, float]:
        low, high = self.raw["elementary"]["relative_clip"]
        return float(low), float(high)

    @property
    def max_imputed_share(self) -> float:
        return float(self.raw["imputation"]["max_weight_share"])

    @property
    def weights_vintage(self) -> str:
        return str(self.raw["aggregation"]["weights_vintage"])

    @property
    def base_value(self) -> float:
        return float(self.raw["base"]["value"])


@dataclass(frozen=True)
class Stratum:
    """One (route, horizon) cell of the panel."""

    origin: str
    destination: str
    horizon_days: int

    @property
    def route(self) -> str:
        return f"{self.origin}-{self.destination}"

    def __str__(self) -> str:
        return f"{self.route}@{self.horizon_days}d"


@dataclass(frozen=True)
class PanelConfig:
    """Routes, horizons, slots — the shape of what gets collected."""

    raw: dict
    hash: str

    @classmethod
    def load(cls, path: Path | None = None) -> PanelConfig:
        path = path or CONFIG_DIR / "panel.yaml"
        raw = _load_yaml(path)
        return cls(raw=raw, hash=config_hash(raw))

    @property
    def routes(self) -> list[dict]:
        return self.raw["routes"]

    @property
    def horizons(self) -> list[int]:
        return [int(h) for h in self.raw["horizons_days"]]

    @property
    def slots(self) -> list[dict]:
        return self.raw["slots"]

    def strata(self) -> list[Stratum]:
        """All (route, horizon) cells. len() == 420 for the committed panel."""
        return [
            Stratum(r["origin"], r["destination"], h)
            for r in self.routes
            for h in self.horizons
        ]

    def stratum_slots_per_day(self) -> int:
        return len(self.strata()) * len(self.slots)

    def weights(self) -> dict[str, float | None]:
        """Route weights, keyed ``ORIG-DEST``. None means 'not yet sourced'."""
        return {f"{r['origin']}-{r['destination']}": r.get("weight") for r in self.routes}


@dataclass(frozen=True)
class CalendarConfig:
    raw: dict
    hash: str

    @classmethod
    def load(cls, path: Path | None = None) -> CalendarConfig:
        path = path or CONFIG_DIR / "calendar.yaml"
        raw = _load_yaml(path)
        return cls(raw=raw, hash=config_hash(raw))

    def is_festival(self, d: date) -> str | None:
        """Festival name if *d* falls in a festival window, else None."""
        for f in self.raw.get("festivals", []):
            if date.fromisoformat(str(f["start"])) <= d <= date.fromisoformat(str(f["end"])):
                return str(f["name"])
        return None


def load_all() -> tuple[MethodologyConfig, PanelConfig, CalendarConfig]:
    return MethodologyConfig.load(), PanelConfig.load(), CalendarConfig.load()
