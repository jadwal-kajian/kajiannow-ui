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
/** One icon of the pair: present, or rotated out and blurred away. */
const swapClass = (shown) =>
  "absolute transition-all duration-300 ease-[var(--kn-ease-out)] " +
  (shown ? "opacity-100 rotate-0 scale-100 blur-0" : "opacity-0 -rotate-90 scale-75 blur-[2px]");

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
        "shadow-[0_8px_18px_-10px_rgba(60,40,10,.45)] active:scale-90 transition-transform duration-200 " +
      // Same curve as the switch and the hint, so a press releases with the
      // same physics the rest of the app moves by.
      "ease-[var(--kn-ease-out)] " +
        className
      }
    >
      {/* The icon swapped instantly, which read as a redraw rather than a
          change of state. Both are stacked and cross-faded, each rotating in
          from the side it is heading toward while a slight blur clears --
          beui.dev's action-swap and blur signature. Reduced motion collapses
          it to the same instant swap it used to be. */}
      <span className="relative grid h-4 w-4 place-items-center">
        <FontAwesomeIcon icon={faSun} className={swapClass(isDark)} />
        <FontAwesomeIcon icon={faMoon} className={swapClass(!isDark)} />
      </span>
    </button>
  );
}

ThemeToggle.propTypes = {
  className: PropTypes.string,
};
