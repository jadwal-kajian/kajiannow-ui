/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // Dark theme is driven by [data-theme="dark"] on <html> (see src/theme.jsx),
  // so any `dark:` utilities key off that selector too.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        // ── Semantic design tokens (backed by CSS vars in index.css) ──
        // Light is default; the vars flip under [data-theme="dark"].
        bg: "var(--kn-bg)",
        surface: {
          DEFAULT: "var(--kn-surface)",
          2: "var(--kn-surface-2)",
        },
        ink: {
          DEFAULT: "var(--kn-text)",
          dim: "var(--kn-text-dim)",
        },
        line: "var(--kn-border)",
        accent: {
          DEFAULT: "var(--kn-accent)",
          ink: "var(--kn-accent-ink)",
        },
        amber: {
          DEFAULT: "var(--kn-amber)",
          soft: "var(--kn-amber-soft)",
        },
        ok: { DEFAULT: "var(--kn-ok)", bg: "var(--kn-ok-bg)" },
        soon: { DEFAULT: "var(--kn-soon)", bg: "var(--kn-soon-bg)" },
        done: { DEFAULT: "var(--kn-done)", bg: "var(--kn-done-bg)" },

        // ── Legacy palette (kept during the design migration) ──
        "custom-gray": {
          1: "#545454",
        },
        "custom-yellow": {
          1: "#ffe7be",
          2: "#edce93",
          3: "#f1dcb7",
          4: "#e1cca6"
        },
      },
    },
  },
  plugins: [],
};
