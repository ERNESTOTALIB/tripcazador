"""
SSS147 — Detector statistical helpers deep edge cases.
======================================================
Tests for compute_iqr_bounds, compute_zscore, classify_by_score with
parametrized inputs to push coverage on the pure-stat helpers.
"""
from __future__ import annotations

import math

import pytest

import detector


# ─────────────────────────────────────────────────────────────────
# compute_iqr_bounds — robustness against tiny inputs / negatives
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("prices", [
    [],
    [10.0],
    [10.0, 20.0],
    [10.0, 20.0, 30.0],
])
def test_iqr_returns_none_for_too_few(prices):
    res = detector.compute_iqr_bounds(prices)
    assert res["q1"] is None
    assert res["q3"] is None
    assert res["iqr"] is None
    assert res["lower"] is None
    assert res["upper"] is None


def test_iqr_returns_full_fields_for_4_or_more():
    res = detector.compute_iqr_bounds([10.0, 20.0, 30.0, 40.0])
    assert res["q1"] is not None
    assert res["q3"] is not None
    assert res["iqr"] is not None
    assert res["lower"] is not None
    assert res["upper"] is not None
    assert res["median"] is not None
    assert res["mean"] is not None
    assert res["p10"] is not None
    assert res["p90"] is not None


@pytest.mark.parametrize("n", [5, 10, 50, 100, 1000])
def test_iqr_q1_le_median_le_q3_for_various_sizes(n):
    prices = [float(i + 1) for i in range(n)]
    res = detector.compute_iqr_bounds(prices)
    assert res["q1"] <= res["median"] <= res["q3"]


def test_iqr_uniform_distribution_lower_upper_are_outside_data():
    prices = [50.0] * 8
    res = detector.compute_iqr_bounds(prices)
    # All equal → iqr=0 → lower=upper=50
    assert res["iqr"] == 0
    assert res["lower"] == 50.0
    assert res["upper"] == 50.0


def test_iqr_with_negative_prices_does_not_explode():
    prices = [-5.0, -3.0, -1.0, 1.0, 3.0, 5.0]
    res = detector.compute_iqr_bounds(prices)
    assert res["q1"] is not None
    assert isinstance(res["mean"], float)


def test_iqr_skewed_distribution_q3_greater_than_q1():
    prices = [10.0, 12.0, 15.0, 100.0, 200.0, 300.0, 500.0, 1000.0]
    res = detector.compute_iqr_bounds(prices)
    assert res["q3"] > res["q1"]
    assert res["iqr"] > 0


def test_iqr_with_floats():
    prices = [10.5, 20.3, 30.1, 40.9, 50.5, 60.2, 70.7]
    res = detector.compute_iqr_bounds(prices)
    assert isinstance(res["iqr"], float)
    assert res["iqr"] >= 0


# ─────────────────────────────────────────────────────────────────
# compute_zscore — edge cases
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("prices", [
    [],
    [10.0],
    [10.0, 20.0],
    [10.0, 20.0, 30.0],
    [10.0, 20.0, 30.0, 40.0],
])
def test_zscore_returns_zero_for_too_few(prices):
    assert detector.compute_zscore(100.0, prices) == 0.0


def test_zscore_returns_zero_for_zero_variance():
    # All same → stdev=0 → returns 0.0 not infinity
    assert detector.compute_zscore(50.0, [50.0] * 10) == 0.0


def test_zscore_negative_for_below_mean():
    z = detector.compute_zscore(10.0, [100.0, 105.0, 110.0, 115.0, 120.0, 125.0])
    assert z < 0


def test_zscore_positive_for_above_mean():
    z = detector.compute_zscore(200.0, [100.0, 105.0, 110.0, 115.0, 120.0, 125.0])
    assert z > 0


def test_zscore_near_zero_for_at_mean():
    prices = [100.0, 105.0, 110.0, 115.0, 120.0, 125.0]
    mean_val = sum(prices) / len(prices)
    z = detector.compute_zscore(mean_val, prices)
    assert abs(z) < 0.5  # very close to 0


@pytest.mark.parametrize("offset_sigmas,expected_sign", [
    (-3.0, "neg"),
    (-2.0, "neg"),
    (2.0, "pos"),
    (3.0, "pos"),
])
def test_zscore_sign_for_offset(offset_sigmas, expected_sign):
    prices = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145]
    import statistics
    mu = statistics.mean(prices)
    sd = statistics.stdev(prices)
    target = mu + offset_sigmas * sd
    z = detector.compute_zscore(target, prices)
    if expected_sign == "neg":
        assert z < 0
    else:
        assert z > 0


def test_zscore_handles_string_in_list_via_exception():
    # The function is wrapped in try/except — passing strings should not raise
    # because statistics.mean would explode and the function returns 0.0
    assert detector.compute_zscore(50.0, ["x", "y", "z", "a", "b", "c"]) == 0.0


# ─────────────────────────────────────────────────────────────────
# classify_by_score — parametrized matrix
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("score,techniques,is_lowcost,expected", [
    # CRÍTICO needs score>=75 and techniques>=2 (3 if lowcost)
    (90.0, 3, False, detector.CLASS_CRITICO),
    (90.0, 2, False, detector.CLASS_CRITICO),
    (90.0, 1, False, detector.CLASS_ANOMALIA),  # only 1 technique → not CRITICO; >=30 yields ANOMALIA
    (75.0, 2, False, detector.CLASS_CRITICO),
    (74.9, 2, False, detector.CLASS_ERROR),
    # Low-cost requires 3+ techniques for CRITICO
    (90.0, 2, True, detector.CLASS_ERROR),
    (90.0, 3, True, detector.CLASS_CRITICO),
    (90.0, 4, True, detector.CLASS_CRITICO),
    # ERROR class
    (60.0, 2, False, detector.CLASS_ERROR),
    (50.0, 2, False, detector.CLASS_ERROR),
    (49.0, 2, False, detector.CLASS_ANOMALIA),
    # ANOMALIA
    (35.0, 1, False, detector.CLASS_ANOMALIA),
    (30.0, 1, False, detector.CLASS_ANOMALIA),
    # OFERTA
    (20.0, 1, False, detector.CLASS_OFERTA),
    (15.0, 0, False, detector.CLASS_OFERTA),
    # NORMAL
    (14.0, 0, False, detector.CLASS_NORMAL),
    (0.0, 0, False, detector.CLASS_NORMAL),
    (-5.0, 1, False, detector.CLASS_NORMAL),
])
def test_classify_by_score_matrix(score, techniques, is_lowcost, expected):
    assert detector.classify_by_score(score, techniques, is_lowcost=is_lowcost) == expected


@pytest.mark.parametrize("score", [0, 1, 14.9, 15.0, 29.9, 30.0, 49.9, 50.0, 74.9, 75.0, 99.9, 100.0])
def test_classify_by_score_returns_valid_class(score):
    cls = detector.classify_by_score(score, 2, is_lowcost=False)
    assert cls in {
        detector.CLASS_CRITICO, detector.CLASS_ERROR,
        detector.CLASS_ANOMALIA, detector.CLASS_OFERTA, detector.CLASS_NORMAL,
    }


def test_classify_extreme_high_score_with_zero_techniques():
    # No techniques triggered → can never be CRITICO/ERROR even if score is 100
    cls = detector.classify_by_score(100, 0, is_lowcost=False)
    assert cls in {detector.CLASS_ANOMALIA, detector.CLASS_OFERTA, detector.CLASS_NORMAL}


# ─────────────────────────────────────────────────────────────────
# analyze_all — empty + single-flight + multi-flight basics
# ─────────────────────────────────────────────────────────────────
def test_analyze_all_empty_returns_empty():
    assert detector.analyze_all([]) == []


def test_analyze_all_none_args_default_to_empty_dicts():
    # Should not raise even with no history / recent
    result = detector.analyze_all([], historical_data=None, recent_prices=None)
    assert result == []


def test_analyze_all_with_one_flight_normalizes_cabin(sample_flight):
    sample_flight["cabin"] = "Economy"
    result = detector.analyze_all([sample_flight], min_score=0)
    # cabin should be lowercased
    for r in result:
        if r.get("cabin"):
            assert r["cabin"].islower() or r["cabin"] == r["cabin"].lower()


def test_analyze_all_score_descending(flights_population):
    res = detector.analyze_all(flights_population, min_score=0)
    if len(res) > 1:
        for i in range(len(res) - 1):
            assert res[i]["final_score"] >= res[i + 1]["final_score"]


def test_analyze_all_min_score_filters_below():
    res = detector.analyze_all([
        {
            "source": "kiwi", "origin": "MAD", "destination": "FCO",
            "price_eur": 80.0, "cabin_code": 1, "cabin": "economy",
            "airline": "IB", "date_out": "2026-06-15", "stops": 0,
        }
    ], min_score=99)
    # Most flights won't reach 99 score with a single technique
    assert all(d["final_score"] >= 99 for d in res)


def test_analyze_all_preserves_origin_destination():
    flights = [{
        "source": "kiwi", "origin": "MAD", "destination": "JFK",
        "price_eur": 100.0, "cabin_code": 1, "cabin": "economy",
        "airline": "IB", "date_out": "2026-06-15", "stops": 0,
    }]
    res = detector.analyze_all(flights, min_score=0)
    assert all(d["origin"] == "MAD" and d["destination"] == "JFK" for d in res)


# ─────────────────────────────────────────────────────────────────
# _compute_savings — pure helper
# ─────────────────────────────────────────────────────────────────
def test_compute_savings_returns_non_negative():
    flight = {
        "price_eur": 100.0,
        "cabin_code": 1,
        "destination": "JFK",
        "distance_category": "largo",
    }
    res = detector._compute_savings(flight)
    assert res["savings_eur"] >= 0
    assert res["savings_pct"] >= 0


def test_compute_savings_uses_baseline_when_higher():
    flight = {
        "price_eur": 50.0,
        "cabin_code": 1,
        "destination": "JFK",
        "distance_category": "largo",
        "t5_baseline": 1000.0,  # higher than normal mid
    }
    res = detector._compute_savings(flight)
    # When baseline is much higher, savings_eur should reflect it
    assert res["savings_eur"] > 0


def test_compute_savings_no_savings_for_high_price():
    flight = {
        "price_eur": 99999.0,
        "cabin_code": 1,
        "destination": "JFK",
        "distance_category": "largo",
    }
    res = detector._compute_savings(flight)
    assert res["savings_eur"] == 0


@pytest.mark.parametrize("destination,distance", [
    ("FCO", "corto"),
    ("JFK", "largo"),
    ("NRT", "ultra_largo"),
    ("AGP", "corto"),
])
def test_compute_savings_works_for_various_categories(destination, distance):
    flight = {
        "price_eur": 200.0,
        "cabin_code": 1,
        "destination": destination,
        "distance_category": distance,
    }
    res = detector._compute_savings(flight)
    assert "savings_eur" in res
    assert "savings_pct" in res
    assert "estimated_normal_price" in res


# ─────────────────────────────────────────────────────────────────
# rank_* helpers
# ─────────────────────────────────────────────────────────────────
def test_rank_by_score_respects_top_n():
    analyzed = [
        {"final_score": float(i), "id": str(i)} for i in range(100)
    ]
    top = detector.rank_by_score(analyzed, top_n=10)
    assert len(top) == 10
    assert top[0]["final_score"] >= top[-1]["final_score"]


def test_rank_by_score_empty_input():
    assert detector.rank_by_score([], top_n=5) == []


@pytest.mark.parametrize("top_n", [0, 1, 5, 50, 200])
def test_rank_by_score_various_top_n(top_n):
    analyzed = [{"final_score": float(i), "id": str(i)} for i in range(30)]
    top = detector.rank_by_score(analyzed, top_n=top_n)
    assert len(top) == min(30, top_n)


def test_rank_by_savings_empty():
    assert detector.rank_by_savings([], top_n=5) == []


def test_rank_by_savings_filters_by_cabin():
    analyzed = [
        {"final_score": 90, "cabin_code": 1, "savings_eur": 100},
        {"final_score": 80, "cabin_code": 3, "savings_eur": 500},
        {"final_score": 70, "cabin_code": 1, "savings_eur": 50},
    ]
    by_eco = detector.rank_by_savings(analyzed, cabin=1, top_n=10)
    assert all(d["cabin_code"] == 1 for d in by_eco)
    assert len(by_eco) == 2


def test_rank_by_savings_no_cabin_filter():
    analyzed = [
        {"savings_eur": 100, "cabin_code": 1},
        {"savings_eur": 500, "cabin_code": 3},
    ]
    all_d = detector.rank_by_savings(analyzed, cabin=None, top_n=10)
    assert len(all_d) == 2
    assert all_d[0]["savings_eur"] >= all_d[-1]["savings_eur"]


def test_rank_cheapest_business_only_business():
    analyzed = [
        {"cabin_code": 1, "price_eur": 10},
        {"cabin_code": 3, "price_eur": 500},
        {"cabin_code": 4, "price_eur": 1000},
    ]
    biz = detector.rank_cheapest_business(analyzed)
    assert all(d["cabin_code"] in (3, 4) for d in biz)
    assert biz[0]["price_eur"] <= biz[-1]["price_eur"]


def test_rank_cheapest_business_empty():
    assert detector.rank_cheapest_business([]) == []


def test_rank_best_ratio_only_t4_triggered():
    analyzed = [
        {"t4_ratio": 1.5, "t4_triggered": True},
        {"t4_ratio": 0.8, "t4_triggered": True},
        {"t4_ratio": 5.0, "t4_triggered": False},  # not triggered
        {"t4_ratio": None, "t4_triggered": True},
    ]
    best = detector.rank_best_ratio(analyzed)
    assert all(d.get("t4_triggered") for d in best)
    assert all(d.get("t4_ratio") is not None for d in best)
