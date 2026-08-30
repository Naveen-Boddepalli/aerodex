# Aerodex Frontend — Architecture, Features & Presentation Guide

> **Project:** Aerodex — Real-Time Airfare Price Index for India  
> **Hackathon:** Smart India Hackathon (SIH) 2026  
> **Problem Statement:** PS SIH26056 (Ministry of Statistics and Programme Implementation - MoSPI)  
> **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts, HTML5 Canvas API

---

## 📋 Executive Summary

The Aerodex frontend provides a real-time, interactive interface for tracking, indexing, and analyzing domestic airfares across India's top 60 route corridors. Built to the standards of official statistical indices (Jevons-Lowe methodology), the UI balances **analytical depth for policy researchers** with **intuitive, responsive design for everyday travellers**.

---

## 📐 Architecture & Route Organization

The application utilizes Next.js **Route Groups** to completely isolate marketing layout shells from dashboard layout shells without modifying URL structures.

```
frontend/app/
├── (marketing)/                # Route Group: Isolated marketing shell
│   ├── layout.tsx              # Bare pass-through (no global nav/footer)
│   └── landing/
│       └── page.tsx            # Animated Landing Page (custom top bar & footer)
├── (dashboard)/                # Route Group: Application shell
│   ├── layout.tsx              # Global Shell: Navbar + Container + Footer
│   ├── page.tsx                # Main Dashboard (panel query, stats, provenance, map)
│   ├── price-tracking/         # 60-Route Filterable Table & Sparklines
│   ├── alerts/                 # Threshold crossings derived from the panel
│   ├── history/                # Index series + corridor fare series
│   └── routes/[origin]/[destination]/   # One route in depth
├── globals.css                 # Custom CSS tokens & Tailwind v4 theme setup
└── layout.tsx                  # Bare Root HTML Shell (fonts, dark mode roots)

frontend/lib/api.ts             # The ONLY place the frontend talks HTTP
frontend/components/            # DataSourceBanner, RouteExplorer, IndexProvenance, …
```

---

## 🔌 Data — where every number on screen comes from

Nothing in the dashboard is hard-coded. Every figure is fetched from the
FastAPI service in `aerodex/api.py` through `lib/api.ts`, which is the single
place the frontend performs HTTP.

Requests go to same-origin `/api/*`; `next.config.ts` rewrites them to the API,
so the browser never makes a cross-origin request in development. Override the
upstream with `AERODEX_API_ORIGIN`, or bypass the proxy entirely with
`NEXT_PUBLIC_API_URL`.

```bash
# from the repo root — starts the API and this dashboard together
./scripts/run_demo.sh
```

Every fetcher returns `{ data, error }` rather than throwing, so a panel that
cannot reach the API says so **in place** instead of spinning forever or
drawing an empty chart that looks like a real flat line.

### Synthetic-data honesty

The API reports `data_source` on every response: `database` for collected
quotes, `demo-synthetic` for the frozen fixture run in `demo/`. When it is
synthetic, `DataSourceBanner` renders a persistent strip on every page saying
so. It collapses; it does not dismiss.

This is not decoration. The project's publisher refuses to release fixture data
as a measurement, and the dashboard must hold the same line — a chart drawn
from `demo/` is a demonstration of the format, not a statement about Indian
airfares.

---

## 🎨 Key Visual & Design System Elements

### 1. Palette & Design Tokens (`globals.css`)
- **Primary Brand Accent:** `#3D5AFE` (`var(--accent)`) — Consistently used across buttons, route indicators, active states, and canvas particles.
- **Card Surface:** `#FFFFFF` with `#E5E9F5` subtle border and `0 1px 4px rgba(61,90,254,0.08)` drop shadow (`.aero-card`).
- **Typography:** Space Grotesk (headings) & Inter (body text) loaded via Google Fonts with `font-sans` fallbacks.
- **Functional Badges:**
  - **Price Drop (Success):** `#16A34A` background `#F0FDF4`
  - **Price Rise (Danger):** `#DC2626` background `#FEF2F2`
  - **Stable (Neutral):** `#475569` background `#F1F5F9`

### 2. Smooth Scroll Color Interpolation (`/landing`)
- The landing page background smoothly transitions through 9 analogous blue and violet HSL stops as the user scrolls:
  - `0%` Hero: `#EEF1FC` (Pale blue-white)
  - `26%` How It Works: `#C7D9FF` (Cornflower tint)
  - `52%` Why Aerodex: `#CBBFFF` (Soft lavender)
  - `65%` Ticker / Movers: `#BAD4FF` (Sky blue)
  - `100%` Footer: `#3D5AFE` (Full saturation solid blue accent)
- **Mathematical Interpolation:** Uses HSL shortest-path lerp calculations based on scroll depth (`window.scrollY / scrollHeight`).
- **Accessibility:** Fully supports `prefers-reduced-motion: reduce` by disabling scroll animation and rendering static section backgrounds.

### 3. Animated Flight Path Canvas (`FlightCanvas`)
- Custom HTML5 Canvas rendering major Indian airport nodes (`DEL`, `BOM`, `BLR`, `MAA`, `HYD`, `CCU`, `GOI`, `JAI`, `AMD`, `LKO`).
- Quadratic Bezier curves connecting flight paths with glowing, animated particle trajectories rendered at native device pixel ratios (`window.devicePixelRatio`).

---

## 🚀 Key Features & Pages

| Page / Component | Key Capability & Presentation Value |
|---|---|
| **Landing Page (`/landing`)** | High-impact intro, animated flight canvas, live scrolling ticker, 3-tier pipeline breakdown, methodology statistics, and unified CTA footer. |
| **Home Dashboard (`/`)** | Hero search card, real-time Jevons-Lowe index metric summary (`IndexStats`), interactive SVG Indian route map (`RouteMapSection`), and active price tracker cards. |
| **Price Tracking (`/price-tracking`)** | 20+ domestic route panel table with multi-parameter filtering (airline, direct/stops, price movement), live sparkline charts via Recharts, and alert toggles. |
| **Price Alerts (`/alerts`)** | Manage active target price thresholds, viewing triggered drops vs. active watching state. |

---

## 🎙️ SIH Hackathon & Viva Q&A Cheat Sheet

Use these responses when judges or evaluators ask technical questions about the frontend:

### Q1: Why did you use Next.js App Router and Route Groups?
> **Answer:** "We used Next.js App Router to separate concerns cleanly. Using Route Groups like `(marketing)` and `(dashboard)`, we completely isolate the landing page layout from the core application dashboard layout. This prevents code duplication, avoids rendering redundant Navbars or Footers on marketing pages, and ensures maximum page speed without layout shift (CLS)."

### Q2: How does the scroll background transition work? Is it heavy on performance?
> **Answer:** "The scroll background uses an HSL color interpolation engine driven by a lightweight passive scroll event listener. Instead of heavy CSS background-image transitions or DOM re-renders, it calculates HSL shortest-path steps dynamically and updates a single root background variable. It runs smoothly at 60fps and automatically disables itself if the user has `prefers-reduced-motion` enabled."

### Q3: How is the Jevons-Lowe Index represented in the UI?
> **Answer:** "The UI displays geometric mean index trends through `IndexStats` and sparkline charts. Rather than just showing raw flight prices, our UI highlights price relatives and stratum-weighted movements aligned with MoSPI's CPI formulation requirements."

### Q4: How does the frontend handle real-time data?
> **Answer:** "The frontend is decoupled from data scraping. It consumes pre-validated, normalized JSON index feeds served directly via Cloudflare R2 / API endpoints. This ensures zero runtime dependency on the scraping VM and instant page loads under high user traffic."

### Q5: How is responsiveness and accessibility ensured?
> **Answer:** "We use fluid typography (`clamp()`), responsive grid breakouts, Tailwind v4 breakpoints (`sm:`, `md:`, `lg:`), WCAG AA color contrast ratios (such as inverting footer text to high-contrast white over the `#3D5AFE` solid background), and accessible ARIA labels across interactive elements."

---

## 🛠️ Local Development & Scripts

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:3000)
npm run dev

# Production build test
npm run build
```
