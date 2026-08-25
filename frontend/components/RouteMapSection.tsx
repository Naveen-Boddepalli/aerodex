"use client";

import { MapPin, Cpu, Wifi, TrendingUp } from "lucide-react";

const nodes = [
  { id: "Alpha", region: "North India (DEL, AMD, JAI)", status: "active", queries: 18432 },
  { id: "Beta",  region: "South India (BLR, MAA, HYD)", status: "active", queries: 14207 },
  { id: "Gamma", region: "West India (BOM, GOI, NAG)", status: "active", queries: 9812  },
  { id: "Delta", region: "East India (CCU, BBI, GAU)", status: "idle",   queries: 440   },
];

export default function RouteMapSection() {
  return (
    <section className="mt-10 mb-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-5 rounded-full bg-aero-primary" />
        <span className="aero-label">Network Intelligence</span>
      </div>
      <h2 className="text-3xl font-bold text-aero-dark mb-2">Global Route Mapping</h2>
      <p className="text-sm text-aero-mid max-w-xl mb-8">
        Visualise real-time pricing anomalies across India&apos;s domestic airspaces. Our scraping
        nodes track thousands of stratum-slot quotes every collection cycle.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map placeholder */}
        <div className="relative aero-card overflow-hidden min-h-72 flex items-center justify-center">
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, #2456E8 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-aero-primary/5 via-transparent to-aero-sky/5" />

          {/* SVG India map outline placeholder */}
          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-aero-gradient flex items-center justify-center shadow-aero-glow">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-semibold text-aero-dark">Route Coverage Map</p>
              <p className="text-xs text-aero-muted">60 O–D pairs · India domestic panel</p>
            </div>
            <div className="flex items-center gap-1.5 bg-aero-dark text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              <span className="live-dot" />
              Live scraping active
            </div>
          </div>

          {/* Corner badge */}
          <div className="absolute bottom-4 right-4 aero-card px-3 py-2 shadow-aero-md text-right">
            <div className="text-[9px] text-aero-muted uppercase tracking-wider font-semibold">Live Queries</div>
            <div className="text-xl font-bold text-aero-primary tabular-nums">42,891</div>
          </div>
        </div>

        {/* Data nodes */}
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-aero-mid mb-1">Collection Nodes</div>
          {nodes.map((node) => (
            <div key={node.id} className="aero-card p-4 flex items-center gap-4 hover:shadow-aero-md hover:-translate-y-0.5 transition-all duration-200">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${node.status === "active" ? "bg-green-50" : "bg-aero-bg"}`}>
                <Cpu className={`w-5 h-5 ${node.status === "active" ? "text-green-600" : "text-aero-muted"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-aero-dark text-sm">Node {node.id}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    node.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-aero-bg text-aero-muted"
                  }`}>
                    {node.status}
                  </span>
                </div>
                <div className="text-xs text-aero-muted truncate">{node.region}</div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-aero-primary">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-sm font-bold tabular-nums">{node.queries.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-aero-muted">queries</div>
              </div>
            </div>
          ))}

          {/* Pipeline info */}
          <div className="aero-card p-4 bg-gradient-to-r from-aero-primary/5 to-aero-sky/5 border-aero-primary/20">
            <div className="flex items-start gap-3">
              <Wifi className="w-4 h-4 text-aero-primary mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-aero-dark">Pipeline: Scheduler → Adapter → Normalise → Validate → Index</div>
                <div className="text-[10px] text-aero-muted mt-0.5">
                  Min 20s between requests · robots.txt honoured · No CAPTCHA solving
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
