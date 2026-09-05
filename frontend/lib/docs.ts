/**
 * The reference-documentation registry and link rewriting.
 *
 * Deliberately free of `node:fs` — the markdown renderer is a client
 * component and imports `resolveDocHref` from here, so anything Node-only in
 * this module ends up in the browser bundle and fails the build. File reading
 * lives in `docs.server.ts`.
 */

export const REPO_URL = "https://github.com/Naveen-Boddepalli/aerodex";
export const BLOB = `${REPO_URL}/blob/main`;

export interface DocMeta {
  slug: string;
  /** Filename under the repository's `docs/` directory. */
  file: string;
  title: string;
  summary: string;
  /** Grouping for the footer and the index page. */
  group: "Reference" | "Project";
}

/**
 * The documents rendered in-app. Anything not listed here — plan.md, the
 * schema, the config — is still linked, but out to the repository, because it
 * is source rather than prose.
 */
export const DOCS: DocMeta[] = [
  {
    slug: "api",
    file: "API.md",
    title: "API reference",
    summary:
      "Endpoints, response fields, the provenance contract, error codes and stability guarantees.",
    group: "Reference",
  },
  {
    slug: "data-dictionary",
    file: "DATA_DICTIONARY.md",
    title: "Data dictionary",
    summary:
      "Every stored field, and how the problem statement's required metadata maps onto the schema.",
    group: "Reference",
  },
  {
    slug: "operations",
    file: "OPERATIONS.md",
    title: "Operations runbook",
    summary: "Install, scheduling, the daily cycle, monitoring and the incident runbook.",
    group: "Reference",
  },
  {
    slug: "testing",
    file: "TESTING.md",
    title: "Testing",
    summary: "What each test layer guarantees, the M6 golden tests, and the known gaps.",
    group: "Reference",
  },
  {
    slug: "submission-notes",
    file: "SIH26056_submission.md",
    title: "Submission notes",
    summary:
      "The estimated fare decomposition, source-coverage audit, and the compliance trade-off.",
    group: "Project",
  },
];

export function docBySlug(slug: string): DocMeta | undefined {
  return DOCS.find((d) => d.slug === slug);
}

/** One heading in a rendered document, for the sidebar's section list. */
export interface DocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * GitHub's anchor scheme.
 *
 * The single definition on purpose: the sidebar builds hrefs from raw markdown
 * while the renderer builds ids from React children, and if those two ever
 * disagree every section link silently scrolls nowhere. Both call this.
 */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/ /g, "-");
}

/**
 * Resolve a `rel` path against `base`, both POSIX-style. A four-line stand-in
 * for `path.posix.join` + `normalize`, so this module stays Node-free.
 */
function resolveRelative(base: string, rel: string): string {
  const parts = base.split("/").filter(Boolean);
  for (const seg of rel.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

/**
 * Rewrite a link found inside a rendered document.
 *
 * Links in the markdown are written for someone reading the repository, so
 * they are relative to `docs/`. In the dashboard they have to resolve to
 * either another in-app doc page or the file on GitHub — a raw `API.md` href
 * would 404.
 */
export function resolveDocHref(href: string): { href: string; external: boolean } {
  if (!href) return { href: "#", external: false };

  // Absolute, anchor and mail links pass through untouched.
  if (/^(https?:)?\/\//.test(href)) return { href, external: true };
  if (href.startsWith("#") || href.startsWith("mailto:")) return { href, external: false };

  const [rawPath, hash] = href.split("#");
  const resolved = resolveRelative("docs", rawPath);
  const suffix = hash ? `#${hash}` : "";

  // Another document we render in-app.
  const inApp = DOCS.find((d) => resolved === `docs/${d.file}`);
  if (inApp) return { href: `/docs/${inApp.slug}${suffix}`, external: false };

  // Everything else is source rather than prose: send it to the repository.
  return { href: `${BLOB}/${resolved}${suffix}`, external: true };
}
