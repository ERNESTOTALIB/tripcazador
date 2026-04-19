"""
API tests: endpoints nuevos de sesión 4 — /api/search, /api/airports
y campos nuevos de /api/health (deals_age_minutes, breakers).
"""
from __future__ import annotations

import pytest


# ══════════════════════════════════════════════════════════════════
# /api/search — búsqueda en vivo con filtros y matching accent-insensitive
# ══════════════════════════════════════════════════════════════════
class TestSearchEndpoint:
    def test_returns_200_and_list(self, api_client):
        r = api_client.get("/api/search")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_without_filters_returns_active_deals(self, api_client):
        r = api_client.get("/api/search")
        data = r.json()
        # expired_deal NO debe aparecer (mismo filtro que /api/deals)
        ids = [d["id"] for d in data]
        assert "expired_deal" not in ids

    def test_filter_origin_iata(self, api_client):
        r = api_client.get("/api/search?origin=MAD")
        data = r.json()
        assert len(data) >= 2
        assert all(d["origin"] == "MAD" or "MAD" in d.get("city_from", "").upper() for d in data)

    def test_filter_origin_city_name(self, api_client):
        r = api_client.get("/api/search?origin=madrid")
        data = r.json()
        assert len(data) >= 1
        assert all("madrid" in d["city_from"].lower() for d in data)

    def test_filter_destination_city(self, api_client):
        r = api_client.get("/api/search?destination=Barcelona")
        data = r.json()
        assert len(data) >= 1
        assert all("barcelona" in d["city_to"].lower() for d in data)

    def test_filter_destination_country_name(self, api_client):
        r = api_client.get("/api/search?destination=españa")
        data = r.json()
        # Debe encontrar Barcelona (España)
        assert any(d["country_to"] == "España" for d in data)

    def test_accent_insensitive_destination(self, api_client):
        # "espana" sin acento debe encontrar "España"
        r = api_client.get("/api/search?destination=espana")
        data = r.json()
        assert any(d["country_to"] == "España" for d in data)

    def test_filter_cabin_business(self, api_client):
        r = api_client.get("/api/search?cabin=business")
        data = r.json()
        assert all(d["cabin"] == "business" for d in data)
        assert len(data) >= 1

    def test_filter_max_price(self, api_client):
        r = api_client.get("/api/search?max_price=50")
        data = r.json()
        assert all(d["price_eur"] <= 50 for d in data)

    def test_filter_date_from(self, api_client):
        # fixture tiene 2026-07-15 (JFK) y 2026-08-20 (BCN)
        r = api_client.get("/api/search?date_from=2026-08-01")
        data = r.json()
        assert all(d["date_out"] >= "2026-08-01" for d in data)

    def test_filter_date_to(self, api_client):
        r = api_client.get("/api/search?date_to=2026-07-31")
        data = r.json()
        assert all(d["date_out"] <= "2026-07-31" for d in data)

    def test_filter_q_text(self, api_client):
        r = api_client.get("/api/search?q=barcelona")
        data = r.json()
        assert len(data) >= 1

    def test_filter_q_accent_insensitive(self, api_client):
        # "nueva" sin acento debe encontrar "Nueva York"
        r = api_client.get("/api/search?q=nueva")
        data = r.json()
        assert any("nueva york" in d["city_to"].lower() for d in data)

    def test_filter_q_matches_airline(self, api_client):
        r = api_client.get("/api/search?q=iberia")
        data = r.json()
        assert len(data) >= 1
        assert any("iberia" in d["airline_name"].lower() for d in data)

    def test_combined_filters(self, api_client):
        # Business + destino EE.UU.
        r = api_client.get("/api/search?cabin=business&destination=nueva")
        data = r.json()
        assert len(data) >= 1
        assert all(d["cabin"] == "business" for d in data)

    def test_no_match_returns_empty_list(self, api_client):
        r = api_client.get("/api/search?destination=ciudad_inexistente_xyz")
        data = r.json()
        assert data == []

    def test_limit_parameter(self, api_client):
        r = api_client.get("/api/search?limit=1")
        data = r.json()
        assert len(data) <= 1

    def test_limit_rejected_if_too_high(self, api_client):
        r = api_client.get("/api/search?limit=9999")
        assert r.status_code == 422


# ══════════════════════════════════════════════════════════════════
# /api/airports — catálogo de aeropuertos
# ══════════════════════════════════════════════════════════════════
class TestAirportsEndpoint:
    def test_returns_200_and_structure(self, api_client):
        r = api_client.get("/api/airports")
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "airports" in data
        assert isinstance(data["airports"], list)

    def test_has_major_hubs(self, api_client):
        r = api_client.get("/api/airports")
        airports = r.json()["airports"]
        iatas = {a["iata"] for a in airports}
        # Hubs imprescindibles para el público objetivo DACH/ES
        for expected in ("MAD", "BCN", "BSL", "ZRH", "FRA", "VIE"):
            assert expected in iatas, f"Falta aeropuerto clave: {expected}"

    def test_entries_have_required_fields(self, api_client):
        r = api_client.get("/api/airports?limit=5")
        airports = r.json()["airports"]
        for a in airports:
            assert "iata" in a
            assert "city" in a
            assert "country" in a
            assert "region" in a
            assert len(a["iata"]) == 3

    def test_filter_by_region(self, api_client):
        r = api_client.get("/api/airports?region=África")
        data = r.json()
        assert data["total"] >= 5
        assert all(a["region"] == "África" for a in data["airports"])

    def test_filter_q_by_iata(self, api_client):
        r = api_client.get("/api/airports?q=MAD")
        data = r.json()
        iatas = {a["iata"] for a in data["airports"]}
        assert "MAD" in iatas

    def test_filter_q_by_city(self, api_client):
        r = api_client.get("/api/airports?q=basilea")
        data = r.json()
        iatas = {a["iata"] for a in data["airports"]}
        assert "BSL" in iatas

    def test_filter_q_accent_insensitive(self, api_client):
        # "zanzibar" sin acento debe encontrar "Zanzíbar"
        r = api_client.get("/api/airports?q=zanzibar")
        data = r.json()
        iatas = {a["iata"] for a in data["airports"]}
        assert "ZNZ" in iatas

    def test_filter_q_by_country(self, api_client):
        r = api_client.get("/api/airports?q=tanzania")
        data = r.json()
        cities = {a["city"] for a in data["airports"]}
        # Zanzíbar, Dar es Salaam o Kilimanjaro
        assert any(
            c in cities for c in ("Zanzíbar", "Dar es Salaam", "Kilimanjaro")
        )

    def test_limit_cap(self, api_client):
        r = api_client.get("/api/airports?limit=10")
        assert len(r.json()["airports"]) <= 10

    def test_limit_rejected_if_too_high(self, api_client):
        r = api_client.get("/api/airports?limit=99999")
        assert r.status_code == 422


# ══════════════════════════════════════════════════════════════════
# /api/health — campos nuevos (sesión 4.2)
# ══════════════════════════════════════════════════════════════════
class TestHealthExtended:
    def test_includes_deals_age_minutes(self, api_client):
        r = api_client.get("/api/health")
        data = r.json()
        assert "deals_age_minutes" in data
        # Si el fichero existe, debe ser un número (no None)
        if data["deals_exists"]:
            assert data["deals_age_minutes"] is not None
            assert data["deals_age_minutes"] >= 0

    def test_includes_breakers(self, api_client):
        r = api_client.get("/api/health")
        data = r.json()
        assert "breakers" in data
        # breakers es dict o list (depende de si el motor está cargado)
        assert isinstance(data["breakers"], (dict, list))
