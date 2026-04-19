"""
Paradise Beach Search v2 — reduced destinations, faster execution
Focus on destinations that already showed good results + remaining dates
"""
import asyncio
import random
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
from scraper import create_context, scrape_destination, DELAY_BETWEEN_SEARCHES

# Best-performing destinations from v1 + fill gaps
DESTINATIONS = {
    # 🇬🇷 Grecia (best results)
    "Creta": "Crete",
    "Rodas": "Rhodes",
    "Kos": "Kos",
    "Lefkada": "Lefkada",
    "Paros": "Paros",
    "Zakynthos": "Zakynthos",
    # 🇦🇱 Albania  
    "Ksamil": "Ksamil",
    "Sarandë": "Sarandë",
    # 🇲🇪 Montenegro (very cheap)
    "Budva": "Budva",
    # 🇭🇷 Croacia
    "Hvar": "Hvar",
    "Split": "Split",
    # 🇹🇷 Turquía (good value)
    "Kas": "Kas",
    "Fethiye": "Fethiye",
    "Antalya": "Antalya",
    # 🇮🇹 Italia (cheapest surprises)
    "Cerdeña": "Sardinia",
    "Puglia": "Puglia",
    "Tropea": "Tropea",
    # 🇵🇹 Portugal
    "Algarve": "Algarve",
    # 🇪🇸 España
    "Formentera": "Formentera",
}

FLEX_DATES = [
    ("2027-07-01", "2027-07-22"),
    ("2027-07-08", "2027-07-29"),
    ("2027-07-15", "2027-08-05"),
    ("2027-07-22", "2027-08-12"),
    ("2027-08-01", "2027-08-22"),
]

CONCURRENT = 3

async def main():
    print("=" * 70)
    print("🏖️ PARADISE BEACH HUNTER v2 — Mediterráneo Verano 2027")
    print("   Playa de arena + desayuno | Sin filtro estrellas")
    print("=" * 70)
    print(f"🗺️  {len(DESTINATIONS)} destinos | {len(FLEX_DATES)} fechas | {len(DESTINATIONS)*len(FLEX_DATES)} búsquedas")
    print()

    best_by_hotel = {}
    all_hotels = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        done = 0
        total = len(DESTINATIONS) * len(FLEX_DATES)
        
        for ci, co in FLEX_DATES:
            tasks = [(name, query, ci, co) for name, query in DESTINATIONS.items()]
            
            for batch_start in range(0, len(tasks), CONCURRENT):
                batch = tasks[batch_start:batch_start + CONCURRENT]
                ctx_pages = []
                for _ in range(len(batch)):
                    ctx = await create_context(browser)
                    pg = await ctx.new_page()
                    ctx_pages.append((ctx, pg))
                
                async def scrape_task(ctx, pg, name, query, ci_d, co_d):
                    nonlocal done
                    done += 1
                    print(f"   [{done}/{total}] {name} ({ci_d})...", end=" ", flush=True)
                    hotels = await scrape_destination(
                        pg, name, query, ci_d, co_d, adults=2, pages=1,
                        beachfront=True, breakfast=True,
                        all_inclusive=False, sea_view=False,
                        min_stars=0, pool=False, free_cancel=False,
                        no_hotel_filter=True, no_stars_filter=True,
                    )
                    if hotels:
                        cheapest = min(h["price_total"] for h in hotels)
                        print(f"✅ {len(hotels)} ({cheapest}€)", flush=True)
                    else:
                        print(f"—", flush=True)
                    return hotels
                
                coros = [
                    scrape_task(ctx, pg, name, query, ci_d, co_d)
                    for (ctx, pg), (name, query, ci_d, co_d) in zip(ctx_pages, batch)
                ]
                batch_results = await asyncio.gather(*coros)
                
                for hotels in batch_results:
                    all_hotels.extend(hotels)
                    for h in hotels:
                        key = (h["destination"], h["name"])
                        price = h["price_total"]
                        if key not in best_by_hotel or price < best_by_hotel[key][0]:
                            best_by_hotel[key] = (price, ci, h)
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                
                for ctx, pg in ctx_pages:
                    await ctx.close()
        
        await browser.close()
    
    unique = len(best_by_hotel)
    print(f"\n📊 {len(all_hotels)} resultados | {unique} hoteles únicos")
    
    # Sort by price per night
    NIGHTS = 21
    sorted_best = sorted(best_by_hotel.values(), key=lambda x: x[0])
    sorted_best = [(p, d, h) for p, d, h in sorted_best if p > 500 and p / NIGHTS < 600]
    
    print(f"\n{'='*75}")
    print(f"🏆 TOP 50 MEJORES PRECIOS — Playas Paradisíacas Mediterráneo (21 noches)")
    print(f"{'='*75}")
    print(f"\n{'#':>3} {'Hotel':<40} {'Destino':<12} {'★':>2} {'Nota':>5} {'Total':>8} {'€/n':>6} {'Fecha':>10} {'🌊':>2}")
    print("-" * 95)
    
    for i, (price, best_date, h) in enumerate(sorted_best[:50], 1):
        ppn = price / NIGHTS
        stars = h.get("stars", 0) or 0
        star_str = f"{stars}" if stars else "-"
        score = h.get("score", 0) or 0
        score_str = f"{score}" if score else "-"
        name = h["name"][:39]
        dest = h["destination"][:11]
        sea = "🌊" if h.get("sea") or h.get("beachBadge") else ""
        
        print(f"{i:>3} {name:<40} {dest:<12} {star_str:>2} {score_str:>5} {price:>7.0f}€ {ppn:>5.0f}€ {best_date:>10} {sea}")
    
    # Quality picks
    print(f"\n{'='*75}")
    print(f"⭐ TOP 15 CALIDAD-PRECIO (nota ≥ 8.5, mejor €/noche)")
    print(f"{'='*75}")
    
    quality = [(p, d, h) for p, d, h in sorted_best if (h.get("score") or 0) >= 8.5]
    quality.sort(key=lambda x: x[0])
    
    for i, (price, best_date, h) in enumerate(quality[:15], 1):
        ppn = price / NIGHTS
        stars = h.get("stars", 0) or 0
        score = h.get("score", 0) or 0
        print(f"   {i:>2}. {h['name'][:45]} ({h['destination']})")
        print(f"       {stars}★ | Nota {score} | {price:.0f}€ ({ppn:.0f}€/n) | {best_date}")
        if h.get("link"):
            print(f"       {h['link'][:100]}")
    
    # Country summary
    print(f"\n{'='*75}")
    print(f"📊 RESUMEN POR PAÍS")
    print(f"{'='*75}")
    
    countries = {
        "🇬🇷 Grecia": ["Creta", "Rodas", "Kos", "Lefkada", "Paros", "Zakynthos"],
        "🇦🇱 Albania": ["Ksamil", "Sarandë"],
        "🇲🇪 Montenegro": ["Budva"],
        "🇭🇷 Croacia": ["Hvar", "Split"],
        "🇹🇷 Turquía": ["Kas", "Fethiye", "Antalya"],
        "🇮🇹 Italia": ["Cerdeña", "Puglia", "Tropea"],
        "🇵🇹 Portugal": ["Algarve"],
        "🇪🇸 España": ["Formentera"],
    }
    
    for country, dests in countries.items():
        ch = [(p, d, h) for p, d, h in sorted_best if h["destination"] in dests]
        if ch:
            min_ppn = min(p/NIGHTS for p, _, _ in ch)
            avg_ppn = sum(p/NIGHTS for p, _, _ in ch) / len(ch)
            best = min(ch, key=lambda x: x[0])
            print(f"  {country}: {len(ch)} hoteles | desde {min_ppn:.0f}€/n | media {avg_ppn:.0f}€/n")
            print(f"    → {best[2]['name'][:42]} — {best[0]:.0f}€ total ({best[0]/NIGHTS:.0f}€/n)")

asyncio.run(main())
