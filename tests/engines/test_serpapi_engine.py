"""
Engine tests: serpapi_engine.py — parseo de Google Flights via SerpAPI.
"""
from __future__ import annotations

import pytest

import config
from serpapi_engine import _gf_flight_to_dict


class TestGfFlightToDict:
    def test_parses_iberia_direct(self, serpapi_response_json):
        item = serpapi_response_json["best_flights"][0]
        d = _gf_flight_to_dict(
            item, origin="MAD", destination="JFK",
            cabin_code_gf=1, date_out="2026-08-12",
        )
        assert d is not None
        assert d["source"] == "serpapi"
        assert d["origin"] == "MAD"
        assert d["destination"] == "JFK"
        assert d["price_eur"] == 385.0
        assert d["airline"] == "IB"  # Mapeado desde "Iberia"
        assert d["stops"] == 0

    def test_zero_price_returns_none(self):
        item = {"price": 0, "flights": []}
        d = _gf_flight_to_dict(item, "MAD", "JFK", 1, "2026-08-12")
        assert d is None

    def test_stops_from_layovers(self, serpapi_response_json):
        item = serpapi_response_json["other_flights"][0]
        d = _gf_flight_to_dict(
            item, origin="MAD", destination="JFK",
            cabin_code_gf=1, date_out="2026-08-12",
        )
        assert d["stops"] == 1

    def test_airline_name_normalization(self, serpapi_response_json):
        item = serpapi_response_json["other_flights"][0]
        d = _gf_flight_to_dict(
            item, origin="MAD", destination="JFK",
            cabin_code_gf=1, date_out="2026-08-12",
        )
        # "British Airways" -> BA
        assert d["airline"] == "BA"

    def test_booking_url_generated(self, serpapi_response_json):
        item = serpapi_response_json["best_flights"][0]
        d = _gf_flight_to_dict(
            item, origin="MAD", destination="JFK",
            cabin_code_gf=1, date_out="2026-08-12",
        )
        assert d["booking_url"].startswith("http")
