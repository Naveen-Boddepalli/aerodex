"use client";

import { TrendingDown, TrendingUp, Minus, ArrowRight, Plane } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from "recharts";
import Link from "next/link";
import clsx from "clsx";
import { Tracker, inr } from "@/lib/api";

/**
 * One route card. Takes the API's `Tracker` shape directly so the dashboard
 * does not restate the field list on every use.
 *
 * The headline number is the route's *median* fare across all seven booking
 * horizons, not the cheapest quote — a minimum over 42 quotes moves on noise
 * alone and would show a "drop" every other day. The cheapest quote is still
 * shown, labelled as such.
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

  return (
    <Link
      href={`/routes/${t.from}/${t.to}`}
      className="aero-card group block p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-aero-md"
    >
      {/* Header: route + change badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
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

      {/* Price block */}
      <div className="mb-3">
        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-aero-muted">
          Median fare
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-aero-dark">{inr(t.price)}</span>
          <span className={clsx("text-xs font-semibold tabular-nums", tone.text)}>
            {t.change === "stable" ? "±" : t.change === "drop" ? "−" : "+"}
            {t.changePct}%
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-aero-muted">
          Cheapest quote {inr(t.bestPrice)} · {t.volume} quotes · weight{" "}
          {(t.weight * 100).toFixed(2)}%
        </div>
      </div>

      {/* Sparkline */}
      <div className="-mx-1 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={t.data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id={`spark-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={tone.stroke} stopOpacity={0.22} />
                <stop offset="95%" stopColor={tone.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Without an explicit domain recharts anchors the axis at 0, which
                flattens a ₹8,000–9,000 series into a straight line. */}
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={tone.stroke}
              strokeWidth={1.5}
              fill={`url(#spark-${t.id})`}
              dot={false} isAnimationActive={false}
            />
            <Tooltip content={<SparkTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-aero-muted">{t.updated}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-aero-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Route detail <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
