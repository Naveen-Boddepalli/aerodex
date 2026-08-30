"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RouteExplorer from "@/components/RouteExplorer";
import PriceTrackerCard from "@/components/PriceTrackerCard";
import IndexProvenance from "@/components/IndexProvenance";
import IndexStats from "@/components/IndexStats";
import RouteMapSection from "@/components/RouteMapSection";
import DataSourceBanner from "@/components/DataSourceBanner";
import { ErrorBlock, Skeleton } from "@/components/states";
import { fetchTrackers, Tracker } from "@/lib/api";

export default function DashboardPage() {
  const [trackers, setTrackers] = useState<Tracker[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackers(8).then(({ data, error }) => {
      setTrackers(data);
      setError(error);
    });
  }, []);

  return (
    <div className="pt-6">
      <div className="animate-fade-up mb-6">
        <DataSourceBanner />
      </div>

      {/* ── Hero ── */}
      <div className="animate-fade-up mb-6" style={{ animationDelay: "40ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-aero-primary" />
          <span className="aero-label">Airfare Price Index · India</span>
        </div>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-aero-dark sm:text-4xl lg:text-5xl">
          What Indian air travel actually costs
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-aero-mid sm:text-base">
          A reproducible price index over a 60-route domestic panel — Jevons elementary
          aggregates, DGCA traffic weights, and a published hash for every number.
          SIH 2026, PS SIH26056 (MoSPI).
        </p>
      </div>

      {/* ── Panel query ── */}
      <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <RouteExplorer />
      </div>

      {/* ── Headline stats ── */}
      <div className="animate-fade-up mt-8" style={{ animationDelay: "150ms" }}>
        <IndexStats />
      </div>

      {/* ── Movers + provenance ── */}
      <div
        className="animate-fade-up mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3"
        style={{ animationDelay: "200ms" }}
      >
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-aero-dark">Heaviest corridors</h2>
              <p className="text-xs text-aero-muted">
                Ordered by DGCA panel weight — the routes that move the headline most.
              </p>
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
          <div className="mb-4">
            <h2 className="text-lg font-bold text-aero-dark">Provenance</h2>
            <p className="text-xs text-aero-muted">
              How this number was produced, and how to check it.
            </p>
          </div>
          <IndexProvenance />
        </div>
      </div>

      {/* ── Panel map ── */}
      <div className="animate-fade-up" style={{ animationDelay: "280ms" }}>
        <RouteMapSection />
      </div>
    </div>
  );
}
