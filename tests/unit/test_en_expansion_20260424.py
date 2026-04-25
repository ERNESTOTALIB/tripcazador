"""
tests/unit/test_en_expansion_20260424.py
========================================
Regresiones para la expansión /en añadida en abr-2026j:
  - /en/blog y /en/destinos existen con metadata/canonicals/hreflang
  - Sub-nav en /en/layout.tsx expone las tres superficies EN
  - sitemap lista /en/blog + /en/destinos con alternates.languages
  - Blog article filter rule funciona (isEnglishPost visible heurística)
"""
from __future__ import annotations

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
APP = WEB / "src" / "app"
EN_BLOG = APP / "en" / "blog" / "page.tsx"
EN_DEST = APP / "en" / "destinos" / "page.tsx"
EN_LAYOUT = APP / "en" / "layout.tsx"
SITEMAP = APP / "sitemap.ts"


def _read(p: Path) -> str:
    assert p.exists(), f"archivo no existe: {p}"
    return p.read_text(encoding="utf-8")


class TestEnBlogRoute:
    def test_en_blog_file_exists(self):
        assert EN_BLOG.exists()

    def test_en_blog_canonical_and_alternates(self):
        src = _read(EN_BLOG)
        assert 'canonical: "/en/blog"' in src
        assert '/en/blog' in src
        assert '/blog' in src
        assert 'x-default' in src

    def test_en_blog_includes_jsonld_blog(self):
        src = _read(EN_BLOG)
        assert '"@type": "Blog"' in src
        assert 'inLanguage: "en"' in src

    def test_en_blog_filter_heuristics_present(self):
        """La heurística isEnglishPost debe ser inspeccionable."""
        src = _read(EN_BLOG)
        assert "isEnglishPost" in src
        assert "EN_SLUG_HINTS" in src

    def test_en_blog_links_to_spanish_sister(self):
        src = _read(EN_BLOG)
        assert 'hrefLang="es"' in src
        assert 'href="/blog"' in src


class TestEnDestinationsRoute:
    def test_en_dest_file_exists(self):
        assert EN_DEST.exists()

    def test_en_dest_lists_twelve_slugs(self):
        """Los 12 slugs deben matchear los del sitemap."""
        src = _read(EN_DEST)
        # Mínimo 12 destinos representados
        for slug in [
            "japon", "tanzania", "maldivas", "nueva-york", "bali",
            "buenos-aires", "tailandia", "sudafrica", "islandia",
            "marruecos", "vietnam", "costa-rica",
        ]:
            assert f'slug: "{slug}"' in src, f"Slug {slug} falta"

    def test_en_dest_canonical(self):
        src = _read(EN_DEST)
        assert 'canonical: "/en/destinos"' in src

    def test_en_dest_has_itemlist_schema(self):
        src = _read(EN_DEST)
        assert '"@type": "ItemList"' in src
        assert 'inLanguage: "en"' in src

    def test_en_dest_no_spanish_text_leaks(self):
        """Heurístico: palabras ES comunes que no deben aparecer en JSX visible."""
        src = _read(EN_DEST)
        forbidden = ["Mejor época", "Mejores meses", "Guía de destino"]
        for word in forbidden:
            assert word not in src, f"Texto español filtrado: {word}"


class TestEnLayoutSubNav:
    def test_layout_has_home_blog_destinations_links(self):
        src = _read(EN_LAYOUT)
        assert '"English sections"' in src or "'English sections'" in src or "English sections" in src
        assert '/en/blog' in src
        assert '/en/destinos' in src

    def test_layout_spanish_switcher_present(self):
        src = _read(EN_LAYOUT)
        assert 'hrefLang="es"' in src
        assert 'rel="alternate"' in src


class TestSitemapAlternates:
    def test_sitemap_lists_en_blog(self):
        src = _read(SITEMAP)
        assert "/en/blog" in src

    def test_sitemap_lists_en_destinos(self):
        src = _read(SITEMAP)
        assert "/en/destinos" in src

    def test_sitemap_blog_has_alternates_languages(self):
        src = _read(SITEMAP)
        assert "LANG_ALT_BLOG" in src
        assert "LANG_ALT_DESTINOS" in src

    def test_sitemap_alternates_objects_applied(self):
        """Cada ruta alternada debe declarar `alternates: { languages }`."""
        src = _read(SITEMAP)
        # Al menos 4 asignaciones alternates: home-es, home-en, blog, destinos,
        # y sus variantes EN.
        assert src.count("alternates: { languages:") >= 4
