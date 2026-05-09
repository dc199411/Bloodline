import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "Bricolage Grotesque", "sans-serif"],
        sans: ["Bricolage Grotesque", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        syne: ["Syne", "sans-serif"],
      },
      screens: {
        xs: "420px",
      },
      colors: {
        blood: "var(--blood)",
        deep: "var(--deep)",
        carbon: "var(--carbon)",
        ash: "var(--ash)",
        panel: "var(--panel)",
        border: "var(--border)",
        bone: "var(--bone)",
        muted: "var(--muted)",
        live: "var(--live)",
        dying: "var(--dying)",
        gold: "var(--gold)",
        blue: "var(--blue)",
      },
    },
  },
  plugins: [],
};
export default config;
