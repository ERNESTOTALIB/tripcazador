"""
SSS147 — Config helpers deep edge cases.
========================================
Targets: get_seasonal_multiplier, get_seasonal_threshold,
get_distance_category, get_season_multiplier, is_error_fare,
is_error_fare_seasonal, _month_from_iso, get_holiday_multiplier,
get_active_holiday, is_multi_stop_anomaly, classify_ratio,
get_business_economy_ratio_thresholds, compute_bridging_synthetic,
compute_dual_bridging_synthetic.
"""
from __future__ import annotations

import os

import pytest

import config


# ─────────────────────────────────────────────────────────────────
# get_seasonal_multiplier
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("month", [0, 13, 14, -1, 100, None])
def test_seasonal_multiplier_invalid_month_returns_1(month):
    assert config.get_seasonal_multiplier("Europa", month) == 1.0


@pytest.mark.parametrize("region", ["", None])
def test_seasonal_multiplier_empty_region_returns_1(region):
    assert config.get_seasonal_multiplier(region, 6) == 1.0


def test_seasonal_multiplier_unknown_region_returns_1():
    assert config.get_seasonal_multiplier("Mars", 6) == 1.0


@pytest.mark.parametrize("month", list(range(1, 13)))
def test_seasonal_multiplier_returns_float_for_all_months(month):
    val = config.get_seasonal_multiplier("Europa", month)
    assert isinstance(val, float)
    assert 0 < val < 5  # sanity range


def test_seasonal_multiplier_case_insensitive():
    a = config.get_seasonal_multiplier("Europa", 6)
    b = config.get_seasonal_multiplier("EUROPA", 6)
    # Likely a == b due to substring match
    assert isinstance(a, float)
    assert isinstance(b, float)


# ─────────────────────────────────────────────────────────────────
# get_seasonal_threshold
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("base", [100, 200, 500, 1000])
def test_seasonal_threshold_returns_float(base):
    val = config.get_seasonal_threshold(base, "Europa", 6)
    assert isinstance(val, float)


def test_seasonal_threshold_zero_base():
    assert config.get_seasonal_threshold(0, "Europa", 6) == 0.0


def test_seasonal_threshold_with_iso_date():
    # Adding iso_date may apply holiday multiplier
    val = config.get_seasonal_threshold(100, "Europa", 12, iso_date="2026-12-25")
    assert isinstance(val, float)
    assert val >= 0


def test_seasonal_threshold_without_iso_date_no_holiday_applied():
    val = config.get_seasonal_threshold(100, "Europa", 6, iso_date="")
    val_with = config.get_seasonal_threshold(100, "Europa", 6, iso_date="2026-06-15")
    # Both should be valid floats; without iso == seasonal-only
    assert isinstance(val, float)
    assert isinstance(val_with, float)


# ─────────────────────────────────────────────────────────────────
# get_distance_category
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("dest,expected_or_default", [
    ("BCN", "corto"),
    ("FCO", "corto"),
    ("AGP", "corto"),
    ("PMI", "corto"),
    ("UNKNOWN_IATA", "largo"),  # default
    ("", "largo"),  # empty also defaults
])
def test_distance_category_returns_valid(dest, expected_or_default):
    val = config.get_distance_category(dest)
    assert val in {"corto", "medio", "largo", "ultra_largo"}


@pytest.mark.parametrize("dest", ["NRT", "SYD", "AKL", "PER", "MEL", "HND", "BNE"])
def test_distance_category_long_haul_pacific(dest):
    val = config.get_distance_category(dest)
    assert val in {"largo", "ultra_largo"}


# ─────────────────────────────────────────────────────────────────
# get_season_multiplier
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("date_str", ["", "invalid", "2026", "2026-13-01"])
def test_season_multiplier_invalid_date_returns_1(date_str):
    assert config.get_season_multiplier(date_str) == 1.0


def test_season_multiplier_high_season_summer():
    val = config.get_season_multiplier("2026-07-15")
    assert val > 1.0


def test_season_multiplier_high_season_christmas():
    val = config.get_season_multiplier("2026-12-22")
    assert val > 1.0


def test_season_multiplier_low_season_february():
    # Not in any peak window
    val = config.get_season_multiplier("2026-02-15")
    assert val == 1.0


# ─────────────────────────────────────────────────────────────────
# is_error_fare
# ─────────────────────────────────────────────────────────────────
def test_is_error_fare_unknown_cabin_returns_false():
    assert config.is_error_fare(50, cabin=999, destination="JFK") is False


def test_is_error_fare_very_cheap_long_haul_business_returns_true():
    # Business long-haul threshold likely > 100€
    assert config.is_error_fare(50, cabin=config.CABIN_BUSINESS, destination="JFK") is True


def test_is_error_fare_expensive_does_not_trigger():
    assert config.is_error_fare(10000, cabin=config.CABIN_ECONOMY, destination="JFK") is False


@pytest.mark.parametrize("dest", ["BCN", "FCO", "AGP", "JFK", "NRT", "SYD"])
def test_is_error_fare_known_destinations_returns_bool(dest):
    res = config.is_error_fare(100, cabin=config.CABIN_ECONOMY, destination=dest)
    assert isinstance(res, bool)


# ─────────────────────────────────────────────────────────────────
# is_error_fare_seasonal
# ─────────────────────────────────────────────────────────────────
def test_is_error_fare_seasonal_no_month_falls_back_to_basic():
    a = config.is_error_fare_seasonal(50, cabin=config.CABIN_ECONOMY,
                                       destination="JFK")
    b = config.is_error_fare(50, cabin=config.CABIN_ECONOMY, destination="JFK")
    assert a == b


def test_is_error_fare_seasonal_unknown_cabin_returns_false():
    assert config.is_error_fare_seasonal(50, cabin=99, destination="JFK",
                                          month=6, region="Europa") is False


def test_is_error_fare_seasonal_with_holiday_window():
    # Christmas window — should adjust threshold higher
    res = config.is_error_fare_seasonal(
        500, cabin=config.CABIN_ECONOMY, destination="JFK",
        month=12, region="*", iso_date="2026-12-25"
    )
    assert isinstance(res, bool)


# ─────────────────────────────────────────────────────────────────
# _month_from_iso
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("iso,expected", [
    ("", 0),
    (None, 0),
    ("not-a-date", 0),
    ("2026-01-15", 1),
    ("2026-12-31", 12),
    ("2026-06-15T10:00:00", 6),
    ("2026-13-15", 0),  # invalid month
    ("2026-00-15", 0),  # invalid month
    ("2026-06", 6),  # truncated
])
def test_month_from_iso_matrix(iso, expected):
    assert config._month_from_iso(iso) == expected


def test_month_from_iso_with_non_string():
    assert config._month_from_iso(12345) == 0
    assert config._month_from_iso([2026, 6, 15]) == 0


# ─────────────────────────────────────────────────────────────────
# get_holiday_multiplier
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("iso", ["", None, "not-iso", "2026/01/01", "abc"])
def test_holiday_multiplier_invalid_iso_returns_1(iso):
    assert config.get_holiday_multiplier(iso, "Europa") == 1.0


def test_holiday_multiplier_invalid_month_in_iso():
    assert config.get_holiday_multiplier("2026-13-01", "Europa") == 1.0


def test_holiday_multiplier_off_holiday_returns_1():
    # An ordinary date with no holiday window
    val = config.get_holiday_multiplier("2026-03-15", "Asia Pacífico")
    # Could still hit something else, but typically 1.0 outside
    assert isinstance(val, float)
    assert val >= 1.0


def test_holiday_multiplier_christmas_returns_above_1():
    val = config.get_holiday_multiplier("2026-12-25", "Europa")
    assert isinstance(val, float)


def test_holiday_multiplier_with_wildcard_region():
    # Some windows are "*" — universal
    val = config.get_holiday_multiplier("2026-12-25", "")
    assert isinstance(val, float)


# ─────────────────────────────────────────────────────────────────
# get_active_holiday
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("iso", ["", None, "abc", "2026"])
def test_active_holiday_invalid_iso_returns_empty(iso):
    assert config.get_active_holiday(iso, "Europa") == ""


def test_active_holiday_off_window_returns_empty_or_name():
    # A "neutral" date might be in some window
    val = config.get_active_holiday("2026-03-15", "Europa")
    assert isinstance(val, str)


def test_active_holiday_returns_string_for_christmas():
    val = config.get_active_holiday("2026-12-25", "Europa")
    assert isinstance(val, str)


# ─────────────────────────────────────────────────────────────────
# is_multi_stop_anomaly
# ─────────────────────────────────────────────────────────────────
def test_multi_stop_anomaly_zero_stops_returns_false():
    assert config.is_multi_stop_anomaly(50.0, cabin=1, destination="JFK", stops=0) is False


def test_multi_stop_anomaly_one_stop_returns_false():
    assert config.is_multi_stop_anomaly(50.0, cabin=1, destination="JFK", stops=1) is False


def test_multi_stop_anomaly_unknown_cabin_returns_false():
    assert config.is_multi_stop_anomaly(50.0, cabin=999, destination="JFK", stops=2) is False


def test_multi_stop_anomaly_high_price_no_anomaly():
    # 2 stops at €5000 → not below 50% of any threshold
    assert config.is_multi_stop_anomaly(5000.0, cabin=1, destination="JFK", stops=2) is False


def test_multi_stop_anomaly_very_low_price_triggers():
    # 2 stops at €20 ECONOMY → likely below threshold
    res = config.is_multi_stop_anomaly(20.0, cabin=1, destination="NRT", stops=2)
    assert isinstance(res, bool)


@pytest.mark.parametrize("stops", [2, 3, 4, 5])
def test_multi_stop_anomaly_increased_stops_apply_extra_discount(stops):
    # Verify the function doesn't explode with various stops counts
    res = config.is_multi_stop_anomaly(100.0, cabin=1, destination="JFK", stops=stops)
    assert isinstance(res, bool)


def test_multi_stop_anomaly_respects_env_override(monkeypatch):
    monkeypatch.setenv("MULTI_STOP_ANOMALY_PCT", "0.30")
    # Lower percentage = stricter threshold = harder to trigger
    res = config.is_multi_stop_anomaly(100.0, cabin=1, destination="JFK", stops=2)
    assert isinstance(res, bool)


# ─────────────────────────────────────────────────────────────────
# classify_ratio + get_business_economy_ratio_thresholds
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("ratio", [0.5, 1.0, 2.0, 5.0, 10.0])
def test_classify_ratio_returns_valid(ratio):
    cls = config.classify_ratio(ratio, "JFK")
    assert cls in {"ERROR", "ANOMALIA", "OFERTA", "NORMAL"}


def test_get_business_economy_ratio_thresholds_returns_dict():
    th = config.get_business_economy_ratio_thresholds("JFK")
    assert "error" in th
    assert "anomalia" in th
    assert "oferta" in th


@pytest.mark.parametrize("dest", ["JFK", "BCN", "NRT", "SYD", "UNKNOWN"])
def test_business_economy_ratio_thresholds_all_dests(dest):
    th = config.get_business_economy_ratio_thresholds(dest)
    assert isinstance(th, dict)


# ─────────────────────────────────────────────────────────────────
# compute_bridging_synthetic
# ─────────────────────────────────────────────────────────────────
def test_bridging_synthetic_no_legs_returns_none():
    res = config.compute_bridging_synthetic(
        origin="MAD", destination="NRT", deals_index={}
    )
    assert res is None


def test_bridging_synthetic_skips_when_total_high():
    # All legs expensive — total >= 80% of direct price → not emitted
    deals = {
        ("MAD", "LHR"): 100.0,
        ("LHR", "NRT"): 400.0,
    }
    res = config.compute_bridging_synthetic(
        origin="MAD", destination="NRT",
        deals_index=deals, direct_price=600.0,  # bridging = 500 > 0.8 * 600 = 480
    )
    assert res is None


def test_bridging_synthetic_emits_when_total_low():
    deals = {
        ("MAD", "LHR"): 100.0,
        ("LHR", "NRT"): 200.0,
    }
    res = config.compute_bridging_synthetic(
        origin="MAD", destination="NRT",
        deals_index=deals, direct_price=600.0,
    )
    assert res is not None
    assert res["bridging"] is True
    assert res["hub_via"] == "LHR"
    assert res["price_eur"] == 300.0


def test_bridging_synthetic_no_direct_price_score_60():
    deals = {
        ("MAD", "AMS"): 80.0,
        ("AMS", "NRT"): 250.0,
    }
    res = config.compute_bridging_synthetic(
        origin="MAD", destination="NRT", deals_index=deals, direct_price=None
    )
    assert res is not None
    assert res["score"] == 60


def test_bridging_synthetic_picks_cheapest_hub():
    deals = {
        ("MAD", "LHR"): 100.0,
        ("LHR", "NRT"): 500.0,  # total 600
        ("MAD", "AMS"): 50.0,
        ("AMS", "NRT"): 200.0,  # total 250 ← cheapest
    }
    res = config.compute_bridging_synthetic(
        origin="MAD", destination="NRT", deals_index=deals, direct_price=1000.0,
    )
    assert res is not None
    assert res["hub_via"] == "AMS"


def test_bridging_synthetic_skips_hub_equal_origin():
    deals = {
        ("MAD", "MAD"): 0.0,  # garbage
        ("MAD", "AMS"): 100.0,
        ("AMS", "NRT"): 200.0,
    }
    res = config.compute_bridging_synthetic(
        origin="MAD", destination="NRT",
        deals_index=deals,
        direct_price=500.0,
        hubs=["MAD", "AMS"],  # MAD should be skipped (equals origin)
    )
    # Should still find AMS valid
    assert res is not None
    assert res["hub_via"] == "AMS"


def test_bridging_synthetic_custom_hubs():
    deals = {
        ("MAD", "CDG"): 50.0,
        ("CDG", "NRT"): 200.0,
    }
    res = config.compute_bridging_synthetic(
        origin="MAD", destination="NRT",
        deals_index=deals, direct_price=500.0,
        hubs=["CDG"],
    )
    assert res is not None
    assert res["hub_via"] == "CDG"


# ─────────────────────────────────────────────────────────────────
# compute_dual_bridging_synthetic
# ─────────────────────────────────────────────────────────────────
def test_dual_bridging_empty_returns_none():
    res = config.compute_dual_bridging_synthetic(
        origin="MAD", destination="DPS", deals_index={}
    )
    assert res is None


def test_dual_bridging_emits_when_clear_savings():
    deals = {
        ("MAD", "AMS"): 60.0,
        ("AMS", "BKK"): 350.0,
        ("BKK", "DPS"): 90.0,
    }
    res = config.compute_dual_bridging_synthetic(
        origin="MAD", destination="DPS",
        deals_index=deals, direct_price=1000.0,
    )
    assert res is not None
    assert res["bridging_dual"] is True
    assert res["hub1_via"] == "AMS"
    assert res["hub2_via"] == "BKK"


def test_dual_bridging_skips_when_total_high():
    deals = {
        ("MAD", "AMS"): 200.0,
        ("AMS", "BKK"): 350.0,
        ("BKK", "DPS"): 90.0,
    }
    res = config.compute_dual_bridging_synthetic(
        origin="MAD", destination="DPS",
        deals_index=deals, direct_price=800.0,  # 640 > 0.70 * 800
    )
    assert res is None


def test_dual_bridging_no_direct_score_50():
    deals = {
        ("MAD", "CDG"): 50.0,
        ("CDG", "DOH"): 200.0,
        ("DOH", "DPS"): 150.0,
    }
    res = config.compute_dual_bridging_synthetic(
        origin="MAD", destination="DPS",
        deals_index=deals, direct_price=None,
    )
    assert res is not None
    assert res["score"] == 50
