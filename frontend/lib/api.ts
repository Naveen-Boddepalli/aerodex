/**
 * Typed client for the AeroDex API (`aerodex/api.py`).
 *
 * Requests go to same-origin `/api/...` by default and Next rewrites them to
 * the FastAPI service (see `next.config.ts`), so the browser never needs a
 * cross-origin request in development. Set `NEXT_PUBLIC_API_URL` to point at a
 * deployed API instead.
 *
 * Every fetcher returns `{ data, error }` rather than throwing. A dashboard
 * panel that cannot reach the API should say so in place, not blank the page or
 * sit on a spinner forever.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export type DataSource = "database" | "demo-synthetic";

/** Provenance every list/detail response carries, so the UI can label it. */
export interface Provenance {
  data_source: DataSource;
  synthetic: boolean;
  notice: string | null;
}

export interface Result<T> {
  data: T | null;
  error: string | null;
}

const API_DOWN =
  "Cannot reach the AeroDex API. Start it with: uv run uvicorn aerodex.api:app --port 8000";

async function get<T>(path: string): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      try {
        const body = await res.json();
        if (body?.detail) return { data: null, error: String(body.detail) };
      } catch {
        /* non-JSON error body — fall through to the status-based message */
      }
      // The Next rewrite answers 500/502/504 when the FastAPI service is not
      // running, so a bare 5xx here almost always means "the API is down"
      // rather than "the API failed". Say the useful thing.
      if (res.status >= 500) return { data: null, error: API_DOWN };
      return { data: null, error: `${res.status} ${res.statusText}` };
    }
    return { data: (await res.json()) as T, error: null };
  } catch {
    return { data: null, error: API_DOWN };
  }
}

/* ─────────────────────────── Index ─────────────────────────── */

export interface IndexLatest extends Provenance {
  index: string;
  period: string;
  value: number;
  previous_value: number | null;
  base_period: string;
  base_value: number;
  coverage_ratio: number;
  imputed_weight_share: number;
  n_quotes: number;
  n_strata_reported: number;
  n_routes: number;
  is_provisional: boolean;
  config_hash: string;
  panel_hash: string;
  weights_vintage: string;
  output_hash: string;
}

export interface HeadlinePoint {
  period: string;
  date: string;
  value: number;
  coverage_ratio: number;
  imputed_weight_share: number;
  n_quotes: number;
  is_base: boolean;
}

export interface RouteSeriesMeta {
  key: string;
  route: string;
  label: string;
  cities: string;
  color: string;
  weight: number;
}

/** One chart row: `date`, `index`, and a rupee value per route key. */
export type HistoryPoint = { period: string; date: string; index?: number } & Record<
  string,
  string | number | undefined
>;

export interface HistoryResponse extends Provenance {
  routes: RouteSeriesMeta[];
  data: HistoryPoint[];
  headline: HeadlinePoint[];
  days: number;
}

export const fetchIndexLatest = () => get<IndexLatest>("/api/v1/index/latest");
export const fetchHistory = (days = 30) => get<HistoryResponse>(`/api/v1/index/history?days=${days}`);

/* ─────────────────────────── Routes ─────────────────────────── */

export interface SparkPoint {
  v: number;
  period: string;
}

export interface Tracker {
  id: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  stops: string;
  /** Median fare across all horizons — the headline number on a card. */
  price: number;
  /** Cheapest single quote collected for the route this period. */
  bestPrice: number;
  prevPrice: number;
  change: "drop" | "rise" | "stable";
  changePct: number;
  changeAmt: number;
  volume: number;
  airline: string;
  carrier: string;
  cabin: string;
  weight: number;
  horizonDays: number;
  departureDate: string;
  dates: string;
  period: string;
  updated: string;
  alertOn: boolean;
  data: SparkPoint[];
}

export interface AirportRef {
  iata: string;
  city: string;
  name: string;
  lat: number | null;
  lon: number | null;
  region: string;
}

export interface PanelRoute {
  id: string;
  origin: AirportRef;
  destination: AirportRef;
  weight: number;
  medianFare: number | null;
  bestFare: number | null;
  quotes: number;
}

export interface RoutesResponse {
  routes: PanelRoute[];
  airports: AirportRef[];
  bounds: { lat_min: number; lat_max: number; lon_min: number; lon_max: number };
  horizons: number[];
  count: number;
}

export interface RouteDetail extends Provenance {
  route: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  weight: number;
  period: string;
  byHorizon: {
    horizon_days: number;
    departure_date: string;
    best_fare: number;
    median_fare: number;
    n_quotes: number;
  }[];
  byCarrier: {
    carrier: string;
    airline: string;
    best_fare: number;
    median_fare: number;
    n_quotes: number;
    share: number;
  }[];
  series: { period: string; date: string; best: number; median: number; quotes: number }[];
}

export const fetchTrackers = (limit = 60) => get<Tracker[]>(`/api/v1/routes/trackers?limit=${limit}`);
export const fetchRoutes = () => get<RoutesResponse>("/api/v1/routes");
export const fetchRouteDetail = (origin: string, destination: string) =>
  get<RouteDetail>(`/api/v1/routes/${origin}/${destination}`);

/* ─────────────────────────── Search ─────────────────────────── */

export interface Quote {
  itineraryKey: string;
  flight: string;
  carrier: string;
  airline: string;
  fare: number;
  stops: number;
  stopsLabel: string;
  durationMinutes: number;
  departureBucket: string;
}

export interface SearchResponse extends Provenance {
  route: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  horizonDays: number;
  collectedOn: string;
  departureDate: string;
  nQuotes: number;
  quotes: Quote[];
}

export const fetchSearch = (origin: string, destination: string, horizon: number) =>
  get<SearchResponse>(
    `/api/v1/search?origin=${origin}&destination=${destination}&horizon=${horizon}&limit=12`,
  );

/* ─────────────────────────── Alerts ─────────────────────────── */

export interface Alert {
  id: string;
  route: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  airline: string;
  threshold: number;
  current: number;
  medianToday: number;
  low: number;
  high: number;
  delta: number;
  deltaPct: number;
  triggered: boolean;
  weight: number;
  period: string;
  basis: string;
}

export interface AlertsResponse extends Provenance {
  alerts: Alert[];
  summary: { triggered: number; watching: number; total: number; deepestDropPct: number };
  period: string;
}

export const fetchAlerts = () => get<AlertsResponse>("/api/v1/alerts");

/* ─────────────────── Health, provenance, methodology ─────────────────── */

export interface HealthNode {
  id: string;
  region: string;
  airports: string[];
  detail: string;
  status: string;
  routes: number;
  queries: number;
}

export interface PipelineStatus {
  run: {
    source: string;
    synthetic: boolean;
    warning: string;
    generatedBy: string;
    start: string | null;
    end: string;
    days: number;
    slot: string;
  };
  panel: {
    routes: number;
    horizons: number[];
    strata: number;
    rows: number;
    slots: string[];
    coverageHole: { route: string; periods: string[]; horizons: number[] } | null;
  };
  quotes: { collected?: number; valid?: number; quarantined?: number };
  hashes: { config: string; panel: string; output: string; calendar: string; panelConfig: string };
  methodology: {
    elementary: string;
    aggregation: string;
    weightsVintage: string;
    imputationCeiling: number;
    basePeriod: string;
    revisionPolicy: string;
  };
  quality: {
    minCoverageRatio: number;
    maxImputedWeightShare: number;
    ceilingBreached: boolean;
  };
  compliance: { minSecondsBetweenRequests: number; rules: string[] };
  verify: { command: string; description: string };
  refusalDemo: {
    refusal?: string;
    breached_periods?: string[];
    max_imputed_weight_share?: number;
    output_hash?: string;
  };
  data_source: DataSource;
}

export interface ApiHealth {
  status: string;
  database: string;
  demo_dataset: string;
  data_source: DataSource | null;
  synthetic: boolean;
  period: string | null;
  notice: string | null;
}

export const fetchHealthNodes = () => get<HealthNode[]>("/api/v1/health/nodes");
export const fetchPipelineStatus = () => get<PipelineStatus>("/api/v1/pipeline/status");
export const fetchApiHealth = () => get<ApiHealth>("/api/v1/health");

/* ─────────────────────────── Formatting ─────────────────────────── */

/** Indian-format rupees, no decimals — fares are always whole rupees here. */
export function inr(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

/** First and last 6 characters of a sha256, for provenance chips. */
export function shortHash(hash: string | null | undefined): string {
  if (!hash) return "—";
  return hash.length <= 16 ? hash : `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

/** "2026-09-30" → "30 Sep 2026". Dates from the API are always ISO. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
