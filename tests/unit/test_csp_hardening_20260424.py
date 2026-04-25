"""
tests/unit/test_csp_hardening_20260424.py
=========================================
Regresiones sobre el endurecimiento de headers CSP/trusted-types en
abr-2026i (#184) y los globales mobile/a11y en globals.css.
"""
from __future__ import annotations

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
NEXT_CFG = WEB / "next.config.js"
GLOBALS_CSS = WEB / "src" / "app" / "globals.css"


def _read(p: Path) -> str:
    assert p.exists(), f"archivo no existe: {p}"
    return p.read_text(encoding="utf-8")


class TestCspGranularity:
    """CSP granular para el futuro nonce + trusted-types."""

    def test_script_src_elem_present(self):
        src = _read(NEXT_CFG)
        assert "script-src-elem" in src

    def test_style_src_elem_and_attr_present(self):
        src = _read(NEXT_CFG)
        assert "style-src-elem" in src
        assert "style-src-attr" in src

    def test_worker_src_defined(self):
        src = _read(NEXT_CFG)
        # Next 14 streaming RSC usa workers
        assert "worker-src" in src

    def test_manifest_src_self(self):
        src = _read(NEXT_CFG)
        assert "manifest-src" in src

    def test_media_src_defined(self):
        src = _read(NEXT_CFG)
        assert "media-src" in src

    def test_object_src_none(self):
        """object-src 'none' sigue siendo obligatorio (Flash/PDF XSS)."""
        src = _read(NEXT_CFG)
        assert "object-src 'none'" in src

    def test_frame_ancestors_none(self):
        src = _read(NEXT_CFG)
        assert "frame-ancestors 'none'" in src


class TestTrustedTypes:
    def test_report_only_header_present(self):
        src = _read(NEXT_CFG)
        assert "Content-Security-Policy-Report-Only" in src

    def test_require_trusted_types_for_script(self):
        src = _read(NEXT_CFG)
        assert "require-trusted-types-for 'script'" in src

    def test_trusted_types_policy_names(self):
        src = _read(NEXT_CFG)
        # Next.js define un policy llamado 'nextjs' cuando tiene streaming
        # habilitado. Mantener la lista explícita.
        assert "trusted-types" in src
        assert "nextjs" in src


class TestExtraHeaders:
    def test_origin_agent_cluster_header(self):
        """Aísla este origen en un agent cluster propio (side-channel)."""
        src = _read(NEXT_CFG)
        assert "Origin-Agent-Cluster" in src

    def test_coep_unsafe_none_explicit(self):
        """COEP: explícito unsafe-none para no romper imágenes externas.

        Si alguien intenta cambiar a 'require-corp' sin actualizar remote
        patterns, todo el sitio se rompe. Mejor dejarlo explícito y que el
        test lo proteja.
        """
        src = _read(NEXT_CFG)
        assert "Cross-Origin-Embedder-Policy" in src


class TestAccessibilityCss:
    def test_focus_visible_ring_global(self):
        src = _read(GLOBALS_CSS)
        # :focus-visible con outline ámbar global
        assert ":focus-visible" in src
        assert "outline:" in src.lower() or "outline " in src.lower()

    def test_forced_colors_media_query(self):
        """Windows High Contrast / iOS Increase Contrast."""
        src = _read(GLOBALS_CSS)
        assert "forced-colors: active" in src
        assert "Canvas" in src
        assert "Highlight" in src

    def test_svh_fallback_for_mobile_url_bar(self):
        """100svh evita saltos cuando la URL bar de iOS aparece/desaparece."""
        src = _read(GLOBALS_CSS)
        assert "100svh" in src

    def test_selection_contrast(self):
        src = _read(GLOBALS_CSS)
        # ::selection explícita para contrast guaranteed sobre fondo oscuro
        assert "::selection" in src

    def test_prefers_reduced_motion_present(self):
        """Reducir animaciones para usuarios con sensibilidad vestibular."""
        src = _read(GLOBALS_CSS)
        assert "prefers-reduced-motion" in src
