/**
 * Site footer.
 *
 * Previously four links, all `href="#"`. A Privacy Policy link that goes
 * nowhere is worse than no link at all — someone evaluating this project
 * clicks it, finds nothing, and reasonably wonders what else is a placeholder.
 * Everything here now resolves to something real.
 *
 * A server component: no state, no effects, and it renders on every dashboard
 * page, so there is no reason to ship it to the client.
 */

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DOCS, REPO_URL } from "@/lib/docs";

const PRODUCT = [
  { label: "Dashboard", href: "/" },
  { label: "Panel routes", href: "/price-tracking" },
  { label: "Heatmap", href: "/heatmap" },
  { label: "Index history", href: "/history" },
  { label: "Outliers", href: "/alerts" },
];

const METHOD = [
  { label: "Methodology", href: "/methodology" },
  { label: "All documentation", href: "/docs" },
];

const SOURCE = [
  { label: "Repository", href: REPO_URL },
  { label: "API contract", href: `${REPO_URL}/blob/main/docs/openapi.json` },
  { label: "Back-test report", href: `${REPO_URL}/blob/main/scripts/backtest/output/backtest_report.md` },
  { label: "Report an issue", href: `${REPO_URL}/issues` },
];

function Column({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-aero-dark">
        {heading}
      </h2>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

const linkClass =
  "text-xs text-aero-muted transition-colors duration-150 hover:text-aero-primary";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-aero-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Column heading="Index">
            {PRODUCT.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </Column>

          <Column heading="Documentation">
            {DOCS.filter((d) => d.group === "Reference").map((d) => (
              <li key={d.slug}>
                <Link href={`/docs/${d.slug}`} className={linkClass}>
                  {d.title}
                </Link>
              </li>
            ))}
          </Column>

          <Column heading="Methodology">
            {METHOD.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
            {DOCS.filter((d) => d.group === "Project").map((d) => (
              <li key={d.slug}>
                <Link href={`/docs/${d.slug}`} className={linkClass}>
                  {d.title}
                </Link>
              </li>
            ))}
          </Column>

          <Column heading="Source">
            {SOURCE.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-1`}
                >
                  {l.label}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            ))}
          </Column>
        </div>

        <div className="mt-9 flex flex-col items-start justify-between gap-3 border-t border-aero-border pt-5 sm:flex-row sm:items-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-aero-muted">
            © 2026 Aerodex Technologies · SIH26056 · MoSPI
          </p>
          {/* The claim the project rests on, in the place a licence line usually
              sits — and it is checkable by anyone who reads it. */}
          <p className="font-mono text-[11px] text-aero-muted">
            Every number reproducible from its published inputs ·{" "}
            <span className="text-aero-mid">aerodex verify</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
