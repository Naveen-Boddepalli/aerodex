"use client";

import { useEffect, useState, useRef } from "react";
import { Activity, Server, Globe, TrendingUp } from "lucide-react";
import clsx from "clsx";

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const stats: StatItem[] = [
  {
    label: "Live Queries",
    value: 42891,
    icon: Activity,
    color: "text-aero-primary",
    description: "Active in last 60s",
  },
  {
    label: "Routes Indexed",
    value: 60,
    suffix: " routes",
    icon: Globe,
    color: "text-aero-sky",
    description: "India O–D panel",
  },
  {
    label: "Quotes Today",
    value: 7243,
    icon: TrendingUp,
    color: "text-green-500",
    description: "Validated quotes",
  },
  {
    label: "Data Nodes",
    value: 4,
    suffix: " active",
    icon: Server,
    color: "text-purple-500",
    description: "Scraping sources",
  },
];

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) ** 2;
      setCount(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return count;
}

function StatCard({ stat, delay }: { stat: StatItem; delay: number }) {
  const animated = useCountUp(stat.value, 1800);
  const Icon = stat.icon;

  return (
    <div
      className="aero-card p-4 flex items-start gap-3 hover:shadow-aero-md hover:-translate-y-0.5 transition-all duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={clsx("w-10 h-10 rounded-xl bg-aero-bg flex items-center justify-center shrink-0", stat.color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-bold text-aero-dark tabular-nums">
          {stat.prefix}{animated.toLocaleString()}{stat.suffix}
        </div>
        <div className="text-xs font-semibold text-aero-mid">{stat.label}</div>
        <div className="text-[10px] text-aero-muted mt-0.5">{stat.description}</div>
      </div>
    </div>
  );
}

export default function IndexStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <StatCard key={s.label} stat={s} delay={i * 80} />
      ))}
    </div>
  );
}
