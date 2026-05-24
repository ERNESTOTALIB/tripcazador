/**
 * /partner-badges — SSS441 (23 may 2026)
 *
 * Generador de badges embebibles para partners, blogs, sites externos
 * que quieran mostrar "Featured on TripCazador" o similares.
 *
 * Cada badge es un SVG inline (data URI). El page muestra preview +
 * código HTML/Markdown para pegar, con copy buttons (client component).
 *
 * Nota: /badges (user gamification) ya existe — usamos /partner-badges
 * para no chocar.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCopyButton } from "@/components/BadgeCopyButton";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Partner badges para embeber",
  description:
    "SVG badges 'Featured on TripCazador', 'Partner', 'API Powered'. Código HTML/Markdown copiable para blogs, sites y emails.",
  alternates: { canonical: `${SITE_URL}/partner-badges` },
  openGraph: {
    title: "Partner badges TripCazador",
    description: "Embebe badges en tu blog o site.",
    url: `${SITE_URL}/partner-badges`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

interface BadgeDef {
  id: string;
  label: string;
  description: string;
  color: string;
  svg: string;
}

function buildBadgeSvg(label: string, color: string): string {
  // Estilo shields.io: izquierda fondo oscuro con "TripCazador",
  // derecha color con label custom.
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

const BADGES: BadgeDef[] = [
  {
    id: "featured",
    label: "Featured",
    description: "Para sites destacados en TripCazador o entrevistados.",
    color: "#f59e0b",
    svg: "",
  },
  {
    id: "partner",
    label: "Partner",
    description: "Para partners afiliados / asesores oficiales.",
    color: "#10b981",
    svg: "",
  },
  {
    id: "api",
    label: "API Powered",
    description: "Para sites usando /api/widgets/deals.",
    color: "#3b82f6",
    svg: "",
  },
  {
    id: "data",
    label: "Data Source",
    description: "Para medios citando datos de TripCazador.",
    color: "#8b5cf6",
    svg: "",
  },
];

BADGES.forEach((b) => {
  b.svg = buildBadgeSvg(b.label, b.color);
});

function toDataUri(svg: string): string {
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function PartnerBadgesPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="text-5xl">🏆</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Partner badges
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Si TripCazador te ha citado, eres partner afiliado o usas nuestra API
          pública, pega uno de estos badges en tu sitio.
        </p>
      </header>

      <section className="space-y-6">
        {BADGES.map((b) => {
          const dataUri = toDataUri(b.svg);
          const badgeUrl = `${SITE_URL}/api/badges/${b.id}.svg`;
          const htmlEmbed = `<a href="${SITE_URL}" target="_blank" rel="noopener">\n  <img src="${badgeUrl}" alt="TripCazador ${b.label}" />\n</a>`;
          const markdownEmbed = `[![TripCazador ${b.label}](${badgeUrl})](${SITE_URL})`;
          return (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <h2 className="text-lg font-bold text-white">
                {b.label} badge
              </h2>
              <p className="mt-1 text-sm text-slate-400">{b.description}</p>

              <div className="mt-4 rounded-lg bg-slate-900/60 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dataUri} alt={`TripCazador ${b.label}`} />
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs uppercase text-slate-500">HTML</span>
                    <BadgeCopyButton text={htmlEmbed} label="Copiar HTML" />
                  </div>
                  <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-amber-300">
                    <code>{htmlEmbed}</code>
                  </pre>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs uppercase text-slate-500">Markdown</span>
                    <BadgeCopyButton text={markdownEmbed} label="Copiar Markdown" />
                  </div>
                  <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-amber-300">
                    <code>{markdownEmbed}</code>
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-slate-300">
        <h2 className="text-base font-bold text-white">Política de uso</h2>
        <ul className="mt-2 space-y-1">
          <li>• Los badges enlazan a <Link href="/" className="text-amber-400 hover:underline">tripcazador.com</Link>.</li>
          <li>
            • Sólo úsalos si te aplica la categoría (Featured = mencionado en blog/medio;
            Partner = afiliado o agencia; API Powered = usando /api/widgets/deals;
            Data Source = citando nuestros datos).
          </li>
          <li>
            • Si no encaja ninguno, escríbenos a{" "}
            <a href="mailto:hola@tripcazador.com" className="text-amber-400 hover:underline">
              hola@tripcazador.com
            </a>
            .
          </li>
        </ul>
      </section>
    </main>
  );
}
