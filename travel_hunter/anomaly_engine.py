"""
Travel Hunter - Anomaly Engine
================================
Orquestador del pipeline completo de detección de anomalías.

Pipeline:
1. Scrape variantes de ocupación (Booking.com)
2. Match hoteles entre configs
3. Detectar anomalías por tipo de habitación
4. Analizar zona (percentiles)
5. Verificar anomalías estacionales
6. Combinar, puntuar, filtrar
7. Guardar y notificar
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from occupancy_scraper import OccupancyScraper, match_hotels_across_configs
from anomaly_detector import RoomTypeDetector, ZoneDetector, SeasonalDetector
from anomaly_scorer import AnomalyScorer
from tracker import PriceTracker


# =========================================================================
# LISTA DE DESTINOS POPULARES POR REGIÓN
# =========================================================================

POPULAR_DESTINATIONS = {
    "europe_coastal": [
        "Costa Amalfitana, Italia",
        "Santorini, Grecia",
        "Creta, Grecia",
        "Algarve, Portugal",
        "Costa Brava, España",
        "Mallorca, España",
        "Cerdeña, Italia",
        "Dubrovnik, Croacia",
        "Split, Croacia",
        "Sicilia, Italia",
        "Niza, Francia",
        "Cinque Terre, Italia",
        "Menorca, España",
        "Ibiza, España",
        "Corfú, Grecia",
        "Rodas, Grecia",
        "Madeira, Portugal",
        "Islas Canarias, España",
        "Montenegro",
        "Chipre",
    ],
    "europe_city": [
        "Barcelona, España",
        "Roma, Italia",
        "París, Francia",
        "Praga, República Checa",
        "Budapest, Hungría",
        "Ámsterdam, Países Bajos",
        "Lisboa, Portugal",
        "Viena, Austria",
        "Florencia, Italia",
        "Venecia, Italia",
        "Berlín, Alemania",
        "Atenas, Grecia",
    ],
    "asia_se": [
        "Bali, Indonesia",
        "Phuket, Tailandia",
        "Da Nang, Vietnam",
        "Langkawi, Malasia",
        "Koh Samui, Tailandia",
        "Siem Reap, Camboya",
        "Hoi An, Vietnam",
        "El Nido, Filipinas",
        "Boracay, Filipinas",
        "Krabi, Tailandia",
    ],
    "america": [
        "Cancún, México",
        "Playa del Carmen, México",
        "Cartagena, Colombia",
        "Río de Janeiro, Brasil",
        "Punta Cana, República Dominicana",
        "San Juan, Puerto Rico",
        "Tulum, México",
        "Medellín, Colombia",
        "Lima, Perú",
        "Buenos Aires, Argentina",
    ],
}


class HotelAnomalyEngine:
    """
    Motor principal de detección de anomalías en hoteles.
    Orquesta todo el pipeline: scraping → detección → scoring → notificación.
    """

    def __init__(
        self,
        tracker: PriceTracker,
        config: dict = None,
    ):
        self.tracker = tracker
        self.config = config or {}

        anomaly_cfg = self.config.get("anomaly_detection", {})

        # Inicializar componentes
        self.scraper = OccupancyScraper(
            headless=self.config.get("scraper", {}).get("headless", True),
            slow_mo=self.config.get("scraper", {}).get("slow_mo", 100),
            occupancy_configs=anomaly_cfg.get("occupancy_configs"),
        )

        thresholds = anomaly_cfg.get("thresholds", {})

        self.room_detector = RoomTypeDetector(
            ratio_threshold=thresholds.get("room_type_ratio", 0.35),
            extreme_threshold=thresholds.get("room_type_extreme", 0.20),
            min_stars=thresholds.get("min_stars", 3),
            min_rating=thresholds.get("min_rating", 7.0),
        )

        self.zone_detector = ZoneDetector(
            percentile_threshold=thresholds.get("zone_percentile", 10.0),
            min_sample_size=thresholds.get("min_zone_hotels", 10),
            min_stars=thresholds.get("min_stars", 3),
        )

        self.seasonal_detector = SeasonalDetector(
            deviation_threshold=thresholds.get("seasonal_deviation", 0.50),
        )

        self.scorer = AnomalyScorer(
            thresholds={
                "room_type_mispricing": thresholds.get("room_type_severity", 55),
                "zone_outlier_low": thresholds.get("zone_severity", 60),
                "seasonal_pricing_error": thresholds.get("seasonal_severity", 65),
                "combined": thresholds.get("combined_severity", 50),
            }
        )

    async def scan_destination(
        self,
        destination: str,
        checkin: str,
        checkout: str,
        currency: str = "EUR",
        board_type: str = None,
        stars: List[int] = None,
        min_review_score: float = None,
    ) -> List[dict]:
        """
        Ejecuta el pipeline completo para un destino.

        Returns:
            Lista de anomalías detectadas, ordenadas por severidad.
        """
        scan_id = f"anomaly_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{destination[:10]}"

        print(f"\n{'=' * 60}")
        print(f"🔎 SCAN ANOMALÍAS: {destination}")
        print(f"   Fechas: {checkin} → {checkout}")
        print(f"{'=' * 60}")

        # ---- PASO 1: Scrape variantes de ocupación ----
        print("\n📡 Paso 1: Scraping variantes de ocupación...")
        results_by_config = await self.scraper.scrape_destination_variants(
            destination=destination,
            checkin=checkin,
            checkout=checkout,
            currency=currency,
            board_type=board_type,
            stars=stars,
            min_review_score=min_review_score,
        )

        if not results_by_config:
            print("   ❌ No se obtuvieron resultados. Abortando scan.")
            return []

        # Guardar variantes en DB
        variants = self.scraper.prepare_variants_for_storage(
            results_by_config, destination, checkin, checkout, currency
        )
        if variants:
            self.tracker.save_room_variants(scan_id, variants)
            print(f"   💾 {len(variants)} variantes guardadas")

        # ---- PASO 2: Match hoteles entre configs ----
        print("\n🔗 Paso 2: Matching hoteles entre configs...")
        matched = match_hotels_across_configs(results_by_config, threshold=0.85)
        multi_config = {k: v for k, v in matched.items() if len(v) >= 2}
        print(f"   ✅ {len(matched)} hoteles encontrados, {len(multi_config)} con 2+ configs")

        # ---- PASO 3: Detectar anomalías de tipo de habitación ----
        print("\n🏨 Paso 3: Detectando anomalías de tipo de habitación...")
        room_anomalies = self.room_detector.detect(
            matched, destination, checkin, checkout
        )
        print(f"   {'✅' if room_anomalies else '➖'} {len(room_anomalies)} anomalías de habitación")

        # ---- PASO 4: Análisis de zona ----
        print("\n📊 Paso 4: Análisis de zona...")
        # Usar todos los hoteles de la primera config (o la más poblada)
        biggest_config = max(results_by_config.values(), key=len) if results_by_config else []
        zone_anomalies, zone_profile = self.zone_detector.detect(
            biggest_config, destination, checkin, checkout
        )
        if zone_profile:
            self.tracker.save_zone_profile(zone_profile)
            print(f"   📈 Perfil zona: mediana {zone_profile['median_price']:.0f}€, "
                  f"muestra {zone_profile['sample_count']}")
        print(f"   {'✅' if zone_anomalies else '➖'} {len(zone_anomalies)} outliers de zona")

        # ---- PASO 5: Anomalías estacionales ----
        print("\n📅 Paso 5: Verificando anomalías estacionales...")
        checkin_dt = datetime.strptime(checkin, "%Y-%m-%d")
        baseline = self.tracker.get_seasonal_baseline(destination, checkin_dt.month)
        seasonal_anomalies = self.seasonal_detector.detect(
            biggest_config, destination, checkin, baseline
        )
        if baseline:
            print(f"   📜 Baseline histórica: {baseline['avg_price']:.0f}€/noche "
                  f"({baseline['sample_count']} registros)")
        else:
            print("   ℹ️  Sin datos históricos suficientes para análisis estacional")
        print(f"   {'✅' if seasonal_anomalies else '➖'} {len(seasonal_anomalies)} anomalías estacionales")

        # ---- PASO 6: Combinar, puntuar, filtrar ----
        print("\n⚖️  Paso 6: Scoring y ranking...")
        final_anomalies = self.scorer.merge_and_score(
            room_anomalies, zone_anomalies, seasonal_anomalies
        )
        print(f"   🏆 {len(final_anomalies)} anomalías superan el umbral")

        # ---- PASO 7: Guardar en DB ----
        for anomaly in final_anomalies:
            anomaly["scan_id"] = scan_id
            self.tracker.save_anomaly(anomaly)

        # Resumen
        if final_anomalies:
            print(f"\n{'─' * 50}")
            print(f"🚨 TOP ANOMALÍAS:")
            for i, a in enumerate(final_anomalies[:5], 1):
                print(f"   {i}. [{a['severity_score']}/100] {a['hotel_name']}")
                print(f"      {a['explanation'][:120]}...")

        return final_anomalies

    async def scan_multiple_destinations(
        self,
        destinations: List[dict],
        max_per_run: int = 2,
    ) -> List[dict]:
        """
        Escanea múltiples destinos con rotación.

        Args:
            destinations: Lista de dicts con destination, checkin, checkout, etc.
            max_per_run: Máximo destinos por ejecución (para rate limiting)

        Returns:
            Todas las anomalías detectadas
        """
        all_anomalies = []

        # Rotar destinos: usar state file para tracking
        state_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "anomaly_state.json"
        )
        state = self._load_state(state_file)
        run_counter = state.get("run_counter", 0)

        # Seleccionar destinos para esta ejecución
        start_idx = (run_counter * max_per_run) % max(len(destinations), 1)
        selected = []
        for i in range(max_per_run):
            idx = (start_idx + i) % len(destinations)
            if idx < len(destinations):
                selected.append(destinations[idx])

        state["run_counter"] = run_counter + 1
        state["last_run"] = datetime.now().isoformat()
        state["last_destinations"] = [d.get("destination", "?") for d in selected]
        self._save_state(state_file, state)

        print(f"\n🌍 Escaneando {len(selected)} destinos (run #{run_counter + 1}):")
        for d in selected:
            print(f"   • {d.get('destination', '?')}")

        for dest_params in selected:
            try:
                anomalies = await self.scan_destination(
                    destination=dest_params["destination"],
                    checkin=dest_params["checkin"],
                    checkout=dest_params["checkout"],
                    currency=dest_params.get("currency", "EUR"),
                    board_type=dest_params.get("board_type"),
                    stars=dest_params.get("stars"),
                    min_review_score=dest_params.get("min_review_score"),
                )
                all_anomalies.extend(anomalies)
            except Exception as e:
                print(f"   ❌ Error en {dest_params.get('destination', '?')}: {e}")

            # Delay entre destinos (3-5 minutos)
            if selected.index(dest_params) < len(selected) - 1:
                delay = 180 + (120 * (hash(datetime.now().isoformat()) % 10) / 10)
                print(f"\n   ⏳ Pausa entre destinos: {delay:.0f}s...")
                await asyncio.sleep(delay)

        return all_anomalies

    def get_destinations_from_config(self) -> List[dict]:
        """
        Obtiene destinos configurados + destinos populares de regiones.
        """
        anomaly_cfg = self.config.get("anomaly_detection", {})
        destinations = []

        # Destinos fijos del usuario
        for dest in anomaly_cfg.get("destinations", []):
            if isinstance(dest, str):
                # Solo nombre: usar fechas de las búsquedas normales
                for search in self.config.get("searches", []):
                    hp = search.get("hotel_params")
                    if hp:
                        destinations.append({
                            "destination": dest,
                            "checkin": hp["checkin"],
                            "checkout": hp["checkout"],
                            "currency": hp.get("currency", "EUR"),
                            "stars": hp.get("stars"),
                            "min_review_score": hp.get("min_review_score"),
                        })
                        break
            elif isinstance(dest, dict):
                destinations.append(dest)

        # Destinos de búsquedas existentes (si anomaly está habilitado)
        if anomaly_cfg.get("scan_existing_searches", True):
            for search in self.config.get("searches", []):
                hp = search.get("hotel_params")
                if hp and hp.get("destination"):
                    destinations.append({
                        "destination": hp["destination"],
                        "checkin": hp["checkin"],
                        "checkout": hp["checkout"],
                        "currency": hp.get("currency", "EUR"),
                        "board_type": hp.get("board_type"),
                        "stars": hp.get("stars"),
                        "min_review_score": hp.get("min_review_score"),
                    })

        # Destinos populares de regiones configuradas
        for region in anomaly_cfg.get("scan_regions", []):
            region_dests = POPULAR_DESTINATIONS.get(region, [])
            for dest_name in region_dests:
                # Usar fechas del primer search como referencia
                ref_dates = self._get_reference_dates()
                if ref_dates:
                    destinations.append({
                        "destination": dest_name,
                        "checkin": ref_dates["checkin"],
                        "checkout": ref_dates["checkout"],
                        "currency": ref_dates.get("currency", "EUR"),
                        "min_review_score": 7.0,
                    })

        # Deduplicar por destino+fechas
        seen = set()
        unique = []
        for d in destinations:
            key = f"{d['destination']}|{d['checkin']}|{d['checkout']}"
            if key not in seen:
                seen.add(key)
                unique.append(d)

        return unique

    def _get_reference_dates(self) -> Optional[dict]:
        """Obtiene fechas de referencia del primer search configurado."""
        for search in self.config.get("searches", []):
            hp = search.get("hotel_params")
            if hp:
                return {
                    "checkin": hp["checkin"],
                    "checkout": hp["checkout"],
                    "currency": hp.get("currency", "EUR"),
                }
        return None

    def _load_state(self, path: str) -> dict:
        """Carga estado de rotación."""
        if os.path.exists(path):
            try:
                with open(path) as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_state(self, path: str, state: dict):
        """Guarda estado de rotación."""
        with open(path, "w") as f:
            json.dump(state, f, indent=2)
