"""Tests para fase abr-2026p — Italian i18n, hunter presets nuevos, blog SEO long-tail."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


# =============================================================================
# P2 — /it Italian stub page
# =============================================================================

class TestItalianStub:
    def test_it_page_exists(self):
        p = WEB / "src/app/it/page.tsx"
        assert p.exists(), "/it/page.tsx must exist for Italian market SEO"

    def test_it_page_has_metadata(self):
        content = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        assert "export const metadata" in content
        assert "canonical" in content
        assert "/it" in content

    def test_it_hreflang_includes_alternates(self):
        content = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        # Italian primary + alternates to other locales
        assert '"it"' in content or '"it-IT"' in content
        assert '"es"' in content
        assert '"en"' in content
        assert '"de"' in content
        assert '"fr"' in content
        assert "x-default" in content

    def test_it_page_has_jsonld_website(self):
        content = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        assert "@type" in content and "WebSite" in content
        assert 'inLanguage: "it"' in content

    def test_it_page_lang_attribute(self):
        content = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        assert 'lang="it"' in content

    def test_it_page_force_static_revalidate(self):
        content = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        assert 'export const dynamic = "force-static"' in content
        assert "export const revalidate = 86400" in content

    def test_it_page_has_telegram_cta(self):
        content = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        assert "t.me/tripcazador_bot" in content
        assert "Telegram" in content

    def test_it_page_links_back_to_es_en(self):
        """Italians should be able to switch to ES/EN versions."""
        content = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        assert 'href="/"' in content  # ES home
        assert 'href="/en"' in content  # EN home

    def test_sitemap_includes_it(self):
        content = (WEB / "src/app/sitemap.ts").read_text(encoding="utf-8")
        assert "/it" in content
        assert '"it":' in content or '"it-IT":' in content


# =============================================================================
# P3 — Hunter presets: asia-luxury + africa-adventure
# =============================================================================

class TestHunterPresets:
    def _config_text(self) -> str:
        return (ROOT / "flight_hunter_v4/config.py").read_text(encoding="utf-8")

    def test_asia_luxury_preset_exists(self):
        c = self._config_text()
        assert "DEST_ASIA_LUXURY" in c

    def test_asia_luxury_includes_premium_hubs(self):
        c = self._config_text()
        # Tokyo, Singapore, Hong Kong, Bangkok = mandatory premium business hubs
        for code in ("HND", "NRT", "SIN", "HKG", "BKK"):
            assert f'"{code}"' in c.split("DEST_ASIA_LUXURY")[1].split("]")[0], \
                f"DEST_ASIA_LUXURY missing required premium hub {code}"

    def test_africa_adventure_preset_exists(self):
        c = self._config_text()
        assert "DEST_AFRICA_ADVENTURE" in c

    def test_africa_adventure_covers_key_countries(self):
        c = self._config_text()
        block = c.split("DEST_AFRICA_ADVENTURE")[1].split("]")[0]
        # At least Morocco, Kenya, South Africa, Tanzania
        for code in ("CMN", "NBO", "JNB", "JRO"):
            assert f'"{code}"' in block, f"DEST_AFRICA_ADVENTURE missing key code {code}"

    def test_africa_adventure_size_reasonable(self):
        """Should be 10–20 destinations — coverage without dilution."""
        c = self._config_text()
        block = c.split("DEST_AFRICA_ADVENTURE = [")[1].split("]")[0]
        codes = re.findall(r'"([A-Z]{3})"', block)
        assert 10 <= len(codes) <= 20, f"AFRICA_ADVENTURE has {len(codes)} codes, expected 10-20"

    def test_asia_luxury_size_reasonable(self):
        c = self._config_text()
        block = c.split("DEST_ASIA_LUXURY = [")[1].split("]")[0]
        codes = re.findall(r'"([A-Z]{3})"', block)
        assert 8 <= len(codes) <= 18, f"ASIA_LUXURY has {len(codes)} codes, expected 8-18"

    def test_presets_have_explanatory_comments(self):
        """Each preset must have its purpose documented to avoid stale code."""
        c = self._config_text()
        # Comment must mention abr-2026p or business class or audience
        asia_section = c.split("DEST_ASIA_LUXURY")[0][-500:]
        africa_section = c.split("DEST_AFRICA_ADVENTURE")[0][-500:]
        assert "abr-2026p" in asia_section or "business" in asia_section.lower()
        assert "abr-2026p" in africa_section or "Adventure" in africa_section


# =============================================================================
# P4 — Blog posts SEO long-tail
# =============================================================================

class TestBlogPosts:
    BLOG_DIR = WEB / "src/content/blog"

    def test_italia_post_exists(self):
        assert (self.BLOG_DIR / "vuelos-baratos-italia-desde-espana-2026.mdx").exists()

    def test_cheapest_months_post_exists(self):
        assert (self.BLOG_DIR / "cheapest-months-to-fly-europe-2026.mdx").exists()

    def test_italia_post_has_frontmatter(self):
        c = (self.BLOG_DIR / "vuelos-baratos-italia-desde-espana-2026.mdx").read_text(encoding="utf-8")
        assert c.startswith("---\n")
        assert "title:" in c[:500]
        assert "description:" in c[:500]
        assert "slug:" in c[:500]
        assert "publishedAt:" in c[:500]
        assert "tags:" in c[:500]

    def test_italia_post_targets_keywords(self):
        """High-intent Spanish search keywords for Italy travel."""
        c = (self.BLOG_DIR / "vuelos-baratos-italia-desde-espana-2026.mdx").read_text(encoding="utf-8")
        for kw in ("Roma", "Milán", "Venecia", "Nápoles", "Catania", "Madrid", "Barcelona"):
            assert kw in c, f"Italia post missing keyword: {kw}"

    def test_italia_post_has_internal_links(self):
        c = (self.BLOG_DIR / "vuelos-baratos-italia-desde-espana-2026.mdx").read_text(encoding="utf-8")
        # Internal links to Telegram bot + /it + sister blog post
        assert "t.me/tripcazador_bot" in c
        assert "/it" in c
        assert "/destinos" in c or "/blog/" in c

    def test_italia_post_minimum_length(self):
        """SEO long-tail needs ≥1500 words."""
        c = (self.BLOG_DIR / "vuelos-baratos-italia-desde-espana-2026.mdx").read_text(encoding="utf-8")
        # Strip frontmatter
        body = c.split("---", 2)[-1]
        word_count = len(body.split())
        assert word_count >= 1200, f"Italia post is only {word_count} words, need 1200+"

    def test_cheapest_months_post_targets_data_audience(self):
        """English data-driven post targets analyst/researcher buyer-intent."""
        c = (self.BLOG_DIR / "cheapest-months-to-fly-europe-2026.mdx").read_text(encoding="utf-8")
        for kw in ("median", "Tuesday", "yield", "carrier", "Ryanair", "easyJet"):
            assert kw in c, f"EN post missing keyword: {kw}"

    def test_cheapest_months_post_has_table(self):
        """Data post must include comparative table for skim readability."""
        c = (self.BLOG_DIR / "cheapest-months-to-fly-europe-2026.mdx").read_text(encoding="utf-8")
        assert "| Destination |" in c or "| Cheapest month" in c

    def test_cheapest_months_post_links_to_es_version(self):
        """Cross-language hreflang sister-post link."""
        c = (self.BLOG_DIR / "cheapest-months-to-fly-europe-2026.mdx").read_text(encoding="utf-8")
        assert "vuelos-baratos-italia-desde-espana-2026" in c

    def test_blog_posts_have_unique_slugs(self):
        """All MDX slugs must be unique to avoid sitemap collisions."""
        slugs: list[str] = []
        for p in self.BLOG_DIR.glob("*.mdx"):
            content = p.read_text(encoding="utf-8")
            m = re.search(r'^slug:\s*"([^"]+)"', content, re.MULTILINE)
            if m:
                slugs.append(m.group(1))
        assert len(slugs) == len(set(slugs)), f"Duplicate blog slugs: {slugs}"


# =============================================================================
# Cross-cutting: all phase-p deliverables together
# =============================================================================

class TestPhasePIntegration:
    def test_it_landing_does_not_clash_with_dynamic_const(self):
        """Avoid the same name conflict that broke the previous Vercel build."""
        c = (WEB / "src/app/it/page.tsx").read_text(encoding="utf-8")
        # If we ever import dynamic, must rename it
        if 'from "next/dynamic"' in c:
            assert "import dynamic from" not in c, \
                "Conflict: next/dynamic import collides with `export const dynamic`"

    def test_destinos_page_has_dynamic_rename_fix(self):
        """Regression test: destinos page must keep nextDynamic rename."""
        c = (WEB / "src/app/destinos/page.tsx").read_text(encoding="utf-8")
        assert 'import dynamic from "next/dynamic"' not in c, \
            "destinos/page.tsx must NOT import as `dynamic` (conflicts with route segment config)"

    def test_blog_count_grew_in_phase_p(self):
        """At least 11 ES + EN posts after phase-p (was 11 baseline incl. 2 from o)."""
        posts = list((WEB / "src/content/blog").glob("*.mdx"))
        assert len(posts) >= 13, f"Expected ≥13 blog posts after phase-p, found {len(posts)}"
