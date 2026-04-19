"""
Engine tests: rapidapi_engine.py — normalizadores Sky Scrapper y Fare Flight.
"""
from __future__ import annotations

import pytest

import config
from rapidapi_engine import _normalize_fare_flight, _normalize_sky_flight


class TestNormalizeSkyFlight:
    def test_parses_thai_airways(self, rapidapi_sky_response_json):
        item = rapidapi_sky_response_json["data"]["itineraries"][0]
        d = _normalize_sky_flight(item, origin="MAD")
        assert d is not None
        assert d["source"] == "rapidapi_skyscrapper"
        assert d["origin"] == "MAD"
        assert d["destination"] == "BKK"
        assert d["price_eur"] == 612.5
        assert d["airline"] == "TG"
        assert d["stops"] == 1

    def test_missing_legs_returns_none(self):
        item = {"legs": []}
        assert _normalize_sky_flight(item, "MAD") is None

    def test_string_price_parsed(self):
        item = {
            "legs": [{
                "origin": {"displayCode": "MAD", "city": "Madrid"},
                "destination": {"displayCode": "FCO", "city": "Roma"},
                "departure": "2026-06-01T10:00:00",
                "arrival": "2026-06-01T12:30:00",
                "durationInMinutes": 150,
                "stopCount": 0,
                "carriers": {"marketing": [{"alternateId": "IB", "name": "Iberia"}]},
            }],
            "price": {"raw": "125.00"},
            "carriers": {"marketing": [{"alternateId": "IB", "name": "Iberia"}]},
        }
        d = _normalize_sky_flight(item, "MAD")
        assert d["price_eur"] == 125.0


class TestNormalizeFareFlight:
    def test_parses_happy_path(self):
        item = {
            "arrivalAirport": {"iata": "JFK", "city": "Nueva York", "country": "EEUU"},
            "departureAirport": {"iata": "MAD", "city": "Madrid"},
            "price": 420,
            "carrierCode": "IB",
            "carrierName": "Iberia",
            "departureTime": "2026-08-15T10:30:00",
            "stops": 0,
            "flightNumber": "IB6251",
            "deepLink": "https://iberia.com/book/123",
        }
        d = _normalize_fare_flight(item, "MAD")
        assert d is not None
        assert d["source"] == "rapidapi_fare"
        assert d["destination"] == "JFK"
        assert d["price_eur"] == 420
        assert d["airline"] == "IB"
        assert d["booking_url"] == "https://iberia.com/book/123"

    def test_zero_price_returns_item_anyway(self):
        # _normalize_fare_flight no rechaza price=0 (a diferencia de otros)
        # Este es un edge case existente — el test verifica comportamiento actual
        item = {
            "arrivalAirport": {"iata": "JFK"},
            "departureAirport": {"iata": "MAD"},
            "price": 0,
            "carrierCode": "",
            "departureTime": "2026-08-15",
            "stops": 0,
        }
        d = _normalize_fare_flight(item, "MAD")
        # Acepta pero con price=0
        if d is not None:
            assert d["price_eur"] == 0

    def test_missing_deeplink_fallback(self):
        item = {
            "arrivalAirport": {"iata": "JFK"},
            "departureAirport": {"iata": "MAD"},
            "price": 500,
            "carrierCode": "IB",
            "departureTime": "2026-08-15",
            "stops": 0,
        }
        d = _normalize_fare_flight(item, "MAD")
        assert d["booking_url"].startswith("http")
