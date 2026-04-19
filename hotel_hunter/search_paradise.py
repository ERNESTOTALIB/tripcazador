"""
Search paradise beaches across Mediterranean for best price/quality ratio
Style: like Manolo Beach Resort (beachfront, good score, any star rating)
"""
import asyncio
import random
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
from scraper import create_context, scrape_destination, build_url, DELAY_BETWEEN_SEARCHES

# Paradise beach destinations - focus on stunning beaches
DESTINATIONS = {
    # 🇬🇷 Grecia — islas paradisíacas
    "Creta": "Crete",
    "Rodas": "Rhodes",
    "Kos": "Kos", 
    "Corfú": "Corfu",
    "Zakynthos": "Zakynthos",
    "Lefkada": "Lefkada",
    "Kefalonia": "Kefalonia",
    "Naxos": "Naxos",
    "Paros": "Paros",
    "Milos": "Milos",
    # 🇦🇱 Albania — Riviera albanesa
    "Ksamil": "Ksamil",
    "Sarandë": "Sarandë",
    "Dhërmi": "Dhërmi",
    # 🇲🇪 Montenegro
    "Budva": "Budva",
    "Kotor": "Kotor",
    # 🇭🇷 Croacia
    "Dubrovnik": "Dubrovnik",
    "Split": "Split",
    "Hvar": "Hvar",
    # 🇹🇷 Turquía — costa turquesa
    "Ölüdeniz": "Oludeniz",
    "Kas": "Kas",
    "Bodrum": "Bodrum",
    "Fethiye": "Fethiye",
    "Antalya": "Antalya",
    # 🇮🇹 Italia — playas paradisíacas
    "Cerdeña": "Sardinia",
    "Puglia": "Puglia",
    "Tropea": "Tropea",
    # 🇵🇹 Portugal
    "Algarve": "Algarve",
    # 🇪🇸 España
    "Menorca": "Menorca",
    "Formentera": "Formentera",
}

# Flexible dates: scan July-August every 7 days
FLEX_START = "2027-07-01"
FLEX_END = "2027-08-21"
NIGHTS = 21
FLEX_STEP = 7  # check every week
CONCURRENT = 3

async def main():
    print("=" * 70)
    print("🏖️ PARADISE BEACH HUNTER — Mediterráneo Verano 2027")
    print("   Estilo Manolo: playa de arena, buena nota, mejor precio")
    print("   Sin mínimo de estrellas — buscando joyas ocultas")
    print("=" * 70)
    print(f"📅 Fechas flexibles: {FLEX_START} → {FLEX_END} (step {FLEX_STEP} días)")
    print(f"🌙 {NIGHTS} noches | 2 adultos")
    print(f"🗺️  {len(DESTINATIONS)} destinos paradisíacos")
    print(f"🔍 Filtros: playa + desayuno (sin filtro estrellas para más resultados)")
    print()

    # Generate check-in dates
    start_dt = datetime.strptime(FLEX_START, "%Y-%m-%d")
    end_dt = datetime.strptime(FLEX_END, "%Y-%m-%d")
    date_list = []
    current = start_dt
    while current <= end_dt - timedelta(days=NIGHTS):
        ci = current.strftime("%Y-%m-%d")
        co = (current + timedelta(days=NIGHTS)).strftime("%Y-%m-%d")
        date_list.append((ci, co))
        current += timedelta(days=FLEX_STEP)
    
    print(f"📅 {len(date_list)} fechas de check-in a probar")
    total_searches = len(DESTINATIONS) * len(date_list)
    print(f"⏱️  ~{total_searches} búsquedas, ~{total_searches * 7 // 60} min estimado")
    print()

    results_by_date = {}
    best_by_hotel = {}  # {(dest, name): (price, date, hotel_data)}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        done = 0
        
        for ci, co in date_list:
            results_by_date[ci] = []
            tasks = [(name, query, ci, co) for name, query in DESTINATIONS.items()]
            
            for batch_start in range(0, len(tasks), CONCURRENT):
                batch = tasks[batch_start:batch_start + CONCURRENT]
                contexts_and_pages = []
                for _ in range(len(batch)):
                    ctx = await create_context(browser)
                    pg = await ctx.new_page()
                    contexts_and_pages.append((ctx, pg))
                
                async def scrape_task(idx, ctx, pg, name, query, ci_d, co_d):
                    nonlocal done
                    done += 1
                    print(f"   [{done}/{total_searches}] {name} ({ci_d})...", end=" ", flush=True)
                    
                    # Search with beach + breakfast, NO star filter, NO hotel-only filter
                    hotels = await scrape_destination(
                        pg, name, query, ci_d, co_d, adults=2, pages=1,
                        beachfront=True, breakfast=True,
                        all_inclusive=False, sea_view=False,
                        min_stars=0,  # No star filter!
                        pool=False, free_cancel=False,
                        no_hotel_filter=True,  # Include all types
                        no_stars_filter=True,   # No star filter
                    )
                    
                    if hotels:
                        cheapest = min(h["price_total"] for h in hotels)
                        print(f"✅ {len(hotels)} ({cheapest}€)", flush=True)
                    else:
                        print(f"—", flush=True)
                    return hotels
                
                coroutines = [
                    scrape_task(idx, ctx, pg, name, query, ci_d, co_d)
                    for idx, ((ctx, pg), (name, query, ci_d, co_d)) in enumerate(zip(contexts_and_pages, batch))
                ]
                batch_results = await asyncio.gather(*coroutines)
                
                for hotels in batch_results:
                    results_by_date[ci].extend(hotels)
                    for h in hotels:
                        key = (h["destination"], h["name"])
                        price = h["price_total"]
                        if key not in best_by_hotel or price < best_by_hotel[key][0]:
                            best_by_hotel[key] = (price, ci, h)
                    await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))
                
                for ctx, pg in contexts_and_pages:
                    await ctx.close()
        
        await browser.close()
    
    # ═══ ANALYSIS ═══
    all_hotels = []
    for hotels in results_by_date.values():
        all_hotels.extend(hotels)
    
    unique = len(set((h["destination"], h["name"]) for h in all_hotels))
    print(f"\n📊 {len(all_hotels)} resultados | {unique} hoteles únicos")
    
    # Sort best_by_hotel by price per night
    sorted_best = sorted(best_by_hotel.values(), key=lambda x: x[0] / NIGHTS)
    
    # Filter: reasonable prices only (> 500€ total for 21 nights)
    sorted_best = [(p, d, h) for p, d, h in sorted_best if p > 500 and p / NIGHTS < 500]
    
    print(f"\n{'='*70}")
    print(f"🏆 TOP 40 MEJORES PRECIOS — Playas Paradisíacas Mediterráneo")
    print(f"   21 noches, 2 adultos, playa + desayuno")
    print(f"{'='*70}")
    print(f"\n{'#':>3} {'Hotel':<42} {'Destino':<14} {'★':>2} {'Nota':>5} {'Total':>8} {'€/n':>6} {'Check-in':>10}")
    print("-" * 95)
    
    for i, (price, best_date, h) in enumerate(sorted_best[:40], 1):
        ppn = price / NIGHTS
        stars = h.get("stars", 0)
        star_str = f"{stars}" if stars else "-"
        score = h.get("score", 0)
        score_str = f"{score}" if score else "-"
        name = h["name"][:41]
        dest = h["destination"][:13]
        sea = "🌊" if h.get("sea") or h.get("beachBadge") else ""
        
        print(f"{i:>3} {name:<42} {dest:<14} {star_str:>2} {score_str:>5} {price:>7.0f}€ {ppn:>5.0f}€ {best_date:>10} {sea}")
    
    # Group by country
    print(f"\n{'='*70}")
    print(f"📊 RESUMEN POR ZONA")
    print(f"{'='*70}")
    
    countries = {
        "Grecia": ["Creta", "Rodas", "Kos", "Corfú", "Zakynthos", "Lefkada", "Kefalonia", "Naxos", "Paros", "Milos"],
        "Albania": ["Ksamil", "Sarandë", "Dhërmi"],
        "Montenegro": ["Budva", "Kotor"],
        "Croacia": ["Dubrovnik", "Split", "Hvar"],
        "Turquía": ["Ölüdeniz", "Kas", "Bodrum", "Fethiye", "Antalya"],
        "Italia": ["Cerdeña", "Puglia", "Tropea"],
        "Portugal": ["Algarve"],
        "España": ["Menorca", "Formentera"],
    }
    
    for country, dests in countries.items():
        country_hotels = [(p, d, h) for p, d, h in sorted_best if h["destination"] in dests]
        if country_hotels:
            cheapest_ppn = min(p/NIGHTS for p, _, _ in country_hotels)
            avg_ppn = sum(p/NIGHTS for p, _, _ in country_hotels) / len(country_hotels)
            best_h = min(country_hotels, key=lambda x: x[0])
            print(f"\n  🏖️ {country}: {len(country_hotels)} hoteles | desde {cheapest_ppn:.0f}€/n | media {avg_ppn:.0f}€/n")
            print(f"     Mejor: {best_h[2]['name'][:40]} ({best_h[2]['destination']}) — {best_h[0]:.0f}€ total")
    
    # High quality picks (score >= 8.5 AND cheapest)
    print(f"\n{'='*70}")
    print(f"⭐ TOP 10 RELACIÓN CALIDAD-PRECIO (nota ≥ 8.5)")
    print(f"{'='*70}")
    
    quality_picks = [(p, d, h) for p, d, h in sorted_best if h.get("score", 0) >= 8.5]
    quality_picks.sort(key=lambda x: x[0] / NIGHTS)
    
    for i, (price, best_date, h) in enumerate(quality_picks[:10], 1):
        ppn = price / NIGHTS
        stars = h.get("stars", 0)
        score = h.get("score", 0)
        print(f"   {i}. {h['name'][:45]} ({h['destination']})")
        print(f"      {stars}★ | Nota {score} | {price:.0f}€ total ({ppn:.0f}€/n) | Check-in: {best_date}")
        if h.get("link"):
            print(f"      {h['link']}")

asyncio.run(main())
