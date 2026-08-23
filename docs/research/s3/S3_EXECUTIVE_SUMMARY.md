# S3 — Executive Summary

**Read this first.** Everything else in `docs/research/s3/` expands on it.
**Status:** FINAL · 23 August 2026 · supersedes all earlier S3 verdicts.

---

## Problem

AeroDex (SIH PS 26056, MoSPI) publishes a real-time airfare price index for India.
The index needs **flight-level fare quotes at controlled booking horizons**
(T-1/3/7/14/21/30/60), three times a day, across a 60-route panel — roughly 1,155
stratum-slots per day.

## Research question

Can AeroDex obtain ≥3 airfare data sources that are simultaneously (a) technically
usable for that panel and (b) legally permitted?

## What we tested

Four passes, in order: original source mapping → adversarial redo → empirical
self-falsification → eSankhyiki addendum. Roughly 40 candidate sources across OTAs,
metasearch, airline direct/NDC, B2B consolidators, GDS, sanctioned APIs, government
data, research repositories and commercial datasets. Terms of use read clause by
clause. One empirical experiment: 14 archived IndiGo tariff sheets parsed and tested
for statistical comparability.

## Biggest discoveries

1. **Regulator-mandated tariff sheets exist.** Rule 135 of the Aircraft Rules 1937,
   plus a DGCA direction of 13 May 2025, compel every scheduled Indian carrier to
   publish route-wise tariff sheets. Five were located and parsed. Real, free,
   structured, with archived history.
2. **MoSPI already does what AeroDex proposes.** CPI 2024 FAQ Q27: *"Airfares are
   collected through well-known online platforms."* The difference between MoSPI's
   lawful collection and AeroDex's unlawful collection is **statutory authority**
   (Collection of Statistics Act 2008), not technique.
3. **The structural blocker is unit economics, not policy.** Every distribution
   channel meters search and recovers the cost from bookings. AeroDex books nothing.
   Duffel writes it into contract; Travelpayouts states it in plain words.
4. **DGCA holds a route × airline min/max tariff dataset and has already supplied
   airfare data to MoSPI on request** — a documented precedent in MoSPI's own
   Expert Group report.

## What was falsified

| Claim | By whom | Outcome |
|---|---|---|
| "Zero sources usable" | redo | Falsified — sources exist |
| "Five legally clean GREEN sources" | verification | **Falsified** — 4 of 5 fail AeroDex's own robots gate |
| "Tier A: build a tariff-sheet index" | verification | **Falsified empirically** — see below |
| "MoSPI uses a single T-21 horizon" | verification | Corrected — the record supports *multiple* horizons |
| "Airlines agreed to share pricing data with DGCA" | verification | Corrected — a parliamentary *recommendation*, not a built system |
| "The eSankhyiki dataset does not exist" | this consolidation | Softened — it is a portal publishing index outputs; absence of a public dataset ≠ absence of a dataset |

**The Tier A falsification, in numbers.** A tariff "fare level" is a *band*, not a
price: median Maximum/Minimum ratio 1.25×–1.52×, p90 up to 2.82×, only 0.3–2.5% of
cells identical. The levels are not stable strata: median same-level month-over-month
movement ranges −21.3% to +10.0%, with 12–53% of cells moving more than ±25%, and a
ladder-shift test finds the best-matching offset is non-zero in **5 of 11** consecutive
pairs. The route panel churns to **46.6% survival** in one step. The schema changed
three times in eighteen months.

## Current final verdict

> **B — PROCEED WITH PERMISSION PATH.**
> The methodology is sound. The blocker is **data access**, and it is external.

## What data is actually available at ₹0, today

- **Nothing GREEN.** No source passes permitted-automation + robots-clean +
  compliance-pass + statistically-suitable + ₹0 simultaneously.
- **ORANGE (validation only):** airline tariff sheets — published bounds, useful for
  plausibility checks, not for an index. Four of five also fail the robots gate.
- **ORANGE (validation only):** the eSankhyiki CPI "Air fare (normal): economy class"
  index series — free, public, no authentication, machine-readable. This is the M7
  benchmark and the one genuinely new capability S3 produced.
- **DGCA route weights** (already in hand via spike S4, ODbL).

## Main blocker

**Data access** — specifically, legally and compliantly usable *flight-level fare
observations at controlled booking horizons*. Not methodology. Not engineering.
Not compliance design.

## Best path forward

Write to MoSPI (Prices & Cost of Living Division) and DGCA requesting the airfare
data MoSPI already receives from DGCA, citing the Expert Group report's own
recommendation 11(a) as precedent — and asking the decisive question: *may AeroDex
collect under MoSPI's authority?* Draft text in `NEXT_ACTIONS.md`. Cost: one email.
Meanwhile build the index engine, validation and compliance infrastructure against
fixtures — none of that is blocked.

## Critical unresolved questions

1. Will MoSPI authorise or delegate collection? (decision-changing)
2. What fields does DGCA's tariff dataset actually contain — bands, or offers?
3. Does SIH expect participants to collect from OTAs despite OTA terms?

## Where the detailed evidence lives

| Need | File |
|---|---|
| The verdict and the 14-point sanity check | `FINAL_S3_CONCLUSION.md` |
| Per-source status on nine axes | `SOURCE_DECISION_MATRIX.md` |
| Every claim, its evidence and confidence | `CLAIM_EVIDENCE_REGISTER.md` |
| The Tier A numbers | `evidence/tariff-comparability-results.md` |
| Yes/No decisions with revisit conditions | `DECISION_RECORD.md` |
| Ranked actions and draft outreach | `NEXT_ACTIONS.md` |
| Config-by-config keep/change | `METHODOLOGY_RECONCILIATION.md` |
| Original research, preserved | `../../spikes/` |
