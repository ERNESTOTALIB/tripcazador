"""
API tests: POST /api/price-alerts + GET /api/price-alerts/cancel
=================================================================

Cubrimos:
 - Creación correcta → 200 + id + cancel_token
 - Email inválido → 422 (Pydantic) o 400
 - IATA inválido (longitud o no-A-Z) → 422 o 400
 - target_price inválido (<= 0, > 100000) → 422
 - Solo email sin ruta ni deal_id → 400 (need_route_or_deal)
 - Dedupe: dos POST idénticos → misma id, status "already_exists"
 - Cancel con token válido → 200
 - Cancel con token inválido → 403
 - Cancel de alerta ya cancelada → 200 (idempotente)
 - Persistencia: PRICE_ALERTS_PATH respeta env var
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest


@pytest.fixture
def alerts_client(synthetic_deals_json, monkeypatch, tmp_path: Path):
    """TestClient con PRICE_ALERTS_PATH apuntando a tmp dir."""
    alerts_path = tmp_path / "price_alerts.json"
    monkeypatch.setenv("DEALS_DIR", str(synthetic_deals_json.parent))
    monkeypatch.setenv("PRICE_ALERTS_PATH", str(alerts_path))
    monkeypatch.setenv("PRICE_ALERT_SECRET", "test-secret-stable")

    import importlib
    import main as api_main  # type: ignore
    importlib.reload(api_main)
    api_main._cache["data"] = None
    api_main._cache["loaded_at"] = None

    from fastapi.testclient import TestClient
    client = TestClient(api_main.app)
    return client, alerts_path, api_main


class TestCreatePriceAlert:
    def test_basic_happy_path(self, alerts_client):
        client, path, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "ernesto@example.com", "origin": "MAD", "destination": "JFK", "target_price": 500},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert len(data["id"]) == 12
        assert len(data["cancel_token"]) == 32
        # Persistido en disco
        assert path.exists()
        saved = json.loads(path.read_text())
        assert len(saved) == 1
        assert saved[0]["email"] == "ernesto@example.com"
        assert saved[0]["origin"] == "MAD"
        assert saved[0]["status"] == "active"

    def test_email_normalization(self, alerts_client):
        client, path, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "  ErNeStO@Example.COM ", "origin": "MAD", "destination": "JFK"},
        )
        assert r.status_code == 200
        saved = json.loads(path.read_text())
        # Pydantic EmailStr puede normalizar el dominio a lowercase; nosotros fuerzamos lower+strip
        assert saved[0]["email"].startswith("ernesto@")

    def test_iata_uppercased(self, alerts_client):
        client, path, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "origin": "mad", "destination": "jfk"},
        )
        assert r.status_code == 200
        saved = json.loads(path.read_text())
        assert saved[0]["origin"] == "MAD"
        assert saved[0]["destination"] == "JFK"

    def test_requires_route_or_deal_id(self, alerts_client):
        client, _, _ = alerts_client
        r = client.post("/api/price-alerts", json={"email": "a@b.com"})
        assert r.status_code == 400
        assert "origen" in r.json()["detail"].lower() or "destino" in r.json()["detail"].lower()

    def test_invalid_email(self, alerts_client):
        client, _, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "not-an-email", "origin": "MAD"},
        )
        # Pydantic EmailStr → 422
        assert r.status_code in (400, 422)

    def test_invalid_iata_length(self, alerts_client):
        client, _, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "origin": "MADRID"},
        )
        # Pydantic max_length=3 → 422
        assert r.status_code in (400, 422)

    def test_invalid_iata_characters(self, alerts_client):
        client, _, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "origin": "123"},
        )
        assert r.status_code == 400
        assert "iata" in r.json()["detail"].lower()

    def test_negative_price_rejected(self, alerts_client):
        client, _, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "origin": "MAD", "destination": "JFK", "target_price": -1},
        )
        assert r.status_code == 422

    def test_price_above_max_rejected(self, alerts_client):
        client, _, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "origin": "MAD", "target_price": 999999},
        )
        assert r.status_code == 422

    def test_deal_id_only_accepted(self, alerts_client):
        """Un alert sin origen/destino pero con deal_id también vale."""
        client, path, _ = alerts_client
        r = client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "deal_id": "deal-abc123"},
        )
        assert r.status_code == 200
        saved = json.loads(path.read_text())
        assert saved[0]["deal_id"] == "deal-abc123"

    def test_dedupe_same_alert(self, alerts_client):
        """Doble POST idéntico → mismo id, status=already_exists, una sola fila."""
        client, path, _ = alerts_client
        payload = {"email": "a@b.com", "origin": "MAD", "destination": "JFK", "target_price": 400}
        r1 = client.post("/api/price-alerts", json=payload)
        r2 = client.post("/api/price-alerts", json=payload)
        assert r1.status_code == 200 and r2.status_code == 200
        assert r2.json()["status"] == "already_exists"
        assert r1.json()["id"] == r2.json()["id"]
        assert len(json.loads(path.read_text())) == 1


class TestCancelPriceAlert:
    def _create(self, client):
        r = client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "origin": "MAD", "destination": "JFK"},
        )
        data = r.json()
        return data["id"], data["cancel_token"]

    def test_cancel_with_valid_token(self, alerts_client):
        client, path, _ = alerts_client
        alert_id, token = self._create(client)
        r = client.get(f"/api/price-alerts/cancel?id={alert_id}&token={token}")
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"
        saved = json.loads(path.read_text())
        assert saved[0]["status"] == "cancelled"
        assert "cancelled_at" in saved[0]

    def test_cancel_wrong_token(self, alerts_client):
        client, _, _ = alerts_client
        alert_id, _ = self._create(client)
        r = client.get(f"/api/price-alerts/cancel?id={alert_id}&token=0000")
        assert r.status_code == 403

    def test_cancel_unknown_id(self, alerts_client):
        client, _, api_main = alerts_client
        # Calculamos token para un id inexistente
        fake_id = "deadbeef0000"
        fake_token = api_main._alert_cancel_token(fake_id)
        r = client.get(f"/api/price-alerts/cancel?id={fake_id}&token={fake_token}")
        assert r.status_code == 404

    def test_cancel_is_idempotent(self, alerts_client):
        """Doble cancel con token válido devuelve 200 las dos veces."""
        client, _, _ = alerts_client
        alert_id, token = self._create(client)
        r1 = client.get(f"/api/price-alerts/cancel?id={alert_id}&token={token}")
        r2 = client.get(f"/api/price-alerts/cancel?id={alert_id}&token={token}")
        assert r1.status_code == 200 and r2.status_code == 200


class TestMatcherEndpoint:
    def test_matcher_requires_admin_token(self, alerts_client, monkeypatch):
        client, _, _ = alerts_client
        monkeypatch.delenv("ADMIN_TOKEN", raising=False)
        r = client.post("/api/admin/match-price-alerts")
        assert r.status_code == 404

    def test_matcher_wrong_admin_token(self, alerts_client, monkeypatch):
        monkeypatch.setenv("ADMIN_TOKEN", "secret")
        client, _, _ = alerts_client
        r = client.post("/api/admin/match-price-alerts", headers={"x-admin-token": "wrong"})
        assert r.status_code == 403

    def test_matcher_no_alerts(self, alerts_client, monkeypatch):
        monkeypatch.setenv("ADMIN_TOKEN", "ok")
        client, _, _ = alerts_client
        r = client.post(
            "/api/admin/match-price-alerts?dry_run=true",
            headers={"x-admin-token": "ok"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["matches"] == 0
        assert data["sent"] == 0
        assert data["dry_run"] is True

    def test_matcher_dry_run_finds_matches(self, alerts_client, monkeypatch):
        """Crea una alerta que machea un deal sintético y verifica dry-run sin enviar."""
        monkeypatch.setenv("ADMIN_TOKEN", "ok")
        client, path, _ = alerts_client
        # Crear alerta amplia (MAD → cualquiera, target 10000 €) para que machee
        r = client.post(
            "/api/price-alerts",
            json={"email": "alerta@example.com", "origin": "MAD", "target_price": 10000},
        )
        assert r.status_code == 200
        r = client.post(
            "/api/admin/match-price-alerts?dry_run=true",
            headers={"x-admin-token": "ok"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["active_alerts"] == 1
        assert data["matches"] >= 1
        assert data["sent"] == 0  # dry-run no envía
        assert data["dry_run"] is True


class TestDebugEndpoint:
    def test_debug_without_admin_token_returns_404(self, alerts_client, monkeypatch):
        client, _, _ = alerts_client
        monkeypatch.delenv("ADMIN_TOKEN", raising=False)
        r = client.get("/api/price-alerts/_debug")
        assert r.status_code == 404

    def test_debug_with_wrong_admin_token_returns_403(self, alerts_client, monkeypatch):
        monkeypatch.setenv("ADMIN_TOKEN", "secret")
        # Tenemos que recargar el módulo porque ADMIN_TOKEN se lee en request-time,
        # pero usamos el client existente — el env ya está puesto antes de la llamada.
        client, _, _ = alerts_client
        r = client.get("/api/price-alerts/_debug", headers={"x-admin-token": "wrong"})
        assert r.status_code == 403

    def test_debug_with_correct_admin_token(self, alerts_client, monkeypatch):
        monkeypatch.setenv("ADMIN_TOKEN", "correct-token")
        client, _, _ = alerts_client
        # Crea una alerta primero
        client.post(
            "/api/price-alerts",
            json={"email": "a@b.com", "origin": "MAD", "destination": "JFK"},
        )
        r = client.get("/api/price-alerts/_debug", headers={"x-admin-token": "correct-token"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 1
        assert data["active"] == 1
