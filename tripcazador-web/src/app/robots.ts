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
          // AUDIT-FULL-2 (24 may 2026): legacy /concierge/pedido eliminado
          // tras rename a /concierge/mis-pedidos (cookie-gated en app code).
          // SSS417: /m/login dropped — la ruta UI ya no existe (404 en
          // PROD desde SSS370+). Mantenerla aquí filtraba un path
          // inexistente desde robots y confundía auditorías. Si vuelve
          // a montarse mobile login UI, restaurar este disallow.
          // SSS425: /offline es PWA fallback, no debe indexarse
          "/offline",
          // SSS430: /newsletter/unsubscribe es página de acción, no SEO
          "/newsletter/",
        ],
      },
    ],
    sitemap: "https://tripcazador.com/sitemap.xml",
    host: "https://tripcazador.com",
  };
}
