import Footer from "components/footer";
import Header from "components/header";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen p-4 text-white bg-[#000] shadow-[inset_0_0_24px_0px_#ffe7be]">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
