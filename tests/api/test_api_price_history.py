"""
API tests: /api/price_history — serie temporal de precios por ruta.
El endpoint debe ser tolerante a fallos: si el DB no existe o la tabla
flights no ha sido inicializada, devuelve points vacios sin romper.
"""
from __future__ import annotations

import os
import sqlite3
import datetime
import pytest


# ────────────────────────────────────────────────
# Fixtures: DB sintetico con 30d de MAD-JFK economy
# ────────────────────────────────────────────────
@pytest.fixture
def history_db(tmp_path, monkeypatch):
    """Crea un price_history_v4.db temporal y lo apunta via monkeypatch."""
    db = tmp_path / "price_history.db"
    conn = sqlite3.connect(db)
    conn.executescript(
        """
        CREATE TABLE flights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          origin TEXT, destination TEXT,
          price_eur REAL, cabin TEXT, cabin_code INTEGER,
          source TEXT, scraped_at TEXT
        );
        """
    )
    base = datetime.datetime.now() - datetime.timedelta(days=30)
    # MAD-JFK economy con tendencia bajista (de 650€ a ~530€)
    for i in range(30):
        ts = (base + datetime.timedelta(days=i)).isoformat()
        price = 650 - i * 4
        conn.execute(
            "INSERT INTO flights(origin,destination,price_eur,cabin,cabin_code,source,scraped_at)"
            " VALUES(?,?,?,?,?,?,?)",
            ("MAD", "JFK", price, "Economy", 1, "synth", ts),
        )
    # BCN-CDG business, pocos puntos
    for i in range(5):
        ts = (base + datetime.timedelta(days=i * 6)).isoformat()
        conn.execute(
            "INSERT INTO flights(origin,destination,price_eur,cabin,cabin_code,source,scraped_at)"
            " VALUES(?,?,?,?,?,?,?)",
            ("BCN", "CDG", 800 + i * 10, "Business", 3, "synth", ts),
        )
    conn.commit()
    conn.close()

    # Patch la constante en el modulo importado por el test client
    import main as api_main
    from pathlib import Path

    monkeypatch.setattr(api_main, "PRICE_HISTORY_DB", Path(str(db)))
    return db


# ────────────────────────────────────────────────
# Tests
# ────────────────────────────────────────────────
class TestPriceHistoryEndpoint:
    def test_missing_db_returns_empty(self, api_client, monkeypatch, tmp_path):
        """Si el DB no existe, devuelve 200 con points=[]."""
        import main as api_main
        from pathlib import Path

        monkeypatch.setattr(
            api_main, "PRICE_HISTORY_DB", Path(str(tmp_path / "nope.db"))
        )
        r = api_client.get(
            "/api/price_history",
            params={"origin": "MAD", "destination": "JFK"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["points"] == []
        assert data["origin"] == "MAD"
        assert data["destination"] == "JFK"

    def test_rejects_short_iata(self, api_client):
        r = api_client.get(
            "/api/price_history",
            params={"origin": "MA", "destination": "JFK"},
        )
        assert r.status_code == 422

    def test_rejects_too_many_days(self, api_client):
        r = api_client.get(
            "/api/price_history",
            params={"origin": "MAD", "destination": "JFK", "days": 9999},
        )
        assert r.status_code == 422

    def test_rejects_too_few_days(self, api_client):
        r = api_client.get(
            "/api/price_history",
            params={"origin": "MAD", "destination": "JFK", "days": 1},
        )
        assert r.status_code == 422

    def test_returns_points_with_data(self, api_client, history_db):
        r = api_client.get(
            "/api/price_history",
            params={
                "origin": "MAD",
                "destination": "JFK",
                "cabin": "economy",
                "days": 90,
            },
        )
        assert r.status_code == 200
        data = r.json()
        assert len(data["points"]) == 30
        # Cada punto tiene el shape esperado
        p = data["points"][0]
        assert set(p.keys()) == {"ts", "price", "avg", "samples"}
        assert isinstance(p["price"], (int, float))

    def test_detects_downtrend(self, api_client, history_db):
        r = api_client.get(
            "/api/price_history",
            params={
                "origin": "MAD",
                "destination": "JFK",
                "cabin": "economy",
                "days": 90,
            },
        )
        stats = r.json()["stats"]
        assert stats["trend"] == "down"
        assert stats["change_pct"] < -10  # cayo mas de 10%
        assert stats["min"] < stats["max"]
        assert stats["days_covered"] == 30

    def test_filters_by_cabin(self, api_client, history_db):
        """Business en MAD-JFK no tiene datos → points vacio."""
        r = api_client.get(
            "/api/price_history",
            params={
                "origin": "MAD",
                "destination": "JFK",
                "cabin": "business",
            },
        )
        assert r.status_code == 200
        assert r.json()["points"] == []

    def test_business_route_returns_data(self, api_client, history_db):
        r = api_client.get(
            "/api/price_history",
            params={
                "origin": "BCN",
                "destination": "CDG",
                "cabin": "business",
                "days": 90,
            },
        )
        data = r.json()
        assert len(data["points"]) == 5

    def test_wrong_route_returns_empty(self, api_client, history_db):
        r = api_client.get(
            "/api/price_history",
            params={"origin": "LIS", "destination": "PMI"},
        )
        assert r.status_code == 200
        assert r.json()["points"] == []

    def test_origin_case_insensitive(self, api_client, history_db):
        """IATA en minusculas debe normalizarse a uppercase."""
        r = api_client.get(
            "/api/price_history",
            params={"origin": "mad", "destination": "jfk"},
        )
        assert r.status_code == 200
        # Normalizado en la respuesta
        assert r.json()["origin"] == "MAD"
        assert r.json()["destination"] == "JFK"
        assert len(r.json()["points"]) == 30
