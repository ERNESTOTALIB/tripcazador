"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { getFavorites, subscribeFavorites } from "@/lib/favorites";

/**
 * SiteHeader — fase uu C8 Glass Hero (vv: panel-aware)
 *
 * Header sticky con glassmorphism. Inicial = totalmente transparente
 * (sobre el sky gradient del hero), al scrollear >120px se aplica
 * background blanco con blur para legibilidad sobre fondos light.
 *
 * En rutas /panel/* el hero NO existe (dashboard dark), por lo que
 * forzamos modo "scrolled" desde el primer render para evitar overlap
 * de texto blanco del header con el title del panel.
 *
 * Comportamiento:
 *  - home: posición sticky sobre el hero (transparent + blur ligero)
 *    texto blanco mientras hero visible
 *    al scrollear pasa a "modo light": bg blanco glass, texto oscuro
 *  - /panel*: bg blanco glass desde el inicio, texto oscuro
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isPanelRoute = pathname?.startsWith("/panel") ?? false;
  const [scrollPast, setScrollPast] = useState(false);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    if (isPanelRoute) return; // panel: no header → no scroll listener
    const onScroll = () => setScrollPast(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isPanelRoute]);

  // III1 — favorites count badge
  useEffect(() => {
    if (isPanelRoute) return;
    setFavCount(getFavorites().length);
    return subscribeFavorites(() => setFavCount(getFavorites().length));
  }, [isPanelRoute]);

  // VV19: en /panel/* el dashboard ya tiene su propia barra dark
  // ("TripCazador Panel · Sesión · Share kit · Outreach · Cerrar sesión").
  // Evitamos doble nav ocultando completamente el SiteHeader público.
  if (isPanelRoute) return null;

  const scrolled = scrollPast;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-gray-200/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
      role="banner"
    >
      <nav aria-label="Navegación principal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href="/"
              aria-label="TripCazador — ir a la página principal"
              className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
            >
              <span
                className={`w-9 h-9 rounded-full grid place-items-center transition-colors ${
                  scrolled
                    ? "bg-gray-900 shadow-md"
                    : "bg-white/95 backdrop-blur-md shadow-lg"
                }`}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-5 h-5 transition-colors ${
                    scrolled ? "text-amber-400" : "text-amber-500"
                  }`}
                >
                  <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </span>
              <span
                className={`font-bold text-lg tracking-tight transition-colors ${
                  scrolled ? "text-gray-900" : "text-white"
                }`}
                style={!scrolled ? { textShadow: "0 1px 8px rgba(0,0,0,0.2)" } : undefined}
              >
                Trip<span className={scrolled ? "text-amber-500" : "text-amber-300"}>Cazador</span>
              </span>
            </a>

            {/* Nav glass pill */}
            <ul
              className={`hidden md:flex items-center gap-1 list-none m-0 p-1.5 rounded-full transition-all ${
                scrolled
                  ? "bg-gray-100 border border-gray-200/80"
                  : "bg-white/15 border border-white/25 backdrop-blur-xl shadow-lg"
              }`}
            >
              {[
                { href: "/deals", label: "Vuelos" },
                { href: "/hoteles", label: "Hoteles" },
                { href: "/destinos", label: "Destinos" },
                { href: "/blog", label: "Blog" },
                { href: "/premium", label: "Premium" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`inline-flex items-center min-h-[40px] px-4 rounded-full text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      scrolled
                        ? "text-gray-700 hover:text-gray-900 hover:bg-white"
                        : "text-white hover:bg-white/20"
                    }`}
                    style={!scrolled ? { textShadow: "0 1px 4px rgba(0,0,0,0.15)" } : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/favoritos"
                  aria-label={`Favoritos${favCount > 0 ? ` (${favCount})` : ""}`}
                  className={`relative inline-flex items-center justify-center min-h-[40px] w-10 rounded-full transition-all ${
                    scrolled
                      ? "text-gray-700 hover:text-amber-500 hover:bg-white"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  <Heart size={18} fill={favCount > 0 ? "#fbbf24" : "transparent"} className={favCount > 0 ? "text-amber-400" : ""} />
                  {favCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                      {favCount > 99 ? "99+" : favCount}
                    </span>
                  )}
                </a>
              </li>
              <li>
                <a
                  href="/deals"
                  className={`inline-flex items-center min-h-[40px] px-5 rounded-full text-sm font-bold transition-all ${
                    scrolled
                      ? "bg-gray-900 text-white hover:bg-amber-500"
                      : "bg-white text-gray-900 hover:bg-amber-300"
                  }`}
                >
                  Empezar
                </a>
              </li>
            </ul>

            {/* Mobile: heart + CTA */}
            <div className="md:hidden flex items-center gap-2">
              <a
                href="/favoritos"
                aria-label={`Favoritos${favCount > 0 ? ` (${favCount})` : ""}`}
                className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full ${
                  scrolled ? "text-gray-700 bg-white/70" : "text-white bg-white/20 backdrop-blur"
                }`}
              >
                <Heart size={18} fill={favCount > 0 ? "#fbbf24" : "transparent"} className={favCount > 0 ? "text-amber-400" : ""} />
                {favCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                    {favCount > 99 ? "99+" : favCount}
                  </span>
                )}
              </a>
              <a
                href="/deals"
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  scrolled ? "bg-gray-900 text-white" : "bg-white text-gray-900"
                }`}
              >
                Deals
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
