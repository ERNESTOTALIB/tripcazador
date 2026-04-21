/**
 * Regresiones SEO sobre las rutas dinámicas /deals/[id] y /destinos/[slug].
 *
 * Bug histórico (caza abr-2026):
 *   - Next.js 14 ISR + `notFound()` en rutas dinámicas devuelve la página
 *     not-found.tsx con HTTP 200, lo que acaba en Google Search Console.
 *   - Solución aplicada:
 *       * /destinos/[slug]: `dynamicParams = false` + `generateStaticParams`
 *         para que slugs desconocidos devuelvan 404 real.
 *       * /deals/[id]: como los IDs son genuinamente dinámicos, no podemos
 *         pre-generarlos. En su lugar devolvemos `robots: noindex, nofollow`
 *         y `canonical: null` desde generateMetadata cuando el deal es null.
 *
 * Estos tests protegen esas regresiones mediante análisis estático del
 * source code — más rápido que un E2E y no depende de prod.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEALS_PAGE = resolve(__dirname, "..", "deals", "[id]", "page.tsx");
const DESTINOS_PAGE = resolve(__dirname, "..", "destinos", "[slug]", "page.tsx");

/** Extrae el body de una función balanceando paréntesis primero (para saltar
 *  la lista de argumentos, que puede incluir destructurings con `{...}`), y
 *  luego llaves del body. */
function extractFunctionBody(src: string, funcNameRegex: RegExp): string {
  const match = src.match(funcNameRegex);
  if (!match) return "";
  // Arrancamos desde el paréntesis de apertura de la firma.
  const sigStart = src.indexOf(match[0]);
  let i = src.indexOf("(", sigStart);
  if (i === -1) return "";
  // Balancear paréntesis para cerrar la lista de args
  let parenDepth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "(") parenDepth++;
    else if (src[i] === ")") {
      parenDepth--;
      if (parenDepth === 0) { i++; break; }
    }
  }
  // Saltar el tipo de retorno opcional: `: Promise<X>`
  // Localizar la primera `{` después de args que abre el body.
  const bodyStart = src.indexOf("{", i);
  if (bodyStart === -1) return "";
  let braceDepth = 0;
  for (let j = bodyStart; j < src.length; j++) {
    if (src[j] === "{") braceDepth++;
    else if (src[j] === "}") {
      braceDepth--;
      if (braceDepth === 0) return src.slice(bodyStart, j + 1);
    }
  }
  return "";
}

describe("/deals/[id] SEO (regresión)", () => {
  const src = readFileSync(DEALS_PAGE, "utf-8");
  const metaBody = extractFunctionBody(
    src,
    /export async function generateMetadata\s*\(/,
  );

  it("tiene generateMetadata", () => {
    expect(metaBody).not.toBe("");
  });

  it("en caso de deal nulo, devuelve robots:noindex", () => {
    // Dentro de generateMetadata buscamos el return tras `!deal`.
    expect(metaBody).toMatch(/if\s*\(\s*!deal\s*\)/);
    expect(metaBody).toMatch(/robots:\s*\{[^}]*index:\s*false/);
    expect(metaBody).toMatch(/follow:\s*false/);
  });

  it("en caso de deal nulo, setea canonical a null", () => {
    // Previene que la URL de la página notFound sea canonical de sí misma.
    expect(metaBody).toMatch(/canonical:\s*null/);
  });

  it("llama a notFound() en la función principal cuando el deal no existe", () => {
    // Debe existir la llamada en la función de página, no sólo en metadata.
    expect(src).toMatch(/if\s*\(\s*!deal\s*\)\s*\{\s*notFound\(\)/);
  });
});

describe("/destinos/[slug] SEO (regresión)", () => {
  const src = readFileSync(DESTINOS_PAGE, "utf-8");

  it("exporta dynamicParams = false", () => {
    expect(src).toMatch(/export const dynamicParams\s*=\s*false/);
  });

  it("exporta generateStaticParams basado en DESTINATIONS", () => {
    expect(src).toMatch(/export async function generateStaticParams/);
    expect(src).toMatch(/Object\.keys\(DESTINATIONS\)/);
  });

  it("generateMetadata devuelve noindex cuando dest es nulo", () => {
    // Aunque dynamicParams=false bloquea el render, la metadata aún se evalúa
    // en build. Mantener noindex como defensa-en-profundidad.
    const metaBody = extractFunctionBody(
      src,
      /export async function generateMetadata\s*\(/,
    );
    expect(metaBody).not.toBe("");
    expect(metaBody).toMatch(/if\s*\(\s*!dest\s*\)/);
    expect(metaBody).toMatch(/index:\s*false/);
    expect(metaBody).toMatch(/follow:\s*false/);
  });

  it("llama a notFound() si el slug no existe", () => {
    expect(src).toMatch(/if\s*\(\s*!dest\s*\)\s*notFound\(\)/);
  });
});
