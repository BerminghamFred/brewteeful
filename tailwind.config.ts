import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f6f5f1", // page background, warm off-white
        chalk: "#ffffff", // surfaces
        ink: "#0e0e10", // text / primary
        pitch: "#0f3b2c", // deep racing green — brand colour
        flare: "#ff5a2c", // single accent, used sparingly
        sun: "#efebe1", // soft sand highlight
        mute: "#6f6b64",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(14,14,16,0.04), 0 8px 24px -12px rgba(14,14,16,0.12)",
        lift: "0 2px 4px rgba(14,14,16,0.04), 0 24px 48px -20px rgba(14,14,16,0.25)",
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
    },
  },
  plugins: [],
};

export default config;
