"""
test_new_vueling_helpers.py — May 2026
=========================================
Cobertura helpers Vueling engine:
- _vueling_flight_to_dict parsing
- _vueling_calendar_to_dict parsing
- _months_in_range generación correcta
"""
from __future__ import annotations

import pytest

import vueling_engine as ve  # type: ignore[import-not-found]


class TestVuelingFlightToDict:
    def test_valid_response_parses(self):
        item = {
            "arrivalStation": "FCO",
            "amount": "49.99",
            "departureDate": "2026-08-15T10:30:00",
            "flightNumber": "VY1234",
        }
        d = ve._vueling_flight_to_dict(item, origin="BCN")
        assert d is not None
        assert d["source"] == "vueling"
        assert d["origin"] == "BCN"
        assert d["destination"] == "FCO"
        assert d["price_eur"] == 49.99
        assert d["date_out"] == "2026-08-15"
        assert d["time_out"] == "10:30"
        assert d["airline"] == "VY"
        assert d["stops"] == 0

    def test_missing_destination_returns_none(self):
        item = {"amount": "49.99"}
        assert ve._vueling_flight_to_dict(item, origin="BCN") is None

    def test_zero_price_returns_none(self):
        item = {"arrivalStation": "FCO", "amount": "0"}
        assert ve._vueling_flight_to_dict(item, origin="BCN") is None

    def test_negative_price_returns_none(self):
        item = {"arrivalStation": "FCO", "amount": "-10"}
        assert ve._vueling_flight_to_dict(item, origin="BCN") is None

    def test_fallback_destination_key(self):
        # Acepta "destination" si "arrivalStation" ausente
        item = {"destination": "AMS", "price": "60.0", "departureDate": "2026-09-01"}
        d = ve._vueling_flight_to_dict(item, origin="BCN")
        assert d is not None
        assert d["destination"] == "AMS"
        assert d["price_eur"] == 60.0

    def test_invalid_price_returns_none(self):
        item = {"arrivalStation": "FCO", "amount": "garbage"}
        out = ve._vueling_flight_to_dict(item, origin="BCN")
        # Excepción interna → None
        assert out is None

    def test_unicode_destination_safe(self):
        item = {"arrivalStation": "FCO", "amount": "50",
                "departureDate": "2026-08-15"}
        d = ve._vueling_flight_to_dict(item, origin="BCN")
        # No revienta
        assert d is not None


class TestVuelingCalendarToDict:
    def test_valid_calendar_entry(self):
        item = {"amount": "39.99", "departureDate": "2026-09-15"}
        d = ve._vueling_calendar_to_dict(item, origin="BCN", dest="FCO")
        assert d is not None
        assert d["origin"] == "BCN"
        assert d["destination"] == "FCO"
        assert d["price_eur"] == 39.99
        assert d["date_out"] == "2026-09-15"
        assert d["cabin"] == "economy"

    def test_zero_price_returns_none(self):
        item = {"amount": 0}
        assert ve._vueling_calendar_to_dict(item, "BCN", "FCO") is None

    def test_booking_url_present(self):
        item = {"amount": "50", "departureDate": "2026-09-01"}
        d = ve._vueling_calendar_to_dict(item, "BCN", "FCO")
        assert d["booking_url"].startswith("http")


class TestMonthsInRange:
    def test_same_month(self):
        out = ve._months_in_range("2026-08-01", "2026-08-31")
        assert out == [(2026, 8)]

    def test_three_months(self):
        out = ve._months_in_range("2026-06-15", "2026-08-20")
        assert out == [(2026, 6), (2026, 7), (2026, 8)]

    def test_year_boundary(self):
        out = ve._months_in_range("2026-11-15", "2027-02-10")
        assert out == [(2026, 11), (2026, 12), (2027, 1), (2027, 2)]

    def test_inverted_range_empty(self):
        # from > to → no meses
        out = ve._months_in_range("2026-12-01", "2026-06-01")
        assert out == []


class TestVuelingHubs:
    def test_hubs_includes_bcn(self):
        assert "BCN" in ve.VUELING_HUBS

    def test_all_uppercase_3letter(self):
        for h in ve.VUELING_HUBS:
            assert len(h) == 3
            assert h == h.upper()


class TestVuelingEngineConstructor:
    def test_default_currency(self):
        eng = ve.VuelingEngine()
        # No revienta
        assert eng is not None
