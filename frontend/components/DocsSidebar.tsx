"use client";

/**
 * Docs navigation rail: the other documents, and the sections of this one.
 *
 * The section list is the part that earns its place. These documents run long
 * — the API reference alone has nine top-level sections and eleven below them —
 * and without a persistent outline the only way to find "error codes" is to
 * scroll and hope.
 *
 * Sub-sections are shown only under the section being read. Listing all of
 * them at once made the API reference's outline 80% endpoint paths, which
 * pushed Errors, Versioning and Limitations off the bottom — the rail was
 * longest exactly where it needed to be most scannable. The endpoints are
 * still one scroll away, in the place a reader looking for them already is.
 *
 * Sticky and independently scrollable, so a long outline neither pushes the
 * document down nor becomes unreachable on a short viewport.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { DOCS, type DocHeading, type DocMeta } from "@/lib/docs";

interface Props {
  activeSlug: string;
  headings: DocHeading[];
}

interface Section {
  heading: DocHeading;
  children: DocHeading[];
}

/** Group H3s under the H2 that precedes them. */
function toSections(headings: DocHeading[]): Section[] {
  const out: Section[] = [];
  for (const h of headings) {
    if (h.level === 2 || out.length === 0) out.push({ heading: h, children: [] });
    else out[out.length - 1].children.push(h);
  }
  return out;
}

/**
 * Which section is currently being read.
 *
 * IntersectionObserver rather than a scroll handler: it reports only when a
 * heading crosses the band, so there is no work on every scroll frame. The
 * band is the top ~quarter of the viewport (`-96px 0px -70%`), which makes the
 * active item the heading nearest the top rather than whichever is technically
 * visible — with several short sections on screen at once, "visible" would
 * otherwise pick the wrong one.
 */
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  // A primitive dependency: `ids` is rebuilt on every render, so depending on
  // the array itself would tear down and re-create the observer each time.
  // Slugs cannot contain "|" — the slugifier strips it — so join/split is
  // lossless.
  const key = ids.join("|");

  useEffect(() => {
    const ordered = key ? key.split("|") : [];
    if (!ordered.length) return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        // Earliest in document order among those in the band.
        const first = ordered.find((id) => seen.has(id));
        // Keep the last known section when nothing is in the band — mid-section
        // the heading itself has scrolled past, and blanking would make the
        // rail flicker between every pair of headings.
        if (first) setActive(first);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    for (const id of ordered) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [key]);

  return active;
}

/**
 * Keep the highlighted item inside the rail's own scroll view.
 *
 * The outline can be taller than the rail — twenty items against a 512px rail
 * on a laptop — and then the highlight tracks a section the reader cannot see,
 * which is worse than no highlight at all. Adjusts only the rail's scrollTop,
 * never the window's: `scrollIntoView` here would drag the document with it.
 */
function useKeepActiveVisible(
  railRef: React.RefObject<HTMLElement | null>,
  active: string | null,
) {
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !active) return;
    if (rail.scrollHeight <= rail.clientHeight) return; // nothing to scroll

    const el = rail.querySelector<HTMLElement>(`a[data-heading="${CSS.escape(active)}"]`);
    if (!el) return;

    const item = el.getBoundingClientRect();
    const view = rail.getBoundingClientRect();
    const pad = 12;

    if (item.top < view.top + pad) rail.scrollTop -= view.top + pad - item.top;
    else if (item.bottom > view.bottom - pad) rail.scrollTop += item.bottom - view.bottom + pad;
  }, [railRef, active]);
}

const GROUPS: DocMeta["group"][] = ["Reference", "Project"];

export default function DocsSidebar({ activeSlug, headings }: Props) {
  const railRef = useRef<HTMLElement>(null);
  const active = useActiveHeading(headings.map((h) => h.id));
  useKeepActiveVisible(railRef, active);

  const sections = toSections(headings);

  return (
    <nav
      ref={railRef}
      aria-label="Documentation"
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain pb-4 pr-2"
    >
      {GROUPS.map((group) => {
        const docs = DOCS.filter((d) => d.group === group);
        if (!docs.length) return null;

        return (
          <div key={group} className="mb-5 last:mb-0">
            <p className="aero-label mb-2.5">{group}</p>
            <ul className="space-y-0.5 border-l border-aero-border">
              {docs.map((doc) => {
                const isActive = doc.slug === activeSlug;
                return (
                  <li key={doc.slug}>
                    <Link
                      href={`/docs/${doc.slug}`}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "-ml-px block border-l-2 py-1.5 pl-3 text-[13px] transition-colors",
                        isActive
                          ? "border-aero-primary font-semibold text-aero-primary"
                          : "border-transparent text-aero-mid hover:border-aero-muted hover:text-aero-primary",
                      )}
                    >
                      {doc.title}
                    </Link>

                    {/* Sections of the document being read, inline under it, so
                        the rail is one hierarchy rather than two lists. */}
                    {isActive && sections.length > 0 && (
                      <ul className="mb-2 mt-0.5 space-y-px">
                        {sections.map(({ heading, children }) => {
                          const openHere =
                            active === heading.id || children.some((c) => c.id === active);
                          return (
                            <li key={heading.id}>
                              <a
                                href={`#${heading.id}`}
                                data-heading={heading.id}
                                aria-current={active === heading.id ? "location" : undefined}
                                className={clsx(
                                  "-ml-px block border-l-2 py-1 pl-6 text-[12px] leading-snug transition-colors",
                                  active === heading.id
                                    ? "border-aero-primary font-semibold text-aero-primary"
                                    : "border-transparent text-aero-stable hover:border-aero-muted hover:text-aero-primary",
                                )}
                              >
                                {heading.text}
                              </a>

                              {openHere && children.length > 0 && (
                                <ul className="space-y-px py-0.5">
                                  {children.map((c) => (
                                    <li key={c.id}>
                                      <a
                                        href={`#${c.id}`}
                                        data-heading={c.id}
                                        title={c.text}
                                        aria-current={active === c.id ? "location" : undefined}
                                        className={clsx(
                                          // break-all so a long endpoint path
                                          // wraps inside the rail instead of
                                          // widening it; monospace-ish paths
                                          // have no spaces to break on.
                                          "-ml-px block break-all border-l-2 py-0.5 pl-9 text-[11px] leading-snug transition-colors",
                                          active === c.id
                                            ? "border-aero-primary font-semibold text-aero-primary"
                                            : "border-transparent text-aero-stable hover:border-aero-muted hover:text-aero-primary",
                                        )}
                                      >
                                        {c.text}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
