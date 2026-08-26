# Evidence — contracts and terms

**Read 25 August 2026.** Clause numbers as published on that date.

| Provider | Document | URL |
|---|---|---|
| Duffel | Services Agreement | https://duffel.com/services-agreement |
| Duffel | Terms | https://duffel.com/terms |
| SerpApi | Pricing page (Legal Shield terms) | https://serpapi.com/pricing |
| HasData | Google Flights API page (compliance statement) | https://hasdata.com/apis/google-flights-api |

## Duffel — clauses relevant to AeroDex

| Clause | Effect | Applies to AeroDex? |
|---|---|---|
| **2.3** | Search-to-Order Ratio = calls to Offer Request endpoints ÷ Orders created. Duffel "reserves the right to monitor and apply a cap on your usage" | ⚠️ **Yes** — zero orders puts zero in the denominator |
| **2.5(c)** | No building a product that competes with the Services | ✅ No — an index does not compete with a booking API |
| **2.5(d)** | No use "for metasearch purposes (including to build a metasearch on top of the Duffel Platform and/or to redistribute to a metasearch platform)" | ⚠️ **The blocking question.** Needs written clarification |
| **2.5(j)** | No "speculative or sham Orders, reserve Travel Services in anticipation of demand … including repeat hold orders without subsequent booking" | ✅ No — governs *orders and holds*; AeroDex creates neither |
| **3.2** | Refresh displayed content at least weekly; no hosting images from image-link URLs | ✅ No — AeroDex displays no live content, stores no images |
| Accreditation | Sellers need **not** be ARC/IATA accredited when using Managed Content | ✅ Favourable — removes the gate that killed NDC/GDS routes |

## SerpApi

> "U.S. Legal Shield … up to $2 million in coverage for the scraping and parsing of search
> engine data, as long as your use of the data or service is not illegal."

No published restriction found on storage, commercial use, research use, or publication of
derived statistics.

## HasData

> "HasData accesses publicly available data only. Google Flights' terms may restrict
> automated access; you are responsible for compliance."

**No indemnity.** The compliance position transfers explicitly to the customer. This is the
material contractual difference from SerpApi and the reason SerpApi is recommended at demo
scale despite being more expensive there.

## Indian OTAs — external, unchanged, carried forward from previous S3

| Provider | Clause effect | Verdict |
|---|---|---|
| MakeMyTrip / goibibo | Bars transmitting content "for any business, commercial or public purpose" | **F** |
| Cleartrip | Bars "robot/spider/scraper" without express written permission; commercial-use bar | **F** |
| ixigo, Yatra, EaseMyTrip | Equivalent per previous S3 | **F** |

**Not to be built.** The owner's decision removed AeroDex's *internal* rules; it explicitly
did not authorise breaching provider contracts, and the paid API path removes any reason to.
