# S3 Research — consolidated index

Phase 0 spike S3 asked: **can AeroDex obtain ≥3 airfare sources that are both technically
usable and legally permitted?** It ran four times, reversed itself twice, and produced one
empirical experiment.

This directory is the consolidation. `docs/spikes/` holds the original research, preserved
in place with supersession banners.

> **Start here:** [`S3_EXECUTIVE_SUMMARY.md`](S3_EXECUTIVE_SUMMARY.md) — the whole outcome
> in two pages.
> **Verdict:** **B — PROCEED WITH PERMISSION PATH.** The methodology is sound; the blocker
> is data access, and it is external.

---

## Files

| File | What it answers |
|---|---|
| [`S3_EXECUTIVE_SUMMARY.md`](S3_EXECUTIVE_SUMMARY.md) | Everything, briefly. Read first. |
| [`FINAL_S3_CONCLUSION.md`](FINAL_S3_CONCLUSION.md) | The authoritative verdict, A–N, the nine-axis rule, and the 14-point sanity check |
| [`SOURCE_DECISION_MATRIX.md`](SOURCE_DECISION_MATRIX.md) | Every source, GREEN/YELLOW/ORANGE/RED, robots and terms as separate columns |
| [`CLAIM_EVIDENCE_REGISTER.md`](CLAIM_EVIDENCE_REGISTER.md) | 38 claims with evidence, confidence, and SIH-safety |
| [`DECISION_RECORD.md`](DECISION_RECORD.md) | Eight Yes/No decisions with revisit conditions |
| [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md) | Ranked actions, plus draft outreach text to MoSPI |
| [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) | Confirmed / Probable / Unresolved / Blocked |
| [`METHODOLOGY_RECONCILIATION.md`](METHODOLOGY_RECONCILIATION.md) | Keep/Change/Unresolved per config setting — documented only |
| [`evidence/`](evidence/) | Primary-source extracts and the quantitative test results |
| [`archive/`](archive/) | Pointers to superseded conclusions |

## Evidence files

| File | Contents |
|---|---|
| [`evidence/tariff-comparability-results.md`](evidence/tariff-comparability-results.md) | **The experiment that decided S3.** 14 sheets, four tests, full numbers |
| [`evidence/government-methodology.md`](evidence/government-methodology.md) | MoSPI and DGCA primary extracts |
| [`evidence/esankhyiki-investigation.md`](evidence/esankhyiki-investigation.md) | What the SIH Dataset Link actually provides |
| [`evidence/compliance-evidence.md`](evidence/compliance-evidence.md) | robots.txt and terms, verified independently per host |
| [`evidence/source-access-evidence.md`](evidence/source-access-evidence.md) | What was retrieved, and what the sheets contain |
| [`evidence/api-distribution-evidence.md`](evidence/api-distribution-evidence.md) | Look-to-book economics; why no sanctioned channel works |

---

## Step 1 — Inventory of existing artifacts

| Path | Purpose | Date | Phase | Primary evidence? | Conclusions? | Conflicts with later work? | Disposition |
|---|---|---|---|---|---|---|---|
| `docs/spikes/s3-source-mapping.md` | Original candidate mapping; verdict "NO-GO on terms, zero sources usable". Self-supersedes an earlier "GO, narrowly" for ixigo | 23 Aug 2026 | S3 pass 1 | Yes — ToS quotes for ixigo, Cleartrip, Akasa | Yes | **Yes** — "zero sources usable" falsified by pass 2 | **Superseded conclusion; preserve as raw** |
| `docs/spikes/s3-redo.md` | Adversarial redo; discovers Rule 135 tariff sheets; proposes Tier A; recommends collapsing horizons | 23 Aug 2026 | S3 pass 2 | Yes — tariff sheet structures, IndiGo carve-out, Duffel clauses | Yes | **Yes** — Tier A, "five GREEN", T-21 and AirPrice Guardian all falsified by pass 3 | **Superseded conclusion; preserve as raw** |
| `docs/spikes/s3-verification.md` | Self-falsification; kills Tier A empirically; separates robots from terms; corrects four claims | 23 Aug 2026 | S3 pass 3 | **Yes — the experiment** | Yes | No — **currently authoritative on tariff sheets** | **Preserve as raw; conclusions carried forward** |
| `docs/spikes/s3-addendum-esankhyiki.md` | What the SIH Dataset Link provides | 23 Aug 2026 | S3 pass 4 | Yes — portal + CPI FAQ | Yes | Minor — wording overreaches ("has never contained") | **Preserve; wording softened here** |
| `docs/spikes/s3-evidence.json` | Machine-readable capture: one ixigo fare + 10-day fare calendar | 23 Aug 2026 | S3 pass 1 | **Yes — raw** | No | No | **Preserve as raw. Extend, never replace. Data must not be used** |
| `docs/spikes/robots-parser-defects.md` | Four `urllib.robotparser` defects; drove the custom parser | 23 Aug 2026 | S3 pass 1 | Yes — reproduced defects | Yes | No — **still fully valid** | **Preserve; no supersession** |
| `scripts/parse_dgca_weights.py` | Spike S4 — DGCA 2025 city-pair weights (ODbL) | 23 Aug 2026 | S4 | n/a | n/a | No | Live code |
| `plan.md` | Build plan | 22 Aug 2026 | pre-S3 | No | Yes | **Yes** — §1.1 "scraping is the only remaining path" and §5.8 Travelpayouts endorsement both falsified | **Needs amendment — see NA-7, MR-14** |

---

## Step 2 — Evidence-based timeline

Later verified evidence supersedes earlier assumption. Conclusions are **not** averaged.

### Pass 1 — original source mapping (`s3-source-mapping.md`)

Retrieved a real fare from ixigo, then read the terms and reversed to **NO-GO**. Disclosed
two of its own errors: an earlier "GO, narrowly" verdict issued before terms were read, and
a robots gate that had been enforcing nothing because of the stdlib parser defects.

| Claim established | Later status |
|---|---|
| OTA terms prohibit automated collection | **CONFIRMED** by all later passes |
| Fare data is technically retrievable without auth or CAPTCHA | **CONFIRMED** |
| "Zero sources are currently usable" | **FALSIFIED** by pass 2 |
| Permission is the critical path | **CONFIRMED and strengthened** |

### Pass 2 — adversarial redo (`s3-redo.md`)

Falsified "zero sources". Found regulator-mandated tariff sheets under Rule 135 and a DGCA
direction. Then over-reached.

| Claim established | Later status |
|---|---|
| Tariff sheets exist, are structured and archived | **CONFIRMED** |
| An all-inclusive fare is constructible from them | **CONFIRMED** (CLM-09) |
| Look-to-book blocks every sanctioned channel | **CONFIRMED and corroborated** (CLM-25, CLM-26) |
| MoSPI collects from online platforms | **CONFIRMED** (CLM-04) |
| "Five legally clean GREEN sources" | **FALSIFIED** by pass 3 — 4 of 5 fail the project's own robots gate |
| "Tier A: build a tariff-sheet index" | **FALSIFIED** by pass 3, empirically |
| "MoSPI uses one horizon, T-21"; "drop T-45" | **CORRECTED** — multi-horizon; and T-45 was never in the config |
| "Airlines agreed to share pricing data with DGCA" | **CORRECTED** — a parliamentary recommendation |
| "Air India republishes near-daily" | **CORRECTED** — 2024 only; zero archived in 2026 |
| "Rule 135 requires website publication" | **CORRECTED** — website *or* two daily newspapers |

### Pass 3 — verification (`s3-verification.md`) — the decisive pass

Ran the experiment pass 2 should have run, and the compliance check pass 2 never ran.

| Claim established | Status |
|---|---|
| `Fare-N` is a band, not a price (median 1.25×–1.52×) | **CONFIRMED** |
| `Fare-N` is not a stable stratum (offset ≠ 0 in 5 of 11 pairs) | **CONFIRMED** |
| Route panel churns to 46.6% survival | **CONFIRMED** |
| 4 of 5 tariff sources fail `aerodex/compliance.py` | **CONFIRMED** |
| Air India's terms reach **manual** copying | **CONFIRMED** |
| The structural look-to-book claim survives falsification | **CONFIRMED** |
| The methodology needs no change | **CONFIRMED** |

### Pass 4 — eSankhyiki addendum (`s3-addendum-esankhyiki.md`)

| Claim established | Status |
|---|---|
| eSankhyiki is a portal publishing CPI index numbers, not fare quotes | **CONFIRMED** |
| A free, unauthenticated API exists → usable for M7 | **CONFIRMED** (CLM-24, CLM-31) |
| "It does not contain, and has never contained" airfare microdata | **WEAKENED** — softened to "does not appear to provide"; absence of a *public* dataset is not absence of a dataset |

### Pass 5 — this consolidation

No new research. One targeted verification (CLM-31, PyPI). Adjudicated the ten
contradictions, downgraded four over-strong claims, found one plan-vs-code gap (MR-14), and
recorded the decision.

---

## The ten contradictions, adjudicated

| # | Contradiction | Resolution |
|---|---|---|
| 1 | "Zero usable sources" vs "five legally clean sources" | **Both wrong.** Sources exist and are visible; none is GREEN. Pass 1 understated existence; pass 2 overstated permission |
| 2 | Discovery of Rule 135 tariff sheets | **Genuine discovery, stands** — but CLM-02 is PRIMARY SOURCE NOT VERIFIED, and Rule 135(2) says website *or* newspapers |
| 3 | Tariff sheets judged viable (Tier A) | **Falsified.** `s3-redo.md` → `s3-verification.md` |
| 4 | Empirical failure of fare-level comparability | **Decisive.** Band not price; ladder re-indexed; panel churns |
| 5 | robots failures + stdlib parser defects | **Both real and connected.** The defects made pass 1's gate vacuous; the corrected parser then refused 4 of pass 2's 5 sources |
| 6 | Air India terms stricter than assumed | **Corrected.** Bars robot *or any manual process* — defeats the "a person can just download it" fallback |
| 7 | MoSPI horizon claim | **Corrected.** 15d → 7d → IMF advising 14d *and* 21d → §3.9's 21d. Multi-horizon, and it favours AeroDex |
| 8 | DGCA "AirPrice Guardian" | **Corrected.** A March 2025 parliamentary recommendation, not a built system |
| 9 | eSankhyiki treated as a dataset | **It is a portal.** Wording softened from "does not exist" to "does not appear to provide" |
| 10 | Methodology valid while source problem unresolved | **Confirmed across all four passes.** 14 Keep, 0 Change |
