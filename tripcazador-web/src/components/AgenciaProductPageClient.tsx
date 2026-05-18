"use client";

/**
 * AgenciaProductPageClient — SSS309 (19 may 2026)
 *
 * Componente client reutilizable para cada landing de producto Agencia
 * (/agencia/vuelo, /agencia/vuelo-hotel). Muestra:
 *  - Hero con emoji + precio + tagline
 *  - Descripción larga
 *  - Bullets de qué incluye
 *  - Form pre-Stripe (mismo flujo POST /api/agencia/checkout)
 *  - Garantía mejor precio
 *  - FAQ específico
 *  - Comparativa con otros producto Agencia
 */
import { useState } from "react";
import Link from "next/link";
import { tcTrack } from "@/lib/track_client";
import {
  AGENCIA_PRODUCTS,
  type AgenciaProduct,
} from "@/lib/agencia_products";

interface Props {
  product: AgenciaProduct;
}

export function AgenciaProductPageClient({ product }: Props) {
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

  const other = product.tipo === "vuelo" ? AGENCIA_PRODUCTS.vuelo_hotel : AGENCIA_PRODUCTS.vuelo;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    tcTrack("agencia_buy_click", { tipo: product.tipo });
    try {
      const res = await fetch("/api/agencia/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: product.tipo,
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

  const formattedPrice = product.amount_eur.toFixed(2).replace(".", ",");

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-white">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <Link href="/agencia" className="hover:text-white">
          Agencia
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{product.shortName}</span>
      </nav>

      {/* Hero */}
      <header className="text-center space-y-4">
        <div className="text-6xl">{product.emoji}</div>
        <h1 className="text-4xl md:text-5xl font-bold">{product.name}</h1>
        <p className="text-xl text-amber-400">{product.tagline}</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-bold">{formattedPrice} €</span>
          <span className="text-gray-400">pago único</span>
        </div>
        <p className="text-sm text-emerald-400 font-semibold">
          🏆 Mejor precio garantizado o te devolvemos el dinero + 1 mes Premium gratis
        </p>
      </header>

      {/* Descripción larga */}
      <section className="prose prose-invert max-w-none">
        <p className="text-gray-300 text-lg leading-relaxed">{product.description}</p>
      </section>

      {/* Bullets */}
      <section className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5">
        <h2 className="text-2xl font-bold mb-4">Qué incluye {product.shortName}</h2>
        <ul className="space-y-3">
          {product.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-200">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Form pre-Stripe */}
      <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
        <h2 className="text-2xl font-bold mb-1">
          Empieza tu búsqueda — {formattedPrice} €
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Rellena los datos y te enviamos las 3 mejores opciones en &lt;24h.
        </p>
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
            placeholder="Origen IATA (BCN/MAD/VLC...)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            maxLength={3}
            placeholder="Destino IATA (NRT/JFK/...)"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateOut}
            onChange={(e) => setDateOut(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
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
            placeholder="Presupuesto € opcional"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder={`Notas: preferencias, restricciones, ${
              product.tipo === "vuelo_hotel"
                ? "zona ideal del hotel, "
                : ""
            }... (opcional, máx 500 chars)`}
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
            {submitting
              ? "Conectando con Stripe…"
              : `Comprar ${formattedPrice} € y empezar búsqueda →`}
          </button>
          {error && (
            <p className="md:col-span-2 text-rose-400 text-xs">Error: {error}</p>
          )}
          <p className="md:col-span-2 text-[11px] text-gray-500">
            Pago seguro vía Stripe. Recibes email con ticket + garantía. Cancela en 1 clic antes de procesar.
          </p>
        </form>
      </section>

      {/* Garantía */}
      <section className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5">
        <h2 className="text-2xl font-bold mb-3">🏆 Garantía mejor precio explicada</h2>
        <ol className="text-sm text-gray-300 space-y-2 list-decimal pl-5">
          <li>Compras el servicio aquí mismo por {formattedPrice} €.</li>
          <li>En &lt;24h te enviamos las 3 mejores opciones que hemos encontrado.</li>
          <li>
            Tienes <strong>7 días desde recibir la propuesta</strong> para
            buscar tú la misma combinación (mismas fechas, ruta
            {product.tipo === "vuelo_hotel" ? " + hotel comparable" : ""},
            aerolínea).
          </li>
          <li>
            Si encuentras un precio inferior, envíanos la URL pública desde{" "}
            <Link href="/panel/agencia" className="text-amber-400 underline">
              /panel/agencia
            </Link>
            .
          </li>
          <li>
            Revisamos en &lt;48h y procesamos:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Refund íntegro vía Stripe ({formattedPrice} € a tu tarjeta).</li>
              <li>Activación 30 días Premium gratis en tu cuenta TripCazador.</li>
            </ul>
          </li>
        </ol>
        <p className="text-[11px] text-gray-500 mt-4">
          Garantía aplica si el precio inferior cumple los mismos criterios objetivos
          (fechas, ruta, escalas{product.tipo === "vuelo_hotel" ? ", hotel rating ≥8.0" : ""},
          tarifa de equipaje comparable).
        </p>
      </section>

      {/* Comparativa */}
      <section className="p-6 rounded-2xl border border-gray-800 bg-gray-900">
        <h2 className="text-2xl font-bold mb-4">¿Cuál elegir? {product.shortName} vs {other.shortName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border-2 border-amber-500/50 bg-amber-500/10">
            <div className="text-3xl mb-1">{product.emoji}</div>
            <div className="text-xl font-bold">{product.shortName}</div>
            <div className="text-2xl font-bold mt-1">{formattedPrice} €</div>
            <p className="text-xs text-gray-300 mt-2">{product.tagline}</p>
            <div className="mt-2 text-[11px] text-amber-300">★ Estás viendo este</div>
          </div>
          <Link
            href={`/agencia/${other.slug}`}
            className="p-5 rounded-xl border-2 border-gray-700 hover:border-gray-500 transition block"
          >
            <div className="text-3xl mb-1">{other.emoji}</div>
            <div className="text-xl font-bold">{other.shortName}</div>
            <div className="text-2xl font-bold mt-1">
              {other.amount_eur.toFixed(2).replace(".", ",")} €
            </div>
            <p className="text-xs text-gray-300 mt-2">{other.tagline}</p>
            <div className="mt-2 text-[11px] text-amber-400">Ver {other.shortName} →</div>
          </Link>
        </div>
      </section>

      {/* FAQ específico */}
      <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
        <h2 className="text-2xl font-bold mb-4">Preguntas frecuentes</h2>
        <div className="space-y-4 text-sm">
          {product.tipo === "vuelo" ? <VueloFAQ /> : <VueloHotelFAQ />}
          <CommonFAQ />
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-400 text-sm mb-3">¿Listo para empezar?</p>
        <Link
          href="#form"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 600, behavior: "smooth" });
          }}
          className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg"
        >
          Empezar ahora · {formattedPrice} € →
        </Link>
      </section>
    </div>
  );
}

function VueloFAQ() {
  return (
    <>
      <div>
        <p className="font-semibold text-white">¿Cómo encontráis el mejor vuelo?</p>
        <p className="text-gray-400">
          Comparamos Skyscanner, Google Flights, Kayak, Momondo y las páginas
          directas de aerolínea. Buscamos también combinaciones inusuales
          (codeshare arbitrage, stopover gratuito, multi-city) que los
          comparadores automáticos no priorizan.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">¿Qué hago si me piden datos de viajero?</p>
        <p className="text-gray-400">
          Nuestra propuesta llega con un enlace de reserva en la web oficial
          de la aerolínea — tú metes los datos cuando reservas (nosotros no
          guardamos pasaportes ni datos sensibles).
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">¿Detectáis error fares?</p>
        <p className="text-gray-400">
          Sí. Si está activo un error fare hacia tu destino (descuento &gt;70%
          por fallo de tarificación), te lo señalamos con prioridad. Suelen
          durar pocas horas — actuaríamos en &lt;4h.
        </p>
      </div>
    </>
  );
}

function VueloHotelFAQ() {
  return (
    <>
      <div>
        <p className="font-semibold text-white">¿Por qué elegir paquete vs comprar vuelo y hotel por separado?</p>
        <p className="text-gray-400">
          Por la coordinación temporal: nos aseguramos de que tu hotel está
          disponible exactamente en las fechas del vuelo, en zona accesible
          desde el aeropuerto, y con check-in compatible con tu hora de
          llegada. Y porque a veces Booking ofrece "Genius rates" que solo
          aparecen comprando vuelo+hotel juntos.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">¿Qué tipo de hoteles recomendáis?</p>
        <p className="text-gray-400">
          Por defecto Booking rating ≥8.0, en zona central o con buen
          transporte público al aeropuerto, sin extras escondidos (resort
          fees etc.). Si nos dices preferencia (céntrico/playa/lujo/boutique),
          ajustamos.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">¿Y si prefiero Airbnb?</p>
        <p className="text-gray-400">
          Si Airbnb ahorra ≥30% vs Booking para tu destino + duración, te lo
          incluimos como cuarta opción. Para estancias &lt;3 noches Booking suele ganar
          (cuotas de limpieza Airbnb son altas).
        </p>
      </div>
    </>
  );
}

function CommonFAQ() {
  return (
    <>
      <div>
        <p className="font-semibold text-white">¿Cuánto tardáis?</p>
        <p className="text-gray-400">
          Menos de 24h laborables. Normalmente en pocas horas si tu petición
          llega en horario europeo.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">¿Es diferente del Concierge?</p>
        <p className="text-gray-400">
          Sí. Concierge (19-99 €) es para viajes complejos multi-ciudad o
          gestión de incidencias. Agencia es simple: A→B, búsqueda directa,
          garantía visible.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">¿Y si no encontráis nada que me convenza?</p>
        <p className="text-gray-400">
          Te enviamos las 3 mejores que existan a esa fecha. Si ninguna te
          sirve, hacemos una segunda iteración con criterios ajustados sin
          coste extra. Si tras eso sigue sin servirte, refund completo.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">¿Cobráis comisiones afiliados sobre lo que reservo?</p>
        <p className="text-gray-400">
          Sí (Skyscanner/Booking pagan al refer), pero esto te beneficia: no
          tenemos incentivo para inflar el precio (cuanto más barato, más
          probable que reserves a través nuestro). El pago de {/* no eslintignore */}
          {""} 9,99/19,99 € es nuestro ingreso principal por servicio.
        </p>
      </div>
    </>
  );
}
