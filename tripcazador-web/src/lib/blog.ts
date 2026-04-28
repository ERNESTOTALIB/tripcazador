import fs from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export type BlogFrontmatter = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  tags: string[];
  readingTime: number;
  author: string;
  heroImage?: string;
  /** "es" | "en" — abr-2026x. Default "es" si no está en frontmatter. */
  lang?: string;
};

export type BlogPost = BlogFrontmatter & {
  content: string;
  /** mtime del fichero MDX en ISO. Para Article.dateModified y sitemap lastmod. */
  lastModified: string;
  /** Conteo de palabras del cuerpo (para Article.wordCount). */
  wordCount: number;
  /** Idioma resuelto: "es" | "en" tras aplicar frontmatter + heurística. */
  resolvedLang: "es" | "en";
};

/**
 * abr-2026x: heurística para detectar idioma cuando frontmatter no tiene `lang`.
 * Cuenta marcadores típicos. Conservadora: ante duda → "es" (mayoría del corpus).
 */
function detectLang(title: string, description: string): "es" | "en" {
  const text = `${title} ${description}`.toLowerCase();
  // Marcadores fuertes EN: "the", "a beginner", "how to", "in 2026", "cheapest"
  const enHits =
    (text.match(/\b(the|how|cheapest|business class .* for|a beginner|in 2026|with|fly|catch|under \$\d|guide to)\b/g) || []).length;
  // Marcadores ES: artículos, preposiciones, palabras inequívocas
  const esHits =
    (text.match(/\b(qué|cómo|cuándo|para|desde|guía|vuelos|cazar|baratos|mejores|trucos)\b/g) || []).length;
  if (esHits === 0 && enHits >= 1) return "en";
  if (enHits > esHits + 1) return "en"; // dominancia EN clara
  return "es";
}

/**
 * Parsea el frontmatter YAML de un archivo MDX.
 * No usamos gray-matter para evitar añadir dependencias.
 * Solo soporta un subconjunto YAML simple (strings y arrays de strings).
 */
function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: raw };
  const [, yamlBlock, body] = match;
  const fm: Record<string, unknown> = {};
  for (const line of yamlBlock.split("\n")) {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    let value: string | string[] | number = rawValue.trim();
    if (typeof value === "string") {
      // Array: [a, b, c]
      if (value.startsWith("[") && value.endsWith("]")) {
        const inner = value.slice(1, -1);
        value = inner
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        value = value.replace(/^["']|["']$/g, "");
        if (/^\d+$/.test(value as string)) value = Number(value);
      }
    }
    fm[key] = value;
  }
  return { frontmatter: fm, content: body };
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const file = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { frontmatter, content } = parseFrontmatter(raw);
  // mtime del fichero — sirve como dateModified real cuando frontmatter no
  // se ha actualizado tras una edición. Si fs.statSync falla (raro), fallback
  // a publishedAt.
  let lastModified: string;
  try {
    lastModified = fs.statSync(file).mtime.toISOString();
  } catch {
    lastModified = (frontmatter.publishedAt as string) || new Date().toISOString();
  }
  // wordCount: split rápido por whitespace (excluye stop-words = OK para
  // Article.wordCount; Google no lo utiliza para ranking, sólo metadata).
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const title = (frontmatter.title as string) || slug;
  const description = (frontmatter.description as string) || "";
  // Resolver idioma: frontmatter explícito > heurística sobre title+description
  const explicitLang = (frontmatter.lang as string | undefined)?.toLowerCase();
  const resolvedLang: "es" | "en" =
    explicitLang === "en" || explicitLang === "es"
      ? (explicitLang as "es" | "en")
      : detectLang(title, description);
  return {
    title,
    description,
    slug: (frontmatter.slug as string) || slug,
    publishedAt: (frontmatter.publishedAt as string) || new Date().toISOString().slice(0, 10),
    tags: (frontmatter.tags as string[]) || [],
    readingTime: (frontmatter.readingTime as number) || 8,
    author: (frontmatter.author as string) || "Equipo TripCazador",
    heroImage: frontmatter.heroImage as string | undefined,
    lang: explicitLang as string | undefined,
    content,
    lastModified,
    wordCount,
    resolvedLang,
  };
}

/** abr-2026x: helpers para feeds e índices i18n. */
export function getPostsByLang(lang: "es" | "en"): BlogPost[] {
  return getAllPosts().filter((p) => p.resolvedLang === lang);
}

/** Lista única de tags con su conteo, ordenada desc por frecuencia. */
export function getAllTagsWithCounts(lang?: "es" | "en"): Array<{ tag: string; count: number }> {
  const posts = lang ? getPostsByLang(lang) : getAllPosts();
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Posts que llevan un tag concreto (case-insensitive). */
export function getPostsByTag(tag: string, lang?: "es" | "en"): BlogPost[] {
  const t = tag.toLowerCase();
  const posts = lang ? getPostsByLang(lang) : getAllPosts();
  return posts.filter((p) => p.tags.some((x) => x.toLowerCase() === t));
}

/**
 * Top N posts relacionados a `slug` por solapamiento de tags. Si no hay
 * suficientes tags en común, completa con los más recientes del mismo idioma.
 */
export function getRelatedPosts(slug: string, n: number = 3): BlogPost[] {
  const all = getAllPosts();
  const target = all.find((p) => p.slug === slug);
  if (!target) return all.slice(0, n);
  const targetTags = new Set(target.tags.map((t) => t.toLowerCase()));
  const scored = all
    .filter((p) => p.slug !== slug && p.resolvedLang === target.resolvedLang)
    .map((p) => {
      const overlap = p.tags.reduce(
        (acc, t) => acc + (targetTags.has(t.toLowerCase()) ? 1 : 0),
        0,
      );
      return { post: p, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap || (a.post.publishedAt < b.post.publishedAt ? 1 : -1));
  // Filter: si hay overlap > 0, usar esos; si no, fallback a los más recientes
  const withOverlap = scored.filter((s) => s.overlap > 0);
  if (withOverlap.length >= n) return withOverlap.slice(0, n).map((s) => s.post);
  // completar con recientes del mismo idioma
  const seen = new Set(withOverlap.map((s) => s.post.slug));
  const fillers = scored
    .filter((s) => !seen.has(s.post.slug))
    .slice(0, n - withOverlap.length)
    .map((s) => s.post);
  return [...withOverlap.slice(0, n).map((s) => s.post), ...fillers];
}

export function getAllPosts(): BlogPost[] {
  return getAllPostSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
