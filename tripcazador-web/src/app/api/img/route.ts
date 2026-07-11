import { NextRequest, NextResponse } from "next/server";

/**
 * /api/img — proxy de imágenes con cache (abr-2026o, #220)
 *
 * Por qué: las hero images del blog vienen de unsplash.com con URLs largas
 * y dependencia directa de su CDN. Este proxy las sirve desde el edge de
 * Vercel con cache 7d, lo que:
 *   1. Reduce LCP (CDN edge < unsplash CDN)
 *   2. Elimina dependencia (si unsplash cae, las imágenes ya en cache)
 *   3. Permite firmar URLs en el futuro (anti-hotlinking)
 *
 * Uso:
 *   /api/img?u=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1474968600831
 *   /api/img?u=...&w=800&q=80   (resize hint pasado a unsplash)
 *
 * Whitelist estricta de hosts permitidos — sin esto el proxy se convierte
 * en open relay para SSRF.
 */

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "tile.openstreetmap.org",
  // Añade aquí cualquier CDN externo que el blog/destinos use.
]);

const CACHE_SECONDS = 7 * 24 * 3600; // 7 días


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const upstream = url.searchParams.get("u");
  if (!upstream) {
    return NextResponse.json({ error: "missing u param" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(upstream);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  // SSRF defense: solo HTTPS + hosts whitelisted.
  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "https required" }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json(
      { error: `host ${target.hostname} not allowed` },
      { status: 403 },
    );
  }

  // Pass-through de hints opcionales w/q al upstream (unsplash respeta ambos).
  const w = url.searchParams.get("w");
  const q = url.searchParams.get("q");
  if (w) target.searchParams.set("w", w);
  if (q) target.searchParams.set("q", q);

  try {
    const upstreamRes = await fetch(target.toString(), {
      // Edge runtime cache propio de Next: 7 días.
      next: { revalidate: CACHE_SECONDS },
      headers: {
        // No reenviamos cookies / auth headers — defensa en profundidad.
        "User-Agent": "TripCazador-ImageProxy/1.0",
      },
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `upstream ${upstreamRes.status}` },
        { status: 502 },
      );
    }

    const contentType =
      upstreamRes.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "upstream not an image" },
        { status: 502 },
      );
    }

    // Stream el body sin buffering (mejor TTFB en imágenes grandes).
    return new Response(upstreamRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache pública aggresiva: 7d en CDN, 1d en browser, stale-while-revalidate
        "Cache-Control": `public, max-age=86400, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
        // Anti-MIME sniffing.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "fetch failed", detail: String(e).slice(0, 100) },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";
