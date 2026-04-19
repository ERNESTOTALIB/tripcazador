"""
Unit tests: airline_links.py — URL builders + travelpayouts marker injection
"""
from __future__ import annotations

import importlib

import pytest


def _reload_with_marker(monkeypatch, marker: str):
    """Reimporta airline_links con TP_MARKER sobrescrito para el test."""
    monkeypatch.setenv("TP_MARKER", marker)
    import airline_links  # type: ignore
    importlib.reload(airline_links)
    return airline_links


class TestKayakUrl:
    def test_roundtrip_has_both_dates(self):
        from airline_links import kayak_url
        url = kayak_url("MAD", "BCN", "2026-06-10", "2026-06-17")
        assert "MAD-BCN" in url
        assert "2026-06-10" in url
        assert "2026-06-17" in url
        assert "kayak.es" in url

    def test_oneway_only_depart_date(self):
        from airline_links import kayak_url
        url = kayak_url("MAD", "BCN", "2026-06-10")
        assert "2026-06-17" not in url
        assert "2026-06-10" in url


class TestRyanairUrl:
    def test_includes_iata_and_date(self):
        from airline_links import ryanair_url
        url = ryanair_url("BSL", "PMI", "2026-07-01", "2026-07-08")
        assert "ryanair.com" in url
        assert "originIata=BSL" in url
        assert "destinationIata=PMI" in url
        assert "dateOut=2026-07-01" in url

    def test_oneway_marks_isReturn_false(self):
        from airline_links import ryanair_url
        url = ryanair_url("BSL", "PMI", "2026-07-01")
        assert "isReturn=false" in url


class TestEasyjetAndWizzairUrls:
    def test_easyjet_lowercases_iata(self):
        from airline_links import easyjet_url
        url = easyjet_url("LHR", "BCN", "2026-08-10")
        assert "easyjet.com" in url
        assert "/lhr/bcn" in url

    def test_wizzair_has_isRoundTrip_param(self):
        from airline_links import wizzair_url
        url = wizzair_url("BUD", "WAW", "2026-09-01", "2026-09-07")
        assert "wizzair.com" in url
        assert "isRoundTrip=true" in url

    def test_wizzair_oneway(self):
        from airline_links import wizzair_url
        url = wizzair_url("BUD", "WAW", "2026-09-01")
        assert "isRoundTrip=false" in url


class TestTravelpayoutsUrl:
    def test_with_marker_injects_affiliate(self, monkeypatch):
        mod = _reload_with_marker(monkeypatch, "123456")
        url = mod.travelpayouts_url("MAD", "CUN", "2026-10-15", "2026-10-29")
        assert "aviasales.es" in url
        assert "marker=123456" in url
        # Formato DDMM comprimido
        assert "1510" in url  # 15 oct -> "1510"
        assert "MAD" in url and "CUN" in url

    def test_without_marker_falls_back_kayak(self, monkeypatch):
        mod = _reload_with_marker(monkeypatch, "")
        url = mod.travelpayouts_url("MAD", "CUN", "2026-10-15")
        assert "kayak.es" in url
        assert "aviasales" not in url

    def test_marker_oneway_trip_format(self, monkeypatch):
        mod = _reload_with_marker(monkeypatch, "777")
        url = mod.travelpayouts_url("MAD", "JFK", "2026-12-05")
        assert "marker=777" in url
        # Solo ida: debe aparecer MAD...JFK sin segunda pata
        assert url.count("MAD") >= 1


class TestGetBookingUrl:
    def test_ryanair_goes_to_ryanair_site(self):
        from airline_links import get_booking_url
        url = get_booking_url("FR", "STN", "PMI", "2026-08-15")
        assert "ryanair.com" in url

    def test_easyjet_goes_to_easyjet_site(self):
        from airline_links import get_booking_url
        url = get_booking_url("U2", "LGW", "BCN", "2026-08-15")
        assert "easyjet.com" in url

    def test_unknown_airline_falls_back_to_travelpayouts_or_kayak(self, monkeypatch):
        # Sin marker, debe caer en Kayak
        monkeypatch.setenv("TP_MARKER", "")
        import airline_links as mod
        importlib.reload(mod)
        url = mod.get_booking_url("XX", "MAD", "FCO", "2026-06-01")
        assert "kayak.es" in url


class TestAirlineNames:
    def test_known_codes_have_names(self):
        from airline_links import get_airline_name
        assert get_airline_name("FR") == "Ryanair"
        assert get_airline_name("IB") == "Iberia"
        assert get_airline_name("EK") == "Emirates"

    def test_unknown_returns_code(self):
        from airline_links import get_airline_name
        assert get_airline_name("ZZ") == "ZZ"

    def test_empty_name(self):
        from airline_links import get_airline_name
        assert get_airline_name("") == "?"


class TestNameToIata:
    def test_common_names_map_to_codes(self):
        from airline_links import name_to_iata
        assert name_to_iata("Ryanair") == "FR"
        assert name_to_iata("Iberia") == "IB"
        assert name_to_iata("Air France") == "AF"

    def test_case_insensitive(self):
        from airline_links import name_to_iata
        assert name_to_iata("RYANAIR") == "FR"
        assert name_to_iata("ryanair") == "FR"

    def test_unknown_returns_input(self):
        from airline_links import name_to_iata
        result = name_to_iata("Aerolinea Marciana")
        assert result in ("Aerolinea Marciana", "?")
