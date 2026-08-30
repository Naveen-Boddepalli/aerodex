"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck, Fingerprint, Copy, Check, Ban, Terminal, Scale,
} from "lucide-react";
import clsx from "clsx";
import { fetchPipelineStatus, PipelineStatus, shortHash, pct } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";

/**
 * The integrity panel: what produced the number on this page, and how anyone
 * else could reproduce it.
 *
 * This replaces the sponsored-offer cards that used to sit here. Fabricated
 * airline promotions on a government-statistics product are a liability, not a
 * feature — and the hashes, the imputation ceiling and the refusal path are the
 * things that actually distinguish AeroDex from a fare-scraper dashboard.
 */

function HashRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — the full hash is still in the title attribute */
    }
  }

  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-[11px] font-medium text-aero-muted">{label}</span>
      <button
        onClick={copy}
        title={value}
        className="group flex items-center gap-1.5 font-mono text-[11px] text-aero-mid transition-colors hover:text-aero-primary"
      >
        {shortHash(value)}
        {copied
          ? <Check className="h-3 w-3 text-green-600" />
          : <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />}
      </button>
    </div>
  );
}

function Gauge({
  label, value, floor, ceiling, format,
}: {
  label: string;
  value: number;
  /** Pass for a higher-is-better metric (coverage): the bar fills to `value`. */
  floor?: number;
  /** Pass for a lower-is-better metric (imputation): the bar fills to value/ceiling. */
  ceiling?: number;
  format: (v: number) => string;
}) {
  // Both bars fill left-to-right in the direction the reader expects: coverage
  // fills as it approaches 100%, imputation fills as it approaches its ceiling.
  // A near-empty imputation bar and a near-full coverage bar both mean "good".
  const higherIsBetter = floor !== undefined;
  const fill = higherIsBetter
    ? Math.min(Math.max(value, 0), 1)
    : ceiling && ceiling > 0 ? Math.min(value / ceiling, 1) : 0;
  const ok = higherIsBetter ? value >= floor : ceiling !== undefined && value <= ceiling;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-aero-muted">{label}</span>
        <span className={clsx("shrink-0 text-xs font-bold tabular-nums", ok ? "text-green-600" : "text-red-500")}>
          {format(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-aero-badge">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", ok ? "bg-green-500" : "bg-red-500")}
          style={{ width: `${Math.max(fill * 100, 3)}%` }}
        />
      </div>
    </div>
  );
}

export default function IndexProvenance() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineStatus().then(({ data, error }) => {
      setStatus(data);
      setError(error);
    });
  }, []);

  if (error) return <ErrorBlock error={error} />;

  if (!status) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { hashes, methodology, quality, compliance, panel, verify, refusalDemo, run } = status;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Reproducibility ── */}
      <div className="aero-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-aero-border bg-aero-bg/60 px-4 py-3">
          <Fingerprint className="h-4 w-4 text-aero-primary" />
          <h3 className="text-sm font-bold text-aero-dark">Reproducibility</h3>
        </div>
        <div className="px-4 py-3">
          <div className="divide-y divide-aero-border">
            <HashRow label="Methodology config" value={hashes.config} />
            <HashRow label="Archived panel" value={hashes.panel} />
            <HashRow label="Published output" value={hashes.output} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-aero-border pt-3">
            <span className="text-[11px] font-medium text-aero-muted">Weights vintage</span>
            <span className="rounded-full bg-aero-badge px-2 py-0.5 font-mono text-[10px] font-semibold text-aero-primary">
              {methodology.weightsVintage}
            </span>
          </div>
          <div className="mt-3 rounded-xl bg-aero-dark p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-aero-sky">
              <Terminal className="h-3 w-3" />
              Verify it yourself
            </div>
            <code className="block break-all text-[10px] leading-relaxed text-white/90">
              {verify.command}
            </code>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-aero-muted">{verify.description}</p>
        </div>
      </div>

      {/* ── Quality gates ── */}
      <div className="aero-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-aero-border bg-aero-bg/60 px-4 py-3">
          <ShieldCheck className="h-4 w-4 text-aero-primary" />
          <h3 className="text-sm font-bold text-aero-dark">Quality gates</h3>
        </div>
        <div className="flex flex-col gap-3.5 px-4 py-4">
          <Gauge
            label="Coverage ratio (min over run)"
            value={quality.minCoverageRatio}
            floor={0.95}
            format={(v) => pct(v, 2)}
          />
          <Gauge
            label={`Imputed weight share (M5 ceiling ${pct(methodology.imputationCeiling, 0)})`}
            value={quality.maxImputedWeightShare}
            ceiling={methodology.imputationCeiling}
            format={(v) => pct(v, 2)}
          />
          <div className="grid grid-cols-2 gap-3 border-t border-aero-border pt-3 text-center">
            <div>
              <div className="text-lg font-bold tabular-nums text-aero-dark">
                {panel.strata.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-aero-muted">strata indexed</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums text-aero-dark">
                {panel.rows.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-aero-muted">panel rows</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-aero-border pt-3 text-[11px]">
            <span className="text-aero-muted">Formula</span>
            <span className="font-semibold capitalize text-aero-dark">
              {methodology.elementary} elementary · {methodology.aggregation} aggregate
            </span>
          </div>
          {panel.coverageHole && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800">
              <strong>Known gap:</strong> {panel.coverageHole.route} at{" "}
              {panel.coverageHole.horizons.join("d, ")}d horizons over{" "}
              {panel.coverageHole.periods.length} periods. Imputed and disclosed rather than
              silently backfilled.
            </p>
          )}
        </div>
      </div>

      {/* ── Refusal path ── */}
      {refusalDemo?.refusal && (
        <div className="aero-card overflow-hidden border-red-200">
          <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-3">
            <Ban className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-bold text-red-900">The publisher refuses bad runs</h3>
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] leading-relaxed text-aero-mid">
              A companion run in <code className="rounded bg-aero-badge px-1 text-[10px]">demo/breach/</code>{" "}
              carries a coverage hole large enough to push imputed weight to{" "}
              <strong className="tabular-nums text-red-600">
                {pct(refusalDemo.max_imputed_weight_share ?? 0, 1)}
              </strong>
              , past the {pct(methodology.imputationCeiling, 0)} ceiling. It produces no artifacts —
              the failure is a refusal, not a footnote.
            </p>
            {refusalDemo.breached_periods && (
              <div className="mt-2 flex flex-wrap gap-1">
                {refusalDemo.breached_periods.map((p) => (
                  <span key={p} className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-red-700">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Compliance ── */}
      <div className="aero-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-aero-border bg-aero-bg/60 px-4 py-3">
          <Scale className="h-4 w-4 text-aero-primary" />
          <h3 className="text-sm font-bold text-aero-dark">Collection ethics</h3>
        </div>
        <ul className="flex flex-col gap-2 px-4 py-3">
          {compliance.rules.map((rule) => (
            <li key={rule} className="flex items-start gap-2 text-[11px] leading-relaxed text-aero-mid">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
              {rule}
            </li>
          ))}
        </ul>
        <p className="border-t border-aero-border px-4 py-2.5 text-[10px] text-aero-muted">
          Enforced as runtime assertions in <code className="text-aero-primary">aerodex/compliance.py</code>,
          so breaking one requires editing a file called <em>compliance</em>.
        </p>
      </div>

      {/* ── Run identity ── */}
      <div className="rounded-2xl border border-aero-border bg-aero-bg/70 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-aero-muted">
          This run
        </div>
        <div className="mt-1 text-[11px] leading-relaxed text-aero-mid">
          {run.days} daily periods, {run.start} → {run.end}, {run.slot} slot · source{" "}
          <code className="rounded bg-white px-1 text-[10px] text-aero-primary">{run.source}</code>
        </div>
      </div>
    </div>
  );
}
