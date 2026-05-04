"""
Tests para fase SSS56 — IG con fondo destino + typing fix (May 2026):
  - dest_images.ts mapping IATA/ciudad → Unsplash photo + accent
  - post-v2 + story usan getDestImage + buildUnsplashUrl
  - <img src={bgUrl}> renderizado dentro de ImageResponse
  - typescript.ignoreBuildErrors: false (typing real arreglado SSS53b)
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# dest_images library
# ════════════════════════════════════════════════

class TestSSS56DestImages:
    LIB = WEB / "src/lib/dest_images.ts"

    def test_lib_exists(self):
        assert self.LIB.exists()

    def test_exports_get_dest_image(self):
        c = _read(self.LIB)
        assert "export function getDestImage" in c

    def test_exports_build_unsplash_url(self):
        c = _read(self.LIB)
        assert "export function buildUnsplashUrl" in c

    def test_covers_top_destinations(self):
        c = _read(self.LIB)
        # Top destinos del seed deben tener entry
        for slug in ("bali", "tokio", "lisboa", "nueva_york", "buenos_aires", "marrakech", "madrid", "barcelona"):
            assert f"{slug}:" in c, f"Falta entry {slug} en PHOTOS"

    def test_iata_to_key_mapping(self):
        c = _read(self.LIB)
        # IATAs comunes deben mapear a slugs
        for iata in ("DPS", "NRT", "LIS", "JFK", "MAD", "BCN"):
            assert f'{iata}:' in c, f"Falta IATA {iata}"

    def test_fallback_world(self):
        c = _read(self.LIB)
        # Debe haber un fallback "world" para destinos no mapeados
        assert "world:" in c
        assert "PHOTOS.world" in c

    def test_unsplash_url_optimized(self):
        c = _read(self.LIB)
        # Build URL con auto=format&fit=crop para optimización
        assert "auto=format&fit=crop" in c
        assert "q=80" in c


# ════════════════════════════════════════════════
# post-v2 con fondo real
# ════════════════════════════════════════════════

class TestSSS56PostV2Background:
    EP = WEB / "src/app/api/og/social/post-v2/route.tsx"

    def test_imports_dest_images(self):
        c = _read(self.EP)
        assert "from \"@/lib/dest_images\"" in c
        assert "getDestImage" in c
        assert "buildUnsplashUrl" in c

    def test_uses_img_background(self):
        c = _read(self.EP)
        # <img src={bgUrl}> debe estar dentro del componente
        assert "src={bgUrl}" in c
        assert 'objectFit: "cover"' in c

    def test_has_dark_overlay(self):
        c = _read(self.EP)
        # Overlay para legibilidad
        assert "rgba(10,21,48" in c

    def test_uses_dest_accent_color(self):
        c = _read(self.EP)
        # El arrow usa accent dinámico del destino
        assert "dest.accent" in c


# ════════════════════════════════════════════════
# story con fondo real
# ════════════════════════════════════════════════

class TestSSS56StoryBackground:
    EP = WEB / "src/app/api/og/social/story/route.tsx"

    def test_imports_dest_images(self):
        c = _read(self.EP)
        assert "getDestImage" in c
        assert "buildUnsplashUrl" in c

    def test_uses_img_background_full_bleed(self):
        c = _read(self.EP)
        # Background img full 1080×1340 (top 70%)
        assert "src={bgUrl}" in c
        assert '"1340px"' in c

    def test_has_savings_chip(self):
        c = _read(self.EP)
        # Chip "ahorras Xeur" para social proof
        assert "ahorras" in c
        assert "savingsEur" in c

    def test_has_urgency_badge_red(self):
        c = _read(self.EP)
        # Badge rojo urgencia con 🔥
        assert "rgba(220,38,38" in c
        assert "🔥" in c

    def test_bottom_panel_30_percent(self):
        c = _read(self.EP)
        # Panel navy bottom = 580px (de 1920)
        assert '"580px"' in c


# ════════════════════════════════════════════════
# typescript.ignoreBuildErrors removed
# ════════════════════════════════════════════════

class TestSSS56TypingFix:
    CONFIG = WEB / "next.config.js"

    def test_ignore_build_errors_false(self):
        c = _read(self.CONFIG)
        # SSS56e: REACTIVADO. Errores TS reales en funnel/route.ts arreglados
        # vía by_type: Record<string, number> en aggregate24h. tsc pasa limpio.
        assert "ignoreBuildErrors: false" in c

    def test_explanatory_comment_present(self):
        c = _read(self.CONFIG)
        # Comentario debe explicar el fix concreto (funnel/route.ts)
        assert "funnel/route.ts" in c or "by_type" in c
