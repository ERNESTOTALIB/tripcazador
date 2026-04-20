"""
API tests: cache en memoria (5 min) funciona.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest


class TestInMemoryCache:
    def test_cache_populated_after_first_call(self, api_client):
        import main as api_main

        # Reset
        api_main._cache["data"] = None
        api_main._cache["loaded_at"] = None

        # Primera llamada debe popular el cache
        api_client.get("/api/deals")
        assert api_main._cache["data"] is not None
        assert api_main._cache["loaded_at"] is not None

    def test_cache_reused_within_ttl(self, api_client):
        import main as api_main

        # Primera llamada popula
        api_client.get("/api/deals")
        first_loaded_at = api_main._cache["loaded_at"]

        # Segunda llamada inmediatamente — NO debe recargar (usa cache)
        api_client.get("/api/deals")
        assert api_main._cache["loaded_at"] == first_loaded_at

    def test_cache_invalidated_after_ttl(self, api_client):
        import main as api_main

        # Poblar cache
        api_client.get("/api/deals")

        # Forzar expiracion moviendo loaded_at 10 minutos atras
        api_main._cache["loaded_at"] = datetime.now() - timedelta(minutes=10)
        old_at = api_main._cache["loaded_at"]

        # Llamada subsiguiente debe refrescar
        api_client.get("/api/deals")
        assert api_main._cache["loaded_at"] > old_at

    def test_ttl_is_300_seconds(self):
        import main as api_main
        assert api_main._CACHE_TTL_SECONDS == 300


class TestMissingDealsFile:
    """
    Cuando no hay deals.json la API sirve un set de semilla (seed) para
    que el front no se vea vacío. El comportamiento previo (lista vacía)
    se mantiene con `SEED_DEALS_DISABLE=1`.
    Ver también: tests/api/test_api_seed_fallback.py
    """
    def test_does_not_crash_without_deals_json(self, tmp_path, monkeypatch):
        # Apuntamos a un dir SIN deals.json y desactivamos el seed para
        # aislar el contrato: "si no hay datos, no crashea, devuelve lista".
        monkeypatch.setenv("DEALS_DIR", str(tmp_path))
        monkeypatch.setenv("SEED_DEALS_DISABLE", "1")
        import importlib
        import main as api_main  # type: ignore
        importlib.reload(api_main)
        api_main._cache["data"] = None
        api_main._cache["loaded_at"] = None

        from fastapi.testclient import TestClient
        client = TestClient(api_main.app)

        r = client.get("/api/deals")
        assert r.status_code == 200
        assert r.json() == []

        r2 = client.get("/api/stats")
        assert r2.status_code == 200
        assert r2.json()["total"] == 0

        r3 = client.get("/api/health")
        assert r3.json()["deals_exists"] is False
