#!/usr/bin/env python3
"""
Travel Hunter - Buscador automático de ofertas de viaje
========================================================

Busca los mejores precios en Google Flights, Skyscanner, Booking y Airbnb.
Detecta bajadas de precio y errores de tarifa en aerolíneas.
Envía notificaciones separadas para vuelos y hoteles.

USO:
    # Búsqueda única (una sola vez)
    python main.py search

    # Monitoreo continuo (busca periódicamente)
    python main.py monitor

    # Solo generar URLs (sin scraping)
    python main.py urls

    # Ver historial de precios
    python main.py history

    # Búsqueda rápida desde línea de comandos
    python main.py quick --from SXB --to ATH --depart 2026-08-01 --return 2026-08-15 --adults 4 --infants 1

CONFIGURACIÓN:
    1. Copia config_example.json a config.json
    2. Rellena tus datos de email (opcional, para notificaciones)
    3. Configura tus búsquedas en la sección "searches"
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime

# Asegurar que los imports funcionan
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from url_generator import URLGenerator
from scraper import TravelScraper
from tracker import PriceTracker
from notifier import EmailNotifier, ConsoleNotifier
from monitor import TravelMonitor
from anomaly_engine import HotelAnomalyEngine


def load_config(config_path: str = None) -> dict:
    """Carga configuración desde archivo JSON."""
    if config_path is None:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

    if not os.path.exists(config_path):
        example_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config_example.json")
        print(f"⚠️  No se encontró config.json")
        print(f"   Copia config_example.json a config.json y rellena tus datos:")
        print(f"   cp {example_path} {config_path}")
        sys.exit(1)

    with open(config_path, "r") as f:
        return json.load(f)


def cmd_urls(config: dict):
    """Genera y muestra URLs de búsqueda para todas las configuraciones."""
    searches = config.get("searches", [])

    if not searches:
        print("⚠️  No hay búsquedas configuradas en config.json")
        return

    print("\n" + "=" * 70)
    print("🔗 TRAVEL HUNTER - URLS DE BÚSQUEDA")
    print("=" * 70)

    for search in searches:
        name = search.get("name", "Sin nombre")
        print(f"\n{'─' * 50}")
        print(f"📌 {name}")
        print(f"{'─' * 50}")

        fp = search.get("flight_params")
        if fp:
            print("\n  ✈️  VUELOS:")
            urls = URLGenerator.generate_all_flight_urls(fp)
            for platform, url in urls.items():
                print(f"     {platform}: {url}")

            # URLs de aerolíneas directas
            airlines = config.get("monitor", {}).get("airlines_to_check", [])
            if airlines:
                print("\n  🔍 AEROLÍNEAS DIRECTAS (para comparar precios):")
                for airline in airlines:
                    url = URLGenerator.airline_direct(
                        airline, fp["origin"], fp["destination"],
                        fp["date_depart"], fp["date_return"],
                        fp.get("adults", 1), fp.get("children", 0),
                        fp.get("infants_lap", 0)
                    )
                    if url:
                        print(f"     {airline}: {url}")

        hp = search.get("hotel_params")
        if hp:
            print("\n  🏨 HOTELES:")
            urls = URLGenerator.generate_all_hotel_urls(hp)
            for platform, url in urls.items():
                print(f"     {platform}: {url}")


async def cmd_search(config: dict):
    """Ejecuta una búsqueda única."""
    searches = config.get("searches", [])

    if not searches:
        print("⚠️  No hay búsquedas configuradas en config.json")
        return

    monitor = TravelMonitor(config)
    # Filtrar búsquedas con params no nulos
    valid_searches = []
    for s in searches:
        if s.get("flight_params") or s.get("hotel_params"):
            valid_searches.append(s)

    result = await monitor.run_once(valid_searches)

    # Guardar resultado
    result_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    with open(result_path, "w") as f:
        json.dump(result, f, indent=2, default=str)
    print(f"\n💾 Resultado guardado en: {result_path}")


async def cmd_monitor(config: dict):
    """Inicia monitoreo continuo."""
    searches = config.get("searches", [])

    if not searches:
        print("⚠️  No hay búsquedas configuradas en config.json")
        return

    monitor = TravelMonitor(config)
    valid_searches = [s for s in searches if s.get("flight_params") or s.get("hotel_params")]
    await monitor.start_monitoring(valid_searches)


async def cmd_quick(args):
    """Búsqueda rápida desde línea de comandos."""
    print(f"\n🔍 Búsqueda rápida: {args.origin} → {args.destination}")
    print(f"   Fechas: {args.depart} → {getattr(args, 'return')}")
    print(f"   Viajeros: {args.adults} adultos, {args.children} niños, {args.infants} bebés")

    flight_params = {
        "origin": args.origin.upper(),
        "destination": args.destination.upper(),
        "date_depart": args.depart,
        "date_return": getattr(args, "return"),
        "adults": args.adults,
        "children": args.children,
        "infants_lap": args.infants,
        "cabin_class": "economy",
        "currency": args.currency,
    }

    # Generar URLs siempre
    print("\n🔗 URLs DE BÚSQUEDA:")
    print("-" * 50)
    flight_urls = URLGenerator.generate_all_flight_urls(flight_params)
    for platform, url in flight_urls.items():
        print(f"  {platform}: {url}")

    # URLs directas de aerolíneas
    airlines = ["ryanair", "easyjet", "vueling", "transavia",
                "lufthansa", "airfrance", "aegean", "turkish"]
    print("\n🔍 AEROLÍNEAS DIRECTAS:")
    for airline in airlines:
        url = URLGenerator.airline_direct(
            airline, flight_params["origin"], flight_params["destination"],
            flight_params["date_depart"], flight_params["date_return"],
            flight_params["adults"], flight_params["children"],
            flight_params["infants_lap"]
        )
        if url:
            print(f"  {airline}: {url}")

    # Si hay destino para hotel
    if args.hotel_dest:
        hotel_params = {
            "destination": args.hotel_dest,
            "checkin": args.depart,
            "checkout": getattr(args, "return"),
            "adults": args.adults,
            "children": args.children,
            "children_ages": [1] * args.children if args.children else [],
            "rooms": max(1, (args.adults + args.children) // 3),
            "currency": args.currency,
            "board_type": args.board or None,
            "min_review_score": 8.0,
        }

        print("\n🏨 URLs DE HOTELES:")
        print("-" * 50)
        hotel_urls = URLGenerator.generate_all_hotel_urls(hotel_params)
        for platform, url in hotel_urls.items():
            print(f"  {platform}: {url}")

    # Intentar scraping
    if not args.urls_only:
        print("\n🔄 Intentando extraer precios automáticamente...")
        scraper = TravelScraper(headless=True)
        tracker = PriceTracker()

        try:
            await scraper._init_browser()
            flights, _ = await scraper.search_flights(flight_params)

            if flights:
                tracker.save_flights("quick_search", flights)
                print(f"\n✈️  TOP 5 VUELOS:")
                print("-" * 50)
                for i, f in enumerate(flights[:5], 1):
                    print(f"  {i}. {f.airline:<15} {f.price:>8.2f}€  "
                          f"({f.platform}) {f.stops} escalas")
            else:
                print("\n⚠️  No se pudieron extraer precios. Usa las URLs de arriba.")

        except Exception as e:
            print(f"\n⚠️  Error en scraping: {e}")
            print("   Usa las URLs de arriba para buscar manualmente.")
        finally:
            await scraper._close()


async def cmd_anomaly(config: dict, destination: str = None):
    """Ejecuta detección de anomalías en hoteles."""
    anomaly_cfg = config.get("anomaly_detection", {})
    if not anomaly_cfg.get("enabled", False):
        print("⚠️  Detección de anomalías deshabilitada en config.json")
        print("   Añade 'anomaly_detection.enabled: true' para activarla.")
        return

    db_path = config.get("database", {}).get("path", "travel_prices.db")
    tracker = PriceTracker(db_path=db_path)
    engine = HotelAnomalyEngine(tracker=tracker, config=config)

    if destination:
        # Scan de un destino específico
        # Buscar fechas en las búsquedas existentes o usar defaults
        ref_dates = None
        for search in config.get("searches", []):
            hp = search.get("hotel_params")
            if hp:
                ref_dates = hp
                break

        if not ref_dates:
            print("❌ No hay búsquedas con hotel_params para obtener fechas de referencia.")
            return

        anomalies = await engine.scan_destination(
            destination=destination,
            checkin=ref_dates["checkin"],
            checkout=ref_dates["checkout"],
            currency=ref_dates.get("currency", "EUR"),
            min_review_score=ref_dates.get("min_review_score"),
        )
    else:
        # Scan de todos los destinos configurados
        destinations = engine.get_destinations_from_config()
        if not destinations:
            print("⚠️  No hay destinos configurados para anomalías.")
            print("   Configura 'anomaly_detection.destinations' en config.json")
            return

        max_per_run = anomaly_cfg.get("max_destinations_per_run", 2)
        anomalies = await engine.scan_multiple_destinations(
            destinations, max_per_run=max_per_run
        )

    # Notificar
    if anomalies:
        # Email
        email_cfg = config.get("email", {})
        notifier = EmailNotifier(
            smtp_server=email_cfg.get("smtp_server", "smtp.gmail.com"),
            smtp_port=email_cfg.get("smtp_port", 587),
            sender_email=email_cfg.get("sender_email", ""),
            sender_password=email_cfg.get("sender_password", ""),
            recipient_email=email_cfg.get("recipient_email", ""),
        )
        notifier.notify_anomalies(anomalies)

        # Consola
        ConsoleNotifier.print_anomaly_alerts(anomalies)
    else:
        print("\n✅ No se detectaron anomalías significativas en esta ejecución.")

    print(f"\n📊 Resumen: {len(anomalies)} anomalías detectadas")


def cmd_history(config: dict):
    """Muestra historial de precios."""
    db_path = config.get("database", {}).get("path", "travel_prices.db")
    tracker = PriceTracker(db_path=db_path)

    searches = config.get("searches", [])
    if not searches:
        print("⚠️  No hay búsquedas configuradas.")
        return

    print("\n" + "=" * 60)
    print("📊 HISTORIAL DE PRECIOS")
    print("=" * 60)

    for search in searches:
        name = search.get("name", "Sin nombre")
        fp = search.get("flight_params")

        if fp:
            print(f"\n{'─' * 40}")
            print(f"📌 {name}")
            summary = tracker.get_best_prices_summary(
                fp["origin"], fp["destination"], fp["date_depart"]
            )

            if summary["total_records"] > 0:
                print(f"   Total registros: {summary['total_records']}")
                print(f"   Precio mínimo: {summary['overall_min']}€")
                print(f"   Precio medio: {summary['overall_avg']}€")
                print(f"   Precio máximo: {summary['overall_max']}€")
                print(f"\n   Mejor por plataforma:")
                for p in summary["best_by_platform"]:
                    print(f"     {p['platform']}: {p['price']}€ ({p['airline']})")
            else:
                print("   Sin datos todavía. Ejecuta una búsqueda primero.")

    # Alertas pendientes
    alerts = tracker.get_pending_alerts()
    if alerts:
        print(f"\n⚠️  Alertas no notificadas: {len(alerts)}")
        for a in alerts[:5]:
            print(f"   {a['alert_type']}: {a['route']} - "
                  f"{a['old_price']}€ → {a['new_price']}€ ({a['drop_percent']}%)")


def main():
    parser = argparse.ArgumentParser(
        description="Travel Hunter - Buscador automático de ofertas de viaje",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python main.py urls                     # Ver URLs de búsqueda
  python main.py search                   # Búsqueda única con scraping
  python main.py monitor                  # Monitoreo continuo
  python main.py history                  # Ver historial de precios
  python main.py quick --from SXB --to ATH --depart 2026-08-01 --return 2026-08-15 --adults 4
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Comando a ejecutar")

    # URLs
    subparsers.add_parser("urls", help="Genera URLs de búsqueda")

    # Search
    subparsers.add_parser("search", help="Ejecuta búsqueda única con scraping")

    # Monitor
    subparsers.add_parser("monitor", help="Inicia monitoreo continuo")

    # History
    subparsers.add_parser("history", help="Muestra historial de precios")

    # Anomaly detection
    anomaly_parser = subparsers.add_parser("anomaly", help="Detecta anomalías de precio en hoteles")
    anomaly_parser.add_argument(
        "--destination", "-d",
        help="Destino específico a escanear (ej: 'Costa Amalfitana, Italia'). "
             "Si no se especifica, escanea los destinos configurados."
    )

    # Quick search
    quick_parser = subparsers.add_parser("quick", help="Búsqueda rápida desde CLI")
    quick_parser.add_argument("--from", dest="origin", required=True, help="Aeropuerto origen (código IATA)")
    quick_parser.add_argument("--to", dest="destination", required=True, help="Aeropuerto destino (código IATA)")
    quick_parser.add_argument("--depart", required=True, help="Fecha ida (YYYY-MM-DD)")
    quick_parser.add_argument("--return", required=True, help="Fecha vuelta (YYYY-MM-DD)")
    quick_parser.add_argument("--adults", type=int, default=1, help="Número de adultos")
    quick_parser.add_argument("--children", type=int, default=0, help="Número de niños")
    quick_parser.add_argument("--infants", type=int, default=0, help="Número de bebés")
    quick_parser.add_argument("--currency", default="EUR", help="Moneda (EUR, USD...)")
    quick_parser.add_argument("--hotel-dest", dest="hotel_dest", help="Destino hotel (ej: 'Cancún, México')")
    quick_parser.add_argument("--board", choices=["all_inclusive", "half_board", "breakfast"], help="Tipo pensión")
    quick_parser.add_argument("--urls-only", action="store_true", help="Solo generar URLs, sin scraping")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Ejecutar comando
    if args.command == "quick":
        asyncio.run(cmd_quick(args))
    elif args.command == "urls":
        config = load_config()
        cmd_urls(config)
    elif args.command == "search":
        config = load_config()
        asyncio.run(cmd_search(config))
    elif args.command == "monitor":
        config = load_config()
        asyncio.run(cmd_monitor(config))
    elif args.command == "history":
        config = load_config()
        cmd_history(config)
    elif args.command == "anomaly":
        config = load_config()
        asyncio.run(cmd_anomaly(config, destination=args.destination))


if __name__ == "__main__":
    main()
