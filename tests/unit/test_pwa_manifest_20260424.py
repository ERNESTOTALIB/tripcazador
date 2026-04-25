"""
tests/unit/test_pwa_manifest_20260424.py
========================================
Regresiones sobre el PWA manifest enriquecido en abr-2026j (#193).

Verifica:
  - site.webmanifest parsea como JSON válido
  - Contiene icons en múltiples tamaños (16, 32, 192, 512, 180 apple)
  - Declara purpose: "maskable" para Android adaptive icons
  - Declara shortcuts (accesos directos PWA Android)
  - theme_color y background_color presentes y válidos (hex)
  - display_override con window-controls-overlay
  - scope, start_url y lang declarados
  - Iconos referenciados existen en /public/
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
MANIFEST = WEB / "public" / "site.webmanifest"
PUBLIC = WEB / "public"


@pytest.fixture(scope="module")
def manifest() -> dict:
    assert MANIFEST.exists(), f"manifest no existe: {MANIFEST}"
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


class TestManifestBasics:
    def test_json_valid(self, manifest):
        assert isinstance(manifest, dict)

    def test_name_and_short_name(self, manifest):
        assert "TripCazador" in manifest.get("name", "")
        assert manifest.get("short_name") == "TripCazador"

    def test_theme_and_background(self, manifest):
        assert manifest.get("theme_color") == "#f59e0b"
        assert manifest.get("background_color") == "#030712"

    def test_display_and_scope(self, manifest):
        assert manifest.get("display") == "standalone"
        assert manifest.get("scope") == "/"
        assert manifest.get("start_url", "").startswith("/")

    def test_lang_declared(self, manifest):
        assert manifest.get("lang") == "es-ES"

    def test_categories_list(self, manifest):
        cats = manifest.get("categories", [])
        assert isinstance(cats, list)
        assert "travel" in cats


class TestManifestIcons:
    def test_icons_array_has_multiple_sizes(self, manifest):
        icons = manifest.get("icons", [])
        sizes = {i.get("sizes") for i in icons}
        for required in ["16x16", "32x32", "192x192", "512x512"]:
            assert required in sizes, f"Tamaño {required} faltante"

    def test_icons_include_maskable_variant(self, manifest):
        icons = manifest.get("icons", [])
        purposes = [i.get("purpose", "") for i in icons]
        # Al menos un icon con maskable (Android adaptive)
        assert any("maskable" in p for p in purposes)

    def test_apple_touch_icon_present(self, manifest):
        """iOS usa el icon 180x180."""
        icons = manifest.get("icons", [])
        sizes = [i.get("sizes") for i in icons]
        assert "180x180" in sizes

    def test_icons_referenced_files_exist(self, manifest):
        icons = manifest.get("icons", [])
        for ic in icons:
            src = ic.get("src", "").lstrip("/")
            p = PUBLIC / src
            assert p.exists(), f"icon file falta: {p}"


class TestManifestShortcuts:
    def test_shortcuts_array_present(self, manifest):
        sc = manifest.get("shortcuts", [])
        assert isinstance(sc, list)
        assert len(sc) >= 3

    def test_deals_shortcut_exists(self, manifest):
        sc = manifest.get("shortcuts", [])
        urls = {s.get("url") for s in sc}
        assert "/deals" in urls

    def test_business_shortcut_exists(self, manifest):
        sc = manifest.get("shortcuts", [])
        urls = [s.get("url", "") for s in sc]
        assert any("cabin=business" in u for u in urls)

    def test_english_shortcut_exists(self, manifest):
        """PWA Android: usuario puede hacer long-press icon y saltar a /en."""
        sc = manifest.get("shortcuts", [])
        urls = [s.get("url", "") for s in sc]
        assert any(u == "/en" or u.startswith("/en?") for u in urls)


class TestManifestDisplayOverride:
    def test_display_override_present(self, manifest):
        dov = manifest.get("display_override", [])
        assert isinstance(dov, list)

    def test_window_controls_overlay_preferred(self, manifest):
        """Desktop install: app-shell limpia sin chrome browser."""
        dov = manifest.get("display_override", [])
        assert "window-controls-overlay" in dov
