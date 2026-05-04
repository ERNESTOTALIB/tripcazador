"""
Tests para fase SSS63 — Instrumentación del funnel completo (May 2026):
  - lib/track_client.ts expone tcTrack + tcTrackOnce + readUtmFromLocation
  - TrackingBeacon dispara landing_arrived + scroll_75
  - DealCard observa result_viewed via IntersectionObserver
  - FavoriteButton emite favorite_added en add (no remove)
  - ShareDealInline emite share_completed con channel
  - PremiumUpgradeButton emite premium_cta_view + premium_cta_click
  - ConciergeForm emite concierge_view + concierge_click_pay
  - /api/track route.ts whitelist contiene 9 eventos nuevos
  - /hoteles cablea HotelStarTierTabs con groupByStarTier
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# track_client lib
# ════════════════════════════════════════════════


class TestSSS63TrackClient:
    LIB = WEB / "src/lib/track_client.ts"

    def test_lib_exists(self):
        assert self.LIB.exists()

    def test_exports_tc_track(self):
        c = _read(self.LIB)
        assert "export function tcTrack(" in c

    def test_exports_tc_track_once(self):
        c = _read(self.LIB)
        assert "export function tcTrackOnce(" in c

    def test_consent_gating(self):
        c = _read(self.LIB)
        # No envía si consent === "0"
        assert "tc_analytics_ok" in c

    def test_uses_send_beacon_with_fallback(self):
        c = _read(self.LIB)
        assert "navigator.sendBeacon" in c
        assert "keepalive" in c

    def test_dedup_via_session_storage(self):
        c = _read(self.LIB)
        # tcTrackOnce debe persistir entre callbacks via sessionStorage
        assert "sessionStorage" in c

    def test_reads_utm_from_location(self):
        c = _read(self.LIB)
        assert "readUtmFromLocation" in c
        assert "utm_source" in c or "utm_" in c


# ════════════════════════════════════════════════
# Component instrumentation
# ════════════════════════════════════════════════


class TestSSS63TrackingBeacon:
    F = WEB / "src/components/TrackingBeacon.tsx"

    def test_emits_landing_arrived(self):
        c = _read(self.F)
        assert "landing_arrived" in c

    def test_emits_scroll_75(self):
        c = _read(self.F)
        assert "scroll_75" in c

    def test_uses_track_client(self):
        c = _read(self.F)
        assert '"@/lib/track_client"' in c


class TestSSS63DealCard:
    F = WEB / "src/components/DealCard.tsx"

    def test_emits_result_viewed(self):
        c = _read(self.F)
        assert "result_viewed" in c

    def test_uses_intersection_observer(self):
        c = _read(self.F)
        assert "IntersectionObserver" in c

    def test_uses_track_once(self):
        c = _read(self.F)
        assert "tcTrackOnce" in c


class TestSSS63FavoriteButton:
    F = WEB / "src/components/FavoriteButton.tsx"

    def test_emits_favorite_added(self):
        c = _read(self.F)
        assert "favorite_added" in c

    def test_only_on_add_not_remove(self):
        # Debe estar dentro de un if (next) para evitar trackear removes
        c = _read(self.F)
        # Heurística: el track call debe estar después de un check positivo
        assert "if (next)" in c


class TestSSS63ShareDealInline:
    F = WEB / "src/components/ShareDealInline.tsx"

    def test_emits_share_completed(self):
        c = _read(self.F)
        assert "share_completed" in c

    def test_includes_channel_meta(self):
        c = _read(self.F)
        # share_completed debe incluir channel para distinguir wa/tg/native
        assert "channel" in c


class TestSSS63PremiumUpgradeButton:
    F = WEB / "src/components/PremiumUpgradeButton.tsx"

    def test_emits_premium_cta_view(self):
        c = _read(self.F)
        assert "premium_cta_view" in c

    def test_emits_premium_cta_click(self):
        c = _read(self.F)
        assert "premium_cta_click" in c

    def test_uses_intersection_observer_for_view(self):
        c = _read(self.F)
        assert "IntersectionObserver" in c


class TestSSS63ConciergeForm:
    F = WEB / "src/components/ConciergeForm.tsx"

    def test_emits_concierge_view(self):
        c = _read(self.F)
        assert "concierge_view" in c

    def test_emits_concierge_click_pay(self):
        c = _read(self.F)
        assert "concierge_click_pay" in c


# ════════════════════════════════════════════════
# /api/track whitelist
# ════════════════════════════════════════════════


class TestSSS63TrackRouteWhitelist:
    F = WEB / "src/app/api/track/route.ts"

    NEW_EVENTS = [
        "landing_arrived",
        "result_viewed",
        "share_completed",
        "favorite_added",
        "scroll_75",
        "concierge_view",
        "concierge_click_pay",
        "premium_cta_view",
        "premium_cta_click",
    ]

    def test_all_new_events_whitelisted(self):
        c = _read(self.F)
        for ev in self.NEW_EVENTS:
            assert f'"{ev}"' in c, f"falta whitelist {ev} en VALID_TYPES"


# ════════════════════════════════════════════════
# Hotel star-tier tabs
# ════════════════════════════════════════════════


class TestSSS63HotelStarTierTabs:
    COMP = WEB / "src/components/HotelStarTierTabs.tsx"
    PAGE = WEB / "src/app/hoteles/page.tsx"

    def test_component_exists(self):
        assert self.COMP.exists()

    def test_component_uses_group_by_star_tier(self):
        c = _read(self.COMP)
        assert "groupByStarTier" in c

    def test_component_renders_three_tiers(self):
        c = _read(self.COMP)
        # Las 3 categorías visibles
        assert "5★" in c or "5★ Premium" in c
        assert "4★" in c
        assert "3★" in c

    def test_component_is_client(self):
        c = _read(self.COMP)
        assert '"use client"' in c

    def test_page_imports_component(self):
        c = _read(self.PAGE)
        assert "HotelStarTierTabs" in c
        assert "from \"@/components/HotelStarTierTabs\"" in c

    def test_page_renders_component(self):
        c = _read(self.PAGE)
        assert "<HotelStarTierTabs" in c
