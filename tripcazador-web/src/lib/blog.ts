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
};

export type BlogPost = BlogFrontmatter & {
  content: string;
  /** mtime del fichero MDX en ISO. Para Article.dateModified y sitemap lastmod. */
  lastModified: string;
  /** Conteo de palabras del cuerpo (para Article.wordCount). */
  wordCount: number;
};

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
  return {
    title: (frontmatter.title as string) || slug,
    description: (frontmatter.description as string) || "",
    slug: (frontmatter.slug as string) || slug,
    publishedAt: (frontmatter.publishedAt as string) || new Date().toISOString().slice(0, 10),
    tags: (frontmatter.tags as string[]) || [],
    readingTime: (frontmatter.readingTime as number) || 8,
    author: (frontmatter.author as string) || "Equipo TripCazador",
    heroImage: frontmatter.heroImage as string | undefined,
    content,
    lastModified,
    wordCount,
  };
}

export function getAllPosts(): BlogPost[] {
  return getAllPostSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
