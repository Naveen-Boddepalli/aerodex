/**
 * Marketing route group layout.
 * Renders NO shell chrome — no Navbar, no footer, no constrained main wrapper.
 * The landing page manages its own top bar and footer.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
