/**
 * TableOfContents — TTT04 (May 2026).
 *
 * Server component que extrae los headings (## H2, ### H3) del markdown
 * de un post y renderiza una tabla de contenidos clicable. Mejora dwell
 * time + scroll-depth en posts >1200 palabras.
 *
 * Las anchors se generan con la misma fórmula que rehype-slug usa
 * (lowercase, espacios → guiones, strip caracteres especiales). Eso
 * garantiza que los hash links funcionan con los IDs que rehype-slug
 * inyecta en runtime.
 */

interface TocEntry {
  level: 2 | 3;
  text: string;
  id: string;
}

/** Slug igual al que produce rehype-slug por defecto (basado en github-slugger). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacríticos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractToc(markdown: string): TocEntry[] {
  const out: TocEntry[] = [];
  const seen = new Map<string, number>();
  // Match ##  / ### al inicio de línea, ignora ####+
  const lines = markdown.split("\n");
  let inCodeBlock = false;
  for (const raw of lines) {
    // Skip fenced code blocks (``` o ~~~)
    if (/^(```|~~~)/.test(raw)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const m = raw.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    if (level !== 2 && level !== 3) continue;
    // Strip markdown inline (negrita, italics, links, code)
    const cleanText = m[2]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]+/g, "")
      .trim();
    if (!cleanText) continue;
    const baseId = slugify(cleanText);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;
    out.push({ level, text: cleanText, id });
  }
  return out;
}

interface Props {
  content: string;
  /** "es" → "Tabla de contenidos", "en" → "Table of contents" */
  lang?: "es" | "en";
  /** Si hay menos de N entradas, no renderiza nada (no aporta valor). */
  minEntries?: number;
}

export function TableOfContents({
  content,
  lang = "es",
  minEntries = 3,
}: Props) {
  const toc = extractToc(content);
  if (toc.length < minEntries) return null;

  const heading = lang === "en" ? "Table of contents" : "Tabla de contenidos";

  return (
    <nav
      aria-label={heading}
      className="not-prose my-8 rounded-xl border border-gray-800 bg-gray-900/60 p-5"
    >
      <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-3">
        {heading}
      </p>
      <ol className="space-y-1.5 text-sm">
        {toc.map((entry, i) => (
          <li
            key={`${entry.id}-${i}`}
            className={entry.level === 3 ? "ml-4" : ""}
          >
            <a
              href={`#${entry.id}`}
              className="text-gray-300 hover:text-amber-300 transition-colors line-clamp-2"
            >
              {entry.level === 2 ? "" : "↳ "}
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default TableOfContents;
