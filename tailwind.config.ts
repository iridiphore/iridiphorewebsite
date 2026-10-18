import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07090c",
        panel: "#0e1217",
        line: "#1c242d",
        fog: "#9aa7b4",
        paper: "#eef2f5",
        teal: { DEFAULT: "#2dd4bf", deep: "#0f766e" },
        ember: "#fb923c",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      keyframes: {
        drift: {
          "0%": { transform: "translate3d(-6%, -4%, 0) rotate(0deg) scale(1.15)" },
          "50%": { transform: "translate3d(6%, 5%, 0) rotate(180deg) scale(1.3)" },
          "100%": { transform: "translate3d(-6%, -4%, 0) rotate(360deg) scale(1.15)" },
        },
      },
      animation: { drift: "drift 38s ease-in-out infinite" },
    },
  },
  plugins: [],
} satisfies Config;
