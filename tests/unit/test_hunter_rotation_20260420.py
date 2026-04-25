"""
tests/unit/test_hunter_rotation_20260420.py
============================================
Regresiones sobre la rotación de perfiles de caza añadida en abril 2026
(tarea #177 — Hunters: nuevos destinos + configs familiares/weekend).

Cubren:
  - HUNT_PROFILES contiene los 4 perfiles esperados (anywhere-tier1,
    error-volatile, business-transatlantic, weekend-tier2)
  - _select_profile rota cíclicamente sin saltos
  - HUNT_PROFILE= (override) fuerza un perfil concreto
  - HUNT_ROTATION=0 desactiva rotación (legacy behavior)
  - Nuevos presets de destino (mar-rojo, marruecos, weekend, family-beach)
    están en config.py y sin duplicados
  - Los nuevos presets están accesibles vía parse_destinations() en main.py
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


def _reload_cron_runner():
    import cron_runner  # type: ignore
    importlib.reload(cron_runner)
    return cron_runner


def _reload_config():
    import config  # type: ignore
    importlib.reload(config)
    return config


class TestHuntProfiles:
    def test_four_profiles_defined(self, monkeypatch):
        monkeypatch.delenv("HUNT_PROFILE", raising=False)
        monkeypatch.delenv("HUNT_ROTATION", raising=False)
        cr = _reload_cron_runner()
        names = [p["name"] for p in cr.HUNT_PROFILES]
        # Orden importa porque determina la rotación: tick 0 = anywhere-tier1
        assert names == [
            "anywhere-tier1",
            "error-volatile",
            "business-transatlantic",
            "weekend-tier2",
        ]

    def test_every_profile_has_required_keys(self):
        cr = _reload_cron_runner()
        for p in cr.HUNT_PROFILES:
            assert "name" in p and isinstance(p["name"], str)
            assert "mode" in p and isinstance(p["mode"], str)
            assert "extra" in p and isinstance(p["extra"], list)
            assert "nights_range" in p
            a, b = p["nights_range"]
            assert 0 < a <= b <= 30, f"{p['name']} nights_range fuera de rango"

    def test_weekend_profile_uses_short_nights(self):
        cr = _reload_cron_runner()
        weekend = next(p for p in cr.HUNT_PROFILES if p["name"] == "weekend-tier2")
        # Un weekend ≤ 4 noches por definición
        assert weekend["nights_range"][1] <= 4

    def test_business_profile_targets_transatlantic_origins(self):
        cr = _reload_cron_runner()
        biz = next(p for p in cr.HUNT_PROFILES if p["name"] == "business-transatlantic")
        assert "--cabin" in biz["extra"]
        assert "business" in biz["extra"]
        assert "transatlantic" in biz["extra"]

    def test_error_profile_targets_volatile(self):
        cr = _reload_cron_runner()
        err = next(p for p in cr.HUNT_PROFILES if p["name"] == "error-volatile")
        assert err["mode"] == "error-hunter"
        assert "volatile" in err["extra"]


class TestProfileSelection:
    def test_rotation_cycles_through_all_profiles(self, monkeypatch):
        monkeypatch.delenv("HUNT_PROFILE", raising=False)
        monkeypatch.delenv("HUNT_ROTATION", raising=False)
        cr = _reload_cron_runner()
        n = len(cr.HUNT_PROFILES)
        selections = [cr._select_profile(i)["name"] for i in range(n * 2)]
        # Cada perfil aparece exactamente 2 veces en 2N ticks
        for p in cr.HUNT_PROFILES:
            assert selections.count(p["name"]) == 2

    def test_force_profile_via_env(self, monkeypatch):
        monkeypatch.setenv("HUNT_PROFILE", "error-volatile")
        cr = _reload_cron_runner()
        # Cualquier tick devuelve siempre el mismo perfil forzado
        for i in range(10):
            assert cr._select_profile(i)["name"] == "error-volatile"

    def test_force_invalid_profile_falls_back_to_rotation(self, monkeypatch):
        monkeypatch.setenv("HUNT_PROFILE", "does-not-exist")
        monkeypatch.delenv("HUNT_ROTATION", raising=False)
        cr = _reload_cron_runner()
        # Al no existir el perfil forzado, cae en rotación normal
        assert cr._select_profile(0)["name"] == "anywhere-tier1"
        assert cr._select_profile(1)["name"] == "error-volatile"

    def test_rotation_disabled_pins_to_first_profile(self, monkeypatch):
        monkeypatch.delenv("HUNT_PROFILE", raising=False)
        monkeypatch.setenv("HUNT_ROTATION", "0")
        cr = _reload_cron_runner()
        for i in range(5):
            assert cr._select_profile(i)["name"] == "anywhere-tier1"


class TestNewDestinationPresets:
    """Nuevos presets temáticos de destino añadidos en abr-2026g."""

    def test_mar_rojo_preset_exists_and_contains_core_airports(self):
        cfg = _reload_config()
        assert hasattr(cfg, "DEST_MAR_ROJO")
        mr = cfg.DEST_MAR_ROJO
        # Hurghada y Sharm-el-Sheikh son la base del preset
        assert "HRG" in mr
        assert "SSH" in mr
        # Aqaba es el puerto jordano al Mar Rojo norte
        assert "AQJ" in mr
        assert len(mr) == len(set(mr)), "DEST_MAR_ROJO tiene duplicados"

    def test_marruecos_preset_exists(self):
        cfg = _reload_config()
        assert hasattr(cfg, "DEST_MARRUECOS")
        m = cfg.DEST_MARRUECOS
        assert "RAK" in m  # Marrakech
        assert "AGA" in m  # Agadir
        assert "CMN" in m  # Casablanca
        assert len(m) == len(set(m)), "DEST_MARRUECOS tiene duplicados"

    def test_weekend_europe_preset_dedup(self):
        cfg = _reload_config()
        assert hasattr(cfg, "DEST_WEEKEND_EUROPE")
        w = cfg.DEST_WEEKEND_EUROPE
        # Dedup activo
        assert len(w) == len(set(w))
        # Debería incluir escapadas cortas clásicas
        assert "LIS" in w
        assert "PRG" in w

    def test_family_beach_preset_dedup(self):
        cfg = _reload_config()
        assert hasattr(cfg, "DEST_FAMILY_BEACH")
        f = cfg.DEST_FAMILY_BEACH
        assert len(f) == len(set(f))
        # Baleares + Canarias imprescindibles para mercado español
        assert "PMI" in f
        assert "TFS" in f

    def test_africa_destinations_expanded(self):
        cfg = _reload_config()
        # Marruecos ampliado dentro de DEST_AFRICA + Mar Rojo egipcio
        assert "RAK" in cfg.DEST_AFRICA
        assert "AGA" in cfg.DEST_AFRICA
        assert "HRG" in cfg.DEST_AFRICA
        assert "SSH" in cfg.DEST_AFRICA
        # La lista no tiene duplicados
        assert len(cfg.DEST_AFRICA) == len(set(cfg.DEST_AFRICA))


class TestMainPresetMap:
    """main.py debe exponer los nuevos presets vía --dest."""

    def test_main_preset_map_contains_new_entries(self):
        main_py = (ENGINE / "main.py").read_text(encoding="utf-8")
        # El código usa un diccionario preset_map con estos keys:
        for key in ("mar-rojo", "marruecos", "weekend", "family-beach"):
            assert f'"{key}":' in main_py, (
                f"preset '{key}' no está expuesto en main.parse_destinations"
            )
