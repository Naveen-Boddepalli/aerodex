"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Calendar, Download, TrendingDown, TrendingUp, BarChart2, ChevronDown } from "lucide-react";
import clsx from "clsx";

/* ── Synthetic 30-day index history ── */
const HISTORY = [
  { date:"Jul 27", DEL_BOM:4850, BLR_BOM:3300, DEL_BLR:5150, HYD_DEL:6100 },
  { date:"Jul 29", DEL_BOM:4800, BLR_BOM:3280, DEL_BLR:5120, HYD_DEL:6050 },
  { date:"Jul 31", DEL_BOM:4700, BLR_BOM:3350, DEL_BLR:5100, HYD_DEL:5950 },
  { date:"Aug 02", DEL_BOM:4600, BLR_BOM:3400, DEL_BLR:5080, HYD_DEL:5800 },
  { date:"Aug 04", DEL_BOM:4500, BLR_BOM:3450, DEL_BLR:5090, HYD_DEL:5700 },
  { date:"Aug 06", DEL_BOM:4400, BLR_BOM:3420, DEL_BLR:5070, HYD_DEL:5500 },
  { date:"Aug 08", DEL_BOM:4350, BLR_BOM:3380, DEL_BLR:5060, HYD_DEL:5300 },
  { date:"Aug 10", DEL_BOM:4200, BLR_BOM:3350, DEL_BLR:5080, HYD_DEL:5100 },
  { date:"Aug 12", DEL_BOM:4100, BLR_BOM:3400, DEL_BLR:5090, HYD_DEL:5000 },
  { date:"Aug 14", DEL_BOM:4000, BLR_BOM:3420, DEL_BLR:5050, HYD_DEL:4850 },
  { date:"Aug 16", DEL_BOM:3900, BLR_BOM:3410, DEL_BLR:5070, HYD_DEL:4700 },
  { date:"Aug 18", DEL_BOM:3800, BLR_BOM:3450, DEL_BLR:5060, HYD_DEL:4600 },
  { date:"Aug 20", DEL_BOM:3700, BLR_BOM:3440, DEL_BLR:5080, HYD_DEL:4500 },
  { date:"Aug 22", DEL_BOM:3600, BLR_BOM:3450, DEL_BLR:5070, HYD_DEL:4350 },
  { date:"Aug 24", DEL_BOM:3500, BLR_BOM:3450, DEL_BLR:5080, HYD_DEL:4200 },
];

const ROUTES = [
  { key:"DEL_BOM", label:"DEL → BOM", color:"#2456E8" },
  { key:"BLR_BOM", label:"BLR → BOM", color:"#F04438" },
  { key:"DEL_BLR", label:"DEL → BLR", color:"#12B76A" },
  { key:"HYD_DEL", label:"HYD → DEL", color:"#F59E0B" },
];

const RANGES = ["7 days", "14 days", "30 days", "90 days"] as const;

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload?.length)
    return (
      <div className="aero-card p-3 shadow-aero-md min-w-[160px]">
        <p className="text-[11px] font-semibold text-aero-muted mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5 text-[11px] text-aero-mid">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
              {p.name.replace("_", " → ")}
            </span>
            <span className="text-xs font-bold text-aero-dark">₹{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  return null;
};

export default function HistoryPage() {
  const [range, setRange] = useState<typeof RANGES[number]>("30 days");
  const [selected, setSelected] = useState<Set<string>>(new Set(["DEL_BOM", "HYD_DEL"]));

  function toggle(key: string) {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(key)) { if (n.size > 1) n.delete(key); }
      else n.add(key);
      return n;
    });
  }

  const data = range === "7 days" ? HISTORY.slice(-4) : range === "14 days" ? HISTORY.slice(-8) : HISTORY;

  // % change for selected routes
  const changes = ROUTES.filter(r => selected.has(r.key)).map(r => {
    const first = data[0]?.[r.key as keyof typeof data[0]] as number;
    const last  = data[data.length - 1]?.[r.key as keyof typeof data[0]] as number;
    const pct   = first ? ((last - first) / first * 100).toFixed(1) : "0";
    return { ...r, first, last, pct: parseFloat(pct) };
  });

  return (
    <div className="pt-8 pb-16">

      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full bg-aero-primary" />
          <span className="aero-label">Historical Index</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-aero-dark">Price History</h1>
            <p className="text-sm text-aero-mid mt-1 max-w-lg">
              Jevons-indexed fare trends across India&apos;s domestic corridors. Compare routes over time.
            </p>
          </div>
          <button className="aero-btn-primary self-start sm:self-auto">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Change stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {changes.map(c => (
          <div key={c.key} className="aero-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-[11px] text-aero-muted font-medium">{c.label}</span>
            </div>
            <div className="text-xl font-bold text-aero-dark tabular-nums">₹{c.last.toLocaleString()}</div>
            <div className={clsx("flex items-center gap-1 text-xs font-semibold mt-1", c.pct < 0 ? "text-green-600" : c.pct > 0 ? "text-red-500" : "text-aero-muted")}>
              {c.pct < 0 ? <TrendingDown className="w-3 h-3" /> : c.pct > 0 ? <TrendingUp className="w-3 h-3" /> : null}
              {c.pct > 0 ? "+" : ""}{c.pct}% in {range}
            </div>
          </div>
        ))}
      </div>

      {/* Chart card */}
      <div className="aero-card p-5 mb-6 animate-fade-up" style={{ animationDelay: "100ms" }}>

        {/* Chart controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-aero-dark flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-aero-primary" />
              Fare Index Over Time
            </h2>
            <p className="text-[11px] text-aero-muted mt-0.5">Best available economy fare · INR · Jevons methodology</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Range picker */}
            <div className="flex items-center gap-1 bg-aero-bg rounded-xl p-1 border border-aero-border">
              {RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                    range === r ? "bg-aero-primary text-white shadow-aero-sm" : "text-aero-mid hover:text-aero-dark"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Route toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ROUTES.map(r => (
            <button
              key={r.key}
              onClick={() => toggle(r.key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
                selected.has(r.key)
                  ? "text-white border-transparent shadow-aero-sm"
                  : "text-aero-mid border-aero-border hover:border-aero-primary",
              )}
              style={selected.has(r.key) ? { backgroundColor: r.color, borderColor: r.color } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.has(r.key) ? "#fff" : r.color }} />
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {ROUTES.map(r => (
                  <linearGradient key={r.key} id={`hg-${r.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={r.color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={r.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE4F5" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A99BB" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#8A99BB" }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(1)}k`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              {ROUTES.filter(r => selected.has(r.key)).map(r => (
                <Area
                  key={r.key}
                  type="monotone"
                  dataKey={r.key}
                  name={r.label}
                  stroke={r.color}
                  strokeWidth={2}
                  fill={`url(#hg-${r.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Methodology note */}
      <div className="aero-card p-5 bg-gradient-to-r from-aero-primary/5 to-aero-sky/5 border-aero-primary/20 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-aero-primary mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-aero-dark">About this data</div>
            <div className="text-xs text-aero-muted mt-0.5 max-w-2xl">
              Prices shown are the <strong>Jevons elementary index</strong> — geometric mean of fare relatives — across
              7 booking horizons per route. Collected at 3 fixed IST slots daily (morning/afternoon/evening).
              Index is reproducible from the archived panel via <code className="text-aero-primary text-[10px] bg-aero-badge px-1 py-0.5 rounded">aerodex verify</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
