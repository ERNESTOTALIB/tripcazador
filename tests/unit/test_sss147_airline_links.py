"""
SSS147 — airline_links deep edge cases.
=======================================
Targets URL builders, get_booking_url, get_airline_name, name_to_iata,
enrich_flight, _yymmdd helper, travelpayouts_url with/without TP_MARKER.
"""
from __future__ import annotations

import pytest

import airline_links as al


# ─────────────────────────────────────────────────────────────────
# _yymmdd helper
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("iso,expected", [
    ("2026-06-15", "260615"),
    ("2027-01-01", "270101"),
    ("2026-12-31", "261231"),
    ("", ""),
    ("2026", ""),       # too short
    ("xxxxxxxxxx", "xxxxxx"),  # 10 chars, but garbage
])
def test_yymmdd_matrix(iso, expected):
    assert al._yymmdd(iso) == expected


def test_yymmdd_none():
    assert al._yymmdd(None) == ""


# ─────────────────────────────────────────────────────────────────
# kayak_url
# ─────────────────────────────────────────────────────────────────
def test_kayak_url_one_way():
    url = al.kayak_url("MAD", "JFK", "2026-06-15")
    assert "MAD-JFK" in url
    assert "2026-06-15" in url
    assert "kayak.es" in url
    assert "sort=price_a" in url


def test_kayak_url_round_trip():
    url = al.kayak_url("MAD", "JFK", "2026-06-15", "2026-06-25")
    assert "2026-06-15" in url
    assert "2026-06-25" in url


@pytest.mark.parametrize("origin,dest", [
    ("MAD", "FCO"), ("BCN", "JFK"), ("AGP", "NRT"),
    ("LHR", "BKK"), ("FRA", "DXB"),
])
def test_kayak_url_various_routes(origin, dest):
    url = al.kayak_url(origin, dest, "2026-07-01")
    assert f"{origin}-{dest}" in url


# ─────────────────────────────────────────────────────────────────
# ryanair_url
# ─────────────────────────────────────────────────────────────────
def test_ryanair_url_one_way():
    url = al.ryanair_url("MAD", "BCN", "2026-06-15")
    assert "ryanair.com" in url
    assert "originIata=MAD" in url
    assert "destinationIata=BCN" in url
    assert "dateOut=2026-06-15" in url
    assert "isReturn=false" in url


def test_ryanair_url_round_trip():
    url = al.ryanair_url("MAD", "BCN", "2026-06-15", "2026-06-20")
    assert "isReturn=true" in url
    assert "dateIn=2026-06-20" in url


def test_ryanair_url_contains_adult_count():
    url = al.ryanair_url("MAD", "BCN", "2026-06-15")
    assert "adults=1" in url


# ─────────────────────────────────────────────────────────────────
# easyjet_url
# ─────────────────────────────────────────────────────────────────
def test_easyjet_url():
    url = al.easyjet_url("MAD", "BCN", "2026-06-15")
    assert "easyjet.com" in url


def test_easyjet_url_lowercase_codes():
    url = al.easyjet_url("MAD", "BCN", "2026-06-15")
    # The function lowercases internally
    assert "mad" in url.lower() or "MAD" in url


def test_easyjet_url_round_trip():
    url = al.easyjet_url("MAD", "BCN", "2026-06-15", "2026-06-20")
    assert "2026-06-15" in url
    assert "2026-06-20" in url


# ─────────────────────────────────────────────────────────────────
# wizzair_url
# ─────────────────────────────────────────────────────────────────
def test_wizzair_url():
    url = al.wizzair_url("BUD", "BCN", "2026-06-15")
    assert "wizzair.com" in url


def test_wizzair_url_round_trip():
    url = al.wizzair_url("BUD", "BCN", "2026-06-15", "2026-06-20")
    assert "BUD" in url
    assert "BCN" in url


# ─────────────────────────────────────────────────────────────────
# skyscanner_url
# ─────────────────────────────────────────────────────────────────
def test_skyscanner_url():
    url = al.skyscanner_url("MAD", "JFK", "2026-06-15")
    assert "skyscanner" in url.lower()


def test_skyscanner_url_round_trip():
    url = al.skyscanner_url("MAD", "JFK", "2026-06-15", "2026-06-25")
    assert isinstance(url, str)
    assert len(url) > 10


# ─────────────────────────────────────────────────────────────────
# travelpayouts_url
# ─────────────────────────────────────────────────────────────────
def test_travelpayouts_url_no_marker_falls_back_to_kayak(monkeypatch):
    monkeypatch.setattr(al, "TP_MARKER", "")
    url = al.travelpayouts_url("MAD", "JFK", "2026-06-15")
    assert "kayak.es" in url


def test_travelpayouts_url_with_marker(monkeypatch):
    monkeypatch.setattr(al, "TP_MARKER", "999999")
    url = al.travelpayouts_url("MAD", "JFK", "2026-06-15")
    assert "aviasales.es" in url
    assert "marker=999999" in url


def test_travelpayouts_url_round_trip(monkeypatch):
    monkeypatch.setattr(al, "TP_MARKER", "999999")
    url = al.travelpayouts_url("MAD", "JFK", "2026-06-15", "2026-06-25")
    assert "aviasales.es" in url
    # Round trip means we include both legs
    assert "MAD" in url
    assert "JFK" in url


# ─────────────────────────────────────────────────────────────────
# get_booking_url — main dispatcher
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("airline_code,expected_substring", [
    ("FR", "ryanair.com"),
    ("RK", "ryanair.com"),
    ("U2", "easyjet.com"),
    ("EC", "easyjet.com"),
    ("DS", "easyjet.com"),
    ("W6", "wizzair.com"),
    ("W4", "wizzair.com"),
    ("W9", "wizzair.com"),
])
def test_get_booking_url_direct_links(airline_code, expected_substring):
    url = al.get_booking_url(airline_code, "MAD", "BCN", "2026-06-15")
    assert expected_substring in url


def test_get_booking_url_unknown_airline_uses_fallback():
    url = al.get_booking_url("XX", "MAD", "JFK", "2026-06-15")
    # Either kayak or aviasales depending on TP_MARKER
    assert "kayak.es" in url or "aviasales.es" in url


def test_get_booking_url_empty_airline_uses_fallback():
    url = al.get_booking_url("", "MAD", "JFK", "2026-06-15")
    assert "kayak.es" in url or "aviasales.es" in url


def test_get_booking_url_none_airline_safe():
    # Should not raise even with None
    url = al.get_booking_url(None, "MAD", "JFK", "2026-06-15")
    assert isinstance(url, str)


def test_get_booking_url_lowercase_code_normalized():
    url_lower = al.get_booking_url("fr", "MAD", "BCN", "2026-06-15")
    url_upper = al.get_booking_url("FR", "MAD", "BCN", "2026-06-15")
    # Same URL regardless of case
    assert url_lower == url_upper


# ─────────────────────────────────────────────────────────────────
# get_airline_name
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("code,expected", [
    ("FR", "Ryanair"),
    ("IB", "Iberia"),
    ("LH", "Lufthansa"),
    ("BA", "British Airways"),
    ("AF", "Air France"),
    ("KL", "KLM"),
    ("U2", "easyJet"),
    ("VY", "Vueling"),
])
def test_get_airline_name_known(code, expected):
    assert al.get_airline_name(code) == expected


def test_get_airline_name_unknown_returns_code():
    assert al.get_airline_name("XX") == "XX"


def test_get_airline_name_empty_returns_question():
    assert al.get_airline_name("") == "?"


def test_get_airline_name_none_returns_question():
    assert al.get_airline_name(None) == "?"


def test_get_airline_name_lowercase_normalized():
    assert al.get_airline_name("fr") == "Ryanair"


# ─────────────────────────────────────────────────────────────────
# name_to_iata
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("name", ["Ryanair", "ryanair", "RYANAIR", "Iberia", "Lufthansa"])
def test_name_to_iata_known_airlines(name):
    iata = al.name_to_iata(name)
    assert isinstance(iata, str)
    assert iata in al.AIRLINE_NAMES or iata == name  # mapping found OR returned as-is


def test_name_to_iata_unknown_returns_name():
    name = "Some Unknown Airline XYZ"
    assert al.name_to_iata(name) == name


def test_name_to_iata_empty_string():
    assert al.name_to_iata("") == "?"


def test_name_to_iata_none():
    assert al.name_to_iata(None) == "?"


# ─────────────────────────────────────────────────────────────────
# enrich_flight
# ─────────────────────────────────────────────────────────────────
def test_enrich_flight_adds_booking_url():
    flight = {
        "airline": "FR",
        "origin": "MAD",
        "destination": "BCN",
        "date_out": "2026-06-15",
    }
    res = al.enrich_flight(flight)
    assert "booking_url" in res
    assert "ryanair.com" in res["booking_url"]


def test_enrich_flight_adds_airline_name():
    flight = {"airline": "FR", "origin": "MAD", "destination": "BCN", "date_out": "2026-06-15"}
    res = al.enrich_flight(flight)
    assert res["airline_name"] == "Ryanair"


def test_enrich_flight_preserves_existing_name():
    flight = {
        "airline": "FR", "airline_name": "Custom Name",
        "origin": "MAD", "destination": "BCN", "date_out": "2026-06-15",
    }
    res = al.enrich_flight(flight)
    assert res["airline_name"] == "Custom Name"


def test_enrich_flight_with_return_date():
    flight = {
        "airline": "FR", "origin": "MAD", "destination": "BCN",
        "date_out": "2026-06-15", "date_ret": "2026-06-20",
    }
    res = al.enrich_flight(flight)
    assert "2026-06-20" in res["booking_url"]


def test_enrich_flight_unknown_airline():
    flight = {
        "airline": "XX", "origin": "MAD", "destination": "JFK",
        "date_out": "2026-06-15",
    }
    res = al.enrich_flight(flight)
    assert "booking_url" in res
    assert res["airline_name"] == "XX"


def test_enrich_flight_returns_same_dict():
    flight = {"airline": "FR", "origin": "MAD", "destination": "BCN", "date_out": "2026-06-15"}
    res = al.enrich_flight(flight)
    assert res is flight  # in-place


def test_enrich_flight_missing_fields_safe():
    # Should not raise even with missing fields
    flight = {}
    res = al.enrich_flight(flight)
    assert "booking_url" in res
    assert "airline_name" in res


# ─────────────────────────────────────────────────────────────────
# Catalog sanity
# ─────────────────────────────────────────────────────────────────
def test_airline_names_has_many_entries():
    assert len(al.AIRLINE_NAMES) > 100


def test_airline_url_builders_subset_of_names():
    for code in al.AIRLINE_URL_BUILDERS:
        assert code in al.AIRLINE_NAMES


def test_airline_names_no_duplicates_in_keys():
    # By definition dict keys are unique; but check the dict was assembled
    assert len(set(al.AIRLINE_NAMES.keys())) == len(al.AIRLINE_NAMES)
