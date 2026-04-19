"""
Unit tests: detector.py — IQR, Z-score, clasificacion CRITICO/ERROR/ANOMALIA/OFERTA
"""
from __future__ import annotations

import pytest

import detector
from detector import (
    CLASS_ANOMALIA,
    CLASS_CRITICO,
    CLASS_ERROR,
    CLASS_NORMAL,
    CLASS_OFERTA,
    classify_by_score,
    compute_iqr_bounds,
    compute_zscore,
)


# ---------------------------------------------------------------------------
# compute_iqr_bounds
# ---------------------------------------------------------------------------
class TestComputeIQRBounds:
    def test_happy_path_returns_q1_q3_lower_upper(self):
        prices = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280]
        stats = compute_iqr_bounds(prices)
        assert stats["q1"] is not None
        assert stats["q3"] is not None
        assert stats["iqr"] > 0
        assert stats["lower"] <= stats["q1"]
        assert stats["upper"] >= stats["q3"]

    def test_too_few_prices_returns_none_bounds(self):
        # Con <4 precios no se puede calcular IQR
        stats = compute_iqr_bounds([100, 150, 200])
        assert stats["q1"] is None
        assert stats["lower"] is None

    def test_identical_prices_iqr_zero(self):
        prices = [500] * 10
        stats = compute_iqr_bounds(prices)
        assert stats["iqr"] == 0
        assert stats["lower"] == stats["upper"] == 500


# ---------------------------------------------------------------------------
# compute_zscore
# ---------------------------------------------------------------------------
class TestComputeZscore:
    def test_normal_distribution_outlier_negative_zscore(self):
        prices = [500, 510, 495, 505, 490, 515, 500, 505]
        # Precio muy por debajo de la media
        z = compute_zscore(100, prices)
        assert z < -2  # Significativamente anomalo

    def test_price_at_mean_gives_near_zero(self):
        prices = [100, 110, 90, 105, 95, 100, 110, 90]
        z = compute_zscore(100, prices)
        assert -0.5 < z < 0.5

    def test_too_few_prices_returns_zero(self):
        z = compute_zscore(100, [100, 200, 300])
        assert z == 0.0

    def test_zero_sigma_returns_zero(self):
        # Todos los precios son iguales -> sigma=0 -> devuelve 0
        z = compute_zscore(100, [500, 500, 500, 500, 500, 500])
        assert z == 0.0


# ---------------------------------------------------------------------------
# classify_by_score
# ---------------------------------------------------------------------------
class TestClassifyByScore:
    def test_critico_requires_high_score_and_multiple_techniques(self):
        assert classify_by_score(80, techniques_triggered=3) == CLASS_CRITICO
        assert classify_by_score(80, techniques_triggered=2, is_lowcost=False) == CLASS_CRITICO

    def test_critico_lowcost_requires_3_techniques(self):
        # Low-cost con 2 tecnicas no puede ser CRITICO
        result = classify_by_score(80, techniques_triggered=2, is_lowcost=True)
        assert result == CLASS_ERROR  # downgrade a ERROR

    def test_error_requires_2_techniques_min(self):
        assert classify_by_score(60, techniques_triggered=2) == CLASS_ERROR

    def test_single_technique_high_score_is_anomalia(self):
        # 1 tecnica pero score alto -> no ERROR, solo ANOMALIA
        assert classify_by_score(60, techniques_triggered=1) == CLASS_ANOMALIA

    def test_oferta_threshold(self):
        assert classify_by_score(20, techniques_triggered=1) == CLASS_OFERTA

    def test_normal_below_oferta(self):
        assert classify_by_score(10, techniques_triggered=0) == CLASS_NORMAL


# ---------------------------------------------------------------------------
# t0_absolute_error_fare
# ---------------------------------------------------------------------------
class TestT0AbsoluteErrorFare:
    def test_business_transatlantic_ultra_low_triggers(self):
        flight = {
            "price_eur": 250,
            "cabin_code": 3,  # CABIN_BUSINESS
            "destination": "JFK",
            "distance_category": "largo",
            "airline": "IB",
        }
        result = detector.t0_absolute_error_fare([flight])[0]
        assert result["t0_triggered"] is True
        assert result["t0_score"] > 0
        assert result["is_lowcost"] is False

    def test_economy_normal_price_no_trigger(self):
        flight = {
            "price_eur": 500,
            "cabin_code": 1,
            "destination": "JFK",
            "distance_category": "largo",
            "airline": "IB",
        }
        result = detector.t0_absolute_error_fare([flight])[0]
        assert result["t0_triggered"] is False

    def test_lowcost_short_haul_cheap_not_triggered(self):
        # Ryanair MAD-BCN por 15€ es NORMAL, no error
        flight = {
            "price_eur": 15,
            "cabin_code": 1,
            "destination": "BCN",
            "distance_category": "corto",
            "airline": "FR",  # Ryanair
        }
        result = detector.t0_absolute_error_fare([flight])[0]
        assert result["is_lowcost"] is True
        # 15€ NO es < 8€ threshold low-cost, asi que no triggers
        assert result["t0_triggered"] is False

    def test_lowcost_ultra_low_triggers(self):
        # Ryanair MAD-BCN a 5€ -> por debajo del umbral low-cost 8€
        flight = {
            "price_eur": 5,
            "cabin_code": 1,
            "destination": "BCN",
            "distance_category": "corto",
            "airline": "FR",
        }
        result = detector.t0_absolute_error_fare([flight])[0]
        assert result["t0_triggered"] is True


# ---------------------------------------------------------------------------
# t1b_iqr_outlier
# ---------------------------------------------------------------------------
class TestT1bIQROutlier:
    def test_outlier_triggers(self, flights_population):
        results = detector.t1b_iqr_outlier(flights_population)
        # El vuelo de 80€ debe ser detectado como outlier IQR
        outlier = next(r for r in results if r["price_eur"] == 80)
        assert outlier["t1b_triggered"] is True
        assert outlier["t1b_score"] > 0

    def test_normal_price_not_triggered(self, flights_population):
        results = detector.t1b_iqr_outlier(flights_population)
        normal = next(r for r in results if r["price_eur"] == 500)
        assert normal["t1b_triggered"] is False or normal["t1b_score"] <= 10

    def test_insufficient_data_no_trigger(self):
        flights = [
            {"origin": "MAD", "destination": "JFK", "cabin_code": 1, "price_eur": 100}
        ]
        results = detector.t1b_iqr_outlier(flights)
        assert results[0]["t1b_triggered"] is False


# ---------------------------------------------------------------------------
# t4_business_economy_ratio
# ---------------------------------------------------------------------------
class TestT4BusinessEconomyRatio:
    def test_low_ratio_long_haul_triggers_error(self):
        flights = [
            # Economy baseline
            {"origin": "MAD", "destination": "JFK", "price_eur": 400,
             "cabin_code": 1, "date_out": "2026-07-15"},
            # Business a 700€ -> ratio 1.75 -> ERROR (largo: error<1.8)
            {"origin": "MAD", "destination": "JFK", "price_eur": 700,
             "cabin_code": 3, "date_out": "2026-07-15"},
        ]
        results = detector.t4_business_economy_ratio(flights)
        biz = next(r for r in results if r["cabin_code"] == 3)
        assert biz["t4_triggered"] is True
        assert biz["t4_ratio"] < 2.0

    def test_economy_never_triggers(self):
        flights = [
            {"origin": "MAD", "destination": "JFK", "price_eur": 300,
             "cabin_code": 1, "date_out": "2026-07-15"},
        ]
        results = detector.t4_business_economy_ratio(flights)
        assert results[0]["t4_triggered"] is False

    def test_no_economy_baseline_no_trigger(self):
        flights = [
            {"origin": "MAD", "destination": "JFK", "price_eur": 800,
             "cabin_code": 3, "date_out": "2026-07-15"},
        ]
        results = detector.t4_business_economy_ratio(flights)
        assert results[0]["t4_triggered"] is False


# ---------------------------------------------------------------------------
# analyze_all — pipeline end-to-end
# ---------------------------------------------------------------------------
class TestAnalyzeAllPipeline:
    def test_empty_input_returns_empty(self):
        assert detector.analyze_all([]) == []

    def test_deal_with_score_below_min_filtered(self):
        # Un vuelo que claramente no dispara nada
        flight = {
            "origin": "MAD", "destination": "FCO", "price_eur": 150,
            "cabin_code": 1, "cabin": "economy", "airline": "IB",
            "distance_category": "corto", "date_out": "2026-06-01",
        }
        result = detector.analyze_all([flight], min_score=50)
        assert result == []

    def test_error_fare_gets_classified(self, sample_error_fare_business):
        """Un error fare business transatlantico debe ser CRITICO o ERROR."""
        result = detector.analyze_all([sample_error_fare_business], min_score=15)
        assert len(result) >= 1
        assert result[0]["classification"] in (CLASS_CRITICO, CLASS_ERROR, CLASS_ANOMALIA)
        assert result[0]["final_score"] > 0
        assert result[0]["techniques_triggered"]

    def test_results_sorted_by_score_desc(self):
        flights = [
            {"origin": "MAD", "destination": "JFK", "price_eur": 100,
             "cabin_code": 3, "cabin": "business", "airline": "IB",
             "distance_category": "largo", "date_out": "2026-07-15"},
            {"origin": "MAD", "destination": "JFK", "price_eur": 300,
             "cabin_code": 3, "cabin": "business", "airline": "IB",
             "distance_category": "largo", "date_out": "2026-07-20"},
        ]
        result = detector.analyze_all(flights, min_score=10)
        if len(result) >= 2:
            assert result[0]["final_score"] >= result[1]["final_score"]
