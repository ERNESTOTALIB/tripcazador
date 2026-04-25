"""
tests/unit/test_img_proxy_sw_ab_lighthouse_20260425.py
======================================================
Regresiones para abr-2026o (4 bloques + deploy script):

  E1) /api/img proxy con whitelist + cache 7d
  E2) Service Worker /public/sw.js + PWAInstallBanner (registro + dismiss)
  E3) lib/ab.ts framework + TelegramCtaAB component
  E4) Lighthouse CI workflow + lighthouserc.json thresholds
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
APP = WEB / "src" / "app"
COMP = WEB / "src" / "components"
LIB = WEB / "src" / "lib"
PUBLIC = WEB / "public"
WORKFLOWS = ROOT / ".github" / "workflows"


def _read(p: Path) -> str:
    assert p.exists(), f"archivo no existe: {p}"
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════════════════════
# E1 — Image proxy
# ════════════════════════════════════════════════════════════════


class TestImageProxy:
    P = APP / "api" / "img" / "route.ts"

    def test_route_exists(self):
        assert self.P.exists()

    def test_runs_on_edge(self):
        src = _read(self.P)
        assert 'export const runtime = "edge"' in src

    def test_has_host_whitelist(self):
        src = _read(self.P)
        assert "ALLOWED_HOSTS" in src
        assert "images.unsplash.com" in src

    def test_rejects_non_https(self):
        src = _read(self.P)
        assert 'target.protocol !== "https:"' in src

    def test_rejects_unknown_host(self):
        src = _read(self.P)
        assert "ALLOWED_HOSTS.has" in src

    def test_passes_w_q_hints(self):
        """Permite resize via unsplash params w/q sin abrir SSRF."""
        src = _read(self.P)
        assert 'target.searchParams.set("w"' in src
        assert 'target.searchParams.set("q"' in src

    def test_returns_image_only(self):
        """Verifica que upstream content-type empieza por image/."""
        src = _read(self.P)
        assert 'contentType.startsWith("image/")' in src

    def test_cache_7days(self):
        src = _read(self.P)
        assert "7 * 24 * 3600" in src
        assert "stale-while-revalidate" in src

    def test_no_cookie_forwarding(self):
        """User-Agent custom; NO se reenvían cookies/auth."""
        src = _read(self.P)
        assert "TripCazador-ImageProxy" in src


# ════════════════════════════════════════════════════════════════
# E2 — Service Worker + Install Banner
# ════════════════════════════════════════════════════════════════


class TestServiceWorker:
    SW = PUBLIC / "sw.js"

    def test_sw_exists(self):
        assert self.SW.exists()

    def test_versioned_caches(self):
        src = _read(self.SW)
        # VERSION + 3 caches separadas
        assert "const VERSION" in src
        assert "SHELL_CACHE" in src
        assert "RUNTIME_CACHE" in src
        assert "IMG_CACHE" in src

    def test_precache_shell(self):
        src = _read(self.SW)
        assert "PRECACHE_URLS" in src
        for url in ['"/"', '"/deals"', '"/destinos"']:
            assert url in src

    def test_excludes_admin_and_alerts(self):
        """Endpoints admin / price-alerts NUNCA se cachean."""
        src = _read(self.SW)
        assert "/api/admin" in src
        assert "/api/price-alerts" in src

    def test_strategies_present(self):
        src = _read(self.SW)
        assert "networkFirstWithTimeout" in src
        assert "cacheFirst" in src
        assert "staleWhileRevalidate" in src

    def test_image_cache_lru_cap(self):
        src = _read(self.SW)
        assert "IMG_CACHE_LIMIT" in src
        assert "trimCache" in src

    def test_skip_waiting_message(self):
        """App puede activar nueva versión sin reload manual."""
        src = _read(self.SW)
        assert "SKIP_WAITING" in src


class TestPWAInstallBanner:
    P = COMP / "PWAInstallBanner.tsx"

    def test_component_exists(self):
        assert self.P.exists()

    def test_registers_service_worker(self):
        src = _read(self.P)
        # Permitimos line-break entre `serviceWorker` y `.register(...)`
        assert "navigator.serviceWorker" in src
        assert '.register("/sw.js")' in src
        # Sólo en producción para no poluir dev tools
        assert 'process.env.NODE_ENV === "production"' in src

    def test_listens_beforeinstallprompt(self):
        src = _read(self.P)
        assert "beforeinstallprompt" in src
        assert "preventDefault" in src

    def test_30s_delay(self):
        """No agresivo en el primer pageload."""
        src = _read(self.P)
        assert "30000" in src

    def test_dismiss_persists_30days(self):
        src = _read(self.P)
        assert "DISMISS_DAYS = 30" in src
        assert "cv_pwa_dismissed_at" in src

    def test_ios_hint_branch(self):
        src = _read(self.P)
        assert "isIos" in src
        assert "Añadir a la pantalla de inicio" in src

    def test_standalone_check(self):
        """No mostrar banner si la app ya está instalada."""
        src = _read(self.P)
        assert "isStandalone" in src
        assert "display-mode: standalone" in src

    def test_aria_dialog(self):
        src = _read(self.P)
        assert 'role="dialog"' in src

    def test_mounted_in_layout(self):
        src = _read(APP / "layout.tsx")
        assert "PWAInstallBanner" in src
        assert "<PWAInstallBanner" in src


# ════════════════════════════════════════════════════════════════
# E3 — A/B testing
# ════════════════════════════════════════════════════════════════


class TestAbFramework:
    P = LIB / "ab.ts"

    def test_lib_exists(self):
        assert self.P.exists()

    def test_has_visitor_id_via_localstorage(self):
        src = _read(self.P)
        assert "cv_visitor_id" in src
        assert "crypto.randomUUID" in src

    def test_consent_aware(self):
        """Sin consent → defaultVariant, no se asigna."""
        src = _read(self.P)
        assert "consentGranted" in src
        assert "cv_consent_v1" in src

    def test_deterministic_hash(self):
        """fnv1a hash → mismo visitor = misma variante siempre."""
        src = _read(self.P)
        assert "fnv1a" in src
        assert "0x811c9dc5" in src

    def test_emits_exposure_event(self):
        src = _read(self.P)
        assert "experiment_exposure" in src
        assert "trackExposure" in src

    def test_track_conversion_helper(self):
        src = _read(self.P)
        assert "trackConversion" in src
        assert "experiment_conversion" in src

    def test_experiments_registry(self):
        src = _read(self.P)
        assert "EXPERIMENTS" in src
        assert "telegram_cta_v2" in src

    def test_session_dedup_exposures(self):
        """Una exposición por sesión por experimento."""
        src = _read(self.P)
        assert "sessionStorage" in src
        assert "cv_ab_exposed" in src


class TestTelegramCtaAB:
    P = COMP / "TelegramCtaAB.tsx"

    def test_component_exists(self):
        assert self.P.exists()

    def test_uses_getVariant(self):
        src = _read(self.P)
        assert "getVariant" in src
        assert '"telegram_cta_v2"' in src

    def test_two_labels(self):
        """A: control, B: variante."""
        src = _read(self.P)
        assert "Únete al canal de Telegram" in src
        assert "Recibir alertas en Telegram" in src

    def test_tracks_conversion_on_click(self):
        src = _read(self.P)
        assert "trackConversion" in src

    def test_hydration_safe_default(self):
        """Antes de hydratar muestra control para evitar flash."""
        src = _read(self.P)
        assert "hydrated" in src

    def test_force_variant_for_tests(self):
        """Permite forzar variante para pruebas o secciones excluidas."""
        src = _read(self.P)
        assert "forceVariant" in src


# ════════════════════════════════════════════════════════════════
# E4 — Lighthouse CI
# ════════════════════════════════════════════════════════════════


class TestLighthouseCi:
    WF = WORKFLOWS / "lighthouse.yml"
    RC = WORKFLOWS / "lighthouserc.json"

    def test_workflow_exists(self):
        assert self.WF.exists()

    def test_lighthouserc_exists(self):
        assert self.RC.exists()

    def test_waits_for_vercel_preview(self):
        src = _read(self.WF)
        assert "wait-for-vercel-preview" in src

    def test_runs_lhci_action(self):
        src = _read(self.WF)
        assert "treosh/lighthouse-ci-action" in src

    def test_audits_key_pages(self):
        src = _read(self.WF)
        for path in ["/", "/deals", "/blog", "/destinos/japon"]:
            assert path in src

    @pytest.fixture(scope="class")
    def rc(self):
        return json.loads(_read(self.RC))

    def test_thresholds_strict_perf(self, rc):
        assertions = rc["ci"]["assert"]["assertions"]
        perf = assertions["categories:performance"]
        assert perf[0] == "error"
        assert perf[1]["minScore"] >= 0.85

    def test_thresholds_a11y_aaa(self, rc):
        assertions = rc["ci"]["assert"]["assertions"]
        a11y = assertions["categories:accessibility"]
        assert a11y[0] == "error"
        assert a11y[1]["minScore"] >= 0.95

    def test_lcp_under_2500ms(self, rc):
        assertions = rc["ci"]["assert"]["assertions"]
        lcp = assertions["largest-contentful-paint"]
        assert lcp[0] == "error"
        assert lcp[1]["maxNumericValue"] <= 2500

    def test_cls_under_0_1(self, rc):
        assertions = rc["ci"]["assert"]["assertions"]
        cls = assertions["cumulative-layout-shift"]
        assert cls[0] == "error"
        assert cls[1]["maxNumericValue"] <= 0.1

    def test_3_runs_for_stability(self, rc):
        """3 runs y se toma la mediana — reduce flakiness."""
        assert rc["ci"]["collect"]["numberOfRuns"] == 3
