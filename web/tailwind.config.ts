import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        // Brand palette — Onboard-inspired editorial-fintech.
        cream:        "#F5F0E0",
        "cream-soft": "#FAF6E9",
        brown:        "#1A1200",
        "brown-soft": "#2A2010",
        acid:         "#C8FF00",
        "acid-deep":  "#B5E600",
        amber:        "#F5C432",
        purple:       "#2D1B6B",

        // Legacy aliases for in-flight references — point to the new brand.
        "brand-black":    "#1A1200",
        "brand-red":      "#C8FF00",
        "brand-red-dark": "#B5E600",
        "brand-grey":     "#2A2010",

        // Rank colours (kept for badges)
        bronze:   "#cd7f32",
        silver:   "#c0c0c0",
        gold:     "#d4a017",
        platinum: "#9ea0a4",
        diamond:  "#5fbcd3",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg:      "var(--radius)",
        "2xl":   "var(--radius-2xl)",
        full:    "var(--radius-pill)",
      },
      fontFamily: {
        display: ["Fraunces", "Canela", "Freight Display Pro", "Georgia", "serif"],
        sans:    ["Inter", "-apple-system", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono:    ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        xs:    "0.75rem",
        sm:    "0.875rem",
        base:  "1rem",
        lg:    "1.125rem",
        xl:    "1.25rem",
        "2xl": "1.625rem",
        "3xl": "2.125rem",
        "4xl": "2.75rem",
        "5xl": "3.75rem",
        "6xl": "5rem",
        "7xl": "6.5rem",
        "8xl": "8rem",
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.025em",
      },
    },
  },
  plugins: [],
};
export default config;
