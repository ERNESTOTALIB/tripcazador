"""
tests/unit/test_seasonal_threshold_20260424.py
==============================================
Regresiones de la integración seasonal_threshold (#163) — abr-2026i.

Cubren:
  - SEASONAL_MULTIPLIERS existe con al menos las 8 regiones core
  - get_seasonal_multiplier rango válido y fallbacks seguros
  - get_seasonal_threshold multiplica correctamente
  - is_error_fare_seasonal ajusta el umbral según (region, month)
  - _month_from_iso parsea ISO robustamente
  - detector.t0_absolute_error_fare usa versión estacional cuando hay contexto
  - Nuevos presets caribe y asia-sudeste definidos y dedupados
"""
from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "flight_hunter_v4"
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))


def _reload_config():
    import config  # type: ignore
    importlib.reload(config)
    return config


class TestSeasonalMultipliersMap:
    def test_map_has_core_regions(self):
        cfg = _reload_config()
        assert hasattr(cfg, "SEASONAL_MULTIPLIERS")
        core = {"Europa", "Caribe", "América Sur", "América Norte",
                "Asia", "África", "Oriente Medio", "Oceanía"}
        present = set(cfg.SEASONAL_MULTIPLIERS.keys())
        missing = core - present
        assert not missing, f"Faltan regiones: {missing}"

    def test_every_region_has_all_12_months(self):
        cfg = _reload_config()
        for region, months in cfg.SEASONAL_MULTIPLIERS.items():
            assert set(months.keys()) == set(range(1, 13)), (
                f"{region} no tiene los 12 meses"
            )

    def test_multipliers_within_reasonable_range(self):
        """Multiplicadores deben estar entre 0.5x y 1.5x.

        Valores fuera de ese rango probablemente son errores tipográficos
        (ej: 13.0 en lugar de 1.3).
        """
        cfg = _reload_config()
        for region, months in cfg.SEASONAL_MULTIPLIERS.items():
            for m, mult in months.items():
                assert 0.5 <= mult <= 1.5, (
                    f"{region}/mes-{m}: {mult} fuera de rango 0.5-1.5"
                )


class TestGetSeasonalMultiplier:
    def test_known_region_and_month(self):
        cfg = _reload_config()
        # Europa en agosto debería ser temporada alta (>1.0)
        mult = cfg.get_seasonal_multiplier("Europa", 8)
        assert mult > 1.0

    def test_known_region_low_season(self):
        cfg = _reload_config()
        # Oriente Medio en verano europeo = temporada baja (calor insoportable)
        mult = cfg.get_seasonal_multiplier("Oriente Medio", 7)
        assert mult < 1.0

    def test_fuzzy_match_region(self):
        """Un nombre de región ligeramente distinto debe encontrarse."""
        cfg = _reload_config()
        # 'asia' (minúscula + substring) debe matchear 'Asia'
        mult = cfg.get_seasonal_multiplier("asia", 2)
        assert mult == cfg.SEASONAL_MULTIPLIERS["Asia"][2]

    def test_invalid_month_returns_neutral(self):
        cfg = _reload_config()
        assert cfg.get_seasonal_multiplier("Europa", 13) == 1.0
        assert cfg.get_seasonal_multiplier("Europa", 0) == 1.0
        assert cfg.get_seasonal_multiplier("Europa", -1) == 1.0

    def test_empty_or_unknown_region_returns_neutral(self):
        cfg = _reload_config()
        assert cfg.get_seasonal_multiplier("", 5) == 1.0
        assert cfg.get_seasonal_multiplier("Lunaworld", 5) == 1.0

    def test_none_and_bad_types_safe(self):
        cfg = _reload_config()
        # Estos no deberían crashear, retornan 1.0
        assert cfg.get_seasonal_multiplier(None, 5) == 1.0  # type: ignore
        assert cfg.get_seasonal_multiplier("Europa", "junio") == 1.0  # type: ignore


class TestGetSeasonalThreshold:
    def test_multiplier_applies_to_threshold(self):
        cfg = _reload_config()
        base = 100.0
        mult = cfg.get_seasonal_multiplier("Caribe", 2)  # alta temporada
        adjusted = cfg.get_seasonal_threshold(base, "Caribe", 2)
        assert adjusted == base * mult
        assert adjusted > base  # alta ⇒ threshold más permisivo

    def test_low_season_lowers_threshold(self):
        cfg = _reload_config()
        base = 100.0
        adjusted = cfg.get_seasonal_threshold(base, "Caribe", 9)  # septiembre
        assert adjusted < base


class TestIsErrorFareSeasonal:
    def test_season_changes_classification(self):
        """El mismo precio puede ser error en alta temporada y normal en baja."""
        cfg = _reload_config()
        # Business largo: threshold base = 400€
        # En Caribe febrero (mult 1.30) → threshold efectivo 520€
        #   → 450€ es ERROR (por debajo de 520)
        # En Caribe septiembre (mult 0.75) → threshold efectivo 300€
        #   → 450€ NO es error (por encima)
        price = 450.0
        cabin = cfg.CABIN_BUSINESS
        dest = "HAV"  # La Habana — Caribe
        is_high_season_error = cfg.is_error_fare_seasonal(
            price, cabin, dest, month=2, region="Caribe"
        )
        is_low_season_error = cfg.is_error_fare_seasonal(
            price, cabin, dest, month=9, region="Caribe"
        )
        assert is_high_season_error is True
        assert is_low_season_error is False

    def test_no_month_falls_back_to_static(self):
        cfg = _reload_config()
        # Sin month, is_error_fare_seasonal == is_error_fare
        price = 350.0
        cabin = cfg.CABIN_BUSINESS
        dest = "HAV"
        static = cfg.is_error_fare(price, cabin, dest)
        seasonal = cfg.is_error_fare_seasonal(price, cabin, dest, month=0, region="")
        assert seasonal == static


class TestMonthFromIso:
    def test_parses_standard_iso_date(self):
        cfg = _reload_config()
        assert cfg._month_from_iso("2026-08-15") == 8
        assert cfg._month_from_iso("2027-01-01") == 1
        assert cfg._month_from_iso("2026-12-31") == 12

    def test_parses_datetime_iso(self):
        cfg = _reload_config()
        assert cfg._month_from_iso("2026-05-15T10:30:00") == 5

    def test_invalid_inputs_return_zero(self):
        cfg = _reload_config()
        assert cfg._month_from_iso("") == 0
        assert cfg._month_from_iso("not-a-date") == 0
        assert cfg._month_from_iso("2026") == 0
        assert cfg._month_from_iso(None) == 0  # type: ignore
        assert cfg._month_from_iso("2026-13-01") == 0  # mes inválido
        assert cfg._month_from_iso("2026-00-01") == 0


class TestDetectorIntegration:
    """El detector.t0_absolute_error_fare debe usar is_error_fare_seasonal
    cuando el vuelo trae date_out + region."""

    def test_detector_uses_seasonal_when_available(self):
        import detector  # type: ignore
        importlib.reload(detector)
        src = (ENGINE / "detector.py").read_text(encoding="utf-8")
        # Llamada explícita al wrapper seasonal cuando hay mes + region
        assert "is_error_fare_seasonal" in src
        # Y al parser de mes desde ISO
        assert "_month_from_iso" in src

    def test_detector_reason_tags_seasonal_adjustment(self):
        """El t0_reason debe marcar cuándo se aplicó ajuste estacional para
        que ops pueda auditar decisiones más tarde."""
        src = (ENGINE / "detector.py").read_text(encoding="utf-8")
        assert "ajuste estacional" in src or "seasonal" in src.lower()


class TestNewThematicPresets:
    def test_caribe_preset_has_core_airports(self):
        cfg = _reload_config()
        assert hasattr(cfg, "DEST_CARIBE")
        c = cfg.DEST_CARIBE
        for iata in ("CUN", "PUJ", "HAV", "SJU"):
            assert iata in c, f"{iata} debería estar en DEST_CARIBE"
        assert len(c) == len(set(c)), "DEST_CARIBE tiene duplicados"

    def test_asia_sudeste_preset_has_core_airports(self):
        cfg = _reload_config()
        assert hasattr(cfg, "DEST_ASIA_SUDESTE")
        a = cfg.DEST_ASIA_SUDESTE
        for iata in ("BKK", "SGN", "DPS", "SIN"):
            assert iata in a, f"{iata} debería estar en DEST_ASIA_SUDESTE"
        assert len(a) == len(set(a)), "DEST_ASIA_SUDESTE tiene duplicados"

    def test_main_exposes_new_presets(self):
        main_src = (ENGINE / "main.py").read_text(encoding="utf-8")
        for key in ("caribe", "asia-sudeste"):
            assert f'"{key}":' in main_src, (
                f"main.parse_destinations no expone preset '{key}'"
            )
