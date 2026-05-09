import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, getAllTagsWithCounts } from "@/lib/blog";
import { AIRLINES } from "@/lib/airlines";
import { HUBS } from "@/lib/hubs";
import { COMPARISONS } from "@/lib/comparisons";
import { REGIONS } from "@/lib/regions";
import { MONTHS } from "@/lib/months";

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
    `https://${HOST}/rss.xml`,
    `https://${HOST}/en/rss.xml`,
    `https://${HOST}/aerolineas`,
    ...posts.map((p) => `https://${HOST}/blog/${p.slug}`),
    // EN sister-posts: aunque no tienen MDX dedicado, los slugs EN existen
    // como rewrite-fallback en getAllPosts() cuando hay versión inglesa.
    ...posts
      .filter(
        (p) =>
          p.resolvedLang === "en" ||
          /-en$|cheapest|how-to-catch|what-is-an-error/.test(p.slug),
      )
      .map((p) => `https://${HOST}/en/blog/${p.slug}`),
    // abr-2026x: tag pages ES + EN, aerolíneas individuales
    ...getAllTagsWithCounts("es").map(
      (t) => `https://${HOST}/blog/tag/${encodeURIComponent(t.tag)}`,
    ),
    ...getAllTagsWithCounts("en").map(
      (t) => `https://${HOST}/en/blog/tag/${encodeURIComponent(t.tag)}`,
    ),
    ...AIRLINES.map((a) => `https://${HOST}/aerolineas/${a.code.toLowerCase()}`),
    // abr-2026y: glosario, prensa, hubs, comparativas
    `https://${HOST}/glosario`,
    `https://${HOST}/prensa`,
    `https://${HOST}/comparar`,
    `https://${HOST}/vuelos-desde`,
    ...HUBS.map((h) => `https://${HOST}/vuelos-desde/${h.code.toLowerCase()}`),
    ...COMPARISONS.map((c) => `https://${HOST}/comparar/${c.slug}`),
    // abr-2026z: calculadora, mapa, embed
    `https://${HOST}/calculadora`,
    `https://${HOST}/mapa-precios`,
    `https://${HOST}/embed`,
    // abr-2026aa: calculadora-co2, opiniones, faq, lead-magnet #2
    `https://${HOST}/calculadora-co2`,
    `https://${HOST}/opiniones`,
    `https://${HOST}/faq`,
    `https://${HOST}/lead-magnet/30-trucos-avanzados`,
    // abr-2026bb: buscar, calculadora-millas, stopovers
    `https://${HOST}/buscar`,
    `https://${HOST}/calculadora-millas`,
    `https://${HOST}/stopovers`,
    // abr-2026cc: calculadora-cancelacion, partners, regiones
    `https://${HOST}/calculadora-cancelacion`,
    `https://${HOST}/partners`,
    `https://${HOST}/regiones`,
    ...REGIONS.map((r) => `https://${HOST}/regiones/${r.slug}`),
    // abr-2026dd: vuelos-baratos-mes hub + calculadora-upgrade
    // abr-2026ee: monthly URL pattern moved to /vuelos-baratos/{slug} (nested) tras
    // bug Vercel CLI con bracket-prefix routes. Index sigue en /vuelos-baratos-mes.
    `https://${HOST}/vuelos-baratos-mes`,
    `https://${HOST}/calculadora-upgrade`,
    ...MONTHS.map((m) => `https://${HOST}/vuelos-baratos/${m.slug}`),
    // SSS40 social OG endpoints (alta probabilidad share / OG image rich preview)
    `https://${HOST}/api/og/social/post`,
    `https://${HOST}/api/og/social/story`,
    `https://${HOST}/api/og/social/carousel?topic=trucos&slide=1`,
    `https://${HOST}/api/og/social/carousel?topic=chollos&slide=1`,
    // SSS36 alertas page (creada en este ciclo)
    `https://${HOST}/alertas`,
    // TTT08 — 50 páginas pareadas /vuelos/{origen-destino} long-tail SEO.
    // Fast-track indexación para que IndexNow las publique ya en lugar de
    // esperar al rastreo orgánico. Estimado +3000-5000 visitors/mes
    // post-indexación.
    ...[
      "madrid-lisboa", "madrid-londres", "barcelona-roma", "madrid-paris",
      "barcelona-londres", "madrid-roma", "barcelona-paris", "madrid-amsterdam",
      "madrid-berlin", "barcelona-amsterdam",
      "madrid-nueva-york", "madrid-tokio", "madrid-bangkok", "madrid-buenos-aires",
      "barcelona-nueva-york", "madrid-cancun", "madrid-bali", "madrid-cuba",
      "barcelona-tokio", "madrid-marrakech",
      "sevilla-roma", "sevilla-londres", "valencia-londres", "valencia-roma",
      "bilbao-paris", "bilbao-londres", "malaga-londres", "malaga-paris",
      "alicante-londres", "palma-zurich",
      "madrid-praga", "madrid-budapest", "madrid-viena", "madrid-dublin",
      "madrid-copenhague", "barcelona-praga", "barcelona-berlin", "barcelona-viena",
      "barcelona-dublin", "barcelona-atenas",
      "paris-roma", "londres-amsterdam", "amsterdam-berlin", "viena-praga",
      "lisboa-paris", "roma-atenas", "berlin-paris", "milan-londres",
      "zurich-londres", "amsterdam-roma",
      // UUU01 — 45 nuevas rutas pareadas long-haul + sun-coast + EU emerging
      "barcelona-estambul", "madrid-doha",
      "madrid-singapur", "madrid-hong-kong", "madrid-seul", "madrid-shanghai",
      "madrid-melbourne", "madrid-sidney",
      "madrid-bogota", "madrid-santiago-chile", "madrid-sao-paulo",
      "madrid-mexico", "madrid-rio-de-janeiro",
      "madrid-johannesburgo", "madrid-ciudad-del-cabo", "madrid-nairobi",
      "madrid-casablanca", "madrid-malta", "madrid-chipre", "barcelona-malta",
      "madrid-tenerife", "madrid-gran-canaria", "barcelona-tenerife",
      "madrid-helsinki", "madrid-estocolmo", "madrid-oslo",
      "barcelona-helsinki", "madrid-varsovia", "madrid-cracovia",
      "madrid-bucarest", "madrid-belgrado", "madrid-tirana",
      "barcelona-cracovia", "barcelona-belgrado", "barcelona-bucarest",
      "valencia-paris", "valencia-amsterdam", "sevilla-paris", "sevilla-amsterdam",
      "bilbao-amsterdam", "bilbao-roma", "malaga-roma",
      "milan-barcelona", "praga-paris", "amsterdam-paris",
    ].map((s) => `https://${HOST}/vuelos/${s}`),
    // WWW04/05+XXX01 — i18n DACH/IT destinos[slug] (10 destinos × 3 locales = 30).
    ...[
      "japan", "thailand", "bali", "new-york", "iceland", "bangkok",
      "paris", "london", "lisbon", "dubai",
    ].flatMap(
      (slug) => ["it", "de", "fr"].map(
        (locale) => `https://${HOST}/${locale}/destinos/${slug}`,
      ),
    ),
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
