# How other countries build an airfare price index — and why India has not

**Status:** research note · **Research date: 10 September 2026** · author: project
owner
**Scope:** PS SIH26056 asks for *"a real-time airfare price index for India … for
augmentation of the Consumer Price Index"*. This note asks how the problem is
already solved elsewhere — China first, then the statistical frontier (US, UK,
Australia, EU) — what structural facts let them solve it, why India has not done
it until now, and what India should do.

> **One-line verdict.** Every country that measures airfares well does it by
> *owning a data tap* — a state-run reservation system (China), a mandatory
> ticket-transaction filing (US), or a funded web-scraping unit inside the
> statistical office (UK, Australia, Netherlands). India has none of the three
> yet. The scraper PS SIH26056 asks for is the right *first* move, but it is a
> bridge, not the destination; the destination is a reporting mandate plus a
> real-time-prices unit in the NSO.

---

## Executive summary

| Question | Answer |
|---|---|
| **What is the problem, really?** | Airfares are dynamically priced, vary by booking horizon and season, and there is no free feed. A CPI needs a *constant-quality* price for the *same trip* over time. That requires (a) a stable route panel, (b) fixed advance-purchase windows, (c) a data source that does not vanish or block you. |
| **How does China solve it?** | Structurally. **TravelSky**, a central state-owned enterprise, is the monopoly reservation system for every domestic Chinese airline — the state sees every fare by construction. The regulator (CAAC) historically *set* the fare formula and still sets bands on thin routes, and publishes a monthly **domestic air-ticket price index** (base Jan 2004 = 100). NBS folds air transport into the CPI "transport & communication" division (≈14.3 % weight, 2025 base). Data access is a non-problem because the plumbing is public. |
| **How does the US / UK / Australia solve it?** | **US:** a *mandatory* filing — every large carrier reports a sample of actual tickets to the Dept. of Transportation (Databank 1B / Origin-&-Destination Survey, now a 40 % sample, 14 CFR 241 §19-8). BLS draws its route sample from that, then prices monthly through a GDS/online fare database at fixed advance-purchase and day-of-week specs. **UK/Australia/Netherlands:** the statistical office runs its own web-scraping operation against airline and OTA sites, on a fixed route panel, pricing flights a fixed number of days/months ahead and booking the price to the *month of travel*. |
| **Why not in India until now?** | Six reasons, compounding: (1) the current CPI (2012 base) contains **only international airfare** — one priced item; domestic airfare is entering the index only with the **CPI 2024** series. (2) No TravelSky: Indian carriers run on private passenger-service systems (Navitaire/Accelya, Amadeus) and OTAs; the state has no native fare tap. (3) No US-style mandatory ticket-transaction filing. (4) Airlines treat fare + booking-date data as commercially sensitive and **formally refused** to give it to DGCA in March 2026. (5) The work is split between DGCA (consumer-protection tariff monitoring) and MoSPI (the CPI) with no shared pipeline. (6) MoSPI has historically collected prices by hand through field offices and is only now procuring web-scraping / scanner-data capability. |
| **What should India do?** | Sequence it: **(A)** ship the web-scraped experimental index now, built to NSO methodology (route panel, booking-horizon strata, Jevons → Lowe with DGCA weights, published coverage and imputation, reproducible) and label it experimental; **(B)** in parallel, validate it against a purchased GDS/aggregator feed; **(C)** legislate a transaction-level origin-destination fare-reporting obligation on airlines *and* their reservation-system operators (amend Aircraft Rules r. 135 or use the Collection of Statistics Act 2008), with statutory confidentiality; **(D)** put MoSPI, DGCA and RBI on one pipeline under an MoU; **(E)** give the NSO a web-scraping code of practice and a data-access right that overrides site terms; **(F)** stand up a small real-time-prices unit rather than asking 150 field officers to do it. |

---

## 1. The problem, precisely stated

A consumer price index needs the price of a **constant item** measured at a
**constant cadence**. Airfares break both assumptions harder than almost any
other item in the basket:

| Property | Consequence for measurement |
|---|---|
| **Dynamic pricing** — the fare for one seat changes many times a day as inventory sells | A price is only meaningful if you fix *when before departure* it was observed. "The DEL–BOM fare" is not a number; "the DEL–BOM fare, one-way, cheapest economy, observed 21 days before a mid-week departure" is. |
| **Booking-horizon structure** — 60-day fares and 1-day fares are different products | The index must hold the horizon constant, or price movement is confounded with how far ahead the sample happened to look. The IMF/ILO CPI Manual is explicit: *"air fares may be priced 6, 3, 2 and 1 month in advance and include last-minute booking options too"* and price collection *"should be made consistently over time and in a way that represents consumer purchasing patterns"* (ILO CPI Manual, §6.21). |
| **Strong seasonality** — festivals, school holidays, weddings | The manual lists *"air travel and tourism expenditures"* among strongly seasonal commodities (§22.3). A fixed set of representative routes/dates has to span the seasonal pattern, not sample one week of it. |
| **No free feed** — Amadeus retired its free self-service tier (July 2026); OTA terms forbid scraping; airlines do not publish machine-readable fares | The source problem is the *whole* problem. This is why PS SIH26056 is framed around "automated web scraping": it is the only open path left once you rule out paying. |
| **Geography-dependent quotes** — currency, availability and price ladders differ by the shopper's country/IP | Indian domestic fares must be collected from an Indian vantage point, or the measurement is biased. |

The frontier statistical offices have converged on the same answer to the
*method* question — fixed panel, fixed advance-purchase windows, price booked to
the travel month, geometric-mean (Jevons) elementary aggregation — and differ
mainly on the *source* question, which is where national structure dominates.

---

## 2. The international standard (what "good" looks like)

From the **IMF/ILO Consumer Price Index Manual** (2004 *Theory and Practice*;
2020 *Concepts and Methods*) and **Eurostat's HICP guidance**:

1. **Treat airfares as a "difficult" / limited-availability item** alongside rail
   and taxi fares — collect *centrally*, on a spreadsheet or dedicated module,
   not through the general field collection (ILO Manual §6.21, §12.61).
2. **Sample can come from a secondary source.** The manual holds up the US
   approach as the model: *"A sample of scheduled airline flights is selected
   using detailed ticket data from the United States Department of Transportation.
   Monthly pricing is then carried out by online reference to a private-sector
   computerized fare database widely used by travel agents"* (§6.43).
3. **Fix the advance-purchase windows** and keep them constant month to month
   (e.g. 6/3/2/1 months for long-haul; shorter for domestic).
4. **Record price change in the month the flight departs**, not the month the
   ticket was bought (UK ONS practice; ABS practice).
5. **Eurostat's *Practical guidelines on web scraping for the HICP*** (Nov 2020):
   scrape transport fares *"at different anticipation dates so that they are most
   representative for consumer behaviour"*; check whether the online price is an
   actual transaction price; beware that more scraped data can add volatility, not
   accuracy.
6. **Elementary aggregation:** geometric mean of price relatives (Jevons) — the
   modern default, and what India's CPI 2024 series itself adopts for elementary
   indices.

AeroDex's `config/methodology.yaml` already encodes all six: 60-route panel,
seven horizons (1/3/7/14/21/30/60 days), three fixed IST slots, Jevons elementary
under a Lowe aggregate with DGCA traffic weights, and a published coverage /
imputation ratio.

---

## 3. Country case studies

### 3.1 China — solve it by owning the rails

China is the most instructive case for India because the two markets are
comparable in scale and both deregulated fares gradually rather than in one step
— yet China has had a published air-ticket price index for two decades and India
has not. The difference is entirely structural.

**(a) A regulated-fare heritage that built the measurement in.**
The 2004 *Civil Aviation Domestic Air Transport Price Reform Plan* set domestic
fares off a benchmark of **0.75 yuan per passenger-kilometre**, with airlines
free to move within a band (initially +25 % / −40 %). Because the National
Development and Reform Commission (NDRC) and CAAC *administered* that band, they
had to collect and monitor fares route by route as a matter of course. The band
was progressively relaxed — 2013: no floor on government-guided routes; January
2018: full pricing freedom extended to ~300+ routes where five or more carriers
compete, with 10 %-per-season cap increases on the rest — but the monitoring
apparatus predates and survived the liberalisation.

**(b) TravelSky — the state sees every domestic fare by construction.**
[TravelSky](https://en.wikipedia.org/wiki/TravelSky) is a central state-owned
enterprise under SASAC and the **monopoly** Global/Computer Reservation System
for essentially all Chinese airlines' domestic operations. Airlines load
inventory and pricing into it; it clears the transactions. Foreign carriers were
allowed to use foreign GDSs from 2012, but **Chinese carriers remain restricted
to TravelSky for domestic flights**. One state-controlled system therefore holds
a near-complete record of domestic fares and bookings. There is no "airlines
refuse to share" problem because there is nothing to refuse — the data is already
inside a government-controlled entity.

**(c) Umetrip — the public-facing data layer.**
[Umetrip](https://www.chinatravelnews.com/article/187721/) (operated by a
TravelSky subsidiary, promoted by CAAC) is China's dominant air-travel
information app — 100 M+ users, monitoring 12,000+ domestic flights daily — and
since 2024 a direct-sales channel for 37 airlines. It gives CAAC a second,
consumer-side view of offered fares.

**(d) A published civil-aviation ticket-price index.**
CAAC compiles a monthly **"Air Transport Index: Ticket Price"** family — domestic
line, plus international sub-indices (Asia/HK-Macau-Taiwan, rest of world) — on a
**January 2004 = 100** base (series visible via CEIC; the compilation
methodology is not published in English). This is a civil-aviation-sector price
index rather than a CPI component, but it is the analytical series India's DGCA
does not produce.

**(e) The CPI itself.**
NBS runs the CPI over eight divisions and 262 basic item groups (2–25 varieties
each), COICOP-aligned since the 2016 rebasing. "Transport & communication"
carries a **14.3 % weight** in the 2025 base year. Air passenger transport sits
inside it; NBS has not published the sub-weight or the air-ticket collection
method in English, but the sourcing problem is trivial given (b)–(d). NBS has
also moved aggressively into **scanner and web "big data"** for the CPI more
broadly.

> **Lesson for India.** China did not out-engineer the scraping problem; it never
> had the problem, because fare data lives in state-controlled infrastructure and
> the regulator was already in the fare-monitoring business. India cannot
> retrofit a TravelSky, but it *can* legislate the equivalent visibility — a
> mandatory transaction feed (see §5C).

### 3.2 United States — solve it by mandating the filing

- **The data tap is a law.** Under 14 CFR Part 241, every large certificated
  passenger carrier must file the **Origin-and-Destination Survey** (Databank
  1B): a random sample of actual lifted tickets — origin, each carrier and
  fare-basis code, connections, destination, passenger count, and **total dollar
  value of ticket (fare + tax)**. The sample was historically 10 %; it is now
  **40 %** (the "OD40" update, effective for travel from 1 July 2025). It is
  collected by the Bureau of Transportation Statistics, not bought.
- **BLS then builds the CPI on top.** The airline-fares index draws its sample of
  city-pair trips from the DOT data *with probability proportional to passenger
  volume* (using the Oct–Dec quarter of the latest year). Monthly prices are then
  collected online / through a GDS fare database, with **each quote pinned to
  fixed specifications for advance reservation and day of week** (e.g. a "seven
  week" advance fare), re-priced on the same spec every month. Fares include all
  taxes plus fuel, airport, security and first-checked-bag fees. Published
  monthly, seasonally adjusted.
- **Takeaway:** the sample frame is a by-product of a reporting mandate; the
  statistical office spends its effort on *pricing a constant trip*, not on
  acquisition.

### 3.3 United Kingdom — solve it inside the statistical office

- **ONS prices a fixed set of routes at fixed lead times.** Long-haul: 6, 3 and 1
  months ahead; short-haul: 3 and 1 months; domestic: 1 month ahead. A return leg
  is included (3 weeks later long-haul, 2 weeks short-haul, 1 week domestic).
- **Booked to the travel month.** *"Changes in the price of air fares are recorded
  in the CPI in the month in which the flight departs, not when the ticket is
  bought."*
- **"Index day."** Flights are priced for departure on a specific monthly date
  (usually the 2nd/3rd Tuesday); the exact date is withheld in advance as
  "commercially sensitive" to prevent gaming, then published after the fact.
- **Transformation programme.** ONS is moving high-churn online categories to
  **web-scraped and point-of-sale data** — ~750,000 online prices/week across 30+
  retailers — and has repeatedly flagged that **website terms & conditions are
  the binding constraint** on scraping some sources.

### 3.4 Australia — a scraper in the CPI, and a separate route monitor

- **ABS has web-scraped airfares since 2016.** Domestic and international airfares
  are collected online because that is how consumers buy them. Fares are priced
  **two months before the travel month**, collected monthly, and **allocated to
  the month of travel** (July collection → September index).
- **Separate, older series:** the Bureau of Infrastructure and Transport Research
  Economics (**BITRE**) has monitored domestic discount fares since **October
  1992**, monthly, for the **top ~70 routes**, as a **Fisher Ideal** index with
  base weights fixed at 2004 passenger levels. India's nearest analogue — DGCA's
  Tariff Monitoring Unit — checks declared bands but publishes no index.

### 3.5 Netherlands / EU — the scraping pioneers

- **Statistics Netherlands (CBS)** introduced **web scraping into the HICP in
  2015** (initially footwear, furniture, telecoms) and uses unit-value methods on
  scraped data. Airline tickets are a large, visible mover in Dutch HICP releases.
- **Eurostat** coordinates the approach across the euro area (HICP COICOP 07.3.3,
  "passenger transport by air"): its 2020 *Practical guidelines on web scraping
  for the HICP* set the shared rules — scrape at multiple anticipation dates,
  verify prices are transactable, watch for scraping-induced volatility.
- **Germany (Destatis), Canada (StatCan), Norway (SSB)** all now use a mix of
  web-collected airfares (from carrier and OTA sites, sometimes a large tour
  operator's system) plus manual central collection; none rely on a national
  reservation-system monopoly, so all look structurally like the UK/Australia
  model.

### 3.6 Comparison

| Country | Primary source for the airfare index | Legal basis for access | Booking-horizon control | Published index? |
|---|---|---|---|---|
| **China** | TravelSky (state GDS monopoly) + CAAC band monitoring + Umetrip | State ownership of the reservation system | Regulator-set bands historically; CPI method not public | **Yes** — CAAC monthly ticket-price index (2004 = 100) |
| **USA** | DOT Databank 1B (mandatory ticket sample) → GDS/online pricing by BLS | 14 CFR Part 241 reporting rule | Fixed advance-reservation + day-of-week specs | Yes — BLS CPI "airline fares", monthly, SA |
| **UK** | ONS in-house collection from carrier/OTA sites; web-scraped data expanding | NSO powers + negotiated access; T&Cs a live constraint | 6/3/1-mo (long), 3/1-mo (short), 1-mo (domestic); priced to travel month | Yes — CPI/CPIH air fares |
| **Australia** | ABS web scraping (since 2016); BITRE route monitor (since 1992) | Census and Statistics Act; ABS web-scraping policy | 2 months ahead, allocated to travel month | Yes — CPI air travel; BITRE Fisher index (top 70 routes) |
| **Netherlands / EU** | NSO web scraping (CBS since 2015); Eurostat-coordinated | EU statistical law + Eurostat scraping guidelines | Multiple anticipation dates | Yes — HICP 07.3.3 |
| **India (today)** | Field officers manually reading airline/OTA sites; routes list from DGCA | None specific; Collection of Statistics Act 2008 unused for this | Moving to 21 days (domestic) with CPI 2024 | **Only international** airfare in CPI 2012; domestic sub-index new in CPI 2024 |

---

## 4. Why it has not happened in India until now

### 4.1 Domestic airfare was simply not in the CPI

Under the **CPI 2012** series, *"airfare for the international direct routes"* is
the only air-travel item priced — item code `07.3.3.1.2.01`, **one** of 686
priced items — collected by State/UT capital Regional Offices from DGCA-supplied
information. Domestic airfare has **no** representation in the current headline
CPI. The MoSPI **Expert Group on Comprehensive Updation of CPI** records the
reason offered historically: *"only domestic air fare should be considered [but]
proportion of foreign travel of the total air travel expenditure may be too
small"* — i.e. air travel as a whole was treated as a small, elite category not
worth the collection cost. Domestic airfare enters the index only with the
**CPI 2024** series (base prices collected Jan–Dec 2024; series released 2026).

### 4.2 There is no Indian TravelSky — no native data tap

Indian carriers run on **private** passenger-service systems — IndiGo and others
on Navitaire/Accelya, Air India on Amadeus — and sell heavily through independent
OTAs (MakeMyTrip, Cleartrip, Ixigo, EaseMyTrip, Yatra, Goibibo). There is no
state-owned reservation monopoly through which the government automatically sees
every fare. Fare data is spread across a dozen commercial systems, each with its
own terms.

### 4.3 No mandatory ticket-transaction filing — and airlines have refused to volunteer

India has **no equivalent of US Databank 1B**. Under **Rule 135 of the Aircraft
Rules, 1937**, airlines must *establish* and *publish* "reasonable" tariff bands,
and DGCA's **Tariff Monitoring Unit** (stood up around 2010; a dedicated unit
announced 2015) checks that fares on ~78 routes stay within the declared band —
but the airline only has to file the *band*, not transaction-level fares or
booking dates. When DGCA asked (December 2025) for **two years of passenger-level
data — fare charged, booking date, base fare, passenger count** — Air India,
IndiGo and SpiceJet, through the Federation of Indian Airlines, **declined**
(March 2026), calling it *"commercially sensitive and proprietary"* and offering
only aggregate fare-bucket shares instead. DGCA has since engaged a consulting
firm to study fare trends and floated an AI monitoring tool ("AirPrice
Guardian"); airlines have reportedly agreed to share **aggregated** pricing data.
Aggregates are enough to spot a gouging spike; they are **not** enough to build a
constant-quality price index.

### 4.4 The work is split between two ministries with no shared pipeline

- **DGCA** (Ministry of Civil Aviation) wants fare data for **consumer
  protection** — detecting predatory or "excessive" pricing on specific routes,
  during festivals or emergencies. Its instrument is the tariff band and, if a
  Parliamentary panel's recommendation is taken up, a temporary price-cap power.
- **MoSPI** wants fare data for the **CPI** — a weighted, methodologically strict,
  reproducible index.

These are different products from the same raw data, pursued by different
agencies, with **no common collection pipeline**. DGCA already holds the two
ingredients MoSPI most needs — a route-popularity ranking per airport, and the
airlines' declared min/max tariff filings — but passes MoSPI only a routes list.

### 4.5 MoSPI's collection model is manual, and only now modernising

The Expert Group papers show CPI 2024 airfare collection as: State/UT capital
Regional Offices **manually** look up *"one-way adult cheapest"* fares for the
DGCA-supplied top 3 (now up to 5, for cities > 1 M population) routes per airport,
via an "Airfare module" on the Urban Portal, for travel ~15–21 days out. Known
problems the Group itself lists: too few observations for small airports (Sikkim,
Puducherry have only two routes; Haryana has no airport), high month-to-month
volatility, collection landing only in the first half of the month, and
seasonality not captured. MoSPI notes it is *"engaging companies working in the
area of commercial web scraping"* and has held a scanner-data "conclave" — i.e.
automated collection is a **2024-onwards procurement**, not existing capability.
The external technical review (IMF/World Bank) captured in the report cuts both
ways: it recommends richer specs (include international, **make the airline part
of the specification**, price named carriers rather than the cheapest across
carriers, use **21+ day advance purchase**), but also warns that *"web scraping
can introduce volatility in the CPI [and] more data is not necessarily better
data."*

### 4.6 Legal ambiguity around scraping; unused statutory powers

- **OTA / airline site terms** generally prohibit automated collection, and sites
  deploy anti-bot defences. India has no NSO "web-scraping code of practice" and
  no statutory carve-out that lets official statistics override site terms — the
  kind of framework Eurostat and member states have been building.
- The **Collection of Statistics Act, 2008** *does* let a statistics officer
  compel information from companies, with penalties for refusal — but it has not
  been invoked to require fare data, and the penalty ceiling (₹5,000 for a
  company) is too low to compel a carrier that considers the data strategically
  valuable.

---

## 5. What India should do

A five-part programme, sequenced so that something useful ships in months while
the durable fix is legislated.

### A. Ship the web-scraped experimental index now — to NSO methodology

Exactly the PS SIH26056 deliverable, built the way a statistical office would:

- **Fixed route panel** (≥ 60 directional O–D pairs) weighted by **DGCA traffic**,
  with the panel and weights in hashed config, not code.
- **Booking-horizon strata** — collect each route at 1/3/7/14/21/30/60 days before
  departure so horizon is held constant (the IMF Manual requirement).
- **Fixed daily collection slots** from an **Indian IP**, actual timestamp
  recorded on every quote.
- **Jevons** elementary aggregates → **Lowe** aggregation on DGCA weights; base
  period fixed.
- **Publish the coverage ratio and the imputation share** every release; **refuse
  to publish** a period whose imputed weight breaches a stated ceiling (e.g. 5 %).
- **Full reproducibility** — archive the parsed quote plus a hash of the raw
  response; a third party can recompute any published number.
- **Label it experimental** until it clears a back-test against an independent
  benchmark — do not let it touch headline CPI on day one.

*(AeroDex implements this today against a fixture adapter; the missing piece is a
real, compliant source — see §6.)*

### B. Buy an interim feed and use it to validate the scraper

Licence a **GDS / aggregator fare API** (ATPCO-derived, or a Google-Flights-based
API such as SerpApi/HasData, or Duffel) for a subset of the panel. Two uses:
bootstrap the index while the scraper matures, and **cross-check** scraped fares
against a contracted source to quantify scraping bias and volatility (the risk
the IMF reviewer flagged). Cost is modest — order of $25–100/month for a demo to
full panel.

### C. Legislate the durable data tap — a transaction-level reporting mandate

The only path to China/US-grade coverage. Require **airlines *and* their
passenger-service / reservation-system operators** to file, monthly, a
**transaction-level origin-destination fare dataset** — itinerary, carrier,
fare basis, booking date, travel date, fare, taxes and fees, passenger count —
as a sample (a 10–40 % ticket sample, as the US does) or in full.

- **Instrument:** amend **Aircraft Rules r. 135** to add a reporting sub-rule, or
  issue a direction under the **Collection of Statistics Act, 2008** naming
  airfare transactions as a scheduled subject — and **raise the penalty** to a
  level a carrier cannot treat as a cost of non-compliance.
- **Confidentiality:** the feed goes to MoSPI/DGCA only, is published solely as
  aggregates/indices, and carrier-identifiable microdata is protected by statute
  — this is what makes "commercially sensitive" a non-objection (it is how US
  DB1B, which every US carrier files, has worked for decades).
- **Bring the PSS/GDS operators in scope** so the obligation does not depend on
  each airline building an export.

### D. One pipeline, one MoU — MoSPI + DGCA + RBI

- **DGCA** contributes the route-popularity ranking *and* the airlines' declared
  min/max tariff filings (it already holds both) and, once C lands, receives the
  transaction feed.
- **MoSPI** compiles the index to CPI methodology.
- **RBI** is the anchor consumer (transport CPI, inflation nowcasting) and should
  co-fund.
- A **standing technical committee** owns the methodology document, the route
  panel vintage, and the revisions policy.

### E. Give the NSO a scraping mandate and a code of practice

- A published **web-scraping code of practice**: respect `robots.txt`,
  conservative rate limits, no CAPTCHA-solving, no proxy/identity evasion, no
  collection of personal data, transparent User-Agent — the defensible posture,
  and the one that lets the method survive audit.
- A **statutory data-access provision** so that collection for official
  statistics is not defeated by a site's terms of service — mirroring the
  direction of EU "trusted smart statistics".

### F. Build a real-time-prices unit

Frontier offices (ONS's transformation programme, ABS's web-scraping team, CBS)
run airfares, hotels and other online-first items through a **small dedicated
team with an engineering pipeline**, not through hundreds of field officers doing
lookups by hand. India needs the equivalent cell inside NSO — 4–6 people,
owning the scraper, the API contracts, the validation and the publication.

### G. Governance: publish it as experimental first

Release the airfare index as a **clearly labelled experimental sub-index** with
quality gates (coverage, imputation, back-test correlation vs CPI-Transport and
DGCA references) reported every month, for at least a year, **before** it is
allowed to feed the headline CPI weight. A wrong number that moves headline
inflation is far more costly than a delayed one.

---

## 6. How AeroDex maps onto this

AeroDex **is** recommendation §5A, already built:

| §5A requirement | AeroDex status |
|---|---|
| Fixed DGCA-weighted route panel in hashed config | ✅ `config/panel.yaml`, `config/methodology.yaml`, 60 routes, weight vintage `dgca-2025-city-pairs-r2` |
| Booking-horizon strata | ✅ 1/3/7/14/21/30/60 days → 420 strata |
| Fixed slots, Indian IP, timestamped quotes | ✅ design; Oracle Mumbai region in the plan |
| Jevons → Lowe on DGCA weights | ✅ `aerodex/index/` |
| Publish coverage + imputation; refuse on breach | ✅ publisher refuses `>5 %` imputed weight (M5) and refuses fixture-only panels |
| Reproducible from archived inputs | ✅ M6 golden tests, `aerodex verify` |
| Labelled experimental / synthetic until validated | ✅ enforced in `compliance.py` and the UI `data_source` contract |

The gap is the one this note's §5B/§5C address: AeroDex still needs a **real,
compliant fare source** (spike S3) — either a purchased feed or a legislated
transaction mandate. Everything downstream of acquisition is done.

---

## Known limitations of this research

- **China's CPI air-ticket method is not public in English.** The 14.3 %
  transport-&-communication weight and the existence of the CAAC monthly
  ticket-price index (2004 = 100) are well attested via NBS releases and CEIC;
  the sub-weight for air passenger transport and the exact collection method are
  inferred from China's structure (TravelSky, CAAC band monitoring), not read
  from an NBS methodological manual.
- **The CAAC ticket-price index** was confirmed through a data aggregator (CEIC),
  not a CAAC primary source; base period and monthly frequency are stated there.
- **IMF CPI Manual 2020, Chapter 11** could not be retrieved directly; the
  international-standard points here are taken from the 2004 ILO CPI Manual (still
  the standard method reference), Eurostat's 2020 web-scraping guidelines, and
  the IMF/World Bank technical recommendations reproduced in MoSPI's own Expert
  Group report.
- **India CPI 2024 specifics** are from the MoSPI *Expert Group Report on
  Comprehensive Updation of CPI* and the *FAQs on CPI 2024*; the series was
  released in 2026 and some collection details may have changed at
  implementation.
- **The DGCA–airlines data dispute** is reported via trade and business press
  (dates: DGCA request December 2025; FIA refusal 11 March 2026; later partial
  agreement on aggregated data). No official DGCA order was consulted.
- **BLS "OD40"**: the move from a 10 % to a 40 % O&D sample is stated in the
  Federal Register / BTS; the precise interaction with the current BLS CPI sample
  refresh was not verified line by line.
- Country coverage is deliberately weighted to China + the Anglosphere + EU;
  Japan, Korea, Brazil, Indonesia were not examined.

---

## Sources

*All URLs read 10 September 2026.*

**Problem statement**
- Smart India Hackathon 2026, PS SIH26056 (MoSPI): "Development of a Real-time
  Airfare Price Index for India through Automated Web Scraping of Airline and
  Online Travel Aggregator Portals for Augmentation of the Consumer Price Index
  (CPI)." — [SIH 2026 PS catalogue](https://github.com/NoBugNinja/Smart-India-Hackathon-SIH-2026-Problem-Statements),
  [SIH portal](https://sih.gov.in/)

**International method standard**
- ILO / IWGPS, *Consumer Price Index Manual: Theory and Practice* (2004),
  §§6.21, 6.43, 12.61, 22.3 — [ilo.org PDF](https://webapps.ilo.org/CPI/doc/cpi_manual_en.pdf)
- IMF / IWGPS, *Consumer Price Index Manual: Concepts and Methods* (2020) —
  [imf.org](https://www.imf.org/en/data/statistics/cpi-manual),
  Ch. 11 "Some special cases" (not retrieved)
- Eurostat, *Practical guidelines on web scraping for the HICP* (Nov 2020) —
  [ec.europa.eu PDF](https://ec.europa.eu/eurostat/documents/272892/12032198/Guidelines-web-scraping-HICP-11-2020.pdf)
- Eurostat, HICP COICOP glossary (07.3.3 passenger transport by air) —
  [ec.europa.eu](https://ec.europa.eu/eurostat/statistics-explained/index.php/Glossary:COICOP_HICP)

**China**
- TravelSky — [Wikipedia](https://en.wikipedia.org/wiki/TravelSky);
  [AsianCentury note](https://www.asiancenturystocks.com/update-travelsky-696-hk/);
  [ChinaDaily 2012, foreign-GDS rule change](http://www.chinadaily.com.cn/business/2012-09/29/content_15792269.htm)
- Umetrip / direct sales for 37 airlines —
  [ChinaTravelNews](https://www.chinatravelnews.com/article/187721/);
  [YicaiGlobal](https://www.yicaiglobal.com/news/37-chinese-airlines-begin-direct-ticket-sales-on-civil-aviation-info-app-umetrip)
- Domestic fare pricing reform (0.75 yuan/pax-km benchmark; 2013 / Jan 2018
  liberalisation; 5-carrier rule) —
  [Aviation Week](https://aviationweek.com/air-transport/airports-networks/price-deregulation-make-chinese-carriers-stronger);
  [Simple Flying](https://simpleflying.com/china-say-it-is-not-restricting-airlines-from-selling-low-fares/)
- CAAC "Air Transport Index: Ticket Price: Domestic Line" (Jan 2004 = 100,
  monthly) — [CEIC](https://www.ceicdata.com/en/china/air-transport-index/air-transport-index-ticket-price-domestic-line)
  (international sub-indices: [Asia/HK-Macau-Taiwan](https://www.ceicdata.com/en/china/air-transport-index/air-transport-index-ticket-price-asia--hk-macau-taiwan-line),
  [excl. Asia](https://www.ceicdata.com/en/china/air-transport-index/air-transport-index-ticket-price-international-excl-asia-line))
- NBS CPI structure, 2016 COICOP rebasing, 2025 base weights (transport &
  communication 14.3 %) —
  [SCIO](http://english.scio.gov.cn/pressroom/2026-02/12/content_118330144.html);
  [NBS CPI release](https://www.stats.gov.cn/english/PressRelease/202604/t20260413_1963288.html);
  [NBS of China (Wikipedia)](https://en.wikipedia.org/wiki/National_Bureau_of_Statistics_of_China)
- CAAC — [official site](http://www.caac.gov.cn/English/),
  [2023 Statistical Bulletin](https://www.caac.gov.cn/English/News/202406/t20240627_224599.html)

**United States**
- BLS, *Measuring Price Change in the CPI: Airline fares* —
  [bls.gov](https://www.bls.gov/cpi/factsheets/airline-fares.htm)
- BLS *Handbook of Methods*, CPI data sources —
  [bls.gov](https://www.bls.gov/opub/hom/cpi/data.htm)
- DOT Origin-&-Destination Survey / Databank 1B; 14 CFR Part 241 §19-8; move to a
  40 % sample —
  [eCFR Part 241](https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-241/subject-group-ECFRb6240d0cae7da08);
  [LII 14 CFR 241.19-8.4](https://www.law.cornell.edu/cfr/text/14/19-8.4);
  [Federal Register, O&D survey update (2023)](https://www.federalregister.gov/documents/2023/01/31/2022-28535/updates-to-the-origin-destination-survey-of-airline-passengers);
  [BTS "OD-40"](https://www.bts.gov/OD-40)

**United Kingdom**
- ONS, aggregate index of air fares methodology (FOI response; advance-purchase
  windows, index day, month-of-travel accrual) —
  [ons.gov.uk FOI](https://cy.ons.gov.uk/aboutus/transparencyandgovernance/freedomofinformationfoi/aggregateindexofairfaresmethodology)
- ONS, *Transformation of consumer price statistics* (web-scraped & alternative
  data) —
  [ons.gov.uk (Apr 2022)](https://www.ons.gov.uk/economy/inflationandpriceindices/articles/introducingalternativedatasourcesintoconsumerpricestatistics/april2022);
  [ONS digital blog on web scraping](https://digitalblog.ons.gov.uk/2016/06/27/what-we-can-do-with-prices-data-scraped-from-the-web/)

**Australia**
- ABS, web scraping in the CPI; airfares priced two months ahead, allocated to
  travel month —
  [ABS web scraping in the CPI](https://www.abs.gov.au/websitedbs/d3310114.nsf/home/web+scraping+in+the+CPI);
  [ABS price collection methodology](https://www.abs.gov.au/statistics/detailed-methodology-information/concepts-sources-methods/consumer-price-index-concepts-sources-and-methods/2025/price-collection);
  [ABS use of web scraping](https://www.abs.gov.au/participate-survey/surveys-businesses-and-organisations/abs-use-web-scraping)
- BITRE, air fares collection methodology (since Oct 1992; top ~70 routes; Fisher
  index) —
  [bitre.gov.au method](https://www.bitre.gov.au/statistics/aviation/air_fares_method);
  [bitre.gov.au air fares](https://www.bitre.gov.au/statistics/aviation/air_fares)

**Netherlands / EU**
- CBS, web scraping in the HICP since 2015 —
  [Eurostat HICP metadata (NL)](https://ec.europa.eu/eurostat/cache/metadata/EN/prc_hicp_esmshi4_nl.htm);
  [CBS inflation 2025 (airfare effect)](https://www.cbs.nl/en-gb/news/2026/03/inflation-rate-3-3-percent-in-2025)
- Eurostat news, EU transport-services consumer prices —
  [ec.europa.eu](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250703-3)
- Destatis, CPI method overview —
  [destatis.de](https://www.destatis.de/EN/Themes/Economy/Prices/Consumer-Price-Index/Methods/VPI_e.html)

**India**
- MoSPI, *Expert Group Report on Comprehensive Updation of CPI* (airfare
  sections: §3.9, §4.4, §4.5.4, Recommendations 11 & 20) —
  [mospi.gov.in PDF](https://www.mospi.gov.in/uploads/Marquee/doc-0aee0026-bf32-4213-ae4f-c5308088444e.pdf)
- MoSPI, *FAQs on CPI 2024 Series* —
  [mospi.gov.in PDF](https://www.mospi.gov.in/uploads/documents/documents/1770891066052-Annexure_V.pdf)
- MoSPI, *CPI — Changes in the Revised Series (Base 2012 = 100)* —
  [cpi.mospi.gov.in PDF](https://www.cpi.mospi.gov.in/PDFile/CPI-Changes_in_the_Revised_Series.pdf)
- "Consumer Price Index gets up to date … airfare, OTT, e-commerce in new
  basket" — [ThePrint](https://theprint.in/economy/consumer-price-index-gets-up-to-date-airfare-ott-plans-e-commerce-prices-in-new-basket-mospi-secy/2773498/)
- DGCA Tariff Monitoring Unit; Rule 135, Aircraft Rules 1937 —
  [PIB (DGCA monitors 78 routes)](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1810467&reg=48&lang=2);
  [PIB (airfare is market-driven)](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1843408);
  [Business Standard (TMU set up, 2015)](https://www.business-standard.com/article/government-press-release/dgca-sets-up-unit-to-monitor-airfare-115030300946_1.html);
  [PRS, "Issue of Fixing of Airfares"](https://prsindia.org/policy/report-summaries/issue-of-fixing-of-airfares)
- Airlines refuse to share passenger-level fare data with DGCA (Dec 2025 request;
  Mar 2026 refusal) —
  [Outlook Business](https://www.outlookbusiness.com/corporate/indian-airlines-vs-dgca-air-india-indigo-others-refuse-to-share-airfare-data-heres-why)
- DGCA AI monitoring / "AirPrice Guardian"; airlines agree to aggregated data —
  [Aviation Today](https://aviationtoday.in/civilaviation/airlines/dgca-to-use-ai-for-airfare-monitoring-airlines-agree-to-share-pricing-data/);
  [Deccan Herald (Parliamentary panel: temporary price-cap power)](https://www.deccanherald.com/amp/story/india%2Frise-in-airfares-parliamentary-panel-recommends-empowering-dgca-to-impose-temporary-price-cap-3462313)
- Collection of Statistics Act, 2008 (powers to compel; penalties) —
  [MoSPI Act PDF](https://mospi.gov.in/sites/default/files/CoSAct2008.pdf);
  [Down To Earth, "Reveal or go to jail"](https://www.downtoearth.org.in/environment/reveal-or-go-to-jail-33654)

**Market structure (India PSS/GDS)**
- Fare APIs no longer free (Amadeus self-service retired 17 Jul 2026) — AeroDex
  [plan.md §1.1](../../plan.md); provider detail in
  [docs/research/S3_PROVIDER_MATRIX.md](S3_PROVIDER_MATRIX.md)
