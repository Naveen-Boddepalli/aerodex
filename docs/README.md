# AeroDex documentation

Index to everything in `docs/`. Start with the
[project README](../README.md) — it covers what AeroDex is, how to run it, the
CLI, and the methodology. This directory holds the reference material that
would bloat it.

---

## Start here

| If you want to… | Read |
| --- | --- |
| Understand the project and run it | [../README.md](../README.md) |
| Consume the index programmatically | [API.md](API.md) |
| Know what every stored field means | [DATA_DICTIONARY.md](DATA_DICTIONARY.md) |
| Deploy it and keep it running | [OPERATIONS.md](OPERATIONS.md) |
| Know what the tests guarantee | [TESTING.md](TESTING.md) |
| Check a published number yourself | [../README.md](../README.md#reproduce-a-published-number) |
| See the 30-day back-test | [../scripts/backtest/output/backtest_report.md](../scripts/backtest/output/backtest_report.md) |
| Read the methodology as a formal document | the `/methodology` page in the dashboard |

---

## Reference

| Document | Contents |
| --- | --- |
| [API.md](API.md) | HTTP API reference for NSO/RBI-style consumers: endpoints, fields, the `data_source` provenance contract, errors, stability guarantees, and known limitations |
| [openapi.json](openapi.json) | Machine-readable API contract. Regenerate with `uv run python scripts/export_openapi.py` |
| [DATA_DICTIONARY.md](DATA_DICTIONARY.md) | Every table and column, the problem statement's required metadata mapped onto the schema, validation rules, units and conventions |
| [OPERATIONS.md](OPERATIONS.md) | Install, scheduling, the daily cycle, monitoring, an incident runbook, backup and restore |
| [TESTING.md](TESTING.md) | What each test layer guarantees, the golden/M6 tests, the inventory, CI, and known gaps |

## Submission

| Document | Contents |
| --- | --- |
| [SIH26056_submission.md](SIH26056_submission.md) | Draft submission language: the estimated fare decomposition, source-coverage audit, and the compliance/evasion trade-off narrative |
| [sih-deck.html](sih-deck.html) | Presentation deck |
| [project-status.html](project-status.html) | Status snapshot |
| `AeroDex-SIH2026-Idea.pptx`, `AeroDex-SIH-2026-Idea-Submission.pptx` | Idea-stage submission decks |

## Spike S3 — source feasibility

Phase 0 spike S3 asked which fare sources expose a tier-1/tier-2 endpoint
without login, and whether their terms permit collection. It gates every real
adapter, which is why `fixture` is still the only registered source. The
research is preserved in full because the *conclusion* — that certain sources
cannot be collected compliantly — is a claim that has to be defensible.

| Document | Contents |
| --- | --- |
| [spikes/s3-redo.md](spikes/s3-redo.md) | The spike, re-run and written up |
| [spikes/s3-verification.md](spikes/s3-verification.md) | Verification of the findings |
| [spikes/s3-source-mapping.md](spikes/s3-source-mapping.md) | Source-by-source endpoint mapping |
| [spikes/s3-addendum-esankhyiki.md](spikes/s3-addendum-esankhyiki.md) | MoSPI eSankhyiki addendum |
| [spikes/robots-parser-defects.md](spikes/robots-parser-defects.md) | Four ways `urllib.robotparser` turns a `Disallow` into an allow — why this project ships its own RFC 9309 matcher |
| [spikes/s3-evidence.json](spikes/s3-evidence.json) | Machine-readable evidence |
| [research/s3/](research/s3/) | Executive summary, decision record, source matrix, open questions, and the evidence register |
| [research/](research/) | Provider matrix, legal and contractual matrix, pricing model, permission path, eSankhyiki findings |

Two starting points inside that set: [research/s3/S3_EXECUTIVE_SUMMARY.md](research/s3/S3_EXECUTIVE_SUMMARY.md)
for the conclusion, and [research/s3/DECISION_RECORD.md](research/s3/DECISION_RECORD.md)
for why it was decided that way.

---

## Elsewhere in the repository

| Path | Contents |
| --- | --- |
| [../README.md](../README.md) | Project overview, quick start, architecture, methodology, CLI, API summary, compliance, contributing |
| [../plan.md](../plan.md) | The full design rationale. Section numbers referenced throughout the code (`plan §5.5`) point here |
| [../demo/README.md](../demo/README.md) | The frozen synthetic dataset the dashboard falls back to |
| [../frontend/README.md](../frontend/README.md) | Dashboard design system and component notes |
| [../deploy/systemd/README.md](../deploy/systemd/README.md) | Installing the collection timers |
| [../scripts/backtest/output/backtest_report.md](../scripts/backtest/output/backtest_report.md) | The 30-day back-test against DGCA and MoSPI CPI references |
| [../config/methodology.yaml](../config/methodology.yaml) | The index definition, hashed onto every published number. Heavily commented — it is documentation as much as configuration |

---

## Conventions

Documentation in this project follows the same rule as the code: **say what is
true, including what is missing.** Every reference document here carries a
"known limitations" or "known gaps" section, and the back-test report states
where DGCA data is not machine-readable rather than substituting something that
looks better. A reviewer finding a gap we already named loses less confidence
than one finding a gap we concealed.

When a document and the code disagree, the code is right and the document is a
bug. Fields, counts and thresholds quoted here were verified against a running
system at the time of writing; if you change a threshold, grep `docs/` for it.
