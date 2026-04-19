"""
Unit tests: geo_data.py — enrich_geo, AIRPORT_GEO, get_image_url
"""
from __future__ import annotations

import pytest

from geo_data import (
    AIRPORT_GEO,
    REGION_FALLBACK_IMAGES,
    enrich_geo,
    get_all_regions,
    get_countries_by_region,
    get_image_url,
)


class TestEnrichGeo:
    def test_known_european_destination_fills_fields(self):
        flight = {"destination": "FCO"}
        enrich_geo(flight)
        assert flight["city_to"] == "Roma Fiumicino"
        assert flight["country_to"] == "Italia"
        assert flight["region"] == "Europa"

    def test_asia_destination(self):
        flight = {"destination": "NRT"}
        enrich_geo(flight)
        assert flight["region"] == "Asia"

    def test_does_not_overwrite_explicit_city(self):
        flight = {"destination": "FCO", "city_to": "Mi Roma Personalizada"}
        enrich_geo(flight)
        assert flight["city_to"] == "Mi Roma Personalizada"

    def test_unknown_destination_falls_back_by_distance(self):
        flight = {"destination": "XYZ", "distance_category": "corto"}
        enrich_geo(flight)
        assert flight["region"] == "Europa"

    def test_unknown_destination_long_haul_internacional(self):
        flight = {"destination": "XYZ", "distance_category": "largo"}
        enrich_geo(flight)
        # El fallback devuelve "Internacional" para largo
        assert flight["region"] in ("Internacional", "Oriente Medio")


class TestAirportGeoTable:
    def test_has_main_hubs(self):
        assert "MAD" in AIRPORT_GEO
        assert "BCN" in AIRPORT_GEO
        assert "CDG" in AIRPORT_GEO
        assert "JFK" in AIRPORT_GEO or "FCO" in AIRPORT_GEO

    def test_each_entry_is_triplet(self):
        for iata, entry in AIRPORT_GEO.items():
            assert len(entry) == 3, f"{iata}: no es (city, country, region)"
            city, country, region = entry
            assert isinstance(city, str) and city
            assert isinstance(country, str) and country
            assert isinstance(region, str) and region


class TestGetImageUrl:
    def test_known_iata_returns_specific_image(self):
        url = get_image_url("NRT", "Asia")
        assert url.startswith("http")

    def test_unknown_iata_falls_back_to_region(self):
        url = get_image_url("ZZZ", "Europa")
        assert url == REGION_FALLBACK_IMAGES["Europa"]

    def test_totally_unknown_returns_generic(self):
        url = get_image_url("ZZZ", "")
        assert url.startswith("http")


class TestRegionHelpers:
    def test_get_all_regions_has_expected(self):
        regions = get_all_regions()
        assert "Europa" in regions
        assert "Asia" in regions
        assert "África" in regions

    def test_get_countries_by_region_returns_dict(self):
        by_region = get_countries_by_region()
        assert "Europa" in by_region
        assert "España" in by_region["Europa"]
