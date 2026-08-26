# Evidence — API documentation and the DEL→BOM walkthrough

**Collected 25 August 2026.**

| Provider | Docs URL |
|---|---|
| SerpApi Google Flights | https://serpapi.com/google-flights-api |
| SerpApi Google Flights Price Insights | https://serpapi.com/google-flights-price-insights |
| HasData Google Flights | https://hasdata.com/apis/google-flights-api |
| SearchApi.io Google Flights | https://www.searchapi.io/google-flights-api |
| Duffel API overview / test mode | https://duffel.com/docs/api/overview/test-mode/duffel-airways |
| Duffel response handling | https://duffel.com/docs/api/overview/response-handling/order-and-booking-creation |
| Amadeus for Developers (self-service decommissioned 17 Jul 2026) | https://developers.amadeus.com/register |

---

## PART 6 — How AeroDex would collect DEL→BOM for one month

**Panel slice:** 1 route × 7 horizons × 1 slot × 30 collection days = **210 searches/month.**
Well inside SerpApi Starter ($25/mo, 1,000 searches) with room for nine more routes.

### The horizon arithmetic

On collection date `D`, for each horizon `h`, request `outbound_date = D + h`:

| Horizon | Collection date | `outbound_date` |
|---|---|---|
| T-1  | 2026-09-01 | 2026-09-02 |
| T-3  | 2026-09-01 | 2026-09-04 |
| T-7  | 2026-09-01 | 2026-09-08 |
| T-14 | 2026-09-01 | 2026-09-15 |
| T-21 | 2026-09-01 | 2026-09-22 |
| T-30 | 2026-09-01 | 2026-10-01 |
| T-60 | 2026-09-01 | 2026-10-31 |

Repeat for `D` = 2026-09-01 … 2026-09-30. **The horizon is controlled by construction** —
nothing is asked of the provider.

### The request (SerpApi)

```
GET https://serpapi.com/search
  ?engine=google_flights
  &departure_id=DEL
  &arrival_id=BOM
  &outbound_date=2026-09-08     # = collection date + 7
  &type=2                       # 2 = one way
  &travel_class=1               # 1 = economy
  &currency=INR
  &gl=in&hl=en
  &api_key=$SERPAPI_KEY
```

`type=2` matters: a one-way query keeps the stratum definition clean. `gl=in` matters more —
fare pages price by geography, which is the same reason `plan.md` §5.1 insisted on an Indian
egress IP.

### The response, mapped to `aerodex.acquire.base.Quote`

| `Quote` field | Source in response | Present? |
|---|---|---|
| `source` | constant `"serpapi_google_flights"` | ✅ |
| `request` | the `SearchRequest` that produced it | ✅ |
| `collected_at` | wall clock at fetch — **actual, never nominal** (`plan.md` §5.1) | ✅ |
| `fare_inr_paise` | `price` × 100 — tax-inclusive total | ✅ |
| `carrier` | `flights[0].airline` | ✅ |
| `flight_number` | `flights[0].flight_number` | ✅ |
| `stops` | `len(layovers)` | ✅ |
| `departure_time` | `flights[0].departure_airport.time` | ✅ |
| `arrival_time` | `flights[-1].arrival_airport.time` | ✅ |
| `duration_minutes` | `total_duration` | ✅ |
| `fare_brand` | — | ❌ **absent** |
| refundability | — | ❌ **absent** |
| baggage | `extensions[]` free text | ⚠️ partial |

Also returned and worth archiving: `price_insights` (lowest price, typical range, price
level, price history) and `booking_token`. `booking_token` is **volatile** and must not be
used as the matched-model key — `normalise.py` already builds a stable itinerary key from
carrier + flight number + date, which is the correct identifier.

### What this means for `methodology.yaml`

`hedonic.characteristics` lists six. Four populate: `stops`, `departure_time_bucket`,
`carrier_type` (derived from `airline`), `duration_minutes`. Two do not: `is_refundable`,
`baggage_included`.

Either reduce the spec to four and bump the config hash deliberately, or clear Duffel's
clause 2.5(d) and keep all six. Do not leave the config describing a model the adapter
cannot fit.

### The equivalent on Duffel

`POST /air/offer_requests` with one slice (`origin: DEL`, `destination: BOM`,
`departure_date`), `passengers: [{type: adult}]`, `cabin_class: economy`. Returns `offers[]`
with `total_amount`, `tax_amount`, `slices[].segments[]` (marketing carrier, flight number,
times, duration, aircraft), `passengers[].baggages[]`, `fare_brand_name` and `conditions`
(`refund_before_departure`, `change_before_departure`).

**All six hedonic characteristics populate.** This is why Duffel is the backup rather than
being dismissed — the data is strictly better, and only clause 2.5(d) stands in the way.
