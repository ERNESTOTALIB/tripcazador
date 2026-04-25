"""
tests/unit/test_sentry_grafana_og_tourist_20260425.py
=====================================================
Regresiones para abr-2026m (5 bloques nuevos):

  C1) Sentry release tracking + git_sha en backend + frontend
  C2) Grafana dashboard JSON versionado (estructura + paneles + métricas)
  C3) HunterHealthWidget con auto-refresh + semáforo
  C4) Blog OG image dinámico (ruta opengraph-image.tsx para ES y EN)
  C5) Schema.org TouristTrip + TouristDestination en /destinos/[slug]
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"
APP = WEB / "src" / "app"
COMP = WEB / "src" / "components"
API_MAIN = ROOT / "api" / "main.py"
DASHBOARDS = ROOT / "monitoring" / "dashboards"


def _read(p: Path) -> str:
    assert p.exists(), f"archivo no existe: {p}"
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════════════════════
# C1 — Sentry release tracking
# ════════════════════════════════════════════════════════════════


class TestSentryBackendRelease:
    def test_init_passes_release_with_sha(self):
        src = _read(API_MAIN)
        # Sentry init debe construir release con tripcazador-api@VERSION+SHA
        assert "tripcazador-api@" in src
        # SHA se calcula desde GIT_SHA env o api/GIT_SHA file
        assert "_gh_sha_for_sentry" in src
        # `release=` se pasa explícitamente
        idx = src.find("sentry_sdk.init")
        assert idx > 0
        window = src[idx : idx + 1500]
        assert "release=" in window

    def test_sets_global_git_sha_tag(self):
        src = _read(API_MAIN)
        assert 'sentry_sdk.set_tag("git_sha"' in src

    def test_dist_uses_hostname(self):
        src = _read(API_MAIN)
        idx = src.find("sentry_sdk.init")
        window = src[idx : idx + 1500]
        assert "dist=" in window
        assert 'os.getenv("HOSTNAME"' in window


class TestSentryFrontendRelease:
    def _client(self) -> str:
        return _read(WEB / "sentry.client.config.ts")

    def _server(self) -> str:
        return _read(WEB / "sentry.server.config.ts")

    def _edge(self) -> str:
        return _read(WEB / "sentry.edge.config.ts")

    def test_client_uses_release(self):
        src = self._client()
        assert "release" in src
        assert "tripcazador-web@" in src
        assert "NEXT_PUBLIC_GIT_SHA" in src

    def test_client_initial_scope_git_sha_tag(self):
        src = self._client()
        assert "initialScope" in src
        assert "git_sha" in src

    def test_server_uses_release(self):
        src = self._server()
        assert "tripcazador-web@" in src
        assert "GIT_SHA" in src

    def test_edge_uses_release(self):
        src = self._edge()
        assert "tripcazador-web@" in src
        assert "release" in src


# ════════════════════════════════════════════════════════════════
# C2 — Grafana dashboard JSON
# ════════════════════════════════════════════════════════════════


class TestGrafanaDashboard:
    DASHBOARD = DASHBOARDS / "tripcazador-overview.json"

    @pytest.fixture(scope="class")
    def dashboard(self):
        return json.loads(_read(self.DASHBOARD))

    def test_dashboard_file_exists(self):
        assert self.DASHBOARD.exists()
        assert (DASHBOARDS / "README.md").exists()

    def test_json_is_valid(self, dashboard):
        assert isinstance(dashboard, dict)
        assert "panels" in dashboard
        assert isinstance(dashboard["panels"], list)

    def test_uid_stable(self, dashboard):
        """UID estable permite enlazar desde Slack/Telegram sin romperse."""
        assert dashboard.get("uid") == "tripcazador-overview"

    def test_has_required_panels(self, dashboard):
        titles = {p.get("title") for p in dashboard["panels"]}
        for required in [
            "API uptime",
            "Cache hit ratio",
            "Active deals",
            "Deals file age",
            "Requests/s by endpoint (5m rate)",
            "Rate-limit rejections (rps)",
            "Cache ops/s (stacked)",
            "Deployed version",
        ]:
            assert required in titles, f"panel '{required}' faltante"

    def test_uses_prometheus_datasource_variable(self, dashboard):
        """Datasource debe ser variable, no hard-coded — para que importes
        el dashboard sin editar."""
        assert "templating" in dashboard
        names = [v["name"] for v in dashboard["templating"]["list"]]
        assert "DS_PROMETHEUS" in names

    def test_metrics_referenced_match_prometheus_endpoint(self, dashboard):
        """Las exprs deben referenciar nombres reales del endpoint."""
        all_exprs: list[str] = []
        for p in dashboard["panels"]:
            for t in p.get("targets", []):
                if "expr" in t:
                    all_exprs.append(t["expr"])
        joined = " ".join(all_exprs)
        for metric in [
            "tripcazador_uptime_seconds",
            "tripcazador_cache_hit_ratio",
            "tripcazador_deals_total",
            "tripcazador_deals_age_seconds",
            "tripcazador_requests_total",
            "tripcazador_rate_limit_rejections_total",
            "tripcazador_cache_hits_total",
            "tripcazador_app_version_info",
        ]:
            assert metric in joined, f"métrica no referenciada en dashboard: {metric}"

    def test_refresh_interval_set(self, dashboard):
        assert dashboard.get("refresh") in ("30s", "1m", "15s")

    def test_has_tag_production(self, dashboard):
        assert "tripcazador" in (dashboard.get("tags") or [])
        assert "production" in (dashboard.get("tags") or [])


# ════════════════════════════════════════════════════════════════
# C3 — HunterHealthWidget
# ════════════════════════════════════════════════════════════════


class TestHunterHealthWidget:
    P = COMP / "HunterHealthWidget.tsx"

    def test_component_exists(self):
        assert self.P.exists()

    def test_polls_health_endpoint(self):
        src = _read(self.P)
        assert "/api/health" in src
        assert "setInterval" in src
        assert "clearInterval" in src

    def test_uses_no_store_cache(self):
        """Real-time: no queremos respuestas cacheadas."""
        src = _read(self.P)
        assert 'cache: "no-store"' in src

    def test_classifies_by_age(self):
        """Función classify mapea minutos → label."""
        src = _read(self.P)
        assert "function classify" in src
        assert "fresh" in src
        assert "healthy" in src
        assert "stale" in src
        assert "degraded" in src

    def test_aria_live_status_badge(self):
        src = _read(self.P)
        assert 'role="status"' in src
        assert 'aria-live="polite"' in src

    def test_lists_open_breakers(self):
        src = _read(self.P)
        assert "openBreakers" in src
        assert "Circuit breakers abiertos" in src

    def test_default_refresh_30s(self):
        src = _read(self.P)
        assert "refreshSeconds = 30" in src or "refreshSeconds: 30" in src

    def test_mounted_in_admin_page(self):
        admin = _read(APP / "admin" / "page.tsx")
        assert "HunterHealthWidget" in admin
        assert "<HunterHealthWidget" in admin


# ════════════════════════════════════════════════════════════════
# C4 — OG image dinámico
# ════════════════════════════════════════════════════════════════


class TestBlogOgImage:
    ES_OG = APP / "blog" / "[slug]" / "opengraph-image.tsx"
    EN_OG = APP / "en" / "blog" / "[slug]" / "opengraph-image.tsx"

    def test_es_route_exists(self):
        assert self.ES_OG.exists()

    def test_en_route_exists(self):
        assert self.EN_OG.exists()

    def test_uses_image_response(self):
        for p in [self.ES_OG, self.EN_OG]:
            src = _read(p)
            assert 'from "next/og"' in src
            assert "ImageResponse" in src

    def test_runs_on_edge(self):
        for p in [self.ES_OG, self.EN_OG]:
            src = _read(p)
            assert 'export const runtime = "edge"' in src

    def test_size_1200x630(self):
        for p in [self.ES_OG, self.EN_OG]:
            src = _read(p)
            assert "width: 1200" in src
            assert "height: 630" in src

    def test_image_alt_present(self):
        for p in [self.ES_OG, self.EN_OG]:
            src = _read(p)
            assert "export const alt" in src

    def test_uses_post_metadata(self):
        for p in [self.ES_OG, self.EN_OG]:
            src = _read(p)
            assert "getPostBySlug" in src
            assert "post?.title" in src
            assert "post?.author" in src
            assert "post?.readingTime" in src

    def test_es_copy_in_spanish(self):
        src = _read(self.ES_OG)
        assert "min de lectura" in src
        assert "Escrito por" in src

    def test_en_copy_in_english(self):
        src = _read(self.EN_OG)
        assert "min read" in src
        assert "By" in src


# ════════════════════════════════════════════════════════════════
# C5 — Schema.org TouristTrip
# ════════════════════════════════════════════════════════════════


class TestTouristTripSchema:
    P = APP / "destinos" / "[slug]" / "page.tsx"

    def test_has_tourist_trip_schema(self):
        src = _read(self.P)
        assert '"@type": "TouristTrip"' in src

    def test_includes_itinerary_with_item_list(self):
        src = _read(self.P)
        assert "itinerary" in src
        assert '"@type": "ItemList"' in src
        assert "numberOfItems" in src

    def test_partOfTrip_back_to_destination(self):
        src = _read(self.P)
        assert "partOfTrip" in src

    def test_aggregate_offer_when_deals_exist(self):
        src = _read(self.P)
        assert '"@type": "AggregateOffer"' in src
        assert 'priceCurrency: "EUR"' in src
        assert "lowPrice" in src

    def test_provider_organization(self):
        src = _read(self.P)
        assert "provider:" in src
        # Organization TripCazador
        assert '"@type": "Organization"' in src

    def test_audience_european_hubs(self):
        src = _read(self.P)
        assert "audience" in src
        assert "European hubs" in src

    def test_tourist_destination_includes_attractions(self):
        src = _read(self.P)
        assert "includesAttraction" in src
        assert '"@type": "TouristAttraction"' in src

    def test_trip_days_heuristic_present(self):
        """Días de viaje calculados según distancia (long/med/short-haul)."""
        src = _read(self.P)
        assert "tripDays" in src
        assert "longHaulSlugs" in src
        assert "mediumHaulSlugs" in src

    def test_available_language_es_en(self):
        src = _read(self.P)
        assert 'availableLanguage' in src
        assert '"es"' in src
        assert '"en"' in src
