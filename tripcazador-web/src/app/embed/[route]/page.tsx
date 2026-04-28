import type { Metadata } from "next";

type Params = { route: string };

/**
 * /embed/[route] — abr-2026z.
 *
 * Embeddable widget para que otros sites incrusten precios mensuales de una
 * ruta específica via <iframe>. Captura backlinks de SEO valiosos.
 *
 * Diseño: standalone (sin layout site), branded sutilmente con link a
 * tripcazador.com en footer. Soporta `?theme=dark|light`.
 *
 * Uso desde otros sitios:
 *   <iframe src="https://tripcazador.com/embed/MAD-LIS" width="100%" height="380"></iframe>
 *
 * Datos: hardcoded para rutas conocidas (mismas medianas del lib/airlines).
 */

// Pre-render conocidas para fast render
export async function generateStaticParams(): Promise<Params[]> {
  return KNOWN_ROUTES.map((r) => ({ route: r.slug }));
}

export const dynamic = "force-static";
export const revalidate = 86400;

interface RouteData {
  slug: string; // MAD-LIS
  origin: { iata: string; city: string };
  destination: { iata: string; city: string };
  monthlyPrices: number[]; // 12 valores Ene-Dic
  cheapestMonth: string;
  minObserved: number;
}

const KNOWN_ROUTES: RouteData[] = [
  {
    slug: "MAD-LIS",
    origin: { iata: "MAD", city: "Madrid" },
    destination: { iata: "LIS", city: "Lisboa" },
    monthlyPrices: [78, 72, 92, 115, 128, 158, 185, 175, 115, 98, 85, 110],
    cheapestMonth: "Febrero",
    minObserved: 9,
  },
  {
    slug: "MAD-NYC",
    origin: { iata: "MAD", city: "Madrid" },
    destination: { iata: "JFK", city: "Nueva York" },
    monthlyPrices: [445, 430, 510, 580, 650, 720, 850, 800, 590, 510, 480, 620],
    cheapestMonth: "Febrero",
    minObserved: 290,
  },
  {
    slug: "BCN-FCO",
    origin: { iata: "BCN", city: "Barcelona" },
    destination: { iata: "FCO", city: "Roma" },
    monthlyPrices: [65, 58, 72, 95, 120, 145, 165, 155, 95, 72, 65, 88],
    cheapestMonth: "Febrero",
    minObserved: 12,
  },
  {
    slug: "MAD-BKK",
    origin: { iata: "MAD", city: "Madrid" },
    destination: { iata: "BKK", city: "Bangkok" },
    monthlyPrices: [475, 420, 510, 620, 650, 780, 880, 820, 595, 510, 520, 685],
    cheapestMonth: "Febrero",
    minObserved: 298,
  },
  {
    slug: "MAD-NRT",
    origin: { iata: "MAD", city: "Madrid" },
    destination: { iata: "NRT", city: "Tokio" },
    monthlyPrices: [820, 795, 950, 1100, 1250, 1180, 1350, 1280, 950, 845, 880, 1050],
    cheapestMonth: "Febrero",
    minObserved: 480,
  },
  {
    slug: "AGP-LGW",
    origin: { iata: "AGP", city: "Málaga" },
    destination: { iata: "LGW", city: "Londres" },
    monthlyPrices: [58, 52, 68, 88, 105, 125, 145, 138, 88, 65, 58, 95],
    cheapestMonth: "Febrero",
    minObserved: 14,
  },
];

function getRouteData(slug: string): RouteData | null {
  const upper = slug.toUpperCase();
  return KNOWN_ROUTES.find((r) => r.slug === upper) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const r = getRouteData(params.route);
  if (!r) return { title: "Embed widget no disponible" };
  return {
    title: `${r.origin.city} → ${r.destination.city}: precios mensuales`,
    description: `Precios mediano por mes para ${r.origin.iata}-${r.destination.iata}. Datos del motor TripCazador.`,
    robots: { index: false, follow: false }, // No indexar el embed estático
  };
}

export default function EmbedRoutePage({ params }: { params: Params }) {
  const r = getRouteData(params.route);
  if (!r) {
    return (
      <html lang="es">
        <body className="bg-gray-950 text-white p-6 font-sans">
          <p className="text-sm">
            Ruta no disponible. Pide a TripCazador que la añada en{" "}
            <a href="https://t.me/tripcazador_bot" className="text-amber-400">
              Telegram
            </a>
            .
          </p>
        </body>
      </html>
    );
  }

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const max = Math.max(...r.monthlyPrices);
  const min = Math.min(...r.monthlyPrices);
  const minIdx = r.monthlyPrices.indexOf(min);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 16,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: 360,
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <header style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "monospace", color: "#fbbf24", fontSize: 14 }}>
              {r.origin.iata}
            </span>
            <span style={{ color: "#64748b" }}>→</span>
            <span style={{ fontFamily: "monospace", color: "#fbbf24", fontSize: 14 }}>
              {r.destination.iata}
            </span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              {r.origin.city} → {r.destination.city}
            </h2>
          </header>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px 0" }}>
            Precio mediano por mes (€). El mes más barato es <strong style={{ color: "#34d399" }}>{r.cheapestMonth}</strong>.
            Mínimo histórico observado: <strong style={{ color: "#34d399" }}>€{r.minObserved}</strong>.
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180 }}>
            {r.monthlyPrices.map((p, i) => {
              const h = (p / max) * 160;
              const isCheap = i === minIdx;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: isCheap ? "#34d399" : "#94a3b8",
                      fontWeight: isCheap ? 600 : 400,
                    }}
                  >
                    €{p}
                  </span>
                  <div
                    title={`${months[i]}: €${p}`}
                    style={{
                      width: "100%",
                      height: `${h}px`,
                      background: isCheap ? "#34d399" : "#fbbf24",
                      opacity: isCheap ? 1 : 0.5,
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b" }}>{months[i]}</span>
                </div>
              );
            })}
          </div>
          <footer
            style={{
              marginTop: 20,
              paddingTop: 12,
              borderTop: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              color: "#64748b",
            }}
          >
            <span>Datos del motor TripCazador (12 meses)</span>
            <a
              href={`https://tripcazador.com/?utm_source=embed&utm_medium=widget&utm_campaign=${r.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 600 }}
            >
              tripcazador.com →
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
