"use client";

/**
 * /methodology — Full Publication-Quality Methodology Document
 *
 * A standalone page structured as a formal NSO methodology document.
 * This is a first-class artifact, not an FAQ — it mirrors the structure of
 * official statistical methodology documents (e.g., CPI Technical Notes, MoSPI releases).
 *
 * Sections:
 *   1. Publication Identification
 *   2. Scope and Coverage
 *   3. Index Formula and Aggregation
 *   4. Data Collection
 *   5. Quality Gates and Imputation
 *   6. Reproducibility and Audit Trail
 *   7. Compliance and Collection Ethics
 *   8. Revision Policy
 *   9. External Reference Datasets
 *  10. Verification Command
 */

import { useEffect, useState } from "react";
import { fetchPipelineStatus, PipelineStatus, pct, shortHash } from "@/lib/api";
import { ErrorBlock, Skeleton } from "@/components/states";
import DataSourceBanner from "@/components/DataSourceBanner";
import { Check, Copy, Terminal, ExternalLink, ShieldCheck, Scale } from "lucide-react";

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b-2 border-aero-primary pb-2">
      <span className="font-mono text-xs font-bold text-aero-primary">{number}</span>
      <h2 className="text-base font-bold tracking-tight text-aero-dark">{title}</h2>
    </div>
  );
}

function MethodRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-aero-border last:border-b-0">
      <td className="py-2.5 pr-6 align-top text-[11px] font-semibold text-aero-muted whitespace-nowrap">{label}</td>
      <td className="py-2.5 align-top text-[11px] leading-relaxed text-aero-mid">{value}</td>
    </tr>
  );
}

function CopyableHash({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* ignore */ }
  }
  return (
    <tr className="border-b border-aero-border last:border-b-0">
      <td className="py-2.5 pr-6 align-top text-[11px] font-semibold text-aero-muted whitespace-nowrap">{label}</td>
      <td className="py-2.5 align-top">
        <button
          onClick={copy}
          title={value}
          className="group flex items-center gap-1.5 font-mono text-[11px] text-aero-mid hover:text-aero-primary"
        >
          {shortHash(value)}
          {copied
            ? <Check className="h-3 w-3 text-green-600" />
            : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
      </td>
    </tr>
  );
}

export default function MethodologyPage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineStatus().then(({ data, error }) => {
      setStatus(data);
      setError(error);
    });
  }, []);

  return (
    <div className="pb-20 pt-8">
      <div className="animate-fade-up mb-5">
        <DataSourceBanner />
      </div>

      {/* ── Document Header ── */}
      <div className="animate-fade-up mb-8" style={{ animationDelay: "40ms" }}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="gov-badge">Methodology Document · MoSPI · SIH26056</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-aero-dark sm:text-4xl">
          India Domestic Airfare Price Index
        </h1>
        <p className="mt-1 text-lg font-semibold text-aero-primary">
          DAPI — Methodology and Technical Notes
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-aero-mid">
          This document describes the statistical methodology, data collection procedures,
          quality gates, and reproducibility guarantees for the AeroDex Domestic Airfare
          Price Index. It is structured to meet the standards expected of an official
          statistical release prepared for the Ministry of Statistics and Programme
          Implementation (MoSPI).
        </p>
      </div>

      {error ? (
        <ErrorBlock error={error} />
      ) : !status ? (
        <div className="flex flex-col gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {/* §1 Publication Identification */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
            <SectionHeader number="§1" title="Publication Identification" />
            <table className="w-full">
              <tbody>
                <MethodRow label="Index Name" value="India Domestic Airfare Price Index (DAPI)" />
                <MethodRow label="Problem Statement" value="SIH26056 — Ministry of Statistics and Programme Implementation (MoSPI)" />
                <MethodRow label="Organisation" value="Smart India Hackathon 2026" />
                <MethodRow label="Base Period" value={<><strong>{status.methodology.basePeriod}</strong> = 100</>} />
                <MethodRow label="Reference Period" value={status.run.end ?? "—"} />
                <MethodRow label="Publication Frequency" value="Daily (three collection slots)" />
                <MethodRow label="Data Source" value={<span className="capitalize">{status.data_source}</span>} />
                <CopyableHash label="Methodology Hash (SHA-256)" value={status.hashes.config} />
                <CopyableHash label="Panel Config Hash" value={status.hashes.panelConfig} />
                <CopyableHash label="Published Output Hash" value={status.hashes.output} />
              </tbody>
            </table>
          </div>

          {/* §2 Scope and Coverage */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <SectionHeader number="§2" title="Scope and Coverage" />
            <table className="w-full">
              <tbody>
                <MethodRow label="Panel Size" value={<>{status.panel.routes} directional origin-destination pairs</>} />
                <MethodRow label="Airports" value="23 panel airports · 6 origin hubs (DEL, BOM, BLR, MAA, HYD, CCU)" />
                <MethodRow
                  label="Booking Horizons"
                  value={<>{status.panel.horizons.join(", ")} days before departure ({status.panel.horizons.length} horizons)</>}
                />
                <MethodRow
                  label="Strata"
                  value={<>{status.panel.strata} (route × horizon) · ~{status.panel.rows.toLocaleString("en-IN")} observations in current run</>}
                />
                <MethodRow label="Booking Horizon" value="Fixed intervals (1, 3, 7, 14, 21, 30, 60 days) to accurately capture dynamic pricing elasticity while isolating lead-time effects from the index computation." />
                <MethodRow label="Cabin Class" value="Economy class only — fare index holds seat type constant" />
                <MethodRow label="Geographic Scope" value="Domestic scheduled air transport within India" />
                <MethodRow label="Temporal Scope" value={`${status.run.start ?? "—"} to ${status.run.end} (${status.run.days} periods)`} />
              </tbody>
            </table>
          </div>

          {/* §3 Index Formula */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <SectionHeader number="§3" title="Index Formula and Aggregation" />
            <div className="mb-4 rounded-xl border border-aero-border bg-aero-bg/60 p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-aero-muted">
                Stage 1 — Elementary Index (per stratum)
              </div>
              <p className="font-mono text-sm text-aero-dark">
                I<sub>s,t</sub> = ∏(p<sub>i,t</sub> / p<sub>i,0</sub>)<sup>1/n</sup>
                {"  "}(Jevons — geometric mean of price relatives)
              </p>
              <p className="mt-2 text-[11px] text-aero-muted">
                Where p<sub>i,t</sub> is the all-inclusive fare for itinerary i in period t,
                p<sub>i,0</sub> is the base period fare. Jevons is chosen over Carli (known
                upward bias) and Dutot (not unit-invariant, inappropriate for heterogeneous items).
              </p>
            </div>
            <div className="mb-4 rounded-xl border border-aero-border bg-aero-bg/60 p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-aero-muted">
                Stage 2 — Aggregate Index (Lowe)
              </div>
              <p className="font-mono text-sm text-aero-dark">
                DAPI<sub>t</sub> = Σ(w<sub>s</sub> · I<sub>s,t</sub>) / Σ(w<sub>s</sub>)
              </p>
              <p className="mt-2 text-[11px] text-aero-muted">
                Weights w<sub>s</sub> are DGCA traffic shares (vintage{" "}
                <code className="rounded bg-aero-badge px-1 text-[10px] text-aero-primary">
                  {status.methodology.weightsVintage}
                </code>
                ). Lowe aggregation uses a fixed-weight period prior to the base, appropriate
                for a volatile good where current-period quantities are unavailable.
                Fisher/Törnqvist are not used because they require current-period quantity data.
              </p>
            </div>
            <table className="w-full">
              <tbody>
                <MethodRow label="Elementary formula" value={<><strong>Jevons</strong> — geometric mean of price relatives</>} />
                <MethodRow label="Aggregation" value={<><strong>Lowe</strong> with DGCA traffic weights</>} />
                <MethodRow label="Weight vintage" value={status.methodology.weightsVintage} />
                <MethodRow label="Why not Carli" value="Carli has a known upward bias from Jensen's inequality — rejected by NSO standards" />
                <MethodRow label="Why not Fisher/Törnqvist" value="Both require current-period quantity data unavailable for in-flight pricing" />
              </tbody>
            </table>
          </div>

          {/* §4 Data Collection */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <SectionHeader number="§4" title="Data Collection" />
            <table className="w-full">
              <tbody>
                <MethodRow
                  label="Collection Schedule"
                  value={<>Three fixed IST slots: <strong>07:00, 13:00, 20:00</strong> (±15 min tolerance)</>}
                />
                <MethodRow
                  label="Scheduler"
                  value="systemd timers on Oracle Cloud A1 ARM instance (Indian IP, Mumbai/Hyderabad region)"
                />
                <MethodRow
                  label="Acquisition Method"
                  value={
                    <span>
                      3-tier fallback ladder:{" "}
                      <strong>1.</strong> Public JSON endpoint →{" "}
                      <strong>2.</strong> Internal XHR endpoint →{" "}
                      <strong>3.</strong> Playwright render (last resort only)
                    </span>
                  }
                />
                <MethodRow label="Indian IP requirement" value="Domestic fares differ by egress geography — foreign IP is a measurement error" />
                <MethodRow label="Collection target" value="~7,000 validated quotes/day · ~2.6 M rows/year" />
                <MethodRow label="Storage" value={<>Append-only <code className="rounded bg-aero-badge px-1 text-[10px] text-aero-primary">quote_raw</code> table in PostgreSQL 16 + TimescaleDB</>} />
                <MethodRow label="Redundancy" value="GitHub Actions runs the same collector 6-hourly as a backup (documented timing drift accepted for backup role)" />
              </tbody>
            </table>
          </div>

          {/* §5 Quality Gates */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "140ms" }}>
            <SectionHeader number="§5" title="Quality Gates and Imputation" />
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  M5 — Imputation Ceiling
                </div>
                <div className="text-2xl font-bold tabular-nums text-amber-800">
                  {pct(status.methodology.imputationCeiling, 0)}
                </div>
                <p className="mt-1 text-[11px] text-amber-700">
                  If the imputed weight share exceeds this ceiling, publication is <strong>refused</strong>.
                  The coverage hole is published instead. Silently backfilling is not acceptable.
                </p>
              </div>
              <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                  M6 — Reproducibility
                </div>
                <div className="text-2xl font-bold tabular-nums text-blue-800">
                  100%
                </div>
                <p className="mt-1 text-[11px] text-blue-700">
                  Every published index number is perfectly reproducible from the archived
                  panel via the SHA-256-hashed methodology config. Verified nightly by CI.
                </p>
              </div>
            </div>
            <table className="w-full">
              <tbody>
                <MethodRow label="Min. coverage ratio" value={<span className={status.quality.minCoverageRatio >= 0.95 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{pct(status.quality.minCoverageRatio, 2)}</span>} />
                <MethodRow label="Max. imputed weight" value={<span className={status.quality.maxImputedWeightShare <= status.methodology.imputationCeiling ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{pct(status.quality.maxImputedWeightShare, 2)} (ceiling: {pct(status.methodology.imputationCeiling, 0)})</span>} />
                <MethodRow label="M5 ceiling breached" value={status.quality.ceilingBreached ? <span className="font-bold text-red-600">YES — publication refused</span> : <span className="font-bold text-green-600">No</span>} />
                <MethodRow label="Imputation method" value="Carry-forward of last non-missing stratum value, weight redistributed proportionally" />
              </tbody>
            </table>
          </div>

          {/* §6 Reproducibility */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
            <SectionHeader number="§6" title="Reproducibility and Audit Trail" />
            <table className="w-full mb-4">
              <tbody>
                <CopyableHash label="Methodology config hash" value={status.hashes.config} />
                <CopyableHash label="Panel config hash" value={status.hashes.panelConfig} />
                <CopyableHash label="Archived panel hash" value={status.hashes.panel} />
                <CopyableHash label="Published output hash" value={status.hashes.output} />
                <CopyableHash label="Calendar hash" value={status.hashes.calendar} />
              </tbody>
            </table>
            <div className="rounded-xl bg-aero-dark p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-aero-sky">
                <Terminal className="h-3.5 w-3.5" />
                Verify independently
              </div>
              <code className="block break-all text-[11px] leading-relaxed text-white/90">
                {status.verify.command}
              </code>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-aero-muted">
              {status.verify.description}
            </p>
          </div>

          {/* §7 Compliance */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "180ms" }}>
            <SectionHeader number="§7" title="Compliance and Collection Ethics" />
            <div className="mb-4 flex items-center gap-2 text-[11px] text-aero-mid">
              <Scale className="h-4 w-4 text-aero-primary shrink-0" />
              <span>
                These are runtime assertions enforced in{" "}
                <code className="rounded bg-aero-badge px-1 text-[10px] text-aero-primary">
                  aerodex/compliance.py
                </code>
                , not guidelines — violating one requires editing a file named <em>compliance</em>.
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {status.compliance.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-[11px] leading-relaxed text-aero-mid">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                  {rule}
                </li>
              ))}
              <li className="flex items-start gap-2 text-[11px] leading-relaxed text-aero-mid">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                Minimum {status.compliance.minSecondsBetweenRequests}s between requests to the same host
              </li>
            </ul>
          </div>

          {/* §8 Revision Policy */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <SectionHeader number="§8" title="Revision Policy" />
            <table className="w-full">
              <tbody>
                <MethodRow label="Initial publication" value={<>Provisional — released within 2 hours of final daily slot</>} />
                <MethodRow label="Revision window" value={<>7 days · <strong>single revision on day 7</strong></>} />
                <MethodRow label="After revision" value={<><strong>Frozen</strong> — no further changes. Any correction requires a new release with documented reason.</>} />
                <MethodRow label="Revision log" value="Every re-freeze is a separate git commit with a mandatory explanation of why the index moved" />
                <MethodRow label="Revision policy" value={status.methodology.revisionPolicy} />
              </tbody>
            </table>
          </div>

          {/* §9 External Datasets */}
          <div className="stat-card p-6 animate-fade-up" style={{ animationDelay: "220ms" }}>
            <SectionHeader number="§9" title="External Reference Datasets" />
            <table className="w-full">
              <tbody>
                <MethodRow
                  label="Route weights"
                  value={
                    <a href="https://github.com/Vonter/india-aviation-traffic" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-aero-primary hover:underline">
                      Vonter/india-aviation-traffic (ODbL) <ExternalLink className="h-3 w-3" />
                    </a>
                  }
                />
                <MethodRow
                  label="Authoritative weights"
                  value={
                    <a href="https://www.dgca.gov.in/" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-aero-primary hover:underline">
                      DGCA city-pair monthly tables <ExternalLink className="h-3 w-3" />
                    </a>
                  }
                />
                <MethodRow
                  label="Validation benchmark"
                  value={
                    <a href="https://www.data.gov.in/catalog/monthly-air-traffic-statistics" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-aero-primary hover:underline">
                      data.gov.in Monthly Air Traffic Statistics <ExternalLink className="h-3 w-3" />
                    </a>
                  }
                />
                <MethodRow label="CPI cross-check" value="MoSPI CPI Transport sub-index — quarterly correlation reported (M7)" />
                <MethodRow label="Calendar regressors" value="Hand-maintained YAML — festival and vacation windows (~30 rows/year)" />
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}
