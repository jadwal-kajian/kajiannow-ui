import Footer from "components/footer";
import Header from "components/header";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-[100dvh] text-white bg-[#000] shadow-[inset_0_0_24px_0px_#ffe7be]">
      {/* Mobile-first: keep the app a centered column so it doesn't stretch on wide screens.
          At least one screen tall, so the home page's map can take whatever height is
          left and the footer stays on screen without scrolling. */}
      <div className="flex flex-col flex-grow w-full max-w-2xl mx-auto px-4 pt-4 pb-3">
        <Header />
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
