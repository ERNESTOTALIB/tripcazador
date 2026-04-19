"""
Hotel Deal Hunter — Price Error Detector v4
=============================================
Finds REAL pricing errors on Booking.com using 9 detection techniques.

v4 improvements:
- Multi-page scraping (75+ hotels per destination)
- Error-prone destination presets (Italy, Greece, Turkey, Mexico...)
- 8-10 comparison weeks + high season targeting
- SQLite price history for flash detection
- User-Agent rotation
- Room type scraping within hotel pages
- Cross-platform framework

Usage:
    # Quick volatile markets search
    python main.py --dest volatile-quick --checkin 2027-08-01 --nights 14 --weeks 6 --stars 4

    # Full error-prone search with all techniques
    python main.py --dest error-prone --checkin 2027-08-01 --nights 7 --weeks 8 --stars 4 --all-techniques

    # High season search (Christmas)
    python main.py --dest volatile-quick --high-season christmas --nights 7 --stars 4

    # Multi-page (3 pages = ~75 hotels per destination)
    python main.py --dest custom --places "Santorini" --pages 3 --weeks 6
"""

import asyncio
import argparse
import json
import sys
from datetime import datetime, timedelta

sys.path.insert(0, ".")

from config import (
    ACTIVE_DESTINATIONS,
    DESTINATIONS_ITALY_BEACH, DESTINATIONS_SPAIN_BEACH,
    DESTINATIONS_GREECE, DESTINATIONS_CITIES,
    DESTINATIONS_ERROR_PRONE, DESTINATIONS_VOLATILE_QUICK,
    DESTINATIONS_VOLATILE_ITALY, DESTINATIONS_VOLATILE_GREECE,
    DESTINATIONS_VOLATILE_TURKEY, DESTINATIONS_VOLATILE_THAILAND,
    DESTINATIONS_VOLATILE_BALI, DESTINATIONS_VOLATILE_PORTUGAL,
    DESTINATIONS_VOLATILE_MEXICO, DESTINATIONS_VOLATILE_MALDIVES,
    DESTINATIONS_VOLATILE_SPAIN, DESTINATIONS_ITALY_REGIONS,
    DESTINATIONS_ALBANIA, DESTINATIONS_MONTENEGRO, DESTINATIONS_CROATIA,
    DESTINATIONS_GREECE_EXTENDED, DESTINATIONS_ITALY_BEACH_EXTENDED,
    DESTINATIONS_MED_SUMMER,
    DEFAULT_CHECKIN, DEFAULT_CHECKOUT, MIN_STARS,
    WEEKS_TO_COMPARE, MIN_HOTEL_SCORE, PAGES_TO_SCRAPE,
    HIGH_SEASON_DATES,
)
from scraper import (
    scrape_all_destinations, scrape_multi_date, scrape_full_comparison,
    scrape_duration_comparison, scrape_currency_comparison,
    scrape_checkin_day_comparison, scrape_rooms_comparison,
    scrape_mobile_comparison, scrape_room_types_for_hotels,
    scrape_adult_comparison, scrape_flexible_dates, verify_price_google,
)
from detector import analyze_all, rank_by_value, rank_cheapest
from db import init_db, save_hotels, start_run, finish_run, detect_flash_drops, get_stats


def get_destinations(dest_preset, custom_places=None):
    presets = {
        "italy":            DESTINATIONS_ITALY_BEACH,
        "spain":            DESTINATIONS_SPAIN_BEACH,
        "greece":           DESTINATIONS_GREECE,
        "cities":           DESTINATIONS_CITIES,
        "all":              {**DESTINATIONS_ITALY_BEACH, **DESTINATIONS_SPAIN_BEACH,
                             **DESTINATIONS_GREECE, **DESTINATIONS_CITIES},
        # New volatile/error-prone presets
        "error-prone":      DESTINATIONS_ERROR_PRONE,
        "volatile-quick":   DESTINATIONS_VOLATILE_QUICK,
        "volatile-italy":   DESTINATIONS_VOLATILE_ITALY,
        "volatile-greece":  DESTINATIONS_VOLATILE_GREECE,
        "volatile-turkey":  DESTINATIONS_VOLATILE_TURKEY,
        "volatile-thailand": DESTINATIONS_VOLATILE_THAILAND,
        "volatile-bali":    DESTINATIONS_VOLATILE_BALI,
        "volatile-portugal": DESTINATIONS_VOLATILE_PORTUGAL,
        "volatile-mexico":  DESTINATIONS_VOLATILE_MEXICO,
        "volatile-maldives": DESTINATIONS_VOLATILE_MALDIVES,
        "volatile-spain":   DESTINATIONS_VOLATILE_SPAIN,
        "italy-regions":    DESTINATIONS_ITALY_REGIONS,
        "albania":          DESTINATIONS_ALBANIA,
        "montenegro":       DESTINATIONS_MONTENEGRO,
        "croatia":          DESTINATIONS_CROATIA,
        "greece-ext":       DESTINATIONS_GREECE_EXTENDED,
        "italy-beach-ext":  DESTINATIONS_ITALY_BEACH_EXTENDED,
        "med-summer":       DESTINATIONS_MED_SUMMER,
    }
    if dest_preset == "custom" and custom_places:
        return {p.strip(): p.strip().replace(" ", "+") for p in custom_places.split(",")}
    elif dest_preset in presets:
        return presets[dest_preset]
    else:
        return ACTIVE_DESTINATIONS


def generate_report(anomalies, all_hotels, destinations, checkin, checkout, weeks_searched,
                    extras_str=None, techniques_used=None, flash_alerts=None, room_type_data=None,
                    db_stats=None, best_by_hotel=None, flex_mode=False,
                    top_value=None, top_cheap=None):
    if flex_mode:
        nights = 7  # Default for flexible mode
    else:
        try:
            nights = (datetime.strptime(checkout, "%Y-%m-%d") - datetime.strptime(checkin, "%Y-%m-%d")).days
        except:
            nights = 7

    report = "# 🏨 Hotel Deal Hunter v4 — Errores de Precio\n\n"
    report += f"**Fecha búsqueda:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    if flex_mode:
        report += f"**Búsqueda flexible:** {checkin} → {checkout}\n\n"
    else:
        report += f"**Período analizado:** {weeks_searched} semanas desde {checkin}\n\n"
    report += f"**Destinos:** {', '.join(destinations.keys())}\n\n"
    if extras_str:
        report += f"**Filtros:** {extras_str}\n\n"
    if techniques_used:
        report += f"**Técnicas usadas:** {', '.join(techniques_used)}\n\n"
    report += f"**Hoteles analizados:** {len(all_hotels)}\n\n"

    if db_stats:
        report += f"**Base de datos:** {db_stats.get('total_prices', 0)} precios históricos | "
        report += f"{db_stats.get('unique_hotels', 0)} hoteles únicos | "
        report += f"{db_stats.get('total_runs', 0)} búsquedas anteriores\n\n"

    errors = [a for a in anomalies if a["classification"] == "ERROR"]
    anomaly_list = [a for a in anomalies if a["classification"] == "ANOMALY"]
    deals = [a for a in anomalies if a["classification"] == "DEAL"]

    report += f"**Resultados:** {len(errors)} errores, {len(anomaly_list)} anomalías, {len(deals)} chollos\n\n"

    if flash_alerts:
        report += f"**Flash alerts:** {len(flash_alerts)} caídas de precio detectadas\n\n"

    report += "---\n\n"

    # Flexible dates best results section
    if best_by_hotel:
        report += "## 🎯 MEJORES FECHAS ENCONTRADAS (Búsqueda Flexible)\n\n"
        best_list = sorted(best_by_hotel.values(), key=lambda x: x[0])[:15]
        for price, best_date, h in best_list:
            stars = "★" * h.get("stars", 0) if h.get("stars") else ""
            score = h.get("score", 0)
            report += f"- **{h['name']}** ({h['destination']}) {stars}\n"
            report += f"  - Mejor fecha: {best_date} | Precio: {price}€ | Nota: {score}/10\n"
            if h.get("link"):
                report += f"  - [Reservar]({h['link']})\n"
        report += "\n---\n\n"

    # VALUE SCORE TOP section
    if top_value:
        report += "## ⭐ TOP 30 MEJOR CALIDAD-PRECIO (VALUE_SCORE)\n\n"
        report += "| # | Hotel | Destino | ★ | Nota | €/noche | Total | VALUE | Playa |\n"
        report += "|---|-------|---------|---|------|---------|-------|-------|-------|\n"
        for i, h in enumerate(top_value, 1):
            stars_str = "★" * h.get("stars", 0) if h.get("stars") else ""
            sea = "🌊" if h.get("sea") or h.get("beach_badge") else ""
            link_text = f"[{h['hotel'][:35]}]({h['link']})" if h.get("link") else h['hotel'][:35]
            report += f"| {i} | {link_text} | {h['destination']} | {stars_str} | {h.get('score','-')} | {h['price_per_night']}€ | {h['price_total']}€ | {h['value_score']} | {sea} |\n"
        report += "\n---\n\n"

    if top_cheap:
        report += "## 💰 TOP 30 MÁS BARATOS (€/noche)\n\n"
        report += "| # | Hotel | Destino | ★ | Nota | €/noche | Total | Playa |\n"
        report += "|---|-------|---------|---|------|---------|-------|-------|\n"
        for i, h in enumerate(top_cheap, 1):
            stars_str = "★" * h.get("stars", 0) if h.get("stars") else ""
            sea = "🌊" if h.get("sea") or h.get("beach_badge") else ""
            link_text = f"[{h['hotel'][:35]}]({h['link']})" if h.get("link") else h['hotel'][:35]
            report += f"| {i} | {link_text} | {h['destination']} | {stars_str} | {h.get('score','-')} | {h['price_per_night']}€ | {h['price_total']}€ | {sea} |\n"
        report += "\n---\n\n"

    # Flash alerts section
    if flash_alerts:
        report += "## 📉 CAÍDAS DE PRECIO (Flash Detection)\n\n"
        for a in flash_alerts:
            report += f"### {a['hotel']} — {a['destination']}\n"
            report += f"- **Precio actual:** {a['price_total']}€ vs **anterior:** {a['previous_price']}€\n"
            report += f"- **Caída:** {a['drop_pct']}%\n"
            report += f"- **{a['reason']}**\n"
            if a.get("link"):
                report += f"- [Reservar en Booking]({a['link']})\n"
            report += "\n"

    if errors:
        report += "## 🚨 ERRORES DE PRECIO\n\n"
        for a in errors:
            sea = " 🌊" if a.get("sea") else ""
            stars = "★" * a.get("stars", 0) if a.get("stars") else ""
            score = f" | Nota: {a['score']}/10" if a.get("score") else ""
            report += f"### {a['hotel']} — {a['destination']}{sea}\n"
            report += f"- **{stars}{score}**\n"
            report += f"- **Tipo:** {a.get('type', '?')}\n"
            report += f"- **Precio encontrado:** {a['price_total']}€ ({a['price_per_night']}€/noche)\n"
            report += f"- **Descuento:** {a.get('pct_off', '?')}%\n"
            report += f"- **{a['reason']}**\n"
            if a.get("link"):
                report += f"- [Reservar en Booking]({a['link']})\n"
            report += "\n"

    if anomaly_list:
        report += "## ⚠️ ANOMALÍAS SOSPECHOSAS\n\n"
        for a in anomaly_list:
            sea = " 🌊" if a.get("sea") else ""
            stars = "★" * a.get("stars", 0) if a.get("stars") else ""
            report += f"### {a['hotel']} — {a['destination']}{sea}\n"
            report += f"- {stars} | {a['price_total']}€ ({a['price_per_night']}€/noche)\n"
            report += f"- Tipo: {a.get('type', '?')}\n"
            report += f"- {a['reason']}\n"
            if a.get("link"):
                report += f"- [Reservar en Booking]({a['link']})\n"
            report += "\n"

    if deals:
        report += "## 💰 CHOLLOS\n\n"
        for a in deals[:30]:
            sea = " 🌊" if a.get("sea") else ""
            report += f"- **{a['hotel']}** — {a['destination']}{sea} | {a['price_total']}€ | {a.get('type','?')} | {a['reason']}\n"
            if a.get("link"):
                report += f"  - [Reservar]({a['link']})\n"

    # Room type analysis
    if room_type_data:
        report += "\n\n## 🏷️ Análisis de Tipos de Habitación\n\n"
        for hotel_name, data in room_type_data.items():
            rooms = data.get("room_types", [])
            if not rooms:
                continue
            report += f"### {hotel_name} — {data.get('destination', '')}\n"
            report += "| Tipo | Precio | Comida |\n|------|--------|--------|\n"
            for r in rooms:
                report += f"| {r['name'][:40]} | {r['price']}€ | {r.get('meal', '-')} |\n"

            # Check for room type anomalies
            if len(rooms) >= 2:
                prices = [r["price"] for r in rooms]
                cheapest = min(prices)
                most_expensive = max(prices)
                if most_expensive > 0 and cheapest / most_expensive < 0.4:
                    report += f"\n⚠️ **Gran diferencia**: habitación más barata ({cheapest}€) es {round((1-cheapest/most_expensive)*100)}% menos que la más cara ({most_expensive}€)\n"
            report += "\n"

    return report


async def run(args):
    destinations = get_destinations(args.dest, args.places)

    # Handle high season override
    if args.high_season:
        if args.high_season in HIGH_SEASON_DATES:
            checkin = HIGH_SEASON_DATES[args.high_season]
            print(f"🎯 Modo alta temporada: {args.high_season} → {checkin}")
        else:
            print(f"❌ Temporada no reconocida: {args.high_season}")
            print(f"   Opciones: {', '.join(HIGH_SEASON_DATES.keys())}")
            return []
    else:
        checkin = args.checkin

    checkout_dt = datetime.strptime(checkin, "%Y-%m-%d") + timedelta(days=args.nights)
    checkout = checkout_dt.strftime("%Y-%m-%d")

    # Init database
    init_db()

    # Resolve techniques
    all_tech = getattr(args, 'all_techniques', False)
    room_compare = getattr(args, 'room_compare', False) or all_tech
    duration_compare = getattr(args, 'duration_compare', False) or all_tech
    currency_compare = getattr(args, 'currency_compare', False) or all_tech
    checkin_day_compare = getattr(args, 'checkin_day_compare', False) or all_tech
    rooms_compare = getattr(args, 'rooms_compare', False) or all_tech
    mobile_compare = getattr(args, 'mobile_compare', False) or all_tech
    room_types = getattr(args, 'room_types', False) or all_tech
    single_compare = getattr(args, 'single_compare', False) or all_tech

    pages = getattr(args, 'pages', 1)

    filter_kwargs = dict(
        # Base
        beachfront=args.beachfront, all_inclusive=args.all_inclusive,
        sea_view=args.sea_view, min_stars=args.stars,
        # Meal plans
        breakfast=getattr(args, 'breakfast', False),
        half_board=getattr(args, 'half_board', False),
        full_board=getattr(args, 'full_board', False),
        breakfast_dinner=getattr(args, 'breakfast_dinner', False),
        kitchen=getattr(args, 'kitchen', False),
        # Facilities
        pool=getattr(args, 'pool', False),
        private_pool=getattr(args, 'private_pool', False),
        spa=getattr(args, 'spa', False),
        parking=getattr(args, 'parking', False),
        restaurant=getattr(args, 'restaurant', False),
        reception_24h=getattr(args, 'reception_24h', False),
        gym=getattr(args, 'gym', False),
        ac=getattr(args, 'ac', False),
        wifi=getattr(args, 'wifi', False),
        # Cancellation & stay type
        free_cancel=getattr(args, 'free_cancel', False),
        no_prepay=getattr(args, 'no_prepay', False),
        pets=getattr(args, 'pets', False),
        adults_only=getattr(args, 'adults_only', False),
        double_bed=getattr(args, 'double_bed', False),
        # Type & location
        no_hotel_filter=getattr(args, 'no_hotel_filter', False),
        no_stars_filter=getattr(args, 'no_stars_filter', False),
        min_review=getattr(args, 'min_review', None),
        hotel_type=getattr(args, 'hotel_type', None),
        max_distance=getattr(args, 'max_distance', None),
        district=getattr(args, 'district', None),
    )

    # --single mode: override adults to 1, else use --adults value
    search_adults = 1 if getattr(args, 'single', False) else getattr(args, 'adults', 2)

    # ─────── Header ───────
    print("=" * 60)
    print("🏨 HOTEL DEAL HUNTER v4 — Detector de Errores de Precio")
    print("=" * 60)
    print(f"📅 Desde {checkin} | {args.nights} noches | {args.weeks} semanas")
    print(f"🗺️  {len(destinations)} destinos: {', '.join(list(destinations.keys())[:10])}")
    if len(destinations) > 10:
        print(f"    ...y {len(destinations) - 10} más")

    extras = []
    if args.beachfront:
        extras.append("🏖️ Playa")
    if args.all_inclusive:
        extras.append("🍽️ AI")
    if args.sea_view:
        extras.append("🌊 Vista mar")
    if getattr(args, 'breakfast', False):
        extras.append("🥐 Desayuno")
    if getattr(args, 'half_board', False):
        extras.append("🍽️ Media pensión")
    if getattr(args, 'full_board', False):
        extras.append("🍽️ Pensión completa")
    if getattr(args, 'single', False):
        extras.append("👤 Individual")
    if getattr(args, 'pool', False):
        extras.append("🏊 Piscina")
    if getattr(args, 'private_pool', False):
        extras.append("🏊 Piscina privada")
    if getattr(args, 'spa', False):
        extras.append("💆 Spa")
    if getattr(args, 'parking', False):
        extras.append("🅿️ Parking")
    if getattr(args, 'restaurant', False):
        extras.append("🍴 Restaurante")
    if getattr(args, 'reception_24h', False):
        extras.append("🔑 Recepción 24h")
    if getattr(args, 'gym', False):
        extras.append("💪 Gym")
    if getattr(args, 'free_cancel', False):
        extras.append("✅ Cancel. gratis")
    if getattr(args, 'pets', False):
        extras.append("🐾 Mascotas")
    if getattr(args, 'adults_only', False):
        extras.append("🔞 Solo adultos")
    if getattr(args, 'double_bed', False):
        extras.append("🛏️ Cama doble")
    if getattr(args, 'breakfast_dinner', False):
        extras.append("🍽️ Desayuno+Cena")
    if getattr(args, 'kitchen', False):
        extras.append("🍳 Cocina")
    if getattr(args, 'no_hotel_filter', False):
        extras.append("🏡 Todo tipo")
    if getattr(args, 'no_stars_filter', False):
        extras.append("⭐ Sin filtro estrellas")
    if getattr(args, 'hotel_type', None):
        extras.append("🏨 " + args.hotel_type)
    if getattr(args, 'min_review', None):
        extras.append("⭐ Review " + str(args.min_review // 10) + "+")
    if getattr(args, 'max_distance', None):
        extras.append("📍 <" + str(args.max_distance // 1000) + "km centro")
    extras_str = " | ".join(extras) if extras else ""
    print(f"⭐ Mínimo {args.stars}★")
    if extras_str:
        print(f"🎯 Filtros: {extras_str}")
    if pages > 1:
        print(f"📄 Scroll infinito: {pages} páginas (~{pages * 25} hoteles/destino)")

    techniques = ["T1:Cross-date", "T2:Peers"]
    if room_compare: techniques.append("T3:Simple/Doble")
    if duration_compare: techniques.append("T4:Duración")
    if currency_compare: techniques.append("T5:Moneda")
    if checkin_day_compare: techniques.append("T6:Día check-in")
    if rooms_compare: techniques.append("T7:Nº habitaciones")
    if mobile_compare: techniques.append("T9:Mobile")
    if room_types: techniques.append("T10:Room types")
    if single_compare: techniques.append("T11:Single-compare")
    print(f"🔍 Técnicas: {', '.join(techniques)}")

    # DB stats
    try:
        db_stats = get_stats()
        if db_stats["total_prices"] > 0:
            print(f"💾 DB: {db_stats['total_prices']} precios | {db_stats['unique_hotels']} hoteles | {db_stats['total_runs']} búsquedas")
    except:
        db_stats = None
    print()

    # Register run
    run_id = start_run(list(destinations.keys()), checkin, args.nights, techniques)

    # ─────── Estimate searches ───────
    n_dest = len(destinations)
    n_weeks = args.weeks
    base_searches = n_dest * n_weeks * pages
    extra_searches = 0
    if room_compare: extra_searches += base_searches
    if duration_compare: extra_searches += n_dest * 2 * pages
    if currency_compare: extra_searches += n_dest * 3 * pages
    if checkin_day_compare: extra_searches += n_dest * 3 * pages
    if rooms_compare: extra_searches += n_dest * 3 * pages
    if mobile_compare: extra_searches += n_dest * 2 * pages

    total_est = base_searches + extra_searches
    est_min = total_est * 7 // 60
    print(f"⏱️  ~{total_est} búsquedas, ~{est_min} min")
    print()

    # ═══════════════════════════════════
    # PHASE 1: Core cross-date search
    # ═══════════════════════════════════
    results_1adult = None
    results_2adults = None
    results_by_nights = None
    results_by_currency = None
    results_by_day = None
    days_info = None
    results_by_rooms = None
    results_mobile = None
    room_type_data = None
    results_single_1 = None
    results_single_2 = None

    concurrent = getattr(args, 'concurrent', 3)

    # Check if flexible date mode is active
    if args.flex_start and args.flex_end:
        print("━" * 50)
        print(f"🔍 FLEXIBLE DATE MODE: {args.flex_start} → {args.flex_end}")
        print(f"   Step: {args.flex_step} days")
        print("━" * 50)
        results_by_date, best_by_hotel, date_list = await scrape_flexible_dates(
            destinations, args.flex_start, args.flex_end, nights=args.nights,
            flex_step=args.flex_step, adults=search_adults, pages=pages,
            concurrent=concurrent, **filter_kwargs
        )
        # Convert best_by_hotel dict to date ranges format for compatibility
        date_ranges = date_list
        print(f"\n   ✅ Flexible search complete: {len(date_list)} check-in dates tested")
        print(f"   🏆 Best deals found:")
        best_list = sorted(best_by_hotel.values(), key=lambda x: x[0])[:10]
        for price, best_date, h in best_list:
            dest = h["destination"]
            name = h["name"]
            print(f"      {name} ({dest}): {price}€ on {best_date}")
    elif room_compare:
        print("━" * 50)
        print(f"🔍 T1+T3: Cross-date + Simple vs Doble ({n_weeks} semanas × 2)")
        print("━" * 50)
        results_1adult, results_2adults, date_ranges = await scrape_full_comparison(
            destinations, checkin, args.nights, n_weeks, adults=search_adults,
            concurrent=concurrent, **filter_kwargs, pages=pages
        )
        results_by_date = results_2adults
    else:
        print("━" * 50)
        print(f"🔍 T1+T2: Cross-date ({n_weeks} semanas, {pages} páginas)")
        print("━" * 50)
        results_by_date, date_ranges = await scrape_multi_date(
            destinations, checkin, args.nights, n_weeks, adults=search_adults,
            concurrent=concurrent, **filter_kwargs, pages=pages
        )

    # Combine all hotels
    all_hotels = []
    for hotels in results_by_date.values():
        all_hotels.extend(hotels)

    total_hotels = len(all_hotels)
    unique_hotels = len(set((h["destination"], h["name"]) for h in all_hotels))
    print(f"\n   📊 {total_hotels} resultados | {unique_hotels} hoteles únicos")

    # Save to database
    saved = save_hotels(all_hotels, run_id)
    print(f"   💾 {saved} precios guardados en DB")

    # ═══════════════════════════════════
    # PHASE 1b: Additional techniques
    # ═══════════════════════════════════

    if duration_compare:
        print()
        print("━" * 50)
        print(f"🔍 T4: Arbitraje de duración ({args.nights}n vs {args.nights * 2}n)")
        print("━" * 50)
        results_by_nights = await scrape_duration_comparison(
            destinations, checkin, nights_options=(args.nights, args.nights * 2),
            **filter_kwargs, pages=pages
        )
        n_dur = sum(len(h) for h in results_by_nights.values())
        print(f"   📊 {n_dur} resultados duración")
        for hotels in results_by_nights.values():
            save_hotels(hotels, run_id)

    if currency_compare:
        print()
        print("━" * 50)
        print("🔍 T5: Arbitraje de moneda (EUR vs USD vs GBP)")
        print("━" * 50)
        results_by_currency = await scrape_currency_comparison(
            destinations, checkin, checkout, currencies=("EUR", "USD", "GBP"),
            **filter_kwargs, pages=pages
        )
        n_cur = sum(len(h) for h in results_by_currency.values())
        print(f"   📊 {n_cur} resultados moneda")

    if checkin_day_compare:
        print()
        print("━" * 50)
        print("🔍 T6: Arbitraje día de check-in (Lun/Mié/Vie)")
        print("━" * 50)
        results_by_day, days_info = await scrape_checkin_day_comparison(
            destinations, checkin, nights=args.nights, day_offsets=(0, 2, 4),
            **filter_kwargs, pages=pages
        )
        n_day = sum(len(h) for h in results_by_day.values())
        print(f"   📊 {n_day} resultados día")

    if rooms_compare:
        print()
        print("━" * 50)
        print("🔍 T7: Comparación 1 hab vs 2 hab vs 3 hab")
        print("━" * 50)
        results_by_rooms = await scrape_rooms_comparison(
            destinations, checkin, checkout,
            room_configs=((1, 2), (2, 4), (3, 6)), **filter_kwargs, pages=pages
        )
        n_rooms = sum(len(h) for h in results_by_rooms.values())
        print(f"   📊 {n_rooms} resultados habitaciones")

    if mobile_compare:
        print()
        print("━" * 50)
        print("🔍 T9: Comparación desktop vs mobile")
        print("━" * 50)
        results_mobile = await scrape_mobile_comparison(
            destinations, checkin, checkout, **filter_kwargs, pages=pages
        )
        n_mob = sum(len(h) for h in results_mobile.values())
        print(f"   📊 {n_mob} resultados mobile")

    # ═══════════════════════════════════
    # PHASE 1c: Single room comparison (T11)
    # ═══════════════════════════════════
    if single_compare:
        print()
        print("━" * 50)
        print("🔍 T11: Comparación 1 adulto vs 2 adultos (habitación individual)")
        print("━" * 50)
        results_single_1, results_single_2 = await scrape_adult_comparison(
            destinations, checkin, checkout, **filter_kwargs, pages=pages
        )
        n_s1 = len(results_single_1)
        n_s2 = len(results_single_2)
        print(f"   📊 {n_s1} hoteles (1 adulto) + {n_s2} hoteles (2 adultos)")
        # Save single-adult results to DB too
        save_hotels(results_single_1, run_id)

    # ═══════════════════════════════════
    # PHASE 1d: Room type scraping (T10)
    # ═══════════════════════════════════
    if room_types and all_hotels:
        print()
        print("━" * 50)
        print("🔍 T10: Scraping tipos de habitación")
        print("━" * 50)
        # Get cheapest hotels per destination as candidates
        cheapest_by_dest = {}
        for h in all_hotels:
            d = h["destination"]
            if d not in cheapest_by_dest or h["price_total"] < cheapest_by_dest[d]["price_total"]:
                cheapest_by_dest[d] = h
        candidates = list(cheapest_by_dest.values())[:8]  # Max 8 hotels to scrape
        room_type_data = await scrape_room_types_for_hotels(candidates, max_hotels=8)
        print(f"   📊 {len(room_type_data)} hoteles con datos de habitación")

    # ═══════════════════════════════════
    # PHASE 2: Anomaly detection (ALL techniques)
    # ═══════════════════════════════════
    print()
    print("━" * 50)
    print("🧠 FASE 2: Analizando precios — todas las técnicas")
    print("━" * 50)

    anomalies = analyze_all(
        all_hotels, results_by_date, date_ranges, min_score=args.min_score,
        results_1adult=results_1adult, results_2adults=results_2adults,
        results_by_nights=results_by_nights, results_by_currency=results_by_currency,
        results_by_day=results_by_day, days_info=days_info,
        results_by_rooms=results_by_rooms, results_mobile=results_mobile,
    )

    # T11: Manual single-compare analysis
    if single_compare and results_single_1 and results_single_2:
        print("   🔍 T11: Analizando diferencias 1 vs 2 adultos...")
        single_map = {}
        for h in results_single_1:
            key = (h["destination"], h["name"])
            single_map[key] = h
        for h in results_single_2:
            key = (h["destination"], h["name"])
            if key in single_map:
                h1 = single_map[key]
                p1 = h1["price_total"]
                p2 = h["price_total"]
                if p2 > 0 and p1 > 0:
                    ratio = p1 / p2
                    if ratio <= 0.80:  # Single is 20%+ cheaper (like Italy deal)
                        nights_count = (datetime.strptime(checkout, "%Y-%m-%d") - datetime.strptime(checkin, "%Y-%m-%d")).days
                        pct_off = round((1 - ratio) * 100)
                        classification = "ERROR" if ratio < 0.40 else ("ANOMALY" if ratio < 0.55 else "DEAL")
                        anomalies.append({
                            "hotel": h["name"],
                            "destination": h["destination"],
                            "price_total": p1,
                            "price_per_night": round(p1 / max(nights_count, 1)),
                            "stars": h.get("stars", 0),
                            "score": h.get("score", 0),
                            "sea": h.get("sea", False),
                            "link": h1.get("link", ""),
                            "type": "T11:Single",
                            "classification": classification,
                            "pct_off": pct_off,
                            "reason": f"1 adulto: {p1}€ vs 2 adultos: {p2}€ ({pct_off}% menos por persona sola)",
                        })
        t11_count = len([a for a in anomalies if a.get("type") == "T11:Single"])
        print(f"      → {t11_count} diferencias significativas encontradas")

    # Flash detection from DB
    print("   📉 Detección flash (comparación con histórico)...")
    flash_alerts = detect_flash_drops(all_hotels)
    print(f"      → {len(flash_alerts)} caídas de precio")

    # Merge flash alerts into anomalies
    anomalies.extend(flash_alerts)

    errors = [a for a in anomalies if a["classification"] == "ERROR"]
    warns = [a for a in anomalies if a["classification"] == "ANOMALY"]
    deals = [a for a in anomalies if a["classification"] == "DEAL"]

    print(f"\n   🚨 ERRORES DE PRECIO: {len(errors)}")
    print(f"   ⚠️  ANOMALÍAS:        {len(warns)}")
    print(f"   💰 CHOLLOS:           {len(deals)}")
    if flash_alerts:
        print(f"   📉 FLASH DROPS:      {len(flash_alerts)}")

    # ═══════════════════════════════════
    # PHASE 2b: VALUE SCORE RANKING
    # ═══════════════════════════════════
    print()
    print("━" * 50)
    print("⭐ FASE 2b: Ranking VALUE_SCORE (mejor calidad-precio)")
    print("━" * 50)

    top_value = rank_by_value(all_hotels, top_n=30, min_score=args.min_score, min_stars=args.stars)
    top_cheap = rank_cheapest(all_hotels, top_n=30, min_score=args.min_score, min_stars=args.stars)

    if top_value:
        print(f"\n   🏆 TOP 15 MEJOR CALIDAD-PRECIO:")
        for i, h in enumerate(top_value[:15], 1):
            sea = " 🌊" if h.get("sea") or h.get("beach_badge") else ""
            stars = "★" * h.get("stars", 0)
            print(f"   {i:2d}. {h['hotel'][:45]} ({h['destination']}){sea}")
            print(f"       {stars} | Nota {h['score']}/10 | {h['price_per_night']}€/n | VALUE={h['value_score']}")

    if top_cheap:
        print(f"\n   💰 TOP 15 MÁS BARATOS:")
        for i, h in enumerate(top_cheap[:15], 1):
            sea = " 🌊" if h.get("sea") or h.get("beach_badge") else ""
            stars = "★" * h.get("stars", 0)
            score_str = f"Nota {h['score']}/10 | " if h.get("score") else ""
            print(f"   {i:2d}. {h['hotel'][:45]} ({h['destination']}){sea}")
            print(f"       {stars} | {score_str}{h['price_per_night']}€/n | Total {h['price_total']}€")

    # ═══════════════════════════════════
    # PHASE 3: Results
    # ═══════════════════════════════════
    if anomalies:
        print()
        print("=" * 60)
        print("📋 RESULTADOS")
        print("=" * 60)

        for a in anomalies[:30]:
            icon = {"ERROR": "🚨", "ANOMALY": "⚠️", "DEAL": "💰"}.get(a["classification"], "?")
            sea = " 🌊" if a.get("sea") else ""
            stars = "★" * a.get("stars", 0)
            score_str = f" ({a['score']}/10)" if a.get("score") else ""

            print(f"\n{icon} [{a['classification']}] [{a.get('type','')}] {a['hotel'][:50]}")
            print(f"   📍 {a['destination']}{sea} | {stars}{score_str}")
            print(f"   💰 {a['price_total']}€ total ({a['price_per_night']}€/noche)")
            print(f"   📝 {a['reason']}")
            if a.get("link"):
                print(f"   🔗 {a['link']}")
    else:
        print("\n   No se encontraron errores de precio.")
        print("   Intenta con más destinos, distintas fechas o --all-techniques.")

    # ─────── Save report ───────
    best_by_hotel = locals().get('best_by_hotel', None)  # From flexible dates mode
    flex_mode = args.flex_start and args.flex_end
    report = generate_report(anomalies, all_hotels, destinations, checkin, checkout, args.weeks,
                              extras_str=extras_str if extras else None,
                              techniques_used=techniques,
                              flash_alerts=flash_alerts if flash_alerts else None,
                              room_type_data=room_type_data,
                              db_stats=db_stats,
                              best_by_hotel=best_by_hotel,
                              flex_mode=flex_mode,
                              top_value=top_value,
                              top_cheap=top_cheap)
    # Output paths — relative to script location so they work across sessions
    _base_dir = os.path.dirname(os.path.abspath(__file__))
    _output_dir = os.path.join(_base_dir, "..")  # /Viajes/
    report_path = os.path.join(_output_dir, "HOTEL_ERRORES_PRECIO.md")
    with open(report_path, "w") as f:
        f.write(report)

    raw_data = {
        "search_time": datetime.now().isoformat(),
        "checkin": checkin, "checkout": checkout,
        "weeks": args.weeks,
        "pages": pages,
        "techniques": techniques,
        "destinations": list(destinations.keys()),
        "total_hotels": total_hotels,
        "unique_hotels": unique_hotels,
        "anomalies": anomalies,
        "flash_alerts": flash_alerts,
        "top_value": top_value,
        "top_cheapest": top_cheap,
    }
    json_path = os.path.join(_output_dir, "hotel_hunter_results.json")
    with open(json_path, "w") as f:
        json.dump(raw_data, f, indent=2, ensure_ascii=False, default=str)

    # Finish run in DB
    finish_run(run_id, total_hotels, len(anomalies))

    print(f"\n✅ Reporte: {report_path}")
    print()
    print("=" * 60)
    print("📊 RESUMEN")
    print("=" * 60)
    print(f"   Destinos:    {len(destinations)}")
    print(f"   Páginas:     {pages}/destino")
    print(f"   Técnicas:    {len(techniques)}")
    print(f"   Hoteles:     {unique_hotels} únicos")
    print(f"   Anomalías:   {len(anomalies)} ({len(errors)} errores, {len(warns)} anomalías, {len(deals)} chollos)")
    if flash_alerts:
        print(f"   Flash drops: {len(flash_alerts)}")

    return anomalies


def main():
    parser = argparse.ArgumentParser(description="Hotel Deal Hunter v4 — Errores de Precio en Booking.com")
    parser.add_argument("--dest", type=str, default="active",
                        choices=["italy", "spain", "greece", "cities", "all", "active", "custom",
                                 "error-prone", "volatile-quick",
                                 "volatile-italy", "volatile-greece", "volatile-turkey",
                                 "volatile-thailand", "volatile-bali", "volatile-portugal",
                                 "volatile-mexico", "volatile-maldives", "volatile-spain", "italy-regions",
                                 "albania", "montenegro", "greece-ext", "italy-beach-ext", "med-summer"],
                        help="Pack de destinos")
    parser.add_argument("--places", type=str, help="Destinos personalizados (coma)")
    parser.add_argument("--checkin", type=str, default=DEFAULT_CHECKIN, help="Fecha check-in")
    parser.add_argument("--nights", type=int, default=7, help="Noches de estancia")
    parser.add_argument("--stars", type=int, default=MIN_STARS, help="Estrellas mínimas")
    parser.add_argument("--weeks", type=int, default=WEEKS_TO_COMPARE, help="Semanas a comparar")
    parser.add_argument("--min-score", type=float, default=MIN_HOTEL_SCORE, help="Nota mínima hotel")
    parser.add_argument("--pages", type=int, default=PAGES_TO_SCRAPE, help="Páginas a scrapear por destino (1-8, default 6 = ~150 hoteles)")

    # Filters
    parser.add_argument("--beachfront", action="store_true", help="Solo primera línea de playa")
    parser.add_argument("--all-inclusive", action="store_true", help="Solo todo incluido")
    parser.add_argument("--sea-view", action="store_true", help="Solo vista al mar")
    parser.add_argument("--breakfast", action="store_true", help="Solo con desayuno incluido")
    parser.add_argument("--half-board", action="store_true", help="Solo media pensión")
    parser.add_argument("--full-board", action="store_true", help="Solo pensión completa")
    parser.add_argument("--single", action="store_true", help="Buscar habitación individual (1 adulto)")
    parser.add_argument("--single-compare", action="store_true", help="T11: Comparar precio 1 adulto vs 2 adultos")

    # v4.2 Facility filters
    parser.add_argument("--pool", action="store_true", help="Solo con piscina")
    parser.add_argument("--private-pool", action="store_true", help="Solo con piscina privada")
    parser.add_argument("--spa", action="store_true", help="Solo con spa")
    parser.add_argument("--parking", action="store_true", help="Solo con parking")
    parser.add_argument("--restaurant", action="store_true", help="Solo con restaurante")
    parser.add_argument("--reception-24h", action="store_true", help="Solo con recepción 24h")
    parser.add_argument("--gym", action="store_true", help="Solo con gimnasio/fitness")
    parser.add_argument("--ac", action="store_true", help="Solo con aire acondicionado")
    parser.add_argument("--wifi", action="store_true", help="Solo con wifi gratuito")

    # v4.2 Meal plan extras
    parser.add_argument("--breakfast-dinner", action="store_true", help="Solo desayuno + cena")
    parser.add_argument("--kitchen", action="store_true", help="Solo con cocina propia")

    # v4.2 Stay type & bed
    parser.add_argument("--free-cancel", action="store_true", help="Solo cancelación gratuita")
    parser.add_argument("--no-prepay", action="store_true", help="Solo sin prepago")
    parser.add_argument("--pets", action="store_true", help="Solo admite mascotas")
    parser.add_argument("--adults-only", action="store_true", help="Solo para adultos")
    parser.add_argument("--double-bed", action="store_true", help="Solo cama doble")

    # v4.2 Accommodation type & location
    parser.add_argument("--hotel-type", type=str, default=None,
                        help="Tipo: hotel,resort,riad,villa,apartment,guesthouse,bb,hostel,glamping")
    parser.add_argument("--max-distance", type=int, default=None, choices=[1000, 3000, 5000],
                        help="Distancia máx al centro (1000=1km, 3000=3km, 5000=5km)")
    parser.add_argument("--district", type=str, default=None,
                        help="ID de barrio Booking (ej: 2268=Medina Marrakech)")

    parser.add_argument("--adults", type=int, default=2, help="Número de adultos (default 2)")

    # v4.2 Review & type filters
    parser.add_argument("--min-review", type=int, default=None, choices=[60, 70, 80, 90],
                        help="Nota mínima huéspedes (60=6+, 70=7+, 80=8+, 90=9+)")
    parser.add_argument("--no-hotel-filter", action="store_true",
                        help="No filtrar por tipo hotel (incluir riads, apartments, etc.)")
    parser.add_argument("--no-stars-filter", action="store_true",
                        help="No filtrar por estrellas (para riads sin clasificación)")

    # High season
    parser.add_argument("--high-season", type=str, default=None,
                        choices=list(HIGH_SEASON_DATES.keys()),
                        help="Usar fechas de alta temporada predefinidas")

    # Techniques
    parser.add_argument("--room-compare", action="store_true", help="T3: Simple vs doble")
    parser.add_argument("--duration-compare", action="store_true", help="T4: Arbitraje duración")
    parser.add_argument("--currency-compare", action="store_true", help="T5: Arbitraje moneda")
    parser.add_argument("--checkin-day-compare", action="store_true", help="T6: Arbitraje día check-in")
    parser.add_argument("--rooms-compare", action="store_true", help="T7: 1 hab vs 2 hab vs 3 hab")
    parser.add_argument("--mobile-compare", action="store_true", help="T9: Desktop vs mobile")
    parser.add_argument("--room-types", action="store_true", help="T10: Scrape room types in hotel pages")
    parser.add_argument("--all-techniques", action="store_true", help="Activar TODAS las técnicas")

    # Deep search mode
    parser.add_argument("--deep", action="store_true",
                       help="Deep search: 8 pages (~200 hotels/dest), all techniques")

    # Flexible date search
    parser.add_argument("--flex-start", type=str, default=None,
                       help="Inicio ventana flexible (YYYY-MM-DD, ej: 2027-07-01)")
    parser.add_argument("--flex-end", type=str, default=None,
                       help="Fin ventana flexible (YYYY-MM-DD, ej: 2027-08-31)")
    parser.add_argument("--flex-step", type=int, default=3,
                       help="Días entre check-ins a probar en modo flexible (default 3)")
    parser.add_argument("--concurrent", type=int, default=3,
                       help="Páginas concurrentes para scraping paralelo (default 3)")

    args = parser.parse_args()

    # Deep search mode: override pages and techniques
    if args.deep:
        args.pages = 8
        args.all_techniques = True
        print("🔥 DEEP SEARCH MODE: 8 páginas (~200 hoteles/destino), todas las técnicas")

    # Clamp pages (v4.1: scroll-based, supports up to 8 = ~200 hotels)
    if args.pages < 1:
        args.pages = 1
    elif args.pages > 8:
        args.pages = 8

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
