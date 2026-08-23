# Evidence — API and distribution channels

Why no sanctioned channel supplies horizon-controlled offered fares without a booking
relationship. This is the structural finding of S3, and it survived a deliberate attempt to
falsify it.

---

## 1. The mechanism, in the providers' own words

Airline distribution meters **search** and recovers the cost from **bookings**. The
look-to-book ratio was roughly 1:50 with human agents, ~1:500 with OTAs, and past 1:10,000
with metasearch. AeroDex issues ~1,155 searches a day and books nothing, so its ratio is
undefined by construction.

**Duffel Services Agreement** *(CLM-25 — primary, re-verified in two sessions)*

> **2.3** "You shall not use the Services in such a way that Duffel believes (acting
> reasonably) has or is likely to have an adverse impact on the Services, including sending
> excessive calls to the Duffel Platform and **an excessive Search-to-Order Ratio**."

> *Definition* — "the ratio calculated by the total number of calls to the Offer Request
> end-points of the Duffel Platform ('Searches') divided by the total number of Orders
> created in any given time period. **For the avoidance of doubt, zero Orders shall be
> treated as one Order** for the purposes of calculating the Search-to-Order Ratio."

> **2.5(d)** — prohibits "access or use the Services for **metasearch purposes** (including
> to build a metasearch on top of the Duffel Platform and/or to redistribute to a metasearch
> platform)."

Free searches are *earned by orders*. At zero orders AeroDex earns none, would pay per
search — **and remains in breach of 2.3 after paying**, because the ratio itself is the
prohibited thing. Paying does not cure it.

**Travelpayouts Help Centre** *(CLM-26 — primary, read directly)*

> "Yes, we prohibit sending automatic requests, especially just to get prices. **Agencies
> pay revenue for each request to GDS (Global Distribution System). So, high amount of
> requests without bookings will cost a lot for them.** They will address us to ask why
> there are no bookings with such big amount of requests being made. We and you get revenue
> from agencies, so we need to respect the rules."

Two unrelated providers, one contractual and one explanatory, describing the same mechanism.
This also **falsifies `plan.md` §5.8**, which endorses Travelpayouts as a free cross-check
source. That endorsement should be removed or downgraded.

## 2. The accreditation gate

NDC aggregators — AirGateway, Verteil, Kyte, TPConnects, Mystifly — require an **IATA, TIDS
or IATAN** number, because airline NDC programmes are bound to agency identity *(CLM-28)*.
Indian B2B consolidators (TBO, TripJack) additionally require agency registration, GST
registration and a negotiated security deposit; none publishes a rate card.

AeroDex is not a travel agency and cannot hold an accreditation. This gate is categorical,
not commercial — it cannot be bought around at any price without becoming an agency.

## 3. Channel-by-channel

| Channel | Horizon? | Gate | Status |
|---|---|---|---|
| Duffel | ✓ | Search-to-Order Ratio; metasearch bar | **RED** |
| Travelpayouts | ✗ (cached, cheapest-per-day) | automatic price requests prohibited | **RED** |
| Amadeus Self-Service | — | **decommissioned 17 Jul 2026**, keys disabled | **RED** |
| Amadeus AQC / Enterprise | ✓ | commercial agreement, booking volume expected | RED at ₹0 |
| Sabre Dev Studio / Bargain Finder Max | ✓ | account representative provisioning | RED at ₹0 |
| Travelport | ✓ | commercial agreement | RED at ₹0 |
| NDC aggregators | ✓ | IATA / TIDS / IATAN | **RED** |
| TBO / TripJack / Mystifly | ✓ | agency registration + GST + deposit | YELLOW |
| Skyscanner Travel API | ✓ | partner approval, traffic requirement, booking funnel | YELLOW |
| Skyscanner Travel Insight | partial | enterprise; average fares, not quotes | YELLOW |
| Kayak / Momondo / Wego | ✓ | partner approval gated on traffic | RED at ₹0 |
| Kiwi Tequila | ✓ | invitation-only | **RED** |
| IATA PaxIS / ATPCO / OAG / Cirium | ✓ | enterprise licence; no free or academic **fare** tier found | YELLOW commercially |
| IndiGo / Air India NDC | ✓ | distribution or partner agreement | **YELLOW — the airline research-agreement path** |

## 4. Falsification attempt — result

The claim tested: *no legally sanctioned source provides controlled booking-horizon offered
fares without a commercial booking relationship.*

Searched: airline NDC programmes, B2B consolidators, NDC aggregators, GDS, sanctioned APIs,
free-tier flight APIs, academic and research repositories (Zenodo, Dataverse, ICPSR),
commercial datasets, government arrangements, scraping intermediaries, and public archives.

**No counterexample was found.** Every horizon-bearing channel gates on accreditation, a
booking relationship, or enterprise licensing. Every channel that permits collection carries
no horizon.

**Standing qualification.** This is *"no counterexample found across four passes"*, not
*"no counterexample exists"*. The most likely places for one to appear are (a) a bespoke
research agreement with a single airline, and (b) an institutional arrangement via MoSPI or
DGCA — which is precisely why the decision is **B**, not **E**.
