"use client";

import { useEffect, useMemo, useState } from "react";
import { Radio, Wifi, MapPinned } from "lucide-react";
import clsx from "clsx";
import {
  fetchRoutes, fetchHealthNodes, inr,
  PanelRoute, AirportRef, HealthNode, RoutesResponse,
} from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";

/**
 * The 60-route panel drawn on India, from the airports' real coordinates.
 *
 * Replaces the map-pin placeholder that used to stand in for this. Route stroke
 * width encodes DGCA panel weight, so the picture answers "which corridors
 * actually move the index" at a glance — DEL–BOM is thick because it carries
 * 6.1% of the weight, not because it looks good.
 *
 * Projection is equirectangular with a standard parallel at India's mid-latitude,
 * which keeps the country's proportions honest at this scale. The outline is a
 * deliberately coarse silhouette — a locator, not a survey boundary.
 */

const W = 400;
const H = 508;
const LAT0 = 21; // standard parallel
const COS_LAT0 = Math.cos((LAT0 * Math.PI) / 180);

/** Coarse mainland-India silhouette as [lon, lat] pairs. */
const INDIA_OUTLINE: [number, number][] = [
  [74.0, 34.5], [76.5, 35.5], [78.5, 34.6], [79.5, 33.0], [79.0, 31.5],
  [81.0, 30.3], [83.0, 29.2], [85.0, 28.2], [88.0, 27.2], [89.5, 26.8],
  [92.0, 27.5], [95.5, 28.2], [97.0, 27.4], [96.5, 26.0], [95.0, 24.5],
  [93.5, 22.5], [92.5, 21.5], [91.0, 22.5], [89.0, 21.8], [87.0, 21.5],
  [85.0, 19.8], [82.0, 17.0], [80.3, 15.8], [80.2, 13.1], [79.8, 10.3],
  [79.0, 9.0], [78.2, 8.4], [77.5, 8.1], [76.5, 9.5], [75.0, 12.0],
  [74.0, 14.5], [73.0, 17.0], [72.8, 19.1], [72.6, 21.0], [72.0, 21.5],
  [70.0, 20.8], [69.0, 22.2], [70.0, 23.0], [68.5, 23.8], [70.5, 25.5],
  [72.5, 27.5], [73.0, 29.5], [74.5, 31.0], [74.0, 32.5],
];

type Bounds = RoutesResponse["bounds"];

function makeProjection(b: Bounds) {
  const xMin = b.lon_min * COS_LAT0;
  const xMax = b.lon_max * COS_LAT0;
  return (lat: number, lon: number): [number, number] => [
    ((lon * COS_LAT0 - xMin) / (xMax - xMin)) * W,
    ((b.lat_max - lat) / (b.lat_max - b.lat_min)) * H,
  ];
}

/** A shallow arc, bowed perpendicular to the great-circle chord. */
function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(len * 0.16, 40);
  // Perpendicular offset, consistently to one side so opposite directions
  // separate into two visible arcs instead of overprinting.
  return `M ${x1} ${y1} Q ${mx - (dy / len) * bow} ${my + (dx / len) * bow} ${x2} ${y2}`;
}

export default function RouteMapSection() {
  const [routesData, setRoutesData] = useState<RoutesResponse | null>(null);
  const [nodes, setNodes] = useState<HealthNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<PanelRoute | null>(null);

  useEffect(() => {
    fetchRoutes().then(({ data, error }) => {
      setRoutesData(data);
      if (error) setError(error);
    });
    fetchHealthNodes().then(({ data, error }) => {
      if (data) setNodes(data);
      else if (error) setError(error);
    });
  }, []);

  const project = useMemo(
    () => (routesData ? makeProjection(routesData.bounds) : null),
    [routesData],
  );

  const outlinePath = useMemo(() => {
    if (!project) return "";
    return (
      INDIA_OUTLINE.map(([lon, lat], i) => {
        const [x, y] = project(lat, lon);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(" ") + " Z"
    );
  }, [project]);

  // Airports sized by how much panel weight passes through them.
  const airportLoad = useMemo(() => {
    const load = new Map<string, { airport: AirportRef; weight: number; routes: number }>();
    for (const r of routesData?.routes ?? []) {
      for (const a of [r.origin, r.destination]) {
        const cur = load.get(a.iata) ?? { airport: a, weight: 0, routes: 0 };
        cur.weight += r.weight;
        cur.routes += 1;
        load.set(a.iata, cur);
      }
    }
    return load;
  }, [routesData]);

  const maxRouteWeight = useMemo(
    () => Math.max(...(routesData?.routes.map((r) => r.weight) ?? [1]), 0.0001),
    [routesData],
  );
  const maxAirportWeight = useMemo(
    () => Math.max(...Array.from(airportLoad.values(), (a) => a.weight), 0.0001),
    [airportLoad],
  );

  const totalQuotes = nodes.reduce((sum, n) => sum + n.queries, 0);

  return (
    <section className="mt-12 mb-2">
      <div className="mb-1 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-aero-primary" />
        <span className="aero-label">Panel Coverage</span>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-aero-dark sm:text-3xl">The 60-route panel</h2>
      <p className="mb-8 max-w-2xl text-sm text-aero-mid">
        Six origin hubs reaching 23 airports. Line thickness is the route&apos;s DGCA traffic
        weight — the share of 2025 domestic passengers on that city pair, normalised over the
        panel. Thick lines move the index; thin ones barely nudge it.
      </p>

      {error && !routesData ? (
        <ErrorBlock error={error} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* ── Map ── */}
          <div className="aero-card relative overflow-hidden p-4 lg:col-span-3">
            {!routesData || !project ? (
              <Skeleton className="h-[420px] w-full" />
            ) : (
              <>
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="h-auto max-h-[520px] w-full"
                  role="img"
                  aria-label="Map of India showing the 60 indexed airline routes"
                >
                  <defs>
                    <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#2456E8" />
                      <stop offset="100%" stopColor="#38B6FF" />
                    </linearGradient>
                    <pattern id="mapDots" width="16" height="16" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="1" fill="#2456E8" opacity="0.13" />
                    </pattern>
                  </defs>

                  <rect width={W} height={H} fill="url(#mapDots)" />

                  <path
                    d={outlinePath}
                    fill="#EBF1FF"
                    stroke="#C5D0EE"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />

                  {/* Routes */}
                  <g fill="none" strokeLinecap="round">
                    {routesData.routes.map((r) => {
                      if (
                        r.origin.lat == null || r.origin.lon == null ||
                        r.destination.lat == null || r.destination.lon == null
                      ) return null;
                      const [x1, y1] = project(r.origin.lat, r.origin.lon);
                      const [x2, y2] = project(r.destination.lat, r.destination.lon);
                      const t = r.weight / maxRouteWeight;
                      const active = hovered?.id === r.id;
                      return (
                        <path
                          key={r.id}
                          d={arcPath(x1, y1, x2, y2)}
                          stroke={active ? "#F04438" : "url(#routeGrad)"}
                          strokeWidth={active ? 3 : 0.5 + t * 3.2}
                          opacity={hovered && !active ? 0.15 : 0.28 + t * 0.6}
                          onMouseEnter={() => setHovered(r)}
                          onMouseLeave={() => setHovered(null)}
                          className="cursor-pointer transition-[stroke-width,opacity] duration-150"
                        />
                      );
                    })}
                  </g>

                  {/* Airports */}
                  <g>
                    {Array.from(airportLoad.values()).map(({ airport, weight }) => {
                      if (airport.lat == null || airport.lon == null) return null;
                      const [x, y] = project(airport.lat, airport.lon);
                      const t = weight / maxAirportWeight;
                      const rr = 2.2 + t * 5;
                      const isHub = t > 0.28;
                      const touched =
                        hovered?.origin.iata === airport.iata ||
                        hovered?.destination.iata === airport.iata;
                      return (
                        <g key={airport.iata}>
                          {isHub && (
                            <circle cx={x} cy={y} r={rr + 4} fill="#2456E8" opacity="0.12" />
                          )}
                          <circle
                            cx={x}
                            cy={y}
                            r={rr}
                            fill={touched ? "#F04438" : "#2456E8"}
                            stroke="#fff"
                            strokeWidth="1.2"
                          />
                          {(isHub || touched) && (
                            <text
                              x={x + rr + 3}
                              y={y + 3}
                              fontSize="9"
                              fontWeight="700"
                              fill={touched ? "#F04438" : "#0D1B3E"}
                              className="pointer-events-none select-none"
                            >
                              {airport.iata}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Hover readout */}
                <div className="pointer-events-none absolute bottom-4 left-4 right-4">
                  <div
                    className={clsx(
                      "rounded-xl border border-aero-border bg-white/95 px-3 py-2 shadow-aero-md backdrop-blur-sm transition-opacity duration-150",
                      hovered ? "opacity-100" : "opacity-0",
                    )}
                  >
                    {hovered && (
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <div>
                          <span className="text-sm font-bold text-aero-dark">
                            {hovered.origin.iata} → {hovered.destination.iata}
                          </span>
                          <span className="ml-2 text-[11px] text-aero-muted">
                            {hovered.origin.city} → {hovered.destination.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] tabular-nums">
                          <span className="text-aero-mid">
                            weight{" "}
                            <strong className="text-aero-primary">
                              {(hovered.weight * 100).toFixed(3)}%
                            </strong>
                          </span>
                          {hovered.medianFare != null && (
                            <span className="text-aero-mid">
                              median <strong className="text-aero-dark">{inr(hovered.medianFare)}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute right-4 top-4 rounded-xl border border-aero-border bg-white/95 px-3 py-2 shadow-aero-sm backdrop-blur-sm">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-aero-muted">
                    Routes
                  </div>
                  <div className="text-xl font-bold tabular-nums text-aero-primary">
                    {routesData.count}
                  </div>
                  <div className="mt-1 text-[9px] text-aero-muted">
                    {airportLoad.size} airports
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Regional coverage ── */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-aero-mid">Coverage by region</div>
              {totalQuotes > 0 && (
                <div className="text-[11px] text-aero-muted">
                  <strong className="tabular-nums text-aero-dark">
                    {totalQuotes.toLocaleString("en-IN")}
                  </strong>{" "}
                  quotes · latest period
                </div>
              )}
            </div>

            {nodes.length === 0 ? (
              <>
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </>
            ) : (
              nodes.map((node) => {
                const share = totalQuotes ? node.queries / totalQuotes : 0;
                return (
                  <div key={node.id} className="aero-card p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-aero-badge">
                          <MapPinned className="h-4 w-4 text-aero-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-aero-dark">{node.region}</div>
                          <div className="text-[11px] text-aero-muted">
                            {node.routes} routes · {node.airports.length} airports
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums text-aero-dark">
                          {node.queries.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-aero-muted">quotes</div>
                      </div>
                    </div>
                    <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-aero-badge">
                      <div
                        className="h-full rounded-full bg-aero-gradient transition-all duration-700"
                        style={{ width: `${Math.max(share * 100, 2)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {node.airports.map((a) => (
                        <span
                          key={a}
                          className="rounded bg-aero-bg px-1.5 py-0.5 font-mono text-[9px] font-semibold text-aero-mid"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            <div className="aero-card border-aero-primary/20 bg-gradient-to-r from-aero-primary/5 to-aero-sky/5 p-4">
              <div className="flex items-start gap-3">
                <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-aero-primary" />
                <div>
                  <div className="text-xs font-semibold text-aero-dark">
                    Scheduler → Adapter → Normalise → Validate → Index → Publish
                  </div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-aero-muted">
                    Three fixed IST slots per day. Minimum 20s between requests to a host,
                    robots.txt honoured at run time, no CAPTCHA solving and no proxies.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-aero-border bg-white px-4 py-2.5">
              <Radio className="h-3.5 w-3.5 text-aero-muted" />
              <span className="text-[11px] text-aero-muted">
                Hover a route on the map for its weight and median fare.
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
