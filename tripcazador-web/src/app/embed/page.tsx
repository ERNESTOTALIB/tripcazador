import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Widget embebible: precios mensuales por ruta — TripCazador",
  description:
    "Embed widget gratuito con precios mensuales reales de rutas populares. Copia el iframe y pégalo en tu blog o web. Datos del motor 24/7.",
  alternates: { canonical: "/embed" },
};

const ROUTES_AVAILABLE = [
  { slug: "MAD-LIS", label: "Madrid → Lisboa" },
  { slug: "MAD-NYC", label: "Madrid → Nueva York" },
  { slug: "BCN-FCO", label: "Barcelona → Roma" },
  { slug: "MAD-BKK", label: "Madrid → Bangkok" },
  { slug: "MAD-NRT", label: "Madrid → Tokio" },
  { slug: "AGP-LGW", label: "Málaga → Londres" },
];

export default function EmbedDocsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TripCazador embed widget",
    url: "https://tripcazador.com/embed",
    applicationCategory: "TravelApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };

  const sample = `<iframe
  src="https://tripcazador.com/embed/MAD-LIS"
  width="100%"
  height="380"
  frameborder="0"
  loading="lazy"
  title="Precios mensuales Madrid-Lisboa"
></iframe>`;

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Embed widget</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Widget embebible</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Pega un widget interactivo de precios mensuales en tu blog, web o newsletter. Datos reales del motor TripCazador. Gratis y sin registro.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Cómo usarlo</h2>
        <ol className="space-y-3 text-gray-300 list-decimal list-inside">
          <li>Elige una ruta de la lista de abajo (o pídenos una nueva).</li>
          <li>Copia el código iframe correspondiente.</li>
          <li>Pégalo en tu HTML, post de Wordpress (modo HTML) o email transactional.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Ejemplo: Madrid → Lisboa</h2>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
          <iframe
            src="/embed/MAD-LIS"
            width="100%"
            height="380"
            loading="lazy"
            title="Precios mensuales Madrid-Lisboa"
            className="w-full"
          />
        </div>
        <p className="text-xs text-gray-500">
          Vista previa renderizada en este servidor. En tu sitio se cargará vía iframe externo.
        </p>
        <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto">
          <code>{sample}</code>
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Rutas disponibles</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ROUTES_AVAILABLE.map((r) => (
            <li key={r.slug} className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-gray-300 text-sm">
                <span className="font-mono text-amber-400">{r.slug}</span> · {r.label}
              </span>
              <a
                href={`/embed/${r.slug}`}
                className="text-xs text-amber-400 hover:text-amber-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vista previa
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500">
          ¿Necesitas otra ruta? Escríbenos por{" "}
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400"
          >
            Telegram
          </a>
          {" "}y la añadimos en 24-48h. Gratis.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Términos de uso</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>· Uso libre para sitios personales, blogs y newsletters.</li>
          <li>· Para uso comercial alto volumen ({">"}10K vistas/mes), avísanos por email para coordinar.</li>
          <li>· No modificar el contenido del iframe (sería rendering parcial sin contexto).</li>
          <li>· No incrustar en sitios que violen leyes de privacidad o spam.</li>
          <li>· Mantenemos el right de actualizar precios mensualmente.</li>
        </ul>
      </section>

      <section className="rounded-2xl p-6 border border-slate-700 bg-slate-800/40">
        <h2 className="text-lg font-bold text-white mb-2">
          🔗 JSON público: /api/widgets/deals (SSS437)
        </h2>
        <p className="text-gray-400 mb-3 text-sm">
          Para integraciones headless (apps móviles, generación de
          contenido, scripts) hay un endpoint JSON con CORS abierto:
        </p>
        <pre className="bg-gray-900 border border-gray-800 rounded p-3 text-xs text-amber-300 overflow-auto">
          <code>{`GET https://tripcazador.com/api/widgets/deals?limit=10&ref=tu-handle

→ {
  deals: [...],
  generated_at: "...",
  attribution: "Datos de tripcazador.com — mantén atribución visible.",
  source_url: "https://tripcazador.com"
}`}</code>
        </pre>
        <ul className="text-xs text-gray-400 mt-3 space-y-1">
          <li>• <code className="text-amber-300">limit</code>: 1-30 (default 10)</li>
          <li>• <code className="text-amber-300">ref</code>: tu handle / código partner — se inyecta como utm_campaign en booking_url</li>
          <li>• Cache CDN 5 min, sin auth</li>
          <li>• Licencia: free embed con atribución visible</li>
        </ul>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
        <h2 className="text-lg font-bold text-white mb-2">¿Tu blog tiene tráfico?</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Si tu blog tiene más de 1000 lectores/mes y vas a usar el widget de forma recurrente, escríbenos. Tenemos versión white-label con tu logo y datos custom.
        </p>
        <a
          href="mailto:contacto@tripcazador.com"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          contacto@tripcazador.com
        </a>
      </section>
    </div>
  );
}
