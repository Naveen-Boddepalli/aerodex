"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, CalendarClock, Plane, TrendingDown, TrendingUp, Minus,
} from "lucide-react";
import clsx from "clsx";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { fetchRouteDetail, RouteDetail, inr, formatDate } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";

/**
 * One route in depth: how its fare moved over the run, how it prices by
 * booking horizon, and which carriers were quoting it.
 *
 * The horizon chart is the interesting one — it is the shape a fare index has
 * to control for. A route looks cheap or expensive depending almost entirely
 * on how far ahead you look, which is exactly why the panel fixes seven
 * horizons and indexes each as its own stratum.
 */

const SeriesTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="aero-card min-w-[150px] p-3 shadow-aero-md">
      <p className="mb-2 text-[11px] font-semibold text-aero-muted">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="mb-1 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[11px] capitalize text-aero-mid">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="text-xs font-bold tabular-nums text-aero-dark">{inr(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function RouteDetailPage({
  params,
}: {
  params: Promise<{ origin: string; destination: string }>;
}) {
  const { origin, destination } = use(params);
  const [detail, setDetail] = useState<RouteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRouteDetail(origin.toUpperCase(), destination.toUpperCase()).then(({ data, error }) => {
      setDetail(data);
      setError(error);
    });
  }, [origin, destination]);

  const first = detail?.series[0];
  const last = detail?.series[detail.series.length - 1];
  const changePct =
    first && last && first.median ? ((last.median - first.median) / first.median) * 100 : null;

  const direction = changePct == null ? "stable" : changePct < -0.5 ? "drop" : changePct > 0.5 ? "rise" : "stable";

  return (
    <div className="pb-16 pt-8">
      <Link
        href="/price-tracking"
        className="animate-fade-up mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-aero-primary transition-colors hover:text-aero-primary2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All routes
      </Link>

      {error ? (
        <ErrorBlock error={error} />
      ) : !detail ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div className="animate-fade-up mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-aero-primary" />
                <span className="aero-label">Route detail</span>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-3xl font-bold leading-none text-aero-dark sm:text-4xl">
                    {detail.origin}
                  </div>
                  <div className="mt-1 text-xs text-aero-muted">{detail.originCity}</div>
                </div>
                <Plane className="mt-1 h-5 w-5 rotate-45 text-aero-primary" />
                <div>
                  <div className="text-3xl font-bold leading-none text-aero-dark sm:text-4xl">
                    {detail.destination}
                  </div>
                  <div className="mt-1 text-xs text-aero-muted">{detail.destinationCity}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="aero-card px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-aero-muted">
                  Panel weight
                </div>
                <div className="text-lg font-bold tabular-nums text-aero-primary">
                  {(detail.weight * 100).toFixed(3)}%
                </div>
              </div>
              <div className="aero-card px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-aero-muted">
                  Median now
                </div>
                <div className="text-lg font-bold tabular-nums text-aero-dark">
                  {inr(last?.median)}
                </div>
              </div>
              <div className="aero-card px-4 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-aero-muted">
                  Over the run
                </div>
                <div
                  className={clsx(
                    "flex items-center gap-1 text-lg font-bold tabular-nums",
                    direction === "drop" ? "text-green-600"
                      : direction === "rise" ? "text-red-500" : "text-aero-stable",
                  )}
                >
                  {direction === "drop" ? <TrendingDown className="h-4 w-4" />
                    : direction === "rise" ? <TrendingUp className="h-4 w-4" />
                    : <Minus className="h-4 w-4" />}
                  {changePct != null ? `${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Fare over time ── */}
          <div className="aero-card animate-fade-up mb-6 p-5" style={{ animationDelay: "60ms" }}>
            <div className="mb-4">
              <h2 className="text-base font-bold text-aero-dark">Fare over the collection run</h2>
              <p className="mt-0.5 text-[11px] text-aero-muted">
                Median across all seven booking horizons, and the cheapest quote collected each day.
              </p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detail.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rd-median" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2456E8" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2456E8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rd-best" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#12B76A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#12B76A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE4F5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A99BB" }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#8A99BB" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                    width={50}
                    domain={["dataMin - 500", "dataMax + 500"]}
                  />
                  <Tooltip content={<SeriesTooltip />} />
                  <Area type="monotone" dataKey="median" name="median" stroke="#2456E8" strokeWidth={2} fill="url(#rd-median)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                  <Area type="monotone" dataKey="best" name="cheapest" stroke="#12B76A" strokeWidth={2} strokeDasharray="4 3" fill="url(#rd-best)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ── By horizon ── */}
            <div className="aero-card animate-fade-up p-5" style={{ animationDelay: "120ms" }}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-aero-dark">
                  <CalendarClock className="h-4 w-4 text-aero-primary" />
                  Price by booking horizon
                </h2>
                <p className="mt-0.5 text-[11px] text-aero-muted">
                  Cheapest quote at each of the seven horizons, collected {detail.period}.
                </p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detail.byHorizon} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4F5" vertical={false} />
                    <XAxis
                      dataKey="horizon_days"
                      tick={{ fontSize: 11, fill: "#8A99BB" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}d`}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8A99BB" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      width={42}
                    />
                    <Tooltip
                      cursor={{ fill: "#EBF1FF" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as RouteDetail["byHorizon"][number];
                        return (
                          <div className="aero-card p-3 shadow-aero-md">
                            <p className="text-[11px] font-semibold text-aero-muted">
                              {p.horizon_days} days out · departs {formatDate(p.departure_date)}
                            </p>
                            <p className="mt-1 text-sm font-bold text-aero-dark">
                              {inr(p.best_fare)} <span className="text-[10px] font-medium text-aero-muted">cheapest</span>
                            </p>
                            <p className="text-[11px] text-aero-mid">
                              {inr(p.median_fare)} median · {p.n_quotes} quotes
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="best_fare" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      {detail.byHorizon.map((h) => (
                        <Cell
                          key={h.horizon_days}
                          fill={
                            h.best_fare === Math.min(...detail.byHorizon.map((x) => x.best_fare))
                              ? "#12B76A"
                              : "#2456E8"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── By carrier ── */}
            <div className="aero-card animate-fade-up p-5" style={{ animationDelay: "180ms" }}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-aero-dark">
                  <Plane className="h-4 w-4 rotate-45 text-aero-primary" />
                  Carriers quoting this route
                </h2>
                <p className="mt-0.5 text-[11px] text-aero-muted">
                  Cheapest first, {detail.period}.
                </p>
              </div>
              <div className="divide-y divide-aero-border">
                {detail.byCarrier.map((c) => (
                  <div key={c.carrier} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-aero-badge font-mono text-[11px] font-bold text-aero-primary">
                      {c.carrier}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-aero-dark">{c.airline}</div>
                      <div className="text-[11px] text-aero-muted">
                        {c.n_quotes} quotes · {(c.share * 100).toFixed(0)}% of the stratum
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums text-aero-dark">
                        {inr(c.best_fare)}
                      </div>
                      <div className="text-[10px] text-aero-muted">
                        {inr(c.median_fare)} median
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {detail.notice && (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-800">
              {detail.notice}
            </p>
          )}
        </>
      )}
    </div>
  );
}
