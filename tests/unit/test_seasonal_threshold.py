"""Tests del módulo seasonal_threshold (introducido en ronda 4 abr-2026).

Valida que el clasificador dinámico por percentil distingue error fares
reales (basados en distribución local) en vez del <€15 absoluto que sólo
funcionaba en temporada alta.
"""
import sys
from datetime import date, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "flight_hunter_v4"))

from seasonal_threshold import (  # noqa: E402
    ABSOLUTE_GLITCH_FLOOR_EUR,
    cheap_bucket,
    floor_is_anomalous,
    percentile,
    season_for_dates,
    seasonal_floor_range,
)


class TestPercentile:
    def test_p50_es_mediana(self):
        assert percentile([1, 2, 3, 4, 5], 50) == 3

    def test_p10_y_p90(self):
        data = list(range(1, 101))  # 1..100
        # Interpolación lineal: p10 de 1..100 ≈ 10.9
        assert 10 <= percentile(data, 10) <= 11
        assert 89 <= percentile(data, 90) <= 91

    def test_extremes(self):
        assert percentile([5, 10, 15], 0) == 5
        assert percentile([5, 10, 15], 100) == 15

    def test_single_value(self):
        assert percentile([42], 10) == 42
        assert percentile([42], 90) == 42

    def test_empty_raises(self):
        import pytest
        with pytest.raises(ValueError):
            percentile([], 50)


class TestCheapBucket:
    def test_glitch_absoluto_es_error(self):
        # < €5 siempre ERROR, da igual la distribución
        assert cheap_bucket(3.0, [20, 30, 40, 50, 60]) == "ERROR"

    def test_sin_distribucion_suficiente_es_normal(self):
        assert cheap_bucket(10.0, [15]) == "NORMAL"
        assert cheap_bucket(10.0, []) == "NORMAL"

    def test_error_fare_en_temporada_alta(self):
        # Ronda 1 (verano): floor €11, distribución €11-€100
        prices = [11, 12, 13, 15, 18, 22, 28, 35, 45, 60, 80, 100]
        # €5 debería ser ERROR (glitch) o CRIT según p10
        # p10 = ~11, así que €6 es ERROR (por debajo del 60% de p10)
        assert cheap_bucket(6.0, prices) == "ERROR"

    def test_crit_en_temporada_alta(self):
        prices = [11, 12, 13, 15, 18, 22, 28, 35, 45, 60, 80, 100]
        # p10 ≈ 11 → €11 debería ser CRIT (precio mínimo regular)
        assert cheap_bucket(11.0, prices) == "CRIT"

    def test_chollo_vs_oferta(self):
        # Distribución estrecha: mediana ≈ 30
        prices = [20, 22, 25, 28, 30, 32, 35, 38, 40, 45]
        # mediana = 30, 0.65*30 = 19.5 → €19 sería CHOLLO por p10 check primero
        # p10 ≈ 20.2, así que €19 <= p10 → CRIT
        # Este test verifica que el ordering de reglas es coherente
        r = cheap_bucket(19.0, prices)
        assert r in ("ERROR", "CRIT", "CHOLLO")

    def test_normal_cuando_esta_sobre_85pct_mediana(self):
        prices = [20, 22, 25, 28, 30, 32, 35, 38, 40, 45]
        # mediana=31, 0.85*31=26.4 → €35 (sobre) = NORMAL
        assert cheap_bucket(35.0, prices) == "NORMAL"

    def test_error_fare_winter_con_floor_alto(self):
        # Ronda 2 (invierno): floor €20, distribución más alta que verano.
        # Error fare debe detectarse relativo a la distribución, no al €15 absoluto.
        prices = [20, 21, 22, 25, 30, 35, 42, 55, 70]
        # p10 ≈ 20.8, 0.6*p10 ≈ 12.5 → €12 debería ser ERROR
        assert cheap_bucket(12.0, prices) == "ERROR"

    def test_shoulder_no_error_en_floor_normal(self):
        # Ronda 3: floor €17.99. En shoulder no detectamos error fares pero
        # SÍ queremos que €18 (justo sobre el floor) no salga como ERROR o NORMAL
        # — debe clasificarse como oferta/chollo aceptable.
        prices = [17.99, 18, 19, 22, 25, 30, 35, 45, 60]
        bucket = cheap_bucket(18.0, prices)
        assert bucket in ("CRIT", "CHOLLO", "OFERTA")
        assert bucket != "ERROR"  # no debería confundirlo con glitch
        assert bucket != "NORMAL"  # no debería esconderlo como precio corriente


class TestSeasonForDates:
    def test_peak_summer(self):
        # Rango claramente en agosto, a < 8 meses vista
        today = date.today()
        # Próximo agosto
        y = today.year if today.month < 8 else today.year + 1
        assert season_for_dates(f"{y}-08-01", f"{y}-08-31") == "peak_summer"

    def test_winter(self):
        today = date.today()
        y = today.year if today.month < 12 else today.year + 1
        res = season_for_dates(f"{y}-12-01", f"{y}-12-31")
        assert res in ("winter", "early_booking")

    def test_early_booking(self):
        # 10+ meses vista → early_booking
        far = date.today() + timedelta(days=320)
        end = far + timedelta(days=60)
        assert season_for_dates(far.isoformat(), end.isoformat()) == "early_booking"

    def test_rango_invalido(self):
        assert season_for_dates("not-a-date", "2026-12-31") == "unknown"
        assert season_for_dates("2026-12-31", "2026-01-01") == "unknown"


class TestSeasonalFloorRange:
    def test_todas_temporadas_tienen_rango(self):
        for s in ("peak_summer", "winter", "shoulder", "early_booking", "unknown"):
            lo, hi = seasonal_floor_range(s)  # type: ignore[arg-type]
            assert 0 < lo < hi

    def test_peak_summer_es_mas_barato_que_early_booking(self):
        lo_s, _ = seasonal_floor_range("peak_summer")
        lo_e, _ = seasonal_floor_range("early_booking")
        # Pico verano tiene floor esperado más bajo que early booking
        # (hallazgo contraintuitivo de ronda 4: ~1 año vista es más caro, no más barato)
        assert lo_s < lo_e


class TestFloorIsAnomalous:
    def test_floor_normal_no_es_anomalo(self):
        # Ronda 3 observó floor €17.99 en shoulder → dentro del rango 15-22
        assert not floor_is_anomalous(17.99, "shoulder")
        assert not floor_is_anomalous(25.30, "early_booking")

    def test_floor_sospechosamente_bajo(self):
        # Floor de €3 en invierno → claramente bug de datos o glitch
        assert floor_is_anomalous(3.0, "winter")

    def test_floor_sospechosamente_alto(self):
        # Floor de €100 en peak_summer → algo raro
        assert floor_is_anomalous(100.0, "peak_summer")


class TestAbsoluteFloor:
    def test_valor_razonable(self):
        # €5 como floor absoluto es razonable para Ryanair
        # (menos de eso es pure glitch)
        assert 1.0 <= ABSOLUTE_GLITCH_FLOOR_EUR <= 10.0
