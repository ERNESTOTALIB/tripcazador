"use client";

import { usePathname } from "next/navigation";

/**
 * MainShell — fase vv VV1
 *
 * Contenedor de <main> que aplica -mt-16 únicamente en las rutas con
 * SkyHero full-bleed (/ y /en). En el resto el header sticky se queda
 * por encima del contenido sin solapar (panel, deals, blog, etc).
 *
 * Sin esto, el contenido de /panel se quedaba 64px detrás del header
 * sólido. Ahora el header reacciona al pathname (panel-aware) y este
 * shell controla el offset del main.
 */
export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasFullBleedHero = pathname === "/" || pathname === "/en";
  return (
    <main
      id="contenido-principal"
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        hasFullBleedHero ? "-mt-16" : ""
      }`}
    >
      {children}
    </main>
  );
}
