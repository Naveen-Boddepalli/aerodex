import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aerodex — Real-Time Airfare Price Index for India",
  description:
    "Aerodex tracks real-time airfare pricing across India's domestic routes. Powered by live scraping, the Jevons-Lowe index engine, and a 60-route O–D panel — SIH 2026, PS SIH26056.",
  openGraph: {
    title: "Aerodex — Airfare Price Index",
    description: "Real-time airfare price index for India. SIH 2026.",
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
