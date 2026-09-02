"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, FlaskConical, Layers3, ShieldCheck, TrendingDown, TrendingUp, Clock } from "lucide-react";
import clsx from "clsx";
import { fetchIndexLatest, IndexLatest, pct } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";

/**
 * Headline KPI strip — reframed for a government/MoSPI statistical audience.
 *
 * The five KPI cards map directly to the metrics a statistical reviewer checks
 * first: the published index level, panel coverage, observation volume,
 * data quality gates, and revision status. Labels use NSO-standard terminology.
 */

function useCountUp(target: number, enabled: boolean, duration = 1200) {
  const [count, setCount] = useState<number | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      if (progress < 1) {
        setCount(Math.round((1 - (1 - progress) ** 3) * target));
        frame.current = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, enabled, duration]);

  return count ?? target;
}

interface StatItem {
  label: string;
  sublabel: string;
  display: string;
  animate?: number;
  icon: React.ElementType;
  accentClass: string;
  footer: React.ReactNode;
  wide?: boolean;
}

function StatCard({ stat, delay }: { stat: StatItem; delay: number }) {
  const animated = useCountUp(stat.animate ?? 0, stat.animate !== undefined);
  const Icon = stat.icon;

  return (
    <div
      className={clsx(
        "stat-card animate-fade-up p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-aero-md",
        stat.wide && "sm:col-span-2 lg:col-span-1",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aero-bg", stat.accentClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-aero-muted">{stat.label}</div>
          <div className="text-[9px] text-aero-muted/70">{stat.sublabel}</div>
        </div>
      </div>
      <div className="kpi-secondary tabular-nums">
        {stat.animate !== undefined ? animated.toLocaleString("en-IN") : stat.display}
      </div>
      <div className="mt-2 border-t border-aero-border pt-2 text-[10px] text-aero-muted">{stat.footer}</div>
    </div>
  );
}

export default function IndexStats() {
  const [data, setData] = useState<IndexLatest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIndexLatest().then(({ data, error }) => {
      setData(data);
      setError(error);
    });
  }, []);

  if (error) return <ErrorBlock error={error} />;

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  const change =
    data.previous_value != null && data.previous_value !== 0
      ? ((data.value - data.previous_value) / data.previous_value) * 100
      : null;

  let annualized: number | null = null;
  if (data.value && data.base_value) {
    const periodDate = new Date(data.period);
    const baseDate = new Date(`${data.base_period}-01`);
    const elapsedDays = (periodDate.getTime() - baseDate.getTime()) / (1000 * 3600 * 24);
    if (elapsedDays > 0) {
      const pctChange = (data.value - data.base_value) / data.base_value;
      annualized = (Math.pow(1 + pctChange, 365 / Math.max(1, elapsedDays)) - 1) * 100;
    }
  }

  const revisionStatus = data.is_provisional ? "provisional" : "final";

  const stats: StatItem[] = [
    {
      label: "DAPI Index Level",
      sublabel: `Base: ${data.base_period} = ${data.base_value.toFixed(0)}`,
      display: data.value.toFixed(2),
      icon: Activity,
      accentClass: "text-aero-primary",
      footer: (
        <span className={clsx("flex items-center gap-0.5 font-semibold", change == null ? "text-aero-muted" : change < 0 ? "text-green-600" : "text-red-500")}>
          {change != null && (change < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />)}
          {change != null ? `${change > 0 ? "+" : ""}${change.toFixed(2)}% period-on-period` : "First period — no prior"}
        </span>
      ),
    },
    {
      label: "Panel Coverage",
      sublabel: "Routes / Strata reported",
      display: `${data.n_routes} / ${data.n_strata_reported}`,
      icon: FlaskConical,
      accentClass: "text-aero-sky",
      footer: <span>{data.n_strata_reported} of 420 strata indexed this period</span>,
    },
    {
      label: "Observation Volume",
      sublabel: "Validated quotes",
      animate: data.n_quotes,
      display: String(data.n_quotes),
      icon: Layers3,
      accentClass: "text-green-600",
      footer: <span>Collected {data.period} · deduplicated & validated</span>,
    },
    {
      label: "Data Quality Gate",
      sublabel: "Coverage ≥ 95% | Imputation ≤ 5%",
      display: pct(data.coverage_ratio, 1),
      icon: ShieldCheck,
      accentClass: "text-purple-500",
      footer: (
        <span className={clsx("font-semibold", data.imputed_weight_share > 0.05 ? "text-red-600" : "text-aero-muted")}>
          {pct(data.imputed_weight_share, 2)} imputed weight share
          {data.imputed_weight_share > 0.05 && " — M5 ceiling breached"}
        </span>
      ),
    },
    {
      label: "Revision Status",
      sublabel: data.period,
      display: revisionStatus === "provisional" ? "Provisional" : "Final",
      icon: Clock,
      accentClass: revisionStatus === "provisional" ? "text-amber-600" : "text-green-600",
      footer: (
        <span>
          {revisionStatus === "provisional"
            ? "Revised on day 7 · frozen after"
            : "Frozen — no further revisions"}
        </span>
      ),
    },
    {
      label: "Annualised Inflation",
      sublabel: "AeroDex vs MoSPI CPI",
      display: annualized != null ? `${annualized > 0 ? "+" : ""}${annualized.toFixed(1)}%` : "—",
      icon: annualized != null && annualized < 0 ? TrendingDown : TrendingUp,
      accentClass: annualized != null && annualized < 0 ? "text-green-600" : "text-red-500",
      footer: (
        <span className="flex items-center justify-between w-full">
          <span className="text-aero-muted" title="Hand-keyed public figure, not a live feed">CPI Transport (FY26):</span>
          <span className="font-semibold text-green-700 rounded bg-green-50 px-1 py-0.5 ml-1">+7.2%</span>
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s, i) => (
        <StatCard key={s.label} stat={s} delay={i * 60} />
      ))}
    </div>
  );
}
