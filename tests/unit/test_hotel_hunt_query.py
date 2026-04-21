"""
Regresión: los scripts de caza hotelera deben usar la query localizada
`hotels in {city}, {country}` para evitar colisiones con topónimos
homófonos (Hoi An → Laughlin, NV en Google Hotels sin contexto país).

También comprobamos que DESTINATIONS es una lista de tuplas (city, country),
nunca una lista plana de strings.
"""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

import pytest


REPO = Path(__file__).resolve().parents[2]
HOTEL_SCRIPTS = [
    REPO / "scripts" / "real_hotel_hunt_round2.py",
]


def _load_module(path: Path):
    # Evitamos ejecutar main() — sólo queremos leer DESTINATIONS y search()
    # sin llamar a la API externa.
    source = path.read_text(encoding="utf-8")
    # Prevenimos el `sys.exit(1)` del chequeo de SERPAPI_KEY parcheando
    # temporalmente el entorno antes del import.
    import os
    os.environ.setdefault("SERPAPI_KEY", "TEST_DUMMY_KEY_FOR_IMPORT_ONLY")
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


@pytest.mark.parametrize("script_path", HOTEL_SCRIPTS, ids=lambda p: p.name)
class TestHotelHuntQueryLocalization:
    def test_destinations_are_tuples_with_city_and_country(self, script_path):
        mod = _load_module(script_path)
        dests = getattr(mod, "DESTINATIONS")
        assert isinstance(dests, list) and dests
        for entry in dests:
            assert isinstance(entry, tuple), f"entrada no-tupla: {entry!r}"
            assert len(entry) == 2, f"tupla inesperada: {entry!r}"
            city, country = entry
            assert isinstance(city, str) and city.strip()
            assert isinstance(country, str) and country.strip()

    def test_search_query_uses_localized_format(self, script_path):
        """El f-string dentro de search() debe ser `hotels in {city}, {country}`.
        Regresión histórica: usábamos `{city} hotels` → Google mapeaba
        'Hoi An' a Laughlin, NV.
        """
        text = script_path.read_text(encoding="utf-8")
        # Busca un patrón f-string con "hotels in ... , ..." dentro del script.
        localized = re.search(
            r'["\']hotels in \{\s*\w+\s*\},\s*\{\s*\w+\s*\}["\']',
            text,
        )
        assert localized, (
            "Query hotelera sin localización por país. Usa "
            "`hotels in {city}, {country}` para evitar colisiones Hoi An→Laughlin."
        )

    def test_no_known_confusable_destinations_without_country(self, script_path):
        """Extra paranoia: si DESTINATIONS menciona ciudades confundibles,
        que vayan siempre acompañadas de su país."""
        mod = _load_module(script_path)
        dests = getattr(mod, "DESTINATIONS")
        confusables = {
            "Hoi An": "Vietnam",       # vs Laughlin, NV
            "San Jose": ("Costa Rica", "USA"),  # múltiples San José
            "Santiago": ("Chile", "Spain", "Dominican Republic"),
        }
        for entry in dests:
            city, country = entry
            if city in confusables:
                expected = confusables[city]
                if isinstance(expected, str):
                    assert country == expected, (
                        f"'{city}' aparece con país '{country}' — se espera '{expected}'"
                    )
                else:
                    assert country in expected, (
                        f"'{city}' aparece con país '{country}' — debe ser uno de {expected}"
                    )
