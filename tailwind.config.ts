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
        paper: "#f4eee3",
        chalk: "#fffaf1",
        ink: "#121212",
        pitch: "#1f6f43",
        flare: "#ff5a1f",
        sun: "#ffd23f",
        mute: "#6b655c",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        hard: "4px 4px 0 0 #121212",
        "hard-sm": "2px 2px 0 0 #121212",
      },
    },
  },
  plugins: [],
};

export default config;
