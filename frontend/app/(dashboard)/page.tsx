import { ArrowRight } from "lucide-react";
import FlightSearchCard from "@/components/FlightSearchCard";
import PriceTrackerCard from "@/components/PriceTrackerCard";
import HotOfferCard from "@/components/HotOfferCard";
import IndexStats from "@/components/IndexStats";
import RouteMapSection from "@/components/RouteMapSection";

/* ── Synthetic sparkline data ── */
const delhiMumbai = [
  { v: 4800 }, { v: 5100 }, { v: 4650 }, { v: 4400 }, { v: 3950 },
  { v: 4200 }, { v: 3800 }, { v: 3600 }, { v: 3750 }, { v: 3500 },
];
const bangaloreMumbai = [
  { v: 2800 }, { v: 2600 }, { v: 2750 }, { v: 2900 }, { v: 3100 },
  { v: 3050 }, { v: 3200 }, { v: 3400 }, { v: 3300 }, { v: 3450 },
];
const delhiBlr = [
  { v: 5200 }, { v: 5100 }, { v: 5080 }, { v: 5120 }, { v: 5060 },
  { v: 5090 }, { v: 5050 }, { v: 5100 }, { v: 5070 }, { v: 5080 },
];
const hyderabadDelhi = [
  { v: 6200 }, { v: 5900 }, { v: 5600 }, { v: 5800 }, { v: 5400 },
  { v: 5100 }, { v: 4900 }, { v: 4600 }, { v: 4400 }, { v: 4200 },
];

const trackers = [
  {
    from: "DEL", fromCity: "New Delhi",
    to:   "BOM", toCity:   "Mumbai",
    stops: "Direct", price: 3500, currency: "₹",
    change: "drop" as const, changeAmt: 1300,
    dates: "Sep 15–22", lastChecked: "2 mins ago",
    data: delhiMumbai,
  },
  {
    from: "BLR", fromCity: "Bengaluru",
    to:   "BOM", toCity:   "Mumbai",
    stops: "1 Stop", price: 3450, currency: "₹",
    change: "rise" as const, changePct: 8,
    dates: "Oct 03–10", lastChecked: "5 mins ago",
    data: bangaloreMumbai,
  },
  {
    from: "DEL", fromCity: "New Delhi",
    to:   "BLR", toCity:   "Bengaluru",
    stops: "Direct", price: 5080, currency: "₹",
    change: "stable" as const,
    dates: "Sep 20–27", lastChecked: "1 min ago",
    data: delhiBlr,
  },
  {
    from: "HYD", fromCity: "Hyderabad",
    to:   "DEL", toCity:   "New Delhi",
    stops: "Direct", price: 4200, currency: "₹",
    change: "drop" as const, changeAmt: 2000,
    dates: "Oct 12–19", lastChecked: "8 mins ago",
    data: hyderabadDelhi,
  },
];

export default function DashboardPage() {
  return (
    <div className="pt-8">

      {/* ── Hero section ── */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-full bg-aero-primary" />
          <span className="aero-label">Flight Scanner Core</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-aero-dark leading-tight">
              Global Trajectory<br className="hidden sm:block" /> Analysis
            </h1>
            <p className="text-sm text-aero-mid mt-2 max-w-lg">
              India&apos;s real-time airfare price index — Jevons-Lowe methodology,
              60-route panel, live scraping. Built for SIH 2026, PS SIH26056 (MoSPI).
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-white border border-aero-border rounded-xl px-4 py-2.5 shadow-aero-sm self-start sm:self-auto">
            <span className="live-dot" />
            <span className="text-xs font-semibold text-aero-dark">Pipeline Active</span>
          </div>
        </div>
      </div>

      {/* ── Flight search card ── */}
      <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <FlightSearchCard />
      </div>

      {/* ── Stats strip ── */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: "150ms" }}>
        <IndexStats />
      </div>

      {/* ── Price trackers + Hot offers ── */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: "200ms" }}>

        {/* Active trackers */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-aero-dark">Active Price Trackers</h2>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-aero-primary hover:text-aero-primary2 transition-colors duration-150">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trackers.map((t) => (
              <PriceTrackerCard key={`${t.from}-${t.to}`} {...t} />
            ))}
          </div>
        </div>

        {/* Hot offers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-aero-dark">Hot Offers</h2>
            <button className="text-xs font-semibold text-aero-primary hover:text-aero-primary2 transition-colors duration-150">
              See all
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <HotOfferCard
              tag="Limited"
              logoText="AI"
              sponsor="Air India Special"
              title="Get 25% off all domestic flights"
              description="Book before midnight — lowest fares on 12 routes."
              expiresIn="48 hours"
              gradient="from-aero-primary to-[#1A3FB5]"
            />
            <HotOfferCard
              tag="Flash Sale"
              logoText="IG"
              sponsor="IndiGo Weekend"
              title="Fly for ₹999 on select routes"
              description="Mumbai · Delhi · Bengaluru corridors only."
              expiresIn="6 hours"
              gradient="from-[#0EA5E9] to-aero-sky"
            />
            <HotOfferCard
              tag="Early Bird"
              logoText="6E"
              sponsor="SpiceJet Offer"
              title="Business class at economy prices"
              expiresIn="3 days"
              gradient="from-purple-600 to-purple-400"
            />
          </div>
        </div>
      </div>

      {/* ── Route mapping ── */}
      <div className="animate-fade-up" style={{ animationDelay: "280ms" }}>
        <RouteMapSection />
      </div>

    </div>
  );
}
