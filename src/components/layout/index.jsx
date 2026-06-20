import Footer from "components/footer";
import Header from "components/header";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen text-ink bg-bg transition-colors">
      {/* Mobile-first: keep the app a centered column so it doesn't stretch on wide screens. */}
      <div className="flex flex-col flex-grow w-full max-w-2xl mx-auto p-4">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
