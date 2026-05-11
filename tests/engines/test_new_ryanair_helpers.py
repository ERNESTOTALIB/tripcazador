"""
test_new_ryanair_helpers.py — May 2026
========================================
Cobertura para helpers internos de ryanair_engine.py:
- _flight_to_dict() y _trip_to_dict() (formato de salida estándar V4)
- RYANAIR_STRONG_HUBS coherencia

No requiere `ryanair-py` instalado — usa mocks para los objetos de la librería.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

import ryanair_engine as re_eng  # type: ignore[import-not-found]


def _mock_flight(origin="MAD", destination="STN",
                 dest_full="Londres Stansted, Reino Unido",
                 price=29.99,
                 dep="2026-08-15 06:30",
                 arr="2026-08-15 08:00",
                 flight_no="FR1234",
                 origin_full="Madrid Barajas, España"):
    return SimpleNamespace(
        origin=origin,
        originFull=origin_full,
        destination=destination,
        destinationFull=dest_full,
        price=price,
        departureTime=datetime.strptime(dep, "%Y-%m-%d %H:%M"),
        arrivalTime=datetime.strptime(arr, "%Y-%m-%d %H:%M"),
        flightNumber=flight_no,
    )


class TestFlightToDict:
    def test_basic_fields(self):
        flight = _mock_flight()
        d = re_eng._flight_to_dict(flight)
        assert d["source"] == "ryanair"
        assert d["airline"] == "FR"
        assert d["airline_name"] == "Ryanair"
        assert d["origin"] == "MAD"
        assert d["destination"] == "STN"
        assert d["price_eur"] == 29.99
        assert d["stops"] == 0  # Ryanair siempre directo

    def test_city_country_split(self):
        flight = _mock_flight(dest_full="Roma Fiumicino, Italia")
        d = re_eng._flight_to_dict(flight)
        assert d["city_to"] == "Roma Fiumicino"
        assert d["country_to"] == "Italia"

    def test_no_comma_dest_full(self):
        # destFull sin coma → usar entero como city
        flight = _mock_flight(dest_full="LondonOnly")
        d = re_eng._flight_to_dict(flight)
        assert d["city_to"] == "LondonOnly"
        assert d["country_to"] == ""

    def test_booking_url_correct(self):
        flight = _mock_flight(origin="BCN", destination="DUB", dep="2026-09-01 10:00", arr="2026-09-01 12:30")
        d = re_eng._flight_to_dict(flight)
        url = d["booking_url"]
        assert "ryanair.com" in url
        assert "BCN" in url
        assert "DUB" in url
        assert "2026-09-01" in url

    def test_duration_minutes_calculated(self):
        # 06:30 → 08:00 = 90 min
        flight = _mock_flight(dep="2026-08-15 06:30", arr="2026-08-15 08:00")
        d = re_eng._flight_to_dict(flight)
        assert d["duration_min"] == 90

    def test_distance_category(self):
        flight = _mock_flight(destination="STN")
        d = re_eng._flight_to_dict(flight)
        # STN está en hubs Ryanair / Europa → corto
        assert d["distance_category"] == "corto"

    def test_return_price_addition(self):
        flight = _mock_flight(price=29.99)
        d = re_eng._flight_to_dict(flight, return_price=20.0)
        # Solo se suma si return_price > 0
        assert d["price_eur"] == 49.99

    def test_cabin_default_economy(self):
        flight = _mock_flight()
        d = re_eng._flight_to_dict(flight)
        assert d["cabin"] == "economy"

    def test_raw_string_present(self):
        flight = _mock_flight()
        d = re_eng._flight_to_dict(flight)
        assert "raw" in d
        assert isinstance(d["raw"], str)


class TestTripToDict:
    def _mock_trip(self):
        out = _mock_flight(origin="MAD", destination="STN",
                           dep="2026-08-15 10:00", arr="2026-08-15 12:30")
        ret = _mock_flight(origin="STN", destination="MAD",
                           dep="2026-08-22 14:00", arr="2026-08-22 17:00")
        # set ret price
        out.price = 35.0
        ret.price = 45.0
        return SimpleNamespace(
            outbound=out,
            inbound=ret,
            totalPrice=80.0,
        )

    def test_trip_to_dict_total(self):
        trip = self._mock_trip()
        d = re_eng._trip_to_dict(trip)
        assert d["price_eur"] == 80.0
        assert d["price_outbound"] == 35.0
        assert d["price_inbound"] == 45.0

    def test_trip_dates(self):
        trip = self._mock_trip()
        d = re_eng._trip_to_dict(trip)
        assert d["date_out"] == "2026-08-15"
        assert d["date_ret"] == "2026-08-22"

    def test_trip_nights_calculated(self):
        trip = self._mock_trip()
        d = re_eng._trip_to_dict(trip)
        # 22 - 15 = 7 nights
        assert d["nights"] == 7

    def test_trip_booking_url_return_param(self):
        trip = self._mock_trip()
        d = re_eng._trip_to_dict(trip)
        url = d["booking_url"]
        assert "isReturn=true" in url
        assert "MAD" in url and "STN" in url


class TestRyanairHubs:
    def test_spain_hubs_present(self):
        for code in ["MAD", "BCN", "VLC", "AGP", "PMI"]:
            assert code in re_eng.RYANAIR_STRONG_HUBS, f"{code} missing"

    def test_uk_hubs_present(self):
        for code in ["STN", "LTN", "MAN", "EDI"]:
            assert code in re_eng.RYANAIR_STRONG_HUBS, f"{code} missing"

    def test_no_duplicates(self):
        assert len(re_eng.RYANAIR_STRONG_HUBS) == len(set(re_eng.RYANAIR_STRONG_HUBS))

    def test_all_uppercase_3letter(self):
        for h in re_eng.RYANAIR_STRONG_HUBS:
            assert len(h) == 3, f"bad len: {h!r}"
            assert h == h.upper(), f"not upper: {h!r}"


class TestRyanairEngineConstructor:
    def test_engine_available_flag(self):
        # Si ryanair-py no instalado, available=False; sino True
        eng = re_eng.RyanairEngine()
        assert isinstance(eng.available, bool)

    def test_engine_currency(self):
        eng = re_eng.RyanairEngine(currency="EUR")
        assert eng.currency == "EUR"

    def test_engine_currency_default(self):
        eng = re_eng.RyanairEngine()
        assert eng.currency == "EUR"
