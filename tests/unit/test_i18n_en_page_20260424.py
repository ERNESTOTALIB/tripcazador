"""
tests/unit/test_i18n_en_page_20260424.py
========================================
Regresiones sobre la ruta /en/ añadida en abr-2026i.

Cubren:
  - /en/layout.tsx + /en/page.tsx existen
  - El layout exporta metadata en inglés con alternates.languages
  - hreflang recíproco en root layout.tsx
  - page.tsx EN tiene schema FAQPage en inglés con inLanguage: "en"
  - sitemap.ts lista /en con alternates.languages
  - Footer raíz expone enlace EN
"""
from __future__ import annotations

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
APP = WEB / "src" / "app"
EN_LAYOUT = APP / "en" / "layout.tsx"
EN_PAGE = APP / "en" / "page.tsx"
ROOT_LAYOUT = APP / "layout.tsx"
SITEMAP = APP / "sitemap.ts"


def _read(p: Path) -> str:
    assert p.exists(), f"archivo no existe: {p}"
    return p.read_text(encoding="utf-8")


class TestEnglishRoute:
    def test_en_layout_file_exists(self):
        assert EN_LAYOUT.exists(), "/en/layout.tsx debe existir"

    def test_en_page_file_exists(self):
        assert EN_PAGE.exists(), "/en/page.tsx debe existir"

    def test_en_layout_declares_english_metadata(self):
        src = _read(EN_LAYOUT)
        assert "export const metadata" in src
        # Description está en inglés
        assert "error fares" in src.lower()
        assert "european airports" in src.lower() or "european" in src.lower()

    def test_en_layout_canonical_is_en(self):
        src = _read(EN_LAYOUT)
        assert 'canonical: "/en"' in src

    def test_en_layout_declares_hreflang_alternates(self):
        src = _read(EN_LAYOUT)
        # Debe exponer las variantes ES + EN + x-default
        assert '"en"' in src
        assert '"es"' in src or '"es-ES"' in src
        assert 'x-default' in src

    def test_en_layout_uses_section_lang_en(self):
        """El wrapper debe declarar lang="en" para screen readers."""
        src = _read(EN_LAYOUT)
        assert 'lang="en"' in src

    def test_en_layout_jsonld_inlanguage_en(self):
        src = _read(EN_LAYOUT)
        # WebSite schema con inLanguage apropiado
        assert 'inLanguage: "en"' in src


class TestEnglishHome:
    def test_en_home_title_english(self):
        src = _read(EN_PAGE)
        # Título de la página en inglés
        assert "Error fares" in src
        assert "TripCazador" in src

    def test_en_home_faq_schema_inlanguage_en(self):
        src = _read(EN_PAGE)
        assert "FAQPage" in src
        assert 'inLanguage: "en"' in src
        # Al menos 5 preguntas (mismo contrato que el home ES)
        q_count = src.count("q:")
        assert q_count >= 5

    def test_en_home_has_language_switcher(self):
        """Usuario EN debe poder volver a ES sin buscar en el footer."""
        src = _read(EN_PAGE)
        # Enlace de vuelta al home ES con hrefLang='es'
        assert 'hrefLang="es"' in src
        assert 'href="/"' in src

    def test_en_home_metadata_canonical(self):
        src = _read(EN_PAGE)
        assert 'canonical: "/en"' in src

    def test_en_home_no_raw_spanish_keywords(self):
        """El texto visible (no los comentarios JSX) debe estar en inglés.

        Test laxo: grep de palabras comunes españolas en el body del componente.
        Falsos positivos aceptables en comentarios /* ... */ y labels genéricos.
        """
        src = _read(EN_PAGE)
        # Palabras que NO deben aparecer en JSX text — aparecerían sólo si
        # alguien copió/pegó sin traducir.
        forbidden = ["Últimos chollos", "Preguntas frecuentes", "Error fares —"]
        for word in forbidden:
            assert word not in src, f"Texto español filtrado: {word}"


class TestRootLayoutHreflangEnglish:
    def test_root_layout_includes_en_in_alternates(self):
        src = _read(ROOT_LAYOUT)
        # Dentro del bloque languages debe estar la URL /en
        assert 'tripcazador.com/en' in src

    def test_root_layout_footer_has_en_link(self):
        src = _read(ROOT_LAYOUT)
        assert 'hrefLang="en"' in src
        # El enlace debe apuntar a /en (no a /english/ ni /en-us/)
        assert 'href="/en"' in src


class TestSitemapEnglish:
    def test_sitemap_lists_en_url(self):
        src = _read(SITEMAP)
        assert "${BASE_URL}/en" in src or "'/en'" in src or '"/en"' in src

    def test_sitemap_declares_language_alternates_for_home(self):
        src = _read(SITEMAP)
        # Debe haber un objeto `alternates: { languages: ... }` en el sitemap
        assert "alternates:" in src
        assert "languages:" in src


class TestRobotsCompatibility:
    def test_robots_does_not_disallow_en(self):
        """Guard: no queremos bloquear accidentalmente /en/."""
        robots = APP / "robots.ts"
        if not robots.exists():
            pytest.skip("robots.ts no existe")
        src = robots.read_text(encoding="utf-8")
        # Búsqueda permisiva — si /en aparece en disallow, fallar
        assert "/en/" not in src.split("disallow")[-1][:200] if "disallow" in src else True
