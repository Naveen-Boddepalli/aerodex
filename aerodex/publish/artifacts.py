"""Static publication artifacts — plan §5.6.

The index run writes files; the dashboard reads files. This inverts the usual
architecture on purpose: the dashboard is what judges and MoSPI will open, and
it must keep working when the free-tier VM does not.

Artifacts:
    index_latest.json  — headline value plus its provenance
    index_full.csv     — the whole series
    release-<date>.json— dated, immutable release
    methodology.json   — the hashes that make a number checkable
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from aerodex.config import MethodologyConfig
from aerodex.index.engine import output_hash

#: Sources that must never appear in a published artifact.
SYNTHETIC_SOURCES = frozenset({"fixture"})


class PublicationRefused(RuntimeError):
    """The run produced a number that must not be published."""


@dataclass
class Artifacts:
    index_latest: dict
    index_full: pd.DataFrame
    methodology: dict
    release_name: str


def build_artifacts(
    index_df: pd.DataFrame,
    config: MethodologyConfig,
    *,
    sources: set[str] | None = None,
    allow_synthetic: bool = False,
) -> Artifacts:
    """Assemble the publishable objects, refusing anything unpublishable.

    Two refusals, both deliberate:

    * a panel built only from synthetic sources — the fixture adapter exists to
      exercise the pipeline, and a number derived from it is not a measurement;
    * a period whose imputed weight share breached the M5 ceiling — the plan
      requires the share be published, not that a breached number be released
      quietly.
    """
    if sources and not allow_synthetic:
        real = set(sources) - SYNTHETIC_SOURCES
        if not real:
            raise PublicationRefused(
                f"panel contains only synthetic sources {sorted(sources)}; "
                "a fixture-derived number is not a measurement (Phase 0 spike S3 pending)"
            )

    if "imputation_ceiling_breached" in index_df.columns:
        breached = index_df[index_df["imputation_ceiling_breached"].astype(bool)]
        if len(breached):
            periods = ", ".join(str(p) for p in breached["period"])
            raise PublicationRefused(
                f"imputed weight share exceeded {config.max_imputed_share:.0%} (M5) "
                f"for period(s): {periods}. Publish the coverage failure, not a "
                "prettier number."
            )

    latest = index_df.sort_values("period").iloc[-1]
    index_latest = {
        "index": "AeroDex Airfare Price Index (India)",
        "period": str(latest["period"]),
        "value": round(float(latest["value"]), 4),
        "base_period": config["base"]["period"],
        "base_value": config.base_value,
        "coverage_ratio": round(float(latest["coverage_ratio"]), 5),
        "imputed_weight_share": round(float(latest["imputed_weight_share"]), 5),
        "n_quotes": int(latest["n_quotes"]),
        "is_provisional": True,
        "config_hash": config.hash,
        "panel_hash": str(latest.get("panel_hash", "")),
        "weights_vintage": config.weights_vintage,
        "output_hash": output_hash(index_df),
    }

    methodology = {
        "config_hash": config.hash,
        "elementary_formula": config.elementary_formula,
        "aggregation": config["aggregation"]["formula"],
        "weights_vintage": config.weights_vintage,
        "imputation_ceiling": config.max_imputed_share,
        "revision_policy": config["revision"]["policy"],
        "config": config.raw,
    }

    return Artifacts(
        index_latest=index_latest,
        index_full=index_df,
        methodology=methodology,
        release_name=f"release-{latest['period']}.json",
    )


def _replace_atomically(path: Path, body: str) -> None:
    """Write via a temporary file in the same directory, then rename.

    ``index_latest.json`` is what the dashboard polls. A direct write truncates
    it first, so a crash — or a reader arriving mid-write — sees a half-file
    where a published number should be. rename(2) within a directory is atomic:
    a reader gets the old artifact or the new one, never a torn one.
    """
    tmp = path.with_name(f".{path.name}.tmp")
    try:
        tmp.write_text(body)
        tmp.replace(path)
    finally:
        tmp.unlink(missing_ok=True)


def write_artifacts(artifacts: Artifacts, out_dir: str | Path) -> list[Path]:
    """Write artifacts to a directory. Upload to R2 is a separate step, so a
    failed upload cannot leave a half-published release behind."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    def _json(name: str, obj) -> None:
        path = out / name
        _replace_atomically(path, json.dumps(obj, indent=2, sort_keys=True, default=str) + "\n")
        written.append(path)

    _json("index_latest.json", artifacts.index_latest)
    _json("methodology.json", artifacts.methodology)
    _json(artifacts.release_name, artifacts.index_latest)

    csv_path = out / "index_full.csv"
    _replace_atomically(
        csv_path, artifacts.index_full.to_csv(index=False, lineterminator="\n")
    )
    written.append(csv_path)

    return written
