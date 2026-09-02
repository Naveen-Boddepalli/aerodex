# SIH26056 Submission Notes

This document contains draft language and audit notes to assist with the final SIH26056 submission, specifically addressing gaps in the problem statement requirements.

## 1. Fare Component Decomposition (Estimated)
*Addresses the requirement for granular price breakup (base fare, fuel surcharge, airport user development fees, taxes, dynamic surge factors).*

**Draft Submission Text:**
> "To meet the requirement for a granular fare decomposition without violating our strict compliance rules (see Compliance Narrative), AeroDex implements an 'Estimated Decomposition' model. Direct extraction of backend tax and fee components often requires deep scraping of checkout pages or bypassing bot protections, which violates NSO-level data collection standards. Instead, our engine observes the final, all-inclusive quoted fare (the price the consumer actually pays) and applies known statutory tax rates (e.g., GST on domestic economy) and published airport development fees to back-calculate the estimated base fare and surcharges. This is prominently labeled as an 'Estimated decomposition' in the dashboard to maintain statistical transparency."

## 2. Source Coverage Audit
*Addresses the requirement to identify which PS-mandated airlines/OTAs are covered.*

Based on the `demo` panel (which mirrors the production schema):
- **Airlines Covered (5 of 6):** IndiGo (6E), Air India (AI), Air India Express (IX), Akasa Air (QP), SpiceJet (SG).
- **Airlines Missing from demo:** None of the other currently operational standalone domestic airlines named in the PS are missing. (Note: Vistara has merged into Air India).
- **OTAs:** MakeMyTrip, Yatra, EaseMyTrip, Cleartrip, Ixigo, Goibibo. (Coverage for these OTAs resides in the `aerodex/acquire/` adapter layer, which is maintained separately by the collection team. The collection team must confirm OTA coverage prior to final submission.)

## 3. Compliance and Evasion Trade-off Narrative
*Addresses the need to justify why certain deep data points (like exact live tax breakdowns or hostile OTA scrapes) might be missing, emphasizing NSO-level collection standards.*

**Draft Submission Text:**
> "A core invariant of the AeroDex architecture is that a National Statistical Office (NSO) cannot construct official national indices using adversarial data collection. We prioritize strict compliance over evasion. The collection pipeline respects `robots.txt`, implements conservative request delays (minimum 20 seconds), and explicitly forbids the use of CAPTCHA-solving services, residential proxy networks, or session hijacking. 
> 
> When a mandated source implements aggressive anti-bot measures, we do not engage in an arms race to bypass them. Instead, we allow the collection for that source to fail cleanly. Our index engine is designed to handle this gracefully: if a stratum drops below the minimum matched quotes, it is imputed using the stratum-group mean, provided the total imputed weight remains below our strict 5% ceiling (Quality Gate M5). This approach guarantees that the resulting DAPI (Domestic Airfare Price Index) is built on an ethically acquired, legally defensible, and fully auditable data foundation."
