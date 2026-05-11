#!/usr/bin/env node
/**
 * SSS145 — Anti-regresión del bug que tiró producción el 11 may 2026.
 *
 * Recorre `src/` y falla si encuentra un archivo SIN "use client" en la
 * primera línea no-vacía que contenga un event handler JSX (onClick=,
 * onError=, onChange=, onSubmit=, etc.) en su contenido.
 *
 * Server Components no aceptan funciones como props — eso es exactamente
 * lo que generó el error.digest 1610473858 "Algo salió mal en el radar".
 *
 * Uso: `node scripts/check-rsc-event-handlers.mjs` (exit code != 0 si fail).
 * Integrado en `npm run lint` y en CI vía .github/workflows/check-rsc.yml.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");

// Event handler props que React permite. Lista cerrada para evitar false
// positives (p. ej. "onClick" en strings/comments).
const HANDLER_RE =
  /\s(on(?:Abort|Animation(?:Start|End|Iteration)|AuxClick|Blur|CanPlay(?:Through)?|Change|Click|CompositionStart|ContextMenu|Copy|Cut|DoubleClick|Drag(?:End|Enter|Exit|Leave|Over|Start)?|Drop|DurationChange|Emptied|Encrypted|Ended|Error|Focus|GotPointerCapture|Input|Invalid|KeyDown|KeyPress|KeyUp|Load(?:Start|End|edData|edMetadata)?|LostPointerCapture|MouseDown|MouseEnter|MouseLeave|MouseMove|MouseOut|MouseOver|MouseUp|Paste|Pause|Play|Playing|Pointer(?:Cancel|Down|Enter|Leave|Move|Out|Over|Up)|Progress|RateChange|Reset|Scroll|Seeked|Seeking|Select|Stalled|Submit|Suspend|TimeUpdate|Touch(?:Cancel|End|Move|Start)|TransitionEnd|VolumeChange|Waiting|Wheel))\s*=\s*\{/;

const ALLOWLIST = new Set([
  // Archivos donde NO inspeccionar (tipos, mocks, etc.)
]);

// Sólo TSX/JSX cuentan como JSX. Archivos .ts puros no pueden tener JSX.
const JSX_EXT = /\.(tsx|jsx)$/;

function isClientFile(content) {
  // Busca "use client" en la primera línea no-vacía / no-comentario, tolerando
  // imports posicionados antes (eslint allow). Acepta comillas dobles/simples.
  // Heurística: si las primeras 2KB contienen una directiva 'use client' /
  // "use client" antes de cualquier export/function/const declarado, se trata
  // como Client Component.
  const head = content.slice(0, 2048);
  const directiveMatch = head.match(/^['"]use client['"]\s*;?\s*$/m);
  if (!directiveMatch) return false;
  // Asegurarse de que la directiva aparece antes del primer "export" /
  // "function" / "const " / "class " en el archivo. Si aparece después,
  // React la ignora.
  const directiveIdx = head.indexOf(directiveMatch[0]);
  const firstCode = head.search(/\b(?:export|function|const|class|let|var)\b/);
  if (firstCode === -1) return true;
  return directiveIdx < firstCode;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      yield* walk(full);
    } else if (JSX_EXT.test(entry)) {
      yield full;
    }
  }
}

/**
 * Quita los bloques de comentarios y strings literales del código antes
 * de buscar patrones de event handler. Evita false-positives cuando JSDoc
 * o un string template menciona on*={...} (ej. el panel/page.tsx tenía
 * `<button onClick={preventDefault}>` dentro de un JSDoc explicando un
 * bug pasado).
 */
function stripCommentsAndStrings(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = i + 1 < n ? src[i + 1] : "";
    // Block comment /* ... */
    if (c === "/" && c2 === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    // Line comment // ...
    if (c === "/" && c2 === "/") {
      const end = src.indexOf("\n", i + 2);
      i = end === -1 ? n : end;
      continue;
    }
    // String literal "..." or '...' or `...` (template)
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      out += " "; // preserve length-ish (we don't care about exact)
      i++;
      while (i < n) {
        if (src[i] === "\\") {
          i += 2;
          continue;
        }
        if (src[i] === quote) {
          i++;
          break;
        }
        if (quote === "`" && src[i] === "$" && src[i + 1] === "{") {
          // Template expression — keep contents (could be JSX)
          out += "  ";
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            if (src[i] === "{") depth++;
            else if (src[i] === "}") depth--;
            if (depth > 0) out += src[i];
            i++;
          }
          continue;
        }
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function scan() {
  const violations = [];
  for (const file of walk(SRC_DIR)) {
    const rel = relative(ROOT, file);
    if (ALLOWLIST.has(rel)) continue;
    const content = readFileSync(file, "utf-8");
    if (isClientFile(content)) continue;
    const clean = stripCommentsAndStrings(content);
    const m = clean.match(HANDLER_RE);
    if (m) {
      // Localizar línea en el SRC original (no en clean, para reportar bien)
      const fullPattern = m[0];
      // Buscamos handler={ en el original; debe existir
      const handlerToken = ` ${m[1]}=`;
      const idx = content.indexOf(handlerToken);
      const before = content.slice(0, idx >= 0 ? idx : 0);
      const line = before.split("\n").length;
      violations.push({ file: rel, line, handler: m[1] });
    }
  }
  return violations;
}

const violations = scan();
if (violations.length === 0) {
  console.log("[check-rsc-event-handlers] ✓ ningún Server Component con event handler.");
  process.exit(0);
}

console.error(
  "\n[check-rsc-event-handlers] ✗ detectados Server Components con event handlers JSX.",
);
console.error(
  "  React Server Components NO pueden tener funciones como props.",
);
console.error(
  "  → añade 'use client' en la primera línea del archivo, o mueve el subárbol interactivo a un Client Component aparte.\n",
);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.handler}={...}`);
}
console.error(
  `\n  Total violaciones: ${violations.length}. Documentado en CLAUDE.md sección "Server Components ≠ event handlers".\n`,
);
process.exit(1);
