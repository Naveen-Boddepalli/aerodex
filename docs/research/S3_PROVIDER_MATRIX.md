# S3 → S4 PROVIDER MATRIX

**Research date: 25 August 2026.** All pricing and access claims verified on that date
against the sources in `S3_EVIDENCE/pricing_sources.md`. Anything not verifiable is marked
**UNKNOWN** rather than estimated.

Availability classes used throughout, as specified by the project owner:

| Class | Meaning |
|---|---|
| **A** | Legitimately available through an API / account / contract |
| **B** | Available only after provider approval |
| **C** | Paid but realistically purchasable |
| **D** | Enterprise-only / impractical for this project |
| **E** | Requires booking / conversion obligations |
| **F** | Technically accessible but contractually unsuitable |
| **G** | Would require prohibited circumvention |

---

## 1. Headline verdicts

| Provider | Data type | Real or derived | India coverage | Class | Monthly cost — DEMO / SMALL / FULL | Score /100 | Verdict |
|---|---|---|---|---|---|---|---|
| **SerpApi (Google Flights)** | Live offered fares | Real | Full | **A/C** | **$25 / $150 / $725** | **88** | **PRIMARY (demo)** |
| **HasData (Google Flights)** | Live offered fares | Real | Full | **A/C** | **$49 / $49 / $99** | **85** | **PRIMARY (scale)** |
| **SearchApi.io (Google Flights)** | Live offered fares | Real | Full | A/C | $40 / $100 / $250 | 78 | Viable third option |
| **Duffel** | NDC offers | Real | Good (IndiGo, AI on NDC) | **B/C** | **$4.50 / $63 / $189** | **74** | **BACKUP — clear clause 2.5(d) first** |
| Apify (Google Flights actors) | Live offered fares | Real | Full | A/C | UNKNOWN (see §4) | 62 | Fallback; actor quality varies |
| Bright Data / Oxylabs / Zyte | Scraping infrastructure | Real | Full | A/C | UNKNOWN — not priced per flight search | 55 | You build the parser; more effort, no gain over above |
| Kiwi Tequila | Live offered fares | Real | Good | **B** | n/a | 40 | Invite-only 2026; needs a live travel product |
| Skyscanner Travel API | Live prices | Real | Good | **B/E** | n/a | 30 | Partner approval gated on traffic + booking funnel |
| Amadeus Self-Service | — | — | — | **dead** | n/a | 0 | **Decommissioned 17 July 2026** |
| Amadeus AQC / Enterprise, Sabre, Travelport | GDS content | Real | Full | **D/E** | UNKNOWN — enterprise sales | 25 | Account manager, booking volume expected |
| TripJack / TBO / Mystifly | B2B consolidator | Real | Full | **D/E** | ₹50k–₹100k setup, reported ₹2 lakh deposit | 20 | Agency onboarding; booking obligations |
| OAG Airfare / Altus Data | Historical airfare | Real, but historical | Full | **D** | UNKNOWN — Snowflake / enterprise feed | 35 | Right fields incl. advance-purchase days; wrong delivery model and price tier |
| ATPCO | Filed tariffs | Filed, not offered | Full | **D** | UNKNOWN | 20 | Filed fares ≠ offered fares |
| Cirium | Schedules + fares | Real | Full | **D** | UNKNOWN | 20 | Enterprise licence |
| IATA PaxIS / DDS / MarketIS | Ticketed (MIDT) | Transacted, not offered | Full | **D** | UNKNOWN | 20 | Transaction data, no booking horizon at offer time |
| IndiGo / Air India NDC direct | NDC offers | Real | Single carrier | **B/E** | UNKNOWN | 30 | Requires airline commercial agreement; single-carrier defeats the panel |
| Indian OTAs (MMT, Cleartrip, ixigo, Yatra, EMT) | Live offered fares | Real | Full | **F** | ₹0 | — | **Terms prohibit automated retrieval. Unchanged and still external.** |

---

## 2. Part 3 — does the provider actually solve the methodology?

The twenty-question check. `✓` = yes, `✗` = no, `~` = partial.

| # | Question | SerpApi / HasData / SearchApi | Duffel |
|---|---|---|---|
| 1 | Specify departure date? | ✓ `outbound_date` | ✓ `departure_date` |
| 2 | Specify route? | ✓ `departure_id` / `arrival_id` | ✓ origin / destination |
| 3 | Multiple carriers per query? | ✓ all carriers on the O–D | ✓ all connected NDC carriers |
| 4 | Actual offered fares, not cached averages? | ✓ live Google Flights results | ✓ live NDC offers |
| 5 | **Control booking horizon?** | ✓ **by construction** — horizon = `outbound_date` − collection date | ✓ same |
| 6 | Repeat same query at different timestamps? | ✓ | ✓ |
| 7 | Returns taxes? | ✗ not itemised (total **is** tax-inclusive) | ✓ tax breakdown |
| 8 | Returns baggage? | ~ free-text in `extensions[]` | ✓ structured |
| 9 | Returns stops? | ✓ `layovers[]` | ✓ segments |
| 10 | Returns duration? | ✓ `total_duration` (minutes) | ✓ |
| 11 | Returns departure time? | ✓ | ✓ |
| 12 | Returns fare brand? | ✗ | ✓ |
| 13 | Returns refundability? | ✗ | ✓ conditions |
| 14 | Stable identifiers for matching? | ~ `booking_token` is volatile; carrier + flight_number + date is a stable natural key, which `normalise.py` already builds | ✓ offer + segment IDs |
| 15 | Historical storage permitted? | Not prohibited in terms reviewed | ~ clause 3.2 requires weekly refresh of *displayed content*; fare retention not clearly barred |
| 16 | Contract permits research / statistical analysis? | ✓ sold for analytics; SerpApi adds a $2M legal shield | UNKNOWN — needs written confirmation |
| 17 | Permits publishing **derived** statistics? | Not prohibited in terms reviewed | Not addressed |
| 18 | Requires a booking / conversion funnel? | ✗ **none** | ✗ none required, but see 19 |
| 19 | Look-to-book / search-to-order limits? | ✗ **none** | ⚠️ **clause 2.3** caps search-to-order ratio; with zero orders the denominator is zero |
| 20 | Prohibits price monitoring / benchmarking / index construction? | Not found | ⚠️ **clause 2.5(d)** prohibits "metasearch purposes" |

**Reading:** the Google Flights derivatives win on questions 18–20 — the exact three that
killed every booking-oriented API in the previous S3. Duffel wins on 7–13, the field
richness. That is the whole trade.

> **Do not mark a provider GREEN merely because an API returns fares.** Every RED in the
> previous S3 was a question 16–20 failure, not a question 1–14 failure.

---

## 3. Part 4 — providers whose business model permits search without booking

This was the previous S3's structural blocker: *"every distribution channel meters search
and recovers the cost from bookings."* That statement is true of **distribution** APIs. It
is **false** of the *data/intelligence* product category, which the previous passes did not
examine as a class.

| Product category | Business model | Search-without-booking |
|---|---|---|
| **Search-result APIs** (SerpApi, HasData, SearchApi, Apify) | You pay per search. Revenue *is* the search | ✅ **Explicitly the product** |
| **Scraping infrastructure** (Bright Data, Oxylabs, Zyte) | You pay per request/GB | ✅ Permitted by the vendor; you carry target-site compliance |
| **Airfare intelligence** (OAG Airfare Insights, OAG Altus Data) | Enterprise data licence | ✅ Permitted, but historical delivery and enterprise pricing |
| **Distribution APIs** (Duffel, Amadeus, Sabre, Travelport, Kiwi, TripJack) | Revenue from bookings | ⚠️ Metered or capped by look-to-book |
| **Metasearch partner APIs** (Skyscanner, Kayak, Wego) | Referral revenue | ❌ Gated on traffic and a booking funnel |

**This reclassification is the finding that overturns the previous NO-GO.** The previous
research searched the distribution category exhaustively and concluded no source existed.
The correct conclusion was narrower: *no **distribution** source existed at ₹0.* A
different product category — one AeroDex never priced — solves the problem directly.

---

## 4. What remains UNKNOWN

Recorded honestly rather than estimated:

| Item | Why unresolved |
|---|---|
| Apify Google Flights actor cost per **search** | Listed at "$1 per 1,000 results"; whether a "result" is one itinerary or one search is not stated. At ~6 itineraries/search the two readings differ 6× |
| Bright Data / Oxylabs / Zyte effective cost per flight search | Priced per request/GB, not per flight search. Depends on page weight and retry rate — needs a measured trial |
| SerpApi credit rollover on a *stable* plan | Docs describe rollover to "Extra Credits" on downgrade; monthly expiry on a stable plan is not stated |
| SearchApi.io credits per Google Flights search | Not published; may exceed 1 credit per search |
| OAG Altus Data / Airfare Insights pricing | Enterprise, quote-only |
| ATPCO, Cirium, IATA PaxIS pricing | Enterprise, quote-only |
| Amadeus AQC pricing and eligibility for a student team | Enterprise, account-manager gated |
| Whether Duffel considers a statistical index "metasearch" under 2.5(d) | Requires written answer from Duffel |
| TripJack ₹2 lakh deposit figure | Reported by third-party integrators, not TripJack's own published pricing |

---

## 5. Scoring method

Score /100 is the weighted sum of the ten criteria the project owner specified in Part 6:
real fare quality (15), controlled booking horizon (15), Indian domestic coverage (10),
multi-carrier coverage (10), cost (15), contract suitability (15), ease of obtaining access
(10), historical storage (5), derived-index publication (5). Enterprise-only providers lose
most of their points on *ease of access* and *cost*, not on data quality — several of them
have better data than the recommendation and are simply out of reach.
