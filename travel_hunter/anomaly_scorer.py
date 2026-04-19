"""
Travel Hunter - Anomaly Scorer
================================
Combina señales de los 3 detectores, deduplica anomalías,
y produce un ranking final con scores 0-100.

Pesos:
- Tipo de habitación: 40% (señal más fiable)
- Zona: 35%
- Temporada: 20%
- Multi-señal: 5% bonus
"""

from typing import Dict, List, Tuple
from anomaly_detector import ANOMALY_ROOM_TYPE, ANOMALY_ZONE_OUTLIER, ANOMALY_SEASONAL


# =========================================================================
# UMBRALES DE ALERTA
# =========================================================================

DEFAULT_ALERT_THRESHOLDS = {
    ANOMALY_ROOM_TYPE: 55,      # Más bajo: señal muy fiable
    ANOMALY_ZONE_OUTLIER: 60,
    ANOMALY_SEASONAL: 65,
    "combined": 50,             # Multi-señal tiene umbral más bajo
}


class AnomalyScorer:
    """Combina y rankea anomalías de múltiples detectores."""

    def __init__(self, thresholds: dict = None):
        self.thresholds = thresholds or DEFAULT_ALERT_THRESHOLDS

    def merge_and_score(
        self,
        room_anomalies: List[dict],
        zone_anomalies: List[dict],
        seasonal_anomalies: List[dict],
    ) -> List[dict]:
        """
        Combina anomalías de los 3 detectores, deduplica por hotel,
        y asigna score final ponderado.

        Returns:
            Lista de anomalías ordenadas por severidad (desc),
            filtradas por umbral.
        """
        # Agrupar anomalías por hotel
        hotel_anomalies: Dict[str, dict] = {}

        # Procesar anomalías de tipo de habitación
        for a in room_anomalies:
            key = self._hotel_key(a)
            if key not in hotel_anomalies:
                hotel_anomalies[key] = self._init_hotel_entry(a)
            hotel_anomalies[key]["room_anomalies"].append(a)
            # Usar el score más alto de room_type
            hotel_anomalies[key]["room_score"] = max(
                hotel_anomalies[key]["room_score"],
                a["severity_score"]
            )

        # Procesar anomalías de zona
        for a in zone_anomalies:
            key = self._hotel_key(a)
            if key not in hotel_anomalies:
                hotel_anomalies[key] = self._init_hotel_entry(a)
            hotel_anomalies[key]["zone_anomaly"] = a
            hotel_anomalies[key]["zone_score"] = a["severity_score"]

        # Procesar anomalías estacionales
        for a in seasonal_anomalies:
            key = self._hotel_key(a)
            if key not in hotel_anomalies:
                hotel_anomalies[key] = self._init_hotel_entry(a)
            hotel_anomalies[key]["seasonal_anomaly"] = a
            hotel_anomalies[key]["seasonal_score"] = a["severity_score"]

        # Calcular score final ponderado para cada hotel
        results = []
        for key, entry in hotel_anomalies.items():
            final_score = self._calculate_final_score(entry)

            # Determinar tipo principal de anomalía
            primary_type = self._get_primary_type(entry)

            # Construir explicación combinada
            explanation = self._build_combined_explanation(entry)

            # Filtrar por umbral
            threshold = self.thresholds.get(primary_type, 60)
            if entry["signal_count"] > 1:
                threshold = self.thresholds.get("combined", 50)

            if final_score >= threshold:
                # Encontrar la mejor evidencia para URL
                best_url = ""
                best_evidence = {}
                for a in entry["room_anomalies"]:
                    if a.get("booking_url"):
                        best_url = a["booking_url"]
                        best_evidence = a.get("evidence", {})
                        break
                if not best_url and entry["zone_anomaly"]:
                    best_url = entry["zone_anomaly"].get("booking_url", "")
                    best_evidence = entry["zone_anomaly"].get("evidence", {})
                if not best_url and entry["seasonal_anomaly"]:
                    best_url = entry["seasonal_anomaly"].get("booking_url", "")
                    best_evidence = entry["seasonal_anomaly"].get("evidence", {})

                results.append({
                    "hotel_name": entry["hotel_name"],
                    "destination": entry["destination"],
                    "anomaly_type": primary_type,
                    "severity_score": final_score,
                    "explanation": explanation,
                    "evidence": best_evidence,
                    "booking_url": best_url,
                    "checkin": entry["checkin"],
                    "checkout": entry["checkout"],
                    "signal_count": entry["signal_count"],
                    "signals": {
                        "room_type": entry["room_score"],
                        "zone": entry["zone_score"],
                        "seasonal": entry["seasonal_score"],
                    },
                })

        # Ordenar por severidad descendente
        results.sort(key=lambda x: x["severity_score"], reverse=True)
        return results

    def _hotel_key(self, anomaly: dict) -> str:
        """Clave única por hotel + destino + fechas."""
        return (
            f"{anomaly['hotel_name']}|{anomaly['destination']}|"
            f"{anomaly.get('checkin', '')}|{anomaly.get('checkout', '')}"
        )

    def _init_hotel_entry(self, anomaly: dict) -> dict:
        """Inicializa entrada de hotel para merge."""
        return {
            "hotel_name": anomaly["hotel_name"],
            "destination": anomaly["destination"],
            "checkin": anomaly.get("checkin", ""),
            "checkout": anomaly.get("checkout", ""),
            "room_anomalies": [],
            "zone_anomaly": None,
            "seasonal_anomaly": None,
            "room_score": 0,
            "zone_score": 0,
            "seasonal_score": 0,
            "signal_count": 0,
        }

    def _calculate_final_score(self, entry: dict) -> int:
        """
        Score ponderado:
        - Room type: 40%
        - Zone: 35%
        - Seasonal: 20%
        - Multi-signal bonus: 5%
        """
        room = entry["room_score"]
        zone = entry["zone_score"]
        seasonal = entry["seasonal_score"]

        # Contar señales activas
        signals = sum([room > 0, zone > 0, seasonal > 0])
        entry["signal_count"] = signals

        if signals == 0:
            return 0

        # Score ponderado solo de señales activas
        weighted = 0
        total_weight = 0

        if room > 0:
            weighted += room * 0.40
            total_weight += 0.40
        if zone > 0:
            weighted += zone * 0.35
            total_weight += 0.35
        if seasonal > 0:
            weighted += seasonal * 0.20
            total_weight += 0.20

        if total_weight > 0:
            score = weighted / total_weight
        else:
            score = 0

        # Bonus multi-señal: si 2+ detectores coinciden, más confianza
        if signals >= 3:
            score = min(100, score + 10)
        elif signals >= 2:
            score = min(100, score + 5)

        return min(100, int(score))

    def _get_primary_type(self, entry: dict) -> str:
        """Determina el tipo principal de anomalía."""
        scores = [
            (ANOMALY_ROOM_TYPE, entry["room_score"]),
            (ANOMALY_ZONE_OUTLIER, entry["zone_score"]),
            (ANOMALY_SEASONAL, entry["seasonal_score"]),
        ]
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[0][0] if scores[0][1] > 0 else ANOMALY_ROOM_TYPE

    def _build_combined_explanation(self, entry: dict) -> str:
        """Construye explicación combinada de todas las señales."""
        parts = []

        if entry["room_anomalies"]:
            # Usar la anomalía de room con mayor score
            best_room = max(entry["room_anomalies"], key=lambda a: a["severity_score"])
            parts.append(f"[HABITACIÓN] {best_room['explanation']}")

        if entry["zone_anomaly"]:
            parts.append(f"[ZONA] {entry['zone_anomaly']['explanation']}")

        if entry["seasonal_anomaly"]:
            parts.append(f"[TEMPORADA] {entry['seasonal_anomaly']['explanation']}")

        return " | ".join(parts)
