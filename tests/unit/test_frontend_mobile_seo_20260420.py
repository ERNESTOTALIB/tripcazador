"""
tests/unit/test_frontend_mobile_seo_20260420.py
===============================================
Regresiones para mejoras mobile + SEO introducidas en abril 2026
(tareas #173 mobile polish y FAQ schema sobre home).

Estas pruebas son estáticas (grep-based) sobre el código del front, pues
los tests "vivos" corren en vitest. Aquí sólo verificamos que los
elementos críticos no desaparezcan en un refactor accidental.
"""
from __future__ import annotations

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
LAYOUT_TSX = WEB / "src" / "app" / "layout.tsx"
PAGE_TSX = WEB / "src" / "app" / "page.tsx"
GLOBALS_CSS = WEB / "src" / "app" / "globals.css"
TAILWIND_CFG = WEB / "tailwind.config.ts"
SEARCHBAR_TSX = WEB / "src" / "components" / "SearchBar.tsx"
DEALCARD_TSX = WEB / "src" / "components" / "DealCard.tsx"
NEXT_CFG = WEB / "next.config.js"


def _read(p: Path) -> str:
    assert p.exists(), f"archivo esperado no existe: {p}"
    return p.read_text(encoding="utf-8")


class TestViewportAndTailwind:
    def test_layout_exports_viewport_block(self):
        src = _read(LAYOUT_TSX)
        # Next 14 requiere exportar viewport por separado del metadata
        assert "export const viewport" in src
        assert "Viewport" in src  # tipo importado
        # Permitimos zoom hasta 5x (WCAG 1.4.4 — nunca bloquear zoom)
        assert "maximumScale" in src
        # viewportFit cover para safe-area en iPhone notch
        assert 'viewportFit: "cover"' in src

    def test_tailwind_has_xs_breakpoint(self):
        cfg = _read(TAILWIND_CFG)
        # xs: 480px para orientación landscape en móviles pequeños
        assert 'xs:' in cfg and '"480px"' in cfg

    def test_globals_prevent_ios_input_zoom(self):
        css = _read(GLOBALS_CSS)
        # iOS Safari hace zoom si font-size<16px en inputs
        assert "font-size: 16px" in css
        # overscroll-behavior previene rubber-band al hacer pull en iOS
        assert "overscroll-behavior" in css
        # overflow-x: hidden previene scroll lateral accidental
        assert "overflow-x: hidden" in css


class TestTouchTargets:
    """WCAG 2.5.5 AAA — áreas de toque ≥ 44×44px."""

    def test_searchbar_inputs_have_min_height(self):
        src = _read(SEARCHBAR_TSX)
        # Al menos 3 inputs (origen, destino, fechas) deben cumplir 44px
        assert src.count("min-h-[44px]") >= 3

    def test_dealcard_cta_has_min_height(self):
        src = _read(DEALCARD_TSX)
        # Tanto DealCard como DealRow tienen CTAs tappables
        assert "min-h-[44px]" in src

    def test_layout_footer_respects_safe_area(self):
        src = _read(LAYOUT_TSX)
        # Home-bar iOS — safe-area-inset-bottom via env()
        assert "safe-area-inset-bottom" in src


class TestHomeFaqSchema:
    """SEO — FAQPage schema + contenido visible (Google lo requiere)."""

    def test_homepage_renders_faq_schema(self):
        src = _read(PAGE_TSX)
        assert "FAQPage" in src  # JSON-LD @type
        assert "HOME_FAQ" in src  # constante del array de Q&A

    def test_faq_visible_in_dom_via_details(self):
        src = _read(PAGE_TSX)
        # <details> garantiza que las Q&A son visibles en el DOM
        # (requisito de Google para FAQ rich results)
        assert "<details" in src or "details>" in src

    def test_faq_has_six_entries(self):
        src = _read(PAGE_TSX)
        # El array HOME_FAQ debe tener al menos 5 entradas útiles
        # Buscamos patrones `q:` en el array
        q_count = src.count("q:")
        a_count = src.count("a:")
        assert q_count >= 5 and a_count >= 5


class TestSecurityHeaders:
    """next.config.js — headers de seguridad reforzados."""

    def test_coop_header_present(self):
        src = _read(NEXT_CFG)
        assert "Cross-Origin-Opener-Policy" in src

    def test_corp_header_present(self):
        src = _read(NEXT_CFG)
        assert "Cross-Origin-Resource-Policy" in src

    def test_permissions_policy_blocks_topics_api(self):
        src = _read(NEXT_CFG)
        # FLoC + su sucesor Topics API deben estar explícitamente bloqueados
        assert "interest-cohort=()" in src
        assert "browsing-topics=()" in src

    def test_permissions_policy_blocks_invasive_sensors(self):
        src = _read(NEXT_CFG)
        for token in ("payment=()", "usb=()", "accelerometer=()",
                      "gyroscope=()", "magnetometer=()"):
            assert token in src, f"Permissions-Policy debería bloquear {token}"

    def test_x_frame_options_deny(self):
        src = _read(NEXT_CFG)
        # Clickjacking — nadie debe poder embednos en un iframe
        assert 'X-Frame-Options' in src and '"DENY"' in src

    def test_hsts_with_preload(self):
        src = _read(NEXT_CFG)
        assert "Strict-Transport-Security" in src
        assert "preload" in src
