/**
 * /api/badges/[id].svg — SSS441 (23 may 2026)
 *
 * Sirve SVG badges para partners — accedido como `${SITE_URL}/api/badges/featured.svg`
 * (el .svg viene del segmento dinámico, no de un archivo).
 *
 * Public, CORS abierto, cache forever (los badges cambian raramente).
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

const BADGES: Record<string, { label: string; color: string }> = {
  featured: { label: "Featured", color: "#f59e0b" },
  partner: { label: "Partner", color: "#10b981" },
  api: { label: "API Powered", color: "#3b82f6" },
  data: { label: "Data Source", color: "#8b5cf6" },
};

function buildBadgeSvg(label: string, color: string): string {
  const labelLeft = "TripCazador";
  const widthLeft = labelLeft.length * 7 + 12;
  const widthRight = label.length * 7 + 12;
  const totalWidth = widthLeft + widthRight;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="22" role="img" aria-label="TripCazador: ${label}">`,
    `<linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`,
    `<rect width="${totalWidth}" height="22" rx="4" fill="${color}"/>`,
    `<rect width="${widthLeft}" height="22" rx="4" fill="#0f172a"/>`,
    `<rect width="${widthRight}" height="22" rx="4" x="${widthLeft}" fill="${color}"/>`,
    `<rect width="${totalWidth}" height="22" rx="4" fill="url(#g)"/>`,
    `<g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">`,
    `<text x="${widthLeft / 2}" y="15">${labelLeft}</text>`,
    `<text x="${widthLeft + widthRight / 2}" y="15">${label}</text>`,
    `</g></svg>`,
  ].join("");
}

export function generateStaticParams(): Array<{ id: string }> {
  // Permitir solicitar con o sin .svg
  return Object.keys(BADGES).flatMap((id) => [{ id }, { id: `${id}.svg` }]);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const cleanId = params.id.replace(/\.svg$/i, "");
  const def = BADGES[cleanId];
  if (!def) {
    return new NextResponse("Badge not found", { status: 404 });
  }
  const svg = buildBadgeSvg(def.label, def.color);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
