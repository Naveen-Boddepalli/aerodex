"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Globe, Layers3, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { fetchIndexLatest, IndexLatest, pct } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";

/**
 * The headline strip: index level, panel size, quote volume, coverage.
 *
 * The old version animated a count-up over `Math.round(value)`, which turned
 * the index — a number that lives between 97 and 110 and whose second decimal
 * is the whole point — into an integer that ticked up from zero. Decimal stats
 * are now rendered at their real precision and only integer counts animate.
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
        // Land on the exact target rather than wherever the easing curve got
        // to — the last frame must equal the number, not approximate it.
        setCount(target);
      }
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, enabled, duration]);

  // A stalled rAF (background tab, throttled renderer) must leave the true
  // number on screen, never a partial count.
  return count ?? target;
}

interface StatItem {
  label: string;
  display: string;
  animate?: number;
  icon: React.ElementType;
  tone: string;
  description: string;
  trend?: { direction: "up" | "down"; text: string };
}

function StatCard({ stat, delay }: { stat: StatItem; delay: number }) {
  const animated = useCountUp(stat.animate ?? 0, stat.animate !== undefined);
  const Icon = stat.icon;

  return (
    <div
      className="aero-card animate-fade-up p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-aero-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aero-bg", stat.tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold tabular-nums text-aero-dark">
            {stat.animate !== undefined ? animated.toLocaleString("en-IN") : stat.display}
          </div>
          <div className="text-xs font-semibold text-aero-mid">{stat.label}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-aero-muted">
            {stat.trend && (
              <span
                className={clsx(
                  "flex items-center gap-0.5 font-semibold",
                  stat.trend.direction === "down" ? "text-green-600" : "text-red-500",
                )}
              >
                {stat.trend.direction === "down"
                  ? <TrendingDown className="h-3 w-3" />
                  : <TrendingUp className="h-3 w-3" />}
                {stat.trend.text}
              </span>
            )}
            <span className="truncate">{stat.description}</span>
          </div>
        </div>
      </div>
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const change =
    data.previous_value != null && data.previous_value !== 0
      ? ((data.value - data.previous_value) / data.previous_value) * 100
      : null;

  const stats: StatItem[] = [
    {
      label: "Index level",
      display: data.value.toFixed(2),
      icon: Activity,
      tone: "text-aero-primary",
      description: `base ${data.base_period} = ${data.base_value.toFixed(0)}`,
      trend:
        change != null
          ? {
              direction: change < 0 ? "down" : "up",
              text: `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
            }
          : undefined,
    },
    {
      label: "Panel routes",
      animate: data.n_routes,
      display: String(data.n_routes),
      icon: Globe,
      tone: "text-aero-sky",
      description: `${data.n_strata_reported} strata reported`,
    },
    {
      label: "Quotes this period",
      animate: data.n_quotes,
      display: String(data.n_quotes),
      icon: Layers3,
      tone: "text-green-600",
      description: `validated · ${data.period}`,
    },
    {
      label: "Coverage",
      display: pct(data.coverage_ratio, 1),
      icon: ShieldCheck,
      tone: "text-purple-500",
      description: `${pct(data.imputed_weight_share, 1)} imputed`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, i) => (
        <StatCard key={s.label} stat={s} delay={i * 70} />
      ))}
    </div>
  );
}
