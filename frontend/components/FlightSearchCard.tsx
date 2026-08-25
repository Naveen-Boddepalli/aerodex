"use client";

import { useState } from "react";
import { ArrowLeftRight, ChevronDown, Search, Users, Calendar, Plane } from "lucide-react";
import clsx from "clsx";

const tripTypes = ["Round Trip", "One Way", "Multi-City"] as const;
type TripType = typeof tripTypes[number];

export default function FlightSearchCard() {
  const [tripType, setTripType] = useState<TripType>("Round Trip");
  const [directOnly, setDirectOnly] = useState(true);
  const [flexibleDates, setFlexibleDates] = useState(false);

  return (
    <div className="aero-card p-6 shadow-aero-md">
      {/* Trip type tabs */}
      <div className="flex gap-1 mb-6">
        {tripTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTripType(t)}
            className={clsx(
              "px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-150",
              tripType === t
                ? "bg-aero-primary text-white shadow-aero-sm"
                : "text-aero-mid hover:text-aero-dark hover:bg-aero-bg"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Inputs row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">

        {/* Origin */}
        <div className="relative">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-aero-muted mb-1.5">Origin</label>
          <div className="aero-card border-aero-border bg-aero-bg rounded-xl p-3 flex items-start gap-2 cursor-pointer hover:border-aero-primary transition-all duration-150">
            <Plane className="w-4 h-4 text-aero-primary mt-0.5 rotate-45 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-aero-dark leading-none">DEL</div>
              <div className="text-xs text-aero-muted mt-0.5">Indira Gandhi, IN</div>
            </div>
          </div>
        </div>

        {/* Swap + Destination */}
        <div className="relative">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-aero-muted mb-1.5">Destination</label>
          <div className="relative">
            {/* Swap button */}
            <button className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border-2 border-aero-border flex items-center justify-center hover:border-aero-primary hover:text-aero-primary hover:shadow-aero-sm transition-all duration-150 text-aero-mid hidden sm:flex">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
            <div className="aero-card border-aero-border bg-aero-bg rounded-xl p-3 flex items-start gap-2 cursor-pointer hover:border-aero-primary transition-all duration-150">
              <Plane className="w-4 h-4 text-aero-sky mt-0.5 shrink-0" />
              <div>
                <div className="text-2xl font-bold text-aero-dark leading-none">BOM</div>
                <div className="text-xs text-aero-muted mt-0.5">Chhatrapati Shivaji, IN</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-aero-muted mb-1.5">Dates</label>
          <div className="aero-card border-aero-border bg-aero-bg rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:border-aero-primary transition-all duration-150">
            <Calendar className="w-4 h-4 text-aero-primary shrink-0" />
            <div>
              <div className="text-sm font-semibold text-aero-dark">Sep 15 – Sep 22</div>
              <div className="text-xs text-aero-muted">1 Week</div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-aero-muted mb-1.5">Passengers &amp; Class</label>
          <div className="aero-card border-aero-border bg-aero-bg rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:border-aero-primary transition-all duration-150">
            <Users className="w-4 h-4 text-aero-primary shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-aero-dark">1 Adult</div>
              <div className="text-xs text-aero-muted">Economy</div>
            </div>
            <ChevronDown className="w-4 h-4 text-aero-muted" />
          </div>
        </div>
      </div>

      {/* Bottom row: toggles + button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5">
        <div className="flex items-center gap-6">
          {/* Direct flights only toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              role="switch"
              aria-checked={directOnly}
              onClick={() => setDirectOnly(!directOnly)}
              className={clsx(
                "relative inline-flex w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none",
                directOnly ? "bg-aero-primary" : "bg-aero-border"
              )}
              style={{ height: "22px", width: "40px" }}
            >
              <span className={clsx(
                "absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200",
                directOnly ? "translate-x-[18px]" : "translate-x-0"
              )} />
            </button>
            <span className="text-sm font-medium text-aero-mid">Direct flights only</span>
          </label>

          {/* Flexible dates toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              role="switch"
              aria-checked={flexibleDates}
              onClick={() => setFlexibleDates(!flexibleDates)}
              className={clsx(
                "relative inline-flex rounded-full transition-colors duration-200 focus:outline-none",
                flexibleDates ? "bg-aero-primary" : "bg-aero-border"
              )}
              style={{ height: "22px", width: "40px" }}
            >
              <span className={clsx(
                "absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200",
                flexibleDates ? "translate-x-[18px]" : "translate-x-0"
              )} />
            </button>
            <span className="text-sm font-medium text-aero-mid">Flexible dates (±3 days)</span>
          </label>
        </div>

        {/* Search button */}
        <button className="aero-btn-primary group">
          <Search className="w-4 h-4" />
          Search Flights
        </button>
      </div>
    </div>
  );
}
