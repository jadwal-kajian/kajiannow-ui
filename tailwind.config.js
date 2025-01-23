/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
