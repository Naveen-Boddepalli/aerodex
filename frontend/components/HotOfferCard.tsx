"use client";

import { Clock, Zap, ArrowRight } from "lucide-react";

interface HotOfferProps {
  tag?: string;
  logo?: string;
  logoText?: string;
  sponsor: string;
  title: string;
  description?: string;
  expiresIn: string;
  gradient?: string;
}

export default function HotOfferCard({
  tag = "Limited",
  logoText,
  sponsor,
  title,
  description,
  expiresIn,
  gradient = "from-aero-primary to-aero-sky",
}: HotOfferProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-aero-lg cursor-pointer group hover:shadow-aero-glow transition-all duration-300`}>
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 blur-xl" />

      {/* Tag */}
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
          <Zap className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{tag}</span>
        </div>
      </div>

      {/* Sponsor chip */}
      <div className="flex items-center gap-2 mb-3 relative">
        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-aero-primary font-bold text-xs shadow">
          {logoText?.charAt(0) || "A"}
        </div>
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">{sponsor}</span>
      </div>

      {/* Title */}
      <p className="text-base font-bold leading-snug relative mb-1">{title}</p>
      {description && (
        <p className="text-xs text-white/70 relative mb-4">{description}</p>
      )}

      {/* Expiry + CTA */}
      <div className="flex items-center justify-between relative mt-3">
        <div className="flex items-center gap-1.5 text-white/70 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Ends in {expiresIn}</span>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-all duration-150">
          Claim <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
