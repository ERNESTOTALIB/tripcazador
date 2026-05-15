"use client";

/**
 * MobileNavBar — fase jjj JJJ4 (May 2026)
 *
 * Bottom-fixed navigation bar mobile-only. Patrón nativo (iOS/Android tab bar)
 * con 4 destinos clave: Inicio · Buscar · Chollos · Favoritos.
 *
 * Por qué: usuarios mobile (~70% del tráfico) navegan más con thumb-zone que
 * con menús hamburguesa. Esta barra siempre visible mejora discovery de
 * /favoritos y /buscar-vuelos sin chocar con el header.
 *
 * Reglas:
 *  - Solo visible <sm (640px). Hidden en sm+ (donde tenemos header pill desktop).
 *  - Hidden en /panel/* (dashboard tiene su propia UI).
 *  - safe-area-inset-bottom para iPhone home bar.
 *  - Active state con underline ámbar.
 *  - Heart con badge contador de favoritos.
 *
 * NOTA: convive con MobileStickyCta (solo aparece en blog/comparativa, no
 * en home/deals). Layout añade pb-20 a body en mobile para no tapar contenido.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plane, Heart } from "lucide-react";
import { getFavorites, subscribeFavorites } from "@/lib/favorites";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home, match: (p) => p === "/" || p === "/en" },
  { href: "/buscar-vuelos", label: "Buscar", icon: Search, match: (p) => p.startsWith("/buscar") },
  { href: "/deals", label: "Chollos", icon: Plane, match: (p) => p.startsWith("/deals") },
  { href: "/favoritos", label: "Favoritos", icon: Heart, match: (p) => p.startsWith("/favoritos") },
];

// SSS216 (15 may 2026): dot indicator en "Chollos" cuando hay deals nuevos
// desde la última visita del user a /deals. Usa localStorage `tc_deals_seen_at`
// timestamp. Si deals-latest.json `generated_at` > tc_deals_seen_at → mostrar dot.
//
// Polling: cada 5min mientras user esté en home (no en /deals). Fetch HEAD
// no-store contra /deals-latest.json → Last-Modified header.
const DEALS_SEEN_KEY = "tc_deals_seen_at";
const DEALS_POLL_MS = 5 * 60_000;

async function hasFreshDeals(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const seen = parseInt(window.localStorage.getItem(DEALS_SEEN_KEY) || "0", 10);
    // First visit ever → mostrar dot (highlight feature)
    if (!seen) return true;
    const res = await fetch("/deals-latest.json", {
      method: "HEAD",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const lastMod = res.headers.get("last-modified");
    if (!lastMod) return false;
    const lastModMs = new Date(lastMod).getTime();
    if (!Number.isFinite(lastModMs)) return false;
    return lastModMs > seen;
  } catch {
    return false;
  }
}

export function MobileNavBar() {
  const pathname = usePathname() || "/";
  const [favCount, setFavCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [dealsFresh, setDealsFresh] = useState(false);

  // Hide en panel y en rutas embed/api
  const hidden =
    pathname.startsWith("/panel") ||
    pathname.startsWith("/embed") ||
    pathname.startsWith("/api");

  // SSS216: dot indicator "Chollos" — poll cada 5min mientras user no esté en /deals
  useEffect(() => {
    if (hidden) return;
    setHydrated(true);
    if (pathname.startsWith("/deals")) {
      // User está en /deals → marca como visto + reset dot
      try {
        window.localStorage.setItem(DEALS_SEEN_KEY, String(Date.now()));
      } catch {
        /* localStorage blocked */
      }
      setDealsFresh(false);
      return;
    }
    // Off /deals → check fresh
    let cancelled = false;
    hasFreshDeals().then((fresh) => {
      if (!cancelled) setDealsFresh(fresh);
    });
    const id = window.setInterval(() => {
      hasFreshDeals().then((fresh) => {
        if (!cancelled) setDealsFresh(fresh);
      });
    }, DEALS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [hidden, pathname]);

  useEffect(() => {
    if (hidden) return;
    setFavCount(getFavorites().length);
    return subscribeFavorites(() => setFavCount(getFavorites().length));
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav
      role="navigation"
      aria-label="Navegación inferior móvil"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      data-testid="mobile-nav-bar"
    >
      <ul className="flex items-stretch justify-around list-none m-0 p-0">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);
          const isFav = item.href === "/favoritos";
          const isDealsTab = item.href === "/deals";
          // SSS216: dot indicator solo en "Chollos" cuando hay deals nuevos
          // y el user NO está actualmente en /deals (else: redundante).
          const showFreshDot = isDealsTab && hydrated && dealsFresh && !isActive;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  isFav && hydrated && favCount > 0
                    ? `${item.label} (${favCount})`
                    : showFreshDot
                      ? `${item.label} (novedades)`
                      : item.label
                }
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
                  isActive ? "text-amber-400" : "text-gray-400 hover:text-white"
                }`}
              >
                <span className="relative">
                  <Icon
                    size={22}
                    fill={isFav && hydrated && favCount > 0 && !isActive ? "#fbbf24" : "none"}
                    className={isFav && hydrated && favCount > 0 && !isActive ? "text-amber-400" : ""}
                  />
                  {isFav && hydrated && favCount > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                      {favCount > 99 ? "99+" : favCount}
                    </span>
                  )}
                  {/* SSS216 — pulsing dot: deals frescos desde última visita */}
                  {showFreshDot && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-gray-950 animate-pulse"
                    />
                  )}
                </span>
                <span className="text-[10px] font-semibold">{item.label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-b" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
