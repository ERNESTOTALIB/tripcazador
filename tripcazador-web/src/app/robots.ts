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
          "/m/login",
        ],
      },
    ],
    sitemap: "https://tripcazador.com/sitemap.xml",
    host: "https://tripcazador.com",
  };
}
