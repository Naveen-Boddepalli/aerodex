"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Database, AlertTriangle, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { fetchApiHealth, ApiHealth } from "@/lib/api";

/**
 * States which dataset the dashboard is showing.
 *
 * The demo dataset is fixture-derived — no fare in it was collected from a real
 * source. The project refuses to publish that data as a measurement, so the
 * dashboard must not display it as one either. This strip is the UI half of
 * that promise: it can be collapsed to one line, never dismissed.
 */
export default function DataSourceBanner() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchApiHealth().then(({ data, error }) => {
      setHealth(data);
      setError(error);
    });
  }, []);

  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <div className="min-w-0 text-xs">
          <span className="font-semibold text-red-800">API unreachable.</span>{" "}
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!health) return <div className="h-9" aria-hidden="true" />;

  if (!health.synthetic) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
        <Database className="h-4 w-4 shrink-0 text-green-700" />
        <span className="text-xs font-semibold text-green-800">
          Live database — collected quotes
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
      >
        <FlaskConical className="h-4 w-4 shrink-0 text-amber-700" />
        <span className="min-w-0 flex-1 text-xs text-amber-900">
          <strong className="font-semibold">Synthetic demo data — not a measurement.</strong>{" "}
          <span className="text-amber-800">
            Fixture-generated fares from a frozen pipeline run
            {health.period ? ` ending ${health.period}` : ""}.
          </span>
        </span>
        <ChevronDown
          className={clsx(
            "h-3.5 w-3.5 shrink-0 text-amber-700 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && (
        <p className="border-t border-amber-200 px-4 py-2.5 text-[11px] leading-relaxed text-amber-800">
          Every fare on screen came from the fixture adapter, which makes no network calls and
          prices nothing real. It exists so the dashboard has 30 periods across the full 60-route
          panel to draw. The publisher refuses this data unless{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">allow_synthetic</code> is
          passed — the refusal is the design, not an oversight. Regenerate it with{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">
            python scripts/make_demo_data.py
          </code>
          .
        </p>
      )}
    </div>
  );
}
