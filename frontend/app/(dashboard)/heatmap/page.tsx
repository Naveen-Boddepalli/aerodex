"use client";

/**
 * /heatmap — two cuts of the same question, on one page.
 *
 * "By sector" is an origin x destination matrix of the latest period-on-period
 * move: where in the network is inflation happening right now. That is the
 * "sector-wise heatmap" the problem statement asks for.
 *
 * "Over time" is a route x date matrix of day-over-day moves: how each corridor
 * got to where it is. It reads /index/history, which returns the eight
 * heaviest-weighted routes, so it is deliberately narrower than the sector view
 * and deeper in time.
 *
 * Neither replaces the other — one is spatial, one is temporal — and both are
 * exportable, because an NSO or RBI analyst will want the matrix, not a picture
 * of it.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Download } from "lucide-react";
import {
  fetchTrackers, fetchHistory, Tracker, HistoryResponse, inr,
} from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";
import DataSourceBanner from "@/components/DataSourceBanner";

type View = "sector" | "time";

function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────── Origin x destination ─────────────────────── */

function SectorMatrix() {
  const [trackers, setTrackers] = useState<Tracker[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackers(100).then(({ data, error }) => {
      setTrackers(data);
      setError(error);
    });
  }, []);

  const { origins, destinations, matrix } = useMemo(() => {
    if (!trackers) return { origins: [], destinations: [], matrix: {} };
    const orgs = Array.from(new Set(trackers.map(t => t.from))).sort();
    const dests = Array.from(new Set(trackers.map(t => t.to))).sort();
    const mat: Record<string, Tracker> = {};
    trackers.forEach(t => {
      mat[`${t.from}-${t.to}`] = t;
    });
    return { origins: orgs, destinations: dests, matrix: mat };
  }, [trackers]);

  const exportCsv = useCallback(() => {
    if (!origins.length || !destinations.length) return;
    const header = ["Origin", ...destinations];
    const rows = origins.map((o) => {
      const row = [o];
      destinations.forEach((d) => {
        const t = matrix[`${o}-${d}`];
        if (t) {
          const pct = t.change === "drop" ? -t.changePct : t.changePct;
          row.push(`${pct.toFixed(2)}%`);
        } else {
          row.push("");
        }
      });
      return row.join(",");
    });
    downloadCsv([header.join(","), ...rows].join("\n"), "aerodex-heatmap-sector.csv");
  }, [origins, destinations, matrix]);

  if (error) return <ErrorBlock error={error} />;
  if (!trackers) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-3xl text-sm text-aero-mid">
          Period-on-period inflation rate by sector. Green indicates fare drops; red indicates
          fare hikes. Missing cells mean the route is not in the panel.
        </p>
        <button
          onClick={exportCsv}
          disabled={!origins.length}
          className="aero-btn-primary shrink-0 self-start disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <Download className="h-4 w-4" /> Export Matrix
        </button>
      </div>

      <div className="aero-card animate-fade-up overflow-auto" style={{ animationDelay: "80ms" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left font-semibold text-aero-muted border-b border-r border-aero-border bg-aero-bg/60 sticky top-0 left-0 z-20">
                O \ D
              </th>
              {destinations.map(d => (
                <th key={d} className="p-3 text-center font-bold text-aero-dark border-b border-aero-border bg-aero-bg/60 sticky top-0 z-10 min-w-[80px]">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {origins.map(o => (
              <tr key={o}>
                <th className="p-3 text-left font-bold text-aero-dark border-r border-b border-aero-border bg-aero-bg/60 sticky left-0 z-10">
                  {o}
                </th>
                {destinations.map(d => {
                  const t = matrix[`${o}-${d}`];
                  if (!t) return <td key={d} className="p-3 border-b border-aero-border bg-aero-bg/20 text-center text-aero-muted/30">—</td>;

                  const pct = t.change === "drop" ? -t.changePct : t.changePct;
                  let bgClass = "bg-yellow-100 hover:bg-yellow-200";
                  let textClass = "text-aero-dark";
                  if (pct <= -10) bgClass = "bg-green-600 hover:bg-green-700";
                  else if (pct <= -5) bgClass = "bg-green-500 hover:bg-green-600";
                  else if (pct <= -1) bgClass = "bg-green-300 hover:bg-green-400";
                  else if (pct < 0) bgClass = "bg-green-100 hover:bg-green-200";
                  else if (pct >= 10) bgClass = "bg-red-600 hover:bg-red-700";
                  else if (pct >= 5) bgClass = "bg-red-500 hover:bg-red-600";
                  else if (pct >= 1) bgClass = "bg-red-300 hover:bg-red-400";
                  else if (pct > 0) bgClass = "bg-red-100 hover:bg-red-200";

                  if (pct <= -5 || pct >= 5) textClass = "text-white";

                  return (
                    <td key={d} className="border-b border-aero-border p-1 text-center">
                      <Link href={`/routes/${o}/${d}`}>
                        <div className={clsx("flex flex-col items-center justify-center rounded-lg p-2 h-14 transition-colors", bgClass, textClass)}>
                          <span className="font-bold text-xs">{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>
                          <span className="text-[10px] opacity-90">{inr(t.price)}</span>
                        </div>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─────────────────────────── Route x date ─────────────────────────── */

function cellColor(pct: number) {
  if (pct === 0) return "#FEF08A";  // pale yellow — no move
  if (pct > 0) return "#FECACA";    // light red — fare rose
  return "#BBF7D0";                 // light green — fare fell
}

function TimeMatrix() {
  const [res, setRes] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchHistory(days).then(({ data, error }) => {
      setRes(data);
      setError(error);
    });
  }, [days]);

  const { rows, cols, csvData } = useMemo(() => {
    if (!res) return { rows: [], cols: [], csvData: "" };

    const sorted = [...res.data].sort(
      (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime(),
    );
    // Day-over-day change, so the first period has no column of its own.
    const cols = sorted.slice(1).map(d => d.date);
    const routes = [...res.routes].sort((a, b) => b.weight - a.weight);

    const rows = routes.map(route => {
      const changes: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1][route.key] as number;
        const curr = sorted[i][route.key] as number;
        changes.push(prev && curr ? ((curr - prev) / prev) * 100 : 0);
      }
      return { route, changes };
    });

    const header = ["Route", "DGCA weight", ...cols];
    const body = rows.map(r => [
      `"${r.route.label}"`,
      (r.route.weight * 100).toFixed(3) + "%",
      ...r.changes.map(c => c.toFixed(2) + "%"),
    ]);
    const csvData = [header.join(","), ...body.map(r => r.join(","))].join("\n");

    return { rows, cols, csvData };
  }, [res]);

  if (error) return <ErrorBlock error={error} />;
  if (!res) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-3xl text-sm text-aero-mid">
          Day-over-day change per corridor, heaviest DGCA weight first. Covers the{" "}
          {rows.length} routes the index history series carries, over the selected window.
        </p>
        <button
          onClick={() => downloadCsv(csvData, `aerodex-heatmap-${days}d.csv`)}
          disabled={!csvData}
          className="aero-btn-primary shrink-0 self-start disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <Download className="h-4 w-4" /> Export Matrix
        </button>
      </div>

      <div className="aero-card animate-fade-up overflow-hidden p-4" style={{ animationDelay: "80ms" }}>
        <div className="mb-4 flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                days === d
                  ? "bg-aero-primary text-white"
                  : "bg-aero-badge text-aero-primary hover:bg-blue-100",
              )}
            >
              {d}D
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-[11px]">
            <thead>
              <tr className="border-b border-aero-border text-aero-muted">
                <th className="p-2 font-semibold">Route</th>
                <th className="p-2 text-right font-semibold">Weight</th>
                {cols.map(c => (
                  <th key={c} className="p-2 text-center font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aero-border/50">
              {rows.map(r => (
                <tr key={r.route.key} className="hover:bg-aero-bg/50">
                  <td className="p-2 font-medium text-aero-dark">{r.route.label}</td>
                  <td className="p-2 text-right tabular-nums text-aero-muted">
                    {(r.route.weight * 100).toFixed(2)}%
                  </td>
                  {r.changes.map((pct, i) => (
                    <td key={i} className="p-1">
                      <div
                        title={`${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`}
                        className="flex h-6 w-full items-center justify-center rounded text-[10px] font-semibold tabular-nums text-aero-dark shadow-sm"
                        style={{ backgroundColor: cellColor(pct) }}
                      >
                        {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────── Page ─────────────────────────────── */

const VIEWS: { id: View; label: string; blurb: string }[] = [
  { id: "sector", label: "By sector", blurb: "Origin-Destination Inflation" },
  { id: "time", label: "Over time", blurb: "Day-over-Day by Corridor" },
];

export default function HeatmapPage() {
  const [view, setView] = useState<View>("sector");
  const active = VIEWS.find(v => v.id === view)!;

  return (
    <div className="pb-16 pt-8">
      <div className="animate-fade-up mb-6">
        <DataSourceBanner />
      </div>

      <div className="animate-fade-up mb-5" style={{ animationDelay: "40ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-aero-primary" />
          <span className="aero-label">Network Heatmap</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-aero-dark sm:text-4xl">
          {active.blurb}
        </h1>

        <div
          role="tablist"
          aria-label="Heatmap view"
          className="mt-4 inline-flex rounded-lg border border-aero-border bg-white p-1"
        >
          {VIEWS.map(v => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                view === v.id
                  ? "bg-aero-primary text-white"
                  : "text-aero-mid hover:text-aero-primary",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "sector" ? <SectorMatrix /> : <TimeMatrix />}
    </div>
  );
}
