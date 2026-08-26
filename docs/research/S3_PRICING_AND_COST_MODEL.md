# S3 → S4 PRICING AND COST MODEL

**Research date: 25 August 2026.** Every price below was read from the provider's own
pricing page on that date. Sources in `S3_EVIDENCE/pricing_sources.md`.
Nothing here is estimated; unverifiable figures are marked **UNKNOWN**.

---

## 1. What counts as a "search"

One search = one `(route, horizon, slot)` query on one collection day.
The departure date is derived, not chosen independently:

```
departure_date = collection_date + horizon_days
```

This is why the booking horizon is controlled *by construction* — AeroDex picks
`outbound_date`, and the horizon falls out of the arithmetic. No provider co-operation is
required for horizon control, which is the single most important property in this model.

---

## 2. Collection volumes

| Design | Routes | Horizons | Slots | Searches/day | Searches/month (30 d) | Observations/month* |
|---|---|---|---|---|---|---|
| **DEMO** | 10 | 3 | 1 | **30** | **900** | ~5,400 |
| **SMALL** | 20 | 7 | 3 | **420** | **12,600** | ~75,600 |
| **FULL** | 60 | 7 | 3 | **1,260** | **37,800** | ~226,800 |
| FULL, overlap-suppressed | 60 | 7 | 3 | ~1,155 | ~34,650 | ~207,900 |

\* at ~6 itineraries returned per search (`plan.md` §3). Overlap suppression is
`panel.yaml: collection.overlap_suppression` — skip a stratum collected < 4 h ago.

---

## 3. Provider price lists (verified 25 Aug 2026)

### SerpApi — [serpapi.com/pricing](https://serpapi.com/pricing)

| Plan | Price/mo | Searches/mo | $/1k | Hourly cap |
|---|---|---|---|---|
| Free | $0 | 250 | — | 50/hr |
| Starter | $25 | 1,000 | $25.00 | 200/hr |
| Developer | $75 | 5,000 | $15.00 | 1,000/hr |
| Production | $150 | 15,000 | $10.00 | 3,000/hr |
| Big Data | $275 | 30,000 | $9.17 | 6,000/hr |
| Searcher | $725 | 100,000 | $7.25 | 20,000/hr |

Subscription only — no pay-as-you-go. Throughput is capped at 20% of monthly volume per
hour. Includes a **U.S. Legal Shield** of up to $2 million covering scraping and parsing of
search-engine data, conditional on the use not being illegal.

### HasData — [hasdata.com/apis/google-flights-api](https://hasdata.com/apis/google-flights-api)

| Plan | Price/mo | $/1k searches | Implied capacity |
|---|---|---|---|
| Free trial | $0 | — | **66 flight searches, one-time** |
| Startup | $49 | $3.68 | ~13,315 |
| Business | $99 | $1.48 | ~66,891 |
| Growth | $249 | $1.25 | ~199,200 |
| Enterprise | custom | — | 100M+ credits/mo |

HasData states: *"HasData accesses publicly available data only. Google Flights' terms may
restrict automated access; you are responsible for compliance."* — i.e. **no indemnity**;
the compliance position transfers to AeroDex. This is the material difference from SerpApi.

### SearchApi.io — [searchapi.io/pricing](https://www.searchapi.io/pricing)

| Plan | Price/mo | Credits/mo | $/1k |
|---|---|---|---|
| Free | $0 | 100 (one-time) | — |
| Developer | $40 | 10,000 | $4.00 |
| Production | $100 | 35,000 | $3.00 |
| BigData | $250 | 100,000 | $2.50 |
| Scale | $500 | 250,000 | $2.00 |

20% of plan credits per hour. Credits consumed per Google Flights search: **UNKNOWN**.

### Duffel — [duffel.com/pricing](https://duffel.com/pricing)

| Item | Price |
|---|---|
| Confirmed order | $3.00 |
| Managed Content | 1% of order value |
| Paid ancillary | $2.00 |
| **Excess search** | **$0.005** |
| Minimum commitment | **None** |
| Monthly platform fee | **None** |

Free search allowance = `orders × 1,500`. Duffel's own worked example: *"If you make 10
orders in a month, then you'll be allowed 10 × 1500 = 15000 searches free of charge. If you
made 25,000 searches, then you'd pay (25000 − 15000) × $0.005 = $50."*

**With zero orders the free allowance is zero, so every search is billed at $0.005.**
This is arithmetically favourable but see clause 2.3 in `S3_LEGAL_AND_CONTRACTUAL_MATRIX.md`.

---

## 4. Monthly cost by design

| Provider | DEMO (900) | SMALL (12,600) | FULL (37,800) |
|---|---|---|---|
| **SerpApi** | **$25** (Starter, 1,000) | **$150** (Production, 15,000) | **$725** (Searcher, 100,000)¹ |
| **HasData** | **$49** (Startup) | **$49** (Startup, 13,315) | **$99** (Business, 66,891) |
| **SearchApi.io** | $40 (Developer) | $100 (Production) | $250 (BigData)² |
| **Duffel** | **$4.50** | **$63.00** | **$189.00** |
| Apify | UNKNOWN | UNKNOWN | UNKNOWN |
| Bright Data / Oxylabs / Zyte | UNKNOWN | UNKNOWN | UNKNOWN |
| Enterprise vendors (OAG, ATPCO, Cirium, IATA, Amadeus AQC, Sabre, Travelport) | UNKNOWN — quote only | UNKNOWN | UNKNOWN |

¹ Big Data (30,000 @ $275) is short of 37,800. Even overlap-suppressed (34,650) it does not
fit, so the next tier applies. **SerpApi is the wrong provider for the full panel.**

² Overlap-suppressed FULL is 34,650, which *does* fit SearchApi Production (35,000) at
**$100/mo** — with only 1% headroom. Not a margin to plan against.

### Cost per observation

| Provider | DEMO | SMALL | FULL |
|---|---|---|---|
| SerpApi | $0.0046 | $0.0020 | $0.0032 |
| HasData | $0.0091 | $0.00065 | **$0.00044** |
| SearchApi.io | $0.0074 | $0.0013 | $0.0011 |
| Duffel | $0.00083 | $0.00083 | $0.00083 |

---

## 5. Commitments, credits and expiry

| | SerpApi | HasData | SearchApi.io | Duffel |
|---|---|---|---|---|
| Minimum purchase | 1 month | 1 month | 1 month | **None** |
| Minimum monthly commitment | Plan price | Plan price | Plan price | **None** |
| Trial credits | 250/mo ongoing free tier | 66 one-time | 100 one-time | Test mode (synthetic fares) |
| Unused credits expire | Rollover to "Extra Credits" on downgrade; monthly expiry on a stable plan **UNKNOWN** | UNKNOWN | UNKNOWN | n/a — pay per use |
| Overage cost | No overage — plan cap is hard | UNKNOWN | UNKNOWN | $0.005/search, uncapped |
| Booking requirement | **None** | **None** | **None** | None required, but ratio is monitored |

**Duffel's test mode returns synthetic fares** and is therefore useless as a data source —
it is a development sandbox, exactly as the previous S3 noted for Amadeus.

---

## 6. Recommended spend

| Phase | Provider | Plan | Cost |
|---|---|---|---|
| Validation (today) | SerpApi | Free | **$0** — 250 searches is enough to prove the shape |
| SIH demo (30 days) | SerpApi | Starter | **$25** |
| If the panel scales to 60 routes | HasData | Business | **$99/mo** |
| If Duffel clears clause 2.5(d) | Duffel | Pay-as-you-go | **$189/mo** for FULL, with all six hedonic characteristics |

**Total cost to unblock the project: $25, once.** That figure is the entire distance
between the previous NO-GO and a working index.

A budget line of **$25–$99/month** should be compared against what it buys: the difference
between an index computed on synthetic fixtures and one computed on real Indian domestic
airfares. The ₹0 constraint was a design goal; it was never a requirement of PS SIH26056.

---

## 7. Throughput sanity check

The FULL panel fires 1,260 searches across three slots — 420 per slot. If a slot's
collection window is ±15 minutes (`panel.yaml: collection.slot_tolerance_minutes`), peak
demand is ~420 searches in 30 minutes = **840/hour**.

| Provider / plan | Hourly cap | Fits 840/hr? |
|---|---|---|
| SerpApi Starter | 200 | ✗ (irrelevant — DEMO peaks at 30/day) |
| SerpApi Production | 3,000 | ✓ |
| HasData Business | UNKNOWN | Needs confirmation before scale-up |
| SearchApi Production | 7,000 (20% of 35,000) | ✓ |

For the DEMO panel (30 searches in one slot) every provider's free tier is sufficient on
throughput. **No plan is throughput-constrained at demo scale.**
