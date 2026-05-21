#!/usr/bin/env node
/**
 * scripts/gen-blog-heroes.mjs — SSS373
 *
 * Iterativo: encuentra blog posts sin `heroImage` en frontmatter,
 * genera imagen vía Replicate FLUX-schnell, descarga a /public/blog-hero/.
 *
 * Pensado para ejecutar manual: `node scripts/gen-blog-heroes.mjs --dry`
 *
 * Sin REPLICATE_API_TOKEN → dry-run logs prompts (zero coste).
 *
 * NOTA: este script NO modifica los MDX frontmatter (riesgo merge conflicts
 * + tracked changes). Imprime al final lista de slug + ruta image para
 * que el operador haga PR manual con la actualización.
 */

import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const PUBLIC_HERO_DIR = path.join(process.cwd(), "public/blog-hero");
const DRY = process.argv.includes("--dry") || !process.env.REPLICATE_API_TOKEN;

if (!fs.existsSync(BLOG_DIR)) {
  console.error(`[gen-blog-heroes] BLOG_DIR no existe: ${BLOG_DIR}`);
  process.exit(0);
}
if (!fs.existsSync(PUBLIC_HERO_DIR)) {
  fs.mkdirSync(PUBLIC_HERO_DIR, { recursive: true });
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const block = m[1];
  const fm = {};
  for (const line of block.split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return fm;
}

function detectDest(title) {
  const t = title.toLowerCase();
  if (/tokio|japón|japon/.test(t)) return "Tokyo skyline mt fuji golden hour";
  if (/bali/.test(t)) return "Bali rice terraces lush green";
  if (/parís|paris/.test(t)) return "Paris rooftops eiffel haze";
  if (/londres|london/.test(t)) return "London tower bridge dusk";
  if (/roma|rome/.test(t)) return "Rome Colosseum sunset";
  if (/canarias|tenerife/.test(t)) return "Tenerife volcanic coastline";
  return null;
}

function buildPrompt(title, tags) {
  const dest = detectDest(title);
  const tagStr = (tags || "").split(",").slice(0, 3).join(", ");
  return [
    `Hero image for travel article: "${title}"`,
    tagStr ? `themes: ${tagStr}` : "",
    "style: cinematic travel photography, warm light, high detail",
    dest ? `Scene: ${dest}` : "",
    "no text, no logos, no people facing camera, wide 16:9",
  ]
    .filter(Boolean)
    .join(". ");
}

const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
let withHero = 0;
let withoutHero = 0;
const candidates = [];

for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  const content = fs.readFileSync(path.join(BLOG_DIR, f), "utf8");
  const fm = parseFrontmatter(content);
  if (!fm || !fm.title) continue;
  if (fm.heroImage) {
    withHero++;
    continue;
  }
  withoutHero++;
  candidates.push({ slug, title: fm.title, tags: fm.tags || "" });
}

console.log(`[gen-blog-heroes] Found ${files.length} MDX files`);
console.log(`  - ${withHero} con heroImage (skipped)`);
console.log(`  - ${withoutHero} candidatos (sin heroImage)`);
console.log(`  - DRY mode: ${DRY ? "ON" : "OFF"}`);

if (candidates.length === 0) {
  console.log("Nada que hacer.");
  process.exit(0);
}

const MAX = 5; // batch suave por run
const toRun = candidates.slice(0, MAX);
console.log(`\nProcesando primeros ${toRun.length} candidatos:\n`);

for (const c of toRun) {
  const prompt = buildPrompt(c.title, c.tags);
  console.log(`[${c.slug}]`);
  console.log(`  prompt: ${prompt.slice(0, 120)}…`);

  if (DRY) {
    console.log("  → DRY-RUN (skipped network call)");
    continue;
  }

  try {
    const startRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-schnell",
        input: {
          prompt,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 85,
        },
      }),
    });
    if (!startRes.ok) {
      console.log(`  ✗ start failed: ${startRes.status}`);
      continue;
    }
    const start = await startRes.json();
    console.log(`  → pending prediction ${start.id} (operator: poll + download manual)`);
  } catch (e) {
    console.log(`  ✗ ${String(e).slice(0, 60)}`);
  }
}

console.log("\nManual follow-up: añadir `heroImage: /blog-hero/{slug}.webp` al frontmatter.");
