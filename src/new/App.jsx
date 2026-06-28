import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes";
import { ThemeProvider } from "./theme";

export default function App() {
  return (
    <ThemeProvider>
      {/* Served under /new/ (vite multi-page + nginx); router scoped to that base. */}
      <Router basename="/new">
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}
