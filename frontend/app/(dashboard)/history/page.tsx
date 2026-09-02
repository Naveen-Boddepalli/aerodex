"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Calendar, Download, TrendingDown, TrendingUp, BarChart2, Activity } from "lucide-react";
import clsx from "clsx";

import { fetchHistory, HistoryResponse, inr, pct, formatDate } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";
import DataSourceBanner from "@/components/DataSourceBanner";

/**
 * The index over time, and the fares underneath it.
 *
 * Two views, because they answer different questions. "Index" is the published
 * series — one weighted number per period, base 100 — and it is the thing MoSPI
 * would consume. "Route fares" is the rupee series per corridor that the index
 * aggregates, and it is the thing a traveller recognises.
 *
 * Route selection is seeded from whatever the API actually returns. The old
 * version seeded it with two hard-coded keys, so any change to the panel's
 * heaviest routes silently produced an empty chart.
 */

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const;

type View = "index" | "fares";

const FareTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="aero-card min-w-[180px] p-3 shadow-aero-md">
      <p className="mb-2 text-[11px] font-semibold text-aero-muted">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="mb-1 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-aero-mid">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="text-xs font-bold tabular-nums text-aero-dark">{inr(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function HistoryPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[2]);
  const [view, setView] = useState<View>("index");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which range the loaded `history` covers. Deriving "loading" from this beats
  // a flag that has to be flipped on either side of the fetch.
  const [loadedDays, setLoadedDays] = useState<number | null>(null);
  const loading = loadedDays !== range.days;

  useEffect(() => {
    let cancelled = false;
    fetchHistory(range.days).then(({ data, error }) => {
      if (cancelled) return;
      setHistory(data);
      setError(error);
      setLoadedDays(range.days);
      // Seed the selection from the routes the API actually returned, and drop
      // any previously-selected key that is no longer in the response.
      if (data?.routes.length) {
        setSelected((prev) => {
          const valid = new Set(data.routes.map((r) => r.key));
          const kept = new Set([...prev].filter((k) => valid.has(k)));
          return kept.size ? kept : new Set(data.routes.slice(0, 3).map((r) => r.key));
        });
      }
    });
    return () => { cancelled = true; };
  }, [range]);

  const data = useMemo(() => history?.data ?? [], [history]);
  const routesList = useMemo(() => history?.routes ?? [], [history]);
  const headline = useMemo(() => history?.headline ?? [], [history]);

  function toggle(key: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const changes = useMemo(
    () =>
      routesList
        .filter((r) => selected.has(r.key))
        .map((r) => {
          const first = data[0]?.[r.key] as number | undefined;
          const last = data[data.length - 1]?.[r.key] as number | undefined;
          const pctChange = first && last ? ((last - first) / first) * 100 : 0;
          return { ...r, first: first ?? 0, last: last ?? 0, pct: Number(pctChange.toFixed(1)) };
        }),
    [routesList, selected, data],
  );

  const indexChange = useMemo(() => {
    if (headline.length < 2) return null;
    const first = headline[0].value;
    const last = headline[headline.length - 1].value;
    return { first, last, pct: ((last - first) / first) * 100 };
  }, [headline]);

  const exportCsv = useCallback(() => {
    if (!history) return;
    const keys = routesList.filter((r) => selected.has(r.key)).map((r) => r.key);
    const header = ["period", "index_value", "coverage_ratio", "imputed_weight_share", ...keys];
    const byPeriod = new Map(headline.map((h) => [h.period, h]));
    const rows = data.map((point) => {
      const h = byPeriod.get(point.period);
      return [
        point.period,
        h?.value ?? "",
        h?.coverage_ratio ?? "",
        h?.imputed_weight_share ?? "",
        ...keys.map((k) => point[k] ?? ""),
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `aerodex-history-${range.days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [history, routesList, selected, headline, data, range.days]);

  return (
    <div className="pb-16 pt-8">
      {/* ── Header ── */}
      <div className="animate-fade-up mb-6">
        <DataSourceBanner />
      </div>
      <div className="animate-fade-up mb-6" style={{ animationDelay: "40ms" }}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="gov-badge">Statistical Release · MoSPI · SIH26056</span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-aero-dark sm:text-4xl">DAPI Index Time Series</h1>
            <p className="mt-1 max-w-2xl text-sm text-aero-mid">
              Published index series (base {/* will be filled by API context */}2026-09 = 100) and
              the corridor stratum medians it aggregates, over the selected reference window.
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={!history}
            className="aero-btn-primary self-start disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <ErrorBlock error={error} />
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="animate-fade-up mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "60ms" }}>
            {loading && !history ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : view === "index" ? (
              <>
                <div className="aero-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-aero-primary" />
                    <span className="text-[11px] font-medium text-aero-muted">Index now</span>
                  </div>
                  <div className="text-xl font-bold tabular-nums text-aero-dark">
                    {indexChange?.last.toFixed(2) ?? "—"}
                  </div>
                  {indexChange && (
                    <div
                      className={clsx(
                        "mt-1 flex items-center gap-1 text-xs font-semibold",
                        indexChange.pct < 0 ? "text-green-600" : "text-red-500",
                      )}
                    >
                      {indexChange.pct < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      {indexChange.pct > 0 ? "+" : ""}{indexChange.pct.toFixed(2)}% over {range.label}
                    </div>
                  )}
                </div>
                <div className="aero-card p-4">
                  <div className="mb-2 text-[11px] font-medium text-aero-muted">Period start</div>
                  <div className="text-xl font-bold tabular-nums text-aero-dark">
                    {indexChange?.first.toFixed(2) ?? "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-aero-muted">
                    {formatDate(headline[0]?.period)}
                  </div>
                </div>
                <div className="aero-card p-4">
                  <div className="mb-2 text-[11px] font-medium text-aero-muted">Min coverage</div>
                  <div className="text-xl font-bold tabular-nums text-aero-dark">
                    {headline.length ? pct(Math.min(...headline.map((h) => h.coverage_ratio)), 2) : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-aero-muted">over the window</div>
                </div>
                <div className="aero-card p-4">
                  <div className="mb-2 text-[11px] font-medium text-aero-muted">Max imputed</div>
                  <div className="text-xl font-bold tabular-nums text-aero-dark">
                    {headline.length ? pct(Math.max(...headline.map((h) => h.imputed_weight_share)), 2) : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-aero-muted">M5 ceiling 5%</div>
                </div>
              </>
            ) : (
              changes.slice(0, 4).map((c) => (
                <div key={c.key} className="aero-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[11px] font-medium text-aero-muted">{c.label}</span>
                  </div>
                  <div className="text-xl font-bold tabular-nums text-aero-dark">{inr(c.last)}</div>
                  <div
                    className={clsx(
                      "mt-1 flex items-center gap-1 text-xs font-semibold",
                      c.pct < 0 ? "text-green-600" : c.pct > 0 ? "text-red-500" : "text-aero-muted",
                    )}
                  >
                    {c.pct < 0 ? <TrendingDown className="h-3 w-3" /> : c.pct > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                    {c.pct > 0 ? "+" : ""}{c.pct}% over {range.label}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Chart ── */}
          <div className="aero-card animate-fade-up mb-6 p-5" style={{ animationDelay: "100ms" }}>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-aero-dark">
                  <BarChart2 className="h-4 w-4 text-aero-primary" />
                  {view === "index" ? "AeroDex index" : "Median fare by corridor"}
                </h2>
                <p className="mt-0.5 text-[11px] text-aero-muted">
                  {view === "index"
                    ? "Lowe aggregate over Jevons elementary indices · base 2026-09 = 100"
                    : "Median all-inclusive economy fare across seven booking horizons · INR"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center gap-1 rounded-xl border border-aero-border bg-aero-bg p-1">
                  {(["index", "fares"] as View[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150",
                        view === v ? "bg-aero-primary text-white shadow-aero-sm" : "text-aero-mid hover:text-aero-dark",
                      )}
                    >
                      {v === "fares" ? "Route fares" : "Index"}
                    </button>
                  ))}
                </div>

                {/* Range picker */}
                <div className="flex items-center gap-1 rounded-xl border border-aero-border bg-aero-bg p-1">
                  {RANGES.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setRange(r)}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                        range.label === r.label ? "bg-aero-primary text-white shadow-aero-sm" : "text-aero-mid hover:text-aero-dark",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Route toggles — fares view only */}
            {view === "fares" && (
              <div className="mb-4 flex flex-wrap gap-2">
                {routesList.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => toggle(r.key)}
                    title={`${r.cities} · panel weight ${(r.weight * 100).toFixed(3)}%`}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      selected.has(r.key)
                        ? "border-transparent text-white shadow-aero-sm"
                        : "border-aero-border text-aero-mid hover:border-aero-primary",
                    )}
                    style={selected.has(r.key) ? { backgroundColor: r.color, borderColor: r.color } : {}}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selected.has(r.key) ? "#fff" : r.color }}
                    />
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative h-80">
              {loading && !history ? (
                <Skeleton className="h-full w-full" />
              ) : view === "index" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={headline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4F5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A99BB" }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8A99BB" }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tickFormatter={(v) => Number(v).toFixed(0)}
                    />
                    <ReferenceLine
                      y={100}
                      stroke="#8A99BB"
                      strokeDasharray="4 4"
                      label={{ value: "Base 100", position: "insideTopLeft", fontSize: 10, fill: "#8A99BB" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as (typeof headline)[number];
                        const isProvisional = p.is_base === false;
                        return (
                          <div className="aero-card p-3 shadow-aero-md">
                            <div className="mb-1 flex items-center gap-2">
                              <p className="text-[11px] font-semibold text-aero-muted">
                                {formatDate(p.period)}
                              </p>
                              {isProvisional
                                ? <span className="status-provisional">Provisional</span>
                                : <span className="status-final">Final</span>
                              }
                            </div>
                            <p className="mt-1 text-lg font-bold tabular-nums text-aero-dark">
                              {p.value.toFixed(2)}
                            </p>
                            <p className="text-[11px] text-aero-mid">
                              {p.n_quotes.toLocaleString("en-IN")} obs. ·{" "}
                              {pct(p.coverage_ratio, 1)} coverage
                            </p>
                            {p.imputed_weight_share > 0 && (
                              <p className={`text-[11px] font-semibold ${p.imputed_weight_share > 0.05 ? 'text-red-600' : 'text-amber-700'}`}>
                                {pct(p.imputed_weight_share, 2)} imputed
                                {p.imputed_weight_share > 0.05 && " — M5 ceiling breached"}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="AeroDex index"
                      stroke="#2456E8"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      {routesList.map((r) => (
                        <linearGradient key={r.key} id={`hg-${r.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={r.color} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={r.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4F5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A99BB" }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8A99BB" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                      width={52}
                      domain={["dataMin - 300", "dataMax + 300"]}
                    />
                    <Tooltip content={<FareTooltip />} />
                    {routesList
                      .filter((r) => selected.has(r.key))
                      .map((r) => (
                        <Area
                          key={r.key}
                          type="monotone"
                          dataKey={r.key}
                          name={r.label}
                          stroke={r.color}
                          strokeWidth={2}
                          fill={`url(#hg-${r.key})`}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false}
                        />
                      ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Methodology note ── */}
          <div className="aero-card animate-fade-up border-aero-primary/20 bg-gradient-to-r from-aero-primary/5 to-aero-sky/5 p-5" style={{ animationDelay: "180ms" }}>
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-aero-primary" />
              <div>
                <div className="text-sm font-semibold text-aero-dark">About this series</div>
                <div className="mt-1 max-w-3xl text-xs leading-relaxed text-aero-muted">
                  Each route × horizon × time-of-day is a stratum with its own{" "}
                  <strong>Jevons elementary index</strong> — the geometric mean of fare relatives —
                  and the strata are combined with a <strong>Lowe</strong> aggregate using DGCA
                  traffic weights. Collected at three fixed IST slots daily. Every published value
                  is reproducible from the archived panel via{" "}
                  <code className="rounded bg-aero-badge px-1 py-0.5 text-[10px] text-aero-primary">
                    aerodex verify
                  </code>
                  .
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
