import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        mono: ["Space Mono", "monospace"],
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
