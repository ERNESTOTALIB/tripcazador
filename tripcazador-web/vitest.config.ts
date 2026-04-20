import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vitest config para tests unitarios del frontend.
 *
 * - Alias "@" igual al de Next.js para que los imports (`@/lib/...`)
 *   funcionen igual en tests que en el build.
 * - `@vitejs/plugin-react` hace falta incluso para tests "solo de funciones
 *   puras" porque al importar `HotelSearchWidget.tsx` Vitest necesita
 *   parsear el JSX del componente que vive en el mismo archivo.
 * - `e2e/` queda excluido porque es Playwright, no Vitest.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", "e2e", ".next"],
    // Fail if any .only is left by mistake — los tests corren siempre completos
    allowOnly: false,
  },
});
