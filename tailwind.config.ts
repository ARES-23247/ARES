import type { Config } from "tailwindcss";

import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "ares-red": "#C00000",
        "ares-bronze": "#CD7F32",
        "ares-gold": "#FFB81C",
        "ares-cyan": "#00E5FF",
        "obsidian": "#1A1A1A",
        "marble": "#F9F9F9",
        "ares-gray": "var(--ares-gray)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Outfit", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    typography,
  ],
};
export default config;
