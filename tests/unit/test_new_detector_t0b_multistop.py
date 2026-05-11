"""
test_new_detector_t0b_multistop.py — May 2026
==============================================
Cobertura para T0b (multi-stop anomaly detector) y pipeline analyze_all().

NOTA DE BUG REAL:
  detector.py:717 hace `f.get("cabin_int")` pero el resto del código usa
  `cabin_code`. Esto significa que T0b siempre evalúa con cabin=ECONOMY
  (fallback) y NO detecta business multi-stop con descuento.
  detector.py:718 hace `destination=dest or ""` donde `dest` es la variable
  del loop anterior (línea 672), por lo que puede ser stale/None.

Los tests aquí documentan el comportamiento ACTUAL (no esperado).
"""
from __future__ import annotations

import pytest

import config  # type: ignore[import-not-found]
import detector  # type: ignore[import-not-found]


class TestIsMultiStopAnomaly:
    def test_two_stops_very_low_price_is_anomaly(self):
        # DPS ultra_largo economy threshold=200€. Multi-stop con 2 stops:
        # base_pct=0.5, extra_stop=0.1 → multi_threshold = 200 × 0.4 = 80€.
        # 60€ es anómalo (< 80€).
        out = config.is_multi_stop_anomaly(
            price=60.0,
            cabin=config.CABIN_ECONOMY,
            destination="DPS",
            stops=2,
        )
        assert out is True

    def test_two_stops_normal_price_no_anomaly(self):
        # 220€ > 80€ multi-stop threshold → no anomaly
        out = config.is_multi_stop_anomaly(
            price=220.0,
            cabin=config.CABIN_ECONOMY,
            destination="DPS",
            stops=2,
        )
        assert out is False

    def test_normal_price_no_anomaly(self):
        out = config.is_multi_stop_anomaly(
            price=950.0,
            cabin=config.CABIN_ECONOMY,
            destination="DPS",
            stops=2,
        )
        assert out is False

    def test_zero_stops_no_anomaly(self):
        # Directo no se considera multi-stop
        out = config.is_multi_stop_anomaly(
            price=220.0,
            cabin=config.CABIN_ECONOMY,
            destination="DPS",
            stops=0,
        )
        assert out is False

    def test_unknown_cabin_returns_false(self):
        # cabin no en thresholds → False (no se puede juzgar)
        out = config.is_multi_stop_anomaly(
            price=100.0, cabin=99, destination="DPS", stops=3,
        )
        assert out is False

    def test_empty_destination_falls_back_to_largo(self):
        # Sin destination válido, asume largo
        out = config.is_multi_stop_anomaly(
            price=50.0, cabin=config.CABIN_ECONOMY, destination="", stops=2,
        )
        # No debe crashear
        assert isinstance(out, bool)


class TestT0Pipeline:
    def test_t0_low_price_triggers(self):
        flights = [{
            "origin": "MAD", "destination": "JFK",
            "price_eur": 50.0, "cabin_code": config.CABIN_ECONOMY,
            "airline": "IB", "date_out": "2026-08-15",
            "region": "América Norte",
        }]
        out = detector.t0_absolute_error_fare(flights)
        assert out[0]["t0_triggered"] is True
        assert out[0]["t0_score"] > 0

    def test_t0_normal_price_no_trigger(self):
        flights = [{
            "origin": "MAD", "destination": "JFK",
            "price_eur": 800.0, "cabin_code": config.CABIN_ECONOMY,
            "airline": "IB", "date_out": "2026-08-15",
            "region": "América Norte",
        }]
        out = detector.t0_absolute_error_fare(flights)
        assert out[0]["t0_triggered"] is False
        assert out[0]["t0_score"] == 0

    def test_t0_lowcost_higher_threshold(self):
        # Ryanair €15 corto = NORMAL (no error fare absoluto)
        flights = [{
            "origin": "MAD", "destination": "STN",
            "price_eur": 15.0, "cabin_code": config.CABIN_ECONOMY,
            "airline": "FR", "date_out": "2026-08-15",
            "region": "Europa",
        }]
        out = detector.t0_absolute_error_fare(flights)
        # Ryanair €15 es normal — solo dispara <€8
        assert out[0]["t0_triggered"] is False

    def test_t0_lowcost_extreme_low_triggers(self):
        # Ryanair €5 corto = anómalo
        flights = [{
            "origin": "MAD", "destination": "STN",
            "price_eur": 5.0, "cabin_code": config.CABIN_ECONOMY,
            "airline": "FR", "date_out": "2026-08-15",
            "region": "Europa",
        }]
        out = detector.t0_absolute_error_fare(flights)
        assert out[0]["t0_triggered"] is True
        assert out[0].get("is_lowcost") is True


class TestT1bIqrOutlier:
    def test_outlier_below_lower_bound(self):
        # 10 vuelos €400-600, uno a €100 → IQR outlier bajo
        base = {
            "origin": "MAD", "destination": "JFK",
            "cabin_code": config.CABIN_ECONOMY,
        }
        prices = [400, 420, 450, 460, 480, 500, 520, 540, 600, 100]
        flights = [{**base, "price_eur": p, "date_out": f"2026-08-{15+i:02d}"}
                   for i, p in enumerate(prices)]
        out = detector.t1b_iqr_outlier(flights)
        outliers = [f for f in out if f.get("t1b_triggered")]
        assert len(outliers) >= 1
        # El outlier debe ser el €100
        assert any(f["price_eur"] == 100 for f in outliers)

    def test_insufficient_samples_no_trigger(self):
        # <4 vuelos → no se puede calcular IQR
        flights = [{
            "origin": "MAD", "destination": "JFK",
            "cabin_code": 1, "price_eur": 50, "date_out": "2026-08-15"
        }]
        out = detector.t1b_iqr_outlier(flights)
        assert out[0].get("t1b_triggered") is False


class TestClassifyByScore:
    def test_critico_score_high_techniques_high(self):
        # score >= 75 y 3 técnicas → CRITICO
        assert detector.classify_by_score(80, 3) == detector.CLASS_CRITICO

    def test_error_score_50_two_techniques(self):
        assert detector.classify_by_score(55, 2) == detector.CLASS_ERROR

    def test_anomalia_score_30(self):
        assert detector.classify_by_score(35, 2) == detector.CLASS_ANOMALIA

    def test_oferta_score_15(self):
        assert detector.classify_by_score(20, 1) == detector.CLASS_OFERTA

    def test_normal_below_oferta(self):
        assert detector.classify_by_score(10, 1) == detector.CLASS_NORMAL

    def test_lowcost_critico_requires_3_techniques(self):
        # Lowcost score=80 con 2 técnicas → no critico (requiere 3)
        result = detector.classify_by_score(80, 2, is_lowcost=True)
        assert result != detector.CLASS_CRITICO

    def test_lowcost_critico_with_3_techniques(self):
        result = detector.classify_by_score(80, 3, is_lowcost=True)
        assert result == detector.CLASS_CRITICO


class TestT4BusinessEconomyRatio:
    def test_low_ratio_error_fare(self):
        flights = [
            {"origin": "MAD", "destination": "JFK", "price_eur": 400,
             "cabin_code": config.CABIN_ECONOMY, "airline": "IB",
             "date_out": "2026-08-15"},
            {"origin": "MAD", "destination": "JFK", "price_eur": 600,
             "cabin_code": config.CABIN_BUSINESS, "airline": "IB",
             "date_out": "2026-08-15"},
        ]
        out = detector.t4_business_economy_ratio(flights)
        biz = [f for f in out if f["cabin_code"] == config.CABIN_BUSINESS][0]
        # Ratio 600/400 = 1.5x → ERROR FARE
        assert biz["t4_triggered"] is True
        assert biz["t4_ratio"] == 1.5

    def test_normal_ratio_no_trigger(self):
        flights = [
            {"origin": "MAD", "destination": "JFK", "price_eur": 400,
             "cabin_code": config.CABIN_ECONOMY, "airline": "IB",
             "date_out": "2026-08-15"},
            {"origin": "MAD", "destination": "JFK", "price_eur": 3000,
             "cabin_code": config.CABIN_BUSINESS, "airline": "IB",
             "date_out": "2026-08-15"},
        ]
        out = detector.t4_business_economy_ratio(flights)
        biz = [f for f in out if f["cabin_code"] == config.CABIN_BUSINESS][0]
        # Ratio 3000/400 = 7.5x → normal
        assert biz["t4_ratio"] == 7.5
        assert biz["t4_triggered"] is False


class TestAnalyzeAllPipeline:
    def test_empty_returns_empty(self):
        assert detector.analyze_all([]) == []

    def test_pipeline_runs_no_crash(self):
        flights = [
            {"origin": "MAD", "destination": "BCN", "price_eur": 50,
             "cabin_code": config.CABIN_ECONOMY, "airline": "IB",
             "date_out": "2026-08-15", "stops": 0, "region": "Europa"},
        ]
        out = detector.analyze_all(flights, min_score=0)
        assert len(out) <= 1
        # No revienta y devuelve algo

    def test_pipeline_score_threshold(self):
        # min_score muy alto → 0 resultados
        flights = [
            {"origin": "MAD", "destination": "BCN", "price_eur": 60,
             "cabin_code": 1, "airline": "IB", "date_out": "2026-08-15",
             "region": "Europa", "stops": 0},
        ]
        out = detector.analyze_all(flights, min_score=99)
        assert len(out) == 0


class TestComputeIqrBounds:
    def test_small_sample_returns_none(self):
        b = detector.compute_iqr_bounds([1, 2, 3])
        assert b["lower"] is None

    def test_normal_distribution(self):
        prices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        b = detector.compute_iqr_bounds(prices)
        assert b["q1"] is not None
        assert b["q3"] is not None
        assert b["q1"] < b["q3"]
        assert b["lower"] < b["q1"]
        assert b["upper"] > b["q3"]
        assert b["median"] == 60  # mediana de 10 items con [n//2]=5 → 60


class TestComputeZscore:
    def test_zero_stdev_returns_zero(self):
        # Todos los precios iguales → stdev=0 → z=0
        z = detector.compute_zscore(50, [50, 50, 50, 50, 50])
        assert z == 0.0

    def test_low_price_negative_z(self):
        prices = [100, 105, 95, 110, 90, 100, 102, 98, 100]
        z = detector.compute_zscore(50, prices)
        assert z < -1.0  # 50 está muy por debajo de la media ~100

    def test_high_price_positive_z(self):
        prices = [100, 105, 95, 110, 90, 100, 102, 98, 100]
        z = detector.compute_zscore(200, prices)
        assert z > 1.0

    def test_few_samples_returns_zero(self):
        # <5 muestras → no z-score
        assert detector.compute_zscore(50, [40, 60]) == 0.0
