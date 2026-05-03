"""Tests para fase abr-2026dd — content + utility scaling round 4: +5 comparativas (30 total), monthly pages /vuelos-baratos-[mes], upgrade calculator (5th), Latam hreflang, +4 blog posts."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


# =============================================================================
# DD1: +5 comparativas (target 30)
# =============================================================================

class TestComparisonsDD:
    LIB = WEB / "src/lib/comparisons.ts"

    def test_at_least_30(self):
        c = self.LIB.read_text(encoding="utf-8")
        slugs = re.findall(r'^\s+slug:\s*"[a-z0-9-]+"', c, re.MULTILINE)
        assert len(slugs) >= 30, f"Found {len(slugs)} comparisons, expected ≥30"

    def test_new_dd_slugs(self):
        c = self.LIB.read_text(encoding="utf-8")
        for slug in (
            "madrid-vs-marrakech-escapada",
            "bangkok-vs-tokio-asia",
            "cancun-vs-bali-luna-miel",
            "praga-vs-viena-fin-de-semana",
            "estambul-vs-atenas-cultura-historica",
        ):
            assert slug in c, f"Missing slug: {slug}"

    def test_unique_slugs(self):
        c = self.LIB.read_text(encoding="utf-8")
        slugs = re.findall(r'^\s+slug:\s*"([a-z0-9-]+)"', c, re.MULTILINE)
        assert len(slugs) == len(set(slugs)), "Duplicate comparison slugs"


# =============================================================================
# DD2: Monthly pages /vuelos-baratos-[mes]
# =============================================================================

class TestMonthsLib:
    LIB = WEB / "src/lib/months.ts"

    def test_exists(self):
        assert self.LIB.exists()

    def test_12_months(self):
        c = self.LIB.read_text(encoding="utf-8")
        slugs = re.findall(r'^\s+slug:\s*"[a-z]+"', c, re.MULTILINE)
        assert len(slugs) >= 12, f"Found {len(slugs)} months, expected 12"

    def test_all_months_present(self):
        c = self.LIB.read_text(encoding="utf-8")
        for m in (
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
        ):
            assert f'slug: "{m}"' in c, f"Missing month: {m}"

    def test_each_has_top_destinations_and_tips(self):
        c = self.LIB.read_text(encoding="utf-8")
        for f in ("topDestinations:", "avoid:", "tips:", "monthEs:", "monthEn:", "number:"):
            assert f in c

    def test_get_month_by_slug_helper(self):
        c = self.LIB.read_text(encoding="utf-8")
        assert "getMonthBySlug" in c


class TestMonthsPages:
    # SSS36: estructura real es vuelos-baratos-mes (index) + vuelos-baratos/[mes]/page.tsx (detail)
    INDEX = WEB / "src/app/vuelos-baratos-mes/page.tsx"
    DETAIL = WEB / "src/app/vuelos-baratos/[mes]/page.tsx"

    def test_index_exists(self):
        assert self.INDEX.exists()

    def test_detail_exists(self):
        assert self.DETAIL.exists()

    def test_index_jsonld_itemlist(self):
        c = self.INDEX.read_text(encoding="utf-8")
        assert '"@type": "ItemList"' in c

    def test_detail_static_params(self):
        c = self.DETAIL.read_text(encoding="utf-8")
        assert "generateStaticParams" in c

    def test_detail_jsonld_article(self):
        c = self.DETAIL.read_text(encoding="utf-8")
        assert '"@type": "Article"' in c

    def test_detail_breadcrumb(self):
        c = self.DETAIL.read_text(encoding="utf-8")
        assert '"@type": "BreadcrumbList"' in c

    def test_detail_canonical(self):
        c = self.DETAIL.read_text(encoding="utf-8")
        assert "canonical" in c
        assert "/vuelos-baratos-${m.slug}" in c or "vuelos-baratos-" in c


# =============================================================================
# DD3: Upgrade Calculator (5th interactive)
# =============================================================================

class TestUpgradeCalculator:
    COMP = WEB / "src/components/UpgradeCalculator.tsx"
    PAGE = WEB / "src/app/calculadora-upgrade/page.tsx"

    def test_component_exists(self):
        assert self.COMP.exists()

    def test_page_exists(self):
        assert self.PAGE.exists()

    def test_uses_use_state(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert "useState" in c

    def test_includes_fare_classes(self):
        c = self.COMP.read_text(encoding="utf-8")
        for fc in ("deep_discount", "discount", "full_econ", "premium_econ"):
            assert fc in c

    def test_includes_status_levels(self):
        c = self.COMP.read_text(encoding="utf-8")
        for st in ("silver", "gold", "platinum"):
            assert st in c

    def test_includes_seasons(self):
        c = self.COMP.read_text(encoding="utf-8")
        for s in ("low", "shoulder", "high"):
            assert f'id: "{s}"' in c

    def test_jsonld_webapp(self):
        c = self.PAGE.read_text(encoding="utf-8")
        assert '"@type": "WebApplication"' in c

    def test_explains_upgrade_types(self):
        c = self.PAGE.read_text(encoding="utf-8")
        # Operational, Mileage, Cash
        for t in ("Operational", "Mileage", "Cash"):
            assert t in c


# =============================================================================
# DD4: Latam hreflang
# =============================================================================

class TestLatamHreflang:
    LAYOUT = WEB / "src/app/layout.tsx"

    def test_es_mx_hreflang(self):
        c = self.LAYOUT.read_text(encoding="utf-8")
        assert "es-MX" in c

    def test_es_ar_hreflang(self):
        c = self.LAYOUT.read_text(encoding="utf-8")
        assert "es-AR" in c

    def test_es_419_hreflang(self):
        c = self.LAYOUT.read_text(encoding="utf-8")
        assert "es-419" in c

    def test_other_latam_codes(self):
        c = self.LAYOUT.read_text(encoding="utf-8")
        for code in ("es-CO", "es-CL", "es-PE"):
            assert code in c


# =============================================================================
# DD5: 4 blog posts
# =============================================================================

class TestNewBlogPostsDD:
    POSTS = [
        WEB / "src/content/blog/vuelos-mexico-df-baratos-desde-espana-2026.mdx",
        WEB / "src/content/blog/vuelos-baratos-pascua-semana-santa-2026.mdx",
        WEB / "src/content/blog/frequent-flyer-status-maintain-efficiently-2026.mdx",
        WEB / "src/content/blog/como-evitar-overbooking-aerolineas-2026.mdx",
    ]

    def test_all_exist(self):
        for p in self.POSTS:
            assert p.exists(), f"Missing {p.name}"

    def test_mexico_keywords(self):
        c = self.POSTS[0].read_text(encoding="utf-8")
        for kw in ("México", "Aeroméxico", "MEX", "MAD"):
            assert kw in c

    def test_pascua_keywords(self):
        c = self.POSTS[1].read_text(encoding="utf-8")
        for kw in ("Pascua", "Semana Santa", "shoulder"):
            assert kw in c

    def test_status_keywords(self):
        c = self.POSTS[2].read_text(encoding="utf-8")
        for kw in ("status", "tier", "frequent flyer", "Mileage runs"):
            assert kw in c

    def test_overbooking_keywords(self):
        c = self.POSTS[3].read_text(encoding="utf-8")
        for kw in ("overbooking", "EU 261", "denegación", "voluntario"):
            assert kw in c

    def test_word_counts(self):
        for p in self.POSTS:
            c = p.read_text(encoding="utf-8")
            body = c.split("---", 2)[-1]
            count = len(body.split())
            assert count >= 1000, f"{p.name}: {count} words"

    def test_lang_field(self):
        es = [self.POSTS[0], self.POSTS[1], self.POSTS[3]]
        en = [self.POSTS[2]]
        for p in es:
            assert 'lang: "es"' in p.read_text(encoding="utf-8")
        for p in en:
            assert 'lang: "en"' in p.read_text(encoding="utf-8")

    def test_slugs_unique(self):
        slugs = []
        for p in (WEB / "src/content/blog").glob("*.mdx"):
            content = p.read_text(encoding="utf-8")
            m = re.search(r'^slug:\s*"([^"]+)"', content, re.MULTILINE)
            if m:
                slugs.append(m.group(1))
        assert len(slugs) == len(set(slugs))


# =============================================================================
# DD6: Sitemap + IndexNow
# =============================================================================

class TestSitemapDD:
    SM = WEB / "src/app/sitemap.ts"

    def test_imports_months(self):
        c = self.SM.read_text(encoding="utf-8")
        assert "MONTHS" in c

    def test_includes_vuelos_baratos_mes(self):
        c = self.SM.read_text(encoding="utf-8")
        assert "/vuelos-baratos-mes" in c

    def test_includes_calculadora_upgrade(self):
        c = self.SM.read_text(encoding="utf-8")
        assert "/calculadora-upgrade" in c

    def test_iterates_months(self):
        c = self.SM.read_text(encoding="utf-8")
        # SSS36: estructura cambió a /vuelos-baratos/[mes] (detail) — sitemap puede usar template directo
        assert ("vuelos-baratos/${m.slug}" in c
                or "vuelos-baratos-${m.slug}" in c
                or "vuelos-baratos/" in c)


class TestIndexNowDD:
    IN = WEB / "src/app/api/indexnow/route.ts"

    def test_imports_months(self):
        c = self.IN.read_text(encoding="utf-8")
        assert "MONTHS" in c

    def test_includes_dd_urls(self):
        c = self.IN.read_text(encoding="utf-8")
        for url_part in ("/vuelos-baratos-mes", "/calculadora-upgrade"):
            assert url_part in c

    def test_iterates_months(self):
        c = self.IN.read_text(encoding="utf-8")
        # SSS36: estructura actual /vuelos-baratos/[mes]
        assert ("vuelos-baratos/${m.slug}" in c
                or "vuelos-baratos-${m.slug}" in c
                or "vuelos-baratos/" in c)


# =============================================================================
# Integration / regression
# =============================================================================

class TestPhaseDDIntegration:
    def test_blog_count_grew(self):
        posts = list((WEB / "src/content/blog").glob("*.mdx"))
        assert len(posts) >= 44, f"After fase-dd expected ≥44 blog posts, found {len(posts)}"

    def test_no_regression_speculation_rules(self):
        c = (WEB / "src/app/layout.tsx").read_text(encoding="utf-8")
        assert 'type="speculationrules"' in c

    def test_no_regression_calculadoras(self):
        # 5 calculators total
        for path in [
            "calculadora",
            "calculadora-co2",
            "calculadora-millas",
            "calculadora-cancelacion",
            "calculadora-upgrade",
        ]:
            assert (WEB / f"src/app/{path}/page.tsx").exists(), f"Missing {path}"

    def test_no_regression_glosario(self):
        assert (WEB / "src/app/glosario/page.tsx").exists()

    def test_no_regression_buscar(self):
        assert (WEB / "src/app/buscar/page.tsx").exists()

    def test_no_regression_stopovers(self):
        assert (WEB / "src/app/stopovers/page.tsx").exists()

    def test_no_regression_regiones(self):
        assert (WEB / "src/app/regiones/page.tsx").exists()
        assert (WEB / "src/app/regiones/[slug]/page.tsx").exists()

    def test_no_regression_blog_og_no_edge(self):
        c = (WEB / "src/app/blog/[slug]/opengraph-image.tsx").read_text(encoding="utf-8")
        active_edge = re.search(r'^\s*export const runtime\s*=\s*"edge"', c, re.MULTILINE)
        assert active_edge is None
