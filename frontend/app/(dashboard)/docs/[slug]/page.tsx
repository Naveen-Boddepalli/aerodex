/**
 * /docs/[slug] — one reference document.
 *
 * A server component reading the repository's docs/ at build time, so every
 * page prerenders to static HTML. `generateStaticParams` enumerates the
 * registry, and an unknown slug 404s rather than rendering an empty shell.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import DocMarkdown from "@/components/DocMarkdown";
import { DOCS, REPO_URL, docBySlug } from "@/lib/docs";
import { loadDoc } from "@/lib/docs.server";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = docBySlug(slug);
  if (!doc) return { title: "Not found — AeroDex" };
  return { title: `${doc.title} — AeroDex`, description: doc.summary };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!docBySlug(slug)) notFound();

  const doc = loadDoc(slug);

  return (
    <div className="pb-16 pt-8">
      <div className="animate-fade-up mb-6">
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-aero-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All documentation
        </Link>
      </div>

      <div className="animate-fade-up mb-6 border-b border-aero-border pb-5" style={{ animationDelay: "40ms" }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-aero-primary" />
          <span className="aero-label">{doc.group}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-aero-dark sm:text-4xl">
          {doc.heading ?? doc.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-aero-mid">{doc.summary}</p>
        <a
          href={`${REPO_URL}/blob/main/docs/${doc.file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-aero-muted hover:text-aero-primary"
        >
          docs/{doc.file}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <article className="animate-fade-up max-w-4xl" style={{ animationDelay: "80ms" }}>
        <DocMarkdown body={doc.body} />
      </article>
    </div>
  );
}
