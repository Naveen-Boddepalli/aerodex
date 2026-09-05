import type { Metadata } from "next";
import "./globals.css";

// Replaced Inter with system-ui to prevent sandbox network issues during build/dev
const inter = { variable: "--font-inter" };

export const metadata: Metadata = {
  title: "AeroDex — Airfare Price Index for India",
  description:
    "AeroDex publishes a reproducible airfare price index over a 60-route Indian domestic panel — Jevons elementary aggregates under a Lowe index, DGCA traffic weights, and a published hash for every number. SIH 2026, PS SIH26056 (MoSPI).",
  openGraph: {
    title: "AeroDex — Airfare Price Index",
    description:
      "A reproducible airfare price index for India, published with the hashes needed to recompute it. SIH 2026, PS SIH26056 (MoSPI).",
    type: "website",
  },
};

/**
 * Root layout — bare shell only.
 * Provides <html>/<body> and global CSS.
 * No Navbar or footer here — those live in the (dashboard) group layout
 * so that (marketing)/landing can opt out of them entirely.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
