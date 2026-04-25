"""
tests/unit/test_perf_seo_security_i18n_20260425.py
==================================================
Regresiones para los 4 bloques de optimización abr-2026k:
  B1) Web Vitals: preconnect, font-display swap, next/image, dynamic mapa
  B2) SEO: Article schema enriquecido, lastmod real, /api/indexnow
  B3) Seguridad: middleware nonce + workflow audit
  B4) i18n profundo: /en/blog/[slug], /de, /fr + alternates root
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
APP = WEB / "src" / "app"
LIB = WEB / "src" / "lib"


def _read(p: Path) -> str:
    assert p.exists(), f"archivo no existe: {p}"
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════════════════════
# B1 — Web Vitals
# ════════════════════════════════════════════════════════════════


class TestWebVitalsRootLayout:
    def test_inter_uses_display_swap(self):
        src = _read(APP / "layout.tsx")
        assert 'display: "swap"' in src
        assert 'preload: true' in src

    def test_preconnect_to_critical_origins(self):
        src = _read(APP / "layout.tsx")
        for host in [
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
            "https://images.unsplash.com",
        ]:
            assert host in src, f"preconnect a {host} faltante"
        assert 'rel="preconnect"' in src
        assert 'rel="dns-prefetch"' in src

    def test_inter_subset_only_latin(self):
        src = _read(APP / "layout.tsx")
        # subsets: ["latin"] — no incluir cyrillic/greek/vietnamese
        assert 'subsets: ["latin"]' in src


class TestNextImageMigration:
    @pytest.mark.parametrize("path", [
        "blog/page.tsx",
        "blog/[slug]/page.tsx",
        "en/blog/page.tsx",
    ])
    def test_uses_next_image(self, path):
        src = _read(APP / path)
        assert 'from "next/image"' in src
        # No deben quedar <img tags directos en blog (excepto en MDX rendered).
        # Permitimos un comentario de eslint disabled si por compat hay otros img.
        # La regla: si hay <img usa next/image arriba.

    def test_no_img_legacy_in_blog_index(self):
        for path in ["blog/page.tsx", "en/blog/page.tsx", "blog/[slug]/page.tsx"]:
            src = _read(APP / path)
            assert "<img\n" not in src and "<img " not in src, (
                f"{path}: <img legacy aún presente, migrar a next/image"
            )


class TestDynamicMap:
    def test_destinos_lazy_loads_map(self):
        src = _read(APP / "destinos" / "page.tsx")
        # abr-2026p: renamed to nextDynamic to avoid name conflict with
        # `export const dynamic = "force-static"` route segment config
        # (the conflict was breaking Vercel webpack build).
        assert 'from "next/dynamic"' in src
        assert ('import nextDynamic' in src) or ('import dynamic' in src and 'export const dynamic' not in src)
        assert 'ssr: false' in src
        assert "DestinationsMap" in src
        # loading skeleton presente
        assert "animate-pulse" in src


# ════════════════════════════════════════════════════════════════
# B2 — SEO técnico
# ════════════════════════════════════════════════════════════════


class TestArticleSchema:
    def test_blog_slug_has_article_schema(self):
        src = _read(APP / "blog" / "[slug]" / "page.tsx")
        assert '"@type": "Article"' in src
        assert 'wordCount' in src
        assert 'timeRequired' in src
        assert 'isPartOf' in src
        assert 'inLanguage: "es-ES"' in src

    def test_blog_slug_has_breadcrumb_separate(self):
        src = _read(APP / "blog" / "[slug]" / "page.tsx")
        assert '"@type": "BreadcrumbList"' in src
        # Tres niveles: Inicio → Blog → post
        assert '"position": 1' in src or 'position: 1' in src
        assert '"position": 3' in src or 'position: 3' in src

    def test_dateModified_uses_lastModified_real(self):
        src = _read(APP / "blog" / "[slug]" / "page.tsx")
        # Antes era post.publishedAt (literal); ahora debe ser lastModified
        assert "post.lastModified" in src

    def test_keywords_is_array_not_csv(self):
        src = _read(APP / "blog" / "[slug]" / "page.tsx")
        # tags es array; antes se hacía .join(", "). Ahora directo.
        assert "keywords: post.tags," in src or "keywords: post.tags\n" in src


class TestBlogLibLastModified:
    def test_blog_post_type_has_lastModified(self):
        src = _read(LIB / "blog.ts")
        assert "lastModified: string" in src
        assert "wordCount: number" in src

    def test_getPostBySlug_reads_mtime(self):
        src = _read(LIB / "blog.ts")
        assert "fs.statSync" in src
        assert ".mtime" in src


class TestSitemapBlogLastmod:
    def test_uses_post_lastModified(self):
        src = _read(APP / "sitemap.ts")
        # Ahora itera con getAllPosts() y usa post.lastModified
        assert 'getAllPosts' in src
        assert 'post.lastModified' in src

    def test_includes_de_fr_alternates(self):
        src = _read(APP / "sitemap.ts")
        assert "/de" in src
        assert "/fr" in src


class TestIndexNowEndpoint:
    def test_route_file_exists(self):
        p = APP / "api" / "indexnow" / "route.ts"
        assert p.exists()

    def test_uses_constant_time_compare(self):
        p = APP / "api" / "indexnow" / "route.ts"
        src = _read(p)
        assert "constantTimeEqual" in src

    def test_requires_token_env(self):
        src = _read(APP / "api" / "indexnow" / "route.ts")
        assert 'INDEXNOW_TOKEN' in src
        assert 'unauthorized' in src

    def test_lists_all_pages_and_posts(self):
        src = _read(APP / "api" / "indexnow" / "route.ts")
        for path in ["/blog", "/destinos", "/en", "/en/blog"]:
            assert path in src


# ════════════════════════════════════════════════════════════════
# B3 — Seguridad
# ════════════════════════════════════════════════════════════════


class TestMiddlewareNonce:
    MID = WEB / "src" / "middleware.ts"

    def test_middleware_exists(self):
        assert self.MID.exists()

    def test_generates_nonce_per_request(self):
        src = _read(self.MID)
        assert "generateNonce" in src
        assert "crypto.getRandomValues" in src

    def test_sets_csp_header_with_nonce(self):
        src = _read(self.MID)
        assert "Content-Security-Policy" in src
        assert "'nonce-${nonce}'" in src

    def test_excludes_api_and_static_assets(self):
        src = _read(self.MID)
        assert "matcher:" in src
        assert "_next/static" in src
        assert "favicon.ico" in src
        assert "api/" in src

    def test_uses_strict_dynamic(self):
        src = _read(self.MID)
        assert "'strict-dynamic'" in src


class TestLayoutAppliesNonce:
    def test_layout_imports_headers(self):
        src = _read(APP / "layout.tsx")
        assert 'from "next/headers"' in src
        assert 'headers().get("x-nonce")' in src

    def test_ga_scripts_have_nonce(self):
        src = _read(APP / "layout.tsx")
        # Los 3 <Script> de GA deben recibir nonce
        # Hacemos count: 3 ocurrencias de nonce={nonce}
        nonce_count = src.count("nonce={nonce}")
        assert nonce_count >= 3, f"Esperaba 3+ nonce={{nonce}}, encontré {nonce_count}"


class TestAuditWorkflow:
    WF = ROOT / ".github" / "workflows" / "audit.yml"

    def test_workflow_exists(self):
        assert self.WF.exists()

    def test_runs_npm_audit(self):
        src = _read(self.WF)
        assert "npm audit" in src
        assert "audit-level=high" in src

    def test_runs_pip_audit(self):
        src = _read(self.WF)
        assert "pip-audit" in src
        # Matriz para api + flight_hunter_v4
        assert "api" in src
        assert "flight_hunter_v4" in src

    def test_runs_on_schedule_and_pr(self):
        src = _read(self.WF)
        assert "schedule:" in src
        assert "pull_request:" in src


# ════════════════════════════════════════════════════════════════
# B4 — i18n profundo
# ════════════════════════════════════════════════════════════════


class TestEnBlogSlugRoute:
    P = APP / "en" / "blog" / "[slug]" / "page.tsx"

    def test_route_exists(self):
        assert self.P.exists()

    def test_isEnglish_post_heuristic(self):
        src = _read(self.P)
        assert "isEnglishPost" in src

    def test_canonical_points_to_es_when_post_is_es(self):
        """Posts ES bajo /en/blog/[slug] tienen canonical → /blog/[slug]."""
        src = _read(self.P)
        assert "/blog/${post.slug}" in src
        # Y el robots.index = isEn (false para ES posts)
        assert "robots: { index: isEn" in src

    def test_renders_full_article_when_english(self):
        src = _read(self.P)
        assert '"@type": "Article"' in src
        assert 'inLanguage: "en"' in src

    def test_stub_when_spanish_post(self):
        src = _read(self.P)
        assert "Spanish-only" in src or "Spanish only" in src
        # Link al post ES original
        assert 'hrefLang="es"' in src


class TestDeFrLandings:
    def test_de_landing_exists(self):
        p = APP / "de" / "page.tsx"
        assert p.exists()
        src = _read(p)
        assert 'lang="de"' in src
        assert 'canonical: "/de"' in src
        assert "Günstige Flüge" in src or "Schnäppchen" in src

    def test_fr_landing_exists(self):
        p = APP / "fr" / "page.tsx"
        assert p.exists()
        src = _read(p)
        assert 'lang="fr"' in src
        assert 'canonical: "/fr"' in src
        assert "bons plans" in src or "pas chers" in src

    def test_de_alternates_includes_es_en_fr(self):
        src = _read(APP / "de" / "page.tsx")
        assert '"de-CH"' in src or 'de-CH' in src
        assert '"es"' in src
        assert '"en"' in src

    def test_fr_alternates_includes_es_en_de(self):
        src = _read(APP / "fr" / "page.tsx")
        assert '"fr-CH"' in src or 'fr-CH' in src
        assert '"es"' in src
        assert '"en"' in src


class TestRootLayoutHasDeFr:
    def test_root_alternates_include_de_fr(self):
        src = _read(APP / "layout.tsx")
        assert '"de"' in src
        assert '"fr"' in src
        assert '"de-CH"' in src
        assert '"fr-CH"' in src


class TestSitemapDeFr:
    def test_sitemap_includes_de_fr(self):
        src = _read(APP / "sitemap.ts")
        # Las dos rutas deben estar en el array de staticPages
        assert "${BASE_URL}/de" in src
        assert "${BASE_URL}/fr" in src
