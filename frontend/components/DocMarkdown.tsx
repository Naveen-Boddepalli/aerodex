"use client";

/**
 * Renders one reference document.
 *
 * Tailwind's preflight strips heading and list styling, and the dashboard has
 * no typography plugin, so every element gets an explicit class. That is
 * verbose but it keeps the documents looking like the rest of the product
 * rather than like a raw markdown dump.
 *
 * Tables get their own horizontal scroll container: the data dictionary and the
 * API reference both carry wide tables, and the page body must never scroll
 * sideways.
 */

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink } from "lucide-react";
import { resolveDocHref, slugifyHeading } from "@/lib/docs";

/**
 * Pull the plain text out of a React subtree.
 *
 * Headings are not always plain strings — `## \`quote_raw\`` arrives as a
 * `<code>` element, and stringifying that yields "[object Object]", which
 * silently breaks every in-document link pointing at it.
 */
function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node as { props?: { children?: React.ReactNode } }).props?.children);
  }
  return "";
}

/**
 * Heading id, from whatever React actually rendered.
 *
 * The slug rule itself lives in lib/docs so the sidebar derives identical ids
 * from raw markdown — two copies of this would drift and break every section
 * link without failing anything.
 */
function slugify(children: React.ReactNode): string {
  return slugifyHeading(textOf(children));
}

export default function DocMarkdown({ body }: { body: string }) {
  return (
    <div className="aero-doc text-[13px] leading-relaxed text-aero-mid">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              id={slugify(children)}
              className="mt-10 mb-3 scroll-mt-24 text-2xl font-bold text-aero-dark"
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              id={slugify(children)}
              className="mt-9 mb-3 scroll-mt-24 border-b border-aero-border pb-2 text-xl font-bold text-aero-dark"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              id={slugify(children)}
              className="mt-7 mb-2 scroll-mt-24 text-base font-bold text-aero-dark"
            >
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-3">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-1 pl-5 marker:text-aero-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-1 pl-5 marker:text-aero-muted">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-aero-dark">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-lg border-l-4 border-aero-primary bg-aero-badge/50 px-4 py-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-aero-border" />,
          code: ({ className, children }) => {
            // Fenced blocks arrive with a language class; inline code does not.
            if (className) {
              return <code className="block font-mono text-[12px]">{children}</code>;
            }
            return (
              <code className="rounded bg-aero-badge px-1.5 py-0.5 font-mono text-[12px] text-aero-primary">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg border border-aero-border bg-aero-bg p-3 font-mono text-[12px] text-aero-dark">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-lg border border-aero-border">
              <table className="w-full border-collapse text-left text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-aero-bg">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-aero-border px-3 py-2 font-semibold text-aero-dark">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-aero-border/60 px-3 py-2 align-top">{children}</td>
          ),
          a: ({ href, children }) => {
            const target = resolveDocHref(href ?? "");
            if (target.external) {
              return (
                <a
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-baseline gap-0.5 font-medium text-aero-primary underline decoration-aero-primary/30 underline-offset-2 hover:decoration-aero-primary"
                >
                  {children}
                  <ExternalLink className="h-3 w-3 shrink-0 self-center" aria-hidden="true" />
                </a>
              );
            }
            return (
              <Link
                href={target.href}
                className="font-medium text-aero-primary underline decoration-aero-primary/30 underline-offset-2 hover:decoration-aero-primary"
              >
                {children}
              </Link>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
