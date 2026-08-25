"use client";

import { TrendingDown, TrendingUp, Minus, ArrowRight, Plane } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";

interface TrackerCardProps {
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  stops: string;
  price: number;
  currency?: string;
  change: "drop" | "rise" | "stable";
  changePct?: number;
  changeAmt?: number;
  dates: string;
  lastChecked: string;
  data: { v: number }[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-aero-dark text-white text-xs px-2 py-1 rounded-lg shadow-lg">
        ₹{payload[0].value.toLocaleString()}
      </div>
    );
  }
  return null;
};

export default function PriceTrackerCard({
  from, fromCity, to, toCity, stops, price, currency = "₹",
  change, changePct, changeAmt, dates, lastChecked, data,
}: TrackerCardProps) {

  const strokeColor =
    change === "drop" ? "#12B76A" :
    change === "rise" ? "#F04438" :
    "#6172A0";

  return (
    <div className="aero-card p-4 hover:shadow-aero-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Route */}
          <div className="flex items-center gap-1.5">
            <div>
              <div className="text-lg font-bold text-aero-dark leading-none">{from}</div>
              <div className="text-[10px] text-aero-muted font-medium mt-0.5">{fromCity}</div>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-1">
              <span className="text-[9px] text-aero-muted">{stops}</span>
              <div className="flex items-center gap-0.5">
                <div className="w-4 h-px bg-aero-border" />
                <Plane className="w-3 h-3 text-aero-primary rotate-45" />
                <div className="w-4 h-px bg-aero-border" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-aero-dark leading-none">{to}</div>
              <div className="text-[10px] text-aero-muted font-medium mt-0.5">{toCity}</div>
            </div>
          </div>
        </div>

        {/* Badge */}
        {change === "drop" && changeAmt && (
          <span className="aero-badge-drop">
            <TrendingDown className="w-3 h-3" />
            ₹{changeAmt} Drop
          </span>
        )}
        {change === "rise" && changePct && (
          <span className="aero-badge-rise">
            <TrendingUp className="w-3 h-3" />
            +{changePct}%
          </span>
        )}
        {change === "stable" && (
          <span className="aero-badge-stable">
            <Minus className="w-3 h-3" />
            Stable
          </span>
        )}
      </div>

      {/* Price + meta */}
      <div className="mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-aero-muted mb-0.5">Current Best</div>
        <div className="text-2xl font-bold text-aero-dark">
          {currency}{price.toLocaleString()}
        </div>
        <div className="text-[10px] text-aero-muted mt-0.5">
          {dates} · Checked {lastChecked}
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-14 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id={`grad-${from}-${to}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={strokeColor}
              strokeWidth={1.5}
              fill={`url(#grad-${from}-${to})`}
              dot={false}
            />
            <Tooltip content={<CustomTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* View link */}
      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-aero-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        View details <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}
