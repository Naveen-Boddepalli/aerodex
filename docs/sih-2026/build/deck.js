// AeroDex — SIH 2026 idea deck (PS SIH26056). Six slides in the official template order.
// Every number below was checked against the repository on 24 Sep 2026 (see FACTS).
const path = require('path');
const L = require('./lib');
const { W, rect, ellipse, line, img, text } = L;

const A = p => path.join(__dirname, 'assets', p);
const I = (n, c) => path.join(__dirname, 'icons', `${n}_${c}.png`);

// ---- fill these in, then re-run build.sh ----
const TEAM_NAME = process.env.TEAM_NAME || 'AeroDex';
const TEAM_ID = process.env.TEAM_ID || '__________';

// ---- verified facts (24 Sep 2026) ----
const FACTS = { tests: '183', golden: '11', routes: '60', airports: '23', strata: '420', horizons: '7', endpoints: '11', screens: '9' };

// ---- palette ----
const NAVY = '0B2545', BLUE = '0070C0', SKY = 'EAF3FB', SKY2 = 'F5F9FD', INK = '1B2733', MUTE = '54606E', LINE = 'D3DDE8',
  GREEN = '138A3E', GREENBG = 'E3F3E8', AMBER = 'A85F00', AMBERBG = 'FFF1D6', GREY = '6B7683', GREYBG = 'EDF0F3',
  ORANGE = 'E8731A', WHITE = 'FFFFFF';

// ---- components ----
const card = (x, y, w, h, o = {}) => rect(x, y, w, h, { fill: o.fill || WHITE, line: o.line === undefined ? LINE : o.line, lw: 1, r: o.r ?? 0.08, shadow: o.shadow });
const label = (x, y, w, s, o = {}) => text(x, y, w, 0.26, s, { sz: o.sz || 11, b: true, c: o.c || BLUE, va: 'm', nw: o.nw });
const KIND = {
  built: { fill: GREENBG, c: GREEN, t: 'BUILT' },
  partial: { fill: AMBERBG, c: AMBER, t: 'PARTIAL' },
  next: { fill: AMBERBG, c: AMBER, t: 'NEXT' },
  fixture: { fill: AMBERBG, c: AMBER, t: 'FIXTURE' },
  planned: { fill: GREYBG, c: GREY, t: 'PLANNED' },
};
const chip = (x, y, w, kind, h = 0.23) => {
  const k = KIND[kind];
  return [rect(x, y, w, h, { fill: k.fill, r: h / 2 }), text(x, y, w, h, k.t, { sz: 9, b: true, c: k.c, al: 'center', va: 'm' })];
};
const iconDot = (x, y, d, icon, bg) => [ellipse(x, y, d, d, { fill: bg }), img(I(icon, 'w'), x + d * 0.25, y + d * 0.25, d * 0.5, d * 0.5)];

function chrome(n, title, opts = {}) {
  return [
    text(1.95, 0.1, 8.7, 0.95, title, { sz: opts.tsz || 28, b: true, f: 'Times New Roman', c: NAVY, al: 'center', va: 'm' }),
    ellipse(0.36, 0.12, 1.4, 0.86, { fill: WHITE, line: BLUE, lw: 1.5 }),
    text(0.4, 0.12, 1.32, 0.86, TEAM_NAME, { sz: 12, b: true, c: NAVY, al: 'center', va: 'm' }),
    img(A('sih_logo.png'), 10.72, 0.05, 2.35, 1.09, { alt: 'Smart India Hackathon 2026' }),
    rect(0, 6.95, W, 0.55, { fill: BLUE }),
    text(0, 6.95, W, 0.55, '@SIH Idea submission- Template', { sz: 12, c: WHITE, al: 'center', va: 'm' }),
    text(12.2, 6.95, 0.8, 0.55, String(n), { sz: 12, b: true, c: WHITE, al: 'right', va: 'm' }),
  ];
}

const slides = [];

// =====================================================================================
// 1 · TITLE PAGE
// =====================================================================================
{
  const e = [];
  e.push(text(0.6, 0.28, 9.4, 0.7, 'SMART INDIA HACKATHON 2026', { sz: 34, b: true, f: 'Times New Roman', c: NAVY, va: 'm' }));
  e.push(text(0.6, 0.98, 9.4, 0.3, 'TITLE PAGE', { sz: 13, b: true, c: BLUE }));
  e.push(ellipse(9.35, 0.95, 3.7, 3.7, { fill: SKY }));
  e.push(img(A('sih_mark.png'), 9.85, 1.28, 2.7, 2.99, { alt: 'Smart India Hackathon mark' }));
  e.push(text(0.6, 1.5, 8.4, 3.75, [
    { s: '**Problem Statement ID** – SIH26056', sz: 18, sa: 11 },
    { s: '**Problem Statement Title** – Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)', sz: 15, sa: 11, lh: 1.02 },
    { s: '**Theme** – Travel & Tourism', sz: 18, sa: 11 },
    { s: '**PS Category** – Software', sz: 18, sa: 11 },
    { s: `**Team ID** – ${TEAM_ID}`, sz: 18, sa: 11 },
    { s: `**Team Name (Registered on portal)** – ${TEAM_NAME}`, sz: 18 },
  ], { c: INK }));
  e.push(text(0.6, 5.12, 8.4, 0.3, 'Ministry of Statistics and Programme Implementation (MoSPI) · Data Informatics & Innovation Division', { sz: 11, c: MUTE }));
  // solution strip
  e.push(rect(0.6, 5.62, 12.13, 1.45, { fill: NAVY, r: 0.1 }));
  e.push(text(0.9, 5.72, 5.2, 0.6, 'AeroDex', { sz: 32, b: true, c: WHITE, va: 'm' }));
  e.push(text(0.9, 6.3, 5.4, 0.7, 'A reproducible, daily Domestic Airfare Price Index (DAPI) for India, built to national-statistics standards.', { sz: 12, c: 'CFE3F6' }));
  const pills = [
    [`${FACTS.routes} routes · ${FACTS.strata} strata`, 'FaRoute'],
    [`${FACTS.tests} automated tests passing`, 'FaCheckCircle'],
    ['Bit-identical re-runs (SHA-256)', 'FaFingerprint'],
    ['Refuses to publish synthetic data', 'FaShieldAlt'],
  ];
  pills.forEach(([t, ic], i) => {
    const x = 6.55 + (i % 2) * 3.06, y = 5.83 + Math.floor(i / 2) * 0.58;
    e.push(rect(x, y, 2.95, 0.48, { fill: '17386A', r: 0.24 }));
    e.push(img(I(ic, 'w'), x + 0.14, y + 0.12, 0.24, 0.24));
    e.push(text(x + 0.5, y, 2.4, 0.48, t, { sz: 10.5, b: true, c: WHITE, va: 'm' }));
  });
  slides.push({ els: e, notes: 'Open with the one-line claim: AeroDex is a daily airfare index that a third party can recompute from its published inputs. Then name the PS (SIH26056, MoSPI) and move on — the next slide is where the idea starts.' });
}

// =====================================================================================
// 2 · PROPOSED SOLUTION
// =====================================================================================
{
  const e = chrome(2, 'AeroDex — A Daily Airfare Price Index for India');
  e.push(label(0.45, 1.1, 4, 'Proposed Solution', { sz: 13 }));
  e.push(rect(0.45, 1.42, 12.43, 0.86, { fill: SKY, r: 0.08 }));
  e.push(text(0.68, 1.42, 12.0, 0.86, '**AeroDex prices a fixed panel of 60 domestic routes at 7 booking horizons, three times a day, and publishes a daily, DGCA-weighted airfare index that anyone can recompute from its published inputs** — giving the CPI a sub-monthly, route-level signal it does not have today.', { sz: 13, va: 'm', c: NAVY }));

  // gap table
  e.push(card(0.45, 2.42, 4.15, 2.3));
  e.push(label(0.65, 2.5, 3.8, 'THE MEASUREMENT GAP', { sz: 10.5 }));
  const cx = [0.65, 1.86, 2.8];
  e.push(text(cx[1], 2.8, 0.85, 0.26, 'CPI today', { sz: 10.5, b: true, c: MUTE, va: 'm' }));
  e.push(text(cx[2], 2.8, 1.55, 0.26, 'AeroDex', { sz: 10.5, b: true, c: BLUE, va: 'm' }));
  e.push(line(0.65, 3.09, 4.4, 3.09, { c: LINE, w: 1 }));
  const rows = [
    ['Cadence', 'Monthly', 'Daily · 3 IST slots'],
    ['Look-ahead', 'One spec', '7 horizons, 1–60 days'],
    ['Coverage', 'Sampled', `${FACTS.routes} routes · ${FACTS.airports} airports`],
    ['Disclosure', 'Index level', '+ coverage, imputation, hash'],
  ];
  rows.forEach((r, i) => {
    const y = 3.16 + i * 0.36;
    e.push(text(cx[0], y, 1.2, 0.34, r[0], { sz: 10.5, b: true, c: NAVY, va: 'm' }));
    e.push(text(cx[1], y, 0.88, 0.34, r[1], { sz: 10.5, c: MUTE, va: 'm' }));
    e.push(text(cx[2], y, 1.6, 0.34, r[2], { sz: 10, b: true, c: INK, va: 'm', lh: 0.95 }));
    if (i < rows.length - 1) e.push(line(0.65, y + 0.35, 4.4, y + 0.35, { c: 'E6ECF3', w: 0.75 }));
  });

  // how it works
  e.push(label(4.8, 2.42, 4, 'HOW IT WORKS', { sz: 10.5 }));
  const steps = [
    ['FaSearch', 'Observe', ['60 routes × 7 horizons', '3 fixed IST slots a day', 'All-in fare, as a traveller sees it']],
    ['FaBroom', 'Clean', ['Normalise, dedup, tag attributes', 'Index the all-inclusive fare, as paid', 'Bounds checks, quarantine']],
    ['FaChartLine', 'Index', ['Matched-model Jevons per stratum', 'Lowe aggregation, DGCA weights', 'Missing data imputed, capped at 5%']],
    ['FaFingerprint', 'Publish', ['Dashboard and open API', 'Coverage, imputation, hashes on every point', 'aerodex verify re-derives it']],
  ];
  steps.forEach((s, i) => {
    const x = 4.8 + i * 2.06, y = 2.72, w = 1.9, h = 2.0;
    e.push(card(x, y, w, h));
    e.push(...iconDot(x + 0.14, y + 0.14, 0.44, s[0], BLUE));
    e.push(text(x + 0.66, y + 0.14, w - 0.75, 0.44, `${i + 1}  ${s[1]}`, { sz: 12, b: true, c: NAVY, va: 'm' }));
    e.push(text(x + 0.14, y + 0.7, w - 0.26, h - 0.78, s[2].map(t => ({ s: t, bul: true, sa: 3 })), { sz: 10.5, ind: 9, c: INK }));
    if (i < 3) e.push(line(x + w + 0.005, y + 0.36, x + w + 0.15, y + 0.36, { c: BLUE, w: 1.75, arrow: true }));
  });

  // innovation
  e.push(label(0.45, 4.86, 6, 'INNOVATION AND UNIQUENESS', { sz: 10.5 }));
  const tiles = [
    ['FaFingerprint', GREEN, 'Reproducible by construction', 'A pure function: the same archived panel and config always give the same SHA-256. CI re-checks it every night.', 'aerodex verify → REPRODUCIBLE'],
    ['FaBan', ORANGE, 'Refuses to overstate', 'Blocks synthetic-only runs and any run over 5% imputed weight. Coverage failures are published, never hidden.', 'PUBLICATION REFUSED, exit code 3'],
    ['FaClock', BLUE, 'Horizon-controlled', 'Fixed advance-purchase windows separate a real fare rise from late booking, as the IMF TA to MoSPI advised.', '7 horizons in config/panel.yaml'],
    ['FaBalanceScale', NAVY, 'Statistical-office method', 'Jevons + Lowe, the family MoSPI’s CPI 2024 uses, on DGCA 2025 traffic weights for all 60 routes.', '60 of 60 DGCA route weights'],
  ];
  tiles.forEach((t, i) => {
    const x = 0.45 + i * 3.15, y = 5.16, w = 2.98, h = 1.66;
    e.push(card(x, y, w, h));
    e.push(...iconDot(x + 0.14, y + 0.13, 0.44, t[0], t[1]));
    e.push(text(x + 0.68, y + 0.13, w - 0.78, 0.44, t[2], { sz: 12, b: true, c: NAVY, va: 'm', lh: 0.95 }));
    e.push(text(x + 0.14, y + 0.64, w - 0.26, 0.62, t[3], { sz: 10.5, c: INK, lh: 0.97 }));
    e.push(line(x + 0.14, y + 1.29, x + w - 0.14, y + 1.29, { c: 'E6ECF3', w: 0.75 }));
    e.push(text(x + 0.14, y + 1.31, w - 0.26, 0.3, [{ s: `**Proof** · ${t[4]}` }], { sz: 9.5, c: BLUE, va: 'm', lh: 0.95 }));
  });
  slides.push({ els: e, notes: 'Problem to solution in one sentence, then the four steps. The innovation row is the pitch: reproducibility, honesty about coverage, horizon control, and statistical-office method. Everything in the bottom row is verifiable in the repo: `aerodex verify`, the publisher refusal, and config/methodology.yaml.' });
}

// =====================================================================================
// 3 · TECHNICAL APPROACH
// =====================================================================================
{
  const e = chrome(3, 'TECHNICAL APPROACH');
  e.push(label(0.45, 1.1, 5, 'End-to-end pipeline · status as of 24 Sep 2026', { sz: 11 }));
  // sources ladder
  e.push(card(0.45, 1.42, 3.1, 1.66, { fill: SKY2 }));
  e.push(text(0.6, 1.47, 2.9, 0.26, 'DATA SOURCES · 3-TIER LADDER', { sz: 10, b: true, c: NAVY, va: 'm' }));
  const tiers = [
    ['T1', 'Institutional feed', 'MoSPI / DGCA route', 'planned'],
    ['T2', 'Licensed fare API', 'HasData / SerpApi · Duffel', 'next'],
    ['T3', 'Fixture, demo only', 'Never publishable', 'built'],
  ];
  tiers.forEach((t, i) => {
    const y = 1.78 + i * 0.42;
    e.push(rect(0.6, y + 0.04, 0.3, 0.3, { fill: NAVY, r: 0.05 }));
    e.push(text(0.6, y + 0.04, 0.3, 0.3, t[0], { sz: 9, b: true, c: WHITE, al: 'center', va: 'm' }));
    e.push(text(0.98, y, 1.55, 0.2, t[1], { sz: 10.5, b: true, c: INK, va: 'm' }));
    e.push(text(0.98, y + 0.19, 1.6, 0.18, t[2], { sz: 9.5, c: MUTE, va: 'm' }));
    e.push(...chip(2.68, y + 0.08, 0.76, t[3]));
  });
  e.push(line(3.56, 2.25, 3.78, 2.25, { c: BLUE, w: 2, arrow: true }));
  // stage chips
  const stages = [
    ['Schedule', 'systemd timers, 3 IST slots ±15 min', 'built'],
    ['Acquire', 'ladder + robots.txt and rate-limit guard', 'fixture'],
    ['Normalise', 'dedup, attribute tags, all-in fare', 'built'],
    ['Validate', 'plausibility bounds, quarantine', 'built'],
    ['Store', 'append-only quotes, DB triggers', 'built'],
    ['Index', 'pure function, Jevons then Lowe', 'built'],
    ['Publish', 'refusal gate, JSON artifacts', 'built'],
  ];
  stages.forEach((s, i) => {
    const x = 3.8 + i * 1.3, y = 1.42, w = 1.2, h = 1.66;
    e.push(card(x, y, w, h));
    e.push(ellipse(x + 0.1, y + 0.1, 0.3, 0.3, { fill: BLUE }));
    e.push(text(x + 0.1, y + 0.1, 0.3, 0.3, String(i + 1), { sz: 10, b: true, c: WHITE, al: 'center', va: 'm' }));
    e.push(text(x + 0.1, y + 0.46, w - 0.16, 0.26, s[0], { sz: 11.5, b: true, c: NAVY, va: 'm' }));
    e.push(text(x + 0.1, y + 0.74, w - 0.18, 0.6, s[1], { sz: 10, c: MUTE }));
    e.push(...chip(x + 0.1, y + 1.36, 0.8, s[2]));
  });
  e.push(rect(3.8, 3.16, 9.08, 0.36, { fill: NAVY, r: 0.06 }));
  e.push(text(3.9, 3.16, 8.9, 0.36, `PostgreSQL + TimescaleDB  ▸  static JSON artifacts  ▸  FastAPI (${FACTS.endpoints} endpoints)  ▸  Next.js dashboard (${FACTS.screens} screens)`, { sz: 10.5, b: true, c: WHITE, al: 'center', va: 'm' }));

  // columns
  const y0 = 3.66;
  // A · technologies
  e.push(label(0.45, y0, 3.7, 'TECHNOLOGIES TO BE USED', { sz: 10.5 }));
  e.push(card(0.45, y0 + 0.3, 3.75, 2.86));
  const tech = [
    ['Language, data', 'Python 3.12 · pandas · NumPy · Pydantic'],
    ['Storage', 'PostgreSQL 16 · TimescaleDB · append-only triggers'],
    ['Collection', 'httpx · own RFC 9309 robots parser · systemd timers'],
    ['Serving', 'FastAPI · Next.js 16 · React 19 · TypeScript · Recharts'],
    ['Assurance', `pytest (${FACTS.tests}) · ruff · mypy · GitHub Actions, nightly hash check`],
    ['Hosting', 'Vercel (API live) · Cloudflare R2 + Oracle A1 as the ₹0 target'],
  ];
  tech.forEach((t, i) => {
    const y = y0 + 0.38 + i * 0.46;
    e.push(text(0.6, y, 0.98, 0.42, t[0], { sz: 10, b: true, c: NAVY, va: 'm' }));
    e.push(text(1.6, y, 2.52, 0.42, t[1], { sz: 10, c: INK, va: 'm', lh: 0.98 }));
    if (i < tech.length - 1) e.push(line(0.6, y + 0.44, 4.05, y + 0.44, { c: 'E6ECF3', w: 0.75 }));
  });
  // B · methodology
  e.push(label(4.4, y0, 4.2, 'INDEX METHODOLOGY', { sz: 10.5 }));
  e.push(card(4.4, y0 + 0.3, 4.3, 2.86));
  const meth = [
    ['Stratify route × horizon → 420 strata', 'built'],
    ['Matched-model Jevons per stratum', 'built'],
    ['Lowe aggregation, DGCA 2025 weights', 'built'],
    ['Group-mean imputation, capped at 5%', 'built'],
    ['Chained daily series, 2026-09 = 100', 'built'],
    ['Hedonic quality adjustment (log-fare)', 'next'],
    ['Seasonal adjustment (STL / X-13)', 'planned'],
  ];
  meth.forEach((m, i) => {
    const y = y0 + 0.4 + i * 0.335;
    e.push(ellipse(4.55, y + 0.045, 0.24, 0.24, { fill: m[1] === 'built' ? GREEN : (m[1] === 'next' ? AMBER : GREY) }));
    e.push(text(4.55, y + 0.045, 0.24, 0.24, String(i + 1), { sz: 9, b: true, c: WHITE, al: 'center', va: 'm' }));
    e.push(text(4.9, y, 2.9, 0.33, m[0], { sz: 10, c: INK, va: 'm' }));
    e.push(...chip(7.86, y + 0.05, 0.72, m[1], 0.22));
  });
  e.push(text(4.55, y0 + 2.72, 4.05, 0.38, 'Every point ships: value · coverage · imputed share · n quotes · config hash · panel hash', { sz: 9.5, i: true, c: MUTE, va: 'm', lh: 0.95 }));
  // C · prototype
  e.push(label(8.9, y0, 4, 'WORKING PROTOTYPE', { sz: 10.5 }));
  e.push(rect(8.9, y0 + 0.3, 3.98, 1.98, { fill: WHITE, line: LINE, r: 0.04 }));
  e.push(img(A('shot_history.png'), 8.93, y0 + 0.33, 3.92, 1.92, { alt: 'AeroDex dashboard: index time series' }));
  e.push(rect(9.68, y0 + 0.36, 3.13, 0.24, { fill: AMBERBG, r: 0.12 }));
  e.push(text(9.68, y0 + 0.36, 3.13, 0.24, 'FIXTURE DATA · LABELLED ON EVERY PAGE', { sz: 8.5, b: true, c: AMBER, al: 'center', va: 'm' }));
  e.push(rect(8.9, y0 + 2.36, 3.98, 0.8, { fill: '0E1B2E', r: 0.06 }));
  e.push(text(9.05, y0 + 2.4, 3.7, 0.72, [
    { s: '$ aerodex verify', c: '9FB6D1' },
    { s: 'weighted   c3523b87…ba27   OK', c: 'FFFFFF' },
    { s: 'REPRODUCIBLE', c: '5FD38A', b: true },
  ], { sz: 10, f: 'Courier New', va: 'm' }));
  slides.push({ els: e, notes: 'Walk the pipeline left to right. Be upfront about the one amber box: Acquire runs on a fixture today because no lawful free source exists; the publisher therefore refuses to release fixture-derived numbers, which is what the terminal snippet and the dashboard banner show. Hedonic and seasonal adjustment are configured but not yet implemented — say so before a judge asks.' });
}

// =====================================================================================
// 4 · FEASIBILITY AND VIABILITY
// =====================================================================================
{
  const e = chrome(4, 'FEASIBILITY AND VIABILITY');
  e.push(label(0.45, 1.1, 7, 'PS SIH26056 deliverables — where we stand', { sz: 11 }));
  e.push(card(0.45, 1.42, 6.85, 4.32));
  const rowsD = [
    ['built', 'Cleaned fare database with metadata', 'Postgres / Timescale schema, append-only quote archive, normalise, validate, quarantine.'],
    ['built', 'Index-construction module', `Matched-model Jevons to Lowe on DGCA 2025 weights; imputation gate; ${FACTS.golden} golden tests.`],
    ['built', 'Interactive daily-index dashboard', `${FACTS.screens} screens over an ${FACTS.endpoints}-endpoint API; every page labels fixture data.`],
    ['built', 'Documentation and testing', `${FACTS.tests} tests passing; API, data-dictionary, operations and methodology docs.`],
    ['partial', 'Multi-source collection engine (Python)', 'Adapter framework, robots and rate-limit guard, 3-tier ladder done; live adapter is next.'],
    ['partial', 'Fare split: base, taxes, fees', 'Dashboard shows a labelled estimate from statutory rates; the index uses the all-inclusive fare.'],
    ['partial', '30-day back-test against DGCA data', 'Harness runs on the fixture panel; a valid back-test needs 30 days of real quotes.'],
  ];
  rowsD.forEach((r, i) => {
    const y = 1.5 + i * 0.61;
    e.push(...chip(0.6, y + 0.17, 0.72, r[0], 0.24));
    e.push(text(1.46, y, 5.75, 0.24, r[1], { sz: 11, b: true, c: NAVY, va: 'm' }));
    e.push(text(1.46, y + 0.25, 5.75, 0.34, r[2], { sz: 10, c: MUTE, lh: 0.97 }));
    if (i < rowsD.length - 1) e.push(line(0.6, y + 0.6, 7.15, y + 0.6, { c: 'E6ECF3', w: 0.75 }));
  });
  e.push(text(0.45, 5.8, 12.43, 0.24, 'PS lists 5 airlines and 6 OTAs. The fixture models all 5 airlines; OTA pages are not scraped, because their terms bar automated access.', { sz: 10, i: true, c: MUTE, lh: 0.97 }));

  // risks
  e.push(label(7.5, 1.1, 5.3, 'Challenges and risks → how we overcome them', { sz: 11 }));
  e.push(card(7.5, 1.42, 5.38, 4.32));
  const risks = [
    ['No lawful free fare feed', 'OTA terms bar automation; Amadeus self-service closed 17 Jul 2026. Licensed fare-search API for the MVP; MoSPI / DGCA route pursued in parallel.'],
    ['A source blocks or changes', 'Drop it and publish the coverage ratio. Imputation is capped at 5% or the run is refused.'],
    ['API quota and cost', '1,260 stratum-slots a day (~1,155 after overlap suppression), sized to a ~$99/month plan.'],
    ['Fare attributes missing', 'Hedonic set cut to the fields the source returns; matched-model comparison stays in force.'],
    ['Fixture read as a measurement', 'data_source tag on every API response, banner on every page, refusal in the publisher.'],
  ];
  risks.forEach((r, i) => {
    const y = 1.5 + i * 0.85;
    e.push(...iconDot(7.65, y + 0.1, 0.36, ['FaFileContract', 'FaBan', 'FaTachometerAlt', 'FaTags', 'FaShieldAlt'][i], i === 0 ? ORANGE : BLUE));
    e.push(text(8.15, y, 4.6, 0.26, r[0], { sz: 11, b: true, c: NAVY, va: 'm' }));
    e.push(text(8.15, y + 0.27, 4.6, 0.55, r[1], { sz: 10, c: INK, lh: 0.97 }));
    if (i < risks.length - 1) e.push(line(7.65, y + 0.83, 12.73, y + 0.83, { c: 'E6ECF3', w: 0.75 }));
  });

  // viability band
  e.push(label(0.45, 6.16, 3, 'VIABILITY', { sz: 10.5 }));
  const via = [
    ['FaRupeeSign', 'Cost', 'A 30-day demo run ≈ $25; the full 60-route panel ≈ $99/month (provider pages, 25 Aug 2026).'],
    ['FaLandmark', 'Handover', 'A ₹0-recurring configuration on free tiers is kept for a ministry handover.'],
    ['FaRoute', 'Roadmap', 'Now: pipeline + dashboard. Next: licensed adapter, 30 real days. Later: hedonic, seasonal, institutional feed.'],
  ];
  via.forEach((v, i) => {
    const x = 1.45 + i * 3.82;
    e.push(card(x, 6.12, 3.7, 0.72, { fill: SKY2 }));
    e.push(...iconDot(x + 0.1, 6.24, 0.36, v[0], BLUE));
    e.push(text(x + 0.54, 6.14, 3.1, 0.68, [{ s: `**${v[1]}** — ${v[2]}` }], { sz: 9.5, c: INK, va: 'm', lh: 0.95 }));
  });
  slides.push({ els: e, notes: 'This slide answers "what is real and what is not". Green is built and tested; amber is honestly partial. The strongest sentence is the last risk row: we built the guardrail that stops a fixture number being mistaken for a measurement. Costs are provider list prices read on 25 Aug 2026 (docs/research/S3_PRICING_AND_COST_MODEL.md).' });
}

// =====================================================================================
// 5 · IMPACT AND BENEFITS
// =====================================================================================
{
  const e = chrome(5, 'IMPACT AND BENEFITS');
  e.push(label(0.45, 1.1, 6.2, 'Potential impact on the target audience', { sz: 11 }));
  const who = [
    ['FaLandmark', 'MoSPI', 'A daily, route-level series beneath the monthly CPI airfare item, with coverage and imputation disclosed for every point.'],
    ['FaPlaneDeparture', 'DGCA', 'Tariff spot checks become a continuous, horizon-controlled series: which routes move, how early, and why.'],
    ['FaUsers', 'Travellers and researchers', 'Open dashboard, API and method: what a festival window costs, how far ahead to book, LCC against full-service.'],
    ['FaCodeBranch', 'The wider statistical system', 'Append-only archive, hashed config, pure function and golden tests are reusable for any high-frequency price.'],
  ];
  who.forEach((w, i) => {
    const y = 1.42 + i * 1.0;
    e.push(card(0.45, y, 6.2, 0.92));
    e.push(...iconDot(0.6, y + 0.22, 0.48, w[0], BLUE));
    e.push(text(1.25, y + 0.07, 5.3, 0.26, w[1], { sz: 12, b: true, c: NAVY, va: 'm' }));
    e.push(text(1.25, y + 0.34, 5.3, 0.56, w[2], { sz: 10.5, c: INK, lh: 0.97 }));
  });
  e.push(label(6.85, 1.1, 6, 'Benefits of the solution', { sz: 11 }));
  const q = [
    ['Social', 'FaUsers', BLUE, ['Trust through a disclosed method and open code', 'Better-informed travel decisions', 'A price people feel, measured in public']],
    ['Economic', 'FaRupeeSign', GREEN, ['30-day demo ≈ $25; full panel ≈ $99/month', '₹0-recurring handover configuration', 'Earlier read on transport prices for policy']],
    ['Technological', 'FaMicrochip', NAVY, ['Open API and a reproducible pipeline pattern', 'Pure-function index, golden tests, hash verify', 'Same engine extends to other high-frequency prices']],
    ['Environmental', 'FaLeaf', ORANGE, ['Digital collection replaces field visits for this item', 'Sized for one small VM: 2 OCPU, 12 GB', 'A modest benefit, stated plainly']],
  ];
  q.forEach((b, i) => {
    const x = 6.85 + (i % 2) * 3.05, y = 1.42 + Math.floor(i / 2) * 2.0;
    e.push(card(x, y, 2.98, 1.92));
    e.push(...iconDot(x + 0.14, y + 0.13, 0.4, b[1], b[2]));
    e.push(text(x + 0.64, y + 0.13, 2.2, 0.4, b[0], { sz: 12.5, b: true, c: NAVY, va: 'm' }));
    e.push(text(x + 0.14, y + 0.66, 2.72, 1.2, b[3].map(t => ({ s: t, bul: true, sa: 3 })), { sz: 10.5, ind: 9, c: INK, lh: 0.97 }));
  });
  // corroboration
  e.push(label(0.45, 5.5, 8, 'INDEPENDENTLY CORROBORATED BY MoSPI’s OWN RECORD', { sz: 10.5 }));
  const cor = [
    ['CPI 2024 FAQ, Q20–21', 'Jevons for elementary indices, Young / modified Laspeyres above — the same family AeroDex uses.'],
    ['IMF TA, Recommendation 11', 'Wider advance-purchase timings (14 and 21 days) and the airline as a price-determining characteristic.'],
    ['Expert Group, Rec. 11(a)', 'DGCA already holds min / max tariff data for all routes — a documented institutional route to data.'],
  ];
  cor.forEach((c, i) => {
    const x = 0.45 + i * 4.18;
    e.push(card(x, 5.78, 4.07, 0.62, { fill: SKY2 }));
    e.push(text(x + 0.12, 5.78, 3.85, 0.62, [{ s: `**${c[0]}** — ${c[1]}` }], { sz: 9.5, c: INK, va: 'm', lh: 0.95 }));
  });
  const al = ['SDG 17.18 · timely, reliable data', 'SDG 9 · innovation, infrastructure', 'Digital India', 'Atmanirbhar Bharat · open source'];
  al.forEach((t, i) => {
    const x = 0.45 + i * 3.14;
    e.push(rect(x, 6.48, 3.02, 0.36, { fill: NAVY, r: 0.18 }));
    e.push(text(x, 6.48, 3.02, 0.36, t, { sz: 10, b: true, c: WHITE, al: 'center', va: 'm' }));
  });
  slides.push({ els: e, notes: 'Lead with MoSPI and DGCA, then the wider reuse argument. The corroboration row is deliberate: the two most consequential methodological choices (Jevons at the elementary level, Lowe-family aggregation above it) match what MoSPI’s own CPI 2024 FAQ says, and the multi-horizon panel operationalises the IMF technical-assistance recommendation. All three are primary-source claims in docs/research/s3/CLAIM_EVIDENCE_REGISTER.md.' });
}

// =====================================================================================
// 6 · RESEARCH AND REFERENCES
// =====================================================================================
{
  const e = chrome(6, 'RESEARCH AND REFERENCES');
  e.push(label(0.45, 1.1, 8, 'How others build an airfare index — and where AeroDex sits', { sz: 11 }));
  const cols = [0.45, 1.85, 4.7, 6.1]; const cw = [1.4, 2.85, 1.4, 2.35];
  e.push(rect(0.45, 1.42, 8.25, 0.34, { fill: NAVY, r: 0.05 }));
  ['Who', 'How fares are obtained', 'Cadence', 'Lesson for AeroDex'].forEach((t, i) => e.push(text(cols[i] + 0.1, 1.42, cw[i] - 0.1, 0.34, t, { sz: 10.5, b: true, c: WHITE, va: 'm' })));
  const tab = [
    ['China\nCAAC · TravelSky', 'A state reservation system sees every domestic fare; the regulator sets fare bands.', 'Monthly ticket-price index', 'Owns the rails: India needs a data mandate.'],
    ['United States\nBLS · DOT', 'A mandatory ticket sample (14 CFR 241) selects routes; BLS prices them from a fare database.', 'Monthly CPI', 'Sample routes from real tickets; fixed advance-purchase specs.'],
    ['UK · Australia\nNetherlands', 'The statistics office runs its own web-scraping unit on a fixed route panel.', 'Monthly, priced N days ahead', 'Fixed panel and fixed windows: AeroDex’s design.'],
    ['India today', 'CPI 2024 collects airfare from online platforms; airlines refused DGCA’s passenger-level data request (Mar 2026).', 'Monthly', 'The gap PS SIH26056 targets.'],
    ['Typical scraper prototype', 'Direct OTA scraping against site terms; breaks when the page layout changes.', 'Ad hoc', 'Not reproducible or defensible as an official statistic.'],
    ['AeroDex', 'Licensed fare API now, institutional feed as the target; fixed 60 × 7 panel.', 'Daily, 3 IST slots', 'A reproducible bridge to a mandate-based feed.'],
  ];
  const rh = 0.68;
  tab.forEach((r, i) => {
    const y = 1.78 + i * rh, last = i === tab.length - 1;
    e.push(rect(0.45, y, 8.25, rh - 0.03, { fill: last ? SKY : (i % 2 ? SKY2 : WHITE), line: last ? BLUE : LINE, lw: last ? 1.25 : 0.75, r: 0.04 }));
    const who = r[0].split('\n');
    e.push(text(cols[0] + 0.1, y, cw[0] - 0.12, rh - 0.03, who.map((t, k) => ({ s: t, b: k === 0, sz: k === 0 ? 10.5 : 9.5, c: k === 0 ? NAVY : MUTE })), { va: 'm', lh: 0.95 }));
    e.push(text(cols[1] + 0.1, y, cw[1] - 0.15, rh - 0.03, r[1], { sz: 10, c: INK, va: 'm', lh: 0.95 }));
    e.push(text(cols[2] + 0.1, y, cw[2] - 0.15, rh - 0.03, r[2], { sz: 10, c: INK, va: 'm', lh: 0.95 }));
    e.push(text(cols[3] + 0.1, y, cw[3] - 0.15, rh - 0.03, r[3], { sz: 10, b: last, c: last ? NAVY : INK, va: 'm', lh: 0.95 }));
  });
  // research record
  e.push(label(0.45, 5.94, 5, 'OUR RESEARCH RECORD (docs/research/ in the repository)', { sz: 10 }));
  const rec = [['6', 'research passes'], ['40+', 'sources reviewed'], ['20 × 29', 'providers × axes'], ['3', 'verdicts revised, all kept']];
  rec.forEach((r, i) => {
    const x = 0.45 + i * 2.08;
    e.push(card(x, 6.24, 1.98, 0.62, { fill: SKY2 }));
    e.push(text(x + 0.05, 6.24, 0.9, 0.62, r[0], { sz: 15, b: true, c: BLUE, al: 'center', va: 'm' }));
    e.push(text(x + 0.95, 6.24, 0.99, 0.62, r[1], { sz: 9.5, c: INK, va: 'm', lh: 0.95 }));
  });
  // references
  e.push(label(8.9, 1.1, 4, 'References', { sz: 11 }));
  e.push(card(8.9, 1.42, 3.98, 5.42));
  const refs = [
    '**[1]** MoSPI, FAQs on CPI 2024 series (Q20–21, Q27) — [[https://www.mospi.gov.in/uploads/documents/documents/1770891066052-Annexure_V.pdf|mospi.gov.in]]',
    '**[2]** MoSPI, Expert Group Report on CPI updation (IMF TA Rec. 11; Rec. 11(a)) — [[https://www.mospi.gov.in/uploads/Marquee/doc-0aee0026-bf32-4213-ae4f-c5308088444e.pdf|mospi.gov.in]]',
    '**[3]** ILO / IMF / OECD / UNECE / World Bank, Consumer Price Index Manual: Concepts and Methods',
    '**[4]** Eurostat, Practical guidelines on web scraping for the HICP (2020)',
    '**[5]** US BLS, CPI airline fares — [[https://www.bls.gov/cpi/factsheets/airline-fares.htm|bls.gov]]; DOT O&D Survey, 14 CFR Part 241',
    '**[6]** UK ONS and ABS, web scraping in consumer price statistics',
    '**[7]** DGCA city-pair traffic — [[https://github.com/Vonter/india-aviation-traffic|Vonter/india-aviation-traffic]] (ODbL)',
    '**[8]** Collection of Statistics Act, 2008 — [[https://mospi.gov.in/sites/default/files/CoSAct2008.pdf|mospi.gov.in]]',
    '**[9]** RFC 9309, Robots Exclusion Protocol — [[https://www.rfc-editor.org/rfc/rfc9309|rfc-editor.org]]',
    '**[10]** MoSPI, CPI: changes in the revised series (base 2012 = 100) — [[https://www.cpi.mospi.gov.in/PDFile/CPI-Changes_in_the_Revised_Series.pdf|cpi.mospi.gov.in]]',
    '**[11]** Code, tests and decision log — [[https://github.com/Naveen-Boddepalli/aerodex|github.com/Naveen-Boddepalli/aerodex]]',
  ];
  e.push(text(9.05, 1.52, 3.7, 5.25, refs.map(s => ({ s, sa: 6 })), { sz: 10, c: INK, lh: 0.97, linkc: BLUE }));
  slides.push({ els: e, notes: 'This is the "why has nobody done this" slide. The pattern abroad is that every country that measures airfares well owns a data tap (state reservation system, mandatory ticket filing, or an in-house scraping unit). India has none of the three yet, which is why AeroDex is framed as a reproducible bridge. Full case study: docs/research/INTERNATIONAL_AIRFARE_INDEX_PRACTICE.md.' });
}

module.exports = { slides };

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, 'out');
  require('fs').mkdirSync(out, { recursive: true });
  const meta = { title: 'AeroDex — SIH 2026 Idea Submission (PS SIH26056)', author: TEAM_NAME, company: 'Smart India Hackathon 2026', subject: 'Real-time Airfare Price Index for India' };
  L.emitHtml(slides, path.join(out, 'deck.html'), meta);
  L.emitPptx(slides, path.join(out, 'AeroDex-SIH2026-Idea.pptx'), meta).then(() => console.log('built', out));
}
