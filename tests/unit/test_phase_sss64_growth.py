"""
Tests para fase SSS64 — Growth + Monetización (May 2026):
  - /api/admin/cohorts (D1/D7/D30 retention)
  - /api/admin/vitals (Web Vitals p75 self-hosted)
  - /api/admin/revenue-history (snapshot + GET serie 180d)
  - /api/admin/ab-results (chi-square 2x2)
  - /api/admin/search-console (GSC stub con setup steps)
  - /api/premium/webhook (Stripe signing verify)
  - /api/recommendations (cluster-based)
  - /api/web-vitals (POST endpoint)
  - lib/recommendations.ts (DESTINATIONS + getRecommendations)
  - lib/dest_images.ts seasonal variants
  - drip_templates.ts CONCIERGE_RECOVERY_TEMPLATE
  - workflows: indexnow-on-push.yml + revenue-snapshot.yml
  - /mx /ar /cl Latam stubs
  - HUNTER_LIMITS.md doc
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# Backend endpoints existen
# ════════════════════════════════════════════════


class TestSSS64Endpoints:
    def test_cohorts_endpoint(self):
        f = WEB / "src/app/api/admin/cohorts/route.ts"
        assert f.exists()
        c = _read(f)
        assert "cohortFor" in c
        assert "retention_pct" in c

    def test_vitals_endpoint(self):
        f = WEB / "src/app/api/admin/vitals/route.ts"
        assert f.exists()
        c = _read(f)
        assert "p75" in c
        assert "THRESHOLDS" in c

    def test_web_vitals_post_endpoint(self):
        f = WEB / "src/app/api/web-vitals/route.ts"
        assert f.exists()
        c = _read(f)
        assert "VALID_NAMES" in c
        assert "LCP" in c and "CLS" in c and "INP" in c

    def test_revenue_history(self):
        f = WEB / "src/app/api/admin/revenue-history/route.ts"
        assert f.exists()
        c = _read(f)
        assert "RevenueSnapshot" in c
        assert "ADMIN_TOKEN" in c

    def test_ab_results(self):
        f = WEB / "src/app/api/admin/ab-results/route.ts"
        assert f.exists()
        c = _read(f)
        assert "chiSquare2x2" in c
        assert "p_value" in c

    def test_search_console_stub(self):
        f = WEB / "src/app/api/admin/search-console/route.ts"
        assert f.exists()
        c = _read(f)
        assert "GSC_SA_JSON" in c
        assert "setup_steps" in c

    def test_premium_webhook(self):
        f = WEB / "src/app/api/premium/webhook/route.ts"
        assert f.exists()
        c = _read(f)
        assert "verifyStripeSignature" in c
        assert "STRIPE_WEBHOOK_SECRET" in c
        assert "checkout.session.completed" in c

    def test_recommendations_endpoint(self):
        f = WEB / "src/app/api/recommendations/route.ts"
        assert f.exists()
        c = _read(f)
        assert "getRecommendations" in c


# ════════════════════════════════════════════════
# Lib + helpers
# ════════════════════════════════════════════════


class TestSSS64Recommendations:
    LIB = WEB / "src/lib/recommendations.ts"

    def test_lib_exists(self):
        assert self.LIB.exists()

    def test_destinations_defined(self):
        c = _read(self.LIB)
        # Coverage minimum
        for iata in ("BKK", "DPS", "JFK", "CUN", "RAK", "EZE", "PMI"):
            assert f'iata: "{iata}"' in c, f"Missing IATA {iata}"

    def test_clusters_present(self):
        c = _read(self.LIB)
        for cluster in ("asia_se", "asia_e", "caribbean", "med_eu", "north_eu", "africa"):
            assert cluster in c

    def test_exports_get_recommendations(self):
        c = _read(self.LIB)
        assert "export function getRecommendations(" in c


class TestSSS64SeasonalLandmarks:
    LIB = WEB / "src/lib/dest_images.ts"

    def test_seasonal_variants_exist(self):
        c = _read(self.LIB)
        assert "SEASONAL_VARIANTS" in c
        assert "getSeasonalDestImage" in c
        assert "getCurrentSeasonalDestImage" in c

    def test_tokyo_sakura(self):
        c = _read(self.LIB)
        assert "Tokyo cherry blossoms" in c

    def test_iceland_aurora(self):
        c = _read(self.LIB)
        assert "Iceland aurora borealis" in c


class TestSSS64DripTemplate:
    LIB = WEB / "src/lib/drip_templates.ts"

    def test_concierge_recovery_export(self):
        c = _read(self.LIB)
        assert "CONCIERGE_RECOVERY_TEMPLATE" in c
        assert "Concierge" in c


# ════════════════════════════════════════════════
# Workflows
# ════════════════════════════════════════════════


class TestSSS64Workflows:
    def test_indexnow_on_push(self):
        f = ROOT / ".github/workflows/indexnow-on-push.yml"
        assert f.exists()
        c = _read(f)
        assert "indexnow" in c.lower()
        assert "main" in c

    def test_revenue_snapshot(self):
        f = ROOT / ".github/workflows/revenue-snapshot.yml"
        assert f.exists()
        c = _read(f)
        assert "schedule:" in c
        assert "revenue-history" in c


# ════════════════════════════════════════════════
# Latam pages
# ════════════════════════════════════════════════


class TestSSS64LatamStubs:
    def test_mx_page(self):
        f = WEB / "src/app/mx/page.tsx"
        assert f.exists()
        c = _read(f)
        assert "México" in c
        assert "es-MX" in c

    def test_ar_page(self):
        f = WEB / "src/app/ar/page.tsx"
        assert f.exists()
        c = _read(f)
        assert "Argentina" in c
        assert "es-AR" in c

    def test_cl_page(self):
        f = WEB / "src/app/cl/page.tsx"
        assert f.exists()
        c = _read(f)
        assert "Chile" in c
        assert "es-CL" in c


# ════════════════════════════════════════════════
# Hunter limits documentation
# ════════════════════════════════════════════════


class TestSSS64HunterLimits:
    DOC = ROOT / "HUNTER_LIMITS.md"

    def test_exists(self):
        assert self.DOC.exists()

    def test_covers_apis(self):
        c = _read(self.DOC)
        for api in ("Travelpayouts", "Duffel", "SerpAPI", "RapidAPI", "Hotellook"):
            assert api in c, f"Missing API {api}"

    def test_has_recommendation(self):
        c = _read(self.DOC)
        assert "Opción A" in c or "Opción B" in c or "Opción C" in c


# ════════════════════════════════════════════════
# Content
# ════════════════════════════════════════════════


class TestSSS64Content:
    def test_5_new_comparisons(self):
        c = _read(WEB / "src/lib/comparisons.ts")
        for slug in (
            "barcelona-vs-madrid-fin-de-semana",
            "ryanair-vs-easyjet-vs-vueling-low-cost-eu",
            "viaje-organizado-vs-por-libre-2026",
            "wizz-vs-ryanair-este-europa",
            "tarjeta-revolut-vs-curve-vs-wise-viajar",
        ):
            assert f'slug: "{slug}"' in c, f"falta comparativa {slug}"

    def test_3_new_blog_posts(self):
        for slug in (
            "barcelona-fin-de-semana-vuelos-baratos-2026",
            "calendario-cazador-error-fares-2026",
            "web-vitals-perf-mobile-2026",
        ):
            f = WEB / f"src/content/blog/{slug}.mdx"
            assert f.exists(), f"falta blog post {slug}"


# ════════════════════════════════════════════════
# WebVitalsReporter dual-write
# ════════════════════════════════════════════════


class TestSSS64WebVitalsReporterDualWrite:
    F = WEB / "src/components/WebVitalsReporter.tsx"

    def test_emits_to_api_web_vitals(self):
        c = _read(self.F)
        # SSS64: además de gtag, manda a /api/web-vitals
        assert "/api/web-vitals" in c
        assert "sendBeacon" in c
