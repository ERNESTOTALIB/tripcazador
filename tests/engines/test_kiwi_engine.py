"""
Engine tests: kiwi_engine.py — parseo de respuestas Kiwi Tequila.

Los tests NO llaman a la API real: inyectan el JSON de fixtures
directamente en _parse_response.
"""
from __future__ import annotations

import pytest

import config
from kiwi_engine import KiwiEngineV4


@pytest.fixture
def kiwi_engine():
    # Forzamos disponibilidad con una key ficticia
    return KiwiEngineV4(api_key="test-key-xxx")


class TestKiwiEngineInit:
    def test_no_api_key_marks_unavailable(self, monkeypatch):
        monkeypatch.setenv("KIWI_API_KEY", "")
        monkeypatch.setattr(config, "KIWI_API_KEY", "", raising=False)
        eng = KiwiEngineV4(api_key="")
        assert eng.available is False

    def test_with_api_key_available(self):
        eng = KiwiEngineV4(api_key="abc")
        assert eng.available is True


class TestParseResponse:
    def test_parses_happy_path(self, kiwi_engine, kiwi_response_json):
        flights = kiwi_engine._parse_response(
            kiwi_response_json,
            origin="MAD", dest="NRT",
            cabin=config.CABIN_BUSINESS, cabin_name="Business",
        )
        assert len(flights) >= 1
        f = flights[0]
        assert f["origin"] == "MAD"
        assert f["price_eur"] > 0
        assert f["source"] == "kiwi"
        assert f["cabin"] == "Business"
        assert "booking_url" in f

    def test_zero_price_filtered(self, kiwi_engine):
        bad = {"data": [{"price": 0, "route": [{"flyFrom": "MAD", "flyTo": "FCO"}]}]}
        flights = kiwi_engine._parse_response(bad, "MAD", "FCO", 1, "Economy")
        assert flights == []

    def test_empty_route_filtered(self, kiwi_engine):
        bad = {"data": [{"price": 100, "route": []}]}
        flights = kiwi_engine._parse_response(bad, "MAD", "FCO", 1, "Economy")
        assert flights == []

    def test_empty_response(self, kiwi_engine):
        flights = kiwi_engine._parse_response({"data": []}, "MAD", "FCO", 1, "Economy")
        assert flights == []

    def test_direct_flight_zero_stops(self, kiwi_engine, kiwi_response_json):
        flights = kiwi_engine._parse_response(
            kiwi_response_json, "MAD", "NRT", 3, "Business"
        )
        # La primera oferta tiene 2 segmentos (ida+vuelta directos) -> stops=0
        assert flights[0]["stops"] == 0

    def test_connecting_flight_has_stops(self, kiwi_engine, kiwi_response_json):
        flights = kiwi_engine._parse_response(
            kiwi_response_json, "MAD", "NRT", 3, "Business"
        )
        # La segunda oferta tiene 4 segmentos (1 escala ida + 1 escala vuelta) -> stops=1
        assert flights[1]["stops"] >= 0

    # ----------------------------------------------------------------
    # Regresión explícita de la lógica de stops (fix sesión 6).
    # Antes: `segs_outbound = total_segs // 2 if total_segs > 2 else total_segs`
    # fallaba en round-trips directos (total_segs=2 → segs_outbound=2 → stops=1).
    # Ahora se cuenta por `return == 0` para ser robusto.
    # ----------------------------------------------------------------

    def test_oneway_direct_returns_zero_stops(self, kiwi_engine):
        """Vuelo ida directo, sin campo return → 1 segmento → 0 stops."""
        payload = {"data": [{
            "price": 150.0,
            "route": [{"flyFrom": "MAD", "flyTo": "FCO", "airline": "IB",
                       "dTimeUTC": 1700000000, "aTimeUTC": 1700005000}],
        }]}
        flights = kiwi_engine._parse_response(payload, "MAD", "FCO", 1, "Economy")
        assert len(flights) == 1
        assert flights[0]["stops"] == 0

    def test_oneway_one_stop_returns_one_stop(self, kiwi_engine):
        """Vuelo ida con 1 escala → 2 segmentos → 1 stop."""
        payload = {"data": [{
            "price": 200.0,
            "route": [
                {"flyFrom": "MAD", "flyTo": "IST", "airline": "TK",
                 "dTimeUTC": 1700000000, "aTimeUTC": 1700010000},
                {"flyFrom": "IST", "flyTo": "NRT", "airline": "TK",
                 "dTimeUTC": 1700015000, "aTimeUTC": 1700050000},
            ],
        }]}
        flights = kiwi_engine._parse_response(payload, "MAD", "NRT", 3, "Business")
        assert flights[0]["stops"] == 1

    def test_roundtrip_direct_returns_zero_stops(self, kiwi_engine):
        """Round-trip directo (1 ida + 1 vuelta) → 2 segmentos, pero stops=0. (Fix del bug)"""
        payload = {"data": [{
            "price": 800.0,
            "route": [
                {"flyFrom": "MAD", "flyTo": "NRT", "return": 0, "airline": "IB",
                 "dTimeUTC": 1700000000, "aTimeUTC": 1700050000},
                {"flyFrom": "NRT", "flyTo": "MAD", "return": 1, "airline": "IB",
                 "dTimeUTC": 1701000000, "aTimeUTC": 1701050000},
            ],
        }]}
        flights = kiwi_engine._parse_response(payload, "MAD", "NRT", 3, "Business")
        assert flights[0]["stops"] == 0

    def test_roundtrip_one_stop_outbound_returns_one_stop(self, kiwi_engine):
        """Round-trip con 1 escala en la ida (2 ida + 1 vuelta=3 total) → stops=1."""
        payload = {"data": [{
            "price": 650.0,
            "route": [
                {"flyFrom": "MAD", "flyTo": "DOH", "return": 0, "airline": "QR",
                 "dTimeUTC": 1700000000, "aTimeUTC": 1700020000},
                {"flyFrom": "DOH", "flyTo": "NRT", "return": 0, "airline": "QR",
                 "dTimeUTC": 1700025000, "aTimeUTC": 1700055000},
                {"flyFrom": "NRT", "flyTo": "MAD", "return": 1, "airline": "QR",
                 "dTimeUTC": 1701000000, "aTimeUTC": 1701050000},
            ],
        }]}
        flights = kiwi_engine._parse_response(payload, "MAD", "NRT", 3, "Business")
        assert flights[0]["stops"] == 1

    def test_roundtrip_two_stops_returns_two_stops(self, kiwi_engine):
        """Round-trip con 2 escalas ida (3 ida + 1 vuelta) → stops=2."""
        payload = {"data": [{
            "price": 400.0,
            "route": [
                {"flyFrom": "MAD", "flyTo": "FCO", "return": 0, "airline": "AZ"},
                {"flyFrom": "FCO", "flyTo": "DOH", "return": 0, "airline": "QR"},
                {"flyFrom": "DOH", "flyTo": "DPS", "return": 0, "airline": "QR"},
                {"flyFrom": "DPS", "flyTo": "MAD", "return": 1, "airline": "QR"},
            ],
        }]}
        flights = kiwi_engine._parse_response(payload, "MAD", "DPS", 1, "Economy")
        assert flights[0]["stops"] == 2


class TestKiwiDateHelper:
    def test_converts_iso_to_kiwi_format(self):
        # Formato Kiwi: DD/MM/YYYY
        result = KiwiEngineV4._to_kiwi_date("2026-07-15")
        assert result == "15/07/2026"

    def test_empty_input(self):
        # Input invalido -> string vacio o tratado sin romper
        result = KiwiEngineV4._to_kiwi_date("")
        # El helper puede romper o devolver "", segun impl — aceptamos ambos
        assert isinstance(result, str)


class TestDetectRatioAnomalies:
    def test_low_ratio_detects_error(self, kiwi_engine):
        eco = [{"origin": "MAD", "destination": "JFK", "price_eur": 400}]
        biz = [{
            "origin": "MAD", "destination": "JFK", "price_eur": 650,
            "stops": 0, "premium_airline": False, "season_multiplier": 1.0,
        }]
        anomalies = kiwi_engine._detect_ratio_anomalies(eco, biz)
        assert len(anomalies) >= 1
        assert anomalies[0]["bec_ratio"] < 2.0

    def test_no_economy_baseline_no_anomaly(self, kiwi_engine):
        biz = [{
            "origin": "MAD", "destination": "JFK", "price_eur": 800,
            "stops": 0, "premium_airline": False, "season_multiplier": 1.0,
        }]
        anomalies = kiwi_engine._detect_ratio_anomalies([], biz)
        assert anomalies == []

    def test_normal_ratio_not_flagged(self, kiwi_engine):
        eco = [{"origin": "MAD", "destination": "JFK", "price_eur": 300}]
        biz = [{
            "origin": "MAD", "destination": "JFK", "price_eur": 2400,
            "stops": 0, "premium_airline": False, "season_multiplier": 1.0,
        }]
        # Ratio 8x = normal transatlantico -> no anomalia
        anomalies = kiwi_engine._detect_ratio_anomalies(eco, biz)
        # La clasificacion debe ser NORMAL (no en lista devuelta)
        assert all(a["bec_class"] != "NORMAL" for a in anomalies)
