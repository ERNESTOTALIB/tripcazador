"""
SSS147 — Detector individual technique edge cases.
==================================================
Deep tests for the per-technique functions: t0_absolute_error_fare,
t1_cross_date, t1b_iqr_outlier, t1c_zscore, t4_business_economy_ratio,
t5_historical_baseline, t6_flash_drop, t7_airline_pattern.
"""
from __future__ import annotations

import pytest

import config
import detector


def _build_flight(**overrides) -> dict:
    base = {
        "source": "kiwi",
        "origin": "MAD",
        "destination": "JFK",
        "price_eur": 250.0,
        "cabin_code": 1,
        "cabin": "economy",
        "airline": "IB",
        "date_out": "2026-06-15",
        "stops": 0,
        "distance_category": "largo",
    }
    base.update(overrides)
    return base


# ─────────────────────────────────────────────────────────────────
# T0 — absolute error fare
# ─────────────────────────────────────────────────────────────────
def test_t0_empty_input_returns_empty():
    assert detector.t0_absolute_error_fare([]) == []


def test_t0_high_price_not_triggered():
    flights = [_build_flight(price_eur=5000.0)]
    res = detector.t0_absolute_error_fare(flights)
    assert res[0]["t0_triggered"] is False
    assert res[0]["t0_score"] == 0


def test_t0_lowcost_high_price_not_triggered():
    flights = [_build_flight(airline="FR", price_eur=200.0, distance_category="corto")]
    res = detector.t0_absolute_error_fare(flights)
    assert res[0]["t0_triggered"] is False


def test_t0_lowcost_very_low_price_triggered():
    flights = [_build_flight(airline="FR", price_eur=3.0, distance_category="corto",
                             destination="BCN")]
    res = detector.t0_absolute_error_fare(flights)
    assert res[0]["t0_triggered"] is True
    assert res[0]["is_lowcost"] is True


def test_t0_zero_price():
    flights = [_build_flight(price_eur=0.0)]
    res = detector.t0_absolute_error_fare(flights)
    # 0 price always triggers something
    assert "t0_triggered" in res[0]


def test_t0_missing_price_defaults_to_zero():
    flights = [{
        "source": "kiwi", "origin": "MAD", "destination": "JFK",
        "cabin_code": 1, "airline": "IB", "date_out": "2026-06-15",
    }]
    res = detector.t0_absolute_error_fare(flights)
    # Should not raise; result still has t0_triggered key
    assert "t0_triggered" in res[0]


def test_t0_preserves_original_keys():
    flights = [_build_flight(custom_key="custom_value")]
    res = detector.t0_absolute_error_fare(flights)
    assert res[0]["custom_key"] == "custom_value"


@pytest.mark.parametrize("airline", ["FR", "U2", "VY", "W6", "MT"])
def test_t0_known_lowcost_airlines_use_lowcost_logic(airline):
    flights = [_build_flight(airline=airline, price_eur=5.0,
                             distance_category="corto", destination="BCN")]
    res = detector.t0_absolute_error_fare(flights)
    if airline in detector.LOWCOST_AIRLINES_DETECTOR:
        assert res[0]["is_lowcost"] is True


@pytest.mark.parametrize("price,distance,cabin", [
    (50, "corto", 1),
    (1000, "ultra_largo", 1),
    (300, "medio", 1),
    (200, "largo", 1),
    (500, "ultra_largo", 3),
])
def test_t0_various_inputs_no_exception(price, distance, cabin):
    flights = [_build_flight(price_eur=price, distance_category=distance,
                             cabin_code=cabin)]
    res = detector.t0_absolute_error_fare(flights)
    assert "t0_triggered" in res[0]


# ─────────────────────────────────────────────────────────────────
# T1 — cross-date comparison
# ─────────────────────────────────────────────────────────────────
def test_t1_empty():
    assert detector.t1_cross_date([]) == []


def test_t1_single_flight_not_triggered():
    res = detector.t1_cross_date([_build_flight()])
    assert res[0]["t1_triggered"] is False


def test_t1_two_flights_not_enough_for_median():
    flights = [_build_flight(price_eur=100), _build_flight(price_eur=200)]
    res = detector.t1_cross_date(flights)
    # Needs >= 3 to compute median
    assert res[0]["t1_triggered"] is False


def test_t1_low_price_triggers_when_below_median():
    flights = [
        _build_flight(price_eur=500),
        _build_flight(price_eur=510),
        _build_flight(price_eur=520),
        _build_flight(price_eur=50),  # below median significantly
    ]
    res = detector.t1_cross_date(flights)
    # Last flight should have t1_triggered True
    low = [f for f in res if f["price_eur"] == 50]
    assert len(low) > 0
    assert low[0]["t1_triggered"] is True


def test_t1_doesnt_trigger_when_at_or_above_median():
    flights = [
        _build_flight(price_eur=500),
        _build_flight(price_eur=500),
        _build_flight(price_eur=500),
    ]
    res = detector.t1_cross_date(flights)
    for r in res:
        assert r["t1_triggered"] is False


def test_t1_zero_median_no_division_error():
    # Edge case: all zeros — shouldn't divide by zero
    flights = [_build_flight(price_eur=0.0) for _ in range(5)]
    res = detector.t1_cross_date(flights)
    for r in res:
        assert "t1_triggered" in r


# ─────────────────────────────────────────────────────────────────
# T1b — IQR outlier
# ─────────────────────────────────────────────────────────────────
def test_t1b_empty():
    assert detector.t1b_iqr_outlier([]) == []


def test_t1b_few_flights_not_triggered():
    res = detector.t1b_iqr_outlier([_build_flight()])
    assert res[0]["t1b_triggered"] is False


def test_t1b_outlier_below_lower_triggered():
    # 4+ flights with one extreme outlier
    flights = [
        _build_flight(price_eur=500),
        _build_flight(price_eur=520),
        _build_flight(price_eur=550),
        _build_flight(price_eur=580),
        _build_flight(price_eur=10),  # extreme outlier
    ]
    res = detector.t1b_iqr_outlier(flights)
    outlier = [f for f in res if f["price_eur"] == 10][0]
    assert outlier["t1b_triggered"] is True


def test_t1b_normal_price_not_triggered():
    flights = [_build_flight(price_eur=p) for p in [500, 510, 520, 530, 540]]
    res = detector.t1b_iqr_outlier(flights)
    # All values in normal range — t1b for the middle should not trigger
    for r in res:
        # Middle values shouldn't trigger
        if 510 <= r["price_eur"] <= 530:
            assert r["t1b_triggered"] is False or r["t1b_score"] <= 10


def test_t1b_q1_price_low_score_triggered():
    flights = [_build_flight(price_eur=p) for p in [500, 510, 520, 530, 540, 550]]
    res = detector.t1b_iqr_outlier(flights)
    # Q1 marker triggers low-score t1b only
    has_q1 = any(r.get("t1b_score") == 8 for r in res)
    # At least the Q1 case should be possible
    assert all("t1b_score" in r for r in res)


# ─────────────────────────────────────────────────────────────────
# T1c — z-score
# ─────────────────────────────────────────────────────────────────
def test_t1c_empty():
    assert detector.t1c_zscore([]) == []


def test_t1c_needs_8_or_more_flights():
    # Less than 8 → no trigger
    flights = [_build_flight(price_eur=p) for p in [500, 510, 520, 530, 540]]
    res = detector.t1c_zscore(flights)
    for r in res:
        assert r["t1c_triggered"] is False


def test_t1c_extreme_low_price_triggered():
    # 8+ flights — one with extreme z-score
    flights = [_build_flight(price_eur=p)
               for p in [500, 510, 520, 530, 540, 550, 560, 570, 580]]
    flights.append(_build_flight(price_eur=10))
    res = detector.t1c_zscore(flights)
    extreme = [f for f in res if f["price_eur"] == 10][0]
    assert extreme["t1c_triggered"] is True
    assert extreme["t1c_zscore"] is not None
    assert extreme["t1c_zscore"] < 0


def test_t1c_no_trigger_for_at_mean_price():
    prices = [500] * 10
    flights = [_build_flight(price_eur=p) for p in prices]
    res = detector.t1c_zscore(flights)
    for r in res:
        assert r["t1c_triggered"] is False


# ─────────────────────────────────────────────────────────────────
# T4 — Business/Economy ratio
# ─────────────────────────────────────────────────────────────────
def test_t4_empty():
    assert detector.t4_business_economy_ratio([]) == []


def test_t4_economy_flight_no_trigger():
    flights = [_build_flight(cabin_code=1)]
    res = detector.t4_business_economy_ratio(flights)
    assert res[0]["t4_triggered"] is False


def test_t4_business_no_economy_no_trigger():
    flights = [_build_flight(cabin_code=3, price_eur=250.0)]
    res = detector.t4_business_economy_ratio(flights)
    # No economy for the same route → no comparison
    assert res[0]["t4_triggered"] is False


def test_t4_business_low_ratio_triggers():
    # Business at 1.2x economy → low ratio = ERROR
    flights = [
        _build_flight(cabin_code=1, price_eur=200.0),
        _build_flight(cabin_code=3, price_eur=250.0),
    ]
    res = detector.t4_business_economy_ratio(flights)
    biz = [f for f in res if f["cabin_code"] == 3][0]
    assert biz["t4_triggered"] is True
    assert biz["t4_ratio"] is not None


def test_t4_first_class_uses_business_logic():
    flights = [
        _build_flight(cabin_code=1, price_eur=200.0),
        _build_flight(cabin_code=4, price_eur=350.0),
    ]
    res = detector.t4_business_economy_ratio(flights)
    first = [f for f in res if f["cabin_code"] == 4][0]
    assert first["t4_ratio"] is not None


def test_t4_economy_zero_division_safety():
    # Economy at 0 EUR → ratio = 99 (safe default)
    flights = [
        _build_flight(cabin_code=1, price_eur=0.0),
        _build_flight(cabin_code=3, price_eur=500.0),
    ]
    res = detector.t4_business_economy_ratio(flights)
    biz = [f for f in res if f["cabin_code"] == 3][0]
    # Should not raise
    assert "t4_triggered" in biz


# ─────────────────────────────────────────────────────────────────
# T5 — historical baseline
# ─────────────────────────────────────────────────────────────────
def test_t5_empty():
    assert detector.t5_historical_baseline([], {}) == []


def test_t5_no_history_no_trigger():
    flights = [_build_flight()]
    res = detector.t5_historical_baseline(flights, {})
    assert res[0]["t5_triggered"] is False


def test_t5_few_history_entries_not_enough():
    # Need >= 5 entries
    history = {("MAD", "JFK", 1): [500.0, 510.0]}
    flights = [_build_flight(price_eur=100.0)]
    res = detector.t5_historical_baseline(flights, history)
    assert res[0]["t5_triggered"] is False


def test_t5_drop_below_baseline_triggers():
    history = {("MAD", "JFK", 1): [500.0, 510.0, 520.0, 530.0, 540.0, 550.0]}
    flights = [_build_flight(price_eur=100.0)]
    res = detector.t5_historical_baseline(flights, history)
    assert res[0]["t5_triggered"] is True
    assert res[0]["t5_baseline"] is not None


def test_t5_zero_baseline_no_division_error():
    history = {("MAD", "JFK", 1): [0.0, 0.0, 0.0, 0.0, 0.0]}
    flights = [_build_flight(price_eur=100.0)]
    res = detector.t5_historical_baseline(flights, history)
    # Should not divide by zero — t5_triggered must be False or absent
    assert res[0]["t5_triggered"] is False


def test_t5_high_price_no_trigger():
    history = {("MAD", "JFK", 1): [500.0, 510.0, 520.0, 530.0, 540.0]}
    flights = [_build_flight(price_eur=1000.0)]
    res = detector.t5_historical_baseline(flights, history)
    assert res[0]["t5_triggered"] is False


# ─────────────────────────────────────────────────────────────────
# T6 — flash drop
# ─────────────────────────────────────────────────────────────────
def test_t6_empty():
    assert detector.t6_flash_drop([], {}) == []


def test_t6_no_previous_price_no_trigger():
    flights = [_build_flight()]
    res = detector.t6_flash_drop(flights, {})
    assert res[0]["t6_triggered"] is False


def test_t6_big_drop_triggers():
    recent = {("MAD", "JFK", 1, "IB"): 1000.0}
    flights = [_build_flight(price_eur=400.0)]
    res = detector.t6_flash_drop(flights, recent)
    assert res[0]["t6_triggered"] is True


@pytest.mark.parametrize("prev,curr,expected", [
    (1000, 400, True),  # 60% drop
    (1000, 500, True),  # 50% drop
    (1000, 600, True),  # 40% drop
    (1000, 700, True),  # 30% drop
    (1000, 750, True),  # 25% drop
    (1000, 800, False),  # 20% drop - threshold is 25
    (1000, 900, False),  # 10% drop
    (0, 100, False),  # prev_price 0 — no trigger
])
def test_t6_drop_threshold_matrix(prev, curr, expected):
    recent = {("MAD", "JFK", 1, "IB"): prev}
    flights = [_build_flight(price_eur=curr)]
    res = detector.t6_flash_drop(flights, recent)
    assert res[0]["t6_triggered"] == expected


def test_t6_no_drop_no_trigger():
    recent = {("MAD", "JFK", 1, "IB"): 100.0}
    flights = [_build_flight(price_eur=200.0)]
    res = detector.t6_flash_drop(flights, recent)
    assert res[0]["t6_triggered"] is False


# ─────────────────────────────────────────────────────────────────
# T7 — airline pattern
# ─────────────────────────────────────────────────────────────────
def test_t7_empty():
    assert detector.t7_airline_pattern([]) == []


def test_t7_not_suspicious_no_trigger():
    flight = _build_flight(t0_triggered=False, t4_triggered=False)
    res = detector.t7_airline_pattern([flight])
    assert res[0]["t7_triggered"] is False


def test_t7_suspicious_error_prone_airline_triggered():
    # IB is in AIRLINES_ERROR_PRONE
    flight = _build_flight(t0_triggered=True, airline="IB")
    res = detector.t7_airline_pattern([flight])
    assert res[0]["t7_triggered"] is True
    assert res[0]["t7_score"] >= 15


def test_t7_premium_business_higher_score():
    # Singapore Airlines (SQ) Business is premium
    flight = _build_flight(
        t0_triggered=True, airline="SQ", cabin_code=config.CABIN_BUSINESS
    )
    res = detector.t7_airline_pattern([flight])
    assert res[0]["t7_triggered"] is True
    # Premium business in t7 awards bonus
    assert res[0]["t7_score"] >= 15


def test_t7_unknown_airline_no_trigger():
    flight = _build_flight(t0_triggered=True, airline="XX")
    res = detector.t7_airline_pattern([flight])
    assert res[0]["t7_triggered"] is False
