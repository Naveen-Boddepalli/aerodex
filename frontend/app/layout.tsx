import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-aero-bg antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-aero-border bg-white mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-aero-muted uppercase tracking-wider">
              © 2026 Aerodex Technologies · SIH26056 · MoSPI
            </p>
            <div className="flex gap-5">
              {["Methodology", "Privacy Policy", "Terms of Service", "Support"].map((l) => (
                <a key={l} href="#" className="text-xs text-aero-muted hover:text-aero-primary transition-colors duration-150">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
