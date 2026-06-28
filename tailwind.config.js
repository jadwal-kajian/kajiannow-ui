/** @type {import('tailwindcss').Config} */
export default {
  // Scan both apps' templates: classic (./index.html + src) and the redesign
  // preview (./new/index.html + src/new, already covered by ./src/**).
  content: ["./index.html", "./new/index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // Dark theme (redesign only) is driven by [data-theme="dark"] on <html>
  // (see src/new/theme.jsx); `dark:` utilities key off that selector.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        // Redesign font; the classic app sets Manrope globally in src/index.css.
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        // ── Classic UI palette (src/**) ──
        "custom-gray": {
          1: "#545454",
        },
        "custom-yellow": {
          1: "#ffe7be",
          2: "#edce93",
          3: "#f1dcb7",
          4: "#e1cca6",
        },
        // ── Redesign semantic tokens (src/new/**), backed by CSS vars in
        // src/new/index.css. Disjoint from the classic palette, so one config
        // serves both apps. Light is default; vars flip under [data-theme="dark"].
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
      },
    },
  },
  plugins: [],
};
