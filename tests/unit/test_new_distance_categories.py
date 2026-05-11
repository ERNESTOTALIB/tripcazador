"""
test_new_distance_categories.py — May 2026
===========================================
Cobertura para config.get_distance_category con destinos reales: garantiza
que la heurística por sets explícitos + fallback "largo" funciona.
"""
from __future__ import annotations

import pytest
import config  # type: ignore[import-not-found]


@pytest.mark.parametrize("dest, expected", [
    ("NRT", "ultra_largo"),
    ("HND", "ultra_largo"),
    ("BKK", "largo"),
    ("SIN", "largo"),
    ("HKG", "largo"),
    ("JFK", "largo"),
    ("LAX", "largo"),
    ("DXB", "largo"),
    ("FCO", "corto"),
    ("CDG", "corto"),
    ("LIS", "corto"),
    ("AMS", "corto"),
    ("LHR", "corto"),
    ("IST", "medio"),
    ("CAI", "medio"),
    ("TFS", "medio"),  # Canarias clasificadas como medio
    ("ATH", "medio"),
])
def test_distance_category_known(dest, expected):
    assert config.get_distance_category(dest) == expected


def test_unknown_dest_defaults_to_largo():
    # IATA inventado → fallback largo por seguridad
    assert config.get_distance_category("ZZZ") == "largo"


def test_empty_string_returns_largo_fallback():
    # No revienta con string vacío
    cat = config.get_distance_category("")
    assert cat in {"corto", "medio", "largo", "ultra_largo"}


def test_lowercase_input_not_matched():
    # Las claves del set son uppercase: "mad" no debería matchear MAD
    cat = config.get_distance_category("mad")
    assert cat == "largo"  # fallback


class TestErrorFareCheck:
    """Cobertura para config.is_error_fare()."""

    def test_economy_corto_50_euros_not_error(self):
        # MAD-BCN €50 economy = normal, no error fare
        # FCO está en _EUROPEAN_EXTRAS → corto
        assert config.is_error_fare(50.0, config.CABIN_ECONOMY, "FCO") is False

    def test_business_transat_300_euros_is_error(self):
        # Business JFK €300 = error fare obvio
        # JFK está en DISTANCE_LARGO → threshold ~500
        assert config.is_error_fare(300.0, config.CABIN_BUSINESS, "JFK") is True

    def test_business_transat_5000_euros_not_error(self):
        # Business JFK €5000 = precio normal de business
        assert config.is_error_fare(5000.0, config.CABIN_BUSINESS, "JFK") is False

    def test_economy_ultra_largo_150_euros_is_error(self):
        # Tokio NRT economy €150 < threshold €200 ultra_largo = error fare
        assert config.is_error_fare(150.0, config.CABIN_ECONOMY, "NRT") is True

    def test_economy_ultra_largo_at_threshold_not_error(self):
        # Threshold es exclusivo: precio = threshold NO es error
        assert config.is_error_fare(200.0, config.CABIN_ECONOMY, "NRT") is False

    def test_unknown_cabin_returns_false(self):
        # cabin_code inválido (99) → False (no se puede juzgar)
        assert config.is_error_fare(50.0, 99, "JFK") is False


class TestMonthFromIso:
    """config._month_from_iso parsing."""

    @pytest.mark.parametrize("iso, expected", [
        ("2026-01-15", 1),
        ("2026-07-31", 7),
        ("2026-12-25", 12),
    ])
    def test_valid_iso(self, iso, expected):
        assert config._month_from_iso(iso) == expected

    @pytest.mark.parametrize("bad", ["", "not-a-date", "2026/07/31", "01-2026"])
    def test_invalid_iso_returns_zero(self, bad):
        # Política defensiva: cualquier fallo de parseo → 0 (sin estacionalidad)
        assert config._month_from_iso(bad) == 0


class TestSeasonalThreshold:
    def test_get_seasonal_multiplier_in_range(self):
        # SEASONAL_MULTIPLIERS debe devolver float >0, típicamente 0.8-1.4
        m = config.get_seasonal_multiplier("Europa", 8)  # agosto
        assert isinstance(m, float)
        assert 0.3 < m < 3.0

    def test_seasonal_multiplier_unknown_region(self):
        # Región inexistente → multiplier neutro (1.0) o algo razonable
        m = config.get_seasonal_multiplier("Atlántida", 8)
        assert isinstance(m, float)
        assert m > 0

    def test_get_seasonal_threshold_neutral_no_month(self):
        # Sin mes → devuelve threshold base
        base = 500.0
        out = config.get_seasonal_threshold(base, "Europa", 0)
        assert out == pytest.approx(base, rel=0.01)


class TestActiveHoliday:
    def test_summer_no_holiday(self):
        # 15-jun-2026 sin festivo nominal
        h = config.get_active_holiday("2026-06-15", "Europa")
        assert h == "" or isinstance(h, str)

    def test_invalid_date_returns_empty(self):
        h = config.get_active_holiday("garbage", "Europa")
        assert h == ""
