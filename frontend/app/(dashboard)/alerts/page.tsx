"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing, Clock, TrendingDown, TrendingUp, Info, Search, X,
} from "lucide-react";
import clsx from "clsx";
import { fetchAlerts, Alert, AlertsResponse, inr, formatDate } from "@/lib/api";
import { ErrorBlock, EmptyBlock, Skeleton } from "@/components/states";
import DataSourceBanner from "@/components/DataSourceBanner";

/**
 * Threshold crossings across the panel.
 *
 * There is no per-user alert store yet, so this page used to show a hard-coded
 * list of seven invented alerts with "2 mins ago" timestamps. It now shows real
 * crossings computed from the panel: a route's threshold is the median of its
 * own daily cheapest fare over the run, and a route sitting below that line
 * today is cheaper than it usually is. Every number traces back to a panel row.
 */

/** Where today's cheapest fare sits inside the route's own range for the run. */
function RangeBar({ a }: { a: Alert }) {
  const span = Math.max(a.high - a.low, 1);
  const pos = ((a.current - a.low) / span) * 100;
  const thresholdPos = ((a.threshold - a.low) / span) * 100;

  return (
    <div className="relative h-1.5 w-full rounded-full bg-aero-badge">
      <div
        className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-aero-muted"
        style={{ left: `${Math.min(Math.max(thresholdPos, 0), 100)}%` }}
        title={`Threshold ${inr(a.threshold)}`}
      />
      <div
        className={clsx(
          "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white",
          a.triggered ? "bg-green-500" : "bg-aero-primary",
        )}
        style={{ left: `${Math.min(Math.max(pos, 0), 100)}%` }}
        title={`Now ${inr(a.current)}`}
      />
    </div>
  );
}

function AlertRow({ a }: { a: Alert }) {
  return (
    <Link
      href={`/routes/${a.origin}/${a.destination}`}
      className={clsx(
        "flex items-center gap-4 px-5 py-4 transition-colors duration-150",
        a.triggered ? "hover:bg-green-50/40" : "hover:bg-aero-bg/50",
      )}
    >
      <div
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          a.triggered ? "bg-green-50" : "bg-aero-bg",
        )}
      >
        {a.triggered
          ? <TrendingDown className="h-4 w-4 text-green-600" />
          : <TrendingUp className="h-4 w-4 text-aero-muted" />}
      </div>

      <div className="min-w-0 flex-[1.2]">
        <div className="text-sm font-semibold text-aero-dark">{a.route}</div>
        <div className="truncate text-[11px] text-aero-muted">
          {a.originCity} → {a.destinationCity} · Min. quote: {a.airline}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 sm:block">
        <RangeBar a={a} />
        <div className="mt-1.5 flex justify-between text-[9px] tabular-nums text-aero-muted">
          <span>{inr(a.low)}</span>
          <span>threshold {inr(a.threshold)}</span>
          <span>{inr(a.high)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className={clsx(
            "text-sm font-bold tabular-nums",
            a.triggered ? "text-green-600" : "text-aero-dark",
          )}
        >
          {inr(a.current)}
        </div>
        <div
          className={clsx(
            "text-[10px] font-semibold tabular-nums",
            a.triggered ? "text-green-600" : "text-aero-muted",
          )}
        >
          {a.deltaPct > 0 ? "+" : ""}{a.deltaPct}% vs threshold
        </div>
      </div>
    </Link>
  );
}

export default function AlertsPage() {
  const [res, setRes] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAlerts().then(({ data, error }) => {
      setRes(data);
      setError(error);
    });
  }, []);

  const filtered = useMemo(() => {
    const list = res?.alerts ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((a) =>
      `${a.origin}${a.destination}${a.originCity}${a.destinationCity}${a.airline}`
        .toLowerCase()
        .includes(q),
    );
  }, [res, search]);

  const triggered = filtered.filter((a) => a.triggered);
  const watching = filtered.filter((a) => !a.triggered);

  return (
    <div className="pb-16 pt-8">
      {/* Header */}
      <div className="animate-fade-up mb-6">
        <DataSourceBanner />
      </div>
      <div className="animate-fade-up mb-6" style={{ animationDelay: "40ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-aero-primary" />
          <span className="aero-label">Anomaly Detection</span>
        </div>
        <h1 className="text-3xl font-bold text-aero-dark sm:text-4xl">Statistical Outliers</h1>
        <p className="mt-1 max-w-2xl text-sm text-aero-mid">
          Identifying routes where the minimum observed quote deviates significantly below the historical stratum median for the run.
        </p>
      </div>

      {error ? (
        <ErrorBlock error={error} />
      ) : !res ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="animate-fade-up mb-6 grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
            {[
              {
                label: "Below Hist. Median",
                value: res.summary.triggered,
                icon: <BellRing className="h-4 w-4" />,
                color: "text-green-600",
                bg: "bg-green-50",
                sub: `deepest ${res.summary.deepestDropPct}%`,
              },
              {
                label: "Watching",
                value: res.summary.watching,
                icon: <Clock className="h-4 w-4" />,
                color: "text-aero-primary",
                bg: "bg-blue-50",
                sub: "at or above threshold",
              },
              {
                label: "Routes monitored",
                value: res.summary.total,
                icon: <Search className="h-4 w-4" />,
                color: "text-aero-mid",
                bg: "bg-aero-badge",
                sub: `as of ${formatDate(res.period)}`,
              },
            ].map((s) => (
              <div key={s.label} className="aero-card flex items-center gap-3 p-4">
                <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", s.bg, s.color)}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums text-aero-dark">{s.value}</div>
                  <div className="text-[11px] font-medium text-aero-muted">{s.label}</div>
                  <div className="truncate text-[10px] text-aero-muted">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="animate-fade-up relative mb-4" style={{ animationDelay: "90ms" }}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-aero-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by route, city or airline…"
              className="aero-input pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear filter"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aero-muted hover:text-aero-dark"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyBlock message={`No route matches “${search}”.`} />
          ) : (
            <>
              {triggered.length > 0 && (
                <div className="animate-fade-up mb-6" style={{ animationDelay: "120ms" }}>
                  <div className="mb-3 flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-green-600" />
                    <h2 className="text-base font-bold text-aero-dark">
                      Below Historical Median — {triggered.length}{" "}
                      {triggered.length === 1 ? "route" : "routes"}
                    </h2>
                  </div>
                  <div className="aero-card overflow-hidden border-green-200">
                    <div className="divide-y divide-aero-border">
                      {triggered.map((a) => <AlertRow key={a.id} a={a} />)}
                    </div>
                  </div>
                </div>
              )}

              {watching.length > 0 && (
                <div className="animate-fade-up mb-6" style={{ animationDelay: "160ms" }}>
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-aero-primary" />
                    <h2 className="text-base font-bold text-aero-dark">
                      Watching — {watching.length} {watching.length === 1 ? "route" : "routes"}
                    </h2>
                  </div>
                  <div className="aero-card overflow-hidden">
                    <div className="divide-y divide-aero-border">
                      {watching.map((a) => <AlertRow key={a.id} a={a} />)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* How this is computed */}
          <div className="aero-card animate-fade-up border-aero-primary/20 bg-gradient-to-r from-aero-primary/5 to-aero-sky/5 p-5" style={{ animationDelay: "200ms" }}>
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-aero-primary" />
              <div>
                <div className="text-sm font-semibold text-aero-dark">How these are computed</div>
                <div className="mt-1 max-w-3xl text-xs leading-relaxed text-aero-muted">
                  These are derived, not subscribed. Each route&apos;s threshold is the{" "}
                  {res.alerts[0]?.basis ?? "median of its daily minimum quote over the run"},
                  rounded to ₹100. A route is listed as a statistical outlier when the minimum quote
                  collected today falls below this baseline. Per-user alerts with Telegram delivery
                  are not built yet — rather than mock an inbox, this page shows the crossings the
                  panel actually contains.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
