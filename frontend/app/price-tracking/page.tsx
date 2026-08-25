"use client";

import { useState, useMemo } from "react";
import {
  TrendingDown, TrendingUp, Minus, Bell, BellOff,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, Search,
  Plane, ChevronDown, X, SlidersHorizontal,
} from "lucide-react";
import clsx from "clsx";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip,
} from "recharts";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Change = "drop" | "rise" | "stable";
type SortKey = "route" | "price" | "change" | "volume" | "updated";
type SortDir = "asc" | "desc";

interface Tracker {
  id: string;
  from: string; fromCity: string;
  to: string;   toCity: string;
  stops: "Direct" | "1 Stop" | "2 Stops";
  price: number;
  prevPrice: number;
  change: Change;
  changePct: number;
  changeAmt: number;
  volume: number;       // quotes/day
  airline: string;
  cabin: "Economy" | "Business";
  dates: string;
  updated: string;
  alertOn: boolean;
  data: { v: number }[];
}

/* ─────────────────────────────────────────────
   Synthetic Dataset — 20 routes
───────────────────────────────────────────── */
const ALL_TRACKERS: Tracker[] = [
  { id:"DEL-BOM", from:"DEL", fromCity:"New Delhi",   to:"BOM", toCity:"Mumbai",    stops:"Direct", price:3500,  prevPrice:4800, change:"drop",   changePct:27, changeAmt:1300, volume:312, airline:"Air India",   cabin:"Economy",  dates:"Sep 15–22", updated:"2m ago",  alertOn:true,  data:[{v:4800},{v:5100},{v:4650},{v:4400},{v:3950},{v:4200},{v:3800},{v:3600},{v:3750},{v:3500}] },
  { id:"BLR-BOM", from:"BLR", fromCity:"Bengaluru",  to:"BOM", toCity:"Mumbai",    stops:"1 Stop", price:3450,  prevPrice:3200, change:"rise",   changePct:8,  changeAmt:250,  volume:197, airline:"IndiGo",      cabin:"Economy",  dates:"Oct 03–10", updated:"5m ago",  alertOn:false, data:[{v:2800},{v:2600},{v:2750},{v:2900},{v:3100},{v:3050},{v:3200},{v:3400},{v:3300},{v:3450}] },
  { id:"DEL-BLR", from:"DEL", fromCity:"New Delhi",   to:"BLR", toCity:"Bengaluru", stops:"Direct", price:5080,  prevPrice:5100, change:"stable", changePct:0,  changeAmt:20,   volume:276, airline:"Vistara",     cabin:"Economy",  dates:"Sep 20–27", updated:"1m ago",  alertOn:true,  data:[{v:5200},{v:5100},{v:5080},{v:5120},{v:5060},{v:5090},{v:5050},{v:5100},{v:5070},{v:5080}] },
  { id:"HYD-DEL", from:"HYD", fromCity:"Hyderabad",  to:"DEL", toCity:"New Delhi",  stops:"Direct", price:4200,  prevPrice:6200, change:"drop",   changePct:32, changeAmt:2000, volume:189, airline:"SpiceJet",    cabin:"Economy",  dates:"Oct 12–19", updated:"8m ago",  alertOn:false, data:[{v:6200},{v:5900},{v:5600},{v:5800},{v:5400},{v:5100},{v:4900},{v:4600},{v:4400},{v:4200}] },
  { id:"CCU-BOM", from:"CCU", fromCity:"Kolkata",    to:"BOM", toCity:"Mumbai",    stops:"1 Stop", price:4800,  prevPrice:4500, change:"rise",   changePct:7,  changeAmt:300,  volume:134, airline:"IndiGo",      cabin:"Economy",  dates:"Sep 25–Oct2",updated:"12m ago",alertOn:false, data:[{v:4200},{v:4300},{v:4400},{v:4350},{v:4500},{v:4600},{v:4700},{v:4750},{v:4800},{v:4800}] },
  { id:"MAA-DEL", from:"MAA", fromCity:"Chennai",    to:"DEL", toCity:"New Delhi",  stops:"Direct", price:5200,  prevPrice:5800, change:"drop",   changePct:10, changeAmt:600,  volume:221, airline:"Air India",   cabin:"Economy",  dates:"Oct 05–12", updated:"3m ago",  alertOn:true,  data:[{v:5800},{v:5700},{v:5600},{v:5500},{v:5450},{v:5400},{v:5300},{v:5250},{v:5200},{v:5200}] },
  { id:"BOM-GOA", from:"BOM", fromCity:"Mumbai",     to:"GOI", toCity:"Goa",       stops:"Direct", price:2100,  prevPrice:1900, change:"rise",   changePct:11, changeAmt:200,  volume:402, airline:"IndiGo",      cabin:"Economy",  dates:"Oct 15–22", updated:"6m ago",  alertOn:false, data:[{v:1900},{v:1950},{v:2000},{v:2050},{v:2000},{v:2100},{v:2050},{v:2100},{v:2100},{v:2100}] },
  { id:"DEL-JAI", from:"DEL", fromCity:"New Delhi",   to:"JAI", toCity:"Jaipur",   stops:"Direct", price:890,   prevPrice:890,  change:"stable", changePct:0,  changeAmt:0,    volume:156, airline:"SpiceJet",    cabin:"Economy",  dates:"Sep 18–20", updated:"15m ago", alertOn:false, data:[{v:900},{v:890},{v:895},{v:888},{v:892},{v:890},{v:889},{v:892},{v:890},{v:890}] },
  { id:"BLR-HYD", from:"BLR", fromCity:"Bengaluru",  to:"HYD", toCity:"Hyderabad", stops:"Direct", price:1400,  prevPrice:1650, change:"drop",   changePct:15, changeAmt:250,  volume:289, airline:"Air Asia",    cabin:"Economy",  dates:"Oct 01–08", updated:"4m ago",  alertOn:true,  data:[{v:1650},{v:1600},{v:1580},{v:1550},{v:1520},{v:1500},{v:1480},{v:1450},{v:1420},{v:1400}] },
  { id:"BOM-DEL", from:"BOM", fromCity:"Mumbai",     to:"DEL", toCity:"New Delhi",  stops:"Direct", price:3800,  prevPrice:4200, change:"drop",   changePct:10, changeAmt:400,  volume:341, airline:"Vistara",     cabin:"Business", dates:"Sep 22–29", updated:"7m ago",  alertOn:false, data:[{v:4200},{v:4100},{v:4050},{v:4000},{v:3950},{v:3900},{v:3860},{v:3820},{v:3800},{v:3800}] },
  { id:"DEL-CCU", from:"DEL", fromCity:"New Delhi",   to:"CCU", toCity:"Kolkata",  stops:"1 Stop", price:3200,  prevPrice:3000, change:"rise",   changePct:7,  changeAmt:200,  volume:143, airline:"IndiGo",      cabin:"Economy",  dates:"Oct 10–17", updated:"20m ago", alertOn:false, data:[{v:2900},{v:2950},{v:3000},{v:3050},{v:3100},{v:3100},{v:3150},{v:3180},{v:3200},{v:3200}] },
  { id:"BLR-DEL", from:"BLR", fromCity:"Bengaluru",  to:"DEL", toCity:"New Delhi",  stops:"Direct", price:4950,  prevPrice:5200, change:"drop",   changePct:5,  changeAmt:250,  volume:258, airline:"Air India",   cabin:"Economy",  dates:"Sep 28–Oct5",updated:"9m ago", alertOn:true,  data:[{v:5200},{v:5150},{v:5100},{v:5080},{v:5050},{v:5020},{v:5000},{v:4980},{v:4960},{v:4950}] },
  { id:"HYD-BOM", from:"HYD", fromCity:"Hyderabad",  to:"BOM", toCity:"Mumbai",    stops:"Direct", price:2600,  prevPrice:2600, change:"stable", changePct:0,  changeAmt:0,    volume:175, airline:"SpiceJet",    cabin:"Economy",  dates:"Oct 20–27", updated:"11m ago", alertOn:false, data:[{v:2620},{v:2610},{v:2605},{v:2598},{v:2602},{v:2600},{v:2600},{v:2601},{v:2599},{v:2600}] },
  { id:"MAA-BLR", from:"MAA", fromCity:"Chennai",    to:"BLR", toCity:"Bengaluru", stops:"Direct", price:1750,  prevPrice:2100, change:"drop",   changePct:17, changeAmt:350,  volume:312, airline:"IndiGo",      cabin:"Economy",  dates:"Sep 16–23", updated:"2m ago",  alertOn:false, data:[{v:2100},{v:2050},{v:2000},{v:1950},{v:1900},{v:1870},{v:1830},{v:1800},{v:1770},{v:1750}] },
  { id:"PNQ-DEL", from:"PNQ", fromCity:"Pune",       to:"DEL", toCity:"New Delhi",  stops:"1 Stop", price:3100,  prevPrice:2900, change:"rise",   changePct:7,  changeAmt:200,  volume:98,  airline:"Go First",    cabin:"Economy",  dates:"Oct 08–15", updated:"18m ago", alertOn:false, data:[{v:2900},{v:2930},{v:2960},{v:2980},{v:3000},{v:3020},{v:3050},{v:3070},{v:3090},{v:3100}] },
  { id:"GAU-DEL", from:"GAU", fromCity:"Guwahati",   to:"DEL", toCity:"New Delhi",  stops:"1 Stop", price:5500,  prevPrice:5500, change:"stable", changePct:0,  changeAmt:0,    volume:62,  airline:"Air India",   cabin:"Economy",  dates:"Oct 03–10", updated:"25m ago", alertOn:false, data:[{v:5500},{v:5510},{v:5495},{v:5505},{v:5500},{v:5498},{v:5502},{v:5499},{v:5501},{v:5500}] },
  { id:"BOM-BLR", from:"BOM", fromCity:"Mumbai",     to:"BLR", toCity:"Bengaluru", stops:"Direct", price:2850,  prevPrice:3400, change:"drop",   changePct:16, changeAmt:550,  volume:267, airline:"IndiGo",      cabin:"Economy",  dates:"Sep 30–Oct7",updated:"5m ago", alertOn:true,  data:[{v:3400},{v:3300},{v:3200},{v:3150},{v:3100},{v:3050},{v:2980},{v:2920},{v:2870},{v:2850}] },
  { id:"DEL-HYD", from:"DEL", fromCity:"New Delhi",   to:"HYD", toCity:"Hyderabad", stops:"Direct", price:4600,  prevPrice:4200, change:"rise",   changePct:10, changeAmt:400,  volume:184, airline:"Vistara",     cabin:"Business", dates:"Oct 12–19", updated:"13m ago", alertOn:false, data:[{v:4200},{v:4250},{v:4300},{v:4350},{v:4400},{v:4450},{v:4500},{v:4550},{v:4580},{v:4600}] },
  { id:"CCU-DEL", from:"CCU", fromCity:"Kolkata",    to:"DEL", toCity:"New Delhi",  stops:"Direct", price:3900,  prevPrice:4100, change:"drop",   changePct:5,  changeAmt:200,  volume:147, airline:"SpiceJet",    cabin:"Economy",  dates:"Oct 18–25", updated:"30m ago", alertOn:false, data:[{v:4100},{v:4050},{v:4000},{v:3980},{v:3960},{v:3940},{v:3920},{v:3910},{v:3905},{v:3900}] },
  { id:"BLR-MAA", from:"BLR", fromCity:"Bengaluru",  to:"MAA", toCity:"Chennai",   stops:"Direct", price:1600,  prevPrice:1600, change:"stable", changePct:0,  changeAmt:0,    volume:228, airline:"Air Asia",    cabin:"Economy",  dates:"Sep 22–29", updated:"8m ago",  alertOn:false, data:[{v:1610},{v:1600},{v:1605},{v:1598},{v:1602},{v:1600},{v:1599},{v:1601},{v:1600},{v:1600}] },
];

const AIRLINES = ["All Airlines", ...Array.from(new Set(ALL_TRACKERS.map(t => t.airline))).sort()];
const STOPS    = ["All Stops", "Direct", "1 Stop", "2 Stops"];
const CHANGES  = ["All Changes", "drop", "rise", "stable"];

/* ─────────────────────────────────────────────
   Mini sparkline
───────────────────────────────────────────── */
const MiniTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  if (active && payload?.length)
    return <div className="bg-aero-dark text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg">₹{payload[0].value.toLocaleString()}</div>;
  return null;
};

function Sparkline({ data, change }: { data: { v: number }[]; change: Change }) {
  const color = change === "drop" ? "#12B76A" : change === "rise" ? "#F04438" : "#6172A0";
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`sg-${change}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${change})`} dot={false} />
          <Tooltip content={<MiniTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Change badge
───────────────────────────────────────────── */
function ChangeBadge({ t }: { t: Tracker }) {
  if (t.change === "drop")
    return (
      <span className="aero-badge-drop">
        <TrendingDown className="w-3 h-3" />
        ₹{t.changeAmt.toLocaleString()} · {t.changePct}%
      </span>
    );
  if (t.change === "rise")
    return (
      <span className="aero-badge-rise">
        <TrendingUp className="w-3 h-3" />
        +₹{t.changeAmt.toLocaleString()} · +{t.changePct}%
      </span>
    );
  return (
    <span className="aero-badge-stable">
      <Minus className="w-3 h-3" />
      Stable
    </span>
  );
}

/* ─────────────────────────────────────────────
   Sort header button
───────────────────────────────────────────── */
function SortBtn({
  label, col, sortKey, sortDir, onSort,
}: {
  label: string; col: SortKey;
  sortKey: SortKey; sortDir: SortDir;
  onSort: (c: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <button
      onClick={() => onSort(col)}
      className={clsx(
        "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150",
        active ? "text-aero-primary" : "text-aero-muted hover:text-aero-mid",
      )}
    >
      {label}
      {active
        ? sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        : <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function PriceTrackingPage() {
  const [search, setSearch]     = useState("");
  const [airline, setAirline]   = useState("All Airlines");
  const [stops, setStops]       = useState("All Stops");
  const [changeF, setChangeF]   = useState("All Changes");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey]   = useState<SortKey>("change");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");
  const [trackers, setTrackers] = useState(ALL_TRACKERS);

  function handleSort(col: SortKey) {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("desc"); }
  }

  function toggleAlert(id: string) {
    setTrackers(ts => ts.map(t => t.id === id ? { ...t, alertOn: !t.alertOn } : t));
  }

  const filtered = useMemo(() => {
    let list = trackers;
    if (search)        list = list.filter(t => `${t.from}${t.to}${t.fromCity}${t.toCity}${t.airline}`.toLowerCase().includes(search.toLowerCase()));
    if (airline !== "All Airlines") list = list.filter(t => t.airline === airline);
    if (stops   !== "All Stops")    list = list.filter(t => t.stops   === stops);
    if (changeF !== "All Changes")  list = list.filter(t => t.change  === changeF);
    if (alertsOnly)                 list = list.filter(t => t.alertOn);

    return [...list].sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortKey === "route")   { va = `${a.from}-${a.to}`; vb = `${b.from}-${b.to}`; }
      else if (sortKey === "price")  { va = a.price; vb = b.price; }
      else if (sortKey === "change") { va = a.changePct; vb = b.changePct; }
      else if (sortKey === "volume") { va = a.volume; vb = b.volume; }
      else                           { va = a.updated; vb = b.updated; }
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
    });
  }, [trackers, search, airline, stops, changeF, alertsOnly, sortKey, sortDir]);

  // Summary stats
  const drops  = trackers.filter(t => t.change === "drop").length;
  const rises  = trackers.filter(t => t.change === "rise").length;
  const stable = trackers.filter(t => t.change === "stable").length;
  const alerts = trackers.filter(t => t.alertOn).length;

  return (
    <div className="pt-8 pb-16">

      {/* ── Page header ── */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full bg-aero-primary" />
          <span className="aero-label">Live Index · 60-Route Panel</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-aero-dark leading-tight">
              Price Tracking
            </h1>
            <p className="text-sm text-aero-mid mt-1 max-w-lg">
              Monitor real-time fare movements across India&apos;s domestic corridors.
              Set alerts and track Jevons-indexed pricing anomalies.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-aero-border rounded-xl px-4 py-2.5 shadow-aero-sm self-start sm:self-auto">
            <span className="live-dot" />
            <span className="text-xs font-semibold text-aero-dark">Live · {trackers.length} routes</span>
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Price Drops",   value: drops,  icon: <TrendingDown className="w-4 h-4" />, color: "text-green-600",   bg: "bg-green-50",   border: "border-green-100" },
          { label: "Price Rises",   value: rises,  icon: <TrendingUp   className="w-4 h-4" />, color: "text-red-500",    bg: "bg-red-50",     border: "border-red-100"   },
          { label: "Stable Routes", value: stable, icon: <Minus        className="w-4 h-4" />, color: "text-aero-stable",bg: "bg-aero-badge", border: "border-aero-border"},
          { label: "Alerts Active", value: alerts, icon: <Bell         className="w-4 h-4" />, color: "text-aero-primary",bg: "bg-blue-50",   border: "border-blue-100"  },
        ].map(s => (
          <div key={s.label} className={`aero-card p-4 flex items-center gap-3 border ${s.border}`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-aero-dark tabular-nums">{s.value}</div>
              <div className="text-[11px] text-aero-muted font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters bar ── */}
      <div className="aero-card p-4 mb-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aero-muted" />
            <input
              type="text"
              placeholder="Search route, city or airline…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="aero-input pl-10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-aero-muted hover:text-aero-dark">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={clsx(
              "sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150",
              showFilters ? "bg-aero-primary text-white border-aero-primary" : "border-aero-border text-aero-mid hover:border-aero-primary"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {/* Desktop filters */}
          <div className={clsx("flex flex-wrap gap-3", "sm:flex")}>
            {/* Airline */}
            <div className="relative">
              <select
                value={airline}
                onChange={e => setAirline(e.target.value)}
                className="appearance-none aero-input pr-8 py-2.5 text-sm cursor-pointer min-w-[140px]"
              >
                {AIRLINES.map(a => <option key={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aero-muted pointer-events-none" />
            </div>

            {/* Stops */}
            <div className="relative">
              <select
                value={stops}
                onChange={e => setStops(e.target.value)}
                className="appearance-none aero-input pr-8 py-2.5 text-sm cursor-pointer min-w-[110px]"
              >
                {STOPS.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aero-muted pointer-events-none" />
            </div>

            {/* Change */}
            <div className="relative">
              <select
                value={changeF}
                onChange={e => setChangeF(e.target.value)}
                className="appearance-none aero-input pr-8 py-2.5 text-sm cursor-pointer min-w-[130px]"
              >
                {CHANGES.map(c => <option key={c} value={c}>{c === "All Changes" ? "All Changes" : c === "drop" ? "Price Drops" : c === "rise" ? "Price Rises" : "Stable"}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aero-muted pointer-events-none" />
            </div>

            {/* Alerts only toggle */}
            <button
              onClick={() => setAlertsOnly(a => !a)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 whitespace-nowrap",
                alertsOnly ? "bg-aero-primary text-white border-aero-primary" : "border-aero-border text-aero-mid hover:border-aero-primary hover:text-aero-primary"
              )}
            >
              <Bell className="w-3.5 h-3.5" />
              Alerts only
            </button>
          </div>
        </div>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="sm:hidden mt-3 pt-3 border-t border-aero-border flex flex-col gap-2">
            {[
              { value: airline, onChange: setAirline, options: AIRLINES },
              { value: stops,   onChange: setStops,   options: STOPS    },
            ].map((f, i) => (
              <div key={i} className="relative">
                <select value={f.value} onChange={e => f.onChange(e.target.value)} className="appearance-none aero-input pr-8 text-sm cursor-pointer w-full">
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aero-muted pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Active filter chips */}
        {(airline !== "All Airlines" || stops !== "All Stops" || changeF !== "All Changes" || alertsOnly || search) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-aero-border">
            <span className="text-[11px] text-aero-muted font-medium flex items-center gap-1"><Filter className="w-3 h-3" /> Active:</span>
            {search         && <Chip label={`"${search}"`}    onRemove={() => setSearch("")} />}
            {airline !== "All Airlines" && <Chip label={airline}          onRemove={() => setAirline("All Airlines")} />}
            {stops   !== "All Stops"    && <Chip label={stops}            onRemove={() => setStops("All Stops")} />}
            {changeF !== "All Changes"  && <Chip label={changeF === "drop" ? "Price Drops" : changeF === "rise" ? "Price Rises" : "Stable"} onRemove={() => setChangeF("All Changes")} />}
            {alertsOnly                 && <Chip label="Alerts only"      onRemove={() => setAlertsOnly(false)} />}
          </div>
        )}
      </div>

      {/* ── Result count ── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm text-aero-muted">
          Showing <span className="font-semibold text-aero-dark">{filtered.length}</span> of {trackers.length} routes
        </p>
        <p className="text-[11px] text-aero-muted">Click column headers to sort</p>
      </div>

      {/* ── Table ── */}
      <div className="aero-card overflow-hidden animate-fade-up" style={{ animationDelay: "150ms" }}>
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px_44px] gap-4 px-5 py-3 border-b border-aero-border bg-aero-bg/60">
          <SortBtn label="Route"   col="route"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <SortBtn label="Price"   col="price"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <SortBtn label="Change"  col="change"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <SortBtn label="Volume"  col="volume"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-aero-muted">Trend</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-aero-muted">Alert</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">✈️</div>
            <p className="text-aero-mid font-medium">No routes match your filters</p>
            <p className="text-sm text-aero-muted mt-1">Try adjusting or clearing the filters above</p>
          </div>
        ) : (
          <div className="divide-y divide-aero-border">
            {filtered.map((t, i) => (
              <div
                key={t.id}
                className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px_44px] gap-4 px-5 py-3.5 items-center hover:bg-aero-bg/50 transition-colors duration-150 cursor-pointer group"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {/* Route */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-aero-bg border border-aero-border flex items-center justify-center shrink-0">
                    <Plane className="w-3.5 h-3.5 text-aero-primary rotate-45" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-bold text-aero-dark text-sm">
                      <span>{t.from}</span>
                      <span className="text-aero-border">›</span>
                      <span>{t.to}</span>
                      <span className="hidden lg:inline text-[10px] text-aero-muted font-normal ml-1 border border-aero-border px-1.5 py-0.5 rounded-full">
                        {t.stops}
                      </span>
                    </div>
                    <div className="text-[11px] text-aero-muted truncate">{t.fromCity} → {t.toCity}</div>
                    <div className="text-[10px] text-aero-muted/70">{t.airline} · {t.cabin}</div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <div className="text-base font-bold text-aero-dark tabular-nums">₹{t.price.toLocaleString()}</div>
                  <div className="text-[11px] text-aero-muted">{t.dates}</div>
                </div>

                {/* Change badge */}
                <div>
                  <ChangeBadge t={t} />
                  <div className="text-[10px] text-aero-muted mt-1">was ₹{t.prevPrice.toLocaleString()}</div>
                </div>

                {/* Volume */}
                <div>
                  <div className="text-sm font-semibold text-aero-dark tabular-nums">{t.volume.toLocaleString()}</div>
                  <div className="text-[10px] text-aero-muted">quotes/day</div>
                </div>

                {/* Sparkline */}
                <Sparkline data={t.data} change={t.change} />

                {/* Alert toggle */}
                <button
                  onClick={e => { e.stopPropagation(); toggleAlert(t.id); }}
                  className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                    t.alertOn
                      ? "bg-aero-primary text-white shadow-aero-sm"
                      : "bg-aero-bg border border-aero-border text-aero-muted hover:border-aero-primary hover:text-aero-primary"
                  )}
                  title={t.alertOn ? "Disable alert" : "Enable alert"}
                >
                  {t.alertOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-aero-border bg-aero-bg/40 flex items-center justify-between">
          <p className="text-[11px] text-aero-muted">
            Data collected via Jevons-Lowe methodology · Min 20s between requests · robots.txt honoured
          </p>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="text-[11px] font-medium text-aero-dark">Live pipeline</span>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Chip helper ── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-aero-badge text-aero-primary text-[11px] font-semibold rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-aero-dark transition-colors"><X className="w-3 h-3" /></button>
    </span>
  );
}
