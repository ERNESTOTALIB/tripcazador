import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    // Añadimos `xs: 480px` como breakpoint para navegación móvil densa.
    // Tailwind no trae `xs` de serie; los breakpoints sm/md/lg/xl/2xl se
    // preservan al usar `extend.screens` en lugar de sustituirlos.
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        gray: {
          750: "#1f2937",
          850: "#1a2030",
          900: "#111827",
          950: "#030712",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
