import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Dashboard shell layout.
 * Wraps all dashboard routes (/, /price-tracking, /alerts, /history, /docs)
 * with the shared Navbar and footer.
 * Routes in (marketing)/ are unaffected by this layout.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-aero-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
