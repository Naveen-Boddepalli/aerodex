"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  TrendingDown, TrendingUp, Minus, ArrowUpDown, ArrowUp, ArrowDown,
  Filter, Search, Plane, ChevronDown, X, SlidersHorizontal, ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from "recharts";
import { fetchTrackers, Tracker, inr } from "@/lib/api";
import { ErrorBlock, EmptyBlock, Skeleton } from "@/components/states";
import DataSourceBanner from "@/components/DataSourceBanner";

/**
 * Every route in the panel, sortable and filterable.
 *
 * The old version carried a per-row bell toggle that only ever flipped local
 * state — nothing subscribed, nothing persisted, and the count fed a
 * "Alerts Active" stat card. It is gone; rows link to the route detail instead,
 * and real threshold crossings live on /alerts.
 */

type Change = "drop" | "rise" | "stable";
type SortKey = "route" | "price" | "change" | "volume" | "weight";
type SortDir = "asc" | "desc";

const STOPS = ["All stops", "Direct", "1 Stop"];
const CHANGES = ["All changes", "drop", "rise", "stable"];

const TONE: Record<Change, string> = {
  drop: "#12B76A",
  rise: "#F04438",
  stable: "#6172A0",
};

const MiniTooltip = ({
  active, payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { period: string } }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded bg-aero-dark px-1.5 py-1 text-[10px] text-white shadow-lg">
      <div className="font-semibold">{inr(payload[0].value)}</div>
      <div className="text-white/60">{payload[0].payload.period}</div>
    </div>
  );
};

function Sparkline({ id, data, change }: { id: string; data: Tracker["data"]; change: Change }) {
  const color = TONE[change];
  const gradientId = `sg-${id}`;
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Recharts defaults a numeric axis to [0, max]. Fares sit around
              ₹9,000, so without this the whole series compresses into a flat
              band at the top of a 32px box and the trend is invisible. */}
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} isAnimationActive={false} />
          <Tooltip content={<MiniTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChangeBadge({ t }: { t: Tracker }) {
  if (t.change === "drop")
    return (
      <span className="aero-badge-drop">
        <TrendingDown className="h-3 w-3" />
        −{inr(t.changeAmt)} · −{t.changePct}%
      </span>
    );
  if (t.change === "rise")
    return (
      <span className="aero-badge-rise">
        <TrendingUp className="h-3 w-3" />
        +{inr(t.changeAmt)} · +{t.changePct}%
      </span>
    );
  return (
    <span className="aero-badge-stable">
      <Minus className="h-3 w-3" />
      Stable
    </span>
  );
}

function SortBtn({
  label, col, sortKey, sortDir, onSort, align,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (c: SortKey) => void;
  align?: "right";
}) {
  const active = sortKey === col;
  return (
    <button
      onClick={() => onSort(col)}
      className={clsx(
        "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150",
        align === "right" && "justify-end",
        active ? "text-aero-primary" : "text-aero-muted hover:text-aero-mid",
      )}
    >
      {label}
      {active
        ? sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-aero-badge px-2.5 py-1 text-[11px] font-semibold text-aero-primary">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label} filter`} className="transition-colors hover:text-aero-dark">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

const GRID = "grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_80px_24px]";

export default function PriceTrackingPage() {
  const [search, setSearch] = useState("");
  const [airline, setAirline] = useState("All airlines");
  const [stops, setStops] = useState("All stops");
  const [changeF, setChangeF] = useState("All changes");
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [trackers, setTrackers] = useState<Tracker[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackers(60).then(({ data, error }) => {
      setTrackers(data);
      setError(error);
    });
  }, []);

  const list = useMemo(() => trackers ?? [], [trackers]);

  const AIRLINES = useMemo(
    () => ["All airlines", ...Array.from(new Set(list.map((t) => t.airline))).sort()],
    [list],
  );

  function handleSort(col: SortKey) {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    let out = list;
    if (search)
      out = out.filter((t) =>
        `${t.from}${t.to}${t.fromCity}${t.toCity}${t.airline}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    if (airline !== "All airlines") out = out.filter((t) => t.airline === airline);
    if (stops !== "All stops") out = out.filter((t) => t.stops === stops);
    if (changeF !== "All changes") out = out.filter((t) => t.change === changeF);

    return [...out].sort((a, b) => {
      if (sortKey === "route") {
        const va = `${a.from}-${a.to}`;
        const vb = `${b.from}-${b.to}`;
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const pick = (t: Tracker) =>
        sortKey === "price" ? t.price
        : sortKey === "change" ? (t.change === "drop" ? -t.changePct : t.changePct)
        : sortKey === "volume" ? t.volume
        : t.weight;
      return sortDir === "asc" ? pick(a) - pick(b) : pick(b) - pick(a);
    });
  }, [list, search, airline, stops, changeF, sortKey, sortDir]);

  const drops = list.filter((t) => t.change === "drop").length;
  const rises = list.filter((t) => t.change === "rise").length;
  const stable = list.filter((t) => t.change === "stable").length;
  const period = list[0]?.period ?? "";
  const hasFilters =
    airline !== "All airlines" || stops !== "All stops" || changeF !== "All changes" || !!search;

  return (
    <div className="pb-16 pt-8">
      {/* ── Header ── */}
      <div className="animate-fade-up mb-6">
        <DataSourceBanner />
      </div>
      <div className="animate-fade-up mb-6" style={{ animationDelay: "40ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-aero-primary" />
          <span className="aero-label">60-route panel</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-aero-dark sm:text-4xl">
          Route tracking
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-aero-mid">
          Every O–D pair in the panel, with its median fare, movement since the previous
          collection period, and DGCA weight.
        </p>
      </div>

      {error ? (
        <ErrorBlock error={error} />
      ) : (
        <>
          {/* ── Summary strip ── */}
          <div className="animate-fade-up mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "60ms" }}>
            {[
              { label: "Fell", value: drops, icon: <TrendingDown className="h-4 w-4" />, color: "text-green-600", bg: "bg-green-50" },
              { label: "Rose", value: rises, icon: <TrendingUp className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-50" },
              { label: "Stable (±1%)", value: stable, icon: <Minus className="h-4 w-4" />, color: "text-aero-stable", bg: "bg-aero-badge" },
              { label: "Routes", value: list.length, icon: <Plane className="h-4 w-4 rotate-45" />, color: "text-aero-primary", bg: "bg-blue-50" },
            ].map((s) => (
              <div key={s.label} className="aero-card flex items-center gap-3 p-4">
                <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", s.bg, s.color)}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-aero-dark">
                    {trackers ? s.value : "—"}
                  </div>
                  <div className="text-[11px] font-medium text-aero-muted">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="aero-card animate-fade-up mb-4 p-4" style={{ animationDelay: "100ms" }}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-aero-muted" />
                <input
                  type="text"
                  placeholder="Search route, city or airline…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="aero-input pl-10"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-aero-muted hover:text-aero-dark"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters((f) => !f)}
                className={clsx(
                  "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 sm:hidden",
                  showFilters ? "border-aero-primary bg-aero-primary text-white" : "border-aero-border text-aero-mid",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>

              <div className={clsx("flex-wrap gap-3", showFilters ? "flex" : "hidden sm:flex")}>
                {[
                  { value: airline, set: setAirline, options: AIRLINES, width: "min-w-[140px]" },
                  { value: stops, set: setStops, options: STOPS, width: "min-w-[110px]" },
                ].map((f, i) => (
                  <div key={i} className="relative">
                    <select
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className={clsx("aero-input cursor-pointer appearance-none py-2.5 pr-8 text-sm", f.width)}
                    >
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-aero-muted" />
                  </div>
                ))}

                <div className="relative">
                  <select
                    value={changeF}
                    onChange={(e) => setChangeF(e.target.value)}
                    className="aero-input min-w-[130px] cursor-pointer appearance-none py-2.5 pr-8 text-sm"
                  >
                    {CHANGES.map((c) => (
                      <option key={c} value={c}>
                        {c === "All changes" ? "All changes" : c === "drop" ? "Fell" : c === "rise" ? "Rose" : "Stable"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-aero-muted" />
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-aero-border pt-3">
                <span className="flex items-center gap-1 text-[11px] font-medium text-aero-muted">
                  <Filter className="h-3 w-3" /> Active:
                </span>
                {search && <Chip label={`“${search}”`} onRemove={() => setSearch("")} />}
                {airline !== "All airlines" && <Chip label={airline} onRemove={() => setAirline("All airlines")} />}
                {stops !== "All stops" && <Chip label={stops} onRemove={() => setStops("All stops")} />}
                {changeF !== "All changes" && (
                  <Chip
                    label={changeF === "drop" ? "Fell" : changeF === "rise" ? "Rose" : "Stable"}
                    onRemove={() => setChangeF("All changes")}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Count ── */}
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm text-aero-muted">
              Showing <span className="font-semibold text-aero-dark">{filtered.length}</span> of{" "}
              {list.length} routes
            </p>
            <p className="hidden text-[11px] text-aero-muted sm:block">Click a header to sort</p>
          </div>

          {/* ── Table ── */}
          <div className="aero-card animate-fade-up overflow-hidden" style={{ animationDelay: "150ms" }}>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className={clsx("grid gap-4 border-b border-aero-border bg-aero-bg/60 px-5 py-3", GRID)}>
                  <SortBtn label="Route" col="route" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-aero-muted">Cabin</span>
                  <SortBtn label="Median fare" col="price" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortBtn label="Change" col="change" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortBtn label="Weight" col="weight" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-aero-muted">Trend</span>
                  <span />
                </div>

                {!trackers ? (
                  <div className="flex flex-col gap-2 p-5">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-5">
                    <EmptyBlock message="No route matches these filters. Try clearing one." />
                  </div>
                ) : (
                  <div className="divide-y divide-aero-border">
                    {filtered.map((t) => (
                      <Link
                        key={t.id}
                        href={`/routes/${t.from}/${t.to}`}
                        className={clsx(
                          "group grid items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-aero-bg/50",
                          GRID,
                        )}
                      >
                        {/* Route */}
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-aero-border bg-aero-bg">
                            <Plane className="h-3.5 w-3.5 rotate-45 text-aero-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-sm font-bold text-aero-dark">
                              <span>{t.from}</span>
                              <span className="text-aero-border">›</span>
                              <span>{t.to}</span>
                              <span className="ml-1 hidden rounded-full border border-aero-border px-1.5 py-0.5 text-[10px] font-normal text-aero-muted lg:inline">
                                {t.stops}
                              </span>
                            </div>
                            <div className="truncate text-[11px] text-aero-muted">
                              {t.fromCity} → {t.toCity}
                            </div>
                            <div className="truncate text-[10px] text-aero-muted/70">
                              cheapest on {t.airline}
                            </div>
                          </div>
                        </div>

                        {/* Cabin */}
                        <div className="min-w-0 flex items-center">
                          <span className="rounded-full bg-aero-primary/10 px-2 py-1 text-[11px] font-medium text-aero-primary">
                            {t.cabin}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="min-w-0">
                          <div className="text-base font-bold tabular-nums text-aero-dark">
                            {inr(t.price)}
                          </div>
                          <div className="truncate text-[11px] text-aero-muted">
                            best {inr(t.bestPrice)}
                          </div>
                        </div>

                        {/* Change */}
                        <div className="min-w-0">
                          <ChangeBadge t={t} />
                          <div className="mt-1 text-[10px] text-aero-muted">
                            was {inr(t.prevPrice)}
                          </div>
                        </div>

                        {/* Weight */}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tabular-nums text-aero-dark">
                            {(t.weight * 100).toFixed(2)}%
                          </div>
                          <div className="text-[10px] text-aero-muted">{t.volume} quotes</div>
                        </div>

                        <Sparkline id={t.id} data={t.data} change={t.change} />

                        <ChevronRight className="h-4 w-4 text-aero-muted opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-aero-border bg-aero-bg/40 px-5 py-3">
              <p className="text-[11px] text-aero-muted">
                Median all-inclusive economy fare across seven booking horizons · Jevons–Lowe
                methodology · min 20s between requests, robots.txt honoured
              </p>
              {period && (
                <span className="text-[11px] font-medium text-aero-dark">
                  Collection period {period}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
