import Navbar from "@/components/Navbar";

/**
 * Dashboard shell layout.
 * Wraps all dashboard routes (/, /price-tracking, /alerts, /history)
 * with the shared Navbar and footer.
 * Routes in (marketing)/ are unaffected by this layout.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-aero-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {children}
      </main>
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
    </div>
  );
}
