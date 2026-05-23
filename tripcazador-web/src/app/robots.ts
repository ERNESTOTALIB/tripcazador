import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          // SSS383: panel privado (auth-only) — no debe crawlearse
          "/panel/",
          // Magic-link verify endpoints (no leakear via crawl)
          "/concierge/pedido/",
          // SSS417: /m/login dropped — la ruta UI ya no existe (404 en
          // PROD desde SSS370+). Mantenerla aquí filtraba un path
          // inexistente desde robots y confundía auditorías. Si vuelve
          // a montarse mobile login UI, restaurar este disallow.
          // SSS425: /offline es PWA fallback, no debe indexarse
          "/offline",
        ],
      },
    ],
    sitemap: "https://tripcazador.com/sitemap.xml",
    host: "https://tripcazador.com",
  };
}
