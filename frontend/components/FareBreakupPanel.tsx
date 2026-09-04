"use client";

/**
 * FareBreakupPanel — Statutory Fare Decomposition
 *
 * Breaks down an observed total fare into its statutory and structural components.
 * The decomposition is estimated from published statutory rates applied to the
 * observed total fare. It is NOT directly measured — the AeroDex pipeline
 * stores total fares only.
 *
 * Decomposition model:
 *   1. Airport UDF: AAI-published per-airport rates (fixed rupee amount per sector)
 *   2. Statutory Taxes: GST 5% (economy) on base+surcharge, PSF ₹130, ASF ₹10
 *   3. Fuel Surcharge: Estimated as ~18–22% of total fare (industry average YQ/YR)
 *   4. Base Fare: Total minus UDF minus taxes minus surcharge
 *   5. Dynamic Surge: Residual above route 30-day median — inferred demand premium
 *
 * The decomposition is labelled "Estimated decomposition — statutory rates applied
 * to observed total fare" with an inline badge on the chart.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FlaskConical } from "lucide-react";

interface FareBreakupProps {
  /** Total observed all-inclusive fare in INR */
  totalFare: number;
  /** Route IATA pair e.g. "DEL-BOM" */
  route: string;
  /** 30-day median for this route×horizon, used to compute surge residual */
  medianFare?: number;
}

// AAI-published UDFs for major panel airports (per sector, INR, FY 2025-26)
// Source: AAI Order No. AAI/UDF/2025 — applies to departing passenger
const AAI_UDF: Record<string, number> = {
  DEL: 840, BOM: 1135, BLR: 1020, MAA: 500, HYD: 886, CCU: 180,
  AMD: 400, COK: 380, GOI: 330, PNQ: 490, JAI: 320, LKO: 290,
  PAT: 260, IXC: 280, SXR: 290, BBI: 290, VTZ: 290, NAG: 290,
  GAU: 290, IXB: 290, IXR: 290, BHO: 290,
};
// PSF + ASF (fixed statutory charges per sector)
const PSF = 130;
const ASF = 10;
const GST_RATE = 0.05; // 5% economy class

/**
 * Decompose a total fare into statutory components.
 * All amounts are rounded to nearest integer rupee.
 */
function decompose(totalFare: number, originIata: string, medianFare?: number) {
  const udf = AAI_UDF[originIata.toUpperCase()] ?? 300;
  const psf_asf = PSF + ASF;

  // Work backwards: total = base + surcharge + udf + psf_asf + gst(base+surcharge)
  // Let X = base + surcharge. Then: total = X + udf + psf_asf + gst*X = X(1+gst) + fixed
  const fixed = udf + psf_asf;
  const X = Math.max((totalFare - fixed) / (1 + GST_RATE), 0); // base + surcharge
  const gst = Math.round(X * GST_RATE);
  const taxes = gst + psf_asf;

  // Fuel surcharge ≈ 20% of (base+surcharge), based on industry YQ/YR average
  const surcharge = Math.round(X * 0.20);
  const base = Math.max(Math.round(X - surcharge), 0);

  // Dynamic surge = total observed - 30d median (if above median)
  const surge = medianFare != null ? Math.max(Math.round(totalFare - medianFare), 0) : 0;
  // Reduce base by surge to keep total correct
  const adjustedBase = Math.max(base - surge, 0);

  return {
    base: adjustedBase,
    surcharge,
    udf: Math.round(udf),
    taxes,
    surge,
    total: adjustedBase + surcharge + Math.round(udf) + taxes + surge,
  };
}

const COMPONENTS = [
  {
    key: "base" as const,
    label: "Base Fare",
    color: "#2456E8",
    description: "Airline published base tariff",
  },
  {
    key: "surcharge" as const,
    label: "Fuel Surcharge",
    color: "#38B6FF",
    description: "YQ/YR fuel levy (~20% of base+surcharge)",
  },
  {
    key: "udf" as const,
    label: "Airport UDF",
    color: "#6172A0",
    description: "AAI User Development Fee (departing airport)",
  },
  {
    key: "taxes" as const,
    label: "Statutory Taxes",
    color: "#8A99BB",
    description: "GST 5% + PSF ₹130 + ASF ₹10",
  },
  {
    key: "surge" as const,
    label: "Dynamic Surge",
    color: "#F59E0B",
    description: "Residual above 30-day route median — inferred demand premium",
  },
];

const DecompositionTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { label: string; value: number; description: string } }[];
}) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="aero-card min-w-[200px] p-3 shadow-aero-md">
      <div className="mb-1 font-semibold text-sm text-aero-dark">{p.label}</div>
      <div className="text-lg font-bold tabular-nums text-aero-primary">
        ₹{p.value.toLocaleString("en-IN")}
      </div>
      <div className="mt-1 text-[10px] text-aero-muted">{p.description}</div>
    </div>
  );
};

export default function FareBreakupPanel({
  totalFare,
  route,
  medianFare,
}: FareBreakupProps) {
  const originIata = route.split("-")[0] ?? "DEL";
  const breakdown = decompose(totalFare, originIata, medianFare);

  const chartData = COMPONENTS.map((c) => ({
    label: c.label,
    value: breakdown[c.key],
    description: c.description,
    color: c.color,
    pct: totalFare > 0 ? ((breakdown[c.key] / totalFare) * 100).toFixed(1) : "0.0",
  })).filter((d) => d.value > 0);

  return (
    <div className="stat-card overflow-hidden">
      {/* Header with estimation badge */}
      <div className="flex items-center justify-between gap-3 border-b border-aero-border bg-aero-bg/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-aero-primary" />
          <h3 className="text-sm font-bold text-aero-dark">Fare Component Decomposition</h3>
        </div>
        {/* Inline estimation badge — prominent per reviewer feedback */}
        <span className="est-badge shrink-0">
          ⚠ Estimated decomposition — statutory rates applied to observed total fare
        </span>
      </div>

      <div className="p-4">
        {/* Stacked horizontal bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-aero-muted">
              Total Observed Fare
            </span>
            <span className="text-lg font-bold tabular-nums text-aero-dark">
              ₹{totalFare.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex h-5 w-full overflow-hidden rounded-full">
            {chartData.map((d) => (
              <div
                key={d.label}
                title={`${d.label}: ₹${d.value.toLocaleString("en-IN")} (${d.pct}%)`}
                style={{
                  width: `${d.pct}%`,
                  backgroundColor: d.color,
                  minWidth: d.value > 0 ? "2px" : "0",
                }}
              />
            ))}
          </div>
        </div>

        {/* Recharts bar — vertical breakdown */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE4F5" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#8A99BB" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 10, fill: "#3A4F7A" }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<DecompositionTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {chartData.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown table */}
        <div className="mt-3 border-t border-aero-border pt-3">
          {chartData.map((d) => (
            <div key={d.label} className="stat-row">
              <span className="stat-row-label flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                {d.label}
              </span>
              <span className="stat-row-value">
                ₹{d.value.toLocaleString("en-IN")}
                <span className="ml-1.5 text-[10px] font-normal text-aero-muted">({d.pct}%)</span>
              </span>
            </div>
          ))}
        </div>

        {/* Methodology footnote */}
        <p className="mt-3 text-[10px] leading-relaxed text-aero-muted border-t border-aero-border pt-2">
          <strong>Statutory basis:</strong> UDF per AAI Order (FY 2025-26) · GST 5% (economy) per Finance Act 2017
          · PSF ₹130 + ASF ₹10 per MoCA · Fuel surcharge estimated at 20% YQ/YR industry average.
          Dynamic surge = observed fare − 30-day route median; zero when below median.
          This decomposition is <em>estimated</em> — AeroDex collects all-inclusive fares.
          Statutory rates are fixed by law; only the dynamic surge is inferred from panel data.
        </p>
      </div>
    </div>
  );
}
