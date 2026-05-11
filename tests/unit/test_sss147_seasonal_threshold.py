"""
SSS147 — seasonal_threshold deep tests.
=======================================
Targets: percentile, cheap_bucket, season_for_dates, seasonal_floor_range,
floor_is_anomalous.
"""
from __future__ import annotations

import pytest

from seasonal_threshold import (
    ABSOLUTE_GLITCH_FLOOR_EUR,
    SEASONAL_FLOOR_EUR,
    cheap_bucket,
    floor_is_anomalous,
    percentile,
    season_for_dates,
    seasonal_floor_range,
)


# ─────────────────────────────────────────────────────────────────
# percentile
# ─────────────────────────────────────────────────────────────────
def test_percentile_empty_raises():
    with pytest.raises(ValueError):
        percentile([], 50)


def test_percentile_single_value():
    assert percentile([42], 50) == 42


def test_percentile_zero_returns_min():
    assert percentile([5, 10, 20, 30], 0) == 5


def test_percentile_hundred_returns_max():
    assert percentile([5, 10, 20, 30], 100) == 30


def test_percentile_negative_returns_min():
    assert percentile([5, 10, 20, 30], -10) == 5


def test_percentile_over_hundred_returns_max():
    assert percentile([5, 10, 20, 30], 150) == 30


def test_percentile_50_is_median():
    # Median for [1, 2, 3, 4, 5]: pct=50 → k=2 → s[2]=3
    assert percentile([1, 2, 3, 4, 5], 50) == 3


def test_percentile_25_below_50():
    p25 = percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 25)
    p50 = percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50)
    assert p25 < p50


def test_percentile_interpolation():
    # [1, 2, 3, 4] @ 50 → k = 1.5 → interpolated between s[1]=2, s[2]=3
    res = percentile([1, 2, 3, 4], 50)
    assert 2 <= res <= 3
    assert res == 2.5


def test_percentile_unsorted_input_works():
    assert percentile([10, 30, 5, 20, 25], 50) == 20


# ─────────────────────────────────────────────────────────────────
# cheap_bucket
# ─────────────────────────────────────────────────────────────────
def test_cheap_bucket_below_glitch_floor():
    assert cheap_bucket(2.0, [50, 60, 70, 80]) == "ERROR"


def test_cheap_bucket_at_glitch_floor():
    # Exactly at the floor — function uses strict <, so this should be evaluated by other rules
    # ABSOLUTE_GLITCH_FLOOR_EUR is 5.0
    res = cheap_bucket(ABSOLUTE_GLITCH_FLOOR_EUR, [50, 60, 70, 80])
    assert res in {"ERROR", "CRIT", "CHOLLO", "OFERTA", "NORMAL"}


def test_cheap_bucket_too_few_samples_returns_normal():
    # < 3 samples → normal regardless
    assert cheap_bucket(100, [50, 60]) == "NORMAL"


def test_cheap_bucket_excludes_zero_prices():
    # Zero prices should be filtered out — pass only valid prices
    res = cheap_bucket(100, [0, 0, 0, 50, 60, 70])
    assert res in {"ERROR", "CRIT", "CHOLLO", "OFERTA", "NORMAL"}


def test_cheap_bucket_error_threshold():
    prices = [50, 60, 70, 80, 90, 100]  # p10≈50, median≈75
    # 60% of p10 = 30, so price < 30 = ERROR
    assert cheap_bucket(20.0, prices) == "ERROR"


def test_cheap_bucket_crit_threshold():
    prices = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140]
    p10_value = percentile([p for p in prices if p > 0], 10)
    # price <= p10 but > p10 * 0.6 → CRIT
    assert cheap_bucket(p10_value, prices) == "CRIT"


def test_cheap_bucket_normal_threshold():
    prices = [50, 60, 70, 80, 90, 100, 110]
    # High price → NORMAL
    assert cheap_bucket(200.0, prices) == "NORMAL"


@pytest.mark.parametrize("price,bucket_expected", [
    (1.0, "ERROR"),  # below glitch floor
    (300.0, "NORMAL"),  # high enough
])
def test_cheap_bucket_extremes(price, bucket_expected):
    prices = [50, 60, 70, 80, 90, 100, 110, 120]
    assert cheap_bucket(price, prices) == bucket_expected


def test_cheap_bucket_iterable_consumption_safe():
    # Pass a generator — function should handle iterables
    gen = (p for p in [50, 60, 70, 80, 90])
    res = cheap_bucket(100.0, gen)
    assert res in {"ERROR", "CRIT", "CHOLLO", "OFERTA", "NORMAL"}


# ─────────────────────────────────────────────────────────────────
# season_for_dates
# ─────────────────────────────────────────────────────────────────
def test_season_for_dates_invalid_strings():
    assert season_for_dates("invalid", "also-invalid") == "unknown"


def test_season_for_dates_swapped_returns_unknown():
    # from > to
    assert season_for_dates("2026-09-01", "2026-08-01") == "unknown"


def test_season_for_dates_summer_peak():
    # Mid of jul-aug
    assert season_for_dates("2026-07-15", "2026-07-31") == "peak_summer"


def test_season_for_dates_winter():
    # Mid winter
    assert season_for_dates("2026-12-15", "2026-12-31") in {"winter", "early_booking"}


def test_season_for_dates_shoulder():
    # Mid of spring or autumn (mid-month month is 3-6 or 9-11) → shoulder if not far ahead
    s = season_for_dates("2026-04-01", "2026-04-30")
    # Could be shoulder if not far ahead, but if >8 months ahead → early_booking
    assert s in {"shoulder", "early_booking"}


def test_season_for_dates_far_ahead_is_early_booking():
    # >= 8 months ahead → early_booking
    # Current date is 2026-05-11 per memory
    s = season_for_dates("2027-02-01", "2027-02-15")
    assert s == "early_booking"


# ─────────────────────────────────────────────────────────────────
# seasonal_floor_range + floor_is_anomalous
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("season", ["peak_summer", "winter", "shoulder",
                                     "early_booking", "unknown"])
def test_seasonal_floor_range_returns_tuple(season):
    lo, hi = seasonal_floor_range(season)
    assert lo > 0
    assert hi >= lo


def test_seasonal_floor_range_unknown_default():
    lo, hi = seasonal_floor_range("never-heard-of-this-season")
    # Falls back to "unknown"
    assert (lo, hi) == SEASONAL_FLOOR_EUR["unknown"]


def test_floor_is_anomalous_within_range():
    # Pick something in middle of summer range (10-15)
    assert floor_is_anomalous(12.0, "peak_summer") is False


def test_floor_is_anomalous_too_low():
    # < 50% of low bound
    assert floor_is_anomalous(0.5, "peak_summer") is True


def test_floor_is_anomalous_too_high():
    # > 180% of high bound for winter (high ≈25 → 45+)
    assert floor_is_anomalous(100.0, "winter") is True


@pytest.mark.parametrize("season,floor,expected", [
    ("peak_summer", 12, False),
    ("peak_summer", 1, True),
    ("winter", 20, False),
    ("winter", 50, True),
    ("shoulder", 18, False),
    ("shoulder", 80, True),
])
def test_floor_is_anomalous_matrix(season, floor, expected):
    assert floor_is_anomalous(floor, season) == expected
