# Open Questions

Four buckets. Ranked within each by whether the answer could change the project decision.

---

## CONFIRMED — high confidence, treat as settled

| # | Statement | Evidence |
|---|---|---|
| C-1 | No source provides flight-level offered fares at controlled booking horizons, permitted, at ₹0. Zero GREEN after four passes. | `SOURCE_DECISION_MATRIX.md` |
| C-2 | Tariff `Fare-N` is not a stable matched stratum — band not price, ladder re-indexed, panel churns. | CLM-10, CLM-11, CLM-36 |
| C-3 | MoSPI collects airfares from "well-known online platforms" for CPI 2024. | CLM-04 |
| C-4 | MoSPI uses Jevons for elementary and Young/modified Laspeyres above — matching AeroDex. | CLM-34 |
| C-5 | Duffel contractually bars an excessive Search-to-Order Ratio, with zero orders counted as one. | CLM-25 |
| C-6 | Travelpayouts prohibits automatic requests for prices, and states the GDS-cost reason. | CLM-26 |
| C-7 | AIX robots.txt disallows `/content/dam` — its own tariff sheet's path. | CLM-16 |
| C-8 | `urllib.robotparser` has four defects, each granting access a site refused. | CLM-38 |
| C-9 | eSankhyiki publishes the CPI air-fare **index**, free and unauthenticated, not fare quotes. | CLM-24 |
| C-10 | The current AeroDex methodology is internally coherent and unaffected by S3. | `METHODOLOGY_RECONCILIATION.md` |

## PROBABLE — strong but not fully verified

| # | Statement | Gap |
|---|---|---|
| P-1 | The DGCA direction of 13 May 2025 exists as described. | **PRIMARY SOURCE NOT VERIFIED** — secondary only; `dgca.gov.in` unreachable (CLM-02, NA-9) |
| P-2 | IndiGo's and Akasa's download carve-out covers the tariff sheet. | Reasonable reading, untested; the separate no-copy clause still binds (CLM-20) |
| P-3 | SpiceJet publishes a tariff sheet under the same DGCA duty. | **Not located** — which is not "does not exist" (CLM-19) |
| P-4 | Air India's T&C bars manual copying as quoted. | Clause surfaced via search; the page itself timed out (CLM-15) |
| P-5 | No free or academic **fare** tier exists at IATA / ATPCO / OAG / Cirium. | "Not found", not "does not exist" (CLM-30) |
| P-6 | The Aug–Oct 2025 IndiGo route shortfall is a partial publication rather than a partial capture. | `NOT RECORDED` |

## UNRESOLVED — needs external confirmation. Ranked by decision impact.

### OQ-1 — Will MoSPI authorise or delegate airfare collection? ★ decision-changing
**Why it matters.** It is the whole project. B stands or falls here.
**Who can answer.** Deputy Director General, Prices & Cost of Living Division, MoSPI.
**Ask, verbatim.** *"Could the Ministry authorise, or bring within its own collection
framework, an automated collection of publicly displayed airfares for statistical purposes
only — with published methodology, no redistribution of source content, and conservative
request pacing?"*
**If YES.** D-6 unblocks; adapters are written against a named, sanctioned source; the
project proceeds as designed. **If NO.** Escalate to OQ-3 (airlines); if that also fails,
the decision moves from **B** to **C**.

### OQ-2 — What fields does DGCA's airfare dataset actually contain? ★ decision-changing
**Why it matters.** It is described as *"minimum and maximum tariffs"* — the same band
structure proven unusable as a price (CLM-10). If DGCA holds only bands, the government
route yields validation data, not index input, and B's payoff shrinks sharply.
**Who can answer.** DGCA (Air Transport Directorate); MoSPI PSD, which already receives it.
**Ask, verbatim.** *"For the airfare data the Directorate maintains to monitor tariffs,
could you share the field list — in particular whether observations carry a departure date,
a flight number, a booking or collection date, and a single fare value rather than a
minimum–maximum range?"*
**If offers with horizons.** The single best outcome available; supersedes everything.
**If bands only.** Record it, downgrade the DGCA path to validation, lean on OQ-1 and OQ-3.

### OQ-3 — Would an Indian carrier grant NDC research access with a look-to-book waiver?
**Why it matters.** The only non-government route to horizon-controlled offered fares.
**Who can answer.** IndiGo developer relations; `ndcdistribution@airindia.com`.
**Ask, verbatim.** *"Would IndiGo consider a non-commercial research agreement granting
read-only AirShopping access at a capped request volume, for a public statistical index,
with no booking intent and no redistribution of offer content?"*
**If YES.** Best-quality data in the project; one carrier is enough to start.
**If NO.** Expected; costs only the asking.

### OQ-4 — Does SIH expect participants to collect from OTAs despite OTA terms?
**Why it matters.** Changes what the submission should claim, and whether the compliance
posture is an asset or an obstacle in judging.
**Who can answer.** SIH organisers / the PS owner at MoSPI.
**Ask, verbatim.** *"Is the eSankhyiki link given as the Dataset Link for PS 26056 intended
as a validation benchmark, or is a separate airfare dataset to be provided to participants?"*
**If a dataset is provided.** Re-run S3 against it. **If validation only.** Confirms the
current reading; present the compliance finding as a deliverable.

### OQ-5 — Are IndiGo's and Air India's robots.txt reachable from an Indian IP?
**Why it matters.** Decides whether even validation use of the IndiGo tariff sheet passes
`compliance.py`. Small scope, near-zero cost (NA-6).
**Who can answer.** The team, once the S1 Oracle Mumbai/Hyderabad instance exists.

### OQ-6 — Do the other four carriers' tariff sheets show the same instability?
**Why it matters.** Low. Only IndiGo was tested in series. Given C-2 it is unlikely to
change anything, but the claim is currently generalised from one carrier.

## BLOCKED — cannot currently be verified

| # | Question | Why blocked |
|---|---|---|
| B-1 | The exact text of the DGCA direction of 13 May 2025 | `dgca.gov.in` unreachable across two sessions from this network. Retry from an Indian IP, or obtain by RTI |
| B-2 | Whether the IndiGo/Air India robots timeouts are geo-blocking or genuine | Requires an Indian egress the project does not yet have (depends on S1) |
| B-3 | SpiceJet's current tariff-sheet location | Old path returns HTML; no sitemap entry found. Ask SpiceJet directly |
| B-4 | Whether CPI airfare microdata could ever be released | Policy question inside MoSPI; only OQ-1 can surface it |
| B-5 | The 2025-12-09 IndiGo sheet anomaly (122 pp, 5,664 routes, single populated level) | Not diagnosed; `NOT RECORDED`. Re-parse if the tariff path is ever revived |
