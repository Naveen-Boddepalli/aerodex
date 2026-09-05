/**
 * Site footer.
 *
 * Every link resolves to something real. It previously carried a Privacy
 * Policy, Terms of Service and Support that all pointed at `#`, and a link
 * into nothing costs more credibility than an absent one — particularly on a
 * project whose whole claim is that its numbers can be checked.
 *
 * Shape: an identity block, then four link columns, then a baseline. The
 * identity block matters more here than on a typical product site. This is a
 * statistical release, and the footer is where a reader looks to find out who
 * is publishing the number and under what authority.
 *
 * A server component. The only interactive element is the copy button, which
 * is its own client island, so none of this ships as JavaScript.
 */

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DOCS, REPO_URL } from "@/lib/docs";
import CopyCommand from "@/components/CopyCommand";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const INDEX_LINKS: FooterLink[] = [
  { label: "Dashboard", href: "/" },
  { label: "Panel routes", href: "/price-tracking" },
  { label: "Heatmap", href: "/heatmap" },
  { label: "Index history", href: "/history" },
  { label: "Outliers", href: "/alerts" },
];

const METHOD_LINKS: FooterLink[] = [
  { label: "Methodology", href: "/methodology" },
  { label: "All documentation", href: "/docs" },
  ...DOCS.filter((d) => d.group === "Project").map((d) => ({
    label: d.title,
    href: `/docs/${d.slug}`,
  })),
];

const SOURCE_LINKS: FooterLink[] = [
  { label: "Repository", href: REPO_URL, external: true },
  { label: "API contract", href: `${REPO_URL}/blob/main/docs/openapi.json`, external: true },
  {
    label: "Back-test report",
    href: `${REPO_URL}/blob/main/scripts/backtest/output/backtest_report.md`,
    external: true,
  },
  { label: "Report an issue", href: `${REPO_URL}/issues`, external: true },
];

const DOC_LINKS: FooterLink[] = DOCS.filter((d) => d.group === "Reference").map((d) => ({
  label: d.title,
  href: `/docs/${d.slug}`,
}));

/**
 * Underline-on-hover rather than colour-alone: colour is not available to
 * every reader, and these sit on white at a small size where a hue shift is
 * easy to miss.
 */
const LINK =
  "inline-flex items-center gap-1 text-[13px] text-aero-mid underline-offset-4 transition-colors hover:text-aero-primary hover:underline focus-visible:text-aero-primary focus-visible:underline focus-visible:outline-none";

function LinkColumn({ heading, links }: { heading: string; links: FooterLink[] }) {
  return (
    <nav aria-labelledby={`footer-${heading.toLowerCase().replace(/\s+/g, "-")}`}>
      <h2
        id={`footer-${heading.toLowerCase().replace(/\s+/g, "-")}`}
        className="aero-label mb-3"
      >
        {heading}
      </h2>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            {l.external ? (
              <a href={l.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                {l.label}
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
              </a>
            ) : (
              <Link href={l.href} className={LINK}>
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-aero-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Identity */}
          <div className="lg:col-span-4">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-aero-gradient shadow-aero-md transition-shadow duration-300 group-hover:shadow-aero-glow">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21 3L3 10.5L10.5 13.5M21 3L13.5 21L10.5 13.5M21 3L10.5 13.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-xl font-bold tracking-tight text-aero-dark">
                Aero<span className="text-aero-primary">dex</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-aero-mid">
              A reproducible airfare price index for India, over a fixed 60-route domestic
              panel — Jevons elementary aggregates under a Lowe index, on DGCA traffic
              weights.
            </p>

            <p className="mt-4 inline-flex items-center rounded-lg border border-aero-border bg-aero-badge px-2.5 py-1 text-[11px] font-semibold text-aero-primary">
              SIH 2026 · PS SIH26056 · MoSPI
            </p>
          </div>

          <div className="lg:col-span-2">
            <LinkColumn heading="Index" links={INDEX_LINKS} />
          </div>
          <div className="lg:col-span-2">
            <LinkColumn heading="Documentation" links={DOC_LINKS} />
          </div>
          <div className="lg:col-span-2">
            <LinkColumn heading="Methodology" links={METHOD_LINKS} />
          </div>
          <div className="lg:col-span-2">
            <LinkColumn heading="Source" links={SOURCE_LINKS} />
          </div>
        </div>

        {/* Baseline: the claim, and how to check it. The command is copyable
            because it is meant to be run — that is the entire argument the
            project makes, and it should cost the reader one click to test. */}
        <div className="mt-12 border-t border-aero-border pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[13px] text-aero-mid">
                Every published number is reproducible from its published inputs.
              </span>
              <CopyCommand command="aerodex verify" />
            </div>
            {/* aero-stable, not aero-muted: muted is 2.86:1 on white and fails
                WCAG AA outright. Subordinate to the line above it, still legible. */}
            <p className="text-[11px] text-aero-stable">
              © 2026 Aerodex Technologies · Fares are measured, never sold
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
