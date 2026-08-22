"""The M6 guarantee — plan §6: "the most important directory".

A frozen input panel and a frozen expected index output, checked in. Any
refactor that changes a published number fails here, loudly. Without this,
reproducibility is a claim rather than a property.

If a change to these fixtures is intentional, regenerate them deliberately and
say so in the commit message — never "fix" this test by re-freezing.
"""

import json
from pathlib import Path

import pandas as pd
import pytest

from aerodex.config import MethodologyConfig
from aerodex.index.engine import compute_index, output_hash, panel_hash

GOLDEN = Path(__file__).parent
PANEL = GOLDEN / "panel.csv"
EXPECTED = GOLDEN / "expected_index.csv"
HASHES = json.loads((GOLDEN / "expected_hashes.json").read_text())


@pytest.fixture
def panel() -> pd.DataFrame:
    return pd.read_csv(PANEL)


@pytest.fixture
def config() -> MethodologyConfig:
    return MethodologyConfig.load()


def test_panel_hash_frozen(panel):
    """The input has not drifted underneath the expectation."""
    assert panel_hash(panel) == HASHES["panel_hash"]


def test_config_hash_frozen(config):
    """Changing methodology.yaml must change this hash — that is the audit trail."""
    assert config.hash == HASHES["config_hash"], (
        "methodology.yaml changed. If deliberate, re-freeze the golden fixtures "
        "and record the vintage change in the commit."
    )


def test_output_hash_frozen(panel, config):
    """M6: bit-identical re-runs."""
    assert output_hash(compute_index(panel, config)) == HASHES["output_hash"]


def test_published_values_match_expected(panel, config):
    got = compute_index(panel, config)
    want = pd.read_csv(EXPECTED)
    pd.testing.assert_series_equal(
        got["value"].round(6), want["value"].round(6), check_names=False
    )


def test_repeated_runs_are_identical(panel, config):
    """Two runs in the same process must not differ — no hidden state."""
    a = compute_index(panel, config)
    b = compute_index(panel, config)
    assert output_hash(a) == output_hash(b)


def test_row_order_does_not_change_the_index(panel, config):
    """Row order carries no meaning and must not reach the output."""
    shuffled = panel.sample(frac=1.0, random_state=7).reset_index(drop=True)
    assert output_hash(compute_index(shuffled, config)) == HASHES["output_hash"]


def test_engine_is_pure_no_io_imports():
    """The engine must not acquire a database, network or clock dependency.

    This is the constraint that makes M6 achievable (plan §5.5); asserting it
    in CI is cheaper than noticing it after a published number moves.
    """
    src = (Path(__file__).parents[2] / "aerodex" / "index" / "engine.py").read_text()
    code = "\n".join(
        line for line in src.splitlines() if not line.strip().startswith("#")
    )
    _, _, body = code.partition('"""')
    _, _, body = body.partition('"""')  # skip the module docstring
    for forbidden in ("import psycopg", "import httpx", "import requests", "datetime.now",
                      "time.time", "os.environ", "random.random"):
        assert forbidden not in body, f"engine.py must stay pure; found {forbidden!r}"


def test_coverage_hole_is_imputed_and_flagged(panel, config):
    """The fixture's deliberate hole must surface as M5 signal, not vanish."""
    out = compute_index(panel, config)
    last = out.iloc[-1]
    assert last["coverage_ratio"] < 1.0
    assert last["imputed_weight_share"] > 0
    assert bool(last["imputation_ceiling_breached"]) is True
