"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchTrackers, Tracker, inr } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";
import clsx from "clsx";
import DataSourceBanner from "@/components/DataSourceBanner";
import Link from "next/link";

export default function HeatmapPage() {
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

  if (error) return <ErrorBlock error={error} />;
  
  if (!trackers) {
    return (
      <div className="pb-16 pt-8">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-16 pt-8">
      <div className="animate-fade-up mb-6">
        <DataSourceBanner />
      </div>
      <div className="animate-fade-up mb-6" style={{ animationDelay: "40ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-aero-primary" />
          <span className="aero-label">Network Heatmap</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-aero-dark sm:text-4xl">
          Origin-Destination Inflation
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-aero-mid">
          Period-on-period inflation rate by sector. Green indicates fare drops; red indicates fare hikes. Missing cells mean the route is not in the panel.
        </p>
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
                  let bgClass = "bg-white hover:bg-aero-bg/50";
                  let textClass = "text-aero-dark";
                  if (pct < -10) bgClass = "bg-green-500 hover:bg-green-600";
                  else if (pct < -5) bgClass = "bg-green-400 hover:bg-green-500";
                  else if (pct < -1) bgClass = "bg-green-300 hover:bg-green-400";
                  else if (pct > 10) bgClass = "bg-red-500 hover:bg-red-600";
                  else if (pct > 5) bgClass = "bg-red-400 hover:bg-red-500";
                  else if (pct > 1) bgClass = "bg-red-300 hover:bg-red-400";
                  
                  if (pct < -5 || pct > 5) textClass = "text-white";
                  
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
    </div>
  );
}
