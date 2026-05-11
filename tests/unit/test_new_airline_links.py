"""
test_new_airline_links.py — May 2026
=====================================
Cobertura para airline_links: deeplinks por aerolínea, fallback Travelpayouts,
name_to_iata mapping, enrich_flight() roundtrip.
"""
from __future__ import annotations

import re

import pytest

import airline_links as al  # type: ignore[import-not-found]


class TestKayakUrl:
    def test_basic_url(self):
        url = al.kayak_url("MAD", "FCO", "2026-08-15", "2026-08-22")
        assert "kayak.es" in url or "kayak" in url.lower()
        assert "MAD" in url and "FCO" in url

    def test_no_return_date(self):
        url = al.kayak_url("MAD", "FCO", "2026-08-15")
        assert "MAD" in url

    def test_yymmdd_format(self):
        # Internal helper convierte ISO a YYMMDD
        # kayak espera fechas YYMMDD compactas
        url = al.kayak_url("BCN", "JFK", "2026-12-25", "2026-12-31")
        # Algún token con la fecha
        assert "261225" in url or "2026-12-25" in url


class TestRyanairUrl:
    def test_url_includes_iata(self):
        url = al.ryanair_url("MAD", "STN", "2026-06-15", "2026-06-20")
        assert "ryanair.com" in url
        assert "MAD" in url
        assert "STN" in url

    def test_url_includes_dates(self):
        url = al.ryanair_url("BCN", "DUB", "2026-06-15", "2026-06-20")
        assert "2026-06-15" in url
        assert "2026-06-20" in url


class TestEasyJetUrl:
    def test_url_format(self):
        url = al.easyjet_url("LGW", "BCN", "2026-07-01")
        assert "easyjet.com" in url


class TestWizzairUrl:
    def test_url_format(self):
        url = al.wizzair_url("BUD", "BCN", "2026-07-01")
        assert "wizzair.com" in url


class TestGetBookingUrl:
    def test_ryanair_code(self):
        url = al.get_booking_url("FR", "MAD", "STN", "2026-08-01", "2026-08-08")
        assert "ryanair" in url.lower()

    def test_easyjet_code(self):
        url = al.get_booking_url("U2", "MAD", "LGW", "2026-08-01")
        assert "easyjet" in url.lower()

    def test_vueling_code(self):
        url = al.get_booking_url("VY", "BCN", "FCO", "2026-08-01")
        # Vueling tiene builder propio o cae a fallback con vy hint
        assert "vueling" in url.lower() or "tp.media" in url or "aviasales" in url or "kayak" in url

    def test_unknown_airline_falls_back(self):
        # Aerolínea sin builder explícito → fallback TP/Kayak
        url = al.get_booking_url("XX", "MAD", "BCN", "2026-08-01")
        assert isinstance(url, str)
        assert len(url) > 10
        assert url.startswith("http")

    def test_empty_airline_code(self):
        url = al.get_booking_url("", "MAD", "BCN", "2026-08-01")
        # Cae a fallback Travelpayouts/Kayak
        assert url.startswith("http")

    def test_lowercase_code_normalized(self):
        url1 = al.get_booking_url("fr", "MAD", "STN", "2026-08-01")
        url2 = al.get_booking_url("FR", "MAD", "STN", "2026-08-01")
        assert url1 == url2


class TestAirlineNames:
    @pytest.mark.parametrize("code, expected_substring", [
        ("FR", "Ryanair"),
        ("IB", "Iberia"),
        ("U2", "easyJet"),
        ("VY", "Vueling"),
        ("BA", "British"),
        ("LH", "Lufthansa"),
        ("AF", "Air France"),
        ("KL", "KLM"),
        ("TP", "TAP"),
        ("AZ", "ITA"),
        ("EK", "Emirates"),
        ("QR", "Qatar"),
        ("SQ", "Singapore"),
    ])
    def test_known_airline_names(self, code, expected_substring):
        name = al.get_airline_name(code)
        assert expected_substring.lower() in name.lower()

    def test_unknown_returns_code(self):
        # Código inexistente → devuelve el código tal cual o ?
        out = al.get_airline_name("Z9")
        assert out in {"Z9", "?"}

    def test_empty_input(self):
        # Empty → "?"
        assert al.get_airline_name("") == "?"


class TestNameToIata:
    @pytest.mark.parametrize("name, code", [
        ("Ryanair", "FR"),
        ("ryanair", "FR"),
        ("RYANAIR", "FR"),
        ("Vueling", "VY"),
        ("easyJet", "U2"),
        ("Iberia", "IB"),
        ("Air France", "AF"),
        ("British Airways", "BA"),
        ("Lufthansa", "LH"),
        ("KLM", "KL"),
        ("Emirates", "EK"),
        ("Qatar Airways", "QR"),
    ])
    def test_common_name_to_iata(self, name, code):
        assert al.name_to_iata(name) == code

    def test_unknown_name_returns_original(self):
        # Una aerolínea que NO existe en el mapa
        out = al.name_to_iata("AirlineThatDoesNotExist123")
        # Devuelve el input original (no string vacío, no None)
        assert out == "AirlineThatDoesNotExist123"

    def test_empty_returns_question(self):
        # Empty string → "?"
        assert al.name_to_iata("") == "?"

    def test_first_token_match(self):
        # "Wizz Air" → "wizz air" o sólo "wizz"
        code = al.name_to_iata("Wizz Air")
        assert code == "W6"


class TestEnrichFlight:
    def test_adds_booking_url(self):
        flight = {
            "airline": "FR",
            "origin": "MAD",
            "destination": "STN",
            "date_out": "2026-08-15",
        }
        out = al.enrich_flight(flight)
        assert "booking_url" in out
        assert out["booking_url"].startswith("http")
        assert "ryanair" in out["booking_url"].lower()

    def test_adds_airline_name(self):
        flight = {
            "airline": "IB",
            "origin": "MAD",
            "destination": "BCN",
            "date_out": "2026-08-15",
        }
        out = al.enrich_flight(flight)
        assert out["airline_name"] == "Iberia" or "Iberia" in out["airline_name"]

    def test_does_not_overwrite_airline_name(self):
        flight = {
            "airline": "FR",
            "airline_name": "Ryanair Custom",
            "origin": "MAD",
            "destination": "STN",
            "date_out": "2026-08-15",
        }
        out = al.enrich_flight(flight)
        assert out["airline_name"] == "Ryanair Custom"

    def test_returns_same_object(self):
        flight = {"airline": "FR", "origin": "MAD", "destination": "STN", "date_out": "2026-08-15"}
        out = al.enrich_flight(flight)
        assert out is flight

    def test_missing_fields_no_crash(self):
        # Sólo airline — date_out vacío
        flight = {"airline": "FR"}
        out = al.enrich_flight(flight)
        assert "booking_url" in out


class TestTravelpayoutsFallback:
    def test_returns_url(self):
        url = al.travelpayouts_url("MAD", "BCN", "2026-08-15", "2026-08-20")
        assert url.startswith("http")
        # Debe contener un dominio típico de Aviasales/Kayak
        assert any(d in url for d in ["aviasales", "tp.media", "kayak"])


class TestUrlSafety:
    @pytest.mark.parametrize("origin", ["MAD", "BCN"])
    @pytest.mark.parametrize("dest", ["FCO", "AMS", "CDG"])
    def test_no_javascript_protocol(self, origin, dest):
        url = al.get_booking_url("", origin, dest, "2026-08-15")
        assert not url.startswith("javascript:")
        assert "javascript:" not in url.lower()

    def test_unicode_input_does_not_crash(self):
        # Aerolíneas con caracteres raros pueden venir de SerpAPI
        out = al.name_to_iata("Iberia Líneas Aéreas")
        # No revienta, devuelve algo
        assert isinstance(out, str)
