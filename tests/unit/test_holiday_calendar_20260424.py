"""
tests/unit/test_holiday_calendar_20260424.py
============================================
Regresiones sobre el calendario de festivos (#189) añadido en abr-2026j.

Cubren:
  - HOLIDAY_WINDOWS existe y tiene las festividades clave
  - get_holiday_multiplier detecta correctamente cada festividad por región
  - get_holiday_multiplier devuelve 1.0 en fechas inválidas / fuera de ventana
  - get_active_holiday devuelve el nombre legible
  - get_seasonal_threshold acepta `iso_date` y multiplica por holiday
  - is_error_fare_seasonal acepta `iso_date`
  - detector.t0_absolute_error_fare etiqueta `[festivo: ...]` cuando aplica
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


class TestHolidayWindowsMap:
    def test_has_holiday_windows_list(self):
        cfg = _reload_config()
        assert hasattr(cfg, "HOLIDAY_WINDOWS")
        assert isinstance(cfg.HOLIDAY_WINDOWS, list)
        assert len(cfg.HOLIDAY_WINDOWS) >= 15

    def test_required_holidays_present(self):
        cfg = _reload_config()
        names = {w["name"] for w in cfg.HOLIDAY_WINDOWS}
        for expected in [
            "Navidad/Nochevieja",
            "Semana Santa",
            "Carnaval",
            "Golden Week",
            "Chinese New Year",
            "Eid al-Fitr",
            "Thanksgiving",
            "Diwali",
        ]:
            assert expected in names, f"Festivo faltante: {expected}"

    def test_windows_have_required_keys(self):
        cfg = _reload_config()
        for w in cfg.HOLIDAY_WINDOWS:
            for k in ("name", "from", "to", "regions", "multiplier"):
                assert k in w, f"Ventana sin clave {k}: {w}"
            # fechas en formato ISO
            assert len(w["from"]) == 10 and w["from"][4] == "-" and w["from"][7] == "-"
            assert len(w["to"]) == 10
            # multiplicador razonable
            assert 1.0 <= w["multiplier"] <= 1.5

    def test_dates_are_ordered(self):
        cfg = _reload_config()
        for w in cfg.HOLIDAY_WINDOWS:
            assert w["from"] <= w["to"], f"Ventana al revés: {w}"


class TestGetHolidayMultiplier:
    def test_navidad_universal(self):
        cfg = _reload_config()
        # Cualquier región durante Nochevieja 2026
        mult = cfg.get_holiday_multiplier("2026-12-24", "Europa")
        assert mult >= 1.20

    def test_reyes_still_inside_window(self):
        cfg = _reload_config()
        # 2 de enero aún cae en la ventana navideña
        mult = cfg.get_holiday_multiplier("2027-01-02", "Europa")
        assert mult >= 1.20

    def test_semana_santa_europa(self):
        cfg = _reload_config()
        # 2026: domingo Resurrección = 5 abr
        mult = cfg.get_holiday_multiplier("2026-04-03", "Europa")
        assert mult >= 1.20

    def test_golden_week_japan_asia(self):
        cfg = _reload_config()
        mult = cfg.get_holiday_multiplier("2026-05-02", "Asia")
        assert mult >= 1.20

    def test_carnaval_caribe(self):
        cfg = _reload_config()
        mult = cfg.get_holiday_multiplier("2026-02-15", "Caribe")
        assert mult >= 1.15

    def test_region_mismatch_returns_1(self):
        """Carnaval es Caribe/LatAm, no debería activar para Europa."""
        cfg = _reload_config()
        mult = cfg.get_holiday_multiplier("2026-02-15", "Europa")
        # Puede haber superposiciones con otra ventana, verificamos que
        # al menos NO sea el 1.20 del Carnaval exclusivamente. Como no hay
        # festivo europeo ese día, debería ser 1.0.
        assert mult == 1.0

    def test_off_season_date_returns_1(self):
        cfg = _reload_config()
        assert cfg.get_holiday_multiplier("2026-06-15", "Europa") == 1.0
        assert cfg.get_holiday_multiplier("2026-09-10", "Caribe") == 1.0

    def test_invalid_dates_safe(self):
        cfg = _reload_config()
        assert cfg.get_holiday_multiplier("", "Europa") == 1.0
        assert cfg.get_holiday_multiplier("not-a-date", "Europa") == 1.0
        assert cfg.get_holiday_multiplier("2026-13-01", "Europa") == 1.0
        assert cfg.get_holiday_multiplier("2026", "Europa") == 1.0
        assert cfg.get_holiday_multiplier(None, "Europa") == 1.0  # type: ignore

    def test_accepts_datetime_iso(self):
        cfg = _reload_config()
        # El parser recorta a los primeros 10 chars: "2026-05-02T10:00:00"
        mult = cfg.get_holiday_multiplier("2026-05-02T10:00:00", "Asia")
        assert mult >= 1.20

    def test_overlap_picks_highest(self):
        cfg = _reload_config()
        # Si cayeran dos ventanas el mismo día, se coge la mayor.
        # Chinese NY 2026 solapa ligeramente con Carnaval ese año (2/15-2/24 vs 2/13-2/18)
        mult = cfg.get_holiday_multiplier("2026-02-17", "Asia")
        # Chinese NY pone 1.30 — mayor que otros posibles
        assert mult >= 1.30


class TestGetActiveHoliday:
    def test_returns_navidad_name(self):
        cfg = _reload_config()
        name = cfg.get_active_holiday("2026-12-25", "Europa")
        assert name == "Navidad/Nochevieja"

    def test_returns_golden_week(self):
        cfg = _reload_config()
        assert cfg.get_active_holiday("2026-05-02", "Asia") == "Golden Week"

    def test_off_season_empty(self):
        cfg = _reload_config()
        assert cfg.get_active_holiday("2026-06-15", "Europa") == ""


class TestSeasonalThresholdWithHoliday:
    def test_iso_date_applies_holiday_multiplier(self):
        cfg = _reload_config()
        base = 100.0
        # Sin iso_date → solo seasonal
        no_holiday = cfg.get_seasonal_threshold(base, "Europa", 4)
        # Con iso_date en Semana Santa → seasonal * holiday
        with_holiday = cfg.get_seasonal_threshold(base, "Europa", 4, iso_date="2026-04-03")
        assert with_holiday > no_holiday
        # Debería ser ~25% superior por el multiplicador 1.25
        ratio = with_holiday / no_holiday
        assert 1.20 <= ratio <= 1.30

    def test_iso_date_outside_holiday_no_effect(self):
        cfg = _reload_config()
        base = 100.0
        no_holiday = cfg.get_seasonal_threshold(base, "Europa", 6)
        with_iso = cfg.get_seasonal_threshold(base, "Europa", 6, iso_date="2026-06-15")
        assert no_holiday == with_iso

    def test_default_iso_date_is_backward_compat(self):
        """Sin iso_date, comportamiento idéntico al previo."""
        cfg = _reload_config()
        base = 100.0
        mult = cfg.get_seasonal_multiplier("Caribe", 2)
        assert cfg.get_seasonal_threshold(base, "Caribe", 2) == pytest.approx(base * mult)


class TestIsErrorFareSeasonalWithHoliday:
    def test_holiday_makes_marginal_fare_trigger_error(self):
        """Un precio medio fuera de festivo, en festivo debería gatillar."""
        cfg = _reload_config()
        # Business largo: threshold base = 400€
        # Caribe feb seasonal = 1.30 → threshold sin holiday = 520€
        # Caribe feb + Carnaval holiday = 1.20 → threshold con = 624€
        price = 560.0
        cabin = cfg.CABIN_BUSINESS
        dest = "HAV"
        # Solo estacional: 520€ → 560 > 520 ⇒ NO error
        no_holiday = cfg.is_error_fare_seasonal(price, cabin, dest, month=2, region="Caribe")
        # Con holiday en Carnaval: 624€ → 560 < 624 ⇒ SÍ error
        with_holiday = cfg.is_error_fare_seasonal(
            price, cabin, dest, month=2, region="Caribe", iso_date="2026-02-15"
        )
        assert no_holiday is False, f"Sin holiday debería NO ser error (precio 560 > 520)"
        assert with_holiday is True, f"Con holiday debería SÍ ser error (precio 560 < 624)"

    def test_no_iso_date_backward_compat(self):
        cfg = _reload_config()
        # Sin iso_date, comportamiento idéntico al test previo de abr-2026i
        price = 450.0
        cabin = cfg.CABIN_BUSINESS
        dest = "HAV"
        r1 = cfg.is_error_fare_seasonal(price, cabin, dest, month=2, region="Caribe")
        r2 = cfg.is_error_fare_seasonal(price, cabin, dest, month=2, region="Caribe", iso_date="")
        assert r1 == r2


class TestDetectorHolidayIntegration:
    def test_detector_uses_iso_date(self):
        src = (ENGINE / "detector.py").read_text(encoding="utf-8")
        # El detector pasa iso_date al seasonal + tag festivo en reason
        assert "iso_date=iso_date" in src
        assert "get_active_holiday" in src or "[festivo" in src
        assert "[festivo:" in src

    def test_detector_reason_includes_festivo_tag(self):
        src = (ENGINE / "detector.py").read_text(encoding="utf-8")
        assert "holiday_tag" in src
