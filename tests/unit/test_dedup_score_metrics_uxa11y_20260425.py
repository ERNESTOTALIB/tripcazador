"""
tests/unit/test_dedup_score_metrics_uxa11y_20260425.py
======================================================
Regresiones para abr-2026l (4 bloques + UX + a11y):

  A1) Hunter: dedup_close_prices, score_breakdown, by_engine en stats
  A2) Observability: /api/metrics/prometheus endpoint, WebVitalsReporter
  A3) UX: SocialProofStrip, DealCardSkeleton, StickyHeader
  A4) A11y: contrast bump (.bg-gray-900 .text-gray-400 → gray-300),
            text-wrap balance H1/H2, aria-live vacío oculto
"""
from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "flight_hunter_v4"
WEB = ROOT / "tripcazador-web"
APP = WEB / "src" / "app"
COMP = WEB / "src" / "components"
API_MAIN = ROOT / "api" / "main.py"

if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))


def _read(p: Path) -> str:
    assert p.exists(), f"archivo no existe: {p}"
    return p.read_text(encoding="utf-8")


def _reload_exporter():
    import deals_exporter  # type: ignore
    importlib.reload(deals_exporter)
    return deals_exporter


# ════════════════════════════════════════════════════════════════
# A1 — Hunter: dedup ±1€, score breakdown, by_engine
# ════════════════════════════════════════════════════════════════


class TestDedupClosePrices:
    def test_function_exists(self):
        ex = _reload_exporter()
        assert hasattr(ex, "dedup_close_prices")

    def test_returns_tuple_with_stats(self):
        ex = _reload_exporter()
        result = ex.dedup_close_prices([])
        assert isinstance(result, tuple) and len(result) == 2
        deduped, stats = result
        assert deduped == []
        assert stats == {}

    def test_collapses_within_tolerance(self):
        """Dos vuelos idénticos con ±0.50€ deben colapsar."""
        ex = _reload_exporter()
        flights = [
            {"origin": "MAD", "destination": "HAV", "date_out": "2026-08-15",
             "cabin": "business", "airline": "iberia", "price_eur": 450.0,
             "source": "rapidapi"},
            {"origin": "MAD", "destination": "HAV", "date_out": "2026-08-15",
             "cabin": "business", "airline": "iberia", "price_eur": 450.50,
             "source": "amadeus"},
        ]
        deduped, stats = ex.dedup_close_prices(flights, tolerance_eur=1.0)
        assert len(deduped) == 1
        # El más barato gana
        assert deduped[0]["price_eur"] == 450.0
        # Stats: 1 drop atribuido a 'amadeus'
        assert stats.get("amadeus") == 1

    def test_keeps_genuinely_different_prices(self):
        """Diferencia > tolerancia → ambos se preservan."""
        ex = _reload_exporter()
        flights = [
            {"origin": "MAD", "destination": "HAV", "date_out": "2026-08-15",
             "cabin": "economy", "airline": "iberia", "price_eur": 300.0,
             "source": "a"},
            {"origin": "MAD", "destination": "HAV", "date_out": "2026-08-15",
             "cabin": "economy", "airline": "iberia", "price_eur": 305.0,
             "source": "b"},
        ]
        deduped, stats = ex.dedup_close_prices(flights, tolerance_eur=1.0)
        assert len(deduped) == 2
        assert stats == {}

    def test_different_airlines_not_collapsed(self):
        """Misma ruta+fecha pero distinta aerolínea NO debe colapsar."""
        ex = _reload_exporter()
        flights = [
            {"origin": "MAD", "destination": "HAV", "date_out": "2026-08-15",
             "cabin": "economy", "airline": "iberia", "price_eur": 300.0, "source": "a"},
            {"origin": "MAD", "destination": "HAV", "date_out": "2026-08-15",
             "cabin": "economy", "airline": "air europa", "price_eur": 300.20, "source": "b"},
        ]
        deduped, _ = ex.dedup_close_prices(flights, tolerance_eur=1.0)
        assert len(deduped) == 2

    def test_three_close_collapse_to_one(self):
        ex = _reload_exporter()
        flights = [
            {"origin": "X", "destination": "Y", "date_out": "2026-09-01",
             "cabin": "economy", "airline": "z", "price_eur": 200.0, "source": "a"},
            {"origin": "X", "destination": "Y", "date_out": "2026-09-01",
             "cabin": "economy", "airline": "z", "price_eur": 200.50, "source": "b"},
            {"origin": "X", "destination": "Y", "date_out": "2026-09-01",
             "cabin": "economy", "airline": "z", "price_eur": 200.80, "source": "c"},
        ]
        deduped, stats = ex.dedup_close_prices(flights, tolerance_eur=1.0)
        assert len(deduped) == 1
        # 2 drops totales — uno por b y otro por c
        assert sum(stats.values()) == 2


class TestScoreBreakdown:
    def test_function_exists(self):
        ex = _reload_exporter()
        assert hasattr(ex, "score_breakdown")

    def test_returns_dict_with_components(self):
        ex = _reload_exporter()
        bd = ex.score_breakdown({"final_score": 60})
        assert "base" in bd
        assert "seasonal_bonus" in bd
        assert "holiday_bonus" in bd
        assert "verified_bonus" in bd
        assert "lowcost_penalty" in bd
        assert "total" in bd
        assert bd["total"] == 60.0

    def test_seasonal_tag_adds_bonus(self):
        ex = _reload_exporter()
        bd = ex.score_breakdown(
            {"final_score": 60, "t0_reason": "Precio 350€ [ajuste estacional Caribe/mes-2]"},
        )
        assert bd["seasonal_bonus"] > 0

    def test_holiday_tag_adds_bonus(self):
        ex = _reload_exporter()
        bd = ex.score_breakdown(
            {"final_score": 60, "t0_reason": "Precio 350€ [festivo: Semana Santa]"},
        )
        assert bd["holiday_bonus"] > 0

    def test_verified_adds_15pct(self):
        ex = _reload_exporter()
        bd = ex.score_breakdown({"final_score": 80, "verified": True})
        # 15% del score total → ~10.4 (80 * 0.15 / 1.15)
        assert 9.0 <= bd["verified_bonus"] <= 11.0

    def test_lowcost_penalty(self):
        ex = _reload_exporter()
        bd = ex.score_breakdown({"final_score": 50, "is_lowcost": True})
        assert bd["lowcost_penalty"] == -10.0


class TestBuildUnifiedDealsByEngine:
    def test_stats_includes_by_engine(self):
        ex = _reload_exporter()
        flights = [
            {"final_score": 50, "price_eur": 200, "destination": "HAV",
             "date_out": "2026-08-01", "origin": "MAD", "cabin": "economy",
             "airline": "iberia", "sources": ["rapidapi"], "verified": False},
        ]
        obj = ex.build_unified_deals(flights, [])
        assert "by_engine" in obj["stats"]
        assert "engine_dedup_drops" in obj["stats"]
        assert obj["stats"]["by_engine"].get("rapidapi") == 1


# ════════════════════════════════════════════════════════════════
# A2 — Observability: /api/metrics/prometheus + WebVitalsReporter
# ════════════════════════════════════════════════════════════════


class TestPrometheusEndpoint:
    def _src(self) -> str:
        return _read(API_MAIN)

    def test_endpoint_route_present(self):
        assert '@app.get("/api/metrics/prometheus")' in self._src()

    def test_returns_prometheus_media_type(self):
        src = self._src()
        idx = src.index("/api/metrics/prometheus")
        window = src[idx : idx + 4000]
        assert 'text/plain; version=0.0.4' in window

    def test_emits_required_metrics(self):
        src = self._src()
        for metric in [
            "tripcazador_uptime_seconds",
            "tripcazador_cache_hits_total",
            "tripcazador_cache_hit_ratio",
            "tripcazador_requests_total",
            "tripcazador_rate_limit_rejections_total",
            "tripcazador_deals_total",
            "tripcazador_deals_age_seconds",
            "tripcazador_app_version_info",
        ]:
            assert metric in src, f"métrica faltante: {metric}"

    def test_gates_in_production(self):
        src = self._src()
        idx = src.index("metrics_prometheus")
        window = src[idx : idx + 1500]
        assert "_IS_PRODUCTION" in window
        assert "EXPOSE_METRICS" in window

    def test_has_help_and_type_lines(self):
        src = self._src()
        # Prometheus exposition format requiere `# HELP` y `# TYPE`
        assert "# HELP" in src
        assert "# TYPE" in src

    def test_imports_response(self):
        src = self._src()
        assert "Response" in src
        # Importado desde fastapi.responses
        assert "from fastapi.responses import" in src


class TestWebVitalsReporter:
    P = COMP / "WebVitalsReporter.tsx"

    def test_component_file_exists(self):
        assert self.P.exists()

    def test_uses_next_web_vitals_hook(self):
        src = _read(self.P)
        assert 'from "next/web-vitals"' in src
        assert "useReportWebVitals" in src

    def test_consent_aware(self):
        """Sólo manda eventos si el banner concedió analytics."""
        src = _read(self.P)
        assert "consentGranted" in src
        assert "cv_consent_v1" in src

    def test_sends_to_gtag(self):
        src = _read(self.P)
        assert "window.gtag" in src
        assert "web_vitals" in src

    def test_cls_scaled_to_thousand(self):
        """CLS llega 0..1, GA4 espera entero — *1000."""
        src = _read(self.P)
        assert "CLS" in src
        assert "1000" in src

    def test_strips_query_string_from_path(self):
        """Privacy: page_path usa pathname (sin search params)."""
        src = _read(self.P)
        assert "window.location.pathname" in src

    def test_mounted_in_root_layout(self):
        src = _read(APP / "layout.tsx")
        assert "WebVitalsReporter" in src
        assert "<WebVitalsReporter" in src


# ════════════════════════════════════════════════════════════════
# A3 — UX: SocialProofStrip, DealCardSkeleton, StickyHeader
# ════════════════════════════════════════════════════════════════


class TestSocialProofStrip:
    P = COMP / "SocialProofStrip.tsx"

    def test_component_exists(self):
        assert self.P.exists()

    def test_uses_real_api_not_mock(self):
        src = _read(self.P)
        assert "getDeals" in src
        assert "stats?.total" in src or "stats?.price_min" in src

    def test_aria_live_polite(self):
        src = _read(self.P)
        assert 'aria-live="polite"' in src
        assert 'role="status"' in src

    def test_graceful_degrade(self):
        """Si la API falla, devuelve null sin romper layout."""
        src = _read(self.P)
        assert "return null" in src

    def test_relative_time_formatter(self):
        src = _read(self.P)
        assert "formatRelativeMinutes" in src
        # Debe manejar mins / horas / días
        assert "min" in src
        assert "h`" in src or '"h"' in src
        assert "d`" in src or '"d"' in src


class TestDealCardSkeleton:
    P = COMP / "DealCardSkeleton.tsx"

    def test_component_exists(self):
        assert self.P.exists()

    def test_aria_busy_status(self):
        src = _read(self.P)
        assert 'role="status"' in src
        assert 'aria-busy="true"' in src
        assert "sr-only" in src

    def test_animate_pulse(self):
        src = _read(self.P)
        assert "animate-pulse" in src

    def test_list_helper_exposed(self):
        src = _read(self.P)
        assert "DealCardSkeletonList" in src
        # Default count razonable
        assert "count = 6" in src or "count: 6" in src


class TestStickyHeader:
    P = COMP / "StickyHeader.tsx"

    def test_client_component(self):
        src = _read(self.P)
        assert src.startswith('"use client";') or "'use client'" in src.splitlines()[0]

    def test_uses_intersection_observer(self):
        src = _read(self.P)
        assert "IntersectionObserver" in src
        # Sentinel pattern (no scroll listener)
        assert "sentinelRef" in src

    def test_default_top_under_navbar(self):
        src = _read(self.P)
        assert 'top-14' in src

    def test_z_below_modal(self):
        """sticky z=40 < modal z=50."""
        src = _read(self.P)
        assert 'z-40' in src

    def test_only_styles_when_stuck(self):
        """Sombra/blur sólo cuando está pegado, no siempre."""
        src = _read(self.P)
        assert "stuck" in src
        assert "backdrop-blur" in src


# ════════════════════════════════════════════════════════════════
# A4 — A11y AAA: contrast bump + text-wrap balance + aria-live
# ════════════════════════════════════════════════════════════════


class TestA11yContrastAaa:
    GLOBALS = APP / "globals.css"

    def test_overrides_text_gray_400_inside_dark_surfaces(self):
        src = _read(self.GLOBALS)
        # Selectores específicos para subir contraste
        assert ".bg-gray-900 .text-gray-400" in src
        assert ".bg-gray-950 .text-gray-400" in src
        # Color de overide → gray-300 (#d1d5db)
        assert "#d1d5db" in src

    def test_meta_aaa_utility_class(self):
        src = _read(self.GLOBALS)
        assert ".t-meta-aaa" in src

    def test_text_wrap_balance_on_headings(self):
        src = _read(self.GLOBALS)
        assert "text-wrap: balance" in src

    def test_empty_aria_live_visually_hidden(self):
        src = _read(self.GLOBALS)
        assert '[aria-live="polite"]:empty' in src
        # CSS sr-only pattern (clip rect / width 1px)
        assert "clip:" in src
        assert "width: 1px" in src
