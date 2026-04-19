"""
Engine tests: vueling_engine.py — normalizacion de respuestas Vueling.
"""
from __future__ import annotations

import pytest

import config
from vueling_engine import _vueling_calendar_to_dict, _vueling_flight_to_dict


class TestVuelingFlightToDict:
    def test_parses_happy_path(self, vueling_response_json):
        item = vueling_response_json["flights"][0]
        d = _vueling_flight_to_dict(item, origin="BCN")
        assert d is not None
        assert d["source"] == "vueling"
        assert d["origin"] == "BCN"
        assert d["destination"] == "FCO"
        assert d["price_eur"] == 45.99
        assert d["airline"] == "VY"
        assert d["cabin"] == "economy"

    def test_zero_price_returns_none(self):
        item = {"arrivalStation": "FCO", "amount": 0, "departureDate": "2026-05-10"}
        assert _vueling_flight_to_dict(item, "BCN") is None

    def test_missing_destination_returns_none(self):
        item = {"arrivalStation": "", "amount": 50, "departureDate": "2026-05-10"}
        assert _vueling_flight_to_dict(item, "BCN") is None

    def test_booking_url_populated(self, vueling_response_json):
        item = vueling_response_json["flights"][0]
        d = _vueling_flight_to_dict(item, "BCN")
        assert d["booking_url"].startswith("http")

    def test_alternate_price_key_amount_vs_price(self):
        # El parser acepta 'amount' o 'price'
        item1 = {"arrivalStation": "FCO", "amount": 60, "departureDate": "2026-05-10"}
        item2 = {"arrivalStation": "FCO", "price": 60, "departureDate": "2026-05-10"}
        d1 = _vueling_flight_to_dict(item1, "BCN")
        d2 = _vueling_flight_to_dict(item2, "BCN")
        assert d1["price_eur"] == d2["price_eur"] == 60


class TestVuelingCalendarToDict:
    def test_parses_calendar_entry(self):
        item = {"amount": 39.5, "departureDate": "2026-06-15T00:00:00"}
        d = _vueling_calendar_to_dict(item, origin="BCN", dest="FCO")
        assert d is not None
        assert d["price_eur"] == 39.5
        assert d["date_out"] == "2026-06-15"
        assert d["destination"] == "FCO"

    def test_calendar_zero_price_skipped(self):
        item = {"amount": 0, "departureDate": "2026-06-15"}
        assert _vueling_calendar_to_dict(item, "BCN", "FCO") is None
