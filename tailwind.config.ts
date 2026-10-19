import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        paper: "#FAFAFA",
        signal: "#E50914",
        "signal-dim": "#7A1414",
        graphite: "#6B6B6B",
        fog: "#A6A6A6",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        "hero-mobile": ["3.25rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "hero": ["7.5rem", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "hero-lg": ["9.5rem", { lineHeight: "0.92", letterSpacing: "-0.035em" }],
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
        snap: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
