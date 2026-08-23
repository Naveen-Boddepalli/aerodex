# Methodology Reconciliation

Every relevant setting in `config/methodology.yaml`, `config/panel.yaml`,
`config/calendar.yaml` and `aerodex/compliance.py`, reconciled against the S3 evidence.

**Nothing here has been applied. No config or code file was modified.**

**Summary: 14 Keep · 0 Change · 3 Unresolved.** The S3 research produced no evidence
requiring a methodology change. Every proposed change from earlier passes was itself
falsified.

---

| # | Setting | Current value | Verdict | Evidence |
|---|---|---|---|---|
| MR-1 | `panel.horizons_days` | `[1, 3, 7, 14, 21, 30, 60]` | **KEEP** | CLM-06, CLM-07 |
| MR-2 | `panel.slots` | 3 IST slots (07:00 / 13:00 / 20:00) | **KEEP** | CLM-35 |
| MR-3 | `panel.collection.slot_tolerance_minutes` | 15 | KEEP | — |
| MR-4 | `panel.collection.overlap_suppression` | `true` | KEEP | — |
| MR-5 | `panel.collection.min_seconds_between_requests_per_host` | 20 | **KEEP** | `compliance.py` |
| MR-6 | `panel.routes` + weights | 60 routes, `dgca-2025-city-pairs-r2` | **KEEP** | CLM-35, spike S4 |
| MR-7 | `elementary.formula` | `jevons` | **KEEP — corroborated** | CLM-34 |
| MR-8 | `elementary.min_matched_quotes` | 3 | KEEP | — |
| MR-9 | `elementary.relative_clip` | `[0.2, 5.0]` | KEEP | — |
| MR-10 | `hedonic.characteristics` | stops, departure_time_bucket, carrier_type, duration_minutes, is_refundable, baggage_included | **KEEP — corroborated** | CLM-07 |
| MR-11 | `aggregation.formula` | `lowe` | **KEEP** | CLM-34 |
| MR-12 | `imputation.max_weight_share` | 0.05 | KEEP | — |
| MR-13 | `validation.require_all_inclusive` | `true` | **KEEP** | CLM-09 |
| MR-14 | Source plurality / coverage ratio | **not encoded anywhere** | **UNRESOLVED — gap** | grep, `plan.md` §5.2, §8 |
| MR-15 | `base.period` | `"2026-09"` | **UNRESOLVED** | — |
| MR-16 | `chaining`, `revision` | monthly, annual overlap; 7-day provisional | KEEP | — |
| MR-17 | `calendar.yaml` festivals/vacations | 8 festivals, 3 vacation windows | KEEP | — |
| MR-18 | `compliance.py` robots + automation rules | RFC 9309 parser, 20 s floor, no-auth gate | **KEEP — and it is doing its job** | CLM-38, `compliance-evidence.md` |

---

## The horizon question — read carefully

`s3-redo.md` recommended: *"drop T-45, keep T-21 to match the national methodology."*
**Both halves of that recommendation are wrong.**

**On T-45.** The config has never contained T-45. `panel.yaml` carries
`[1, 3, 7, 14, 21, 30, 60]`. The T-45 reference originated in a task brief, not in the
repository. There is nothing to drop and nothing to look for.

**On collapsing to T-21.** The redo cited only §3.9 of the MoSPI Expert Group Report and
concluded the national methodology uses a single 21-day horizon. The fuller record
falsifies that (CLM-06):

| Stage | Position |
|---|---|
| 3rd/4th meeting (p.164) | fares prevailing **15 days prior** |
| 5th meeting (p.179) | **7-day advance booking** |
| IMF TA Rec 11 (p.225) | *"should also include a greater variety in terms of timing (**14 days advance purchase, 21 days advance purchase**) and not restricted to 7 days advance purchase"* |
| §3.9 summary (p.20) | **21 days** domestic, 60 days international |

**What the evidence licenses.** That multiple advance-purchase horizons are appropriate,
recommended to MoSPI by its IMF adviser, and that 21 and 60 days both appear in the
national design. AeroDex's ladder contains 21 and 60 and adds shorter horizons where fare
movement is sharpest.

**What the evidence does not license.** Collapsing `horizons_days` to `[21]`. That would
discard the very variety the IMF recommended, destroy the horizon dimension the index is
built to measure, and reduce the panel from 420 strata to 60.

**Verdict: KEEP `[1, 3, 7, 14, 21, 30, 60]` unchanged.**

---

## MR-14 — source plurality and coverage ratio: a plan-vs-code gap

`plan.md` §5.2 states the project uses *"redundancy across sources instead of evasion"* and
that *"when a source blocks, the source is dropped and the coverage ratio for that stratum
is published"*. §8 sets the S3 kill condition at *"fewer than 3 sources usable"*.

**None of this is encoded.** Verified by grep across `aerodex/`, `config/`, `scripts/` and
`tests/` for `min_sources`, `plurality`, `n_sources`, `independent_source`: **no matches**.
`config/` contains no source-count or coverage setting. `aerodex/acquire/adapters/` contains
only `fixture.py`.

Two consequences:

1. **The pitch asserts a property the code does not have.** The submission says a coverage
   ratio is published; nothing computes one. That is the kind of gap this project has
   explicitly designed against elsewhere — `compliance.py` exists precisely so that rules
   live in code rather than prose.
2. **The kill condition counts the wrong thing.** It counts *sources*, when what matters is
   *permitted observations at controlled horizons*. A project with five publicly visible
   but wholly impermissible sources satisfies its letter and fails its intent — which is
   exactly what happened in `s3-redo.md`.

**Proposed replacement (documented, not applied).** Retire the source count. Require
instead: at least one **permitted** source covering ≥70% of panel traffic weight; at least
one independent series sufficient to validate direction of travel (the eSankhyiki CPI
air-fare index qualifies today); and a published coverage ratio per stratum, with an
explicit declaration wherever one source exceeds 60% of index weight.

Applying this means editing `plan.md` §8 and adding a coverage metric — see NA-7. Out of
scope for this consolidation.

---

## MR-15 — `base.period` is now in the past

`base.period` is `"2026-09"`. Today is 23 August 2026, so the base period begins in roughly
one week, and no real observation has been collected. If access is not obtained before
September 2026, the base period will pass without data and the index will have no
foundation to chain from.

This is **not** an S3 finding and no change is proposed here — it depends on when access
lands (OQ-1). Flagged so it is not discovered late. Revisit once NA-1 returns.

---

## What S3 did *not* change, and why that matters

Four passes of adversarial research, forty-plus candidate sources, one empirical experiment
— and the methodology emerged untouched. That is a real result, not an absence of one.

The design was tested against the sponsoring ministry's own published methodology and
matched it on the two choices that mattered (Jevons elementary, Laspeyres-family
aggregation), while the IMF's advice to that ministry independently endorsed two further
AeroDex choices (multiple advance-purchase horizons; carrier as a price-determining
characteristic).

**The methodology is not the problem. Access is.**
