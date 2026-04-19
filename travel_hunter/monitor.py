"""
Travel Hunter - Monitor Module
Ejecuta búsquedas periódicas y gestiona el ciclo de monitoreo.
Permite configurar intervalos diferentes para día y noche.
"""

import asyncio
import json
import os
import signal
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

sys.path.insert(0, os.path.dirname(__file__))
from scraper import TravelScraper, SearchResult
from tracker import PriceTracker
from notifier import EmailNotifier, ConsoleNotifier


class TravelMonitor:
    """
    Monitor de precios que ejecuta búsquedas periódicas.
    Soporta intervalos diferentes para día y noche.
    """

    def __init__(self, config: dict):
        self.config = config
        self.running = False

        # Configuración de monitoreo
        monitor_cfg = config.get("monitor", {})
        self.interval_day_hours = monitor_cfg.get("interval_day_hours", 4)
        self.interval_night_hours = monitor_cfg.get("interval_night_hours", 6)
        self.day_start_hour = monitor_cfg.get("day_start_hour", 7)
        self.day_end_hour = monitor_cfg.get("day_end_hour", 23)
        self.min_drop_percent_flight = monitor_cfg.get("min_drop_percent_flight", 5.0)
        self.min_drop_percent_hotel = monitor_cfg.get("min_drop_percent_hotel", 8.0)
        self.price_error_threshold = monitor_cfg.get("price_error_threshold", 15.0)

        # Aerolíneas a comprobar para errores de precio
        self.airlines_to_check = monitor_cfg.get("airlines_to_check", [
            "ryanair", "easyjet", "vueling", "transavia",
            "lufthansa", "airfrance", "aegean", "turkish"
        ])

        # Componentes
        self.scraper = TravelScraper(
            headless=config.get("scraper", {}).get("headless", True),
            slow_mo=config.get("scraper", {}).get("slow_mo", 100),
        )

        db_path = config.get("database", {}).get("path", "travel_prices.db")
        self.tracker = PriceTracker(db_path=db_path)

        # Email
        email_cfg = config.get("email", {})
        self.notifier = EmailNotifier(
            smtp_server=email_cfg.get("smtp_server", "smtp.gmail.com"),
            smtp_port=email_cfg.get("smtp_port", 587),
            sender_email=email_cfg.get("sender_email", ""),
            sender_password=email_cfg.get("sender_password", ""),
            recipient_email=email_cfg.get("recipient_email", ""),
        )

        # Señales para parada limpia
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

    def _handle_shutdown(self, signum, frame):
        """Maneja señal de parada."""
        print("\n🛑 Deteniendo Travel Hunter Monitor...")
        self.running = False

    def _get_interval_seconds(self) -> int:
        """Calcula el intervalo según la hora actual (día/noche)."""
        hour = datetime.now().hour
        if self.day_start_hour <= hour < self.day_end_hour:
            return self.interval_day_hours * 3600
        else:
            return self.interval_night_hours * 3600

    async def run_search_cycle(self, searches: List[dict]) -> dict:
        """
        Ejecuta un ciclo completo de búsqueda.

        Args:
            searches: Lista de búsquedas configuradas, cada una con
                     flight_params y hotel_params.

        Returns:
            Resumen del ciclo.
        """
        cycle_start = datetime.now()
        cycle_summary = {
            "timestamp": cycle_start.isoformat(),
            "searches": [],
            "flight_alerts": [],
            "hotel_alerts": [],
            "price_errors": [],
            "total_flights_found": 0,
            "total_hotels_found": 0,
        }

        for search in searches:
            search_name = search.get("name", "Sin nombre")
            print(f"\n{'='*60}")
            print(f"🔍 Búsqueda: {search_name}")
            print(f"{'='*60}")

            flight_params = search.get("flight_params", {})
            hotel_params = search.get("hotel_params", {})
            search_id = f"{search_name}_{cycle_start.strftime('%Y%m%d_%H%M%S')}"

            # ---- VUELOS ----
            if flight_params:
                try:
                    await self.scraper._init_browser()
                    flights, flight_urls = await self.scraper.search_flights(flight_params)

                    if flights:
                        # Guardar en DB
                        self.tracker.save_flights(search_id, flights)
                        self.tracker.save_search(
                            search_id, "flights", flight_params,
                            len(flights), flights[0].price if flights else 0
                        )
                        cycle_summary["total_flights_found"] += len(flights)

                        # Detectar bajadas de precio
                        flight_drops = self.tracker.detect_price_drops(
                            flights, self.min_drop_percent_flight
                        )
                        cycle_summary["flight_alerts"].extend(flight_drops)

                        # Comprobar precios directos de aerolíneas
                        airlines_found = set(f.airline.lower() for f in flights)
                        direct_results = []
                        for airline in self.airlines_to_check:
                            if airline.lower() in airlines_found or len(flights) > 0:
                                direct = await self.scraper.check_airline_direct(
                                    airline, flight_params
                                )
                                if direct:
                                    direct_results.append(direct)

                        # Detectar errores de precio
                        if direct_results:
                            errors = self.tracker.detect_price_errors(
                                flights, direct_results, self.price_error_threshold
                            )
                            cycle_summary["price_errors"].extend(errors)

                    # Siempre guardar URLs
                    cycle_summary["searches"].append({
                        "name": search_name,
                        "type": "flights",
                        "results_count": len(flights),
                        "urls": flight_urls,
                        "best_price": flights[0].price if flights else None,
                    })

                except Exception as e:
                    print(f"❌ Error en búsqueda de vuelos: {e}")
                    cycle_summary["searches"].append({
                        "name": search_name,
                        "type": "flights",
                        "error": str(e),
                    })
                finally:
                    await self.scraper._close()

            # ---- HOTELES ----
            if hotel_params:
                try:
                    await self.scraper._init_browser()
                    hotels, hotel_urls = await self.scraper.search_hotels(hotel_params)

                    if hotels:
                        self.tracker.save_hotels(search_id, hotels)
                        self.tracker.save_search(
                            search_id, "hotels", hotel_params,
                            len(hotels), hotels[0].price_total if hotels else 0
                        )
                        cycle_summary["total_hotels_found"] += len(hotels)

                        # Detectar bajadas
                        hotel_drops = self.tracker.detect_hotel_price_drops(
                            hotels, self.min_drop_percent_hotel
                        )
                        cycle_summary["hotel_alerts"].extend(hotel_drops)

                    cycle_summary["searches"].append({
                        "name": search_name,
                        "type": "hotels",
                        "results_count": len(hotels),
                        "urls": hotel_urls,
                        "best_price": hotels[0].price_total if hotels else None,
                    })

                except Exception as e:
                    print(f"❌ Error en búsqueda de hoteles: {e}")
                    cycle_summary["searches"].append({
                        "name": search_name,
                        "type": "hotels",
                        "error": str(e),
                    })
                finally:
                    await self.scraper._close()

        # ---- NOTIFICACIONES ----
        self._send_notifications(cycle_summary)

        # Resumen en consola
        duration = (datetime.now() - cycle_start).total_seconds()
        print(f"\n⏱️  Ciclo completado en {duration:.0f} segundos")
        print(f"   Vuelos encontrados: {cycle_summary['total_flights_found']}")
        print(f"   Hoteles encontrados: {cycle_summary['total_hotels_found']}")
        print(f"   Alertas vuelos: {len(cycle_summary['flight_alerts'])}")
        print(f"   Alertas hoteles: {len(cycle_summary['hotel_alerts'])}")
        print(f"   Errores de precio: {len(cycle_summary['price_errors'])}")

        return cycle_summary

    def _send_notifications(self, cycle_summary: dict):
        """Envía notificaciones basadas en el resumen del ciclo."""

        # Alertas de vuelos (incluyendo errores de precio)
        flight_alerts = cycle_summary["flight_alerts"] + cycle_summary["price_errors"]
        if flight_alerts:
            self.notifier.notify_flight_alerts(flight_alerts)
            ConsoleNotifier.print_flight_alerts(flight_alerts)

        # Alertas de hoteles (separadas)
        hotel_alerts = cycle_summary["hotel_alerts"]
        if hotel_alerts:
            self.notifier.notify_hotel_alerts(hotel_alerts)
            ConsoleNotifier.print_hotel_alerts(hotel_alerts)

        # Resumen general (siempre enviar en primera búsqueda o si hay resultados)
        all_flights = []
        all_hotels = []
        all_urls = {}
        for s in cycle_summary["searches"]:
            if "urls" in s:
                all_urls.update(s.get("urls", {}))

        if cycle_summary["total_flights_found"] > 0 or cycle_summary["total_hotels_found"] > 0:
            # El resumen ya se muestra en consola por los scrapers
            ConsoleNotifier.print_search_summary(all_flights, all_hotels, all_urls)

    async def start_monitoring(self, searches: List[dict]):
        """
        Inicia el monitoreo continuo.

        Args:
            searches: Lista de búsquedas a ejecutar periódicamente.
        """
        self.running = True
        cycle_count = 0

        print("\n" + "=" * 60)
        print("🚀 TRAVEL HUNTER MONITOR - INICIADO")
        print("=" * 60)
        print(f"   Búsquedas configuradas: {len(searches)}")
        print(f"   Intervalo día ({self.day_start_hour}:00-{self.day_end_hour}:00): "
              f"cada {self.interval_day_hours}h")
        print(f"   Intervalo noche: cada {self.interval_night_hours}h")
        print(f"   Umbral bajada vuelos: {self.min_drop_percent_flight}%")
        print(f"   Umbral bajada hoteles: {self.min_drop_percent_hotel}%")
        print(f"   Umbral error precio: {self.price_error_threshold}%")
        print("   Presiona Ctrl+C para detener")
        print("=" * 60)

        while self.running:
            cycle_count += 1
            print(f"\n🔄 Ciclo #{cycle_count} - {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

            try:
                await self.run_search_cycle(searches)
            except Exception as e:
                print(f"❌ Error en ciclo: {e}")
                self.notifier.notify_error(str(e), f"Ciclo #{cycle_count}")

            if not self.running:
                break

            # Calcular próxima ejecución
            interval = self._get_interval_seconds()
            next_run = datetime.now() + timedelta(seconds=interval)
            print(f"\n⏰ Próxima búsqueda: {next_run.strftime('%d/%m/%Y %H:%M:%S')} "
                  f"(en {interval // 3600}h {(interval % 3600) // 60}m)")

            # Esperar con posibilidad de interrupción
            for _ in range(interval):
                if not self.running:
                    break
                await asyncio.sleep(1)

        print("\n✅ Travel Hunter Monitor detenido limpiamente.")

    async def run_once(self, searches: List[dict]) -> dict:
        """Ejecuta una sola búsqueda (sin loop)."""
        return await self.run_search_cycle(searches)
