# FINAL S3 CONCLUSION

**Authoritative verdict for Phase 0 spike S3.** Supersedes `docs/spikes/s3-source-mapping.md`,
`docs/spikes/s3-redo.md`, and the Tier A proposal within it.
**Date:** 23 August 2026. **Verification budget used:** 1 of 6 (logged as CLM-31).

---

## A. What did we originally believe?

That fares would be scraped from ~6 consumer OTAs, and that the only question was
technical: could a fare be retrieved without login, and was there a tier-2 JSON endpoint?
`plan.md` §1.1 stated it flatly — *"scraping publicly displayed fares … is the only
remaining path"*. The original spike (`s3-source-mapping.md`) retrieved a real fare from
ixigo, then read the terms and reversed itself to **NO-GO on terms: zero sources usable**.

It also self-corrected an earlier "GO, narrowly" verdict for ixigo, and disclosed that its
own robots gate had been enforcing nothing — `urllib.robotparser` silently discarded
ixigo's entire ruleset. That defect class is documented in `docs/spikes/robots-parser-defects.md`
and drove the custom parser now in `aerodex/compliance.py`.

## B. What did the adversarial redo disprove?

`s3-redo.md` falsified "zero sources usable". It found a source class nobody had looked
at: **regulator-mandated tariff sheets** published under Rule 135 of the Aircraft Rules
1937 and a DGCA direction of 13 May 2025. Five carriers' sheets were located and parsed,
with archived history. It also found IndiGo's terms contain an express carve-out for
downloading "in the normal course of using the … website in accordance with the published
written instructions".

It then made two errors that the next pass caught: it classified all five sources **GREEN**,
and it proposed building a "Tier A" Published Tariff Index on them.

## C. What did verification disprove about Tier A?

`s3-verification.md` tested it empirically against 14 archived IndiGo sheets (Mar 2025 –
Aug 2026) and killed it on three independent grounds. Full numbers in
`evidence/tariff-comparability-results.md`.

1. **A fare level is a band, not a price.** Median Maximum/Minimum ratio 1.52× / 1.44× /
   1.33× / 1.25× across four sheets; p90 up to 2.82×; 0.3–2.5% identical. There is no
   price in a tariff sheet — only a permitted interval. Any index must pick an arbitrary
   point inside it, and the band is *narrowing* over time, so a midpoint index would read
   band compression as deflation.
2. **Levels are not stable strata.** Median same-level month-over-month movement −21.3% to
   +10.0%; 12–53% of matched cells move more than ±25%; the ladder-shift test finds the
   best-matching offset non-zero in **5 of 11** pairs.
3. **The route panel churns.** 4,110 → 1,919 routes in one step (46.6% survival). Schema
   changed three times in eighteen months.

It also ran the check the redo never ran: **robots.txt, separately from terms**. Four of
the five "GREEN" sources fail AeroDex's own `compliance.py` gate.

## D. What is actually available today at ₹0?

- **eSankhyiki CPI "Air fare (normal): economy class" index series** — free, public, no
  authentication, machine-readable, REST API. The M7 validation benchmark. *This is the
  one genuinely new capability the whole S3 line produced.*
- **DGCA city-pair traffic weights** — already in hand via spike S4 (ODbL, `dgca-2025-city-pairs-r2`).
- **Airline tariff sheets** — as bounded reference data only, and only where robots permits
  (Fly91 alone passes cleanly).
- **Nothing that produces a flight-level fare quote at a controlled booking horizon.**

## E. What is NOT available today?

Flight-level offered fares, at controlled booking horizons, from a source that permits
automated collection at ₹0. Zero candidates, after forty-plus were examined across four
passes. Also unavailable: CPI airfare microdata (not published), DGCA TMU monthly
monitoring output (not published), and any free or academic fare tier from IATA, ATPCO,
OAG, Cirium, Amadeus, Sabre or Travelport.

## F. Does the current AeroDex methodology remain valid?

**Yes, unchanged.** Nothing in four passes touched the index design. Jevons elementary,
hedonic OLS on log fare, Lowe aggregation on DGCA weights, `require_all_inclusive: true`,
chain-linking, the 5% imputation cap — all remain correct.

It is in fact *better* supported than when written. MoSPI's own CPI 2024 series uses
**Jevons** for elementary indices and **Young/modified Laspeyres** above — matching
AeroDex's choices. And the IMF Technical Assistance mission to MoSPI recommended the
specification "include a greater variety in terms of timing (14 days advance purchase,
21 days advance purchase)" and that "the airline is a price determining characteristic
and should be part of the specification" — which is what the 7-horizon, carrier-attributed
panel already does.

## G. Is the blocker methodology, engineering, legal/compliance, or data access?

**Data access.** Unambiguously, and it is external to the project.

- *Methodology* — sound and corroborated by MoSPI's own practice.
- *Engineering* — not blocked. The engine, validation, storage and publication paths can
  all be built against fixtures today, and largely are.
- *Legal/compliance* — the compliance design is correct and, if anything, stricter than it
  needs to be. It is not the blocker; it is the thing correctly *reporting* the blocker.
- *Data access* — no permitted source exists for the required observation type. This is
  the whole of the problem.

## H. Can AeroDex satisfy its methodology from public sources without permission?

**No.** Every source carrying a booking horizon either prohibits automated collection in
terms (OTAs, airline consumer sites), gates on agency accreditation — IATA/TIDS/IATAN —
(NDC aggregators, B2B consolidators), or contractually forbids search without booking
(Duffel clause 2.3; Travelpayouts). Sources that permit collection carry no horizon.

## I. Can it with a MoSPI / DGCA / airline research agreement?

**Yes — and this is the finding that decides the project.** MoSPI performs precisely this
collection today under the Collection of Statistics Act 2008. DGCA maintains min/max
tariffs for all routes across all airlines and **has already supplied airfare data to
MoSPI on request**, minuted in MoSPI's own Expert Group report (recommendation 11(a)).
The capability exists inside government; what AeroDex lacks is authority, and the sponsor
of the problem statement is the authority.

Caveat that must travel with this: what DGCA is described as holding is *minimum and
maximum tariffs* — possibly the same band structure shown in §C to be unusable as a price.
Confirm the fields before assuming the agreement solves the problem.

## J. What does the eSankhyiki Dataset Link actually provide?

The monthly CPI **index number** for the item "Air fare (normal): economy class"
(Base 2024=100), at All-India and State/UT level, free and unauthenticated, via a
documented REST API. It provides the *output* of official price collection.

It does **not** appear to provide the *input*: fare quotes in rupees, route breakdowns,
carrier identity, booking horizon, or sub-monthly frequency. Full detail in
`evidence/esankhyiki-investigation.md`.

## K. Is the SIH "Dataset Link" a dataset, an API, a catalogue, or a portal?

**A portal** — with a catalogue and an API inside it. It is not a provided dataset.

Stated precisely, and this wording matters:

> The SIH Dataset Link does not appear to provide the underlying airfare quote microdata
> required by AeroDex; it points to the eSankhyiki statistical data portal.

`s3-addendum-esankhyiki.md` states this more strongly — "it does not contain, and has
never contained" — which the evidence does not support. Absence of a *public* dataset is
not absence of a dataset. Adjudicated: use the precise formulation above.

## L. Strongest next step?

One letter to MoSPI's Prices & Cost of Living Division and to DGCA, requesting the airfare
data MoSPI already receives from DGCA, citing recommendation 11(a) as precedent, and asking
whether AeroDex may collect under MoSPI's authority. Draft text in `NEXT_ACTIONS.md`.
It is the only action that can change the answer; everything technical has now been tested
twice and closed.

## M. What should the team STOP doing?

1. **Stop searching for sources.** Four passes, forty-plus candidates, no new class since
   the tariff sheets — and those failed. Further search has negative expected value.
2. **Stop treating public accessibility as permission.** This error appeared twice.
3. **Stop planning a Tier A tariff index.** Withdrawn on evidence.
4. **Stop writing acquisition adapters.** Nothing to point them at, and a live adapter
   would create the exact compliance exposure the design avoids.
5. **Stop asserting the DGCA direction from secondary sources** in anything public until
   the original is obtained (CLM-02).

## N. What should the team BUILD now?

1. **The index engine, hedonic model and validation path against fixtures** — unblocked,
   and it is the deliverable judges will see.
2. **The M7 eSankhyiki CPI benchmark integration** — free, public, real, and the only new
   data capability S3 produced. Prefer the documented REST API over the third-party
   `mospi-esankhyiki` client, which is alpha-status and individually authored (CLM-31).
3. **A source-plurality / coverage-ratio metric.** `plan.md` requires redundancy across
   sources and publishing a coverage ratio; **neither is encoded anywhere in code or
   config** (verified — no matches in `aerodex/`, `config/`, `scripts/`, `tests/`).
4. **The permission-path paperwork** — the letters in `NEXT_ACTIONS.md`.

---

## Nine-axis resolution

No source verdict in this consolidation collapses to a single yes/no. Every source in
`SOURCE_DECISION_MATRIX.md` is resolved separately on: technically possible · technically
available · publicly accessible · legally/contractually permitted · compliant with
AeroDex's own rules · statistically suitable · available at ₹0 · available with
institutional permission · available commercially.

The reason this matters is visible in one line: the tariff sheets are technically possible,
technically available, publicly accessible, arguably permitted for two carriers, free —
and still **RED for the index**, because they fail *statistically suitable*. A single-axis
verdict would have shipped them.

---

## FINAL PROJECT DECISION

### **B — PROCEED WITH PERMISSION PATH**

The methodology is valid and corroborated by the sponsoring ministry's own practice. The
sole blocker is access to legally and compliantly usable flight-level fare observations at
controlled booking horizons. That access exists inside government and must be obtained,
not engineered around.

**The prior hypothesis was B. It was treated as a hypothesis and it survived.** What would
have moved it:

- **→ C (modified methodology)** if the tariff sheets had been statistically suitable, or
  if any compliant source had existed that needed a different index definition. The Tier A
  experiment was the test, and it failed on the data, not on preference. No other compliant
  source appeared in four passes. **C has no source to be modified onto.** A methodology
  redesign with no data behind it is not a redesign, it is a retreat.
- **→ D (pause)** if a critical external question blocked *all* work. It does not: the
  engine, hedonic model, validation, compliance infrastructure and M7 benchmark are all
  buildable today. The eSankhyiki question — the strongest candidate for a genuine
  unknown — was resolved to a portal. D would idle a team that has real work available.
- **→ E (stop)** if the methodology were unsound or the task impossible. Neither holds:
  MoSPI performs this exact collection today. The task is achievable with authority, which
  makes E wrong.

**B is chosen on evidence, and it carries an obligation:** if the MoSPI/DGCA approach
returns nothing within the SIH timeline, the decision must be revisited — most likely to
C, redesigning around whatever bounded data the permission path does yield. That revisit
condition is recorded in `DECISION_RECORD.md`.

---

## Final sanity check

1. **Did later research invalidate an earlier conclusion?** Yes, twice. The redo falsified
   "zero sources"; verification falsified the redo's "five GREEN sources" and Tier A. Both
   are named and preserved, not rewritten.
2. **Did we treat a public webpage as an unrestricted data source?** Yes — `s3-redo.md`
   did, for five tariff sheets. Caught and corrected in `s3-verification.md`.
3. **Did we confuse technical accessibility with permission?** Yes, in the same place.
   This is the single most repeated error in the S3 line and is why the matrix now carries
   `robots status` and `Terms status` as independent columns.
4. **Did we confuse tariff data with offered-fare data?** **Yes — this was the central
   error.** Tier A treated a published fare *ladder* as if it were a price. It is a band,
   25–52% wide, re-indexed between publications. Corrected on empirical evidence.
5. **Did we confuse CPI index values with CPI raw observations?** No. The addendum drew
   the distinction correctly from the outset: eSankhyiki publishes index numbers; the
   underlying quotes are not published.
6. **Did we confuse the eSankhyiki portal with the requested dataset?** No — but the
   addendum overstated the finding ("has never contained"). Softened here to the precise
   formulation in §K.
7. **Did we verify robots.txt separately from Terms & Conditions?** Not initially — the
   redo conflated them. Verification separated them and the separation changed four
   verdicts. They are now independent columns in the matrix.
8. **Did we preserve primary vs secondary evidence?** Yes. Claims resting on secondary
   sources are marked **PRIMARY SOURCE NOT VERIFIED** in the register — most importantly
   the DGCA direction of 13 May 2025 (CLM-02).
9. **Did we distinguish "not found" from "does not exist"?** Yes, after correction.
   SpiceJet's tariff sheet is "not located", not "does not exist". eSankhyiki airfare
   microdata is "not published", not "nonexistent".
10. **Did we distinguish "not publicly available" from "unavailable to MoSPI"?** Yes, and
    it is the hinge of the whole decision. MoSPI holds airfare observations AeroDex cannot
    get; DGCA holds tariff data it has already shared with MoSPI.
11. **Did we state legal conclusions more strongly than the evidence supports?** Yes, in
    `s3-redo.md` — five GREEN classifications and a copyright argument under *Eastern Book
    Company v. D.B. Modak* presented with more weight than it bears. Both downgraded; the
    copyright point is now marked interpretation-only.
12. **Did the empirical tariff-level test support or kill Tier A?** **Killed it**, on all
    three of band-not-price, level instability, and panel churn.
13. **Is the current AeroDex methodology still internally coherent?** Yes. See
    `METHODOLOGY_RECONCILIATION.md` — every setting is Keep, with two Unresolved items
    (base period, source plurality) and no Changes required.
14. **Which single external action has the highest expected information gain?** Asking
    MoSPI whether AeroDex may collect under its authority, or receive the DGCA airfare
    data. It is the only question whose answer changes the project decision.
