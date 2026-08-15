import type { Config } from "tailwindcss";
import rawColors from "./design-tokens/colors.json";

function stripMeta<T extends Record<string, unknown>>(obj: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$") || key === "official") continue;
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

const config: Config = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: stripMeta(rawColors.primary as Record<string, unknown>),
        neutral: stripMeta(rawColors.neutral as Record<string, unknown>),
        danger: stripMeta(rawColors.semantic.danger as Record<string, unknown>),
        warning: stripMeta(rawColors.semantic.warning as Record<string, unknown>),
        success: stripMeta(rawColors.semantic.success as Record<string, unknown>),
        info: stripMeta(rawColors.semantic.info as Record<string, unknown>),
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ['"Times New Roman"', "Times", '"Liberation Serif"', "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
