"""
Engine tests: ryanair_engine.py — conversion Flight/Trip -> dict estandar.
No llama a la API real: construye mocks del objeto Flight de ryanair-py.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

import config
from ryanair_engine import RYANAIR_STRONG_HUBS, _flight_to_dict, _trip_to_dict


def _make_flight(
    origin="BSL", destination="PMI", price=29.99,
    departure_offset_days=30, duration_min=120, base_time=None,
):
    """Construye un objeto Flight fake compatible con ryanair-py.

    Si `base_time` se pasa, se usa como referencia fija (para que múltiples
    llamadas en un mismo test compartan el mismo "ahora" y no se rompa por
    cruce de medianoche entre invocaciones consecutivas).
    """
    now = base_time if base_time is not None else datetime.now()
    # Normalizamos a mediodía para evitar que sumar la duración del vuelo
    # cruce una frontera de día y altere el cálculo de `nights`.
    now = now.replace(hour=12, minute=0, second=0, microsecond=0)
    dep = now + timedelta(days=departure_offset_days)
    arr = dep + timedelta(minutes=duration_min)
    return SimpleNamespace(
        origin=origin,
        originFull=f"{origin}, Testland",
        destination=destination,
        destinationFull=f"Destino {destination}, Pais {destination}",
        departureTime=dep,
        arrivalTime=arr,
        price=price,
        flightNumber=f"FR{hash(destination) % 10000}",
    )


def _make_trip(out_price=30, in_price=35):
    # Compartimos un mismo `base_time` entre outbound e inbound para que la
    # diferencia de fechas sea exactamente la esperada por el test.
    base = datetime.now()
    out = _make_flight(departure_offset_days=30, base_time=base)
    ret = _make_flight(origin=out.destination, destination=out.origin,
                       departure_offset_days=37, base_time=base)
    out.price = out_price
    ret.price = in_price
    return SimpleNamespace(
        outbound=out, inbound=ret, totalPrice=out_price + in_price,
    )


class TestFlightToDict:
    def test_basic_conversion(self):
        flight = _make_flight(origin="BSL", destination="PMI", price=25.0)
        d = _flight_to_dict(flight)
        assert d["source"] == "ryanair"
        assert d["origin"] == "BSL"
        assert d["destination"] == "PMI"
        assert d["price_eur"] == 25.0
        assert d["airline"] == "FR"
        assert d["airline_name"] == "Ryanair"
        assert d["stops"] == 0
        assert d["cabin"] == "economy"

    def test_booking_url_has_iata_and_date(self):
        flight = _make_flight(origin="MAD", destination="FCO")
        d = _flight_to_dict(flight)
        assert "ryanair.com" in d["booking_url"]
        assert "originIata=MAD" in d["booking_url"]
        assert "destinationIata=FCO" in d["booking_url"]

    def test_parses_city_and_country_from_full_name(self):
        flight = _make_flight(destination="FCO")
        flight.destinationFull = "Rome Fiumicino, Italy"
        d = _flight_to_dict(flight)
        assert d["city_to"] == "Rome Fiumicino"
        assert d["country_to"] == "Italy"

    def test_return_price_added(self):
        flight = _make_flight(price=30)
        d = _flight_to_dict(flight, return_price=25)
        assert d["price_eur"] == 55


class TestTripToDict:
    def test_basic_roundtrip_conversion(self):
        trip = _make_trip(out_price=30, in_price=45)
        d = _trip_to_dict(trip)
        assert d["source"] == "ryanair"
        assert d["price_eur"] == 75.0
        assert d["price_outbound"] == 30.0
        assert d["price_inbound"] == 45.0
        assert d["stops"] == 0
        assert d["nights"] >= 0

    def test_nights_calculated_from_dates(self):
        trip = _make_trip()
        d = _trip_to_dict(trip)
        # Delta entre out (+30d) y ret (+37d) = 7 noches
        assert d["nights"] == 7


class TestStrongHubsCoverage:
    def test_ryanair_strong_hubs_are_valid_iata_codes(self):
        for code in RYANAIR_STRONG_HUBS:
            assert isinstance(code, str) and 3 <= len(code) <= 4

    def test_major_spanish_airports_included(self):
        assert "MAD" in RYANAIR_STRONG_HUBS
        assert "BCN" in RYANAIR_STRONG_HUBS

    def test_includes_dublin_ryanair_home(self):
        assert "DUB" in RYANAIR_STRONG_HUBS
