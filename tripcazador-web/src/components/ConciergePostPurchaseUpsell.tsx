/**
 * ConciergePostPurchaseUpsell — SSS431 (23 may 2026)
 *
 * Sección de cross-sell tras compra Concierge exitosa. Sugiere:
 * - eSIM Holafly (para usar al aterrizar)
 * - Seguro Heymondo (cancelación + médico)
 *
 * Server-component rendered (envs leídas en server, no exposed to
 * client beyond the URLs). No tracking PII — los links llevan utm
 * source/medium/campaign para attribution.
 */
import Link from "next/link";

const HOLAFLY_REF = process.env.NEXT_PUBLIC_HOLAFLY_REF || "tripcazador";
const HEYMONDO_REF = process.env.NEXT_PUBLIC_HEYMONDO_REF || "tripcazador";

function buildHolaflyUrl(orderId: string): string {
  const params = new URLSearchParams({
    utm_source: "tripcazador",
    utm_medium: "post_purchase",
    utm_campaign: "concierge_success_esim",
    utm_content: orderId || "anon",
  });
  if (HOLAFLY_REF) params.set("ref", HOLAFLY_REF);
  return `https://esim.holafly.com/?${params.toString()}`;
}

function buildHeymondoUrl(orderId: string): string {
  const params = new URLSearchParams({
    utm_source: "tripcazador",
    utm_medium: "post_purchase",
    utm_campaign: "concierge_success_seguro",
    utm_content: orderId || "anon",
  });
  if (HEYMONDO_REF) params.set("ref", HEYMONDO_REF);
  return `https://www.heymondo.com/?${params.toString()}`;
}

export function ConciergePostPurchaseUpsell({ orderId = "" }: { orderId?: string }) {
  const holaflyUrl = buildHolaflyUrl(orderId);
  const heymondoUrl = buildHeymondoUrl(orderId);

  return (
    <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <h2 className="text-xl font-bold text-white">
        🎁 Mientras esperas tus opciones — completa el viaje
      </h2>
      <p className="mt-2 text-sm text-slate-300">
        Tu pedido Concierge ya está en cola. Mientras preparamos las 5 opciones,
        considera estos extras que la mayoría de viajeros olvidan hasta el último
        momento (y pagan caro):
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-3xl">📱</div>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
              Activar al aterrizar
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-white">eSIM Holafly</h3>
          <p className="mt-2 text-sm text-slate-300">
            Datos ilimitados desde 5€/día en 200+ países. Activación QR en
            segundos, sin sacar la SIM física. Disponible inmediatamente tras
            la compra — escaneas el QR antes de salir.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li>✓ Sin roaming: tarifa fija sin sorpresas</li>
            <li>✓ Compatible con iPhone XS+ / Pixel 3+ / Galaxy S20+</li>
            <li>✓ Cobertura 4G/5G en aeropuertos al aterrizar</li>
          </ul>
          <a
            href={holaflyUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
          >
            Ver eSIM Holafly →
          </a>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-3xl">🛡️</div>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
              Cancelación incluida
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-white">Seguro Heymondo</h3>
          <p className="mt-2 text-sm text-slate-300">
            Cobertura médica + cancelación + equipaje + asistencia 24/7. Desde
            ~5€/día. Tras el Concierge te enviamos un vuelo concreto — contrata
            seguro antes de pagarlo y duermes tranquilo.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li>✓ Cancelación cubierta (enfermedad, despido, etc.)</li>
            <li>✓ Atención médica 24/7 en español</li>
            <li>✓ Algunos países requieren seguro obligatorio (Schengen, USA)</li>
          </ul>
          <a
            href={heymondoUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
          >
            Ver Seguro Heymondo →
          </a>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Enlaces afiliados · TripCazador puede recibir comisión sin coste
        adicional para ti.{" "}
        <Link href="/legal#afiliacion" className="hover:text-amber-400 underline">
          Más info
        </Link>
      </p>
    </section>
  );
}

export default ConciergePostPurchaseUpsell;
