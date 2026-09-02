"use client";

/**
 * StatisticalSummaryTable — Methodology Disclosure Block
 *
 * A formal NSO-style methodology table displayed on the main dashboard.
 * Presents the index definition, collection methodology, and quality gates
 * in the structured tabular format a statistical reviewer expects.
 *
 * This is the "box" that appears in official NSO publication PDFs —
 * here rendered inline as a first-class UI element, not buried in a sidebar.
 */

import { fetchPipelineStatus, PipelineStatus, pct } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";
import { BookOpen, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface MetaRow {
  label: string;
  value: React.ReactNode;
}

export default function StatisticalSummaryTable() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineStatus().then(({ data, error }) => {
      setStatus(data);
      setError(error);
    });
  }, []);

  if (error) return <ErrorBlock error={error} />;
  if (!status) return <Skeleton className="h-64 w-full" />;

  const { methodology, panel } = status;

  const rows: MetaRow[] = [
    {
      label: "Index Type",
      value: (
        <span>
          Domestic Airfare Price Index (DAPI) — Lowe aggregate of Jevons elementary indices
        </span>
      ),
    },
    {
      label: "Elementary Formula",
      value: (
        <span>
          <strong>Jevons</strong> — geometric mean of price relatives (avoids Carli upward bias; unit-invariant unlike Dutot)
        </span>
      ),
    },
    {
      label: "Aggregation",
      value: (
        <span>
          <strong>Lowe</strong> with DGCA traffic weights (vintage{" "}
          <code className="rounded bg-aero-badge px-1 py-0.5 text-[10px] text-aero-primary">
            {methodology.weightsVintage}
          </code>
          )
        </span>
      ),
    },
    {
      label: "Base Period",
      value: <span><strong>{methodology.basePeriod}</strong> = 100</span>,
    },
    {
      label: "Panel Scope",
      value: (
        <span>
          {panel.routes} directional O-D pairs · 23 airports · 6 origin hubs
        </span>
      ),
    },
    {
      label: "Booking Horizons",
      value: (
        <span>
          {panel.horizons.join(", ")} days before departure → {panel.strata} strata
        </span>
      ),
    },
    {
      label: "Collection Schedule",
      value: (
        <span>
          3 IST slots: <strong>07:00, 13:00, 20:00</strong> (±15 min tolerance) ·{" "}
          ~1,155 stratum-slots/day
        </span>
      ),
    },
    {
      label: "Data Quality Gate (M5)",
      value: (
        <span>
          Publication refused if imputed weight share &gt;{" "}
          <strong className="text-amber-700">{pct(methodology.imputationCeiling, 0)}</strong>.
          Coverage hole published, not silently backfilled.
        </span>
      ),
    },
    {
      label: "Reproducibility (M6)",
      value: (
        <span>
          100% bit-identical re-runs guaranteed via append-only{" "}
          <code className="rounded bg-aero-badge px-1 py-0.5 text-[10px] text-aero-primary">quote_raw</code>{" "}
          + SHA-256 config hash on every artifact
        </span>
      ),
    },
    {
      label: "Revision Policy",
      value: (
        <span>
          Provisional 7 days · revised once on day 7 · <strong>frozen after revision</strong>.
          No silent corrections — every revision is committed with reason.
        </span>
      ),
    },
    {
      label: "Compliance",
      value: (
        <span>
          No authentication evasion · robots.txt honoured at runtime · ≥20 s between requests ·
          explicit User-Agent · no CAPTCHA solving · no proxies
        </span>
      ),
    },
    {
      label: "Weight Source",
      value: (
        <a
          href="https://github.com/Vonter/india-aviation-traffic"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-aero-primary hover:underline"
        >
          DGCA via Vonter/india-aviation-traffic (ODbL)
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
  ];

  return (
    <div className="stat-card overflow-hidden">
      {/* Publication-style header */}
      <div className="flex items-center justify-between gap-3 border-b border-aero-border bg-aero-bg/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-aero-primary" />
          <h2 className="text-sm font-bold text-aero-dark">Index Methodology</h2>
          <span className="rounded bg-aero-badge px-2 py-0.5 font-mono text-[9px] font-semibold text-aero-primary">
            SIH26056
          </span>
        </div>
        <Link
          href="/methodology"
          className="flex items-center gap-1 text-[11px] font-semibold text-aero-primary transition-colors hover:text-aero-primary2"
        >
          Full methodology document <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-4 py-3">
        {rows.map((row) => (
          <div key={row.label} className="stat-row">
            <span className="stat-row-label shrink-0 w-44">{row.label}</span>
            <span className="text-[11px] leading-relaxed text-aero-mid text-right">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-aero-border bg-aero-bg/40 px-4 py-2.5">
        <p className="text-[10px] leading-relaxed text-aero-muted">
          <strong>PS SIH26056</strong> · Ministry of Statistics and Programme Implementation (MoSPI) ·
          Smart India Hackathon 2026. This index uses the methodology a national statistical office
          would recognise. Every published number is independently verifiable from the archived panel.
        </p>
      </div>
    </div>
  );
}
