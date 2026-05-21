/**
 * blog_image_gen.ts — SSS373 (21 may 2026)
 *
 * Auto-genera hero images para blog posts que no tienen `heroImage` en
 * frontmatter. Soporta dos providers:
 *
 *   - Replicate FLUX.1-schnell (~$0.003/img · fast, good enough)
 *   - OpenAI DALL-E 3 standard 1792x1024 (~$0.04/img · better)
 *
 * Provider seleccionado via env BLOG_IMG_PROVIDER ("replicate" | "openai").
 * Sin env vars → pure dry-run + log (zero cost).
 *
 * Workflow esperado (script):
 *   1. Iterar blog posts sin heroImage
 *   2. Generar prompt desde title + tags
 *   3. Llamar API → guardar webp en /public/blog-hero/{slug}.webp
 *   4. Update frontmatter con heroImage path (manual o via script)
 */

import crypto from "crypto";

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const PROVIDER = (process.env.BLOG_IMG_PROVIDER || "replicate").toLowerCase();

export interface ImagePromptInput {
  title: string;
  description?: string;
  tags?: string[];
  /** Bias estético opcional: "vibrant", "muted", "cinematic", etc. */
  style?: string;
}

/**
 * buildPrompt — convierte metadata blog a prompt visual de calidad.
 * Pure fn, testeable.
 */
export function buildPrompt(input: ImagePromptInput): string {
  const tags = (input.tags || []).slice(0, 3).join(", ");
  const style = input.style || "cinematic travel photography, warm light, high detail";
  const parts = [
    `Hero image for travel article: "${input.title}"`,
    tags ? `themes: ${tags}` : "",
    `style: ${style}`,
    "no text, no logos, no watermarks, no people facing camera, wide composition, 16:9",
  ].filter(Boolean);
  return parts.join(". ");
}

/**
 * detectDestinationFromTitle — heurística para enriquecer prompt con
 * referencias geográficas conocidas.
 */
export function detectDestinationFromTitle(title: string): string | null {
  const t = title.toLowerCase();
  const dests: Array<[RegExp, string]> = [
    [/tokio|japón|japon/i, "Tokyo skyline at golden hour, Mt Fuji silhouette"],
    [/bali/i, "Bali rice terraces in Ubud, lush green tropical"],
    [/tailand/i, "Thai longtail boats Phuket azure water"],
    [/nueva york|new york|nyc/i, "Manhattan skyline blue hour Brooklyn bridge"],
    [/parís|paris/i, "Paris rooftops Eiffel tower haze"],
    [/londres|london/i, "London Tower bridge dusk"],
    [/roma|rome/i, "Rome Colosseum sunset stone glow"],
    [/marrakech|marruecos/i, "Marrakech medina spices sunlight"],
    [/canarias|tenerife/i, "Tenerife volcanic coastline Atlantic waves"],
    [/dubai|emiratos/i, "Dubai Burj Khalifa desert dunes"],
  ];
  for (const [re, hint] of dests) {
    if (re.test(t)) return hint;
  }
  return null;
}

export function buildEnrichedPrompt(input: ImagePromptInput): string {
  const base = buildPrompt(input);
  const dest = detectDestinationFromTitle(input.title);
  return dest ? `${base}. Scene: ${dest}` : base;
}

export interface GenerateResult {
  ok: boolean;
  url?: string;
  provider: string;
  dry_run: boolean;
  cost_estimate_usd: number;
  reason?: string;
}

/**
 * generateViaReplicate — POST a Replicate FLUX.1-schnell.
 * Devuelve URL pública (Replicate las hostea ~24h). Descargar inmediatamente.
 */
async function generateViaReplicate(prompt: string): Promise<GenerateResult> {
  if (!REPLICATE_TOKEN) {
    return {
      ok: false,
      provider: "replicate",
      dry_run: true,
      cost_estimate_usd: 0,
      reason: "no_token",
    };
  }
  try {
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
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
    if (!start.ok) {
      return {
        ok: false,
        provider: "replicate",
        dry_run: false,
        cost_estimate_usd: 0,
        reason: `start_${start.status}`,
      };
    }
    const data = await start.json();
    // Replicate retorna URL completion en `urls.get`. Sin polling aquí
    // (script orchestrator hace polling). Devolvemos pending URL.
    return {
      ok: true,
      url: data?.urls?.get || data?.output?.[0],
      provider: "replicate",
      dry_run: false,
      cost_estimate_usd: 0.003,
    };
  } catch (e) {
    return {
      ok: false,
      provider: "replicate",
      dry_run: false,
      cost_estimate_usd: 0,
      reason: `exception_${String(e).slice(0, 30)}`,
    };
  }
}

async function generateViaOpenAI(prompt: string): Promise<GenerateResult> {
  if (!OPENAI_KEY) {
    return {
      ok: false,
      provider: "openai",
      dry_run: true,
      cost_estimate_usd: 0,
      reason: "no_token",
    };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        provider: "openai",
        dry_run: false,
        cost_estimate_usd: 0,
        reason: `start_${res.status}`,
      };
    }
    const data = await res.json();
    return {
      ok: true,
      url: data?.data?.[0]?.url,
      provider: "openai",
      dry_run: false,
      cost_estimate_usd: 0.04,
    };
  } catch (e) {
    return {
      ok: false,
      provider: "openai",
      dry_run: false,
      cost_estimate_usd: 0,
      reason: `exception_${String(e).slice(0, 30)}`,
    };
  }
}

/**
 * generateHeroImage — entry point. Selecciona provider, build prompt, call.
 * Sin env vars → dry_run con coste 0 (devuelve URL placeholder local).
 */
export async function generateHeroImage(
  input: ImagePromptInput,
): Promise<GenerateResult> {
  const prompt = buildEnrichedPrompt(input);

  if (PROVIDER === "openai") {
    return generateViaOpenAI(prompt);
  }
  return generateViaReplicate(prompt);
}

/**
 * placeholderSeed — para tests o para hero deterministic cuando no hay
 * provider activo, deriva un nombre slugificado del título.
 */
export function placeholderSeed(title: string): string {
  return crypto.createHash("sha1").update(title).digest("hex").slice(0, 12);
}

export const __test__ = {
  buildPrompt,
  buildEnrichedPrompt,
  detectDestinationFromTitle,
  placeholderSeed,
  PROVIDER,
};
