import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

// localStorage key for the chosen theme. Exported so the home page can preserve
// it across the on-mount cache clear (alongside notify/reactions keys).
export const THEME_KEY = "kn_theme";

// Light is the design default. We honor a saved choice first, then fall back to
// the OS preference so first-time dark-mode users feel at home.
const readInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage blocked — fall through to OS preference */
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const applyTheme = (theme) => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
};

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  // Reflect the theme onto <html> so the CSS-var token set switches.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore storage failures — theme still applies this session */
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

export const useTheme = () => useContext(ThemeContext);

// Sun/moon toggle button matching the design's top-right control.
export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Mode terang" : "Mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className={
        "w-11 h-11 flex items-center justify-center rounded-2xl bg-surface border border-line text-ink " +
        "shadow-[0_8px_18px_-10px_rgba(60,40,10,.45)] active:scale-90 transition-transform " +
        className
      }
    >
      <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
    </button>
  );
}

ThemeToggle.propTypes = {
  className: PropTypes.string,
};
