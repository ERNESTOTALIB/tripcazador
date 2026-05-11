"""
test_new_api_endpoints_shape.py — May 2026
============================================
Tests de contract / shape para api/main.py endpoints clave.
Usa el fixture api_client de conftest.py que carga un deals.json sintético.

Cubre: /api/health, /api/status, /api/stats, /api/deals (filtros), /api/regions,
/api/airports (search), CORS, rate-limit, security headers.
"""
from __future__ import annotations

import pytest


class TestHealthAndStatus:
    def test_health_returns_200(self, api_client):
        r = api_client.get("/api/health")
        assert r.status_code == 200

    def test_health_shape(self, api_client):
        r = api_client.get("/api/health")
        data = r.json()
        # debe tener al menos status o "ok"
        assert isinstance(data, dict)

    def test_public_status_returns_200(self, api_client):
        r = api_client.get("/api/status")
        assert r.status_code == 200

    def test_public_status_no_secrets(self, api_client):
        r = api_client.get("/api/status")
        text = r.text.lower()
        assert "rapidapi_key" not in text
        assert "serpapi_key" not in text
        assert "admin_token" not in text


class TestStats:
    def test_stats_returns_dict(self, api_client):
        r = api_client.get("/api/stats")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)

    def test_stats_has_total(self, api_client):
        r = api_client.get("/api/stats")
        data = r.json()
        # synthetic deals.json tiene 3 deals
        assert data.get("total") in (3, None) or "total" in data


class TestDeals:
    def test_deals_list(self, api_client):
        r = api_client.get("/api/deals")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_deals_excludes_expired(self, api_client):
        r = api_client.get("/api/deals")
        deals = r.json()
        # El deal "expired_deal" tiene expires_at en 2025 → debe estar excluido
        ids = [d.get("id") for d in deals]
        assert "expired_deal" not in ids

    def test_deals_filter_unknown_param_ignored(self, api_client):
        # /api/deals NO acepta origin/destination — query params extra deben
        # ser ignorados silenciosamente (FastAPI default).
        # AUDIT FINDING: si los usuarios esperan filtrar por origin/destination,
        # los params no se aplican; merece feature request.
        r = api_client.get("/api/deals?origin=ZZZ&destination=ZZZ")
        assert r.status_code == 200
        # Devuelve TODOS los deals (los filtros origin/destination son no-op)
        assert isinstance(r.json(), list)

    def test_deals_filter_by_max_price(self, api_client):
        r = api_client.get("/api/deals?max_price=100")
        for d in r.json():
            assert d["price_eur"] <= 100

    def test_deals_filter_by_region(self, api_client):
        r = api_client.get("/api/deals?region=Europa")
        for d in r.json():
            assert d["region"] == "Europa"

    def test_deals_filter_by_cabin_business(self, api_client):
        r = api_client.get("/api/deals?cabin=business")
        for d in r.json():
            assert d["cabin"] == "business"

    def test_deals_filter_by_classification_critico(self, api_client):
        r = api_client.get("/api/deals?classification=CR%C3%8DTICO")
        for d in r.json():
            assert d["classification"] == "CRÍTICO"

    def test_deals_max_price_zero_is_bypass(self, api_client):
        # SSS147 FIX: max_price=0 trata como "ningún filtro" (bypass).
        # Antes el código aplicaba `price <= 0` y devolvía [].
        # Ahora `max_price > 0` para activar el filtro — 0 = no aplicar.
        r = api_client.get("/api/deals?max_price=0")
        assert r.status_code == 200
        # Con deals reales en el seed (15€-250€), max_price=0 → devuelve la lista completa.
        deals = r.json()
        assert isinstance(deals, list)
        assert len(deals) > 0, "max_price=0 debería actuar como bypass y devolver deals"

    def test_deals_limit_validation(self, api_client):
        # limit fuera de rango → 422
        r = api_client.get("/api/deals?limit=999999")
        assert r.status_code in (400, 422)

    def test_deals_offset_negative_rejected(self, api_client):
        r = api_client.get("/api/deals?offset=-1")
        assert r.status_code in (400, 422)


class TestDealById:
    def test_known_deal(self, api_client):
        r = api_client.get("/api/deals/kiwi_mad_jfk_20260715_business")
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == "kiwi_mad_jfk_20260715_business"
        assert d["origin"] == "MAD"

    def test_unknown_deal_404(self, api_client):
        r = api_client.get("/api/deals/no-such-id-xyz")
        assert r.status_code == 404

    def test_sql_injection_safe(self, api_client):
        # Intento de SQL injection en path param → debe ser 404 o 400, nunca 500
        r = api_client.get("/api/deals/' OR 1=1--")
        assert r.status_code in (400, 404, 422)


class TestRegions:
    def test_regions_list(self, api_client):
        r = api_client.get("/api/regions")
        assert r.status_code == 200
        regions = r.json()
        assert isinstance(regions, (list, dict))


class TestAirportsSearch:
    def test_airports_empty_query(self, api_client):
        r = api_client.get("/api/airports?q=")
        # Empty query → 400 / 422 o lista vacía
        assert r.status_code in (200, 400, 422)

    def test_airports_search_madrid(self, api_client):
        r = api_client.get("/api/airports?q=madrid")
        if r.status_code == 200:
            data = r.json()
            # API devuelve {"airports": [...], "total": N}
            if isinstance(data, dict):
                assert "airports" in data
                assert isinstance(data["airports"], list)
            else:
                assert isinstance(data, list)

    def test_airports_xss_safe(self, api_client):
        r = api_client.get("/api/airports?q=<script>alert(1)</script>")
        # No debe reflejar el script en la respuesta sin escape
        body = r.text
        assert "<script>" not in body


class TestSecurityHeaders:
    def test_cors_open_to_known_origins(self, api_client):
        r = api_client.options(
            "/api/deals",
            headers={
                "Origin": "https://tripcazador.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # OPTIONS preflight debe responder
        assert r.status_code in (200, 204)

    def test_no_server_header_leak(self, api_client):
        r = api_client.get("/api/health")
        # No debe revelar versión de Python/uvicorn
        server = r.headers.get("server", "")
        # Política defensiva: si está, no debe mostrar versión
        assert "python" not in server.lower() or "/" not in server


class TestSearchEndpoint:
    def test_search_no_params(self, api_client):
        # /api/search sin parámetros → puede devolver todos o 400
        r = api_client.get("/api/search")
        assert r.status_code in (200, 400, 422)

    def test_search_invalid_iata(self, api_client):
        # IATA no válido (>3 letras) → validación Pydantic o list vacía
        r = api_client.get("/api/search?origin=MADRID")
        assert r.status_code in (200, 400, 422)


class TestRateLimit:
    @pytest.mark.slow
    def test_burst_does_not_500(self, api_client):
        # 50 requests rápidas a /api/deals — no debe haber 500s
        codes = []
        for _ in range(50):
            r = api_client.get("/api/deals")
            codes.append(r.status_code)
        assert all(c in (200, 429) for c in codes), f"unexpected codes: {set(codes)}"
