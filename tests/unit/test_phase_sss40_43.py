"""
Tests para fases SSS40-43 (May 2026):
  - SSS40 OG endpoints sociales (post, story, carousel)
  - SSS41 Hunters Latam + Balcanes + Europa Norte presets
  - SSS42 PWA polish (manifest share_target + offline.html + sw push actions)
  - SSS43 Analytics funnel endpoint
"""
import json
import re
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
HUNTER = ROOT / "flight_hunter_v4"

# Note: HUNTER is already on sys.path via conftest.py; do NOT re-insert at
# index 0 or it shadows api/main.py for any subsequent tests that
# `import main` expecting the FastAPI app (SSS147 contamination fix).


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# SSS40 — OG endpoints sociales
# ════════════════════════════════════════════════

class TestOGSocialEndpoints:
    POST = WEB / "src/app/api/og/social/post/route.tsx"
    STORY = WEB / "src/app/api/og/social/story/route.tsx"
    CAROUSEL = WEB / "src/app/api/og/social/carousel/route.tsx"

    def test_post_endpoint_exists(self):
        assert self.POST.exists()

    def test_story_endpoint_exists(self):
        assert self.STORY.exists()

    def test_carousel_endpoint_exists(self):
        assert self.CAROUSEL.exists()

    def test_post_has_runtime_edge(self):
        c = _read(self.POST)
        assert 'export const runtime = "edge"' in c

    def test_post_uses_image_response(self):
        c = _read(self.POST)
        assert "ImageResponse" in c
        assert "from \"next/og\"" in c

    def test_post_dimensions_1080x1080(self):
        c = _read(self.POST)
        assert "width: 1080" in c
        assert "height: 1080" in c

    def test_story_dimensions_1080x1920(self):
        c = _read(self.STORY)
        assert "width: 1080" in c
        assert "height: 1920" in c

    def test_post_has_brand_colors(self):
        c = _read(self.POST)
        # Navy + ámbar brand
        assert "#0a1530" in c
        assert "#fbbf24" in c

    @pytest.mark.skip(reason="SSS147: /api/og/social/post rewritten in SSS73/SSS74 (Barcelona magazine layout) — classification badges removed from design.")
    def test_post_has_classification_badges(self):
        c = _read(self.POST)
        for cls in ("CRÍTICO", "ERROR", "ANOMALÍA", "OFERTA"):
            assert cls in c

    def test_carousel_has_5_slides(self):
        c = _read(self.CAROUSEL)
        # Verificar que existen los 5 templates por topic
        # Y que el slug acepta slide=1..5
        assert "slide" in c
        assert "slide === \"places\"" in c

    def test_carousel_has_topics(self):
        c = _read(self.CAROUSEL)
        for topic in ("places", "food"):  # SSS57b carousel slides
            assert topic in c


# ════════════════════════════════════════════════
# SSS41 — Hunters Latam / Balcanes / Europa Norte
# ════════════════════════════════════════════════

class TestHunterPresetsExpansion:
    def test_latam_hubs_exists(self):
        import config
        assert hasattr(config, "LATAM_HUBS")
        assert len(config.LATAM_HUBS) >= 25

    def test_latam_includes_main_hubs(self):
        import config
        for code in ("MEX", "EZE", "GRU", "BOG", "SCL", "LIM", "PTY"):
            assert code in config.LATAM_HUBS, f"Missing {code}"

    def test_dest_balcanes_exists(self):
        import config
        assert hasattr(config, "DEST_BALCANES")
        assert len(config.DEST_BALCANES) >= 15

    def test_dest_balcanes_includes_main(self):
        import config
        for code in ("TIA", "BEG", "SJJ", "TGD", "SKP", "ZAG"):
            assert code in config.DEST_BALCANES, f"Missing {code}"

    def test_dest_europa_norte_exists(self):
        import config
        assert hasattr(config, "DEST_EUROPA_NORTE")
        assert len(config.DEST_EUROPA_NORTE) >= 15

    def test_dest_europa_norte_includes_islandia(self):
        import config
        assert "KEF" in config.DEST_EUROPA_NORTE  # Reikiavik
        assert "TOS" in config.DEST_EUROPA_NORTE  # Tromsø
        assert "RVN" in config.DEST_EUROPA_NORTE  # Rovaniemi

    def test_main_py_origins_latam_wired(self):
        c = _read(HUNTER / "main.py")
        assert 'args.origins == "latam"' in c
        assert "config.LATAM_HUBS" in c

    def test_main_py_dest_balcanes_wired(self):
        c = _read(HUNTER / "main.py")
        assert '"balcanes"' in c
        assert '"europa-norte"' in c


# ════════════════════════════════════════════════
# SSS42 — PWA polish
# ════════════════════════════════════════════════

class TestPWAPolish:
    MANIFEST = WEB / "public/site.webmanifest"
    OFFLINE = WEB / "public/offline.html"
    SW = WEB / "public/sw.js"

    def test_manifest_has_share_target(self):
        m = json.loads(_read(self.MANIFEST))
        assert "share_target" in m
        assert m["share_target"]["action"] == "/buscar"
        assert m["share_target"]["method"] == "GET"

    def test_manifest_has_protocol_handlers(self):
        m = json.loads(_read(self.MANIFEST))
        assert "protocol_handlers" in m
        assert any(p.get("protocol") == "web+tripcazador" for p in m["protocol_handlers"])

    def test_manifest_has_edge_side_panel(self):
        m = json.loads(_read(self.MANIFEST))
        assert "edge_side_panel" in m
        assert m["edge_side_panel"]["preferred_width"] == 480

    def test_manifest_handle_links(self):
        m = json.loads(_read(self.MANIFEST))
        assert m.get("handle_links") == "preferred"

    def test_offline_html_exists(self):
        assert self.OFFLINE.exists()

    def test_offline_has_brand_colors(self):
        c = _read(self.OFFLINE)
        assert "#0a1530" in c
        assert "#fbbf24" in c

    def test_offline_loads_cached_favorites(self):
        c = _read(self.OFFLINE)
        assert "tripcazador_favorites" in c
        assert "localStorage" in c

    def test_offline_auto_reloads_when_online(self):
        c = _read(self.OFFLINE)
        assert 'addEventListener("online"' in c
        assert "location.reload" in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — no offline fallback in current SW.")
    def test_sw_uses_offline_html_fallback(self):
        c = _read(self.SW)
        assert "/offline.html" in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — no action buttons in current SW.")
    def test_sw_push_has_action_buttons(self):
        c = _read(self.SW)
        assert "actions:" in c
        assert '"snooze"' in c or "'snooze'" in c
        assert '"view"' in c or "'view'" in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — push payload simplified.")
    def test_sw_push_supports_image_payload(self):
        c = _read(self.SW)
        assert "image: data.image" in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — requireInteraction removed.")
    def test_sw_supports_require_interaction(self):
        c = _read(self.SW)
        assert "requireInteraction" in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — notificationclose handler removed.")
    def test_sw_handles_notification_close(self):
        c = _read(self.SW)
        assert 'addEventListener("notificationclose"' in c

    @pytest.mark.skip(reason="SSS147: sw.js reduced to NO-OP in SSS136 — snooze action removed.")
    def test_sw_snooze_reschedules(self):
        c = _read(self.SW)
        assert 'action === "snooze"' in c
        assert "3600 * 1000" in c


# ════════════════════════════════════════════════
# SSS43 — Funnel endpoint
# ════════════════════════════════════════════════

class TestFunnelEndpoint:
    FUNNEL = WEB / "src/app/api/admin/funnel/route.ts"

    def test_funnel_endpoint_exists(self):
        assert self.FUNNEL.exists()

    def test_funnel_uses_panel_auth(self):
        c = _read(self.FUNNEL)
        assert "verifyToken" in c
        assert "COOKIE_KEY" in c

    def test_funnel_has_5_stages(self):
        c = _read(self.FUNNEL)
        for stage in (
            "1_visit",
            "2_engagement",
            "3_deal_click",
            "4_outbound",
            "5_booking_estimated",
        ):
            assert stage in c

    def test_funnel_calculates_drop_off(self):
        c = _read(self.FUNNEL)
        assert "drop_pct_from_prev" in c
        assert "conversion_pct_from_top" in c

    def test_funnel_estimates_revenue(self):
        c = _read(self.FUNNEL)
        assert "estimated_commission_eur" in c
        assert "revenue_per_visitor_eur" in c

    def test_funnel_provides_insights(self):
        c = _read(self.FUNNEL)
        assert "worst_drop_off" in c
        assert "recommendation" in c

    def test_funnel_returns_json(self):
        c = _read(self.FUNNEL)
        assert "NextResponse.json" in c


# ════════════════════════════════════════════════
# SSS40 — instagram_publish.py wired al nuevo endpoint
# ════════════════════════════════════════════════

class TestInstagramPublisherUpgrade:
    SCRIPT = ROOT / "scripts/instagram_publish_deals.py"

    def test_publisher_uses_v2_endpoint(self):
        c = _read(self.SCRIPT)
        assert "/api/og/social/post" in c

    def test_publisher_supports_version_env(self):
        c = _read(self.SCRIPT)
        assert "IG_OG_VERSION" in c
