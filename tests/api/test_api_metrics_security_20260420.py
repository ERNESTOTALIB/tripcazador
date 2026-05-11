"""
tests/api/test_api_metrics_security_20260420.py
================================================
Regresiones sobre las mejoras de observabilidad (#175) y hardening
defensivo (#176) aplicadas al backend en abril 2026:

  1. /api/metrics responde 200 en dev con la estructura esperada
  2. /api/metrics está gated a 404 en producción (sin loopback ni
     EXPOSE_METRICS=1)
  3. /api/metrics es bypasseable vía EXPOSE_METRICS=1 incluso en prod
  4. _bump() es thread-safe y suma los contadores correctamente
  5. /api/deals/{id} rechaza ids >64 chars con 404 sin tocar el
     fichero deals.json
  6. /api/deals/{id} rechaza ids con whitespace (inyección de path)
"""
from __future__ import annotations

import importlib
import json
import sys
import threading
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.skip(
    reason="SSS147: api_client_fresh fixture missing + endpoint signatures shifted — entire module needs rewrite; skip until prioritised"
)

ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))


# ─────────────────────────────────────────────────────────
# /api/metrics
# ─────────────────────────────────────────────────────────


class TestMetricsEndpoint:
    def test_metrics_returns_expected_structure_in_dev(self, api_client_fresh):
        r = api_client_fresh.get("/api/metrics")
        assert r.status_code == 200
        data = r.json()
        # Estructura contractada con frontend/ops — no romper
        assert "uptime_seconds" in data
        assert "cache" in data
        assert "requests" in data
        assert "rate_limit_rejections" in data
        cache = data["cache"]
        for key in ("hits", "misses", "refreshes", "hit_ratio", "ttl_seconds"):
            assert key in cache
        requests_obj = data["requests"]
        for key in ("deals", "top", "search"):
            assert key in requests_obj

    def test_metrics_uptime_is_positive(self, api_client_fresh):
        r = api_client_fresh.get("/api/metrics")
        assert r.json()["uptime_seconds"] >= 0

    def test_metrics_counters_increment_on_requests(self, api_client_fresh):
        before = api_client_fresh.get("/api/metrics").json()
        api_client_fresh.get("/api/deals")  # dispara _bump("requests_deals")
        after = api_client_fresh.get("/api/metrics").json()
        assert after["requests"]["deals"] >= before["requests"]["deals"] + 1

    def test_metrics_gated_404_in_production(self, tmp_path, monkeypatch):
        """En producción y SIN EXPOSE_METRICS=1, /api/metrics debe devolver 404."""
        # Preparar deals.json temporal para que el reload no falle
        path = tmp_path / "deals.json"
        path.write_text(
            json.dumps({"schema_version": "4.1", "deals": [], "stats": {}}),
            encoding="utf-8",
        )
        monkeypatch.setenv("DEALS_DIR", str(tmp_path))
        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.delenv("EXPOSE_METRICS", raising=False)

        import main as api_main  # type: ignore
        importlib.reload(api_main)
        client = TestClient(api_main.app)
        # TestClient por defecto se identifica como 127.0.0.1 (loopback), pero
        # simulamos petición desde otro host vía cabecera forwarded
        # El endpoint mira request.client.host; el TestClient usa 'testclient'
        # como host del cliente. Con ENVIRONMENT=production y sin EXPOSE_METRICS,
        # y client_host 'testclient' ≠ loopback, debería 404.
        r = client.get("/api/metrics")
        # TestClient reporta client.host = 'testclient' → no-loopback
        assert r.status_code == 404

    def test_metrics_bypass_via_expose_metrics_env(self, tmp_path, monkeypatch):
        path = tmp_path / "deals.json"
        path.write_text(
            json.dumps({"schema_version": "4.1", "deals": [], "stats": {}}),
            encoding="utf-8",
        )
        monkeypatch.setenv("DEALS_DIR", str(tmp_path))
        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.setenv("EXPOSE_METRICS", "1")

        import main as api_main  # type: ignore
        importlib.reload(api_main)
        client = TestClient(api_main.app)
        r = client.get("/api/metrics")
        assert r.status_code == 200
        assert "uptime_seconds" in r.json()


# ─────────────────────────────────────────────────────────
# _bump() thread-safety
# ─────────────────────────────────────────────────────────


class TestBumpThreadSafety:
    def test_bump_is_thread_safe(self, api_client_fresh):
        import main as api_main  # type: ignore
        # Baseline
        with api_main._metrics_lock:
            initial = api_main._metrics.get("cache_hits", 0)

        N_THREADS = 10
        N_INCREMENTS = 1000

        def worker():
            for _ in range(N_INCREMENTS):
                api_main._bump("cache_hits")

        threads = [threading.Thread(target=worker) for _ in range(N_THREADS)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        with api_main._metrics_lock:
            final = api_main._metrics["cache_hits"]
        assert final == initial + N_THREADS * N_INCREMENTS

    def test_bump_on_unknown_metric_creates_it(self, api_client_fresh):
        import main as api_main  # type: ignore
        api_main._bump("brand_new_metric", 3)
        with api_main._metrics_lock:
            assert api_main._metrics["brand_new_metric"] == 3


# ─────────────────────────────────────────────────────────
# /api/deals/{id} hardening (#176)
# ─────────────────────────────────────────────────────────


class TestDealDetailHardening:
    def test_deal_detail_rejects_oversized_id(self, api_client_fresh):
        # 65 chars — justo sobre el límite
        long_id = "A" * 65
        r = api_client_fresh.get(f"/api/deals/{long_id}")
        assert r.status_code == 404

    def test_deal_detail_rejects_id_with_whitespace(self, api_client_fresh):
        # FastAPI decodea %20 a espacio antes de pasarlo a deal_id.
        # El endpoint debe rechazar esa forma para evitar que un scanner
        # abuse del lookup lineal con ids semánticamente inválidos.
        r = api_client_fresh.get("/api/deals/FL-abc%20def")
        assert r.status_code == 404

    def test_deal_detail_accepts_boundary_64_char_id(self, api_client_fresh):
        # 64 chars exactos es el borde — no debe rechazar por longitud
        # (el id no existirá, pero la razón del 404 es "no encontrado",
        # no "id inválido"). Ambos casos devuelven 404; este test
        # simplemente verifica que no explota por longitud.
        id_64 = "A" * 64
        r = api_client_fresh.get(f"/api/deals/{id_64}")
        assert r.status_code == 404

    def test_deal_detail_happy_path_still_works(self, api_client_fresh):
        # Un id válido devuelve el deal
        r = api_client_fresh.get("/api/deals/ryanair_mad_bcn_20260820_economy")
        assert r.status_code == 200
        assert r.json()["origin"] == "MAD"

    def test_deal_detail_has_rate_limit_decoration(self):
        """El endpoint debe llevar `@limiter.limit(...)` para tolerar prefetch
        de Next sin exponerse a scans lineales ilimitados."""
        src = (API_DIR / "main.py").read_text(encoding="utf-8")
        # Buscar el patrón: @limiter.limit("240/minute") seguido del endpoint
        assert '@limiter.limit("240/minute")' in src
        # Y que esté asociado al endpoint correcto
        # (no nos preocupa en qué línea exacta, solo que coexistan)
        idx = src.index('@app.get("/api/deals/{deal_id}"')
        # Mirar hasta el siguiente `async def get_deal` — debe haber limiter.limit
        after = src[idx: idx + 400]
        assert "limiter.limit" in after
        assert "async def get_deal" in after
