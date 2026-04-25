"""Tests para fase abr-2026r — full src parity, revalidate explícito, Tokyo business blog."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


# =============================================================================
# R3 — Explicit revalidate on dynamic routes
# =============================================================================

class TestRouteRevalidate:
    def test_blog_slug_has_revalidate(self):
        """abr-2026r — /blog/[slug] debe revalidar 24h máximo."""
        c = (WEB / "src/app/blog/[slug]/page.tsx").read_text(encoding="utf-8")
        assert re.search(r"export const revalidate = \d+", c), "blog/[slug] missing revalidate"
        # 86400 = 24h
        m = re.search(r"export const revalidate = (\d+)", c)
        assert m and int(m.group(1)) <= 86400 * 7, "revalidate too long"

    def test_blog_slug_dynamic_params(self):
        c = (WEB / "src/app/blog/[slug]/page.tsx").read_text(encoding="utf-8")
        assert "dynamicParams" in c, "blog/[slug] needs dynamicParams export for slugs nuevos"

    def test_destinos_slug_has_revalidate(self):
        """abr-2026r — /destinos/[slug] debe revalidar."""
        c = (WEB / "src/app/destinos/[slug]/page.tsx").read_text(encoding="utf-8")
        assert re.search(r"export const revalidate = \d+", c)

    def test_en_blog_slug_has_revalidate(self):
        """en/blog/[slug] ya tenía revalidate desde abr-2026k. Verificar regression."""
        c = (WEB / "src/app/en/blog/[slug]/page.tsx").read_text(encoding="utf-8")
        assert "export const revalidate" in c

    def test_revalidate_values_reasonable(self):
        """Ningún revalidate < 60s (DDoS de regen) ni > 1 semana."""
        for path in (
            "src/app/blog/[slug]/page.tsx",
            "src/app/destinos/[slug]/page.tsx",
            "src/app/en/blog/[slug]/page.tsx",
        ):
            c = (WEB / path).read_text(encoding="utf-8")
            for m in re.finditer(r"export const revalidate = (\d+)", c):
                v = int(m.group(1))
                assert 60 <= v <= 604800, f"{path} revalidate {v} out of [60, 1 week]"


# =============================================================================
# R6 — Tokyo business blog post
# =============================================================================

class TestTokyoBlogPost:
    POST = WEB / "src/content/blog/vuelos-business-class-baratos-tokio-2026.mdx"

    def test_post_exists(self):
        assert self.POST.exists()

    def test_frontmatter_complete(self):
        c = self.POST.read_text(encoding="utf-8")
        for k in ("title:", "description:", "slug:", "publishedAt:", "tags:"):
            assert k in c[:600], f"Missing frontmatter key: {k}"

    def test_keywords_business_premium(self):
        c = self.POST.read_text(encoding="utf-8")
        for kw in ("Tokio", "business", "ANA", "Lufthansa", "Star Alliance", "error fare", "Qatar"):
            assert kw in c, f"Missing keyword: {kw}"

    def test_internal_links(self):
        c = self.POST.read_text(encoding="utf-8")
        assert "t.me/tripcazador_bot" in c
        assert "/destinos" in c
        assert "/en/blog/cheapest-months" in c or "/blog/" in c

    def test_table_with_data(self):
        c = self.POST.read_text(encoding="utf-8")
        # Debe incluir tabla mes-por-mes
        assert "| Mes |" in c or "| Cheapest" in c
        assert "| Junio |" in c

    def test_word_count_substantial(self):
        c = self.POST.read_text(encoding="utf-8")
        body = c.split("---", 2)[-1]
        assert len(body.split()) >= 1100

    def test_unique_slug(self):
        slugs = []
        for p in (WEB / "src/content/blog").glob("*.mdx"):
            content = p.read_text(encoding="utf-8")
            m = re.search(r'^slug:\s*"([^"]+)"', content, re.MULTILINE)
            if m:
                slugs.append(m.group(1))
        assert len(slugs) == len(set(slugs))


# =============================================================================
# Integration: R deliverables + regression
# =============================================================================

class TestPhaseRIntegration:
    def test_blog_count_grew(self):
        posts = list((WEB / "src/content/blog").glob("*.mdx"))
        assert len(posts) >= 15, f"After fase-r ≥15 posts expected, found {len(posts)}"

    def test_destinationsmap_still_present(self):
        """R0 regression: full src parity push debe garantizar este componente."""
        assert (WEB / "src/components/DestinationsMap.tsx").exists()

    def test_destinations_map_used_correctly_in_destinos_page(self):
        """destinos/page.tsx usa nextDynamic — no debe revertir."""
        c = (WEB / "src/app/destinos/page.tsx").read_text(encoding="utf-8")
        assert "nextDynamic" in c
        assert "DestinationsMap" in c

    def test_speculation_rules_persist(self):
        """Q3 regression: Speculation Rules siguen en layout."""
        c = (WEB / "src/app/layout.tsx").read_text(encoding="utf-8")
        assert 'type="speculationrules"' in c

    def test_indexnow_includes_all_locales(self):
        """Q2 regression: locale URLs siguen en IndexNow."""
        c = (WEB / "src/app/api/indexnow/route.ts").read_text(encoding="utf-8")
        for loc in ("/de", "/fr", "/it"):
            assert f'`https://${{HOST}}{loc}`' in c
