# Testing

PS SIH26056 names automated testing as a deliverable. This document describes
what the suite actually guarantees — not merely that it exists.

**Current state:** 191 tests — **183 pass, 8 skip** without a database, in
under a second.

```bash
uv run pytest -q
```

**Contents** · [What the layers guarantee](#what-the-layers-guarantee) ·
[The golden tests](#the-golden-tests-m6) · [Test inventory](#test-inventory) ·
[Running](#running) · [Database tests](#database-tests) ·
[Writing tests here](#writing-tests-here) · [CI](#continuous-integration) ·
[Gaps](#known-gaps)

---

## What the layers guarantee

The suite is organised around the two invariants the project rests on, not
around code structure.

| Layer | Guarantees | Where |
| --- | --- | --- |
| **Golden / M6** | A published number is bit-reproducible from archived inputs | `tests/golden/` |
| **Engine equivalence** | The optimised index path computes exactly what the obvious path does | `tests/unit/test_index_engine.py` |
| **Compliance** | The robots.txt, pacing and no-personal-data rules hold at run time | `tests/unit/test_compliance.py` |
| **Publication refusal** | Unpublishable numbers are refused, not released quietly | `tests/unit/test_publish.py`, `test_cli_publish.py` |
| **Pipeline** | Collection → normalise → validate → store behaves, including under failure | `tests/unit/test_pipeline.py` |
| **Persistence** | Index points and adapter health are written correctly and transactionally | `tests/unit/test_records.py` |
| **Weights** | DGCA weights parse into the panel and sum to 1 | `tests/unit/test_dgca_weights.py`, `test_panel_weights.py` |
| **Statistics** | Jevons/Lowe behave as the methodology claims | `tests/unit/test_elementary.py` |
| **Normalisation** | The itinerary key matches the right products and only those | `tests/unit/test_normalise.py` |
| **Queue** | `SKIP LOCKED` gives correct concurrent dequeue | `tests/unit/test_queue_integration.py` (needs a database) |

---

## The golden tests (M6)

`tests/golden/` is the most important directory in the repository.

It holds a frozen input panel and a frozen expected output, both checked in.
Any change that moves a published number fails here, loudly. Without it,
reproducibility would be a claim rather than a property.

```bash
uv run pytest tests/golden -q
uv run python -m aerodex.cli verify        # the same check from the CLI
```

The check has three anchors:

| Hash | Fails when |
| --- | --- |
| `panel_hash` | the frozen input drifted underneath the expectation |
| `config_hash` | `methodology.yaml` changed — that *is* the audit trail |
| `output_hash` | any published number moved |

Both the unweighted and the **weighted** paths are verified. Checking only the
unweighted path would let the DGCA weights drift without the reproducibility
check ever noticing, and the weighted path is the one that gets published.

> **Never "fix" a golden test by re-freezing it.** If a change to the fixtures
> is intentional, regenerate them deliberately and say so in the commit
> message. A re-freeze that is not explained is indistinguishable from a
> silently changed statistic.

---

## Test inventory

| File | Tests | Covers |
| --- | ---: | --- |
| `unit/test_compliance.py` | 62 | robots.txt (RFC 9309 matching, malformed directives, status handling), host pacing, forbidden headers, personal-data assertions |
| `unit/test_dgca_weights.py` | 25 | DGCA parse, city→IATA mapping, vintage discipline |
| `unit/test_normalise.py` | 18 | itinerary key, departure buckets, carrier typing, de-duplication |
| `unit/test_elementary.py` | 15 | Jevons, price relatives, matched-model semantics, clipping |
| `golden/test_golden.py` | 11 | M6 reproducibility, frozen hashes, published values |
| `unit/test_index_engine.py` | 11 | optimised vs reference index path (see below) |
| `unit/test_pipeline.py` | 11 | end-to-end on the fixture adapter, store batching, rollback, raw→clean linkage |
| `unit/test_records.py` | 9 | `index_point` / `adapter_health` upserts, revision guard, transactions |
| `unit/test_queue_integration.py` | 9 | `SKIP LOCKED`, retries, reaping, idempotent enqueue — **needs a database** |
| `unit/test_panel_weights.py` | 8 | panel weight coverage and normalisation |
| `unit/test_cli_publish.py` | 7 | CLI publish/refusal exit codes |
| `unit/test_publish.py` | 5 | artifact assembly, synthetic and M5 refusals |

### Engine equivalence, and why it is mutation-tested

`compute_index` does not filter the panel per stratum and intersect two pandas
Series any more; it pivots the medians into one matrix and matches with a
boolean mask. That is roughly a 12× speedup, and it must be a speedup *only* —
same medians, same matched set, same ordering into `mean()`, because float
summation is order-dependent and M6 diffs the output hash.

`tests/unit/test_index_engine.py` pins the fast path against a deliberately
slow, obvious reference implementation, asserting **bit equality** rather than
approximate equality: a last-ulp difference is a changed published number as
far as the output hash is concerned.

It covers the shapes the golden panel does not have — a stratum that vanishes
for a period, items that do not overlap between periods, a stratum below the
matched floor, relatives outside the clip band, and repeated quotes per item.

These tests were themselves checked by mutation: breaking the engine in seven
plausible ways (median→mean, geometric mean→sum of logs, dropping the clip
ceiling, counting the matched floor after clipping instead of before,
collapsing strata across horizons, inverting the relatives, keeping
non-positive relatives) makes the suite fail every time. Two early drafts of
these tests passed some of those mutations because the fixture gave every item
the same drift rate — with one shared rate, any subset of items yields the same
Jevons, so the test could not tell correct matching from incorrect. The fixture
now gives every item and every stratum its own rate.

That is the standard worth holding: a test that cannot fail is not evidence.

---

## Running

```bash
uv run pytest -q                          # everything
uv run pytest tests/golden -q             # the M6 guarantee
uv run pytest tests/unit -q               # everything else
uv run pytest -q -k compliance            # plan §7 assertions
uv run pytest -q --cov=aerodex            # with coverage
```

Related checks that are not pytest but gate the same guarantees:

```bash
uv run ruff check .                       # lint (CI runs this)
uv run python -m aerodex.cli verify       # M6 from the CLI
uv run python scripts/export_openapi.py --check   # committed API spec is current
uv run python scripts/make_demo_data.py   # demo/ must regenerate byte-identically
```

Frontend:

```bash
cd frontend
npx tsc --noEmit                          # types
npx eslint .                              # lint
npx next build                            # all routes compile
```

---

## Database tests

Eight tests skip without Postgres. They exercise `SELECT … FOR UPDATE SKIP
LOCKED`, which cannot be tested against a mock — the whole point is what two
concurrent transactions do to each other.

```bash
docker compose up -d
export AERODEX_DSN=postgresql://aerodex:aerodex@localhost:5433/aerodex
uv run python -m aerodex.cli init-db
uv run pytest -q                          # now 191 pass
```

CI runs a TimescaleDB service container, so these execute on every push.

The store path in `test_pipeline.py` and `test_records.py` uses a stand-in for
psycopg rather than a live database. Those assertions are about what the code
does with a connection — batching, the raw→clean link, rollback discipline —
and the stand-in implements the documented
`executemany(returning=True)` / `nextset()` protocol, so a change in how the
code walks that protocol fails there.

---

## Writing tests here

1. **Name the guarantee, not the function.** `test_a_failed_write_rolls_back_and_the_run_continues`
   beats `test_store_error`. The name should say what breaks in production if
   the test fails.
2. **Make the fixture discriminating.** Before trusting a new test, break the
   code it covers and confirm it fails. A fixture whose values are too uniform
   will pass against a broken implementation.
3. **Assert bit equality on anything that reaches a published number.**
   `assert_array_equal`, not `approx`.
4. **A quality gate needs a test that it fires**, not only one that it exists —
   `test_publish.py` asserts the refusals actually refuse.
5. **Never weaken a golden fixture to make a change pass.**

---

## Continuous integration

Two workflows, in `.github/workflows/`:

**`ci.yml`** — on every push to `main` and every pull request. Brings up
TimescaleDB, applies the schema, then runs `ruff check .`, the full suite, and
`aerodex verify`.

**`reproducibility.yml`** — nightly at 02:00 IST. Runs `aerodex verify` and the
golden tests against the archived panel. A failure here means a published
number moved, which is the one thing this project must never do silently.

A third workflow, `keepalive.yml`, defeats GitHub's 60-day disable of scheduled
workflows on inactive repositories — without it the nightly check would quietly
stop running, which is a failure mode worth naming.

---

## Known gaps

Stated rather than left to be discovered.

1. **No adapter is tested against a live source.** `fixture` is the only
   registered adapter; real-source canaries land with Phase 0 spike S3. The
   `canary` pytest marker exists and defaults to "unknown", which counts as a
   failure.
2. **No frontend unit tests.** The dashboard is covered by type-checking,
   linting and a production build, not by component tests.
3. **No API contract tests.** Endpoint behaviour is exercised manually and via
   the committed OpenAPI document; there is no test asserting a response shape,
   so a field rename would not fail the suite. Adding Pydantic response models
   would make this testable and is the recommended next step.
4. **No load or soak testing.** The panel is ~1,260 stratum-slots/day, well
   inside a single small VM, but that is an argument rather than a measurement.
5. **Coverage is not enforced.** `pytest-cov` is available; no threshold gates
   the build.

---

## See also

- [../README.md](../README.md#the-two-invariants) — the invariants the suite defends
- [DATA_DICTIONARY.md](DATA_DICTIONARY.md) — the validation rules under test
- [OPERATIONS.md](OPERATIONS.md) — what to check when a run misbehaves
