"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import RouteExplorer from "@/components/RouteExplorer";
import PriceTrackerCard from "@/components/PriceTrackerCard";
import IndexProvenance from "@/components/IndexProvenance";
import IndexStats from "@/components/IndexStats";
import RouteMapSection from "@/components/RouteMapSection";
import StatisticalSummaryTable from "@/components/StatisticalSummaryTable";
import DataSourceBanner from "@/components/DataSourceBanner";
import { ErrorBlock, Skeleton } from "@/components/states";
import { fetchTrackers, fetchIndexLatest, Tracker, IndexLatest } from "@/lib/api";

export default function DashboardPage() {
  const [trackers, setTrackers] = useState<Tracker[] | null>(null);
  const [indexData, setIndexData] = useState<IndexLatest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackers(8).then(({ data, error }) => {
      setTrackers(data);
      setError(error);
    });
    fetchIndexLatest().then(({ data }) => setIndexData(data));
  }, []);

  const revisionStatus = indexData?.is_provisional ? "provisional" : indexData ? "final" : null;

  return (
    <div className="pt-6">
      <div className="animate-fade-up mb-5">
        <DataSourceBanner />
      </div>

      {/* ── Statistical Publication Header ── */}
      <div className="animate-fade-up mb-6" style={{ animationDelay: "40ms" }}>
        {/* Classification band */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="gov-badge">Statistical Release · MoSPI · SIH26056</span>
          {revisionStatus === "provisional" && (
            <span className="status-provisional">◐ Provisional</span>
          )}
          {revisionStatus === "final" && (
            <span className="status-final">✓ Final</span>
          )}
          {indexData?.period && (
            <span className="text-[11px] font-medium text-aero-muted">
              Reference period: <strong className="text-aero-dark">{indexData.period}</strong>
            </span>
          )}
        </div>

        {/* Publication title */}
        <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-aero-dark sm:text-4xl">
          India Domestic Airfare Price Index
          <span className="ml-2 align-middle font-mono text-lg font-bold text-aero-primary">(DAPI)</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-aero-mid">
          A reproducible, statistically defensible airfare inflation index over a
          60-route domestic panel. Jevons elementary aggregates · Lowe aggregation ·
          DGCA traffic weights · SHA-256 hash on every published number.
        </p>

        {/* Quick actions */}
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1.5 rounded-lg border border-aero-border bg-white px-3 py-1.5 text-xs font-semibold text-aero-primary shadow-aero-sm transition-colors hover:border-aero-primary hover:bg-aero-badge"
          >
            <FileText className="h-3.5 w-3.5" />
            Methodology Document
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 rounded-lg border border-aero-border bg-white px-3 py-1.5 text-xs font-semibold text-aero-mid shadow-aero-sm transition-colors hover:border-aero-primary hover:text-aero-primary"
          >
            Historical Series <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Primary: Index KPI Strip ── */}
      <div className="animate-fade-up mb-6" style={{ animationDelay: "80ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-0.5 rounded-full bg-aero-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-aero-muted">
            Index Indicators · {indexData?.period ?? "—"}
          </span>
        </div>
        <IndexStats />
      </div>

      {/* ── Panel Query (Route Explorer) ── */}
      <div className="animate-fade-up mb-8" style={{ animationDelay: "120ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-0.5 rounded-full bg-aero-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-aero-muted">
            Panel Query
          </span>
        </div>
        <RouteExplorer />
      </div>

      {/* ── Index Methodology Disclosure ── */}
      <div className="animate-fade-up mb-8" style={{ animationDelay: "160ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-0.5 rounded-full bg-aero-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-aero-muted">
            Methodology Summary
          </span>
        </div>
        <StatisticalSummaryTable />
      </div>

      {/* ── Corridors + Provenance ── */}
      <div
        className="animate-fade-up mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
        style={{ animationDelay: "200ms" }}
      >
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-0.5 rounded-full bg-aero-primary" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-aero-muted">
                  Heaviest Corridors
                </span>
                <p className="text-[10px] text-aero-muted/70">
                  Ordered by DGCA panel weight — the routes that move the headline index most.
                </p>
              </div>
            </div>
            <Link
              href="/price-tracking"
              className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-aero-primary transition-colors duration-150 hover:text-aero-primary2"
            >
              All 60 routes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {error ? (
            <ErrorBlock error={error} />
          ) : !trackers ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-52 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trackers.map((t) => (
                <PriceTrackerCard key={t.id} tracker={t} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 w-0.5 rounded-full bg-aero-primary" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-aero-muted">
                Reproducibility & Provenance
              </span>
              <p className="text-[10px] text-aero-muted/70">
                How this number was produced and how to verify it.
              </p>
            </div>
          </div>
          <IndexProvenance />
        </div>
      </div>

      {/* ── Panel Map ── */}
      <div className="animate-fade-up" style={{ animationDelay: "280ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-0.5 rounded-full bg-aero-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-aero-muted">
            Panel Network
          </span>
        </div>
        <RouteMapSection />
      </div>
    </div>
  );
}
