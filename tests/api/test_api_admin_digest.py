"""Tests para /api/admin/digest y para tools.generate_digest.

Cubre:
  - auth igual que admin_overview (503/401/200)
  - format=html devuelve HTML con estructura esperada
  - format=json devuelve deals ordenados y truncados a `limit`
  - el generador standalone renderiza correctamente con deals de fixture
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
sys.path.insert(0, str(ROOT / "tools"))

import main as api_main  # noqa: E402
from main import app  # noqa: E402
import generate_digest  # noqa: E402

client = TestClient(app)


FIXTURE_DEALS = [
    {
        "id": "DEAL-EPIC-001",
        "headline": "Madrid → Tokio 398€ ida y vuelta",
        "origin": "MAD",
        "destination": "NRT",
        "city_from": "Madrid",
        "city_to": "Tokio",
        "date_out": "2026-11-05",
        "date_ret": "2026-11-20",
        "nights": 15,
        "price_eur": 398,
        "classification": "epic",
        "cabin": "economy",
        "score": 95,
    },
    {
        "id": "DEAL-GREAT-002",
        "headline": "Barcelona → Bali 450€",
        "origin": "BCN",
        "destination": "DPS",
        "city_from": "Barcelona",
        "city_to": "Bali",
        "date_out": "2026-10-01",
        "date_ret": "2026-10-15",
        "nights": 14,
        "price_eur": 450,
        "classification": "great",
        "cabin": "economy",
        "score": 88,
    },
    {
        "id": "DEAL-GOOD-003",
        "headline": "Madrid → Buenos Aires 520€",
        "origin": "MAD",
        "destination": "EZE",
        "city_from": "Madrid",
        "city_to": "Buenos Aires",
        "date_out": "2026-09-10",
        "date_ret": "2026-09-25",
        "nights": 15,
        "price_eur": 520,
        "classification": "good",
        "cabin": "economy",
        "score": 70,
    },
]


@pytest.fixture
def deals_file(tmp_path, monkeypatch):
    """Crea deals.json temporal y apunta el generador a él."""
    deals_path = tmp_path / "deals.json"
    deals_path.write_text(json.dumps({"deals": FIXTURE_DEALS}), encoding="utf-8")
    monkeypatch.setattr(generate_digest, "DEFAULT_DEALS", deals_path)
    return deals_path


# ────────── Tests del generador standalone ──────────


def test_load_deals_from_list_format(tmp_path):
    p = tmp_path / "deals.json"
    p.write_text(json.dumps(FIXTURE_DEALS), encoding="utf-8")
    assert generate_digest.load_deals(p) == FIXTURE_DEALS


def test_load_deals_from_dict_format(tmp_path):
    p = tmp_path / "deals.json"
    p.write_text(json.dumps({"deals": FIXTURE_DEALS, "total": 3}), encoding="utf-8")
    assert generate_digest.load_deals(p) == FIXTURE_DEALS


def test_load_deals_missing_file(tmp_path):
    assert generate_digest.load_deals(tmp_path / "no-existe.json") == []


def test_render_digest_contains_deal_headlines():
    html = generate_digest.render_digest(FIXTURE_DEALS, limit=6)
    for deal in FIXTURE_DEALS:
        assert deal["headline"] in html


def test_render_digest_orders_by_score():
    """El deal con score=95 debe aparecer antes que el de score=70."""
    html = generate_digest.render_digest(FIXTURE_DEALS, limit=6)
    idx_epic = html.find("Tokio 398€")
    idx_good = html.find("Buenos Aires 520€")
    assert idx_epic > 0
    assert idx_good > 0
    assert idx_epic < idx_good


def test_render_digest_honors_limit():
    html = generate_digest.render_digest(FIXTURE_DEALS, limit=2)
    assert "Tokio 398€" in html  # score 95 — entra
    assert "Bali 450€" in html  # score 88 — entra
    assert "Buenos Aires 520€" not in html  # score 70 — queda fuera


def test_render_digest_epic_classification_badge():
    html = generate_digest.render_digest(FIXTURE_DEALS, limit=1)
    assert "ÉPICO" in html
    assert "#f59e0b" in html


def test_render_digest_escapes_html_in_headline():
    evil = [{**FIXTURE_DEALS[0], "headline": "<script>alert(1)</script>"}]
    html = generate_digest.render_digest(evil, limit=1)
    assert "<script>" not in html
    assert "&lt;script&gt;" in html


def test_render_digest_has_preheader_and_unsubscribe_placeholder():
    html = generate_digest.render_digest(FIXTURE_DEALS, limit=3)
    assert "{unsubscribe_url}" in html  # placeholder para el servicio de email
    assert "tripcazador.com" in html


def test_render_digest_empty_deals():
    html = generate_digest.render_digest([], limit=6)
    # No peta, devuelve HTML válido con 0 deals
    assert "<html" in html
    assert "TripCazador" in html


# ────────── Tests del endpoint /api/admin/digest ──────────


def test_digest_503_without_token():
    # SSS147: api/main.py now returns 401 (not 503) when ADMIN_TOKEN is empty
    # to avoid leaking config state to scanners. Test updated to match.
    api_main.ADMIN_TOKEN = ""
    r = client.get("/api/admin/digest")
    assert r.status_code == 401


def test_digest_401_with_wrong_token(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "correcto")
    r = client.get("/api/admin/digest", headers={"X-Admin-Token": "incorrecto"})
    assert r.status_code == 401


def test_digest_html_format(monkeypatch, deals_file):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "correcto")
    r = client.get(
        "/api/admin/digest?format=html&limit=3",
        headers={"X-Admin-Token": "correcto"},
    )
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    assert "TripCazador" in r.text
    assert "Tokio 398€" in r.text


def test_digest_json_format(monkeypatch, deals_file):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "correcto")
    r = client.get(
        "/api/admin/digest?format=json&limit=2",
        headers={"X-Admin-Token": "correcto"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 2
    assert "generated_at" in body
    assert len(body["deals"]) == 2
    # Ordenados por score descendente
    assert body["deals"][0]["id"] == "DEAL-EPIC-001"


def test_digest_rejects_invalid_format(monkeypatch):
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "correcto")
    r = client.get(
        "/api/admin/digest?format=xml",
        headers={"X-Admin-Token": "correcto"},
    )
    assert r.status_code == 422


def test_digest_clamps_limit(monkeypatch):
    """limit=100 debe rechazarse (max 20)."""
    monkeypatch.setattr(api_main, "ADMIN_TOKEN", "correcto")
    r = client.get(
        "/api/admin/digest?limit=100",
        headers={"X-Admin-Token": "correcto"},
    )
    assert r.status_code == 422
