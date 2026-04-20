"""Tests para POST /api/admin/deals — upload del deals.json desde GitHub Actions worker.

El endpoint tiene cuatro modos:
  - ADMIN_TOKEN vacío       → 503 (no configurado)
  - Token inválido          → 401
  - Payload inválido        → 400 / 422
  - Token válido + JSON ok  → 200 + escribe deals.json + invalida caché
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))

import main as api_main  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch, tmp_path):
    """Aísla cada test — token limpio, deals.json en tmp_path, caché vacía."""
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "")
    monkeypatch.setattr(api_main, "DEALS_DIR", tmp_path)
    monkeypatch.setattr(api_main, "DEALS_JSON", tmp_path / "deals.json")
    api_main._cache["data"] = None
    api_main._cache["loaded_at"] = None


def _valid_payload() -> dict:
    return {
        "schema_version": "4.1",
        "total_deals": 1,
        "deals": [
            {
                "id": "MAD_NRT_2026-08-15",
                "origin": "MAD",
                "destination": "NRT",
                "price_eur": 420.0,
            }
        ],
    }


def test_503_when_token_not_configured():
    r = client.post("/api/admin/deals", json=_valid_payload())
    assert r.status_code == 503


def test_401_when_token_missing(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.post("/api/admin/deals", json=_valid_payload())
    assert r.status_code == 401


def test_401_when_token_wrong(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.post(
        "/api/admin/deals",
        json=_valid_payload(),
        headers={"X-Admin-Token": "nope"},
    )
    assert r.status_code == 401


def test_422_when_deals_key_missing(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.post(
        "/api/admin/deals",
        json={"schema_version": "4.1"},
        headers={"X-Admin-Token": "secret-123"},
    )
    assert r.status_code == 422
    assert "deals" in r.json().get("detail", "")


def test_422_when_deals_not_list(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.post(
        "/api/admin/deals",
        json={"deals": "not-a-list"},
        headers={"X-Admin-Token": "secret-123"},
    )
    assert r.status_code == 422


def test_200_writes_deals_json_and_invalidates_cache(monkeypatch, tmp_path):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")

    # Pre-calentar la caché con datos antiguos
    api_main._cache["data"] = {"deals": [], "stale": True}
    api_main._cache["loaded_at"] = api_main.datetime.now()

    payload = _valid_payload()
    r = client.post(
        "/api/admin/deals",
        json=payload,
        headers={"X-Admin-Token": "secret-123"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["total_deals"] == 1
    assert body["bytes"] > 0

    # deals.json se escribió al disco
    deals_path = tmp_path / "deals.json"
    assert deals_path.exists()
    on_disk = json.loads(deals_path.read_text(encoding="utf-8"))
    assert on_disk["deals"][0]["origin"] == "MAD"

    # Caché invalidada
    assert api_main._cache["data"] is None
    assert api_main._cache["loaded_at"] is None


def test_200_defaults_metadata_when_missing(monkeypatch, tmp_path):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")

    minimal = {"deals": []}
    r = client.post(
        "/api/admin/deals",
        json=minimal,
        headers={"X-Admin-Token": "secret-123"},
    )
    assert r.status_code == 200
    on_disk = json.loads((tmp_path / "deals.json").read_text(encoding="utf-8"))
    assert on_disk["schema_version"] == "4.1"
    assert on_disk["total_deals"] == 0
    assert "generated_at" in on_disk


def test_accepts_token_via_query_param(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.post(
        "/api/admin/deals?token=secret-123",
        json=_valid_payload(),
    )
    assert r.status_code == 200
