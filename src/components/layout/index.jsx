import Footer from "components/footer";
import Header from "components/header";

const Layout = ({ children }) => {
  return (
    <div className="box-container min-h-screen p-4 bg-black text-white">
      <Header />
      <main className="min-h-[calc(100vh-115px)]">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
