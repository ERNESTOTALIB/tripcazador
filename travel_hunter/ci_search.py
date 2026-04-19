#!/usr/bin/env python3
"""
Travel Hunter - Script de búsqueda para CI (GitHub Actions).
Ejecuta una búsqueda completa y envía resultados por email.

Diferencias con ejecución local:
- Siempre envía email con URLs aunque el scraping falle
- Timeout más agresivo para no exceder límites de GitHub Actions
- Manejo de errores más robusto (la CI debe terminar siempre)
"""

import asyncio
import json
import os
import sys
import traceback
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from url_generator import URLGenerator
from scraper import TravelScraper, FlightResult, HotelResult, PLAYWRIGHT_AVAILABLE
from tequila_api import TequilaAPI
from tracker import PriceTracker
from notifier import EmailNotifier, ConsoleNotifier
from anomaly_engine import HotelAnomalyEngine


async def run_ci_search():
    """Ejecuta búsqueda completa adaptada a CI."""
    print("=" * 60)
    print(f"🚀 TRAVEL HUNTER CI - {datetime.now().strftime('%d/%m/%Y %H:%M:%S UTC')}")
    print("=" * 60)

    # Cargar config
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    if not os.path.exists(config_path):
        print("❌ config.json no encontrado. ¿Se ejecutó generate_ci_config.py?")
        sys.exit(1)

    with open(config_path) as f:
        config = json.load(f)

    searches = config.get("searches", [])
    if not searches:
        print("⚠️  No hay búsquedas configuradas.")
        return

    # Inicializar componentes
    email_cfg = config.get("email", {})
    notifier = EmailNotifier(
        smtp_server=email_cfg.get("smtp_server", "smtp.gmail.com"),
        smtp_port=email_cfg.get("smtp_port", 587),
        sender_email=email_cfg.get("sender_email", ""),
        sender_password=email_cfg.get("sender_password", ""),
        recipient_email=email_cfg.get("recipient_email", ""),
    )

    tracker = PriceTracker(config.get("database", {}).get("path", "travel_prices.db"))

    monitor_cfg = config.get("monitor", {})
    airlines_to_check = monitor_cfg.get("airlines_to_check", [])
    min_drop_flight = monitor_cfg.get("min_drop_percent_flight", 5.0)
    min_drop_hotel = monitor_cfg.get("min_drop_percent_hotel", 8.0)
    error_threshold = monitor_cfg.get("price_error_threshold", 15.0)

    # Resultados globales
    all_flight_results = []
    all_hotel_results = []
    all_urls = {}
    all_flight_alerts = []
    all_hotel_alerts = []
    all_price_errors = []
    search_errors = []

    for search in searches:
        name = search.get("name", "Sin nombre")
        fp = search.get("flight_params")
        hp = search.get("hotel_params")
        search_id = f"ci_{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        print(f"\n{'─' * 50}")
        print(f"📌 {name}")
        print(f"{'─' * 50}")

        # ---- GENERAR URLs (siempre funciona) ----
        if fp:
            flight_urls = URLGenerator.generate_all_flight_urls(fp)
            all_urls.update({f"✈️ {name} - {k}": v for k, v in flight_urls.items()})

            # URLs de aerolíneas directas
            for airline in airlines_to_check:
                url = URLGenerator.airline_direct(
                    airline, fp["origin"], fp["destination"],
                    fp["date_depart"], fp["date_return"],
                    fp.get("adults", 1), fp.get("children", 0),
                    fp.get("infants_lap", 0),
                )
                if url:
                    all_urls[f"✈️ {name} - {airline} (directo)"] = url

        if hp:
            hotel_urls = URLGenerator.generate_all_hotel_urls(hp)
            all_urls.update({f"🏨 {name} - {k}": v for k, v in hotel_urls.items()})

        # ---- TEQUILA API (fuente principal de vuelos, siempre fiable) ----
        tequila_cfg = config.get("tequila", {})
        if tequila_cfg.get("enabled") and tequila_cfg.get("api_key") and fp:
            try:
                tequila = TequilaAPI(tequila_cfg["api_key"])
                flex_days = tequila_cfg.get("flex_days", 0)
                print("🌐 Buscando vuelos via Tequila API (fuente principal)...")

                tequila_results, _ = tequila.search_flights(
                    origin=fp["origin"], destination=fp["destination"],
                    date_depart=fp["date_depart"], date_return=fp["date_return"],
                    adults=fp.get("adults", 1), children=fp.get("children", 0),
                    infants=fp.get("infants_lap", 0),
                    cabin_class=fp.get("cabin_class", "economy"),
                    currency=fp.get("currency", "EUR"),
                    date_from_flex=flex_days, date_to_flex=flex_days,
                    limit=20,
                )

                if tequila_results:
                    all_flight_results.extend(tequila_results)
                    tracker.save_flights(search_id + "_tequila", tequila_results)
                    print(f"   ✅ {len(tequila_results)} vuelos via Tequila")

                    # Detectar bajadas comparando con historial
                    drops = tracker.detect_price_drops(tequila_results, min_drop_flight)
                    all_flight_alerts.extend(drops)
            except Exception as e:
                print(f"   ⚠️  Error Tequila API: {e}")
                search_errors.append(f"Tequila {name}: {e}")

        # ---- SCRAPING (fuente secundaria + hoteles + detección errores precio) ----
        if PLAYWRIGHT_AVAILABLE and os.environ.get("SEARCH_MODE") != "urls_only":
            scraper = TravelScraper(headless=True, slow_mo=50)

            # Vuelos (scraping como secundario, complementa Tequila)
            if fp:
                try:
                    print("🔍 Scraping vuelos...")
                    await scraper._init_browser()
                    flights, _ = await scraper.search_flights(fp)
                    await scraper._close()

                    if flights:
                        all_flight_results.extend(flights)
                        tracker.save_flights(search_id, flights)
                        tracker.save_search(
                            search_id, "flights", fp,
                            len(flights), flights[0].price
                        )
                        print(f"   ✅ {len(flights)} vuelos encontrados")

                        # Detectar bajadas
                        drops = tracker.detect_price_drops(flights, min_drop_flight)
                        all_flight_alerts.extend(drops)

                        # Comprobar aerolíneas directas para detectar errores
                        direct_results = []
                        await scraper._init_browser()
                        for airline in airlines_to_check[:4]:  # Limitar a 4 en CI
                            try:
                                direct = await scraper.check_airline_direct(airline, fp)
                                if direct:
                                    direct_results.append(direct)
                            except Exception:
                                continue
                        await scraper._close()

                        if direct_results:
                            errors = tracker.detect_price_errors(
                                flights, direct_results, error_threshold
                            )
                            all_price_errors.extend(errors)
                    else:
                        print("   ⚠️  Scraping no extrajo resultados (normal, los sitios bloquean)")
                except Exception as e:
                    print(f"   ❌ Error scraping vuelos: {e}")
                    search_errors.append(f"Vuelos {name}: {e}")
                    try:
                        await scraper._close()
                    except Exception:
                        pass

            # Hoteles
            if hp:
                try:
                    print("🔍 Scraping hoteles...")
                    await scraper._init_browser()
                    hotels, _ = await scraper.search_hotels(hp)
                    await scraper._close()

                    if hotels:
                        all_hotel_results.extend(hotels)
                        tracker.save_hotels(search_id, hotels)
                        tracker.save_search(
                            search_id, "hotels", hp,
                            len(hotels), hotels[0].price_total
                        )
                        print(f"   ✅ {len(hotels)} hoteles encontrados")

                        drops = tracker.detect_hotel_price_drops(hotels, min_drop_hotel)
                        all_hotel_alerts.extend(drops)
                    else:
                        print("   ⚠️  Scraping no extrajo resultados de hoteles")
                except Exception as e:
                    print(f"   ❌ Error scraping hoteles: {e}")
                    search_errors.append(f"Hoteles {name}: {e}")
                    try:
                        await scraper._close()
                    except Exception:
                        pass
        else:
            print("   ℹ️  Modo URLs only (sin scraping)")

    # ---- DETECCIÓN DE ANOMALÍAS ----
    all_anomalies = []
    anomaly_cfg = config.get("anomaly_detection", {})
    if anomaly_cfg.get("enabled", False) and PLAYWRIGHT_AVAILABLE:
        print(f"\n{'=' * 50}")
        print("🔎 DETECCIÓN DE ANOMALÍAS")
        print(f"{'=' * 50}")

        try:
            engine = HotelAnomalyEngine(tracker=tracker, config=config)
            destinations = engine.get_destinations_from_config()

            if destinations:
                max_per_run = anomaly_cfg.get("max_destinations_per_run", 2)
                all_anomalies = await engine.scan_multiple_destinations(
                    destinations, max_per_run=max_per_run
                )
                print(f"   🚨 {len(all_anomalies)} anomalías detectadas")
            else:
                print("   ℹ️  No hay destinos configurados para anomalías")
        except Exception as e:
            print(f"   ❌ Error en detección de anomalías: {e}")
            search_errors.append(f"Anomalías: {e}")

    # ---- ENVIAR EMAILS ----
    print(f"\n{'=' * 50}")
    print("📧 ENVIANDO NOTIFICACIONES")
    print(f"{'=' * 50}")

    # 1. Alertas de vuelos (si hay)
    flight_alerts_all = all_flight_alerts + all_price_errors
    if flight_alerts_all:
        print(f"   ✈️  {len(flight_alerts_all)} alertas de vuelo")
        notifier.notify_flight_alerts(flight_alerts_all)
        ConsoleNotifier.print_flight_alerts(flight_alerts_all)

    # 2. Alertas de hoteles (si hay)
    if all_hotel_alerts:
        print(f"   🏨 {len(all_hotel_alerts)} alertas de hotel")
        notifier.notify_hotel_alerts(all_hotel_alerts)
        ConsoleNotifier.print_hotel_alerts(all_hotel_alerts)

    # 3. Alertas de anomalías (si hay)
    if all_anomalies:
        print(f"   🚨 {len(all_anomalies)} anomalías de precio")
        notifier.notify_anomalies(all_anomalies)
        ConsoleNotifier.print_anomaly_alerts(all_anomalies)

    # 4. Resumen siempre (con URLs de fallback)
    notifier.notify_search_summary(
        all_flight_results,
        all_hotel_results,
        all_urls,
        {"searches": [s.get("name", "?") for s in searches]},
    )
    print("   📊 Resumen enviado")

    # 4. Si hubo errores de sistema, notificar
    if search_errors:
        notifier.notify_error(
            "\n".join(search_errors),
            f"Ciclo CI - {len(search_errors)} errores"
        )

    # ---- RESUMEN FINAL ----
    print(f"\n{'=' * 50}")
    print("📊 RESUMEN")
    print(f"{'=' * 50}")
    print(f"   Vuelos encontrados: {len(all_flight_results)}")
    print(f"   Hoteles encontrados: {len(all_hotel_results)}")
    print(f"   Alertas vuelos: {len(all_flight_alerts)}")
    print(f"   Alertas hoteles: {len(all_hotel_alerts)}")
    print(f"   Errores de precio: {len(all_price_errors)}")
    print(f"   Anomalías hotel: {len(all_anomalies)}")
    print(f"   URLs generadas: {len(all_urls)}")
    print(f"   Errores de sistema: {len(search_errors)}")

    if all_flight_results:
        best = min(all_flight_results, key=lambda x: x.price)
        print(f"\n   🏆 Mejor vuelo: {best.airline} {best.price}€ ({best.platform})")

    if all_hotel_results:
        best = min(all_hotel_results, key=lambda x: x.price_total)
        print(f"   🏆 Mejor hotel: {best.name} {best.price_total}€ ({best.platform})")

    # Guardar resultado
    result = {
        "timestamp": datetime.now().isoformat(),
        "flights_count": len(all_flight_results),
        "hotels_count": len(all_hotel_results),
        "flight_alerts": len(all_flight_alerts),
        "hotel_alerts": len(all_hotel_alerts),
        "price_errors": len(all_price_errors),
        "hotel_anomalies": len(all_anomalies),
        "urls_count": len(all_urls),
        "errors": search_errors,
    }

    result_path = f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(result_path, "w") as f:
        json.dump(result, f, indent=2, default=str)
    print(f"\n   💾 Resultado: {result_path}")


if __name__ == "__main__":
    try:
        asyncio.run(run_ci_search())
    except Exception as e:
        print(f"\n❌ ERROR FATAL: {e}")
        traceback.print_exc()
        sys.exit(1)
