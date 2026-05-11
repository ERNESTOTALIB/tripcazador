/**
 * rsc_regression.test.ts — Smoke regression sobre código fuente de componentes.
 *
 * Este test recorre cada .tsx en src/components/ y valida:
 *   1. Si NO tiene "use client", asegura que NO contenga event handler `on[A-Z]\w+={...}`.
 *      Este fue el bug exacto que tiró producción el 11 may 2026
 *      (HotelDealsStrip.tsx con onError → error.digest 1610473858).
 *   2. Si tiene "use client", asegura que sea la primera línea de código (no después
 *      de imports).
 *   3. Si tiene <a href= y target="_blank" sin "use client", debe usar rel="noopener".
 *
 * Esta es la versión vitest del linter custom scripts/check-rsc-event-handlers.mjs.
 * Si añades este test al CI, te detecta variaciones futuras del mismo bug.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const COMPONENTS_DIR = join(__dirname, "..");
const APP_DIR = join(__dirname, "..", "..", "app");

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  function walk(d: string) {
    let entries: string[] = [];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith(".") || e === "node_modules" || e === "__tests__") continue;
      const p = join(d, e);
      let stat: ReturnType<typeof statSync>;
      try {
        stat = statSync(p);
      } catch {
        continue;
      }
      if (stat.isDirectory()) walk(p);
      else if (e.endsWith(".tsx")) out.push(p);
    }
  }
  walk(dir);
  return out;
}

function isClientComponent(content: string): boolean {
  // Acepta "use client" en línea 1, 2 o 3 (con linea comentada o vacía antes)
  const first = content.trim().split("\n").slice(0, 3).join("\n");
  return /["']use client["']/.test(first);
}

function stripCommentsAndStrings(src: string): string {
  // Limpia comments /* */ y // y strings para evitar falsos positivos
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(?<![:\w])\/\/.*$/gm, "")
    .replace(/`(?:\\.|[^`\\])*`/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

// Coleccionamos los archivos una vez para múltiples tests.
const ALL_TSX = [...listTsxFiles(COMPONENTS_DIR), ...listTsxFiles(APP_DIR)];

describe("RSC regression — no event handlers en Server Components", () => {
  it("encuentra archivos .tsx para auditar", () => {
    expect(ALL_TSX.length).toBeGreaterThan(50);
  });

  // Patrón: `on[A-Z]\w*\s*=\s*\{` indica event handler JSX
  // Limita keys "known dangerous" para no levantar falsos positivos por nombres tipo "onSubmit prop"
  // Solo `=\{` (handler binding) en JSX.
  const HANDLER_RE = /\bon[A-Z][A-Za-z]+\s*=\s*\{/;

  ALL_TSX.forEach((file) => {
    const content = readFileSync(file, "utf8");
    if (isClientComponent(content)) return; // skip client components — pueden tener handlers
    const stripped = stripCommentsAndStrings(content);
    const m = HANDLER_RE.exec(stripped);
    it(`${file.split("src/")[1]} — sin event handlers (Server Component)`, () => {
      if (m) {
        // dump la línea ofensora para que el dev la encuentre rápido
        const idx = stripped.indexOf(m[0]);
        const lineNum = stripped.slice(0, idx).split("\n").length;
        throw new Error(
          `Server Component contiene handler "${m[0]}" en línea ~${lineNum}. ` +
          `Añade "use client" al inicio del archivo o quita el handler. ` +
          `Bug histórico: SSS134 HotelDealsStrip onError → error.digest 1610473858.`,
        );
      }
      expect(true).toBe(true);
    });
  });
});

describe("RSC regression — 'use client' debe estar al inicio", () => {
  ALL_TSX.forEach((file) => {
    const content = readFileSync(file, "utf8");
    if (!isClientComponent(content)) return;
    it(`${file.split("src/")[1]} — 'use client' antes de imports`, () => {
      const lines = content.split("\n");
      // Encuentra primera línea con código (no comentarios/vacías)
      let firstCodeLine = -1;
      for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (l.startsWith("//") || l.startsWith("/*") || l.startsWith("*") || l.endsWith("*/")) continue;
        firstCodeLine = i;
        break;
      }
      if (firstCodeLine === -1) {
        throw new Error(`No se encontró código no-comentario en ${file}`);
      }
      const firstLine = lines[firstCodeLine].trim();
      // Acepta "use client" o 'use client' (single o double quote)
      expect(firstLine).toMatch(/^["']use client["']/);
    });
  });
});

describe("RSC regression — links externos seguros", () => {
  // Para todos los archivos: cualquier <a ... target="_blank" debe tener rel con noopener.
  ALL_TSX.forEach((file) => {
    const content = readFileSync(file, "utf8");
    it(`${file.split("src/")[1]} — target=_blank con rel=noopener`, () => {
      const m = content.match(/target\s*=\s*["']_blank["']/g);
      if (!m) return; // no targets _blank
      // Buscar contexto +/- 200 chars y verificar rel
      let idx = 0;
      while (true) {
        const found = content.indexOf("_blank", idx);
        if (found === -1) break;
        // Mira ±200 chars alrededor para rel=
        const surrounding = content.slice(Math.max(0, found - 250), found + 250);
        // Accept rel="noopener" OR rel="noreferrer" (modern browsers imply noopener with noreferrer)
        const hasNoopener = /rel\s*=\s*["'][^"']*(noopener|noreferrer)/i.test(surrounding);
        // Permitir _blank en strings (ej templates) — el _blank dentro de "" no necesita rel.
        // Si la línea contiene `<a` o `<Link` antes del _blank, entonces sí debe tener rel.
        // Simplificamos: si no tiene noopener en surrounding y aparece literal _blank,
        // chequeamos que el contexto incluya <a o <Link.
        const isLinkTag = /<(?:a|Link|button)[^>]*$/i.test(content.slice(Math.max(0, found - 250), found));
        if (isLinkTag && !hasNoopener) {
          throw new Error(
            `Posible link inseguro en ${file}: target=_blank sin rel=noopener. ` +
              `Snippet: ...${content.slice(Math.max(0, found - 80), found + 30)}...`,
          );
        }
        idx = found + 1;
      }
      expect(true).toBe(true);
    });
  });
});
