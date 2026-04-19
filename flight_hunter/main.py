"""
Flight Hunter V2 — Error Fare & Anomaly Detector
==================================================
Detects business class error fares, flash price drops, and anomalies using:
1. SerpApi (Google Flights) — PRIMARY SOURCE
2. Cross-date & cross-source analysis
3. Cabin ratio detection (Business vs Economy)
4. Secret Flying scraper (optional)
5. SQLite price history database for flash detection

Usage:
    python main.py --dest caribbean --depart 2026-05-15 --return 2026-05-22
    python main.py --dest custom --places "PUJ,SDQ,CUN" --origins tier1
    python main.py --dest volatile-quick --weeks 4 --cabin-compare --all-techniques
    python main.py --dest japan-korea --depart 2026-06-01 --flex-days 3 --cabin business
"""

import asyncio
import argparse
import json
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, ".")

from config import (
    EUROPEAN_AIRPORTS_TIER1, EUROPEAN_AIRPORTS_TIER2, EUROPEAN_AIRPORTS_ALL,
    DEST_CARIBBEAN, DEST_MEXICO, DEST_MALDIVES, DEST_SOUTHEAST_ASIA,
    DEST_JAPAN_KOREA, DEST_NORTH_AMERICA, DEST_SOUTH_AMERICA,
    DEST_MIDDLE_EAST, DEST_AFRICA, DEST_OCEANIA,
    DEST_VOLATILE_QUICK, DEST_ALL_LONG_HAUL,
    HIGH_SEASON_DATES, REPORT_DIR, CABIN_ECONOMY, CABIN_PREMIUM_ECONOMY,
    CABIN_BUSINESS, CABIN_FIRST, CABIN_NAMES,
)
from db import init_db, save_flights, start_run, finish_run, detect_flash_drops, get_stats
from detector import analyze_all, generate_report, rank_by_value, rank_cheapest
from serpapi_scraper import SerpApiScraper, load_serpapi_credentials
from kiwi_scraper import KiwiScraper
from travelpayouts_scraper import TravelpayoutsScraper
from duffel_scraper import DuffelScraper


# Try to import secret_flying_scraper only if needed
try:
    from secret_flying_scraper import SecretFlyingScraper
except ImportError:
    SecretFlyingScraper = None


# ── SerpApi monthly quota tracking ──────────────────────────
SERPAPI_QUOTA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".serpapi_usage.json")

def get_serpapi_remaining():
    """Check how many SerpApi searches remain this month"""
    try:
        with open(SERPAPI_QUOTA_FILE, "r") as f:
            usage = json.load(f)
        month = datetime.now().strftime("%Y-%m")
        if usage.get("month") == month:
            return max(0, 100 - usage.get("used", 0))
        return 100  # New month
    except:
        return 100

def update_serpapi_usage(searches_used):
    """Update SerpApi monthly usage tracker"""
    month = datetime.now().strftime("%Y-%m")
    try:
        with open(SERPAPI_QUOTA_FILE, "r") as f:
            usage = json.load(f)
        if usage.get("month") != month:
            usage = {"month": month, "used": 0}
    except:
        usage = {"month": month, "used": 0}
    usage["used"] = usage.get("used", 0) + searches_used
    with open(SERPAPI_QUOTA_FILE, "w") as f:
        json.dump(usage, f)


def get_destination_airports(dest_preset, custom_places=None):
    """
    Get list of destination airport codes from preset or custom input.

    Args:
        dest_preset: Preset choice or 'custom'
        custom_places: Comma-separated airport codes if preset is 'custom'

    Returns:
        List of IATA airport codes
    """
    presets = {
        "caribbean": DEST_CARIBBEAN,
        "mexico": DEST_MEXICO,
        "maldives": DEST_MALDIVES,
        "southeast-asia": DEST_SOUTHEAST_ASIA,
        "japan-korea": DEST_JAPAN_KOREA,
        "north-america": DEST_NORTH_AMERICA,
        "south-america": DEST_SOUTH_AMERICA,
        "middle-east": DEST_MIDDLE_EAST,
        "africa": DEST_AFRICA,
        "oceania": DEST_OCEANIA,
        "volatile-quick": DEST_VOLATILE_QUICK,
        "all-long-haul": DEST_ALL_LONG_HAUL,
    }

    if dest_preset == "custom" and custom_places:
        return [p.strip().upper() for p in custom_places.split(",")]
    elif dest_preset in presets:
        return presets[dest_preset]
    else:
        return DEST_VOLATILE_QUICK  # Default fallback


def get_origin_airports(origin_tier, custom_origins=None):
    """
    Get list of origin airport codes from tier or custom input.

    Args:
        origin_tier: 'tier1', 'tier2', 'all', or 'custom'
        custom_origins: Comma-separated airport codes if tier is 'custom'

    Returns:
        List of IATA airport codes
    """
    if origin_tier == "tier1":
        return EUROPEAN_AIRPORTS_TIER1
    elif origin_tier == "tier2":
        return EUROPEAN_AIRPORTS_TIER2
    elif origin_tier == "all":
        return EUROPEAN_AIRPORTS_ALL
    elif origin_tier == "custom" and custom_origins:
        return [o.strip().upper() for o in custom_origins.split(",")]
    else:
        return EUROPEAN_AIRPORTS_TIER1


def get_cabin_code(cabin_name):
    """Convert cabin name to numeric code"""
    cabin_map = {
        "economy": CABIN_ECONOMY,
        "premium": CABIN_PREMIUM_ECONOMY,
        "business": CABIN_BUSINESS,
        "first": CABIN_FIRST,
    }
    return cabin_map.get(cabin_name.lower(), CABIN_ECONOMY)


def generate_date_combinations(depart_str, return_str, flex_days=None, weeks=None):
    """
    Generate list of (date_out, date_ret) tuples for search.

    Args:
        depart_str: Base departure date YYYY-MM-DD
        return_str: Base return date YYYY-MM-DD
        flex_days: If set, generate dates from (depart - flex_days) to (depart + flex_days)
        weeks: If set, generate weekly intervals for N weeks from depart

    Returns:
        List of (date_out, date_ret) tuples
    """
    dates = []
    depart = datetime.strptime(depart_str, "%Y-%m-%d")
    return_base = datetime.strptime(return_str, "%Y-%m-%d")
    trip_length = (return_base - depart).days

    if flex_days:
        # Generate dates within flexibility range
        for offset in range(-flex_days, flex_days + 1):
            d_out = depart + timedelta(days=offset)
            d_ret = d_out + timedelta(days=trip_length)
            dates.append((d_out.strftime("%Y-%m-%d"), d_ret.strftime("%Y-%m-%d")))
    elif weeks:
        # Generate weekly intervals
        for week in range(weeks):
            d_out = depart + timedelta(weeks=week)
            d_ret = d_out + timedelta(days=trip_length)
            dates.append((d_out.strftime("%Y-%m-%d"), d_ret.strftime("%Y-%m-%d")))
    else:
        # Just use the provided dates
        dates.append((depart_str, return_str))

    return dates


async def run(args):
    """Main async search pipeline"""

    # Parse destinations and origins
    destinations = get_destination_airports(args.dest, args.places)
    origins = get_origin_airports(args.origins, args.origin_airports)
    cabin_code = get_cabin_code(args.cabin)
    cabin_name = CABIN_NAMES.get(cabin_code, "Economy")

    # Handle high season override
    if args.high_season:
        if args.high_season in HIGH_SEASON_DATES:
            season_info = HIGH_SEASON_DATES[args.high_season]
            depart_str = season_info["start"]
            return_str = season_info["end"]
            print(f"\nSeason override: {args.high_season} → {depart_str}")
        else:
            print(f"❌ Estación no reconocida: {args.high_season}")
            print(f"   Opciones: {', '.join(HIGH_SEASON_DATES.keys())}")
            return []
    else:
        depart_str = args.depart
        return_str = args.return_date

    # Generate date combinations
    if args.flex_days:
        dates = generate_date_combinations(depart_str, return_str, flex_days=args.flex_days)
    elif args.weeks:
        dates = generate_date_combinations(depart_str, return_str, weeks=args.weeks)
    else:
        dates = [(depart_str, return_str)]

    # Init database
    init_db()
    run_id = start_run(origins, destinations, [cabin_name], [])

    # Print header
    print("\n" + "=" * 70)
    print("✈️ FLIGHT HUNTER V2 — Error Fare & Anomaly Detector")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"🛫 Orígenes: {len(origins)} aeropuertos | Destinos: {len(destinations)} aeropuertos")
    print(f"📆 Fechas: {len(dates)} combinations | Cabina: {cabin_name}")
    print(f"🔍 Fuentes: SerpApi + Kiwi + Travelpayouts + Duffel (multi-source)")
    print()

    all_flights = []
    source_counts = {"serpapi": 0, "kiwi": 0, "travelpayouts": 0, "duffel": 0}

    # Build route list from origins × destinations
    routes = [(o, d) for o in origins for d in destinations]

    # ─────────────────────────────────────────
    # PHASE 1a: SerpApi — Google Flights (if quota available)
    # ─────────────────────────────────────────
    serpapi_remaining = get_serpapi_remaining()
    serpapi_key = load_serpapi_credentials()
    total_routes = len(routes) * len(dates)

    print("━" * 70)
    print(f"🔍 PHASE 1a: SerpApi — Google Flights (cuota restante: ~{serpapi_remaining}/100)")
    print("━" * 70)

    if serpapi_key and serpapi_remaining > 5:
        serpapi_budget = min(args.max_searches, serpapi_remaining - 5)  # Keep 5 reserve
        scraper = SerpApiScraper(serpapi_key)

        serpapi_flights = await scraper.search_routes(
            routes, dates, max_concurrent=2, budget_limit=serpapi_budget, cabin=cabin_code
        )
        all_flights.extend(serpapi_flights)
        source_counts["serpapi"] = len(serpapi_flights)
        update_serpapi_usage(scraper.searches_used)

        print(f"\n   📊 SerpApi: {len(serpapi_flights)} resultados encontrados")
    else:
        if serpapi_remaining <= 5:
            print(f"   ⚠️ SerpApi cuota agotada ({serpapi_remaining} restantes, reserva 5)")
        else:
            print("   ⚠️ SerpApi no configurado")
        print("   → Usando Kiwi.com como fuente principal")

    # ─────────────────────────────────────────
    # PHASE 1b: Kiwi.com Tequila API (if key available)
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("🔍 PHASE 1b: Kiwi.com Tequila API")
    print("━" * 70)

    kiwi = KiwiScraper()
    if kiwi.available:
        kiwi_flights = await kiwi.search_routes(
            routes, dates, max_concurrent=3, cabin=cabin_code
        )
        all_flights.extend(kiwi_flights)
        source_counts["kiwi"] = len(kiwi_flights)
        print(f"\n   📊 Kiwi: {len(kiwi_flights)} resultados encontrados")
    else:
        print("   ⚠️ Kiwi API key no configurada")
        print("   → Registrarse gratis en: https://tequila.kiwi.com/portal/login")
        print("   → Guardar key en: export KIWI_API_KEY=tu_key")
        print("   → O añadir KIWI_API_KEY='tu_key' en config.py")

    # ─────────────────────────────────────────
    # PHASE 1c: Travelpayouts / Aviasales (cached prices)
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("🔍 PHASE 1c: Travelpayouts — Aviasales (precios cached 2-7 días)")
    print("━" * 70)

    tp = TravelpayoutsScraper()
    if tp.available:
        tp_flights = await tp.search_routes(
            routes, dates, max_concurrent=5, cabin=cabin_code
        )
        all_flights.extend(tp_flights)
        source_counts["travelpayouts"] = len(tp_flights)
        print(f"\n   📊 Travelpayouts: {len(tp_flights)} resultados encontrados")
    else:
        print("   ⚠️ Travelpayouts token no configurado")
        print("   → Registrarse en: https://travelpayouts.com/")

    # ─────────────────────────────────────────
    # PHASE 1d: Duffel — Real-time airline data (300+ airlines)
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("🔍 PHASE 1d: Duffel — Real-time (300+ aerolíneas)")
    print("━" * 70)

    duffel = DuffelScraper()
    if duffel.available:
        # Duffel is powerful but slower — limit routes if too many
        duffel_routes = routes[:min(len(routes), 20)]  # Cap at 20 routes
        duffel_dates = dates[:min(len(dates), 3)]  # Cap at 3 date combos
        duffel_flights = await duffel.search_routes(
            duffel_routes, duffel_dates, max_concurrent=2, cabin=cabin_code
        )
        all_flights.extend(duffel_flights)
        source_counts["duffel"] = len(duffel_flights)
        print(f"\n   📊 Duffel: {len(duffel_flights)} resultados encontrados")
    else:
        print("   ⚠️ Duffel token no configurado")
        print("   → Registrarse en: https://duffel.com/")

    # ─────────────────────────────────────────
    # PHASE 1e: Cabin comparison (if --cabin-compare)
    # ─────────────────────────────────────────
    cabin_comparison_flights = []
    if args.cabin_compare and cabin_code == CABIN_BUSINESS and serpapi_key:
        print()
        print("━" * 70)
        print("🔍 PHASE 1e: Cabin Ratio Comparison (Economy vs Business)")
        print("━" * 70)

        # Search same routes in economy for T4 detection
        routes = [(o, d) for o in origins[:5] for d in destinations[:5]]  # Limit to save API calls

        # Create temp scraper with economy cabin selection
        # Note: We'll search and mark as economy in post-processing
        economy_flights = await scraper.search_routes(
            routes, dates[:2], max_concurrent=2, budget_limit=10
        )

        # Mark as economy and add to comparison set
        for f in economy_flights:
            f["cabin"] = "economy"
        cabin_comparison_flights.extend(economy_flights)
        print(f"\n   📊 Comparación: {len(economy_flights)} precios economy encontrados")

    # ─────────────────────────────────────────
    # DEDUPLICATION: Remove duplicate flights across sources
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("🔄 DEDUPLICATION: Consolidating flights from multiple sources")
    print("━" * 70)

    before_dedup = len(all_flights)
    seen = {}
    for f in all_flights:
        key = (f.get("origin"), f.get("destination"), f.get("date_out"),
               f.get("date_ret"), f.get("airline"), f.get("cabin", "Economy"))
        price = f.get("price_eur", 0)
        if key in seen:
            if price < seen[key].get("price_eur", float("inf")):
                seen[key] = f
        else:
            seen[key] = f
    unique_flights = list(seen.values())
    all_flights = unique_flights
    print(f"   Deduplication: {before_dedup} → {len(all_flights)} unique flights")

    # ─────────────────────────────────────────
    # PHASE 1f: Secret Flying (if --secret-flying)
    # ─────────────────────────────────────────
    secret_flying_deals = []
    if args.secret_flying and SecretFlyingScraper:
        print()
        print("━" * 70)
        print("🔍 PHASE 1c: Secret Flying — Published Error Fares")
        print("━" * 70)

        try:
            sf_scraper = SecretFlyingScraper()
            secret_flying_deals = await sf_scraper.scrape_all(max_pages=2)
            source_counts["secret_flying"] = len(secret_flying_deals)
            print(f"\n   📊 Secret Flying: {len(secret_flying_deals)} error fares encontrados")
        except Exception as e:
            print(f"   ⚠️ Secret Flying error: {str(e)[:80]}")

    # ─────────────────────────────────────────
    # PHASE 2: Save to database
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("💾 PHASE 2: Database Storage")
    print("━" * 70)

    saved = save_flights(all_flights, run_id=run_id)
    print(f"   Guardados: {saved} vuelos únicos en base de datos")

    # ─────────────────────────────────────────
    # PHASE 3: Anomaly Detection
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("🧠 PHASE 3: Anomaly Detection")
    print("━" * 70)

    # Detect flash drops from historical data
    flash_alerts = detect_flash_drops(all_flights, min_drop_pct=20)
    print(f"   Flash alerts: {len(flash_alerts)} detecciones")

    # Build flights_by_date for T1 cross-date comparison
    from collections import defaultdict
    flights_by_date = defaultdict(list)
    for f in all_flights:
        d = f.get("date_out", "unknown")
        flights_by_date[d].append(f)

    # Analyze all data with detection techniques
    anomalies = analyze_all(
        all_flights + cabin_comparison_flights,
        flights_by_date=dict(flights_by_date),
        date_ranges=dates,
        cabin=cabin_name.lower(),
    )

    errors = [a for a in anomalies if a["classification"] == "ERROR"]
    anomaly_list = [a for a in anomalies if a["classification"] == "ANOMALY"]
    deals = [a for a in anomalies if a["classification"] == "DEAL"]

    print(f"   🚨 ERRORES:     {len(errors)}")
    print(f"   ⚠️  ANOMALÍAS:   {len(anomaly_list)}")
    print(f"   💰 CHOLLOS:     {len(deals)}")

    # ─────────────────────────────────────────
    # PHASE 3b: Rankings
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("🎯 PHASE 3b: Rankings")
    print("━" * 70)

    top_value = rank_by_value(all_flights, top_n=30)
    top_cheap = rank_cheapest(all_flights, top_n=30)

    print(f"   ⭐ Top 30 mejores: {len(top_value)} items")
    print(f"   💰 Top 30 más baratos: {len(top_cheap)} items")

    # ─────────────────────────────────────────
    # PHASE 4: Report Generation
    # ─────────────────────────────────────────
    print()
    print("━" * 70)
    print("📋 PHASE 4: Report Generation")
    print("━" * 70)

    db_stats = get_stats()

    search_params = {
        "origins": origins,
        "destinations": destinations,
        "cabin": cabin_name,
        "date_from": dates[0][0] if dates else "N/A",
        "date_to": dates[-1][1] if dates else "N/A",
    }
    report = generate_report(
        anomalies=anomalies,
        all_flights=all_flights,
        search_params=search_params,
        flash_alerts=flash_alerts,
        db_stats=db_stats,
        top_value=top_value,
        top_cheap=top_cheap,
    )

    # Save report
    report_path = os.path.join(REPORT_DIR, "FLIGHT_ERRORES_PRECIO.md")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"   ✅ Reporte guardado: {report_path}")

    # Save raw JSON
    json_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "flight_hunter_results.json"
    )
    raw_data = {
        "search_time": datetime.now().isoformat(),
        "run_id": run_id,
        "sources": source_counts,
        "total_flights": len(all_flights),
        "anomalies_count": len(anomalies),
        "anomalies": anomalies[:100],  # Top 100 only
        "flash_alerts": flash_alerts[:50],
        "top_value": top_value[:30],
        "top_cheap": top_cheap[:30],
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(raw_data, f, indent=2, ensure_ascii=False, default=str)

    print(f"   ✅ JSON guardado: {json_path}")

    # Finish run
    finish_run(run_id, len(all_flights), len(anomalies))

    # ─────────────────────────────────────────
    # Summary
    # ─────────────────────────────────────────
    print()
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    for src, count in source_counts.items():
        print(f"   {src}: {count} resultados")
    print(f"   Total anomalías: {len(anomalies)} ({len(errors)} errores, {len(anomaly_list)} anomalías, {len(deals)} chollos)")
    print(f"   Flash alerts: {len(flash_alerts)}")
    print()

    return anomalies


def main():
    parser = argparse.ArgumentParser(
        description="Flight Hunter V2 — Error Fare & Anomaly Detector"
    )

    # Destination selection
    parser.add_argument(
        "--dest",
        type=str,
        default="volatile-quick",
        choices=[
            "caribbean", "mexico", "maldives", "southeast-asia", "japan-korea",
            "north-america", "south-america", "middle-east", "africa", "oceania",
            "volatile-quick", "all-long-haul", "custom"
        ],
        help="Destination preset"
    )
    parser.add_argument(
        "--places",
        type=str,
        help="Custom destination codes (comma-separated, e.g. 'PUJ,SDQ,CUN')"
    )

    # Origin selection
    parser.add_argument(
        "--origins",
        type=str,
        default="tier1",
        choices=["tier1", "tier2", "all", "custom"],
        help="Origin tier (default: tier1)"
    )
    parser.add_argument(
        "--origin-airports",
        type=str,
        help="Custom origin codes (comma-separated, e.g. 'CDG,FRA,AMS')"
    )

    # Dates
    parser.add_argument(
        "--depart",
        type=str,
        required=True,
        help="Departure date YYYY-MM-DD"
    )
    parser.add_argument(
        "--return-date",
        type=str,
        required=True,
        help="Return date YYYY-MM-DD"
    )

    # Cabin
    parser.add_argument(
        "--cabin",
        type=str,
        default="economy",
        choices=["economy", "premium", "business", "first"],
        help="Cabin class (default: economy)"
    )

    # Flexibility
    parser.add_argument(
        "--weeks",
        type=int,
        default=4,
        help="Number of weeks to compare (default: 4)"
    )
    parser.add_argument(
        "--flex-days",
        type=int,
        default=3,
        help="Flexibility days around target dates (default: 3, searches -3 to +3)"
    )

    # High season
    parser.add_argument(
        "--high-season",
        type=str,
        help="Use predefined dates: summer_peak, christmas, new_year, etc."
    )

    # API budget
    parser.add_argument(
        "--max-searches",
        type=int,
        default=90,
        help="Max SerpApi searches to use (default: 90, free tier: 100/month)"
    )

    # Techniques
    parser.add_argument(
        "--cabin-compare",
        action="store_true",
        help="Enable cabin ratio comparison (search both economy + business)"
    )
    parser.add_argument(
        "--all-techniques",
        action="store_true",
        help="Enable all detection techniques"
    )

    # Secret Flying
    parser.add_argument(
        "--secret-flying",
        action="store_true",
        help="Also scrape Secret Flying for published error fares"
    )

    # Deep search mode
    parser.add_argument(
        "--deep",
        action="store_true",
        help="Deep search mode (all origins, all techniques)"
    )

    args = parser.parse_args()

    # Apply --deep mode
    if args.deep:
        args.origins = "all"
        args.dest = "all-long-haul"
        args.cabin_compare = True
        args.all_techniques = True
        args.secret_flying = True

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
