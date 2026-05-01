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

        // Brand
        "brand-black":    "#1A1A18",
        "brand-red":      "#E5322D",
        "brand-red-dark": "#c42a25",
        "brand-grey":     "#333333",

        // Terminal surfaces
        "surface-1": "#1a1d23",
        "surface-2": "#161920",
        "surface-3": "#0d1117",
        "surface-4": "#161b22",

        // Rank colors (kept for badges)
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
        full:    "var(--radius-full)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["-apple-system", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
