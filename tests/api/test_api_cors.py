"""
API tests: CORS — permite tripcazador.com y localhost, no otros dominios.
"""
from __future__ import annotations

import pytest


class TestCORSAllowedOrigins:
    def test_tripcazador_production_allowed(self, api_client):
        r = api_client.get(
            "/api/health",
            headers={"Origin": "https://tripcazador.com"},
        )
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == "https://tripcazador.com"

    def test_tripcazador_www_allowed(self, api_client):
        r = api_client.get(
            "/api/health",
            headers={"Origin": "https://www.tripcazador.com"},
        )
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == "https://www.tripcazador.com"

    def test_localhost_dev_allowed(self, api_client):
        r = api_client.get(
            "/api/health",
            headers={"Origin": "http://localhost:3000"},
        )
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"


class TestCORSBlockedOrigins:
    def test_malicious_origin_no_cors_header(self, api_client):
        r = api_client.get(
            "/api/health",
            headers={"Origin": "https://evil.example.com"},
        )
        # Endpoint responde pero sin CORS header para ese origen
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") != "https://evil.example.com"

    def test_http_without_origin(self, api_client):
        # Sin header Origin no deberia haber ACAO header
        r = api_client.get("/api/health")
        assert r.status_code == 200


class TestCORSPreflight:
    def test_options_preflight_allows_get(self, api_client):
        r = api_client.options(
            "/api/deals",
            headers={
                "Origin": "https://tripcazador.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Preflight debe responder 200 con los headers CORS
        assert r.status_code in (200, 204)
        allow_methods = r.headers.get("access-control-allow-methods", "")
        assert "GET" in allow_methods

    def test_post_allowed_for_subscribe(self, api_client):
        # POST se habilita porque /api/subscribe acepta envio de newsletter.
        # Metodos destructivos (PUT/DELETE/PATCH) siguen sin permitirse.
        r = api_client.options(
            "/api/subscribe",
            headers={
                "Origin": "https://tripcazador.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert r.status_code in (200, 204)
        allow_methods = r.headers.get("access-control-allow-methods", "")
        assert "POST" in allow_methods
        # Los verbos destructivos no deben estar permitidos
        for forbidden in ("DELETE", "PUT", "PATCH"):
            assert forbidden not in allow_methods, (
                f"{forbidden} no deberia estar permitido via CORS"
            )
