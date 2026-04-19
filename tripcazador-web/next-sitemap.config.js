/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://tripcazador.com",
  generateRobotsTxt: false, // lo mantenemos manual en /public/robots.txt
  sitemapSize: 5000,
  changefreq: "daily",
  priority: 0.7,
  exclude: ["/api/*", "/server-sitemap.xml"],
  alternateRefs: [],
  transform: async (config, path) => {
    // Prioridades por tipo de página
    let priority = 0.7;
    let changefreq = "daily";
    if (path === "/") {
      priority = 1.0;
      changefreq = "hourly";
    } else if (path.startsWith("/deals")) {
      priority = 0.9;
      changefreq = "hourly";
    } else if (path.startsWith("/destinos")) {
      priority = 0.8;
      changefreq = "weekly";
    } else if (path.startsWith("/blog")) {
      priority = 0.6;
      changefreq = "weekly";
    } else if (path === "/legal") {
      priority = 0.3;
      changefreq = "yearly";
    }
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
