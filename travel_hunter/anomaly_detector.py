"""
Travel Hunter - Anomaly Detector
==================================
Motor de detección de anomalías en precios de hoteles.

Tres detectores independientes:
1. RoomTypeDetector: Compara precios entre tipos de habitación del mismo hotel
2. ZoneDetector: Compara un hotel con la mediana de su zona/categoría
3. SeasonalDetector: Compara precio actual con línea base histórica del mes

Cada detector produce anomalías con severidad (0-100) y explicación.
"""

import json
import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from occupancy_scraper import match_hotels_across_configs


# =========================================================================
# TIPOS DE ANOMALÍA
# =========================================================================

ANOMALY_ROOM_TYPE = "room_type_mispricing"
ANOMALY_ZONE_OUTLIER = "zone_outlier_low"
ANOMALY_SEASONAL = "seasonal_pricing_error"


# =========================================================================
# 1. DETECTOR DE ANOMALÍAS POR TIPO DE HABITACIÓN
# =========================================================================

class RoomTypeDetector:
    """
    Detecta cuando una habitación individual es desproporcionadamente
    más barata que la doble/triple en el MISMO hotel.

    Lógica:
    - Ratio normal: precio_individual ≈ 50-70% del precio_doble (por persona)
    - Anomalía: individual < 35% del doble → severidad alta
    - Error probable: individual < 20% del doble → severidad muy alta
    """

    def __init__(
        self,
        ratio_threshold: float = 0.35,
        extreme_threshold: float = 0.20,
        min_stars: int = 3,
        min_rating: float = 7.0,
    ):
        self.ratio_threshold = ratio_threshold
        self.extreme_threshold = extreme_threshold
        self.min_stars = min_stars
        self.min_rating = min_rating

    def detect(
        self,
        matched_hotels: Dict[str, Dict[str, dict]],
        destination: str,
        checkin: str,
        checkout: str,
    ) -> List[dict]:
        """
        Detecta anomalías de precio entre configuraciones de ocupación.

        Args:
            matched_hotels: Resultado de match_hotels_across_configs()
                {hotel_name: {config_label: hotel_data}}

        Returns:
            Lista de anomalías detectadas
        """
        anomalies = []

        for hotel_name, configs in matched_hotels.items():
            # Necesitamos al menos 2 configs para comparar
            if len(configs) < 2:
                continue

            # Extraer precios por config
            single = configs.get("1adult_1room")
            double = configs.get("2adult_1room")
            triple = configs.get("3adult_1room")
            two_rooms = configs.get("2adult_2rooms")
            four_rooms = configs.get("4adult_2rooms")

            # Filtrar por calidad mínima (evitar hostels legítimamente baratos)
            ref_hotel = single or double or list(configs.values())[0]
            stars = ref_hotel.get("stars", 0)
            rating = ref_hotel.get("rating", 0)

            if stars < self.min_stars and stars > 0:
                continue
            if rating < self.min_rating and rating > 0:
                continue

            # Comparación 1: Single vs Double (precio total)
            if single and double:
                anomaly = self._compare_room_prices(
                    hotel_name, destination, checkin, checkout,
                    single_price=single["price_total"],
                    double_price=double["price_total"],
                    single_label="1 adulto, 1 hab",
                    double_label="2 adultos, 1 hab",
                    stars=stars, rating=rating,
                    url=single.get("url", ""),
                )
                if anomaly:
                    anomalies.append(anomaly)

            # Comparación 2: Single vs Triple
            if single and triple:
                anomaly = self._compare_room_prices(
                    hotel_name, destination, checkin, checkout,
                    single_price=single["price_total"],
                    double_price=triple["price_total"],
                    single_label="1 adulto, 1 hab",
                    double_label="3 adultos, 1 hab",
                    stars=stars, rating=rating,
                    url=single.get("url", ""),
                )
                if anomaly:
                    anomalies.append(anomaly)

            # Comparación 3: 2 habitaciones individuales vs 1 doble
            # Si 2 × single < double → anomalía clara
            if single and double:
                two_singles = single["price_total"] * 2
                if two_singles < double["price_total"]:
                    savings_pct = ((double["price_total"] - two_singles) / double["price_total"]) * 100
                    if savings_pct > 20:  # >20% más barato reservar 2 individuales
                        severity = min(95, int(40 + savings_pct))
                        anomalies.append({
                            "hotel_name": hotel_name,
                            "destination": destination,
                            "anomaly_type": ANOMALY_ROOM_TYPE,
                            "severity_score": severity,
                            "explanation": (
                                f"2 hab. individuales ({two_singles:.0f}€) "
                                f"son {savings_pct:.0f}% más baratas que 1 doble "
                                f"({double['price_total']:.0f}€). "
                                f"Ahorro: {double['price_total'] - two_singles:.0f}€"
                            ),
                            "evidence": {
                                "comparison": "2x_single_vs_double",
                                "two_singles_total": two_singles,
                                "double_total": double["price_total"],
                                "savings_pct": round(savings_pct, 1),
                                "savings_eur": round(double["price_total"] - two_singles, 2),
                                "stars": stars,
                                "rating": rating,
                            },
                            "booking_url": single.get("url", ""),
                            "checkin": checkin,
                            "checkout": checkout,
                        })

            # Comparación 4: N habitaciones individuales para grupo
            # Ejemplo del caso real: 3 singles vs 1 triple
            if single and (triple or four_rooms):
                group_ref = triple or four_rooms
                group_adults = 3 if triple else 4
                n_singles_price = single["price_total"] * group_adults

                if n_singles_price < group_ref["price_total"]:
                    savings_pct = ((group_ref["price_total"] - n_singles_price) / group_ref["price_total"]) * 100
                    if savings_pct > 15:
                        severity = min(95, int(45 + savings_pct))
                        anomalies.append({
                            "hotel_name": hotel_name,
                            "destination": destination,
                            "anomaly_type": ANOMALY_ROOM_TYPE,
                            "severity_score": severity,
                            "explanation": (
                                f"{group_adults} hab. individuales ({n_singles_price:.0f}€) "
                                f"son {savings_pct:.0f}% más baratas que configuración "
                                f"de grupo ({group_ref['price_total']:.0f}€). "
                                f"Ahorro: {group_ref['price_total'] - n_singles_price:.0f}€"
                            ),
                            "evidence": {
                                "comparison": f"{group_adults}x_single_vs_group",
                                "singles_total": n_singles_price,
                                "group_total": group_ref["price_total"],
                                "savings_pct": round(savings_pct, 1),
                                "savings_eur": round(group_ref["price_total"] - n_singles_price, 2),
                                "group_size": group_adults,
                                "stars": stars,
                                "rating": rating,
                            },
                            "booking_url": single.get("url", ""),
                            "checkin": checkin,
                            "checkout": checkout,
                        })

        return anomalies

    def _compare_room_prices(
        self,
        hotel_name: str,
        destination: str,
        checkin: str,
        checkout: str,
        single_price: float,
        double_price: float,
        single_label: str,
        double_label: str,
        stars: int,
        rating: float,
        url: str,
    ) -> Optional[dict]:
        """Compara dos precios de habitación y genera anomalía si procede."""
        if double_price <= 0:
            return None

        ratio = single_price / double_price

        if ratio >= self.ratio_threshold:
            return None  # Ratio normal, no es anomalía

        # Calcular severidad basada en ratio
        if ratio <= self.extreme_threshold:
            severity = min(95, 85 + int((self.extreme_threshold - ratio) / self.extreme_threshold * 10))
        else:
            severity = 50 + int(
                (self.ratio_threshold - ratio) / (self.ratio_threshold - self.extreme_threshold) * 35
            )

        savings_pct = ((double_price - single_price) / double_price) * 100

        return {
            "hotel_name": hotel_name,
            "destination": destination,
            "anomaly_type": ANOMALY_ROOM_TYPE,
            "severity_score": severity,
            "explanation": (
                f"{single_label}: {single_price:.0f}€ vs {double_label}: "
                f"{double_price:.0f}€ (ratio {ratio:.1%}). "
                f"Individual es {savings_pct:.0f}% más barata. "
                f"Hotel {stars}★, rating {rating}"
            ),
            "evidence": {
                "comparison": f"{single_label}_vs_{double_label}",
                "single_price": single_price,
                "double_price": double_price,
                "ratio": round(ratio, 3),
                "savings_pct": round(savings_pct, 1),
                "stars": stars,
                "rating": rating,
            },
            "booking_url": url,
            "checkin": checkin,
            "checkout": checkout,
        }


# =========================================================================
# 2. DETECTOR DE ANOMALÍAS POR ZONA
# =========================================================================

class ZoneDetector:
    """
    Detecta hoteles con precio muy por debajo de su categoría en la misma zona.

    Agrupa hoteles por estrellas (ya que no tenemos geocoding) y calcula
    percentiles. Un hotel en el percentil <10 con buen rating es anomalía.
    """

    def __init__(
        self,
        percentile_threshold: float = 10.0,  # Percentil bajo
        min_sample_size: int = 10,  # Mínimo hoteles para significancia
        min_stars: int = 3,
    ):
        self.percentile_threshold = percentile_threshold
        self.min_sample_size = min_sample_size
        self.min_stars = min_stars

    def detect(
        self,
        hotels: List[dict],
        destination: str,
        checkin: str,
        checkout: str,
    ) -> Tuple[List[dict], Optional[dict]]:
        """
        Analiza hoteles de un destino y detecta outliers por precio.

        Args:
            hotels: Lista de hoteles con price_per_night, stars, rating, etc.

        Returns:
            Tuple[anomalías, perfil_de_zona]
        """
        anomalies = []

        # Filtrar por calidad mínima
        quality_hotels = [
            h for h in hotels
            if h.get("stars", 0) >= self.min_stars or h.get("rating", 0) >= 7.0
        ]

        if len(quality_hotels) < self.min_sample_size:
            return anomalies, None

        # Calcular estadísticas de zona
        prices = sorted([h["price_per_night"] for h in quality_hotels])
        zone_stats = self._calculate_stats(prices)

        # Crear perfil de zona para almacenar
        zone_profile = {
            "destination": destination,
            "checkin": checkin,
            "checkout": checkout,
            "star_category": f"{self.min_stars}+",
            "median_price": zone_stats["median"],
            "p10_price": zone_stats["p10"],
            "p25_price": zone_stats["p25"],
            "p75_price": zone_stats["p75"],
            "p90_price": zone_stats["p90"],
            "mean_price": zone_stats["mean"],
            "std_dev": zone_stats["std"],
            "sample_count": len(quality_hotels),
            "data_date": datetime.now().strftime("%Y-%m-%d"),
        }

        # Detectar outliers
        for hotel in quality_hotels:
            price = hotel["price_per_night"]
            percentile = self._get_percentile(price, prices)

            if percentile <= self.percentile_threshold:
                # Es sospechosamente barato
                distance_from_median = ((zone_stats["median"] - price) / zone_stats["median"]) * 100

                # Severidad basada en qué tan lejos está de la mediana
                severity = min(90, int(50 + distance_from_median * 0.5))

                # Bonus si tiene buen rating (más sospechoso)
                if hotel.get("rating", 0) >= 8.0:
                    severity = min(95, severity + 10)

                anomalies.append({
                    "hotel_name": hotel.get("hotel_name", hotel.get("name", "Desconocido")),
                    "destination": destination,
                    "anomaly_type": ANOMALY_ZONE_OUTLIER,
                    "severity_score": severity,
                    "explanation": (
                        f"Precio {price:.0f}€/noche está en percentil {percentile:.0f} "
                        f"de la zona (mediana: {zone_stats['median']:.0f}€, "
                        f"rango p25-p75: {zone_stats['p25']:.0f}-{zone_stats['p75']:.0f}€). "
                        f"Un {distance_from_median:.0f}% por debajo de la mediana. "
                        f"Hotel {hotel.get('stars', '?')}★, rating {hotel.get('rating', '?')}"
                    ),
                    "evidence": {
                        "hotel_price": price,
                        "zone_median": zone_stats["median"],
                        "zone_p10": zone_stats["p10"],
                        "zone_p25": zone_stats["p25"],
                        "percentile": round(percentile, 1),
                        "distance_from_median_pct": round(distance_from_median, 1),
                        "sample_size": len(quality_hotels),
                        "stars": hotel.get("stars", 0),
                        "rating": hotel.get("rating", 0),
                    },
                    "booking_url": hotel.get("url", ""),
                    "checkin": checkin,
                    "checkout": checkout,
                })

        return anomalies, zone_profile

    def _calculate_stats(self, sorted_prices: List[float]) -> dict:
        """Calcula estadísticas sobre precios ordenados."""
        n = len(sorted_prices)
        if n == 0:
            return {"median": 0, "p10": 0, "p25": 0, "p75": 0, "p90": 0,
                    "mean": 0, "std": 0}

        mean = sum(sorted_prices) / n
        variance = sum((p - mean) ** 2 for p in sorted_prices) / n
        std = math.sqrt(variance) if variance > 0 else 0

        return {
            "median": sorted_prices[n // 2],
            "p10": sorted_prices[max(0, int(n * 0.10))],
            "p25": sorted_prices[max(0, int(n * 0.25))],
            "p75": sorted_prices[min(n - 1, int(n * 0.75))],
            "p90": sorted_prices[min(n - 1, int(n * 0.90))],
            "mean": round(mean, 2),
            "std": round(std, 2),
        }

    def _get_percentile(self, value: float, sorted_prices: List[float]) -> float:
        """Calcula en qué percentil está un valor."""
        n = len(sorted_prices)
        if n == 0:
            return 50.0
        count_below = sum(1 for p in sorted_prices if p < value)
        return (count_below / n) * 100


# =========================================================================
# 3. DETECTOR DE ANOMALÍAS ESTACIONALES
# =========================================================================

class SeasonalDetector:
    """
    Detecta cuando un precio es anormalmente bajo para la temporada.

    Ejemplo: Un hotel en agosto (temporada alta) con precios de temporada baja.
    Necesita datos históricos acumulados para funcionar.
    """

    # Meses de temporada alta por región
    HIGH_SEASON = {
        "europe_coastal": [6, 7, 8, 9],       # Junio-Septiembre
        "europe_city": [4, 5, 6, 9, 10, 12],  # Primavera, otoño, Navidad
        "asia_tropical": [11, 12, 1, 2, 3],   # Noviembre-Marzo
        "caribbean": [12, 1, 2, 3, 4],        # Diciembre-Abril
        "default": [6, 7, 8, 12],             # Verano + Navidad
    }

    # Multiplicador esperado en temporada alta vs baja
    HIGH_SEASON_MULTIPLIER = 1.5  # En alta se espera ~50% más caro

    def __init__(
        self,
        deviation_threshold: float = 0.50,  # <50% de la media histórica
        min_historical_records: int = 5,
    ):
        self.deviation_threshold = deviation_threshold
        self.min_records = min_historical_records

    def detect(
        self,
        hotels: List[dict],
        destination: str,
        checkin: str,
        baseline: Optional[dict] = None,
    ) -> List[dict]:
        """
        Compara precios actuales con línea base histórica.

        Args:
            hotels: Hoteles scrapeados con price_per_night
            destination: Destino
            checkin: Fecha de check-in
            baseline: Dict con avg_price, min_price, max_price, sample_count

        Returns:
            Lista de anomalías estacionales
        """
        anomalies = []

        if not baseline or baseline.get("sample_count", 0) < self.min_records:
            return anomalies  # No hay suficientes datos históricos

        avg_baseline = baseline["avg_price"]
        if avg_baseline <= 0:
            return anomalies

        checkin_dt = datetime.strptime(checkin, "%Y-%m-%d")
        month = checkin_dt.month

        # Determinar si es temporada alta
        is_high_season = month in self.HIGH_SEASON.get("default", [])
        season_label = "ALTA" if is_high_season else "baja"

        for hotel in hotels:
            price = hotel.get("price_per_night", 0)
            if price <= 0:
                continue

            deviation = price / avg_baseline

            if deviation <= self.deviation_threshold:
                # Precio es menos de la mitad de la media histórica
                discount_pct = ((avg_baseline - price) / avg_baseline) * 100

                severity = min(85, int(50 + discount_pct * 0.5))
                # Bonus si es temporada alta (más sospechoso)
                if is_high_season:
                    severity = min(95, severity + 10)

                anomalies.append({
                    "hotel_name": hotel.get("hotel_name", hotel.get("name", "Desconocido")),
                    "destination": destination,
                    "anomaly_type": ANOMALY_SEASONAL,
                    "severity_score": severity,
                    "explanation": (
                        f"Precio {price:.0f}€/noche es {discount_pct:.0f}% inferior "
                        f"a la media histórica para {checkin_dt.strftime('%B')} "
                        f"({avg_baseline:.0f}€/noche). "
                        f"Temporada {season_label}. "
                        f"Basado en {baseline['sample_count']} registros históricos."
                    ),
                    "evidence": {
                        "current_price": price,
                        "historical_avg": avg_baseline,
                        "historical_min": baseline["min_price"],
                        "deviation_ratio": round(deviation, 3),
                        "discount_pct": round(discount_pct, 1),
                        "month": month,
                        "is_high_season": is_high_season,
                        "historical_records": baseline["sample_count"],
                    },
                    "booking_url": hotel.get("url", ""),
                    "checkin": checkin,
                    "checkout": hotel.get("checkout", ""),
                })

        return anomalies
