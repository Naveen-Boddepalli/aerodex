"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight, Plane, CalendarClock, Search, Clock, Loader2, Layers, ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import {
  fetchRoutes, fetchSearch, inr, formatDate,
  PanelRoute, SearchResponse,
} from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";

/**
 * Query the panel: pick an O–D pair and a booking horizon, get back the actual
 * quotes AeroDex collected for that stratum in the latest period.
 *
 * Deliberately *not* a booking form. AeroDex measures fares, it does not sell
 * them, so there is no passenger count, no cabin picker and no "Book" button —
 * the controls are the two things the panel is actually indexed on: the route
 * and how far ahead of departure the quote was taken.
 */

function DurationLabel({ minutes }: { minutes: number }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return <>{h}h {m.toString().padStart(2, "0")}m</>;
}

export default function RouteExplorer() {
  const [routes, setRoutes] = useState<PanelRoute[]>([]);
  const [horizons, setHorizons] = useState<number[]>([]);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [horizon, setHorizon] = useState(7);

  const [result, setResult] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Which query the current `result` answers. Comparing it to the query the
  // controls are currently asking for gives us "searching" without a loading
  // flag that has to be set and cleared in lockstep with the fetch.
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchRoutes().then(({ data, error }) => {
      if (cancelled) return;
      setRoutesError(error);
      if (!data) return;
      setRoutes(data.routes);
      setHorizons(data.horizons);
      if (data.horizons.length && !data.horizons.includes(horizon)) {
        setHorizon(data.horizons[Math.floor(data.horizons.length / 2)]);
      }
    });
    return () => { cancelled = true; };
    // The panel definition is static config — fetched once, and `horizon` is
    // only read to validate the initial value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The panel is hub-and-spoke: only some airports are collected as origins,
  // and each origin reaches its own set of destinations.
  const origins = useMemo(
    () => Array.from(new Map(routes.map((r) => [r.origin.iata, r.origin])).values())
      .sort((a, b) => a.city.localeCompare(b.city)),
    [routes],
  );

  const destinations = useMemo(
    () => routes
      .filter((r) => r.origin.iata === origin)
      .map((r) => r.destination)
      .sort((a, b) => a.city.localeCompare(b.city)),
    [routes, origin],
  );

  const selectedRoute = useMemo(
    () => routes.find((r) => r.origin.iata === origin && r.destination.iata === destination),
    [routes, origin, destination],
  );

  const reverseExists = useMemo(
    () => routes.some((r) => r.origin.iata === destination && r.destination.iata === origin),
    [routes, origin, destination],
  );

  const requestKey = `${origin}|${destination}|${horizon}|${nonce}`;
  const searching = selectedRoute != null && resultKey !== requestKey;

  // Query on every control change — the dataset is local and the response is
  // small, so making the user press a button adds nothing.
  useEffect(() => {
    if (!selectedRoute) return;
    let cancelled = false;
    fetchSearch(origin, destination, horizon).then(({ data, error }) => {
      if (cancelled) return;
      setResult(data);
      setSearchError(error);
      setResultKey(requestKey);
    });
    return () => { cancelled = true; };
  }, [selectedRoute, origin, destination, horizon, requestKey]);

  // Changing the origin can invalidate the destination — the panel is
  // hub-and-spoke, so DEL's spokes are not BLR's. Repair it in the handler
  // rather than letting an invalid pair render and correcting it afterwards.
  function pickOrigin(next: string) {
    setOrigin(next);
    const reachable = routes.filter((r) => r.origin.iata === next).map((r) => r.destination.iata);
    if (reachable.length && !reachable.includes(destination)) {
      setDestination([...reachable].sort()[0]);
    }
  }

  function swap() {
    if (!reverseExists) return;
    const o = origin;
    setOrigin(destination);
    setDestination(o);
  }

  if (routesError) {
    return (
      <div className="aero-card p-6">
        <ErrorBlock error={routesError} />
      </div>
    );
  }

  const cheapest = result?.quotes[0];

  return (
    <div className="aero-card overflow-hidden shadow-aero-md">
      {/* ── Controls ── */}
      <div className="border-b border-aero-border bg-gradient-to-br from-white to-[#F6F9FF] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-aero-dark">
              <Layers className="h-4 w-4 text-aero-primary" />
              Query the panel
            </h2>
            <p className="mt-0.5 text-xs text-aero-muted">
              Every quote AeroDex collected for one route and booking horizon. Not a booking search.
            </p>
          </div>
          {selectedRoute && (
            <div className="rounded-xl border border-aero-border bg-white px-3 py-1.5 text-right">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-aero-muted">
                DGCA panel weight
              </div>
              <div className="text-sm font-bold tabular-nums text-aero-primary">
                {(selectedRoute.weight * 100).toFixed(3)}%
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1.1fr]">
          {/* Origin */}
          <div>
            <label htmlFor="origin" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-aero-muted">
              Origin hub
            </label>
            <div className="relative rounded-xl border border-aero-border bg-aero-bg p-3 transition-colors focus-within:border-aero-primary">
              <div className="flex items-start gap-2">
                <Plane className="mt-0.5 h-4 w-4 shrink-0 rotate-45 text-aero-primary" />
                <div className="min-w-0 flex-1 relative">
                  <select
                    id="origin"
                    value={origin}
                    onChange={(e) => pickOrigin(e.target.value)}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-2xl font-bold leading-none text-aero-dark focus:outline-none"
                  >
                    {origins.map((a) => (
                      <option key={a.iata} value={a.iata}>{a.iata}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1.5 h-5 w-5 text-aero-muted" />
                  <div className="mt-1 truncate text-xs text-aero-muted">
                    {origins.find((a) => a.iata === origin)?.city ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Swap */}
          <div className="hidden justify-center pb-5 lg:flex">
            <button
              onClick={swap}
              disabled={!reverseExists}
              title={reverseExists ? "Swap direction" : "The reverse direction is not in the panel"}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-aero-border bg-white text-aero-mid transition-all duration-150 hover:border-aero-primary hover:text-aero-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-aero-border disabled:hover:text-aero-mid"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-aero-muted">
              Destination
            </label>
            <div className="relative rounded-xl border border-aero-border bg-aero-bg p-3 transition-colors focus-within:border-aero-primary">
              <div className="flex items-start gap-2">
                <Plane className="mt-0.5 h-4 w-4 shrink-0 text-aero-sky" />
                <div className="min-w-0 flex-1 relative">
                  <select
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-2xl font-bold leading-none text-aero-dark focus:outline-none"
                  >
                    {destinations.map((a) => (
                      <option key={a.iata} value={a.iata}>{a.iata}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1.5 h-5 w-5 text-aero-muted" />
                  <div className="mt-1 truncate text-xs text-aero-muted">
                    {destinations.find((a) => a.iata === destination)?.city ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Horizon */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-aero-muted">
              Booking horizon
            </label>
            <div className="flex flex-wrap gap-1 rounded-xl border border-aero-border bg-aero-bg p-1.5">
              {horizons.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={clsx(
                    "flex-1 rounded-lg px-2 py-2 text-xs font-semibold tabular-nums transition-all duration-150",
                    horizon === h
                      ? "bg-aero-primary text-white shadow-aero-sm"
                      : "text-aero-mid hover:bg-white hover:text-aero-dark",
                  )}
                >
                  {h}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Context line */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-aero-mid">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-aero-muted" />
            Collected {formatDate(result?.collectedOn)} · departure {formatDate(result?.departureDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-aero-muted" />
            {result ? `${result.nQuotes} quotes in this stratum` : "—"}
          </span>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="p-5 sm:p-6">
        {searchError ? (
          <ErrorBlock error={searchError} retry={() => setNonce((n) => n + 1)} />
        ) : searching && !result ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : result ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-aero-dark">
                {result.originCity} → {result.destinationCity}
                <span className="ml-2 font-medium text-aero-muted">
                  · {result.horizonDays} days before departure
                </span>
              </h3>
              {searching && <Loader2 className="h-4 w-4 animate-spin text-aero-primary" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-aero-border text-left">
                    {["Flight", "Airline", "Stops", "Departs", "Duration", "Fare"].map((h) => (
                      <th
                        key={h}
                        className={clsx(
                          "pb-2 text-[10px] font-semibold uppercase tracking-wider text-aero-muted",
                          h === "Fare" && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-aero-border">
                  {result.quotes.map((q) => {
                    const isCheapest = q.itineraryKey === cheapest?.itineraryKey;
                    return (
                      <tr
                        key={q.itineraryKey}
                        className={clsx(
                          "transition-colors duration-150",
                          isCheapest ? "bg-green-50/50" : "hover:bg-aero-bg/60",
                        )}
                      >
                        <td className="py-3 pr-3">
                          <span className="font-mono text-xs font-semibold text-aero-dark">
                            {q.flight}
                          </span>
                          {isCheapest && (
                            <span className="ml-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-700">
                              Cheapest
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-aero-mid">{q.airline}</td>
                        <td className="py-3 pr-3">
                          <span
                            className={clsx(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              q.stops === 0
                                ? "bg-aero-badge text-aero-primary"
                                : "bg-aero-bg text-aero-mid",
                            )}
                          >
                            {q.stopsLabel}
                          </span>
                        </td>
                        <td className="py-3 pr-3 capitalize text-aero-mid">{q.departureBucket}</td>
                        <td className="py-3 pr-3 tabular-nums text-aero-mid">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-aero-muted" />
                            <DurationLabel minutes={q.durationMinutes} />
                          </span>
                        </td>
                        <td
                          className={clsx(
                            "py-3 text-right font-bold tabular-nums",
                            isCheapest ? "text-green-600" : "text-aero-dark",
                          )}
                        >
                          {inr(q.fare)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-aero-muted">
              All-inclusive economy fares as collected in the {result.collectedOn} morning slot.
              Departure buckets are the methodology&apos;s four time-of-day strata, not exact
              departure times.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        )}
      </div>
    </div>
  );
}
