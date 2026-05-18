"use client";

/**
 * AgenciaLandingClient — SSS305 (18 may 2026)
 *
 * Landing comercial /agencia. 2 cards producto + form pre-Stripe + garantía.
 *
 * Flow:
 *  1. Cliente elige tipo (vuelo / vuelo_hotel).
 *  2. Rellena form: destino, fechas, pax, presupuesto, notas.
 *  3. Click "Comprar y empezar búsqueda" → POST /api/agencia/checkout
 *     → recibe Stripe URL → window.location.
 *  4. Tras pago Stripe envía webhook → ticket creado → email a cliente.
 *  5. /agencia/gracias?session_id=cs_xxx muestra confirmación.
 */
import { useState } from "react";
import Link from "next/link";
import { tcTrack } from "@/lib/track_client";

type Tipo = "vuelo" | "vuelo_hotel";

export function AgenciaLandingClient() {
  const [tipo, setTipo] = useState<Tipo>("vuelo");
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dateOut, setDateOut] = useState("");
  const [dateRet, setDateRet] = useState("");
  const [pasajeros, setPasajeros] = useState("2");
  const [presupuesto, setPresupuesto] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const precio = tipo === "vuelo" ? 9.99 : 19.99;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    tcTrack("agencia_buy_click", { tipo });
    try {
      const res = await fetch("/api/agencia/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          email,
          request: {
            origin: origin.toUpperCase() || undefined,
            destination: destination.toUpperCase() || undefined,
            date_out: dateOut || undefined,
            date_ret: dateRet || undefined,
            pasajeros: pasajeros ? Number(pasajeros) : undefined,
            presupuesto: presupuesto ? Number(presupuesto) : undefined,
            notas: notas || undefined,
          },
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(
          data.error === "price_not_configured"
            ? "Estamos terminando la configuración. Escribe a contacto@tripcazador.com mientras."
            : data.error || "error_creating_session",
        );
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">
          🛫 Agencia TripCazador
        </h1>
        <p className="text-xl text-amber-400">Mejor precio garantizado o te devolvemos el dinero</p>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Tú nos dices a dónde quieres viajar. Te buscamos las 3 mejores opciones en menos de 24h.
          Si encuentras lo mismo más barato en 7 días, te devolvemos el pago{" "}
          <strong className="text-amber-400">+1 mes Premium gratis</strong>.
        </p>
      </header>

      {/* Productos toggle (form rápido) + links a landings dedicated */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            setTipo("vuelo");
            tcTrack("agencia_product_select", { tipo: "vuelo" });
          }}
          className={`p-6 rounded-2xl border-2 text-left transition ${
            tipo === "vuelo"
              ? "border-amber-500 bg-amber-500/10"
              : "border-gray-800 bg-gray-900 hover:border-gray-700"
          }`}
        >
          <div className="text-2xl mb-1">🛫 Vuelo solo</div>
          <div className="text-3xl font-bold">9,99 €</div>
          <p className="text-xs text-gray-400 mt-2">
            3 mejores opciones de vuelo · &lt;24h · mejor precio garantizado
          </p>
          <Link
            href="/agencia/vuelo"
            className="inline-block mt-3 text-[11px] text-amber-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver detalles Vuelo solo →
          </Link>
        </button>
        <button
          type="button"
          onClick={() => {
            setTipo("vuelo_hotel");
            tcTrack("agencia_product_select", { tipo: "vuelo_hotel" });
          }}
          className={`p-6 rounded-2xl border-2 text-left transition relative ${
            tipo === "vuelo_hotel"
              ? "border-amber-500 bg-amber-500/10"
              : "border-gray-800 bg-gray-900 hover:border-gray-700"
          }`}
        >
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full uppercase">
            Popular
          </span>
          <div className="text-2xl mb-1">🛫🏨 Vuelo + Hotel</div>
          <div className="text-3xl font-bold">19,99 €</div>
          <p className="text-xs text-gray-400 mt-2">
            Paquete completo vuelo + hotel · &lt;24h · mejor precio garantizado
          </p>
          <Link
            href="/agencia/vuelo-hotel"
            className="inline-block mt-3 text-[11px] text-amber-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver detalles Vuelo + Hotel →
          </Link>
        </button>
      </section>

      {/* Form */}
      <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
        <h2 className="text-2xl font-bold mb-4">Cuéntanos qué viaje quieres</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="email"
            required
            placeholder="Tu email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="text"
            maxLength={3}
            placeholder="Origen IATA (ej BCN, opcional)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            maxLength={3}
            placeholder="Destino IATA (ej NRT, opcional)"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            placeholder="Fecha ida"
            value={dateOut}
            onChange={(e) => setDateOut(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            placeholder="Fecha vuelta"
            value={dateRet}
            onChange={(e) => setDateRet(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            max={9}
            placeholder="Pasajeros"
            value={pasajeros}
            onChange={(e) => setPasajeros(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            max={10000}
            placeholder="Presupuesto € (opcional)"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Notas: preferencias, restricciones, hoteles concretos, etc. (opcional, max 500 chars)"
            value={notas}
            onChange={(e) => setNotas(e.target.value.slice(0, 500))}
            rows={3}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 mt-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-black font-bold rounded-lg text-base"
          >
            {submitting ? "Conectando con Stripe…" : `Comprar ${precio.toFixed(2).replace(".", ",")} € y empezar búsqueda →`}
          </button>
          {error && (
            <p className="md:col-span-2 text-rose-400 text-xs">Error: {error}</p>
          )}
          <p className="md:col-span-2 text-[11px] text-gray-500">
            Pago seguro vía Stripe. Recibirás email con tu ticket + garantía. Cancela en 1 clic antes de procesar.
          </p>
        </form>
      </section>

      {/* Garantía */}
      <section className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5">
        <h2 className="text-2xl font-bold mb-2">🏆 Garantía mejor precio</h2>
        <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
          <li>
            Si encuentras la <strong>misma combinación</strong> (mismas fechas, ruta, aerolínea, hotel) más barata
            en los <strong>7 días</strong> siguientes a recibir nuestra propuesta…
          </li>
          <li>
            Nosotros te <strong>devolvemos íntegro</strong> el pago (€{precio.toFixed(2).replace(".", ",")}).
          </li>
          <li>
            Y además te <strong>activamos 1 mes Premium gratis</strong> en TripCazador.
          </li>
          <li>
            Solo hay que enviarnos la URL pública del precio más bajo desde tu panel{" "}
            <Link href="/panel/agencia" className="text-amber-400 underline">/panel/agencia</Link>.
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Preguntas frecuentes</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-white">¿Cuánto tardáis en responder?</p>
            <p className="text-gray-400">Menos de 24h laborables. Normalmente en pocas horas.</p>
          </div>
          <div>
            <p className="font-semibold text-white">¿Qué pasa si no encontráis nada que me guste?</p>
            <p className="text-gray-400">Te enviamos las 3 mejores opciones disponibles. Si ninguna te sirve, podemos hacer una segunda búsqueda con criterios distintos sin coste extra.</p>
          </div>
          <div>
            <p className="font-semibold text-white">¿Cómo activáis el reembolso si pruebo precio más bajo?</p>
            <p className="text-gray-400">Desde tu panel envías la URL. En 24-48h revisamos y procesamos refund por Stripe + activamos Premium 30 días en tu cuenta.</p>
          </div>
          <div>
            <p className="font-semibold text-white">¿Esto es diferente del Concierge?</p>
            <p className="text-gray-400">Sí. Concierge (€19-99) es para viajes complejos multi-ciudad o gestión incidencias. Agencia es directo: tú nos dices A→B y nosotros buscamos por ti.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
