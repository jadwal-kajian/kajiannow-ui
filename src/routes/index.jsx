import { Routes, Route } from "react-router-dom";
import Layout from "components/layout";
import Home from "pages/home";
import About from "pages/about";

export default function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}
