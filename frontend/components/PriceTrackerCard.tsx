"use client";

import { TrendingDown, TrendingUp, Minus, ArrowRight, Plane } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from "recharts";
import Link from "next/link";
import clsx from "clsx";
import { Tracker, inr } from "@/lib/api";

/**
 * Corridor Analytics Card — reframed for government/MoSPI statistical audience.
 *
 * Uses statistical terminology: stratum median (not "median fare"), minimum
 * observed fare (not "cheapest quote"), DGCA panel weight shown prominently,
 * and an imputation status indicator.
 */

const TONE = {
  drop: { stroke: "#12B76A", text: "text-green-600" },
  rise: { stroke: "#F04438", text: "text-red-500" },
  stable: { stroke: "#6172A0", text: "text-aero-stable" },
} as const;

const SparkTooltip = ({
  active, payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { period: string } }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-aero-dark px-2 py-1 text-xs text-white shadow-lg">
      <div className="font-semibold">{inr(payload[0].value)}</div>
      <div className="text-[9px] text-white/60">{payload[0].payload.period}</div>
    </div>
  );
};

export default function PriceTrackerCard({ tracker }: { tracker: Tracker }) {
  const t = tracker;
  const tone = TONE[t.change];
  const weightPct = (t.weight * 100).toFixed(3);

  return (
    <Link
      href={`/routes/${t.from}/${t.to}`}
      className="stat-card group block p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-aero-md"
    >
      {/* Header: route + change badge + weight chip */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div>
            <div className="text-lg font-bold leading-none text-aero-dark">{t.from}</div>
            <div className="mt-0.5 truncate text-[10px] font-medium text-aero-muted">{t.fromCity}</div>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-1">
            <span className="text-[9px] text-aero-muted">{t.stops}</span>
            <div className="flex items-center gap-0.5">
              <div className="h-px w-4 bg-aero-border" />
              <Plane className="h-3 w-3 rotate-45 text-aero-primary" />
              <div className="h-px w-4 bg-aero-border" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold leading-none text-aero-dark">{t.to}</div>
            <div className="mt-0.5 truncate text-[10px] font-medium text-aero-muted">{t.toCity}</div>
          </div>
        </div>

        {t.change === "drop" && (
          <span className="aero-badge-drop shrink-0">
            <TrendingDown className="h-3 w-3" />
            −{t.changePct}%
          </span>
        )}
        {t.change === "rise" && (
          <span className="aero-badge-rise shrink-0">
            <TrendingUp className="h-3 w-3" />
            +{t.changePct}%
          </span>
        )}
        {t.change === "stable" && (
          <span className="aero-badge-stable shrink-0">
            <Minus className="h-3 w-3" />
            Stable
          </span>
        )}
      </div>

      {/* DGCA Weight — prominent, not a footnote */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="rounded bg-aero-badge px-1.5 py-0.5 font-mono text-[9px] font-bold text-aero-primary">
          DGCA wt. {weightPct}%
        </span>
        <span className="text-[9px] text-aero-muted">index contribution ∝ weight</span>
      </div>

      {/* Statistical price block */}
      <div className="mb-2.5">
        <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-aero-muted">
          Stratum Median (₹)
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-aero-dark">{inr(t.price)}</span>
          <span className={clsx("text-xs font-semibold tabular-nums", tone.text)}>
            {t.change === "stable" ? "±" : t.change === "drop" ? "−" : "+"}
            {t.changePct}%
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-aero-muted">
          <span>Min. observed: {inr(t.bestPrice)}</span>
          <span className="text-aero-border">·</span>
          <span>{t.volume} obs.</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="-mx-1 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={t.data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id={`spark-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={tone.stroke} stopOpacity={0.22} />
                <stop offset="95%" stopColor={tone.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={tone.stroke}
              strokeWidth={1.5}
              fill={`url(#spark-${t.id})`}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip content={<SparkTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer: imputation status + detail link */}
      <div className="mt-2 flex items-center justify-between border-t border-aero-border pt-2">
        <span className="text-[9px] font-medium text-aero-muted">
          Imputation: <span className="font-bold text-green-600">none</span>
          <span className="mx-1 text-aero-border">·</span>
          {t.updated}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-aero-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Analyse route <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
