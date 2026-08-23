# Evidence — Government methodology (MoSPI and DGCA)

Primary-source extracts. All from PDFs parsed directly on 23 August 2026.

---

## MoSPI CPI 2024 series — how airfare is collected

**CPI 2024 FAQ, Q27** *(primary — CLM-04)*

> "How the prices for airfares are collected in the CPI 2024 series?
> Ans: **Airfares are collected through well-known online platforms.**"

**CPI 2024 FAQ, Q20 / Q21** *(primary — CLM-34)* — the **Jevons** index is used for
elementary indices; the **Young / modified Laspeyres** index for higher-level aggregation.
Both match AeroDex's existing choices.

**CPI 2024 FAQ, Q14 / Q26** — twelve online markets added across towns above 2.5 million
population; alternative data sources are "administrative data and e-commerce/online price
data".

## Expert Group Report — booking horizon, and why the single-horizon claim was wrong

The record is a sequence, not a settled value *(primary — CLM-06)*:

| Stage | Position |
|---|---|
| 3rd/4th meeting (p.164) | "These airfares would be fares prevailing **15 days prior** to the date of journey." |
| 5th meeting (p.179) | "EG suggested to update the data collection methodology with **7-day advance booking**, and all the routes may be allocated equally among the first three weeks of a month so that the date of airfare collection and date of travel fall in the same month." |
| IMF TA, Recommendation 11 (p.225) | "The specification should also include a greater variety in terms of timing (**14 days advance purchase, 21 days advance purchase**) and not restricted to 7 days advance purchase." |
| §3.9 summary (p.20) | "advance ticket purchase as **21 days** and 60 days for domestic and international travel respectively" |

**Adjudication.** `s3-redo.md` cited only §3.9 and concluded the national methodology uses
a single T-21 horizon, then recommended collapsing AeroDex's ladder to match. That reading
is wrong. The IMF advisor to MoSPI explicitly recommended **multiple** advance-purchase
horizons. AeroDex's 7-horizon ladder is aligned with expert advice to the sponsor, not
excessive relative to it.

**Also from Recommendation 11** *(CLM-07)*:

> "**The airline is a price determining characteristic and should be part of the
> specification.**"

AeroDex's hedonic spec already carries `carrier_type`. This supports it.

## Expert Group Report — route selection

**§4.5.3.1 (p.53)** *(primary — CLM-35)*

> "Air fare charges: The Directorate General of Civil Aviation (DGCA) provided a list of the
> most popular air routes, which was subsequently verified by the Field Operations Division
> (FOD). Base prices for these identified routes were collected at State/UT level … Since
> airfares vary by booking platform and time slot, **prices were compiled from well-known
> websites across different time windows to ensure representativeness.**"

Top three routes per airport (p.175), extended to **top five** for cities above one million
population (p.179); DGCA supplied the additional routes for 11 such cities (p.183).

Note the phrase *"across different time windows"* — MoSPI's own design uses intra-day
variation, which is what AeroDex's three IST slots capture.

## Expert Group Report — the DGCA data precedent

**Recommendation 11(a), p.187** *(primary — CLM-22 — the strongest lead in S3)*

> "Airfare prices for newly added routes in 11 cities for previous months (January to July)
> may be obtained from DGCA, as they **maintain data on the minimum and maximum tariffs for
> all routes across all airlines to monitor airfares.**"

Two facts follow. DGCA holds a route × airline tariff dataset. And **MoSPI has already
obtained airfare data from DGCA on request** — a documented transaction between two
government bodies, minuted in a published report.

**Caveat that must travel with it.** What DGCA is described as holding is *minimum and
maximum tariffs* — which is precisely the band structure that
`tariff-comparability-results.md` shows is not a price. Establish the actual field list
before assuming an agreement solves the data problem. This is OQ-2.

## Legal basis — why MoSPI may and AeroDex may not

**Collection of Statistics Act 2008** *(CLM-03)* — s.4 empowers the appropriate Government
to specify the form and particulars of statistical information; s.5 empowers a statistics
officer to require it; s.6 obliges informants to furnish it.

The difference between MoSPI's lawful collection from "well-known online platforms" and
AeroDex's unlawful collection from the same platforms is **statutory authority**, not
technique, politeness or rate limiting. No amount of engineering closes that gap.

## DGCA — monitoring and proposed systems

- **Tariff Monitoring Unit** *(CLM-21, secondary)* — monitors fares on 78 domestic routes
  monthly by reading airline websites, checking carriers charge within declared bands.
  Output is not published as microdata.
- **"AirPrice Guardian" / Pricing Transparency Index** *(CLM-23, secondary — CORRECTED)* —
  a **Parliamentary Standing Committee recommendation of March 2025** with an 18–24 month
  proposed timeline. **Not a built system and not an airline commitment.** `s3-redo.md`
  described it as "airlines have agreed to share aggregated pricing data with DGCA"; that
  overstates the evidence and must not be repeated.
