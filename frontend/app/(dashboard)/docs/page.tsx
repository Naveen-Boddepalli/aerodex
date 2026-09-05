/**
 * /docs — index of the reference documentation.
 *
 * A server component: the documents are read from the repository at build
 * time, so this ships as static HTML with no client-side fetch.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, ExternalLink, FileJson, Terminal } from "lucide-react";
import { DOCS, REPO_URL } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation — AeroDex",
  description:
    "Reference documentation for the AeroDex Domestic Airfare Price Index: API, data dictionary, operations and testing.",
};

const SOURCE_LINKS = [
  {
    label: "openapi.json",
    href: `${REPO_URL}/blob/main/docs/openapi.json`,
    detail: "Machine-readable API contract",
    icon: FileJson,
  },
  {
    label: "plan.md",
    href: `${REPO_URL}/blob/main/plan.md`,
    detail: "The full design rationale behind every §-reference in the code",
    icon: BookOpen,
  },
  {
    label: "methodology.yaml",
    href: `${REPO_URL}/blob/main/config/methodology.yaml`,
    detail: "The index definition, hashed onto every published number",
    icon: Terminal,
  },
  {
    label: "Back-test report",
    href: `${REPO_URL}/blob/main/scripts/backtest/output/backtest_report.md`,
    detail: "30 days benchmarked against DGCA and MoSPI CPI references",
    icon: BookOpen,
  },
];

export default function DocsIndexPage() {
  const groups = ["Reference", "Project"] as const;

  return (
    <div className="pb-16 pt-8">
      <div className="animate-fade-up mb-8 max-w-3xl">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-aero-primary" />
          <span className="aero-label">Documentation</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-aero-dark sm:text-4xl">
          Reference documentation
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-aero-mid">
          The same documents that ship in the repository, rendered here so they work
          without a network connection. Each one carries a known-limitations section —
          a gap named is worth more than a gap concealed.
        </p>
      </div>

      {groups.map((group, gi) => {
        const items = DOCS.filter((d) => d.group === group);
        if (!items.length) return null;
        return (
          <section
            key={group}
            className="animate-fade-up mb-8"
            style={{ animationDelay: `${60 + gi * 40}ms` }}
          >
            <h2 className="aero-label mb-3">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="aero-card group flex flex-col p-4 transition-colors hover:border-aero-primary"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-aero-dark">{doc.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-aero-muted transition-transform group-hover:translate-x-0.5 group-hover:text-aero-primary" />
                  </div>
                  <span className="text-xs leading-relaxed text-aero-mid">{doc.summary}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="animate-fade-up" style={{ animationDelay: "180ms" }}>
        <h2 className="aero-label mb-3">In the repository</h2>
        <div className="aero-card divide-y divide-aero-border/60">
          {SOURCE_LINKS.map(({ label, href, detail, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-aero-bg/60"
            >
              <Icon className="h-4 w-4 shrink-0 text-aero-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs font-semibold text-aero-dark">
                  {label}
                </span>
                <span className="block text-xs text-aero-mid">{detail}</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-aero-muted" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
