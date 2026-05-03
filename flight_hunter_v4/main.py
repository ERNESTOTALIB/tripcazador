"""
✈️ FLIGHT HUNTER V4 — Error Fares & Business at Economy Prices
===============================================================
El buscador más potente para vuelos de error fare y Business class
a precios de economy, saliendo desde cualquier aeropuerto de Europa.

MODOS DE USO:
─────────────────────────────────────────────────────────────────
1. ANYWHERE (el más potente):
   python main.py --mode anywhere --date-from 2026-06-01 --date-to 2026-08-31
   → Busca desde 65+ aeropuertos europeos a TODOS los destinos del mundo.
   → Usa fly_to=anywhere de Kiwi: descubre deals que nunca buscarías.

2. BUSINESS HUNTER:
   python main.py --mode business-hunter --origins tier1 --date-from 2026-06-01 --date-to 2026-07-31
   → Busca Economy + Business simultáneamente y detecta ratio B/E < 2-3x.
   → Encuentra Business class a precio de economy.

3. ERROR HUNTER (destinos volátiles prioritarios):
   python main.py --mode error-hunter --date-from 2026-05-15 --date-to 2026-05-31
   → Se centra en los destinos más volátiles con más historial de error fares.

4. MATRIX (mejor precio en rango de fechas):
   python main.py --mode matrix --dest caribbean --date-from 2026-06-01 --date-to 2026-09-30
   → Matriz de precios: mejor precio disponible en todo el período.

5. CUSTOM (rutas específicas):
   python main.py --mode custom --origins "CDG,FRA,MAD" --dest "NRT,BKK,SIN"
     --date-from 2026-07-01 --date-to 2026-07-31 --cabin business

6. MONITOR (monitorización continua):
   python main.py --mode monitor --interval 3600 --telegram
   → Ejecuta en bucle, alerta por Telegram cuando detecta error fares.

CONFIGURACIÓN:
─────────────────────────────────────────────────────────────────
   export KIWI_API_KEY=tu_key          # https://tequila.kiwi.com (GRATIS)
   export TELEGRAM_BOT_TOKEN=tu_token  # Alertas en móvil (opcional)
   export TELEGRAM_CHAT_ID=tu_chat_id  # Tu chat ID de Telegram (opcional)
"""

import asyncio
import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta
from typing import List

# Añadir directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from db import init_db, save_flights, save_anomalies, start_run, finish_run
from db import get_historical_baselines, get_recent_prices
from kiwi_engine import KiwiEngineV4
from ryanair_engine import RyanairEngine
from rapidapi_engine import RapidAPIEngine
from travelpayouts_engine import TravelpayoutsEngine
from vueling_engine import VuelingEngine
from duffel_engine import DuffelEngine
from serpapi_engine import SerpAPIEngine
from amadeus_engine import AmadeusEngine
from hotellook_engine import HotellookEngine
from airline_links import enrich_flight
from detector import analyze_all, generate_markdown_report
from deals_exporter import run_export
from detector import rank_by_score, rank_by_savings, rank_cheapest_business, rank_best_ratio
from html_report import generate_html_dashboard
from excel_report import generate_excel_report
from notifier import NotificationManager


# ══════════════════════════════════════════
# UTILIDADES DE ARGUMENTOS
# ══════════════════════════════════════════

def parse_origins(args) -> List[str]:
    if args.origins == "tier1":
        return config.EUROPEAN_AIRPORTS_TIER1
    elif args.origins == "tier2":
        return config.EUROPEAN_AIRPORTS_TIER2
    elif args.origins == "all":
        return config.EUROPEAN_AIRPORTS_ALL
    elif args.origins == "transatlantic":
        return config.EUROPEAN_BEST_TRANSATLANTIC
    elif args.origins == "asia":
        return config.EUROPEAN_BEST_ASIA
    else:
        # Códigos custom separados por coma
        return [o.strip().upper() for o in args.origins.split(",") if o.strip()]


def parse_destinations(args) -> List[str]:
    preset_map = {
        "caribbean":    config.DEST_CARIBBEAN,
        "mexico":       config.DEST_MEXICO_CENTROAMERICA,
        "maldives":     config.DEST_MALDIVAS,
        "southeast-asia": config.DEST_SUDESTE_ASIATICO,
        "japan-korea":  config.DEST_JAPON_COREA,
        "north-america": config.DEST_NORTEAMERICA,
        "south-america": config.DEST_SUDAMERICA,
        "middle-east":  config.DEST_ORIENTE_MEDIO,
        "africa":       config.DEST_AFRICA,
        "oceania":      config.DEST_OCEANIA,
        "india":        config.DEST_INDIA_SUBCONTINENTE,
        "volatile":     config.DEST_VOLATILES_PRIORITARIOS,
        "all":          config.DEST_ALL_LONG_HAUL,
        # Presets temáticos abr-2026g — cobertura ampliada:
        "mar-rojo":     getattr(config, "DEST_MAR_ROJO", []),
        "marruecos":    getattr(config, "DEST_MARRUECOS", []),
        "weekend":      getattr(config, "DEST_WEEKEND_EUROPE", []),
        "family-beach": getattr(config, "DEST_FAMILY_BEACH", []),
        # abr-2026i — largo haul barato
        "caribe":       getattr(config, "DEST_CARIBE", []),
        "asia-sudeste": getattr(config, "DEST_ASIA_SUDESTE", []),
        "anywhere":     None,  # Señal especial para fly_to=anywhere
    }
    if hasattr(args, "dest") and args.dest:
        if args.dest in preset_map:
            return preset_map[args.dest] or []
        else:
            return [d.strip().upper() for d in args.dest.split(",") if d.strip()]
    return []


def get_cabin_code(name: str) -> int:
    return {
        "economy": config.CABIN_ECONOMY,
        "premium": config.CABIN_PREMIUM_ECONOMY,
        "business": config.CABIN_BUSINESS,
        "first": config.CABIN_FIRST,
    }.get(name.lower(), config.CABIN_ECONOMY)


def print_header(mode: str, origins: List[str], date_from: str, date_to: str, cabin: str = ""):
    print("\n" + "═" * 70)
    print("✈️  FLIGHT HUNTER V4 — Error Fares & Business at Economy Prices")
    print("═" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"🔍 Modo: {mode.upper()}")
    print(f"🛫 Orígenes: {len(origins)} aeropuertos ({', '.join(origins[:4])}{'...' if len(origins) > 4 else ''})")
    print(f"📆 Rango: {date_from} → {date_to}")
    if cabin:
        print(f"💺 Cabina: {cabin}")
    print("═" * 70)


# ══════════════════════════════════════════
# MODOS DE BÚSQUEDA
# ══════════════════════════════════════════

async def mode_anywhere(args) -> List[dict]:
    """
    Modo ANYWHERE: busca desde todos los orígenes europeos
    a cualquier destino del mundo. Usa fly_to=anywhere de Kiwi.
    """
    origins = parse_origins(args)
    cabin = get_cabin_code(getattr(args, "cabin", "economy"))
    cabin_name = config.CABIN_NAMES[cabin]
    nights_min = getattr(args, "nights_min", 5)
    nights_max = getattr(args, "nights_max", 21)

    print_header("anywhere", origins, args.date_from, args.date_to, cabin_name)

    engine = KiwiEngineV4()
    if not engine.available:
        print("❌ Kiwi API key requerida. Ver README para instrucciones.")
        return []

    flights = await engine.search_anywhere(
        origins=origins,
        date_from=args.date_from,
        date_to=args.date_to,
        cabin=cabin,
        nights_min=nights_min,
        nights_max=nights_max,
    )

    return flights


async def mode_business_hunter(args) -> dict:
    """
    Modo BUSINESS HUNTER: busca Economy + Business simultáneamente
    y detecta cuando Business < 2-3x Economy (anomalía/error fare).
    """
    origins = parse_origins(args)
    dest_preset = getattr(args, "dest", None)
    destinations = parse_destinations(args) if dest_preset and dest_preset != "anywhere" else None
    nights_min = getattr(args, "nights_min", 5)
    nights_max = getattr(args, "nights_max", 21)

    print_header("business-hunter", origins, args.date_from, args.date_to, "Economy + Business")

    engine = KiwiEngineV4()
    if not engine.available:
        print("❌ Kiwi API key requerida.")
        return {}

    result = await engine.search_business_hunter(
        origins=origins,
        date_from=args.date_from,
        date_to=args.date_to,
        nights_min=nights_min,
        nights_max=nights_max,
        target_destinations=destinations,
    )

    return result


async def mode_error_hunter(args) -> List[dict]:
    """
    Modo ERROR HUNTER: se centra en los destinos más volátiles
    (mayor historial de error fares). Búsqueda de rango de fechas.
    """
    origins = parse_origins(args)
    destinations = config.DEST_VOLATILES_PRIORITARIOS
    cabin = get_cabin_code(getattr(args, "cabin", "economy"))
    cabin_name = config.CABIN_NAMES[cabin]
    nights_min = getattr(args, "nights_min", 5)
    nights_max = getattr(args, "nights_max", 21)

    print_header("error-hunter", origins, args.date_from, args.date_to, cabin_name)
    print(f"🎯 Destinos volátiles: {', '.join(destinations)}")

    engine = KiwiEngineV4()
    if not engine.available:
        print("❌ Kiwi API key requerida.")
        return []

    flights = await engine.search_routes_range(
        origins=origins,
        destinations=destinations,
        date_from=args.date_from,
        date_to=args.date_to,
        cabin=cabin,
        nights_min=nights_min,
        nights_max=nights_max,
    )

    return flights


async def mode_matrix(args) -> List[dict]:
    """
    Modo MATRIX: matriz de precios Economy + Business para un
    destino específico en todo el rango de fechas.
    Muestra el mejor precio por cada semana.
    """
    origins = parse_origins(args)
    destinations = parse_destinations(args)
    if not destinations:
        print("❌ Especifica destinos con --dest (ej: --dest caribbean)")
        return []

    print_header("matrix", origins, args.date_from, args.date_to, "Economy + Business")
    print(f"🌍 Destinos: {', '.join(destinations[:8])}{'...' if len(destinations) > 8 else ''}")

    engine = KiwiEngineV4()
    if not engine.available:
        print("❌ Kiwi API key requerida.")
        return []

    # Buscar ambas cabinas
    eco_task = engine.search_routes_range(
        origins, destinations, args.date_from, args.date_to,
        cabin=config.CABIN_ECONOMY,
    )
    biz_task = engine.search_routes_range(
        origins, destinations, args.date_from, args.date_to,
        cabin=config.CABIN_BUSINESS,
    )

    eco_flights, biz_flights = await asyncio.gather(eco_task, biz_task)
    return eco_flights + biz_flights


async def mode_custom(args) -> List[dict]:
    """
    Modo CUSTOM: rutas y cabina específicas.
    """
    origins = parse_origins(args)
    destinations = parse_destinations(args)
    if not destinations:
        print("❌ Especifica destinos con --dest")
        return []

    cabin = get_cabin_code(getattr(args, "cabin", "economy"))
    cabin_name = config.CABIN_NAMES[cabin]
    nights_min = getattr(args, "nights_min", 5)
    nights_max = getattr(args, "nights_max", 21)

    print_header("custom", origins, args.date_from, args.date_to, cabin_name)

    engine = KiwiEngineV4()
    if not engine.available:
        print("❌ Kiwi API key requerida.")
        return []

    flights = await engine.search_routes_range(
        origins, destinations, args.date_from, args.date_to,
        cabin=cabin, nights_min=nights_min, nights_max=nights_max,
    )

    return flights


# ══════════════════════════════════════════
# PIPELINE PRINCIPAL
# ══════════════════════════════════════════

async def run_pipeline(args):
    """Pipeline completo: búsqueda → detección → reportes → notificaciones."""

    mode = args.mode
    init_db()
    run_id = start_run(mode, parse_origins(args))
    notifier = NotificationManager()

    # ── FASE 1: BÚSQUEDA ────────────────────────────────
    print(f"\n{'━'*70}")
    print(f"🚀 FASE 1: Búsqueda de vuelos")
    print(f"{'━'*70}")

    all_flights = []
    hotel_deals: List[dict] = []

    if mode == "ryanair":
        engine = RyanairEngine()
        origins = parse_origins(args)
        print_header("ryanair", origins, args.date_from, args.date_to, "economy (todos los destinos Ryanair)")
        all_flights = await engine.search_error_hunter(
            origins=origins,
            date_from=args.date_from,
            date_to=args.date_to,
            min_nights=getattr(args, "nights_min", 3),
            max_nights=getattr(args, "nights_max", 14),
        )

    elif mode == "rapidapi":
        engine = RapidAPIEngine()
        origins = parse_origins(args)
        dest_list = parse_destinations(args)
        print_header("rapidapi", origins, args.date_from, args.date_to, "multi-aerolínea")
        if dest_list:
            all_flights = await engine.search_multi_routes(
                origins=origins,
                destinations=dest_list,
                date_from=args.date_from,
                date_to=args.date_to,
            )
        else:
            all_flights = await engine.search_anywhere_affordable(
                origins=origins,
                date_from=args.date_from,
                date_to=args.date_to,
            )

    elif mode == "travelpayouts":
        engine = TravelpayoutsEngine()
        origins = parse_origins(args)
        dest_list = parse_destinations(args)
        print_header("travelpayouts", origins, args.date_from, args.date_to, "economy (750+ aerolíneas)")
        if dest_list and dest_list != []:
            # Si se especificaron destinos concretos, búsqueda dirigida
            all_flights = await engine.search_long_haul_multi(
                origins=origins,
                destinations=dest_list,
                date_from=args.date_from,
                date_to=args.date_to,
            )
        else:
            # Modo completo: anywhere + long-haul
            all_flights = await engine.search_error_hunter_full(
                origins=origins,
                date_from=args.date_from,
                date_to=args.date_to,
                include_long_haul=True,
            )

    elif mode == "vueling":
        engine = VuelingEngine()
        origins = parse_origins(args)
        dest_list = parse_destinations(args) or None
        print_header("vueling", origins, args.date_from, args.date_to, "economy (Vueling directo)")
        all_flights = await engine.search_multi_origins(
            origins=origins,
            date_from=args.date_from,
            date_to=args.date_to,
            destinations=dest_list,
        )

    elif mode == "all":
        # Modo ALL: Ryanair (tiempo real) + Travelpayouts (cubre VY, U2, W6, IB, AF, LH, TK, EK...)
        # Travelpayouts ya agrega 750+ aerolíneas → no necesitamos Vueling por separado
        origins = parse_origins(args)
        include_business = getattr(args, "include_business", False)
        cabin_label = "economy + BUSINESS 👑" if include_business else "economy"
        print_header(f"all (Ryanair + Travelpayouts — 750+ aerolíneas{' + Business' if include_business else ''})",
                     origins, args.date_from, args.date_to, cabin_label)
        print(f"   🚀 Ejecutando {3 if include_business else 2} motores en paralelo...")

        ryanair_task = RyanairEngine().search_error_hunter(
            origins=origins,
            date_from=args.date_from,
            date_to=args.date_to,
            min_nights=getattr(args, "nights_min", 3),
            max_nights=getattr(args, "nights_max", 14),
        )
        tp_task = TravelpayoutsEngine().search_error_hunter_full(
            origins=origins,
            date_from=args.date_from,
            date_to=args.date_to,
            include_long_haul=True,
        )
        # RRR1: Vueling re-añadido al UNION. Aunque Travelpayouts agrega Vueling,
        # el deeplink de Vueling directo (book2.vueling.com) es preferible al
        # partner link de Travelpayouts. Vueling cubre ~10% short-haul EU+ES.
        # SSS8: cap a 8 minutos máximo. Vueling fan-out es 14 hubs × 41 dests ×
        # 3 meses = 1722 requests con sem=4 → puede tardar 60-140 min y matar
        # el workflow GH (timeout 25 min). Si Vueling tarda demasiado lo
        # descartamos y seguimos con Ryanair + Travelpayouts.
        async def _vueling_with_timeout():
            try:
                return await asyncio.wait_for(
                    VuelingEngine().search_multi_origins(
                        origins=origins,
                        date_from=args.date_from,
                        date_to=args.date_to,
                    ),
                    timeout=480,  # 8 min máx
                )
            except asyncio.TimeoutError:
                print("   ⏱️  Vueling: timeout 8 min — descartado, seguimos sin él")
                return []
            except Exception as e:
                print(f"   ⚠️  Vueling: error {type(e).__name__}: {e}")
                return []
        vueling_task = _vueling_with_timeout()

        # Duffel: motor real-time GDS-grade (300+ aerolíneas).
        # SSS27: con throttle 7s/req × 48 reqs ≈ 5.5 min. Subimos timeout
        # a 12 min para que termine sin matarlo. Sigue corriendo en paralelo
        # con Ryanair/TP/Vueling, así que no bloquea el resto.
        duffel = DuffelEngine()
        async def _duffel_with_timeout():
            if not duffel.available:
                return []
            try:
                return await asyncio.wait_for(
                    duffel.search_long_haul(
                        origins=origins,
                        date_from=args.date_from,
                        date_to=args.date_to,
                    ),
                    timeout=720,  # 12 min máx (SSS27: throttle 7s × ~48 reqs serializados)
                )
            except asyncio.TimeoutError:
                print("   ⏱️  Duffel: timeout 12 min — descartado, seguimos sin él")
                return []
            except Exception as e:
                print(f"   ⚠️  Duffel: error {type(e).__name__}: {e}")
                return []
        duffel_task = _duffel_with_timeout()

        amadeus = AmadeusEngine()
        tasks_parallel = [ryanair_task, tp_task, vueling_task, duffel_task]
        if amadeus.available:
            amadeus_task = amadeus.search_gds_deals(
                origins=origins,
                date_from=args.date_from,
                date_to=args.date_to,
            )
            tasks_parallel.append(amadeus_task)
        if include_business:
            biz_task = SerpAPIEngine().search_business_routes(
                origins=origins,
                date_from=args.date_from,
                date_to=args.date_to,
            )
            tasks_parallel.append(biz_task)

        parallel_results = await asyncio.gather(*tasks_parallel, return_exceptions=True)
        ryanair_res  = parallel_results[0]
        tp_res       = parallel_results[1]
        vueling_res  = parallel_results[2]
        duffel_res   = parallel_results[3]
        idx = 4
        amadeus_res  = parallel_results[idx] if amadeus.available and len(parallel_results) > idx else []
        if amadeus.available:
            idx += 1
        biz_res      = parallel_results[idx] if include_business and len(parallel_results) > idx else []

        combined = []
        for res in [ryanair_res, tp_res, vueling_res, duffel_res, amadeus_res, biz_res]:
            if isinstance(res, list):
                combined.extend(res)

        # Dedup final: más barato por (origin, dest, date_out, cabin_code)
        seen = {}
        for f in combined:
            key = (f["origin"], f["destination"], f["date_out"], f.get("cabin_code", 0))
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f
        all_flights = list(seen.values())
        biz_count = sum(1 for f in all_flights if f.get("cabin_code") in (2, 3, 4))
        print(f"\n   🔀 Total combinado: {len(all_flights)} vuelos únicos"
              + (f" (incl. {biz_count} premium/business)" if biz_count else ""))

        # Enriquecer: URL de reserva correcta para cada aerolínea
        all_flights = [enrich_flight(f) for f in all_flights]

        # ── Hotellook: cazador de hoteles via Travelpayouts ─────────────
        # Mismo TP_MARKER que vuelos → activa comisiones afiliado (4-7%).
        # Sólo se ejecuta en modo "all" para no enlentecer modos especializados.
        print(f"\n   🏨 Buscando hoteles top destinations...")
        hotellook = HotellookEngine()
        if hotellook.available:
            try:
                hotel_deals = await asyncio.wait_for(
                    hotellook.search_top_destinations(
                        destinations=[
                            "Madrid", "Barcelona", "Paris", "Roma", "Lisboa",
                            "Berlin", "Amsterdam", "Praga", "Viena", "Atenas",
                            "Estambul", "Marrakech", "Tokio", "Bangkok",
                            "Nueva York", "Bali",
                        ],
                        date_from=args.date_from,
                        date_to=args.date_to,
                    ),
                    timeout=300,
                )
                print(f"   🏨 Hotellook: {len(hotel_deals)} hoteles")
            except asyncio.TimeoutError:
                print(f"   ⏱️  Hotellook: timeout 5 min — descartado")
                hotel_deals = []
            except Exception as e:
                print(f"   ⚠️  Hotellook: {type(e).__name__}: {e}")
                hotel_deals = []
        else:
            print(f"   ℹ️  Hotellook: TP_MARKER no configurado, hoteles omitidos")

    elif mode == "amadeus":
        # Modo AMADEUS: GDS completo — Eurowings, Condor, TUIfly, LOT, airBaltic...
        origins = parse_origins(args)
        dest_list = parse_destinations(args) if getattr(args, "dest", "anywhere") != "anywhere" else None
        cabin = getattr(args, "cabin", "economy")
        include_business_amadeus = cabin in ("business", "first")

        print_header("AMADEUS GDS (Eurowings, Condor, TUIfly, LOT, airBaltic + todas GDS)", origins, args.date_from, args.date_to, cabin)

        amadeus = AmadeusEngine()
        if not amadeus.available:
            print("\n❌ Amadeus no configurado. Para activarlo:")
            print("   1. Registro gratuito: https://developers.amadeus.com/register")
            print("   2. Crear app → obtener API Key + Secret")
            print("   3. Editar config.py:")
            print("      AMADEUS_API_KEY    = 'tu_key'")
            print("      AMADEUS_API_SECRET = 'tu_secret'")
            print("   Límite gratuito: 2000 llamadas/mes\n")
            return

        if include_business_amadeus:
            eco_flights, biz_flights = await amadeus.search_business_gds(
                origins=origins,
                date_from=args.date_from,
                date_to=args.date_to,
                destinations=dest_list,
            )
            all_flights = eco_flights + biz_flights
        else:
            all_flights = await amadeus.search_gds_deals(
                origins=origins,
                date_from=args.date_from,
                date_to=args.date_to,
                destinations=dest_list,
                cabin=cabin,
            )
        all_flights = [enrich_flight(f) for f in all_flights]

    elif mode == "business":
        # Modo BUSINESS: solo Business/Premium Economy vía SerpAPI (Google Flights)
        origins = parse_origins(args)
        dest_list = parse_destinations(args) if getattr(args, "dest", "anywhere") != "anywhere" else None
        include_first = getattr(args, "cabin", "business") == "first"
        include_prem  = True  # Siempre incluir Premium Economy

        print_header("BUSINESS HUNTER (Google Flights vía SerpAPI)", origins, args.date_from, args.date_to, "Business + Premium Economy")
        print(f"   👑 Buscando Business class en rutas long-haul desde {len(origins)} aeropuertos")
        print(f"   💡 Comparando con Economy para detectar ratios B/E anómalos")

        serpapi = SerpAPIEngine()
        if not serpapi.available:
            print("❌ SERPAPI_KEY no configurada. Ver config.py")
            return

        all_flights = await serpapi.search_business_routes(
            origins=origins,
            date_from=args.date_from,
            date_to=args.date_to,
            destinations=dest_list,
            include_premium_economy=include_prem,
            include_first=include_first,
        )
        all_flights = [enrich_flight(f) for f in all_flights]

    elif mode == "anywhere":
        flights = await mode_anywhere(args)
        all_flights = flights

    elif mode == "business-hunter":
        result = await mode_business_hunter(args)
        eco = result.get("economy", [])
        biz = result.get("business", [])
        all_flights = eco + biz

        # Los anomalies del business hunter ya incluyen ratio
        pre_anomalies = result.get("anomalies", [])
        if pre_anomalies:
            print(f"\n   🎯 Business Hunter: {len(pre_anomalies)} anomalías B/E pre-detectadas")
            for a in pre_anomalies[:3]:
                print(f"      {a['origin']}→{a['destination']} | B:{a['price_eur']:.0f}€ E:{a.get('bec_eco_price',0):.0f}€ | Ratio:{a.get('bec_ratio',0):.1f}x | {a.get('bec_class','?')}")

    elif mode == "error-hunter":
        flights = await mode_error_hunter(args)
        all_flights = flights

    elif mode == "matrix":
        flights = await mode_matrix(args)
        all_flights = flights

    elif mode == "custom":
        flights = await mode_custom(args)
        all_flights = flights

    else:
        print(f"❌ Modo desconocido: {mode}")
        return

    if not all_flights:
        print("\n⚠️  Sin vuelos encontrados. Verifica la API key y parámetros.")
        return

    print(f"\n   ✅ Total vuelos encontrados: {len(all_flights)}")

    # ── FASE 2: BASE DE DATOS ────────────────────────────
    print(f"\n{'━'*70}")
    print(f"💾 FASE 2: Guardando en base de datos")
    print(f"{'━'*70}")
    saved = save_flights(all_flights, run_id=run_id)
    print(f"   Guardados: {saved} vuelos únicos")

    # Obtener datos históricos para detección
    historical = get_historical_baselines(all_flights, days=30)
    recent = get_recent_prices(all_flights, hours=24)
    print(f"   Histórico: {len(historical)} rutas con datos previos")
    print(f"   Precios recientes: {len(recent)} rutas en últimas 24h")

    # ── FASE 3: DETECCIÓN ────────────────────────────────
    print(f"\n{'━'*70}")
    print(f"🧠 FASE 3: Detección de anomalías")
    print(f"{'━'*70}")

    min_score = getattr(args, "min_score", 15)  # OFERTA y superior
    analyzed = analyze_all(
        all_flights,
        historical_data=historical,
        recent_prices=recent,
        min_score=min_score,
    )

    save_anomalies(analyzed, run_id=run_id)

    # ── FASE 4: RANKINGS ─────────────────────────────────
    top_score   = rank_by_score(analyzed, top_n=50)
    top_savings = rank_by_savings(analyzed, top_n=20)
    top_biz     = rank_cheapest_business(analyzed, top_n=20)
    top_ratio   = rank_best_ratio(analyzed, top_n=10)

    print(f"\n   🏆 Top por score: {len(top_score)}")
    print(f"   💰 Top por ahorro: {len(top_savings)}")
    print(f"   👑 Top Business barato: {len(top_biz)}")
    print(f"   📊 Mejor ratio B/E: {len(top_ratio)}")

    # ── FASE 5: REPORTES ─────────────────────────────────
    print(f"\n{'━'*70}")
    print(f"📋 FASE 5: Generando reportes")
    print(f"{'━'*70}")

    search_params = {
        "mode": mode,
        "origins": parse_origins(args),
        "date_from": args.date_from,
        "date_to": args.date_to,
        "cabin": getattr(args, "cabin", "economy"),
    }

    report_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")

    # Reporte Markdown
    md_report = generate_markdown_report(analyzed, search_params)
    md_path = os.path.join(report_dir, f"FLIGHT_HUNTER_V4_{mode.upper()}_{timestamp}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_report)
    print(f"   ✅ Markdown: {os.path.basename(md_path)}")

    # Dashboard HTML (la gran mejora respecto a V2)
    html_path = os.path.join(report_dir, f"FLIGHT_HUNTER_V4_{mode.upper()}_{timestamp}.html")
    generate_html_dashboard(
        analyzed=analyzed,
        search_params=search_params,
        all_flights=all_flights,
        output_path=html_path,
    )
    print(f"   ✅ Dashboard HTML: {os.path.basename(html_path)}")

    # Excel Report (4 hojas: Summary, All Deals, Business Hunter, By Airline)
    xlsx_path = os.path.join(report_dir, f"FLIGHT_HUNTER_V4_{mode.upper()}_{timestamp}.xlsx")
    try:
        generate_excel_report(
            analyzed=analyzed,
            search_params=search_params,
            all_flights=all_flights,
            output_path=xlsx_path,
        )
        print(f"   ✅ Excel Report: {os.path.basename(xlsx_path)}")
    except ImportError:
        print(f"   ⚠️  Excel desactivado (pip install openpyxl --break-system-packages)")
    except Exception as e:
        print(f"   ⚠️  Error generando Excel: {e}")

    # JSON raw
    json_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        f"results_{mode}_{timestamp}.json"
    )
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "run_id": run_id,
            "search_params": search_params,
            "total_flights": len(all_flights),
            "total_anomalies": len(analyzed),
            "top_deals": analyzed[:50],
        }, f, ensure_ascii=False, default=str, indent=2)

    # ── FASE 5.5: EXPORT deals.json UNIFICADO ────────────
    print(f"\n{'━'*70}")
    print(f"📦 FASE 5.5: Exportando deals.json unificado")
    print(f"{'━'*70}")
    try:
        export_send_alerts = getattr(args, "telegram", False) or bool(config.TELEGRAM_BOT_TOKEN)
        run_export(
            analyzed_flights=analyzed,
            hotel_deals=hotel_deals,
            output_dir=report_dir,
            send_alerts=export_send_alerts,
        )
    except Exception as e:
        print(f"   ⚠️  Error en export: {e}")

    # ── FASE 6: NOTIFICACIONES ───────────────────────────
    print(f"\n{'━'*70}")
    print(f"📱 FASE 6: Notificaciones")
    print(f"{'━'*70}")

    telegram_enabled = getattr(args, "telegram", False) or bool(config.TELEGRAM_BOT_TOKEN)
    if telegram_enabled:
        notif_stats = await notifier.notify_all(
            analyzed, search_params,
            telegram_classes=["CRÍTICO", "ERROR"],
            max_telegram_alerts=10,
        )
    else:
        notif_stats = {"telegram": 0, "logged": len(analyzed)}
        notifier.file_logger.log_deals(analyzed, search_params)

    # ── RESUMEN FINAL ─────────────────────────────────────
    finish_run(run_id, len(all_flights), len(analyzed))

    print(f"\n{'═'*70}")
    print(f"✅ BÚSQUEDA COMPLETADA")
    print(f"{'═'*70}")
    print(f"   Vuelos scrapeados: {len(all_flights):,}")
    print(f"   Anomalías detectadas: {len(analyzed):,}")

    criticos = [a for a in analyzed if a.get("classification") == "CRÍTICO"]
    errores  = [a for a in analyzed if a.get("classification") == "ERROR"]
    anomalias = [a for a in analyzed if a.get("classification") == "ANOMALÍA"]

    if criticos:
        print(f"\n   🚨 ERROR FARES CRÍTICOS ({len(criticos)}) — ACTUAR RÁPIDO:")
        for deal in criticos[:5]:
            print(f"      {deal['origin']}→{deal['destination']} | {deal.get('cabin','?')} | {deal['price_eur']:.0f}€ | {deal.get('airline','?')} | Score:{deal.get('final_score',0):.0f}")
            if deal.get("booking_url"):
                print(f"      🔗 {deal['booking_url']}")

    if errores and not criticos:
        print(f"\n   ❌ POSIBLES ERROR FARES ({len(errores)}):")
        for deal in errores[:5]:
            print(f"      {deal['origin']}→{deal['destination']} | {deal.get('cabin','?')} | {deal['price_eur']:.0f}€ | Score:{deal.get('final_score',0):.0f}")

    if top_ratio:
        print(f"\n   📊 MEJORES RATIOS BUSINESS/ECONOMY:")
        for deal in top_ratio[:3]:
            print(f"      {deal['origin']}→{deal['destination']} | B:{deal['price_eur']:.0f}€ E:{deal.get('t4_eco_price',0):.0f}€ | Ratio:{deal.get('t4_ratio',0):.1f}x")

    print(f"\n   📁 Archivos generados:")
    print(f"      📄 Markdown: {os.path.basename(md_path)}")
    print(f"      🌐 HTML Dashboard: {os.path.basename(html_path)}")
    if os.path.exists(xlsx_path):
        print(f"      📊 Excel Report: {os.path.basename(xlsx_path)}")
    if telegram_enabled:
        print(f"      📱 Telegram: {notif_stats.get('telegram', 0)} alertas enviadas")
    print()

    return analyzed


# ══════════════════════════════════════════
# MODO MONITOR (bucle continuo)
# ══════════════════════════════════════════

async def run_monitor(args):
    """Monitorización continua con alertas Telegram."""
    interval = getattr(args, "interval", 3600)
    print(f"\n🔄 MODO MONITOR — ejecutando cada {interval//60} minutos")
    print(f"   Ctrl+C para detener\n")

    run_count = 0
    while True:
        run_count += 1
        print(f"\n{'═'*70}")
        print(f"🔄 Ejecución #{run_count} — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        try:
            await run_pipeline(args)
        except Exception as e:
            print(f"❌ Error en ejecución #{run_count}: {e}")

        print(f"\n⏰ Próxima búsqueda en {interval//60} minutos...")
        await asyncio.sleep(interval)


# ══════════════════════════════════════════
# CLI
# ══════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="✈️ Flight Hunter V4 — Error Fares & Business at Economy Prices",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EJEMPLOS:
  # Cualquier destino desde Europa (más potente):
  python main.py --mode anywhere --date-from 2026-06-01 --date-to 2026-08-31

  # Business Hunter desde hubs principales:
  python main.py --mode business-hunter --origins tier1 --date-from 2026-06-01 --date-to 2026-07-31

  # Error fares en destinos volátiles:
  python main.py --mode error-hunter --origins all --date-from 2026-05-15 --date-to 2026-06-30

  # Caribbean en Economy desde España:
  python main.py --mode matrix --dest caribbean --origins "MAD,BCN,VLC,AGP" --date-from 2026-07-01 --date-to 2026-09-30

  # Business a Tokyo desde cualquier aeropuerto europeo:
  python main.py --mode custom --dest "NRT,HND" --origins tier1 --date-from 2026-06-01 --date-to 2026-09-30 --cabin business

  # Monitor con Telegram (ejecuta indefinidamente):
  python main.py --mode monitor --interval 7200 --telegram
        """
    )

    parser.add_argument(
        "--mode", type=str, default="anywhere",
        choices=["all", "ryanair", "travelpayouts", "vueling", "rapidapi", "amadeus",
                 "anywhere", "business", "business-hunter", "error-hunter", "matrix", "custom", "monitor"],
        help="Modo de búsqueda (default: anywhere)"
    )

    parser.add_argument(
        "--include-business", action="store_true",
        help="En modo 'all', incluir también búsqueda de Business/Premium (usa SerpAPI)"
    )

    parser.add_argument(
        "--date-from", type=str, required=True,
        help="Fecha inicio rango YYYY-MM-DD"
    )
    parser.add_argument(
        "--date-to", type=str, required=True,
        help="Fecha fin rango YYYY-MM-DD"
    )

    parser.add_argument(
        "--origins", type=str, default="tier1",
        help="Orígenes: tier1, tier2, all, transatlantic, asia, o códigos separados por coma (ej: CDG,FRA,MAD)"
    )

    parser.add_argument(
        "--dest", type=str, default="anywhere",
        help="Destinos: anywhere (default), caribbean, mexico, maldives, southeast-asia, japan-korea, "
             "north-america, south-america, middle-east, africa, oceania, india, volatile, all, "
             "o códigos separados por coma (ej: NRT,HND,ICN)"
    )

    parser.add_argument(
        "--cabin", type=str, default="economy",
        choices=["economy", "premium", "business", "first"],
        help="Clase de cabina (default: economy)"
    )

    parser.add_argument(
        "--nights-min", type=int, default=5,
        help="Mínimo de noches en destino (default: 5)"
    )
    parser.add_argument(
        "--nights-max", type=int, default=21,
        help="Máximo de noches en destino (default: 21)"
    )

    parser.add_argument(
        "--min-score", type=float, default=15,
        help="Score mínimo para incluir en resultados (default: 15=OFERTA)"
    )

    parser.add_argument(
        "--telegram", action="store_true",
        help="Activar alertas Telegram para deals CRÍTICOS y ERRORES"
    )

    parser.add_argument(
        "--interval", type=int, default=3600,
        help="Intervalo en segundos para modo monitor (default: 3600 = 1 hora)"
    )

    parser.add_argument(
        "--quiet", action="store_true",
        help="Modo silencioso (menos output en consola)"
    )

    args = parser.parse_args()

    # Convertir nombres de arg (guiones → guiones bajos para Python)
    args.date_from = args.date_from
    args.date_to = args.date_to

    # Ejecutar
    if args.mode == "monitor":
        asyncio.run(run_monitor(args))
    else:
        asyncio.run(run_pipeline(args))


if __name__ == "__main__":
    main()
