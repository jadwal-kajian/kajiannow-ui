// Minimal full-height shell. The home screen is a full-bleed map app and the
// about screen carries its own header/back nav, so the global chrome is gone.
const Layout = ({ children }) => {
  return <div className="min-h-[100dvh] text-ink bg-bg transition-colors">{children}</div>;
};

export default Layout;
