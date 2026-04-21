"""
Integridad del catálogo AIRPORT_GEO.

Estos tests son *regresiones fuertes* contra patrones de bug que ya se han
colado al producto: claves duplicadas (la última gana y tumba siliencio la
anterior), ciudades repetidas entre hubs IATA confundidos, etc.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from geo_data import AIRPORT_GEO


GEO_DATA_PATH = Path(__file__).resolve().parents[2] / "flight_hunter_v4" / "geo_data.py"


@pytest.fixture(scope="module")
def raw_iata_lines() -> list[str]:
    """Devuelve sólo las líneas de entrada IATA → tupla DENTRO de AIRPORT_GEO.
    Se excluyen AIRPORT_COORDS / AIRPORT_IMAGES / REGION_FALLBACK_IMAGES, que
    legítimamente comparten claves IATA.
    """
    assert GEO_DATA_PATH.is_file(), f"geo_data.py no encontrado: {GEO_DATA_PATH}"
    text = GEO_DATA_PATH.read_text(encoding="utf-8")
    lines = text.splitlines()

    regions: list[tuple[int, int]] = []  # (start_exclusive, end_exclusive)
    stack: list[int] = []
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped == "AIRPORT_GEO = {" or stripped.startswith("AIRPORT_GEO.update({"):
            stack.append(idx + 1)
            continue
        # cerramos sólo si el stack está abierto
        if stack and (stripped == "}" or stripped == "})"):
            start = stack.pop()
            regions.append((start, idx))
            continue

    iata_lines: list[str] = []
    for start, end in regions:
        for line in lines[start:end]:
            s = line.strip()
            if re.match(r'^"[A-Z]{3}"\s*:\s*\(', s):
                iata_lines.append(s)
    assert iata_lines, "No se extrajo ninguna línea IATA — parser roto"
    return iata_lines


def _iata_codes_in_source(lines: list[str]) -> list[str]:
    out: list[str] = []
    for line in lines:
        m = re.match(r'^\s*"([A-Z]{3})"\s*:', line)
        if m:
            out.append(m.group(1))
    return out


class TestAirportGeoIntegrity:
    """Sanidad de datos sobre el dict ya cargado."""

    def test_no_duplicate_cities_in_spain(self):
        """En España cada IATA debe mapear a una ciudad única (evita 'BCN→Madrid')."""
        spanish = {
            iata: city
            for iata, (city, country, _) in AIRPORT_GEO.items()
            if country == "España"
        }
        # TFS y TFN son Tenerife pero *diferentes aeropuertos*, admiten prefijo.
        normalised = {iata: re.sub(r"\s+(Sur|Norte)$", "", c) for iata, c in spanish.items()}
        # cities repetidas (excluimos Tenerife)
        seen: dict[str, str] = {}
        for iata, city in normalised.items():
            if city == "Tenerife":
                continue
            if city in seen:
                pytest.fail(f"Ciudad duplicada entre {seen[city]} y {iata}: {city}")
            seen[city] = iata

    def test_spain_airports_all_in_europe(self):
        for iata, (_, country, region) in AIRPORT_GEO.items():
            if country == "España":
                assert region == "Europa", f"{iata}: España fuera de Europa → {region}"

    def test_main_canary_islands_present(self):
        """Regresión: a veces se cae ACE/LPA/TFS cuando refactor del catálogo."""
        for iata in ("ACE", "LPA", "TFS", "TFN", "FUE"):
            assert iata in AIRPORT_GEO, f"Falta aeropuerto canario: {iata}"

    def test_no_trailing_whitespace_in_fields(self):
        for iata, (city, country, region) in AIRPORT_GEO.items():
            for label, val in (("city", city), ("country", country), ("region", region)):
                assert val == val.strip(), f"{iata}: campo '{label}' con whitespace → '{val}'"


class TestAirportGeoSourceIntegrity:
    """Checks directamente sobre el *archivo fuente* — atrapa duplicados que
    el dict colapsa silenciosamente."""

    def test_source_file_has_no_duplicate_iata_keys(self, raw_iata_lines):
        codes = _iata_codes_in_source(raw_iata_lines)
        seen: dict[str, int] = {}
        dupes: list[str] = []
        for idx, iata in enumerate(codes):
            if iata in seen:
                dupes.append(iata)
            else:
                seen[iata] = idx
        assert not dupes, (
            f"IATA duplicados en geo_data.py (la 2ª definición pisa la 1ª): "
            f"{sorted(set(dupes))}"
        )

    def test_source_file_has_at_least_200_airports(self, raw_iata_lines):
        """El catálogo no debería reducirse de golpe por un merge mal hecho."""
        codes = _iata_codes_in_source(raw_iata_lines)
        assert len(codes) >= 200, (
            f"Catálogo sospechosamente pequeño: {len(codes)} entradas IATA"
        )
