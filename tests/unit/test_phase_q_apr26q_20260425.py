"""Tests para fase abr-2026q — IndexNow expansion, perf cache headers, Speculation Rules, Marrakech blog post."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


# =============================================================================
# Q2 — IndexNow ping expansion + robots.txt update
# =============================================================================

class TestIndexNowExpansion:
    def _route(self) -> str:
        return (WEB / "src/app/api/indexnow/route.ts").read_text(encoding="utf-8")

    def test_indexnow_includes_it_de_fr_locales(self):
        c = self._route()
        for path in ('/it', '/de', '/fr', '/en/blog', '/en/destinos'):
            assert f'`https://${{HOST}}{path}`' in c, f"IndexNow missing locale path {path}"

    def test_indexnow_includes_lead_magnet(self):
        c = self._route()
        assert "/lead-magnet/50-hubs-error-fare" in c

    def test_indexnow_includes_hoteles(self):
        c = self._route()
        assert "/hoteles" in c

    def test_indexnow_pings_bing_too(self):
        """abr-2026q: añadido bing ping además de IndexNow."""
        c = self._route()
        assert "bing.com/ping" in c
        assert "bing_ping_status" in c

    def test_indexnow_constant_time_compare_preserved(self):
        """Regression: no debemos haber roto el constant-time compare."""
        c = self._route()
        assert "constantTimeEqual" in c
        # Compara longitudes primero (no leak de longitud por timing)
        assert "if (a.length !== b.length) return false" in c


class TestRobotsTxt:
    def _robots(self) -> str:
        return (WEB / "public/robots.txt").read_text(encoding="utf-8")

    def test_robots_blocks_admin_endpoints(self):
        c = self._robots()
        assert "Disallow: /api/admin" in c
        assert "Disallow: /admin" in c

    def test_robots_blocks_indexnow_endpoint(self):
        """No queremos que se indexe el endpoint en sí (sería revelar el token)."""
        c = self._robots()
        assert "Disallow: /api/indexnow" in c

    def test_robots_blocks_query_strings(self):
        """Páginas con ?filter=... no deben indexarse — duplicates."""
        c = self._robots()
        assert "Disallow: /*?*" in c

    def test_robots_blocks_seo_scrapers(self):
        """Bots conocidos por scrapear sin valor (Ahrefs, Semrush) bloqueados."""
        c = self._robots()
        for bot in ("AhrefsBot", "SemrushBot", "MJ12bot", "DotBot"):
            assert f"User-agent: {bot}" in c, f"Robots no bloquea bot abusivo {bot}"

    def test_robots_handles_ai_crawlers(self):
        c = self._robots()
        for bot in ("GPTBot", "Google-Extended", "ClaudeBot"):
            assert f"User-agent: {bot}" in c, f"Robots no menciona AI bot {bot}"

    def test_robots_has_sitemap(self):
        c = self._robots()
        assert "Sitemap: https://tripcazador.com/sitemap.xml" in c

    def test_robots_allows_public_api_endpoints(self):
        """Health/status/img son endpoints públicos, deben estar permitidos."""
        c = self._robots()
        for ep in ("/api/img", "/api/health", "/api/status"):
            assert f"Allow: {ep}" in c


# =============================================================================
# Q3 — Perf: cache headers + Speculation Rules
# =============================================================================

class TestPerfHeaders:
    def _config(self) -> str:
        return (WEB / "next.config.js").read_text(encoding="utf-8")

    def test_static_assets_immutable_1y(self):
        c = self._config()
        assert "/_next/static/:path*" in c
        # 31536000 = 1 año en segundos
        assert "max-age=31536000, immutable" in c

    def test_og_image_cache_24h(self):
        c = self._config()
        assert "/blog/:slug/opengraph-image" in c
        # s-maxage para CDN, max-age para browser
        assert "s-maxage=86400" in c

    def test_en_og_image_cache(self):
        c = self._config()
        assert "/en/blog/:slug/opengraph-image" in c

    def test_api_img_cdn_cache(self):
        c = self._config()
        assert "/api/img" in c
        # 7 días en CDN, 24h en navegador
        assert "s-maxage=604800" in c

    def test_sitemap_short_cache(self):
        c = self._config()
        assert "/sitemap.xml" in c
        # Sitemap con cache corto para que crawlers vean cambios pronto
        assert re.search(r"sitemap\.xml.*\n.*max-age=300", c, re.DOTALL) or "max-age=300" in c

    def test_robots_short_cache(self):
        c = self._config()
        assert "/robots.txt" in c


class TestSpeculationRules:
    def _layout(self) -> str:
        return (WEB / "src/app/layout.tsx").read_text(encoding="utf-8")

    def test_speculation_rules_present(self):
        c = self._layout()
        assert 'type="speculationrules"' in c

    def test_prerender_critical_routes(self):
        """/deals + /destinos son las rutas con mayor click-through (38% + 19%)."""
        c = self._layout()
        # Buscamos las dos URLs en el JSON.stringify
        # Permitimos formato variable de string concat
        assert "/deals" in c and "/destinos" in c
        assert "prerender" in c

    def test_prefetch_moderate_for_other_routes(self):
        c = self._layout()
        assert "prefetch" in c
        assert "moderate" in c

    def test_speculation_rules_use_nonce(self):
        """CSP nonce debe propagarse al script speculationrules."""
        c = self._layout()
        # El script debe usar la variable nonce que ya existe en el layout
        m = re.search(r'<script[^>]*type="speculationrules"[^>]*nonce={nonce}', c)
        # Permitimos ambas variantes: nonce={nonce} o nonce={nonce ?? undefined}
        assert m or "nonce={nonce}" in c.split("speculationrules")[1][:500]


# =============================================================================
# Q5 — Marrakech blog post
# =============================================================================

class TestMarrakechBlogPost:
    POST = WEB / "src/content/blog/marrakech-cuando-ir-vuelos-baratos-2026.mdx"

    def test_post_exists(self):
        assert self.POST.exists()

    def test_frontmatter_complete(self):
        c = self.POST.read_text(encoding="utf-8")
        assert c.startswith("---\n")
        for k in ("title:", "description:", "slug:", "publishedAt:", "tags:", "readingTime:"):
            assert k in c[:600], f"Marrakech post missing frontmatter key: {k}"

    def test_keywords_strong(self):
        c = self.POST.read_text(encoding="utf-8")
        for kw in ("Marrakech", "RAK", "CMN", "Casablanca", "Ryanair", "Ramadán", "riad"):
            assert kw in c, f"Missing keyword {kw}"

    def test_internal_links(self):
        c = self.POST.read_text(encoding="utf-8")
        assert "tripcazador.com/destinos" in c
        assert "t.me/tripcazador_bot" in c
        # cross-link a otros blog posts del catálogo
        assert "/blog/" in c

    def test_table_with_data(self):
        """Post debe incluir tabla precios mes-por-mes (data-driven SEO)."""
        c = self.POST.read_text(encoding="utf-8")
        assert "| Mes |" in c
        assert "| Enero |" in c

    def test_word_count_minimum(self):
        c = self.POST.read_text(encoding="utf-8")
        body = c.split("---", 2)[-1]
        assert len(body.split()) >= 1000

    def test_unique_slug(self):
        slugs = []
        for p in (WEB / "src/content/blog").glob("*.mdx"):
            content = p.read_text(encoding="utf-8")
            m = re.search(r'^slug:\s*"([^"]+)"', content, re.MULTILINE)
            if m:
                slugs.append(m.group(1))
        assert len(slugs) == len(set(slugs))


# =============================================================================
# Cross-cutting: Q deliverables together + Q1 fix regression
# =============================================================================

class TestPhaseQIntegration:
    def test_destinations_map_committed(self):
        """Q1 hot-fix regression: el componente DestinationsMap debe existir."""
        assert (WEB / "src/components/DestinationsMap.tsx").exists()

    def test_destination_card_committed(self):
        assert (WEB / "src/components/DestinationCard.tsx").exists()

    def test_blog_count_grew_to_at_least_14(self):
        """Tras fase-q debemos tener ≥14 posts (13 base + Marrakech)."""
        posts = list((WEB / "src/content/blog").glob("*.mdx"))
        assert len(posts) >= 14, f"Expected ≥14 blog posts after q, found {len(posts)}"

    def test_indexnow_url_count_grew(self):
        """IndexNow debería ahora pingear más URLs por las locales añadidas."""
        c = (WEB / "src/app/api/indexnow/route.ts").read_text(encoding="utf-8")
        # Contar lines con `https://${HOST}` para estimar size de urlList
        count = len(re.findall(r'`https://\${HOST}', c))
        # Antes: ~7. Ahora: home, blog, destinos, deals, hoteles, en, en/blog, en/destinos, de, fr, it, lead-magnet = 12 + posts spread
        assert count >= 12, f"IndexNow only refs {count} URLs, expected ≥12"
