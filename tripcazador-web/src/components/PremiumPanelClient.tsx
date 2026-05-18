"use client";

/**
 * PremiumPanelClient — SSS301 (18 may 2026)
 *
 * Dashboard del suscriptor Premium con:
 *  - Estado actual de suscripción (active/trial/expired)
 *  - 4 cards explicando cada feature + link directo
 *  - Email soporte prioritario directo (mailto + tracking)
 *  - Si free: CTA upgrade
 *
 * Solo client-side porque depende de localStorage (Stripe webhook → frontend
 * sync vía /api/premium/activate cuando el user vuelve del Checkout success).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus, PREMIUM_FEATURES, type PremiumStatus } from "@/lib/premium";
import { tcTrack } from "@/lib/track_client";

const SUPPORT_EMAIL = "contacto@tripcazador.com";

export function PremiumPanelClient() {
  const [status, setStatus] = useState<PremiumStatus>({
    active: false,
    tier: "free",
    source: "manual",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStatus(getPremiumStatus());
    setMounted(true);
    const onChange = (e: Event) => setStatus((e as CustomEvent).detail);
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, []);

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
          🎯 Tu Premium TripCazador
        </h1>
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
          <>
            <div className="flex items-center gap-3">
              <span className="text-3xl">✓</span>
              <div>
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
            </div>
          </>
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

      {/* 4 features */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Tus 4 ventajas Premium</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alertas instantáneas */}
          <FeatureCard
            icon="🚨"
            title="Alertas instantáneas"
            description={PREMIUM_FEATURES.instantAlerts}
            cta={status.active ? "Gestionar mis alertas" : "Ver cómo funciona"}
            href={status.active ? "/panel/premium/alertas" : "/alertas"}
            active={status.active}
            extra="Premium: alertas ilimitadas, polling cada 5 min, email priority. Plan gratis: 3 max, polling hora."
          />
          {/* Filtros pro */}
          <FeatureCard
            icon="✈"
            title="Filtros pro"
            description={PREMIUM_FEATURES.proFilters}
            cta={status.active ? "Buscar con filtros pro" : "Ver filtros disponibles"}
            href="/deals"
            active={status.active}
            extra="Filtra por aerolínea concreta, clase exacta (economy/business/first), número de escalas y banda horaria."
          />
          {/* Sin disclaimer */}
          <FeatureCard
            icon="✓"
            title="Datos exactos sin disclaimer"
            description={PREMIUM_FEATURES.noDisclaimer}
            cta="Ver ofertas sin disclaimer"
            href="/deals"
            active={status.active}
            extra='En el plan gratis cada deal lleva "Precio aproximado del último escaneo". En Premium NO ves ese disclaimer.'
          />
          {/* Soporte prioritario */}
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

      {/* Soporte rápido footer */}
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
            laborables. También puedes cancelar la suscripción desde el portal
            de Stripe (te enviamos el enlace en tu recibo).
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
