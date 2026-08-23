# Next Actions

Ranked by: probability of unlocking the project → information gain → low cost → low risk.

| # | Action | Rank driver |
|---|---|---|
| NA-1 | Write to MoSPI (PSD) | Only action that can change the decision |
| NA-2 | Write to DGCA | Same question, second counterparty |
| NA-3 | Build the index engine + hedonic on fixtures | Unblocked, high value, judge-visible |
| NA-4 | Build the eSankhyiki M7 benchmark | Free, real, available today |
| NA-5 | Ask SIH for Dataset Link clarification | Cheap; resolves an expectation mismatch |
| NA-6 | Re-test IndiGo/AI robots from an Indian IP | Minutes; resolves CLM-19 |
| NA-7 | Implement coverage-ratio / plurality metric | Closes a plan-vs-code gap |
| NA-8 | Approach IndiGo / Air India NDC | Slow, lower probability |
| NA-9 | Obtain the DGCA direction in original | Housekeeping; needed before publishing CLM-02 |
| NA-10 | Write acquisition adapters | **BLOCKED — do not start** |

---

### NA-1 — Request airfare data access from MoSPI

**Why.** MoSPI collects airfares from online platforms under statutory authority (CLM-04,
CLM-03) and has already obtained airfare data from DGCA on request (CLM-22). It is the
sponsor of the problem statement. This is the only action whose answer changes the project
decision.
**Owner.** Project lead / faculty mentor (institutional letterhead materially improves the
response rate).
**Cost.** ₹0, one email. **Time.** 1 h to send; 2–6 weeks to hear back.
**Dependency.** None. Send today.
**Success.** Any of: microdata released; collection authorised under MoSPI's authority; or
DGCA's dataset shared with field descriptions.
**Failure.** No response in 4 weeks, or refusal.
**Then.** On success → build the adapter for the sanctioned source (unblocks D-6). On
failure → escalate to NA-2/NA-8, and prepare decision **C** using whatever bounded data
exists.

---

### NA-2 — Request the tariff dataset from DGCA

**Why.** DGCA maintains min/max tariffs for all routes across all airlines (CLM-22) and runs
the 78-route Tariff Monitoring Unit (CLM-21). Even a negative answer is informative: it
tells us whether the government's own holding is bands or offers (OQ-2).
**Owner.** Project lead. **Cost.** ₹0. **Time.** 2–8 weeks; RTI is a fallback with a
statutory 30-day clock.
**Dependency.** Send in parallel with NA-1, not after.
**Success.** Field list disclosed; ideally the data.
**Failure.** Refusal, or s.8(1)(d) commercial-confidence exemption on an RTI.
**Then.** If the holding is bands only, it cannot support the index (same failure mode as
Tier A) — record that and rely on NA-1/NA-8.

---

### NA-3 — Build the index engine, hedonic model and validation against fixtures

**Why.** Completely unblocked, and it is the deliverable judges see. The engine is already
a pure function with golden tests; the DGCA weights are populated.
**Owner.** Engineering. **Cost.** ₹0. **Time.** Continuous.
**Dependency.** None.
**Success.** Reproducible index from the frozen panel; hedonic fits or falls back cleanly;
M6 bit-identical re-runs hold.
**Failure.** n/a — this is core work.
**Then.** Ready to accept real data the day access lands.

---

### NA-4 — Integrate the eSankhyiki CPI air-fare index for M7

**Why.** Free, public, unauthenticated, machine-readable, and the **only new data
capability the whole S3 line produced** (CLM-24).
**Owner.** Engineering. **Cost.** ₹0. **Time.** ~1 day.
**Dependency.** None.
**Caution.** Prefer the documented REST API. The `mospi-esankhyiki` PyPI client is
MIT-licensed but **alpha-status and individually authored** (CLM-31, verified) — not an
official MoSPI product. Do not describe it as one.
**Success.** Monthly "Air fare (normal): economy class" series pulled programmatically and
wired to M7.
**Failure.** API shape differs from documentation → fall back to CSV/XLSX download.

---

### NA-5 — Ask SIH / the problem-statement owner what the Dataset Link is for

**Why.** PS 26056 lists eSankhyiki as its "Dataset Link", but eSankhyiki publishes index
outputs, not the fare quotes the PS asks participants to collect (CLM-24). Either the link
is a contextual/validation reference, or an unpublished dataset is intended. That
distinction changes the build.
**Owner.** Team lead via the SIH portal. **Cost.** ₹0. **Time.** days.
**Success.** A stated intent.
**Failure.** No response — then assume "validation benchmark", which is the reading the
evidence supports.

---

### NA-6 — Re-test IndiGo and Air India robots.txt from an Indian IP

**Why.** Both timed out twice from a non-Indian egress (CLM-19). Under `compliance.py`
unreachable ⇒ refuse, so this single fact decides whether even validation use of the IndiGo
tariff sheet is permitted.
**Owner.** Engineering, once the S1 Oracle Mumbai/Hyderabad instance exists.
**Cost.** ₹0. **Time.** minutes. **Dependency.** S1.
**Success.** HTTP 200 with parseable rules → IndiGo becomes a usable validation source
(D-3). **Failure.** Still unreachable → the refusal stands and is correct.

---

### NA-7 — Implement the coverage-ratio and source-plurality metric

**Why.** `plan.md` §5.2 promises "redundancy across sources instead of evasion" and that a
dropped source publishes a coverage ratio. **Neither is encoded anywhere** — verified by
grep across `aerodex/`, `config/`, `scripts/`, `tests/`. The pitch asserts a property the
code does not have.
**Owner.** Engineering. **Cost.** ₹0. **Time.** ~1 day.
**Success.** Coverage ratio computed per stratum and published with every index point.

---

### NA-8 — Approach IndiGo and Air India for NDC research access

**Why.** The only non-government route to horizon-controlled offered fares (CLM-27).
**Owner.** Project lead. **Cost.** ₹0 to ask. **Time.** 4–12 weeks.
**Dependency.** Strongest with a MoSPI endorsement in hand — so sequence after NA-1.
**Success.** A research or evaluation agreement, ideally waiving look-to-book for a capped
volume.
**Failure.** Referral to standard commercial distribution terms — which fail at ₹0.

---

### NA-9 — Obtain the DGCA direction of 13 May 2025 in original

**Why.** CLM-02 is **PRIMARY SOURCE NOT VERIFIED**; `dgca.gov.in` was unreachable across
two sessions. It is quoted in the research and must not appear in a submission as fact
until the original is in hand.
**Owner.** Anyone. **Cost.** ₹0. **Time.** minutes, once reachable.
**Success.** The PDF, filed under `docs/research/s3/evidence/`.

---

### NA-10 — Write acquisition adapters — **BLOCKED**

Do not start. See D-6. Unblocks only on written permission naming a specific source.

---

## Draft outreach — NA-1 (not sent)

> **Subject:** Request for guidance on airfare price data — Smart India Hackathon PS 26056 (Real-Time Airfare Price Index)
>
> To: Deputy Director General, Prices & Cost of Living Division, Ministry of Statistics and Programme Implementation
>
> Madam / Sir,
>
> We are a student team working on Smart India Hackathon Problem Statement 26056, "Real-Time
> Airfare Price Index for India", which lists MoSPI as the sponsoring ministry. We are
> writing to seek guidance on data access before we build anything, rather than after.
>
> Our design follows the methodology MoSPI has itself adopted. We compute elementary indices
> using the Jevons formula and aggregate with fixed traffic weights derived from DGCA
> city-pair passenger data, in line with the CPI 2024 series. We collect across several
> booking horizons and three intra-day windows, following the recommendation of the IMF
> Technical Assistance mission recorded in the Expert Group Report that the airfare
> specification "include a greater variety in terms of timing (14 days advance purchase, 21
> days advance purchase)" and that "the airline is a price determining characteristic".
>
> Our difficulty is access, not method. The CPI 2024 FAQ (Q27) records that "Airfares are
> collected through well-known online platforms". We have examined the terms of use of the
> major Indian online travel platforms and airline websites, and each prohibits automated
> collection without express written permission. We have not collected any data from them
> and do not intend to without authorisation. We understand that MoSPI's own collection
> rests on the Collection of Statistics Act, 2008, an authority we do not have.
>
> We would be grateful for guidance on any of the following:
>
> 1. Whether the airfare price observations underlying the CPI item "Air fare (normal):
>    economy class" — or any anonymised or aggregated extract of them — could be made
>    available for this work.
> 2. Whether the Ministry could authorise, or bring within its own collection framework, an
>    automated collection of publicly displayed airfares for statistical purposes only,
>    with published methodology, no redistribution of source content, and conservative
>    request pacing.
> 3. Whether the airfare data the Ministry obtains from the Directorate General of Civil
>    Aviation could be shared, together with a description of its fields. We note the Expert
>    Group Report's recommendation that airfare prices "may be obtained from DGCA, as they
>    maintain data on the minimum and maximum tariffs for all routes across all airlines to
>    monitor airfares."
> 4. Whether the eSankhyiki link given as the "Dataset Link" for PS 26056 is intended as a
>    validation benchmark, or whether a separate dataset is to be provided to participants.
>
> Our methodology, source assessment and compliance rules are documented and can be shared
> in full. We would welcome any correction to our reading of the position.
>
> With respect,
>
> *[Name], [Institution] — [email], [phone]*
> *Team [name], Smart India Hackathon 2026, PS 26056*

**Before sending:** confirm the current addressee and address from the MoSPI website; attach
`S3_EXECUTIVE_SUMMARY.md`; send NA-2 to DGCA in parallel with items 3 and 4 adapted.
