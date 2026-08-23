# Decision Record

Eight decisions, each Yes/No, with the evidence behind it and the condition that reopens it.
Nothing here was decided because it would be satisfying to implement.

---

### D-1 — Abandon the current methodology?

**NO.**

**Reason.** Four passes tested sources, never the method. Nothing found invalidates Jevons
elementary, hedonic OLS on log fare, Lowe aggregation on DGCA weights, or the all-inclusive
requirement. MoSPI's own CPI 2024 series uses **Jevons** for elementary indices and
**Young/modified Laspeyres** above — the same family of choices. The IMF Technical
Assistance mission to MoSPI recommended multiple advance-purchase horizons and naming the
airline as a price-determining characteristic; AeroDex already does both.

**Evidence.** CLM-34, CLM-06, CLM-07 · `evidence/government-methodology.md`

**Revisit if.** The permission path yields data whose shape cannot support matched-model
comparison — e.g. if DGCA's holding turns out to be bands only (OQ-2). Then D-1 reopens as
decision **C**.

---

### D-2 — Switch to tariff sheets as the index source?

**NO. Withdrawn on empirical evidence.**

**Reason.** Three independent disqualifying findings. A "fare level" is a band, not a price
(median Max/Min 1.25×–1.52×, p90 to 2.82×, 0.3–2.5% identical). Levels are not stable
strata (median same-level month-over-month −21.3% to +10.0%; 12–53% of cells moving >±25%;
best-matching ladder offset ≠ 0 in 5 of 11 pairs). The route panel churns to 46.6% survival
in one step, and the schema changed three times in eighteen months. The class also carries
no departure date, flight number, time, or booking horizon.

**Evidence.** CLM-10, CLM-11, CLM-36, CLM-37 · `evidence/tariff-comparability-results.md`

**Revisit if.** Never on the current evidence. Only a change in what carriers publish —
e.g. a DGCA direction mandating flight-level or horizon-tagged disclosure — would reopen it.

---

### D-3 — Retain tariff sheets as validation / reference data?

**YES, narrowly, and only where robots permits.**

**Reason.** They are published upper and lower bounds on what a carrier may charge. That is
exactly what DGCA's own Tariff Monitoring Unit uses them for — checking that observed fares
sit inside declared bands. As a plausibility check on future observations, and as a
cross-check for `validation.fare_min_inr` / `fare_max_inr`, they have real value.

**Constraint that must be honoured.** Only Fly91's robots.txt permits automated retrieval.
Air India Express explicitly disallows the sheet's own path; Akasa's asset host returns 403;
IndiGo's and Air India's robots.txt are unreachable. Under `aerodex/compliance.py` four of
five are refused. **Do not build automated retrieval for those four.**

**Evidence.** CLM-16, CLM-17, CLM-18, CLM-19 · `evidence/compliance-evidence.md`

**Revisit if.** NA-6 shows IndiGo/Air India robots.txt are reachable from an Indian IP —
that would move IndiGo (which has a download carve-out) to a usable validation source.

---

### D-4 — Continue pursuing MoSPI / DGCA data access?

**YES — this is the critical path.**

**Reason.** MoSPI collects airfares from online platforms today under the Collection of
Statistics Act 2008. DGCA maintains min/max tariffs for all routes across all airlines and
**has already supplied airfare data to MoSPI on request**, minuted in MoSPI's own Expert
Group report. The capability exists inside government; AeroDex lacks only authority, and
the sponsor of the problem statement is the authority.

**Evidence.** CLM-04, CLM-03, CLM-22 · `evidence/government-methodology.md`

**Revisit if.** No substantive response within the SIH timeline — then escalate to D-5 and
prepare decision C.

---

### D-5 — Pursue airline / NDC permission?

**YES, but second priority.**

**Reason.** IndiGo and Air India both run NDC partner programmes, and an airline can waive
its own terms in a way no OTA can waive an airline's. It is the only non-government route
to horizon-controlled offered fares. But it will collide with look-to-book economics and
will likely need a research waiver rather than a standard distribution contract — a slower
and less certain path than D-4.

**Evidence.** CLM-27, CLM-25, CLM-26 · `evidence/api-distribution-evidence.md`

**Revisit if.** D-4 succeeds — then D-5 becomes optional redundancy rather than a
second attempt at the same goal.

---

### D-6 — Build the scraper now?

**NO.**

**Reason.** There is nothing compliant to point it at. Every source with a booking horizon
is prohibited, accreditation-gated, or contractually bars search without booking. Building
a live adapter now would create exactly the compliance exposure the design exists to avoid,
and `aerodex/compliance.py` would refuse the requests anyway. The fixture adapter is the
correct state of `aerodex/acquire/adapters/` until access is established.

**Evidence.** `SOURCE_DECISION_MATRIX.md` (zero GREEN) · `evidence/api-distribution-evidence.md`

**Revisit if.** D-4 or D-5 returns written permission naming a source. Then, and only then,
write the adapter for that source.

---

### D-7 — Build the index / calculation engine now?

**YES. Highest-value engineering available.**

**Reason.** Entirely unblocked. The engine is a pure function of `(panel, config)`, the
golden tests exist, the DGCA weights are populated (`dgca-2025-city-pairs-r2`), and the
publisher already refuses to release an unpublishable run. This is also the part judges
will actually see. Add: the eSankhyiki M7 benchmark integration, and the coverage-ratio /
source-plurality metric that `plan.md` requires but nothing implements.

**Evidence.** CLM-24, CLM-31 · `evidence/esankhyiki-investigation.md` · MR-14

**Revisit if.** Never — this is the work.

---

### D-8 — Should S3 remain a hard blocker for the whole project?

**NO. Re-scope it from a project blocker to an acquisition blocker.**

**Reason.** As written, `plan.md` §8 makes S3 gate everything: *"Fewer than 3 sources usable
→ redesign the panel around the survivors before building anything."* Taken literally that
halts a project which has substantial unblocked work — the engine, hedonic model,
validation, storage, publication, compliance infrastructure and M7 benchmark.

The honest formulation is narrower: **S3 blocks acquisition, and only acquisition.** It
should gate Phase 2 (adapters), not Phase 1 or 3.

Note also that the kill condition itself is mis-specified: it counts *sources* when what
matters is *permitted observations at controlled horizons*. A project with five publicly
visible sources and zero permitted ones passes the letter of the condition and fails its
intent — which is precisely what happened in `s3-redo.md`.

**Evidence.** `plan.md` §8 · `FINAL_S3_CONCLUSION.md` §G · MR-14

**Revisit if.** The kill condition is rewritten. Proposed replacement in
`METHODOLOGY_RECONCILIATION.md` MR-14 — documented there, not applied.
