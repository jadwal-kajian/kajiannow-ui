import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "routes";
import { ThemeProvider } from "./theme";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}
