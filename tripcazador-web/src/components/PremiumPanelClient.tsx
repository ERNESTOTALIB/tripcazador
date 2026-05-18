"use client";

/**
 * PremiumPanelClient — SSS303 (18 may 2026)
 *
 * Dashboard del suscriptor Premium con:
 *  - Greeting personalizado (SSS303)
 *  - Estado actual de suscripción
 *  - Stats: alertas activas, savings estimadas, búsquedas guardadas (SSS303)
 *  - 4 cards explicando cada feature + link directo
 *  - Botón "Gestionar suscripción" → Stripe billing portal (SSS303)
 *  - Concierge promo "1 consulta gratis/mes" (SSS303)
 *  - Email soporte prioritario directo
 *  - Si free: CTA upgrade
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus, PREMIUM_FEATURES, type PremiumStatus } from "@/lib/premium";
import { tcTrack } from "@/lib/track_client";

const SUPPORT_EMAIL = "contacto@tripcazador.com";

interface Stats {
  alerts: { active: number; triggered: number; total: number };
  saved_searches: { count: number };
  savings: { estimated_eur: number };
  concierge_promo: { available: boolean; month: string };
}

export function PremiumPanelClient() {
  const [status, setStatus] = useState<PremiumStatus>({
    active: false,
    tier: "free",
    source: "manual",
  });
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ ticket_id?: string; error?: string } | null>(null);

  useEffect(() => {
    setStatus(getPremiumStatus());
    setMounted(true);
    const onChange = (e: Event) => setStatus((e as CustomEvent).detail);
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

  // Fetch stats si Premium con customerId
  useEffect(() => {
    if (!status.active || !status.customerId) return;
    let cancelled = false;
    fetch(`/api/premium/stats?customer_id=${encodeURIComponent(status.customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.ok) setStats(d as Stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status.active, status.customerId]);

  async function openPortal() {
    if (!status.customerId) return;
    setPortalLoading(true);
    try {
      // SSS304: el endpoint acepta customer_id o session_id. El
      // PremiumStatus.customerId guardado en localStorage es el resultado
      // de /api/premium/activate, que devuelve session.customer.id (cus_xxx).
      const res = await fetch(
        `/api/premium/portal?customer_id=${encodeURIComponent(status.customerId)}`,
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        tcTrack("premium_portal_opened", { customerId: status.customerId.slice(0, 16) });
        window.location.href = data.url;
      } else {
        alert(
          `No pude abrir el portal Stripe (${data.error || "error"}). ` +
            `Si necesitas cancelar, escribe a ${SUPPORT_EMAIL}.`,
        );
      }
    } catch {
      alert(`No pude conectar con Stripe. Escribe a ${SUPPORT_EMAIL} para gestionar tu suscripción.`);
    } finally {
      setPortalLoading(false);
    }
  }

  async function claimConciergePromo() {
    if (!status.customerId) return;
    if (!confirm("¿Reclamar tu consulta concierge gratis de este mes? Solo 1 al mes.")) return;
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const res = await fetch("/api/premium/concierge-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: status.customerId }),
      });
      const data = (await res.json()) as { ticket_id?: string; error?: string; message?: string };
      if (res.ok && data.ticket_id) {
        tcTrack("premium_concierge_promo_claimed", {
          customerId: status.customerId.slice(0, 16),
          ticketId: data.ticket_id,
        });
        setPromoResult({ ticket_id: data.ticket_id });
        // Re-fetch stats
        const r = await fetch(`/api/premium/stats?customer_id=${encodeURIComponent(status.customerId)}`);
        if (r.ok) setStats((await r.json()) as Stats);
      } else {
        setPromoResult({ error: data.message || data.error || "error" });
      }
    } catch (e) {
      setPromoResult({ error: e instanceof Error ? e.message : "error" });
    } finally {
      setPromoLoading(false);
    }
  }

  if (!mounted) {
    return <div className="text-gray-400 text-sm">Cargando estado de suscripción…</div>;
  }

  const expiryDate = status.expiresAt
    ? new Date(status.expiresAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "Buenas noches";
    if (h < 13) return "Buenos días";
    if (h < 21) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="space-y-3">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/panel" className="hover:text-white">Panel</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Premium</span>
        </nav>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          🎯 {status.active ? `${greeting}, suscriptor Premium` : "Tu Premium TripCazador"}
        </h1>
        {status.active && stats && (
          <p className="text-sm text-gray-300">
            Tienes <strong className="text-emerald-400">{stats.alerts.active} alertas activas</strong>
            {stats.alerts.triggered > 0 && (
              <>
                {" "}
                · <strong className="text-amber-300">{stats.alerts.triggered} disparadas</strong>
              </>
            )}
            {stats.saved_searches.count > 0 && (
              <>
                {" "}
                · <strong className="text-white">{stats.saved_searches.count} búsquedas guardadas</strong>
              </>
            )}
            {stats.savings.estimated_eur > 0 && (
              <>
                {" "}
                · Ahorro estimado <strong className="text-emerald-300">~{stats.savings.estimated_eur} €</strong>
              </>
            )}
          </p>
        )}
      </header>

      {/* Estado suscripción */}
      <section
        className={`p-6 rounded-2xl border ${
          status.active
            ? "bg-emerald-500/10 border-emerald-500/40"
            : "bg-gray-900 border-gray-800"
        }`}
      >
        {status.active ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✓</span>
              <div className="flex-1">
                <div className="text-xl font-bold text-emerald-400">Premium activo</div>
                <div className="text-sm text-gray-300">
                  Tier: <span className="text-white capitalize">{status.tier}</span>
                  {expiryDate && (
                    <>
                      {" "}
                      · Renueva: <span className="text-white">{expiryDate}</span>
                    </>
                  )}
                  {status.source !== "manual" && (
                    <>
                      {" "}
                      · Origen: <span className="text-white">{status.source}</span>
                    </>
                  )}
                </div>
              </div>
              {status.customerId && (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg border border-gray-700"
                >
                  {portalLoading ? "Abriendo…" : "Gestionar suscripción"}
                </button>
              )}
            </div>
            <div className="text-[11px] text-gray-500">
              "Gestionar suscripción" abre el portal de Stripe donde puedes actualizar
              tarjeta, ver recibos o cancelar en 1 clic.
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔒</span>
              <div>
                <div className="text-xl font-bold text-white">No tienes Premium activo</div>
                <div className="text-sm text-gray-300">
                  Suscríbete por 2,99 €/mes — 7 días gratis · Cancela en 1 clic
                </div>
              </div>
            </div>
            <Link
              href="/premium?utm_source=panel_premium"
              className="inline-block px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg"
            >
              Activar Premium →
            </Link>
          </>
        )}
      </section>

      {/* Concierge promo Premium */}
      {status.active && status.customerId && (
        <section className="p-5 rounded-2xl border border-amber-500/40 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <h3 className="font-bold text-white">Tu consulta concierge gratis</h3>
              <p className="text-xs text-gray-300 mt-1">
                Como Premium incluyes <strong>1 consulta concierge gratis al mes</strong> con el equipo:
                búsquedas complejas multi-ciudad, gestión de incidencias, recomendaciones personalizadas.
              </p>
              {promoResult?.ticket_id ? (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded text-xs">
                  ✓ Promo reclamada. Ticket: <code className="text-emerald-300">{promoResult.ticket_id}</code>.
                  Envía un email a{" "}
                  <a className="text-amber-400 underline" href={`mailto:${SUPPORT_EMAIL}?subject=Promo%20Premium%20${promoResult.ticket_id}`}>
                    {SUPPORT_EMAIL}
                  </a>{" "}
                  con los detalles de tu consulta.
                </div>
              ) : promoResult?.error ? (
                <div className="mt-3 text-xs text-rose-400">⚠ {promoResult.error}</div>
              ) : (
                <button
                  onClick={claimConciergePromo}
                  disabled={promoLoading}
                  className="mt-3 inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-black font-semibold text-sm rounded-lg"
                >
                  {promoLoading ? "Reclamando…" : "Reclamar consulta gratis"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4 features */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Tus 4 ventajas Premium</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon="🚨"
            title="Alertas instantáneas"
            description={PREMIUM_FEATURES.instantAlerts}
            cta={status.active ? "Gestionar mis alertas" : "Ver cómo funciona"}
            href={status.active ? "/panel/premium/alertas" : "/alertas"}
            active={status.active}
            extra="Premium: alertas ilimitadas, polling cada 5 min, email priority. Plan gratis: 3 max, polling hora."
          />
          <FeatureCard
            icon="✈"
            title="Filtros pro + Búsquedas guardadas"
            description={PREMIUM_FEATURES.proFilters}
            cta={status.active ? "Mis búsquedas guardadas" : "Ver filtros disponibles"}
            href={status.active ? "/panel/premium/busquedas" : "/deals"}
            active={status.active}
            extra="Filtra y guarda combinaciones (Tokio business, BCN→Asia <500€…) — hasta 25 búsquedas con 1-click reabrir."
          />
          <FeatureCard
            icon="✓"
            title="Datos exactos sin disclaimer"
            description={PREMIUM_FEATURES.noDisclaimer}
            cta="Ver ofertas sin disclaimer"
            href="/deals"
            active={status.active}
            extra='En el plan gratis cada deal lleva "Precio aproximado del último escaneo". En Premium NO ves ese disclaimer.'
          />
          <FeatureCard
            icon="💬"
            title="Soporte prioritario"
            description={PREMIUM_FEATURES.prioritySupport}
            cta="Escribir al soporte"
            href={`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Premium%20%E2%80%94%20%5Bcuenta%20${encodeURIComponent(
              status.customerId || "tu-email",
            )}%5D&body=Hola%20Ernesto%2C%0A%0A`}
            active={status.active}
            extra="Respuesta del equipo en menos de 24h laborables (los emails Premium tienen prioridad sobre los gratis)."
            external
            onClick={() => tcTrack("premium_support_click", { customerId: status.customerId || "" })}
          />
        </div>
      </section>

      {status.active && (
        <section className="p-5 bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="text-sm text-gray-300">
            <strong className="text-white">¿Algún problema?</strong> Escribe a{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Premium`}
              className="text-amber-400 hover:underline"
              onClick={() => tcTrack("premium_support_footer_click", {})}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            — incluimos cabecera "Premium" en tu ticket y respondemos en &lt;24h
            laborables. También puedes <button onClick={openPortal} className="text-amber-400 underline">cancelar desde Stripe</button>.
          </div>
        </section>
      )}
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  active: boolean;
  extra?: string;
  external?: boolean;
  onClick?: () => void;
}

function FeatureCard({
  icon,
  title,
  description,
  cta,
  href,
  active,
  extra,
  external,
  onClick,
}: FeatureCardProps) {
  return (
    <div
      className={`p-5 rounded-2xl border ${
        active
          ? "bg-gray-900 border-amber-500/30"
          : "bg-gray-900 border-gray-800 opacity-70"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm">{title}</h3>
          <p className="text-xs text-gray-300 mt-1">{description}</p>
          {extra && <p className="text-[11px] text-gray-400 mt-2">{extra}</p>}
          <div className="mt-3">
            {external ? (
              <a
                href={href}
                onClick={onClick}
                className={`inline-block text-xs font-semibold ${
                  active ? "text-amber-400 hover:text-amber-300" : "text-gray-500"
                }`}
              >
                {cta} →
              </a>
            ) : (
              <Link
                href={href}
                onClick={onClick}
                className={`inline-block text-xs font-semibold ${
                  active ? "text-amber-400 hover:text-amber-300" : "text-gray-500"
                }`}
              >
                {cta} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
