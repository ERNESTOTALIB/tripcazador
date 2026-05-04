"""
Tests para fase SSS52 — Bug fixes (May 2026):
  - DestinationsMap: fetch manual de TopoJSON + loading/error states
  - sw.js networkFirstWithTimeout: no rejecta sin caché (fix pantalla negra)
  - sw.js: bump VERSION para invalidar SW antiguo
  - sw.js: precache /blog y /offline.html
"""
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

    def test_uses_useEffect_for_fetch(self):
        c = _read(self.COMP)
        assert "useEffect" in c, "Necesita useEffect para fetch manual de TopoJSON"
        assert 'fetch(GEO_URL' in c

    def test_passes_topodata_object_not_url(self):
        c = _read(self.COMP)
        # geography ya no es URL string en JSX, sino el state topoData
        # (con cast `as string` para satisfacer typing react-simple-maps@3)
        assert "geography={topoData" in c
        # GEO_URL solo se usa dentro del fetch, no como prop
        assert 'geography="/world-110m.json"' not in c

    def test_has_loading_state(self):
        c = _read(self.COMP)
        assert "Cargando mapa" in c
        assert "animate-spin" in c

    def test_has_error_state(self):
        c = _read(self.COMP)
        assert "loadError" in c
        assert "Mapa no disponible" in c

    def test_country_fill_visible_contrast(self):
        c = _read(self.COMP)
        # SSS52: subimos contraste países vs fondo
        assert 'fill="#334155"' in c  # slate-700 (más visible vs slate-800 bg)
        assert 'stroke="#64748b"' in c  # slate-500

    def test_bg_lighter_than_before(self):
        c = _read(self.COMP)
        # Antes: bg-slate-950 (casi negro). Ahora: bg-slate-800 (visible)
        assert "bg-slate-800" in c

    def test_min_height_set(self):
        c = _read(self.COMP)
        # Para que el loading state tenga altura visible
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

    def test_version_bumped_for_invalidation(self):
        c = _read(self.SW)
        # Bump de versión obliga a re-instalar el SW en clientes existentes
        assert "tc-v4-2026-05-04" in c, "VERSION debe bumpearse para invalidar SW viejo con bug"

    def test_precache_includes_blog_and_offline(self):
        c = _read(self.SW)
        # Precache crítico para que la primera visita nunca caiga al fallback "offline" plano
        assert '"/blog"' in c
        assert '"/offline.html"' in c

    def test_network_first_no_reject_when_no_cache(self):
        c = _read(self.SW)
        # SSS52: el bug original rejectaba con "timeout" si no había caché y la red tardaba >3s,
        # disparando el fallback "offline" → pantalla negra. Fix: sin caché esperamos a la red.
        assert "Sin caché → confía en la red" in c or "no cache" in c.lower()
        # Aseguramos que el reject del timeout viejo desapareció:
        assert 'reject(new Error("timeout"))' not in c

    def test_network_first_uses_resolve_only(self):
        c = _read(self.SW)
        # La nueva versión usa Promise<resolve> sin reject (siempre devuelve algo)
        assert "new Promise((resolve)" in c


# ════════════════════════════════════════════════
# Preserve existing OG cache headers (SSS51 didn't break)
# ════════════════════════════════════════════════

class TestOGCacheHeadersPreserved:
    POST = WEB / "src/app/api/og/social/post/route.tsx"
    STORY = WEB / "src/app/api/og/social/story/route.tsx"
    CAROUSEL = WEB / "src/app/api/og/social/carousel/route.tsx"

    def test_post_aggressive_cache(self):
        c = _read(self.POST)
        assert "s-maxage=86400" in c
        assert "stale-while-revalidate=604800" in c

    def test_story_aggressive_cache(self):
        c = _read(self.STORY)
        assert "s-maxage=86400" in c
        assert "stale-while-revalidate" in c

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
