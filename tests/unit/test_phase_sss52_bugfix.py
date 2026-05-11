"""
Tests para fase SSS52 — Bug fixes (May 2026):
  - DestinationsMap: fetch manual de TopoJSON + loading/error states
  - sw.js networkFirstWithTimeout: no rejecta sin caché (fix pantalla negra)
  - sw.js: bump VERSION para invalidar SW antiguo
  - sw.js: precache /blog y /offline.html

SSS147 (May 2026):
  - DestinationsMap was REWRITTEN in SSS144 (TopoJSON + d3-geo Mercator,
    server-side SVG, no client useEffect). Old tests asserting on the
    old shape (useEffect/topoData/loadError/etc.) are obsolete → skipped.
  - sw.js was reduced to NO-OP in SSS136 (kill-switch + auto-unregister).
    Tests asserting on versioned caches / networkFirstWithTimeout are
    obsolete → skipped.
  - OG cache headers removed from carousel/post routes in rewrite → skipped.
"""
import pytest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# DestinationsMap fixes
# ════════════════════════════════════════════════

class TestDestinationsMapFix:
    COMP = WEB / "src/components/DestinationsMap.tsx"

    def test_component_exists(self):
        assert self.COMP.exists()

    @pytest.mark.skip(reason="SSS147: DestinationsMap rewritten in SSS144 — server-side d3-geo, no client useEffect/fetch.")
    def test_uses_useEffect_for_fetch(self):
        c = _read(self.COMP)
        assert "useEffect" in c
        assert 'fetch(GEO_URL' in c

    @pytest.mark.skip(reason="SSS147: DestinationsMap rewritten in SSS144 — no react-simple-maps geography prop.")
    def test_passes_topodata_object_not_url(self):
        c = _read(self.COMP)
        assert "geography={topoData" in c
        assert 'geography="/world-110m.json"' not in c

    @pytest.mark.skip(reason="SSS147: DestinationsMap rewritten in SSS144 — SSR, no client loading state.")
    def test_has_loading_state(self):
        c = _read(self.COMP)
        assert "Cargando mapa" in c
        assert "animate-spin" in c

    @pytest.mark.skip(reason="SSS147: DestinationsMap rewritten in SSS144 — SSR, no client error state.")
    def test_has_error_state(self):
        c = _read(self.COMP)
        assert "loadError" in c
        assert "Mapa no disponible" in c

    @pytest.mark.skip(reason="SSS147: DestinationsMap rewritten in SSS144 — different styling tokens.")
    def test_country_fill_visible_contrast(self):
        c = _read(self.COMP)
        assert 'fill="#334155"' in c
        assert 'stroke="#64748b"' in c

    @pytest.mark.skip(reason="SSS147: DestinationsMap rewritten in SSS144 — different background tokens.")
    def test_bg_lighter_than_before(self):
        c = _read(self.COMP)
        assert "bg-slate-800" in c

    @pytest.mark.skip(reason="SSS147: DestinationsMap rewritten in SSS144 — no minHeight inline style (SVG has explicit viewBox).")
    def test_min_height_set(self):
        c = _read(self.COMP)
        assert "minHeight" in c

    def test_topojson_file_exists(self):
        topo = WEB / "public/world-110m.json"
        assert topo.exists()
        assert topo.stat().st_size > 50_000  # ~107KB típico


# ════════════════════════════════════════════════
# Service Worker fixes (black-screen on first visit)
# ════════════════════════════════════════════════

class TestServiceWorkerFix:
    SW = WEB / "public/sw.js"

    def test_sw_exists(self):
        assert self.SW.exists()

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — no VERSION constant in current SW.")
    def test_version_bumped_for_invalidation(self):
        c = _read(self.SW)
        assert "tc-v4-2026-05-04" in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — no precache list in current SW.")
    def test_precache_includes_blog_and_offline(self):
        c = _read(self.SW)
        assert '"/blog"' in c
        assert '"/offline.html"' in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — no networkFirst strategy in current SW.")
    def test_network_first_no_reject_when_no_cache(self):
        c = _read(self.SW)
        assert "Sin caché → confía en la red" in c or "no cache" in c.lower()
        assert 'reject(new Error("timeout"))' not in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — no networkFirst strategy in current SW.")
    def test_network_first_uses_resolve_only(self):
        c = _read(self.SW)
        assert "new Promise((resolve)" in c


# ════════════════════════════════════════════════
# Preserve existing OG cache headers (SSS51 didn't break)
# ════════════════════════════════════════════════

class TestOGCacheHeadersPreserved:
    POST = WEB / "src/app/api/og/social/post/route.tsx"
    STORY = WEB / "src/app/api/og/social/story/route.tsx"
    CAROUSEL = WEB / "src/app/api/og/social/carousel/route.tsx"

    @pytest.mark.skip(reason="SSS147: /api/og/social/post rewritten in SSS73/SSS74 — cache headers removed (renders fast enough without them).")
    def test_post_aggressive_cache(self):
        c = _read(self.POST)
        assert "s-maxage=86400" in c
        assert "stale-while-revalidate=604800" in c

    def test_story_aggressive_cache(self):
        c = _read(self.STORY)
        assert "s-maxage=86400" in c
        assert "stale-while-revalidate" in c

    @pytest.mark.skip(reason="SSS147: /api/og/social/carousel rewritten — cache headers removed.")
    def test_carousel_aggressive_cache(self):
        c = _read(self.CAROUSEL)
        assert "s-maxage=86400" in c
        assert "stale-while-revalidate=604800" in c


# ════════════════════════════════════════════════
# trackPageView no-op (SSS51)
# ════════════════════════════════════════════════

class TestTrackPageViewNoOp:
    LIB = WEB / "src/lib/tracker.ts"

    def test_lib_exists(self):
        assert self.LIB.exists()

    def test_trackpageview_is_noop(self):
        c = _read(self.LIB)
        # SSS51: trackPageView debe ser no-op (page_view va por GA4 + CF)
        # Buscamos el patrón "intencionalmente vacío" o "NO-OP" en docstring
        assert "NO-OP" in c or "intencionalmente vacío" in c
