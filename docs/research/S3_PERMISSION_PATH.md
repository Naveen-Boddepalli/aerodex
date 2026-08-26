# S3 → S4 PERMISSION PATH — outreach record

**Opened 25 August 2026.** Active workstream. Update the tracking table in §6 as replies arrive.

> **Sending is a human action.** Every letter here goes from the team's institutional email
> address with the faculty mentor in copy. That sender *is* the credential — the same words
> from a personal account or an automated sender are materially weaker. Nothing in this file
> should be sent by an agent.

---

## 1. Verified addressee

Confirmed against MoSPI's own **National Metadata Structure (NMDS) for CPI**, document dated
**18 March 2026** (§1.4), not a third-party directory:

| Field | Value |
|---|---|
| Officer | **Ms. Deepti Srivastava** |
| Designation | **Deputy Director General** |
| Division | **Price Statistics Division (PSD)**, National Statistics Office |
| Email | **ddg2-psd.nso@mospi.gov.in** |
| Phone | 011-23455506 |
| Address | Room No. 506, 5th Floor, Khurshid Lal Bhawan, Janpath Road, New Delhi – 110001 |

**Correction to `docs/research/s3/NEXT_ACTIONS.md`:** that draft addresses the *"Prices & Cost
of Living Division"*. The division is named **Price Statistics Division**. Addressing a
ministry letter to a division that does not exist under that name is the kind of detail that
gets a letter filed rather than answered.

The email is a **designation mailbox** (`ddg2-psd`), which survives officer transfers. Address
the letter to the named officer but rely on the designation address.

---

## 2. Two NMDS findings that re-scope the ask

### Finding A — MoSPI will not share unit-level price data. Categorically.

> **§2.11 Data Confidentiality:** "The unit level price data of the basket of commodities are
> **not placed in public domain**."
>
> **§3.2 Data sharing / Data Dissemination:** "The unit level price data of the basket of
> commodities are **not shared with any stakeholder**."

**Consequence: the previous NA-1 ask is dead on arrival.** `NEXT_ACTIONS.md` asks the Ministry
to supply "the airfare data MoSPI already receives from DGCA." MoSPI's own current metadata
standard says unit-level price data is shared with *no one*. Asking for it signals we did not
read the Division's own documentation — to the Division that wrote it.

**Remove that ask.** Replace it with an explicit statement that we are *not* requesting
microdata. Pre-empting the refusal is worth more than making the request.

### Finding B — air fares are collected from digital sources, and there is an online-market frame

> "Greater use of **digital and administrative data sources** has improved accuracy and
> consistency in price collection for items such as telephone charges, rail fares, **air
> fares**, fuel, postal charges, and online services."
>
> "Further, **12 online markets** are also added across 12 towns having more than 25 lakh
> population to capture price variations of the items on the **e-commerce/online platforms**."

This is a stronger, more current hook than the CPI 2024 FAQ Q27 line the previous research
leaned on, and it is citable to a numbered section of a March 2026 document. It supports ask
#3 (introduction to platforms) precisely.

### Also confirmed

- New CPI series: **base 2024 = 100**, from January 2025, on **COICOP 2018**
- **358 items** — 308 goods, 50 services — in 12 divisions, 43 groups, 92 classes, 162 subclasses
- Weights from **HCES 2023–24**
- Release: **4 PM on the 12th** of each month
- Collection: 1,465 rural markets, 1,395 urban markets, 434 towns, plus the 12 online markets

`methodology.yaml` sets `base.period: "2026-09"` with `base.value: 100.0`. MoSPI's series is
2024 = 100. These are different base periods by design, but the divergence should be stated
explicitly in the methodology note so no reader assumes comparability.

---

## 3. The four asks, ranked by what can actually be granted

| # | Ask | Cost to MoSPI | Likelihood |
|---|---|---|---|
| 1 | **Methodological guidance** on the design, particularly horizons-as-strata | One reply | Best — officials answer "please advise" far more readily than "please give" |
| 2 | **Letter of support** confirming the project addresses PS SIH26056 | One paragraph | Good |
| 3 | **Introduction** to the online platforms, or permission to cite the Ministry's sponsorship of PS SIH26056 when approaching them | An email, or nothing | Moderate |
| 4 | **Section 4 arrangement** (appointment or contract to aid collection) | A formal process | Low — but free to ask |

Ask 3 has a fallback built into it: even a "no introduction, but yes you may cite the
problem statement" is a usable outcome, and it is nearly costless to grant.

---

## 4. THE LETTER — ready to send

**To:** ddg2-psd.nso@mospi.gov.in
**CC:** faculty mentor, team lead
**Subject:** Smart India Hackathon 2026, PS SIH26056 — request for guidance and a letter of support

---

Respected Ma'am,

I am [NAME], a student at [INSTITUTION]. Our team is working on Problem Statement **SIH26056**, sponsored by this Ministry, under Smart India Hackathon 2026.

**What we are building.** A high-frequency airfare price index for India: a statistical series constructed from repeated observations of publicly displayed economy-class fares across a fixed panel of 60 domestic city pairs, weighted by DGCA passenger traffic, and observed at seven fixed advance-purchase horizons (T-1 to T-60 days). The index uses a Jevons elementary formula, hedonic quality adjustment on log fare, and Lowe aggregation, chain-linked monthly. The realised coverage ratio and imputed weight share are published alongside every index point.

We note these choices follow the Ministry's own practice — the CPI 2024 series uses Jevons at the elementary level and a Laspeyres-family aggregation above it. Our methodology configuration, source code and complete research record are public at github.com/Naveen-Boddepalli/aerodex.

**What we are not asking for.** We have read the National Metadata Structure for CPI dated 18 March 2026, and note §2.11 and §3.2: unit-level price data is not placed in the public domain and is not shared with any stakeholder. We are therefore **not** requesting CPI microdata, and our index is not intended to duplicate or substitute for the CPI air-fare item. It is intended as a higher-frequency, route-level complement, and we would describe it that way in anything we publish.

**What we would be grateful for**, in decreasing order of what we expect is feasible:

1. **Guidance.** Whether the Division sees any methodological defect in the design above — particularly our treatment of each advance-purchase horizon as a separate stratum, and our use of a fixed DGCA traffic weight vintage. We would act on any comment received.

2. **A letter of support** confirming that this project addresses PS SIH26056. This would materially assist us in approaching data sources.

3. **An introduction, or permission to cite.** The NMDS records that the 2024 series makes "greater use of digital and administrative data sources" for items including air fares, and that twelve online markets were added to capture prices on e-commerce and online platforms. Our principal constraint is that online travel platforms' terms of use bar automated collection without written permission. If the Division considered it appropriate, an introduction to the platforms it already works with — or simply confirmation that we may cite this Ministry's sponsorship of PS SIH26056 when we write to them — would be of enormous help.

4. **Whether any arrangement under Section 4 of the Collection of Statistics Act, 2008** — an appointment or a contract to aid in the collection of statistics — could be available to a student research team. We recognise this is a formal instrument and we are not assuming one; we ask only because it costs the Division nothing to decline.

**What we would offer.** The methodology, code and validation record are public and will remain so. The system is designed to be handed over and has no recurring operating cost. If the series proves useful, the Ministry is welcome to it.

Our faculty mentor, [MENTOR NAME, DESIGNATION], is in copy and can confirm the project's academic standing.

Thank you for your time and consideration.

Yours respectfully,
[NAME]
[ROLL NUMBER / PROGRAMME], [DEPARTMENT]
[INSTITUTION], [CITY]
[EMAIL] · [PHONE]

---

## 5. Before sending — checklist

**Draft is live in Gmail** (draft id `r-8807080688388328168`), addressed to
`ddg2-psd.nso@mospi.gov.in`, sending from the verified institutional account
**boddepalli.naveen2024@vitstudent.ac.in**.

Done:

- [x] Repository made **public** — verified rendering at github.com/Naveen-Boddepalli/aerodex
- [x] `REPO_URL` in `aerodex/compliance.py` corrected to the real repository. 148 tests still pass
- [x] Sending account confirmed **institutional** (`@vitstudent.ac.in`), not personal Gmail
- [x] Sender: Boddepalli Naveen, 24BCE0512, B.Tech. CSE, SCOPE, VIT Vellore
- [x] Contact details filled — institutional email and phone
- [x] Faculty mentor named: **Padmavathy T, Assistant Professor Senior Grade 2, School of Computer Science and Engineering**

- [x] **CC set** — `padmavathy.t@vit.ac.in`
- [x] Instruction block removed. **Draft is clean and sendable**

Outstanding — human steps, not draft edits:

- [ ] **Brief Prof. Padmavathy and get her agreement** to be named and copied (see §5a). She is in CC, so she receives this the moment it is sent
- [ ] Confirm the honorific. Not verified — a public search surfaces a *different* person (see caution below)
- [ ] Re-verify the addressee at [mospi.gov.in/web/mospi/whos-who-w](https://mospi.gov.in/web/mospi/whos-who-w) — officers transfer
- [ ] Attach nothing on the first email. Offer the deck only if asked

**Caution — confusable identity.** A public search for "Padmavathy T, SCOPE, VIT" returns
**Dr. Padmavathy T V**, *Professor Grade 1*, **VIT Chennai**, `padmavathy.tv@vit.ac.in`.
That is one character from the address supplied (`padmavathy.t@` vs `padmavathy.tv@`), a
different campus, and a different designation. The letter uses the details supplied by the
team, not the search result. **Verify the address character by character before sending** —
a typo here delivers a ministry letter to the wrong academic at the wrong campus.

**Verified draft state** (`METADATA_ONLY`, 26 Aug 2026):

```
From: Boddepalli Naveen 24BCE0512 <boddepalli.naveen2024@vitstudent.ac.in>
To:   ddg2-psd.nso@mospi.gov.in
Cc:   padmavathy.t@vit.ac.in
Subj: Smart India Hackathon 2026, PS SIH26056 — request for guidance and a letter of support
```

### 5a. Why the mentor must be briefed first

The letter closes: *"Our faculty mentor, [name], is in copy and can confirm the project's
academic standing."*

That sentence is a **verification offer**. A ministry officer receiving an unsolicited email
from a student has no way to tell a serious project from a stunt. Naming a faculty member and
copying them says: *here is someone holding an institutional position who will vouch that I am
who I claim to be and that this project is real.* It is what converts the letter from a cold
email into an institutionally-backed request, and it is the main reason a DDG would read past
the first paragraph.

It also creates an obligation. If the Division replies to her, forwards the mail, or telephones
the School, she must already know what this is. A faculty member receiving a query from MoSPI
about a project she has never heard of is a serious embarrassment — for her first, and for the
team immediately after.

So: **show her the letter before it is sent, not after.** Ask her explicitly whether she is
willing to be named and copied. The strongest outcome is that she replies-all with one line —
*"I confirm this team is working under my guidance on PS SIH26056"* — a day or two after it
goes out. That single sentence from an institutional address does more than the rest of the
letter combined.

If she prefers not to be named, remove the sentence and send it anyway. A letter without a
mentor is weaker; a letter naming an unwitting mentor is worse than weak.

---

## 6. Tracking

| # | Addressee | Channel | Sent | Reply due | Status |
|---|---|---|---|---|---|
| M-1 | Ms. Deepti Srivastava, DDG, Price Statistics Division, MoSPI | ddg2-psd.nso@mospi.gov.in | ☐ | +21 d | **Draft complete and sendable** — awaiting mentor briefing |
| M-2 | DGCA — route × airline min/max tariff field list | TBD | ☐ | +21 d | Not sent |
| M-3 | SIH organisers — what the Dataset Link provides | sih.gov.in | ☐ | +14 d | Not sent |
| O-1 | ixigo | data / corporate affairs | ☐ | +21 d | Not sent |
| O-2 | EaseMyTrip | corporate | ☐ | +21 d | Not sent |
| O-3 | Cleartrip | "express written permission" route | ☐ | +21 d | Not sent |
| O-4 | MakeMyTrip / goibibo | corporate affairs | ☐ | +21 d | Not sent |

**Send M-1, M-3 and the four OTA letters on the same day.** Sequencing them wastes the
calendar; the SIH nodal-centre round is in December.

---

## 7. Decision trigger

**If no substantive reply from any addressee by 1 October 2026**, the permission path has
failed for this cycle and the decision returns to `S3_DECISION_LOG.md` D-01 — the paid API
route, at $25 for the demo panel.

Record that date now, while it is a calm decision. The alternative is discovering in
November that there is no data and no time.

This does not mean stopping the letters. An authorisation arriving in November is still
worth having — it just cannot be the thing the December submission depends on.
