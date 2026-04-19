"""
Engine tests: travelpayouts_engine.py — conversion de respuestas Aviasales.
"""
from __future__ import annotations

import pytest

import config
from travelpayouts_engine import _tp_to_dict


class TestTpToDict:
    def test_parses_happy_path(self, travelpayouts_response_json):
        item = travelpayouts_response_json["data"][0]
        d = _tp_to_dict(item, origin="MAD", destination="CUN")
        assert d is not None
        assert d["source"] == "travelpayouts"
        assert d["origin"] == "MAD"
        assert d["destination"] == "CUN"
        # Conversion USD -> EUR aplicada (x0.92)
        assert d["price_eur"] == round(385 * 0.92, 2)
        assert d["airline"] == "UX"
        assert d["airline_name"] == "Air Europa"

    def test_zero_price_returns_none(self):
        item = {"price": 0, "destination": "CUN", "airline": "UX"}
        assert _tp_to_dict(item, "MAD", "CUN") is None

    def test_missing_destination_returns_none(self):
        item = {"price": 100, "airline": "UX"}
        assert _tp_to_dict(item, "MAD", "") is None

    def test_transfers_mapped_to_stops(self, travelpayouts_response_json):
        item1 = travelpayouts_response_json["data"][0]  # transfers=0
        item2 = travelpayouts_response_json["data"][1]  # transfers=1
        d1 = _tp_to_dict(item1, "MAD", "CUN")
        d2 = _tp_to_dict(item2, "MAD", "CUN")
        assert d1["stops"] == 0
        assert d2["stops"] == 1

    def test_date_fields_populated(self, travelpayouts_response_json):
        item = travelpayouts_response_json["data"][0]
        d = _tp_to_dict(item, "MAD", "CUN")
        assert d["date_out"] == "2026-11-10"
        assert d["date_ret"] == "2026-11-24"

    def test_fallback_destination_param(self):
        # Si el item no trae destino pero se pasa como arg, debe usarlo
        item = {"price": 300, "airline": "IB", "departure_at": "2026-07-01"}
        d = _tp_to_dict(item, origin="MAD", destination="JFK")
        assert d is not None
        assert d["destination"] == "JFK"

    def test_booking_url_respects_airline(self, travelpayouts_response_json):
        item = travelpayouts_response_json["data"][0]
        d = _tp_to_dict(item, "MAD", "CUN")
        assert d["booking_url"].startswith("http")
