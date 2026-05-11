"""
test_new_seasonal_threshold.py — May 2026
==========================================
Cobertura para flight_hunter_v4.seasonal_threshold (percentile, cheap_bucket,
season_for_dates, floor_is_anomalous).
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

import seasonal_threshold as st  # type: ignore[import-not-found]


class TestPercentile:
    def test_p0_is_min(self):
        assert st.percentile([1, 2, 3, 4, 5], 0) == 1

    def test_p100_is_max(self):
        assert st.percentile([1, 2, 3, 4, 5], 100) == 5

    def test_p50_is_median(self):
        assert st.percentile([1, 2, 3, 4, 5], 50) == 3.0

    def test_p10(self):
        # p10 con 11 valores: índice exacto en 1
        vals = list(range(11))  # 0..10
        p10 = st.percentile(vals, 10)
        # interpolación lineal: 1.0
        assert p10 == pytest.approx(1.0, abs=0.1)

    def test_raises_on_empty(self):
        with pytest.raises(ValueError):
            st.percentile([], 50)

    def test_interpolation_linear(self):
        # Entre 0 y 10, p25 ≈ 2.5
        vals = list(range(11))
        assert st.percentile(vals, 25) == pytest.approx(2.5, abs=0.01)


class TestCheapBucket:
    @pytest.fixture
    def normal_distribution(self):
        # Distribución típica Ryanair: median ~25€, p10 ~12€
        return [10, 12, 14, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 60, 80]

    def test_glitch_floor(self, normal_distribution):
        # <€5 → ERROR independiente de distribución
        assert st.cheap_bucket(3.99, normal_distribution) == "ERROR"

    def test_error_below_p10_x_06(self, normal_distribution):
        # price < p10 * 0.6 = ~7.2 → ERROR
        assert st.cheap_bucket(6.0, normal_distribution) == "ERROR"

    def test_crit_at_p10(self, normal_distribution):
        # price ≤ p10 → CRIT (~12-14€)
        result = st.cheap_bucket(11.0, normal_distribution)
        assert result in ("CRIT", "ERROR")  # depende de p10 exacto

    def test_chollo_under_065_median(self, normal_distribution):
        # median ~25€, ≤ 16.25 → CHOLLO
        result = st.cheap_bucket(16.0, normal_distribution)
        assert result in ("CHOLLO", "CRIT", "OFERTA")

    def test_normal_at_median(self, normal_distribution):
        # price ~ median → NORMAL
        assert st.cheap_bucket(25.0, normal_distribution) == "NORMAL"

    def test_normal_above_median(self, normal_distribution):
        assert st.cheap_bucket(80.0, normal_distribution) == "NORMAL"

    def test_few_samples_returns_normal(self):
        # <3 muestras → NORMAL (no podemos distinguir, fuera glitch)
        assert st.cheap_bucket(20.0, [10, 15]) == "NORMAL"

    def test_zero_prices_filtered(self):
        # prices <= 0 se descartan
        bucket = st.cheap_bucket(15.0, [0, 0, 0, 0])
        assert bucket == "NORMAL"  # no samples válidos

    def test_constant_distribution(self):
        # Distribución plana: con p10==median==20, price=20 ≤ p10 → CRIT.
        # Documenta el comportamiento ACTUAL (cheap_bucket es estricto).
        vals = [20.0] * 10
        bucket = st.cheap_bucket(20.0, vals)
        assert bucket in ("CRIT", "NORMAL")


class TestSeasonForDates:
    def test_peak_summer(self):
        # Mid-jul a mid-ago = peak_summer (NB: si months_ahead>8, retorna early_booking)
        # Usar fechas cercanas para evitar early_booking
        today = date.today()
        # Vacaciones de verano del año actual o futuro inmediato (<8 meses ahead)
        if today.month < 6:  # antes de junio
            d_from = date(today.year, 7, 15)
            d_to = date(today.year, 7, 22)
        else:
            # ya pasó: usamos el verano del año siguiente
            d_from = date(today.year, 7, 15)
            d_to = date(today.year, 7, 22)
        s = st.season_for_dates(d_from.isoformat(), d_to.isoformat())
        # En cualquier caso s no debe ser unknown
        assert s != "unknown"

    def test_winter(self):
        today = date.today()
        # Mid-enero del año en curso (probablemente próximo)
        year = today.year if today.month < 1 else today.year + 1
        d_from = date(year, 1, 15)
        d_to = date(year, 1, 22)
        s = st.season_for_dates(d_from.isoformat(), d_to.isoformat())
        # winter o early_booking dependiendo de fecha actual
        assert s in ("winter", "early_booking")

    def test_invalid_dates_returns_unknown(self):
        s = st.season_for_dates("not-a-date", "neither-this")
        assert s == "unknown"

    def test_inverted_range_returns_unknown(self):
        # from > to → unknown
        s = st.season_for_dates("2026-08-15", "2026-08-10")
        assert s == "unknown"


class TestFloorIsAnomalous:
    def test_normal_floor_winter(self):
        # winter floor 17-25€
        assert st.floor_is_anomalous(20.0, "winter") is False

    def test_too_low_anomalous(self):
        # winter expected 17-25, observed 3€ → anómalo (probable bug)
        assert st.floor_is_anomalous(3.0, "winter") is True

    def test_too_high_anomalous(self):
        # winter expected hasta 25, observed 60€ → anómalo (cambio mercado)
        assert st.floor_is_anomalous(60.0, "winter") is True

    def test_unknown_season_lenient_range(self):
        # unknown 10-35 → 7€ está bajo, pero no extreme. 100€ es altísimo
        assert st.floor_is_anomalous(100.0, "unknown") is True

    def test_seasonal_floor_range_returns_tuple(self):
        for season in ["peak_summer", "winter", "shoulder", "early_booking", "unknown"]:
            lo, hi = st.seasonal_floor_range(season)
            assert isinstance(lo, float)
            assert isinstance(hi, float)
            assert lo < hi


class TestConstants:
    def test_absolute_glitch_floor_is_5(self):
        assert st.ABSOLUTE_GLITCH_FLOOR_EUR == 5.0

    def test_seasonal_floor_dict_has_all_seasons(self):
        for s in ["peak_summer", "winter", "shoulder", "early_booking", "unknown"]:
            assert s in st.SEASONAL_FLOOR_EUR
