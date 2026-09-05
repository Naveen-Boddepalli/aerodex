/**
 * Reads the reference documentation out of the repository's `docs/` directory
 * at build time. **Server only** — importing this from a client component pulls
 * `node:fs` into the browser bundle and fails the build.
 *
 * The documents are rendered *inside* the dashboard rather than linked out to
 * GitHub on purpose. The demo is meant to run on a laptop with no network —
 * the same reason the typeface is self-hosted — and a footer full of links
 * that need wifi is exactly the dependency that fails in a hall with bad
 * connectivity, in front of the people the footer exists to serve.
 *
 * Single-sourced: these are the same files a developer reads in the repo.
 * There is no second copy to drift.
 */

import "server-only";

import fs from "node:fs";
import path from "node:path";

import { type DocHeading, type DocMeta, docBySlug, slugifyHeading } from "./docs";

/** `docs/` lives one level above the Next app root. */
const DOCS_DIR = path.join(process.cwd(), "..", "docs");

export interface LoadedDoc extends DocMeta {
  /** Markdown body with the leading H1 removed — the page renders its own. */
  body: string;
  /** The H1 text that was removed, when there was one. */
  heading: string | null;
  /** H2/H3 sections, in document order, for the sidebar. */
  headings: DocHeading[];
}

/**
 * Strip the inline markdown that never reaches the rendered heading text.
 *
 * The renderer slugifies what React actually rendered, so `## \`quote_raw\``
 * becomes the id "quote_raw" — the backticks are gone by then. Extracting from
 * raw markdown has to remove them here to arrive at the same string.
 */
function stripInline(text: string): string {
  return text
    .replace(/`([^`]*)`/g, "$1")             // code spans
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")   // links -> their text
    .replace(/(\*\*|__)(.*?)\1/g, "$2")       // bold
    .replace(/(\*|_)(.*?)\1/g, "$2")          // italic
    .trim();
}

/**
 * Collect H2 and H3 headings in document order.
 *
 * Fence-aware: OPERATIONS.md alone carries three "#" comment lines inside bash
 * blocks, and a naive line scan would list them as sections that scroll
 * nowhere.
 */
function extractHeadings(markdown: string): DocHeading[] {
  const out: DocHeading[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (!m) continue;
    const text = stripInline(m[2]);
    if (!text) continue;
    out.push({
      id: slugifyHeading(text),
      text,
      level: m[1].length === 2 ? 2 : 3,
    });
  }
  return out;
}

/**
 * Read one document. Throws rather than returning empty content: a docs page
 * that silently renders nothing is worse than a build that stops and says
 * which file it could not find.
 */
export function loadDoc(slug: string): LoadedDoc {
  const meta = docBySlug(slug);
  if (!meta) throw new Error(`Unknown doc slug: ${slug}`);

  const full = path.join(DOCS_DIR, meta.file);
  let raw: string;
  try {
    raw = fs.readFileSync(full, "utf8");
  } catch {
    throw new Error(
      `Cannot read ${full}. The dashboard renders the repository's docs/ ` +
        `directory at build time, so it must be built from inside the repo.`,
    );
  }

  const match = raw.match(/^#\s+(.+)\n/);
  const body = (match ? raw.slice(match[0].length) : raw).trimStart();
  return {
    ...meta,
    body,
    heading: match ? match[1].trim() : null,
    headings: extractHeadings(body),
  };
}
