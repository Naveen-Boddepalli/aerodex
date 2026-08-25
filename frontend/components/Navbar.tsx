"use client";

import { useState } from "react";
import { Search, Bell, ChevronDown, Menu, X } from "lucide-react";
import clsx from "clsx";

const navLinks = [
  { label: "Dashboard",      href: "#" },
  { label: "Price Tracking", href: "#" },
  { label: "Alerts",         href: "#" },
  { label: "History",        href: "#" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-aero-border shadow-aero-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* ── Logo ── */}
          <a href="#" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-aero-gradient flex items-center justify-center shadow-aero-md group-hover:shadow-aero-glow transition-shadow duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 3L3 10.5L10.5 13.5M21 3L13.5 21L10.5 13.5M21 3L10.5 13.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-aero-dark tracking-tight">
              Aero<span className="text-aero-primary">dex</span>
            </span>
          </a>

          {/* ── Search bar ── */}
          <div className="flex-1 max-w-md mx-4 hidden sm:flex">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aero-muted" />
              <input
                type="text"
                placeholder="Search flight routes..."
                className="w-full bg-aero-bg border border-aero-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-aero-dark placeholder:text-aero-muted focus:outline-none focus:ring-2 focus:ring-aero-primary/25 focus:border-aero-primary transition-all duration-150"
              />
            </div>
          </div>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setActive(label)}
                className={clsx(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                  active === label
                    ? "text-aero-primary bg-aero-badge"
                    : "text-aero-mid hover:text-aero-dark hover:bg-aero-bg"
                )}
              >
                {label}
              </a>
            ))}
          </div>

          {/* ── Right Icons ── */}
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-xl bg-aero-bg border border-aero-border flex items-center justify-center hover:border-aero-primary hover:bg-aero-badge transition-all duration-150">
              <Bell className="w-4 h-4 text-aero-mid" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-aero-primary ring-2 ring-white" />
            </button>

            {/* Avatar */}
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-aero-bg transition-all duration-150">
              <div className="w-8 h-8 rounded-full bg-aero-gradient flex items-center justify-center text-white text-xs font-bold shadow-aero-sm">
                SK
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-aero-muted hidden sm:block" />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-aero-bg border border-aero-border flex items-center justify-center"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-4 h-4 text-aero-mid" /> : <Menu className="w-4 h-4 text-aero-mid" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-aero-border animate-fade-up">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => { setActive(label); setMenuOpen(false); }}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    active === label
                      ? "text-aero-primary bg-aero-badge"
                      : "text-aero-mid hover:text-aero-dark hover:bg-aero-bg"
                  )}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
