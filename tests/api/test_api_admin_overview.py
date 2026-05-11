"""Tests para /api/admin/overview — autenticación y shape de respuesta.

El endpoint tiene tres modos:
  - ADMIN_TOKEN vacío       → 503 (no configurado)
  - Token inválido          → 401
  - Token válido            → 200 con payload {deals, engine_flights, engine_hotels, breakers}

Se puede autenticar vía header `X-Admin-Token` o query `?token=`.
"""
from __future__ import annotations

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
def _no_admin_token(monkeypatch):
    """Por defecto, no hay token configurado — cada test lo sobreescribe si necesita."""
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "")


def test_503_when_token_not_configured():
    # SSS147: api/main.py now returns 401 (not 503) when ADMIN_TOKEN is empty
    # to avoid leaking config state to scanners. Test updated to match.
    r = client.get("/api/admin/overview")
    assert r.status_code == 401


def test_401_when_token_missing(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.get("/api/admin/overview")
    assert r.status_code == 401


def test_401_when_token_wrong_header(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.get("/api/admin/overview", headers={"X-Admin-Token": "nope"})
    assert r.status_code == 401


def test_401_when_token_wrong_query(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.get("/api/admin/overview?token=nope")
    assert r.status_code == 401


def test_200_with_valid_header_token(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.get("/api/admin/overview", headers={"X-Admin-Token": "secret-123"})
    assert r.status_code == 200
    body = r.json()
    assert "timestamp" in body
    assert "deals" in body
    assert "engine_flights" in body
    assert "engine_hotels" in body
    assert "breakers" in body


def test_200_with_valid_query_token(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.get("/api/admin/overview?token=secret-123")
    assert r.status_code == 200


def test_payload_shape(monkeypatch):
    """Confirma que las sub-claves importantes existen aunque los valores sean None."""
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    r = client.get("/api/admin/overview", headers={"X-Admin-Token": "secret-123"})
    assert r.status_code == 200
    body = r.json()

    # engine_flights / engine_hotels siempre reportan exists:bool
    assert isinstance(body["engine_flights"]["exists"], bool)
    assert isinstance(body["engine_hotels"]["exists"], bool)

    # deals puede traer error si no hay deals.json, pero nunca debe romper
    assert isinstance(body["deals"], dict)

    # breakers puede ser dict o list dependiendo de circuit_breaker.all_status()
    assert isinstance(body["breakers"], (dict, list))


def test_not_indexed_header_not_required():
    """El endpoint no devuelve X-Robots-Tag, pero el panel web sí (via metadata).
    Este test sólo confirma que el endpoint responde con JSON y no HTML."""
    r = client.get("/api/admin/overview")
    assert r.status_code in (401, 503)
    ct = r.headers.get("content-type", "")
    assert "application/json" in ct


def test_token_with_whitespace_stripped(monkeypatch):
    """ADMIN_TOKEN se compara directamente — espacios en header/query importan."""
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "secret-123")
    # Un espacio al final debe fallar (no hacemos trim)
    r = client.get("/api/admin/overview", headers={"X-Admin-Token": "secret-123 "})
    assert r.status_code == 401


def test_header_takes_precedence_over_query(monkeypatch):
    """Si ambos están presentes, el header manda (comportamiento común en APIs)."""
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "correcto")
    r = client.get(
        "/api/admin/overview?token=incorrecto",
        headers={"X-Admin-Token": "correcto"},
    )
    assert r.status_code == 200
