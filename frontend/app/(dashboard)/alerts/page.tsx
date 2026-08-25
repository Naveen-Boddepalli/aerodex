import { Bell, BellRing, Clock, CheckCircle2, TrendingDown, TrendingUp, Settings2 } from "lucide-react";

const alerts = [
  { id: 1, route: "DEL → BOM", airline: "Air India", threshold: 4000, current: 3500, change: "drop" as const, triggered: true,  time: "2 mins ago",  active: true  },
  { id: 2, route: "BLR → DEL", airline: "Vistara",   threshold: 5000, current: 4950, change: "drop" as const, triggered: true,  time: "9 mins ago",  active: true  },
  { id: 3, route: "MAA → DEL", airline: "Any",        threshold: 5500, current: 5200, change: "drop" as const, triggered: true,  time: "3 mins ago",  active: true  },
  { id: 4, route: "BOM → BLR", airline: "IndiGo",    threshold: 3000, current: 2850, change: "drop" as const, triggered: true,  time: "5 mins ago",  active: true  },
  { id: 5, route: "BLR → HYD", airline: "Any",        threshold: 1500, current: 1400, change: "drop" as const, triggered: true,  time: "4 mins ago",  active: true  },
  { id: 6, route: "DEL → CCU", airline: "IndiGo",    threshold: 3500, current: 3200, change: "drop" as const, triggered: false, time: "Set 2d ago",  active: true  },
  { id: 7, route: "HYD → BOM", airline: "SpiceJet",  threshold: 2800, current: 2600, change: "drop" as const, triggered: false, time: "Set 3d ago",  active: false },
];

export default function AlertsPage() {
  const triggered = alerts.filter(a => a.triggered && a.active);
  const pending   = alerts.filter(a => !a.triggered && a.active);
  const inactive  = alerts.filter(a => !a.active);

  return (
    <div className="pt-8 pb-16">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full bg-aero-primary" />
          <span className="aero-label">Price Alerts</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-aero-dark">Alerts</h1>
            <p className="text-sm text-aero-mid mt-1">Get notified when fares hit your target price on tracked routes.</p>
          </div>
          <button className="aero-btn-primary self-start sm:self-auto">
            <Bell className="w-4 h-4" /> New Alert
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Triggered", value: triggered.length, icon: <BellRing className="w-4 h-4" />, color: "text-green-600", bg: "bg-green-50" },
          { label: "Watching",  value: pending.length,   icon: <Clock    className="w-4 h-4" />, color: "text-aero-primary", bg: "bg-blue-50" },
          { label: "Inactive",  value: inactive.length,  icon: <CheckCircle2 className="w-4 h-4" />, color: "text-aero-muted", bg: "bg-aero-bg" },
        ].map(s => (
          <div key={s.label} className="aero-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-aero-dark tabular-nums">{s.value}</div>
              <div className="text-[11px] text-aero-muted font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <div className="mb-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="w-4 h-4 text-green-600" />
            <h2 className="text-base font-bold text-aero-dark">Triggered — Fare dropped below threshold</h2>
          </div>
          <div className="aero-card overflow-hidden border-green-200">
            <div className="divide-y divide-aero-border">
              {triggered.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-green-50/30 transition-colors duration-150">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-aero-dark text-sm">{a.route}</div>
                    <div className="text-[11px] text-aero-muted">{a.airline} · Alert: ₹{a.threshold.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">₹{a.current.toLocaleString()}</div>
                    <div className="text-[10px] text-aero-muted">{a.time}</div>
                  </div>
                  <button className="text-aero-muted hover:text-aero-primary transition-colors">
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Watching */}
      {pending.length > 0 && (
        <div className="mb-6 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-aero-primary" />
            <h2 className="text-base font-bold text-aero-dark">Watching</h2>
          </div>
          <div className="aero-card overflow-hidden">
            <div className="divide-y divide-aero-border">
              {pending.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-aero-bg/50 transition-colors duration-150">
                  <div className="w-9 h-9 rounded-xl bg-aero-bg flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4 text-aero-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-aero-dark text-sm">{a.route}</div>
                    <div className="text-[11px] text-aero-muted">{a.airline} · Target: ₹{a.threshold.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-aero-dark">₹{a.current.toLocaleString()}</div>
                    <div className="text-[10px] text-aero-muted">current · {a.time}</div>
                  </div>
                  <button className="text-aero-muted hover:text-aero-primary transition-colors">
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coming soon note */}
      <div className="aero-card p-5 bg-gradient-to-r from-aero-primary/5 to-aero-sky/5 border-aero-primary/20 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div className="flex items-start gap-3">
          <Bell className="w-4 h-4 text-aero-primary mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-aero-dark">Telegram &amp; Email notifications coming soon</div>
            <div className="text-xs text-aero-muted mt-0.5">
              Alerts will push via Telegram Bot API once the live pipeline is connected. No spam — one message per trigger per route.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
