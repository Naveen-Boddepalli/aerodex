"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Menu, X, Activity, CornerDownLeft } from "lucide-react";
import clsx from "clsx";
import { fetchRoutes, fetchIndexLatest, PanelRoute, IndexLatest } from "@/lib/api";

/**
 * The search box now searches. It matches against the real panel and jumps to
 * the matching route's detail page — previously it was an input bound to
 * nothing. The notification bell and the "SK" avatar are gone: there are no
 * accounts and no notifications, so both were decoration that implied features
 * the product does not have.
 *
 * The right-hand slot instead carries the current index level, which is the one
 * number worth having on screen everywhere.
 */

const navLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Panel Routes", href: "/price-tracking" },
  { label: "Alerts", href: "/alerts" },
  { label: "History", href: "/history" },
  { label: "Heatmap", href: "/heatmap" },
  { label: "Methodology", href: "/methodology" },
];


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [routes, setRoutes] = useState<PanelRoute[]>([]);
  const [index, setIndex] = useState<IndexLatest | null>(null);
  const [cursor, setCursor] = useState(0);

  const pathname = usePathname();
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRoutes().then(({ data }) => data && setRoutes(data.routes));
    fetchIndexLatest().then(({ data }) => setIndex(data));
  }, []);

  // Close the suggestion list on an outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return routes
      .filter((r) =>
        `${r.origin.iata}${r.destination.iata} ${r.origin.city} ${r.destination.city}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [routes, query]);

  // Clamp during render rather than resetting from an effect: a shrinking match
  // list must never leave the highlight pointing past the end.
  const active = matches.length ? Math.min(cursor, matches.length - 1) : 0;

  function go(route: PanelRoute) {
    router.push(`/routes/${route.origin.iata}/${route.destination.iata}`);
    setQuery("");
    setOpen(false);
    setMenuOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!matches.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((active + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((active - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const searchBox = (
    <div ref={boxRef} className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-aero-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search a route — DEL BOM, Chennai…"
        aria-label="Search panel routes"
        className="w-full rounded-xl border border-aero-border bg-aero-bg py-2.5 pl-10 pr-4 text-sm text-aero-dark transition-all duration-150 placeholder:text-aero-muted focus:border-aero-primary focus:outline-none focus:ring-2 focus:ring-aero-primary/25"
      />

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-aero-border bg-white shadow-aero-lg">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-xs text-aero-muted">
              No panel route matches “{query}”.
            </div>
          ) : (
            matches.map((r, i) => (
              <button
                key={r.id}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
                className={clsx(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  i === active ? "bg-aero-badge" : "hover:bg-aero-bg",
                )}
              >
                <span className="font-mono text-xs font-bold text-aero-dark">
                  {r.origin.iata}→{r.destination.iata}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-aero-muted">
                  {r.origin.city} → {r.destination.city}
                </span>
                {i === active && <CornerDownLeft className="h-3 w-3 shrink-0 text-aero-primary" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-aero-border bg-white/90 shadow-aero-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aero-gradient shadow-aero-md transition-shadow duration-300 group-hover:shadow-aero-glow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 3L3 10.5L10.5 13.5M21 3L13.5 21L10.5 13.5M21 3L10.5 13.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-aero-dark">
              Aero<span className="text-aero-primary">dex</span>
            </span>
          </Link>

          {/* Search */}
          <div className="mx-4 hidden max-w-md flex-1 sm:flex">{searchBox}</div>

          {/* Nav links */}
          <div className="ml-auto hidden items-center gap-1 md:flex">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={clsx(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150",
                  pathname === href
                    ? "bg-aero-badge text-aero-primary"
                    : "text-aero-mid hover:bg-aero-bg hover:text-aero-dark",
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Index chip */}
          <div className="ml-2 flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-aero-border bg-aero-bg px-3 py-1.5 sm:flex">
              <Activity className="h-3.5 w-3.5 text-aero-primary" />
              <div className="leading-none">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-aero-muted">
                  Index
                </div>
                <div className="text-sm font-bold tabular-nums text-aero-dark">
                  {index ? index.value.toFixed(2) : "—"}
                </div>
              </div>
            </div>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-aero-border bg-aero-bg md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4 w-4 text-aero-mid" /> : <Menu className="h-4 w-4 text-aero-mid" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="animate-fade-up border-t border-aero-border pb-4 pt-3 md:hidden">
            <div className="mb-3 sm:hidden">{searchBox}</div>
            <div className="flex flex-col gap-1">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150",
                    pathname === href
                      ? "bg-aero-badge text-aero-primary"
                      : "text-aero-mid hover:bg-aero-bg hover:text-aero-dark",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
