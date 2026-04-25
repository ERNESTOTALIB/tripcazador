import { NextRequest, NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

/**
 * IndexNow ping — abr-2026k
 *
 * IndexNow es el protocolo común para Bing/Yandex/Seznam (también soportado
 * por Naver). Pingueamos al protocolo cuando hay nuevas URLs que indexar
 * (post-publicación de un blog post o re-deploy con cambios).
 *
 * Endpoint: GET /api/indexnow?token=XXX  (token = INDEXNOW_TOKEN env)
 *  - Lista las URLs canónicas a publicar (home, blog, todos los blog posts,
 *    /en, /en/blog, /en/destinos, /destinos).
 *  - Las envía a https://api.indexnow.org/IndexNow vía POST JSON.
 *  - Devuelve {ok, count, indexnow_status} sin filtrar info sensible.
 *
 * Setup (una vez):
 *  1. Generar UUID = INDEXNOW_TOKEN (32+ chars hex).
 *  2. Subir public/<TOKEN>.txt con el TOKEN como contenido (verificación).
 *  3. Setear env var INDEXNOW_TOKEN en Vercel.
 *  4. Llamar GET /api/indexnow?token=<TOKEN> tras cada deploy.
 *
 * Auth: comparamos contra INDEXNOW_TOKEN env var. Constant-time compare
 * para evitar timing attacks.
 */

const HOST = "tripcazador.com";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.INDEXNOW_TOKEN || "";
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "INDEXNOW_TOKEN no configurado" },
      { status: 503 },
    );
  }
  if (!token || !constantTimeEqual(token, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Listado de URLs a publicar — incluir todas las páginas indexables.
  // abr-2026q: añadidos /it, /de, /fr y blog posts EN para cobertura
  // hreflang completa cuando el contenido se actualiza.
  const posts = getAllPosts();
  const urls: string[] = [
    `https://${HOST}/`,
    `https://${HOST}/blog`,
    `https://${HOST}/destinos`,
    `https://${HOST}/deals`,
    `https://${HOST}/hoteles`,
    `https://${HOST}/en`,
    `https://${HOST}/en/blog`,
    `https://${HOST}/en/destinos`,
    `https://${HOST}/de`,
    `https://${HOST}/fr`,
    `https://${HOST}/it`,
    `https://${HOST}/lead-magnet/50-hubs-error-fare`,
    ...posts.map((p) => `https://${HOST}/blog/${p.slug}`),
    // EN sister-posts: aunque no tienen MDX dedicado, los slugs EN existen
    // como rewrite-fallback en getAllPosts() cuando hay versión inglesa.
    ...posts
      .filter((p) => /-en$|cheapest|how-to-catch|what-is-an-error/.test(p.slug))
      .map((p) => `https://${HOST}/en/blog/${p.slug}`),
  ];

  const body = {
    host: HOST,
    key: expected,
    keyLocation: `https://${HOST}/${expected}.txt`,
    urlList: urls,
  };

  let indexnowStatus = 0;
  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      // No revelamos el endpoint a CDNs intermedios.
      cache: "no-store",
    });
    indexnowStatus = res.status;
  } catch {
    indexnowStatus = -1;
  }

  // abr-2026q: Google ping es deprecated (Google retiró /ping/sitemap en Jun 2023)
  // pero pingueamos a Bing (legacy) por si acaso. Yandex no requiere ping
  // separado — ya está cubierto por IndexNow.
  let bingStatus = 0;
  try {
    const sitemapUrl = encodeURIComponent(`https://${HOST}/sitemap.xml`);
    const res = await fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`, {
      cache: "no-store",
    });
    bingStatus = res.status;
  } catch {
    bingStatus = -1;
  }

  return NextResponse.json({
    ok: indexnowStatus >= 200 && indexnowStatus < 300,
    count: urls.length,
    indexnow_status: indexnowStatus,
    bing_ping_status: bingStatus,
  });
}

export const dynamic = "force-dynamic";
