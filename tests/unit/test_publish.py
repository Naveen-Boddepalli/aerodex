"""Publication refusals — plan §5.6, M5."""

import pandas as pd
import pytest

from aerodex.config import MethodologyConfig
from aerodex.publish.artifacts import PublicationRefused, build_artifacts, write_artifacts

CONFIG = MethodologyConfig.load()


def _index(breached=False):
    return pd.DataFrame(
        [
            {"period": "2026-09-01", "value": 100.0, "index_ratio": 1.0,
             "imputed_weight_share": 0.0, "coverage_ratio": 1.0, "n_quotes": 7560,
             "imputation_ceiling_breached": False, "panel_hash": "ab" * 32},
            {"period": "2026-09-02", "value": 100.9, "index_ratio": 1.009,
             "imputed_weight_share": 0.11 if breached else 0.01, "coverage_ratio": 0.99,
             "n_quotes": 7557, "imputation_ceiling_breached": breached,
             "panel_hash": "ab" * 32},
        ]
    )


def test_refuses_a_fixture_only_panel():
    with pytest.raises(PublicationRefused, match="synthetic"):
        build_artifacts(_index(), CONFIG, sources={"fixture"})


def test_allows_a_real_source():
    art = build_artifacts(_index(), CONFIG, sources={"fixture", "somereal"})
    assert art.index_latest["value"] == pytest.approx(100.9)


def test_refuses_when_m5_ceiling_breached():
    with pytest.raises(PublicationRefused, match="M5"):
        build_artifacts(_index(breached=True), CONFIG, sources={"real"})


def test_artifact_carries_full_provenance():
    art = build_artifacts(_index(), CONFIG, sources={"real"})
    for field in ("config_hash", "panel_hash", "weights_vintage", "output_hash",
                  "coverage_ratio", "imputed_weight_share"):
        assert art.index_latest[field] not in (None, "")


def test_write_artifacts_creates_all_files(tmp_path):
    art = build_artifacts(_index(), CONFIG, sources={"real"})
    written = {p.name for p in write_artifacts(art, tmp_path)}
    assert written == {"index_latest.json", "methodology.json",
                       "index_full.csv", "release-2026-09-02.json"}
