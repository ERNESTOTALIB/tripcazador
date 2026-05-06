import type { Metadata } from "next";
import Link from "next/link";
import { VISA_FROM_ES, type VisaRequirement } from "@/lib/visa";
import { SectionHero } from "@/components/SectionHero";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Visados desde España — Requisitos a 60+ países",
  description: "Tabla actualizada de requisitos de visado para titulares de pasaporte español: ETIAS, eVisa, VoA, exempt. Costes, duración y enlaces oficiales.",
  alternates: { canonical: "/visados" },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const STATUS_LABEL: Record<VisaRequirement["status"], { emoji: string; text: string; color: string }> = {
  exempt: { emoji: "✅", text: "Sin visa", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  voa: { emoji: "🛬", text: "Visa al llegar", color: "bg-blue-500/15 text-blue-300 border-blue-500/40" },
  evisa: { emoji: "💻", text: "e-Visa online", color: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  etias: { emoji: "📝", text: "Auth electrónica", color: "bg-purple-500/15 text-purple-300 border-purple-500/40" },
  visa_required: { emoji: "🛂", text: "Visa obligatoria", color: "bg-red-500/15 text-red-300 border-red-500/40" },
};

export default function VisadosPage() {
  const grouped = {
    exempt: VISA_FROM_ES.filter((v) => v.status === "exempt"),
    voa: VISA_FROM_ES.filter((v) => v.status === "voa"),
    evisa: VISA_FROM_ES.filter((v) => v.status === "evisa"),
    etias: VISA_FROM_ES.filter((v) => v.status === "etias"),
    visa_required: VISA_FROM_ES.filter((v) => v.status === "visa_required"),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Requisitos de visado para pasaporte español",
    description: "Compilación de requisitos de visado para titulares de pasaporte ES a 60+ destinos populares.",
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "TripCazador" },
  };

  return (
    <>
      <SectionHero title="Visados desde España" subtitle="Tabla actualizada con requisitos para tu pasaporte español. Sin visa, eVisa, VoA o ETIAS por país." size="compact" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="panel bg-amber-400/10 border-amber-400/40">
          <p className="text-sm text-amber-200">
            ⚠️ <strong>No es asesoramiento legal.</strong> Datos curados de fuentes oficiales 2026. Verifica
            siempre con la embajada del país antes de viajar — los requisitos cambian sin aviso.
          </p>
        </div>

        {Object.entries(grouped).map(([statusKey, list]) => {
          if (list.length === 0) return null;
          const meta = STATUS_LABEL[statusKey as VisaRequirement["status"]];
          return (
            <section key={statusKey}>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl" aria-hidden="true">{meta.emoji}</span>
                <h2 className="text-xl font-bold text-amber-400">{meta.text}</h2>
                <span className="text-sm text-gray-400">{list.length} países</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((v) => (
                  <div key={v.country_code} className={`rounded-lg border p-4 ${meta.color}`}>
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold text-white">{v.country}</h3>
                      <span className="text-[10px] uppercase tracking-wide opacity-70">{v.country_code}</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1">
                      {v.duration_days && <div>📅 Duración: {v.duration_days} días</div>}
                      {typeof v.cost_eur === "number" && (
                        <div>💰 Coste: {v.cost_eur === 0 ? "gratis" : `~${v.cost_eur}€`}</div>
                      )}
                      {v.passport_validity_months !== undefined && v.passport_validity_months > 0 && (
                        <div>📔 Pasaporte ≥{v.passport_validity_months} meses</div>
                      )}
                      {v.notes && <div className="opacity-80 mt-1">{v.notes}</div>}
                      {v.apply_url && (
                        <a
                          href={v.apply_url}
                          target="_blank"
                          rel="noopener nofollow"
                          className="inline-block mt-2 underline opacity-90 hover:opacity-100"
                        >
                          Solicitar online →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="panel">
          <p className="text-sm text-gray-300">
            ¿Tu destino no aparece? Probablemente requiere visa con cita en consulado.
            Consulta la <a className="text-amber-400 underline" href="https://www.exteriores.gob.es/es/EmbajadasConsulados/Paginas/index.aspx" target="_blank" rel="noopener nofollow">embajada española</a> o el{" "}
            <a className="text-amber-400 underline" href="https://www.iatatravelcentre.com/" target="_blank" rel="noopener nofollow">IATA Travel Centre</a>.
          </p>
          <p className="text-sm text-gray-400 mt-3">
            ¿Vas a viajar? <Link href="/" className="text-amber-400 underline">Busca vuelos</Link> · <Link href="/seguro-viaje" className="text-amber-400 underline">Seguro</Link> · <Link href="/packing-list" className="text-amber-400 underline">Packing list</Link>
          </p>
        </div>
      </main>
      <JsonLd data={jsonLd} />
    </>
  );
}
