# SIH 2026 idea submission — AeroDex (PS SIH26056)

Everything needed to fill the portal's **Idea Submission** form.

| File | Use |
| --- | --- |
| [AeroDex-SIH2026-Idea-v2.pdf](AeroDex-SIH2026-Idea-v2.pdf) | **Upload this** as the *Idea Template* (PDF, 6 slides, 1.3 MB; limit is 10 MB) |
| [AeroDex-SIH2026-Idea-v2.pptx](AeroDex-SIH2026-Idea-v2.pptx) | Editable source, native shapes, speaker notes on every slide |
| [form/idea-title.txt](form/idea-title.txt) | *Idea Title* — 85 / 100 characters |
| [form/idea-description.txt](form/idea-description.txt) | *Idea Description* — 14,425 / 50,000 characters |
| [form/abstract-summary.txt](form/abstract-summary.txt) | *Abstract/Summary* — 3,142 / 10,000 characters |
| [build/](build/) | Regenerates the PPTX and PDF from one layout spec |

All three text files are plain ASCII, so they paste into the portal without mangled characters.

## Portal fields

| Field | Value |
| --- | --- |
| **Idea Title** (max 100) | `AeroDex: A Reproducible Daily Airfare Price Index (DAPI) for India to Augment the CPI` |
| **Idea Description** (max 50,000) | paste [form/idea-description.txt](form/idea-description.txt) |
| **Idea Template** (PDF, ≤ 10 MB) | upload [AeroDex-SIH2026-Idea-v2.pdf](AeroDex-SIH2026-Idea-v2.pdf) |
| **Abstract/Summary** (max 10,000) | paste [form/abstract-summary.txt](form/abstract-summary.txt) |
| **Technology Bucket** | **Big Data Analysis** |
| **Youtube Link** (optional) | a 2-minute demo video, script below |

The *Idea Title* is the name of your idea, not the problem-statement title. The problem-statement title
is 186 characters and belongs on slide 1 only.

**Why Big Data Analysis.** The product is a price-panel, time-series and statistical-index pipeline
(420 strata, three collection slots a day, weighted aggregation, imputation, reproducibility hashes).
Reviewers in the AI/ML bucket would look for a learned model, and there is none by design: the hedonic
regression on the roadmap is statistical, not ML. *Other* is the fallback if the portal routes Big Data
ideas to a different evaluator pool than you expect.

## Optional YouTube video (about 2 minutes)

Judges spend little time per slide, and a recorded demo is also your insurance if the venue Wi-Fi fails.
Run `./scripts/run_demo.sh` **on its default ports (8000 / 3000)** and record:

| Time | Show | Say |
| --- | --- | --- |
| 0:00 | Slide 1, then slide 2 | "The CPI prices airfare about once a month. Airfares move daily and depend on how far ahead you book." |
| 0:20 | Slide 2, the four steps | "60 routes, 7 booking horizons, 3 slots a day: 420 strata, one daily index, every number recomputable." |
| 0:40 | Dashboard: banner, index, heat map, panel table, methodology | "The fares here are synthetic and every page says so. This is the working pipeline and API." |
| 1:20 | Terminal: `uv run python -m aerodex.cli verify --panel-csv demo/panel.csv.gz --hashes demo/expected_hashes.json` | "One command re-derives the published number. REPRODUCIBLE." |
| 1:35 | Terminal: `uv run python -m aerodex.cli index --panel-csv demo/panel.csv.gz --publish --source fixture` | "And the publisher refuses to release fixture data as a measurement." |
| 1:50 | Slide 4 | "Next: a licensed fare adapter, 30 real days, and the MoSPI / DGCA route." |

## Check before you submit

These are facts only you can confirm, so they are left visible rather than guessed:

- [ ] **Team ID** is a blank line on slide 1. Fill it in, then re-export (see below).
- [ ] **Team name** is set to `AeroDex`. Change it if the registered name differs (title slide and the oval on every slide).
- [ ] **Theme** says *Travel & Tourism*, carried over from your earlier deck. Third-party listings of this
      PS show other themes, so match it to the portal's problem-statement page.
- [ ] Slide 3 marks the MoSPI / DGCA institutional feed **PLANNED**, and the description says the request
      letters are *drafted*. If they have been sent, update both.
- [ ] The deployed dashboard URL `aerodex-sigma.vercel.app` currently returns `DEPLOYMENT_NOT_FOUND`, so it is
      **not** cited anywhere. The API at `aerodex-api-delta.vercel.app` is up and is cited.

## Rebuild after editing

```bash
cd docs/sih-2026/build
npm install
TEAM_ID=12345 TEAM_NAME="Your Team" ./build.sh
```

Needs Node and Google Chrome (macOS path by default; set `CHROME=` to override). The script builds the PPTX and
the PDF from one layout spec, so they cannot drift, and prints `QA_OVERFLOW_COUNT=0` when no text spills its box.
If you edit the PPTX by hand instead, export the PDF from PowerPoint (*File → Export → PDF*) and check it is
still 6 pages.

## What changed from the earlier decks, and why

Sources: the official 2025/2026 idea-format text, four past winning decks (2024–2025), the 2026 SIH playbook,
and how other teams on this same PS present it.

| Winning-deck pattern | Applied |
| --- | --- |
| Exact official 6-slide order, template chrome kept (logo, team oval, footer, slide number) | Yes |
| Diagram or screenshot on every content slide, not paragraphs | Pipeline diagram, dashboard screenshot, benefit quadrants, comparison table |
| Feasibility split into feasibility, challenges and solutions | Status table plus risk-to-mitigation list |
| Benefits framed as social / economic / technological / environmental | Slide 5 quadrants |
| "Comparison with existing systems" on the references slide | International comparison table |
| A slide answers one question; claims carry evidence | "Proof" line under each innovation tile |

Corrected from the earlier decks: the title slide carried the **2022** SIH logo; `[TEAM NAME]` placeholders
were left on every slide; the test count read 148 (it is 183); hedonic and seasonal adjustment were described
as done (they are configured, not implemented, and are now marked NEXT / PLANNED); the fare split was described
as a pipeline stage (it is a dashboard estimate and no index number depends on it).
