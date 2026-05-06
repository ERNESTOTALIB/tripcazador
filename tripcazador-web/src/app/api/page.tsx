import type { Metadata } from "next";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "API pública TripCazador — Acceso a deals JSON",
  description: "API REST pública para integrar deals de TripCazador en tu app, blog o negocio. 100 req/día gratis con atribución.",
  alternates: { canonical: "/api" },
};

export const dynamic = "force-static";

export default function ApiDocsPage() {
  return (
    <>
      <SectionHero title="API pública v1" subtitle="Integra deals de TripCazador en tu app o blog. 100 req/día gratis." size="compact" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-invert">
        <h2 className="text-amber-400">Endpoint</h2>
        <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-x-auto text-xs">
          <code>GET https://tripcazador.com/api/v1/deals</code>
        </pre>

        <h2 className="text-amber-400">Auth</h2>
        <p>Bearer token en header. Solicita tu key en <code>/api/signup</code>.</p>
        <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-x-auto text-xs">
          <code>curl -H &quot;Authorization: Bearer TC-API-myapp-abcd1234-free&quot; \{"\n"}  https://tripcazador.com/api/v1/deals?origin=MAD&max_price=200</code>
        </pre>

        <h2 className="text-amber-400">Rate limits</h2>
        <ul className="text-sm">
          <li><strong>Free</strong>: 100 requests / día / api key</li>
          <li><strong>Paid</strong>: ilimitado (contacto por email)</li>
        </ul>
        <p className="text-sm">Headers de respuesta:</p>
        <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-x-auto text-xs">
          <code>X-RateLimit-Limit: 100{"\n"}X-RateLimit-Remaining: 87{"\n"}X-RateLimit-Reset: 1715212800</code>
        </pre>

        <h2 className="text-amber-400">Parámetros</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2">Param</th>
              <th className="text-left py-2">Tipo</th>
              <th className="text-left py-2">Ejemplo</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            <tr className="border-b border-slate-800"><td>origin</td><td>IATA</td><td><code>MAD</code></td></tr>
            <tr className="border-b border-slate-800"><td>destination</td><td>IATA</td><td><code>NRT</code></td></tr>
            <tr className="border-b border-slate-800"><td>max_price</td><td>EUR</td><td><code>500</code></td></tr>
            <tr><td>limit</td><td>1-100</td><td><code>30</code> (default)</td></tr>
          </tbody>
        </table>

        <h2 className="text-amber-400">Licencia</h2>
        <p className="text-sm">CC-BY-4.0. Atribución obligatoria: link a <code>tripcazador.com</code> en tu integración. No revenir o usar para spam.</p>
      </main>
    </>
  );
}
