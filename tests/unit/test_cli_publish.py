"""`aerodex index --publish` — the refusal has to be demonstrable, not asserted.

The dashboard tells a reader the publisher "produces no artifacts — the failure
is a refusal, not a footnote". Before this flag existed, the documented command
computed the breaching index, printed a hash and exited 0: the refusal lived in
`build_artifacts()`, which nothing on the command line ever called. These tests
pin the flag that closes that gap.

The golden panel is used rather than demo/ because it is 4 periods instead of
30 and runs in under a second; demo/ takes ~20s per invocation, which is not
worth paying three times in the unit suite.
"""

import json
from pathlib import Path

import pandas as pd
import pytest

from aerodex.cli import main

GOLDEN = Path(__file__).parents[1] / "golden" / "panel.csv"

#: The golden panel's deliberate coverage hole lands in its final period and
#: breaches M5. Dropping that period leaves a fully-covered, publishable run.
_HOLE_PERIOD = -1


@pytest.fixture
def clean_panel(tmp_path) -> Path:
    df = pd.read_csv(GOLDEN)
    keep = sorted(df["period"].unique())[:_HOLE_PERIOD]
    path = tmp_path / "clean.csv"
    df[df["period"].isin(keep)].to_csv(path, index=False)
    return path


def test_synthetic_source_is_refused(capsys):
    """The project's central claim: a fixture-derived number is not a measurement."""
    code = main(["index", "--panel-csv", str(GOLDEN), "--publish", "--source", "fixture"])
    assert code == 3
    out = capsys.readouterr().out
    assert "PUBLICATION REFUSED" in out
    assert "not a measurement" in out


def test_m5_breach_is_refused(capsys):
    """A breaching period must refuse even when synthetic data is allowed."""
    code = main([
        "index", "--panel-csv", str(GOLDEN),
        "--publish", "--source", "fixture", "--allow-synthetic",
    ])
    assert code == 3
    out = capsys.readouterr().out
    assert "PUBLICATION REFUSED" in out
    assert "M5" in out


def test_refusal_is_the_last_thing_printed(capsys):
    """The whole point of the flag.

    The M5 warning alone scrolls off the top of a long table, which is how a
    refusal comes to read as a footnote. The verdict must land at the end, on
    stdout — stderr is unbuffered and jumps ahead of the table when piped.
    """
    main(["index", "--panel-csv", str(GOLDEN), "--publish", "--source", "fixture"])
    tail = [ln for ln in capsys.readouterr().out.strip().splitlines() if ln.strip()][-3:]
    assert any("PUBLICATION REFUSED" in ln for ln in tail)
    assert "No artifacts were written." in tail[-1]


def test_refusal_writes_nothing(tmp_path, capsys):
    """A refused run must not leave a half-published release behind."""
    art = tmp_path / "artifacts"
    code = main([
        "index", "--panel-csv", str(GOLDEN), "--publish",
        "--source", "fixture", "--allow-synthetic", "--artifacts-dir", str(art),
    ])
    assert code == 3
    assert not art.exists(), "a refused run created an artifacts directory"


def test_publishable_run_is_accepted_and_written(clean_panel, tmp_path, capsys):
    art = tmp_path / "artifacts"
    code = main([
        "index", "--panel-csv", str(clean_panel), "--publish",
        "--source", "fixture", "--allow-synthetic", "--artifacts-dir", str(art),
    ])
    assert code == 0
    assert "PUBLISHED" in capsys.readouterr().out

    names = {p.name for p in art.iterdir()}
    assert {"index_latest.json", "methodology.json", "index_full.csv"} <= names
    assert any(n.startswith("release-") for n in names)

    latest = json.loads((art / "index_latest.json").read_text())
    assert latest["output_hash"]
    assert latest["config_hash"]


def test_dry_run_writes_nothing(clean_panel, tmp_path, capsys):
    """Without --artifacts-dir the publisher runs but emits no files."""
    code = main([
        "index", "--panel-csv", str(clean_panel), "--publish",
        "--source", "fixture", "--allow-synthetic",
    ])
    assert code == 0
    assert "dry run" in capsys.readouterr().out
    assert not list(tmp_path.glob("*.json"))


def test_without_publish_the_old_behaviour_is_unchanged(capsys):
    """--publish is opt-in: a breaching run without it still just warns (exit 1)."""
    code = main(["index", "--panel-csv", str(GOLDEN)])
    assert code == 1
    captured = capsys.readouterr()
    assert "PUBLICATION REFUSED" not in captured.out
    assert "M5" in captured.err
