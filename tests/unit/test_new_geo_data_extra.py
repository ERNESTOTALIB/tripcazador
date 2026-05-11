"""
test_new_geo_data_extra.py — May 2026
======================================
Cobertura extra de geo_data.AIRPORT_GEO + enrich_geo() y consistencia del
catálogo de aeropuertos. Cubre casos border (IATA inválidos, fallback por
distancia, no-overwrite cuando ya hay city_to válido).
"""
from __future__ import annotations

import pytest

import geo_data  # type: ignore[import-not-found]


class TestAirportGeoCatalog:
    def test_madrid_present(self):
        assert geo_data.AIRPORT_GEO["MAD"][0] == "Madrid"
        assert geo_data.AIRPORT_GEO["MAD"][1] == "España"
        assert geo_data.AIRPORT_GEO["MAD"][2] == "Europa"

    def test_barcelona_present(self):
        city, country, region = geo_data.AIRPORT_GEO["BCN"]
        assert city == "Barcelona"
        assert country == "España"
        assert region == "Europa"

    def test_jfk_us(self):
        city, country, region = geo_data.AIRPORT_GEO["JFK"]
        assert "Nueva York" in city or "New York" in city
        assert region == "América Norte"

    @pytest.mark.parametrize("iata", ["MAD", "BCN", "VLC", "AGP", "PMI", "TFS", "LPA"])
    def test_spanish_airports_region(self, iata):
        if iata in geo_data.AIRPORT_GEO:
            _, country, region = geo_data.AIRPORT_GEO[iata]
            assert country == "España"
            assert region == "Europa"

    @pytest.mark.parametrize("iata", ["NRT", "HND", "BKK", "SIN", "HKG"])
    def test_asia_airports_region(self, iata):
        if iata in geo_data.AIRPORT_GEO:
            _, _, region = geo_data.AIRPORT_GEO[iata]
            assert region == "Asia"

    def test_no_iata_collision_with_lowercase(self):
        # Todas las keys deben ser uppercase IATA de 3 letras
        for code in geo_data.AIRPORT_GEO.keys():
            assert len(code) == 3, f"IATA inválido: {code!r}"
            assert code == code.upper(), f"IATA no-uppercase: {code!r}"

    def test_tuple_shape(self):
        for code, val in geo_data.AIRPORT_GEO.items():
            assert isinstance(val, tuple), f"{code}: no tupla"
            assert len(val) == 3, f"{code}: tupla de {len(val)} en lugar de 3"
            city, country, region = val
            assert city, f"{code}: city vacía"
            assert country, f"{code}: country vacío"
            assert region, f"{code}: region vacía"


class TestEnrichGeo:
    def test_enrich_known_destination(self):
        flight = {"origin": "MAD", "destination": "FCO"}
        out = geo_data.enrich_geo(flight)
        assert out["city_to"] == "Roma Fiumicino" or "Roma" in out["city_to"]
        assert out["country_to"] == "Italia"
        assert out["region"] == "Europa"

    def test_enrich_unknown_destination_largo_fallback(self):
        # Destino inventado pero categoría largo → región Internacional
        flight = {"origin": "MAD", "destination": "XYZ", "distance_category": "largo"}
        out = geo_data.enrich_geo(flight)
        assert "region" in out
        assert out["region"] in {"Internacional", "América Norte", "Asia"}

    def test_enrich_unknown_destination_corto_europa(self):
        flight = {"origin": "MAD", "destination": "ZZZ", "distance_category": "corto"}
        out = geo_data.enrich_geo(flight)
        assert out["region"] == "Europa"

    def test_enrich_unknown_destination_medio(self):
        flight = {"origin": "MAD", "destination": "ZZ9", "distance_category": "medio"}
        out = geo_data.enrich_geo(flight)
        assert out["region"] == "Oriente Medio"

    def test_enrich_does_not_overwrite_city(self):
        flight = {"origin": "MAD", "destination": "JFK", "city_to": "Mi NYC custom"}
        out = geo_data.enrich_geo(flight)
        # Solo se overwrite si city_to está vacío o == IATA
        assert out["city_to"] == "Mi NYC custom"

    def test_enrich_overwrites_city_equal_to_iata(self):
        flight = {"origin": "MAD", "destination": "FCO", "city_to": "FCO"}
        out = geo_data.enrich_geo(flight)
        assert out["city_to"] != "FCO"

    def test_enrich_overwrites_empty_country(self):
        flight = {"origin": "MAD", "destination": "FCO", "country_to": ""}
        out = geo_data.enrich_geo(flight)
        assert out["country_to"] == "Italia"

    def test_enrich_returns_same_dict(self):
        flight = {"origin": "MAD", "destination": "FCO"}
        out = geo_data.enrich_geo(flight)
        assert out is flight  # mutación in-place


class TestRegionsAndCountries:
    def test_get_all_regions_count(self):
        regions = geo_data.get_all_regions()
        assert len(regions) >= 6
        assert "Europa" in regions
        assert "Asia" in regions
        assert "América Norte" in regions

    def test_countries_by_region_spain_in_europa(self):
        d = geo_data.get_countries_by_region()
        assert "España" in d["Europa"]

    def test_countries_by_region_returns_iterable(self):
        d = geo_data.get_countries_by_region()
        # defaultdict de set/list/etc — debe ser iterable
        for region, countries in d.items():
            assert region
            assert len(list(countries)) > 0
