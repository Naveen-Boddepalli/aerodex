# Phase 0 · Spike S3 — Candidate fare source mapping

**Date:** 23 August 2026 · **Question (plan §8):** for each of ~6 candidate sources,
can one fare quote be retrieved without login, and is there a tier-2 JSON endpoint?
**Kill condition:** fewer than 3 sources usable → redesign the panel around the survivors.

---

## Verdict: **NO-GO on terms.** Zero sources are currently usable.

The technical question has a clear answer: **yes**, real fares are retrievable
without touching authentication, CAPTCHAs or anti-bot controls. One was retrieved
(§Evidence). Two sources carry excellent structured data.

The blocking question is legal, not technical. **Every source with usable fare data
explicitly prohibits automated collection in its terms of use.** Not by broad
implication — by named clause, prohibiting exactly this activity.

> ⚠️ **This supersedes the first version of this document, which recorded a
> "GO, narrowly" verdict for ixigo.** That verdict was reached before ixigo's terms
> were read. They prohibit it. The earlier conclusion was wrong.

Every prohibition found includes the same carve-out — *"without our express written
permission"*. **Permission is therefore the project's critical path, not a formality.**

## Evidence: the fare that was retrieved

```
Air-India Express IX1056   DEL → BOM   17:50 → 19:30   PT1H40M
INR 5,929   availability: InStock   (source: ixigo, 23 Aug 2026)
```

Plain HTTPS GET; robots checked at request time; project User-Agent; 20 s host
pacing. No login, no CAPTCHA, no evasion. Full record in `s3-evidence.json`.
**It must not be used** — see the terms finding below.

## Source matrix

| Source | robots | Fare data quality | Terms | Verdict |
|---|---|---|---|---|
| **ixigo** | ✅ `/cheap-flights/` allowed | ✅ 138 flights + 46-date fare calendar | ❌ **prohibits** | **OUT** |
| **Cleartrip** | ✅ `/flight-schedule/` allowed | ✅✅ 150 options, richest schema | ❌ **prohibits** | **OUT** |
| **EaseMyTrip** | ✅ `/flights/…` allowed | ⚠️ monthly minima only | not reached | **OUT** (data) |
| **goibibo** | ❌ `/flights/air-*`, `/api/` | — | — | **OUT** |
| **Trip.com** | ❌ content under `/tickets-*` | — | — | **OUT** |
| **Akasa Air** | ✅ fully permissive | ❌ SEO pages carry no fares | ❌ prohibits | **OUT** |
| **SpiceJet** | ❌ `/api/v1` (by intent) | ❌ SPA shell | — | **OUT** |
| **Air India Express** | ❌ `/flight-availability` | — | — | **OUT** |
| **IndiGo / Air India / MakeMyTrip / Yatra** | ❌ robots.txt unreachable | — | — | **OUT** |

### The terms, quoted

**ixigo** — Terms of Use:
> "systematically retrieve data or other content from the Site to create or compile,
> directly or indirectly, a collection, compilation, database, or directory
> **without written permission**"
> "use, launch, develop, or distribute any automated system, including without
> limitation, any spider, robot … scraper"
> "will not access the Site through automated or non-human means"

The first clause describes AeroDex's output — a compiled database — with precision.

**Cleartrip** — Terms of Use:
> "access, monitor or copy any content or information of this Website using any
> robot, spider, scraper or other automated means … for any purpose **without our
> express written permission**"
> "violate the restrictions in any robot exclusion headers … or bypass or circumvent
> other measures employed to prevent or limit access"
> "use this Website or its contents for any commercial purpose"

**Akasa Air** — Terms and Conditions:
> "meant for personal and non-commercial use only"
> "not permitted to copy, replicate, modify … any information obtained from the Website"

**Note:** plan §7's rule that "raw third-party page content is not redistributed,
only derived statistics" does **not** cure this. These clauses prohibit the *access
and compilation*, not merely the republication.

## What the two good sources actually contain

Recorded because they become immediately usable if permission is granted.

### Cleartrip — the richest structure found

`/flight-schedule/{origin}-{dest}-flights.html` (5,361 domestic pages in the official
sitemap) embeds a hydration JSON blob with **150 travel options** per page:

| AeroDex field | Cleartrip field | |
|---|---|---|
| `fare_inr_paise` | `route_total_fare` | ✅ |
| `flight_number` | `flight_number` | ✅ |
| `carrier` | `carrier_codes[]` | ✅ |
| `stops` | `no_of_stops` | ✅ 67 nonstop / 83 one-stop |
| `departure_time` / `arrival_time` | `dep_time` / `arr_time` | ✅ clean 24h |
| `duration_minutes` | `formated_duration` (seconds) | ✅ |
| `is_refundable` | `refundable` + `refundable_text` | ✅ |
| `baggage_included` | `hbag` | ✅ |
| `departure_date` | `dep_date` | ✅ |
| `cabin` | search context `"cabin":"ECONOMY"` | ✅ |
| `itinerary_key` | `unique_flight_key` | ✅ natural key |
| — | `seat_availability`, `strike_off_price` | bonus |

This fills **every** gap identified for ixigo. Fares ₹6,179–₹12,824 on DEL-BOM.

**Its one limitation:** all 150 options share a single `dep_date` (07/09/2026 =
today + 15). One uncontrolled horizon per page, and the URL takes no date parameter —
date-controlled search lives under `/flights/search*`, which robots disallows.
Whether the +15 offset is stable is unverified and would need observation across days.

### ixigo — good horizon coverage, thinner attributes

`/cheap-flights/{o-city}-{d-city}-{ooo}-{ddd}` carries 138 schema.org `Flight`
objects plus a daily fare calendar spanning **0–45 days** ahead (46 dates), covering
6 of our 7 horizons — **60 days is unreachable**. Missing `stops`, `cabin`,
`is_refundable`, `baggage_included`. Its two structures do not join: LD-JSON has
flight identity but no date; the calendar has date but frequently no flight number.

Data caveat: `departureTime` is emitted as `"17:50 PM"` — 24-hour clock with a
spurious meridiem. Do not feed it to a `%I:%M %p` parser.

## Paths forward

Ranked. The first is the only one that makes the current design work.

1. **Request written permission.** Every prohibition carves out express written
   permission. A government-statistics project for MoSPI is an unusually strong
   applicant, and the ask is narrow: read-only, rate-limited, derived statistics
   only, no redistribution of raw content, public methodology. **Cleartrip first**
   (best data), then ixigo, then Akasa (whose robots.txt already invites crawling).
2. **Travelpayouts Data API.** The one path that is *affirmatively permitted* — the
   provider publishes the API for third-party use. Free, documented, real cached
   fares. Needs an affiliate account and an `X-Access-Token`. Unresolved: plan §5.8
   endorses it while §7 forbids account creation (§Decisions). I cannot create the
   account in any case.
3. **Official statistics.** DGCA / MoSPI airfare monitoring series. Sanctioned, but
   not real-time and not a substitute for the panel.
4. **Direct airline agreements** (NDC / partner APIs). Slow, but durable, and the
   natural end-state for an official index.

**Do not** proceed on the reading that permissive robots.txt overrides terms. It does
not, and Cleartrip's terms name robot-exclusion-header compliance as a *separate*
obligation from the automated-access ban.

## Decisions needed

1. **Pursue written permission?** If yes, this is the critical path and should start
   immediately — it has a long lead time and everything else waits on it.
2. **Travelpayouts** — does a free, sanctioned API token count as "authentication"
   under plan §7, or is §7 aimed only at the scraping path? §5.8 already endorses
   the source. Account creation would have to be done by the team.
3. **Does the panel design survive?** If only Travelpayouts is available, booking-
   horizon control is lost (plan §1.1 already flags this), which changes the index
   definition — not just the implementation.

## Corrections to disclose

1. **The earlier "GO" verdict for ixigo was wrong** — issued before its terms were
   read. Corrected above.
2. **The ixigo robots check passed vacuously.** `urllib.robotparser` discarded
   ixigo's entire ruleset (blank-line defect, below), so the automated gate was
   enforcing nothing at the time. The paths actually fetched (`/cheap-flights/`) are
   genuinely allowed — confirmed by reading the file directly and re-verified with
   the fixed parser — so no disallowed path was fetched on ixigo.
3. **One request was made to a disallowed path.** During the first sweep,
   `https://www.goibibo.com/flights/air-delhi-mumbai-flights/` was fetched after the
   old parser reported it allowed. goibibo's `Disallow: /flights/air-*` uses a
   wildcard the stdlib does not implement. The corrected parser denies it. One GET,
   1,608 bytes, no data used.

## Not done

- EaseMyTrip terms not reached (its data is too coarse to matter).
- Whether Cleartrip's +15-day offset is stable across collection days.
- No production adapter written, per instruction.
