"""
Search MANOLO Beach Resort via real browser — accurate table extraction
"""
import asyncio
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

HOTEL_BASE = "https://www.booking.com/hotel/tz/manolo-beach-resort.es.html"

PERIODS = [
    ("Navidad 2026 (7n)",        "2026-12-23", "2026-12-30"),
    ("Fin de Año 2026 (7n)",     "2026-12-28", "2027-01-04"),
    ("Febrero 2027 (7n)",        "2027-02-14", "2027-02-21"),
    ("Marzo 2027 (7n)",          "2027-03-15", "2027-03-22"),
    ("Semana Santa 2027 (7n)",   "2027-04-10", "2027-04-17"),
    ("Mayo 2027 (7n)",           "2027-05-01", "2027-05-08"),
    ("Junio 2027 (7n)",          "2027-06-15", "2027-06-22"),
    ("Junio 2027 (14n)",         "2027-06-15", "2027-06-29"),
    ("Julio 2027 (7n)",          "2027-07-01", "2027-07-08"),
    ("Julio 2027 (14n)",         "2027-07-01", "2027-07-15"),
    ("Agosto 2027 (7n)",         "2027-08-01", "2027-08-08"),
    ("Agosto 2027 (14n)",        "2027-08-01", "2027-08-15"),
    ("Septiembre 2027 (7n)",     "2027-09-15", "2027-09-22"),
    ("Octubre 2027 (7n)",        "2027-10-12", "2027-10-19"),
    ("Navidad 2027 (7n)",        "2027-12-23", "2027-12-30"),
    ("Fin de Año 2027 (7n)",     "2027-12-28", "2028-01-04"),
]

EXTRACT_JS = """() => {
    // Check if redirected to search results (no availability)
    if (window.location.href.includes('searchresults')) {
        return {available: false, reason: 'redirected_to_search'};
    }
    
    const rows = document.querySelectorAll('#hprt-table tbody tr, .hprt-table tbody tr');
    const results = [];
    let currentRoom = '';
    
    for (const row of rows) {
        const roomLink = row.querySelector('.hprt-roomtype-icon-link, a[data-room-name]');
        if (roomLink) currentRoom = roomLink.textContent.trim();
        
        const priceCell = row.querySelector('td.hprt-table-cell-price');
        if (!priceCell) continue;
        
        const priceText = priceCell.innerText;
        const allNums = priceText.match(/[\\d.]+/g) || [];
        const prices = allNums.map(n => parseFloat(n.replace(/\\./g, ''))).filter(p => p > 100 && p < 50000);
        
        const discountEl = priceCell.querySelector('.bui-badge');
        const discount = discountEl ? discountEl.textContent.trim() : '';
        
        // Check occupancy from icons in the occupancy cell  
        const occCell = row.querySelector('td.hprt-table-cell-occupancy');
        let occ = 0;
        if (occCell) {
            const icons = occCell.querySelectorAll('.bk-icon-wrapper--occupancy');
            occ = icons.length;
            if (occ === 0) {
                // Fallback: count person SVGs or aria labels
                const allIcons = occCell.querySelectorAll('svg, i, [class*="icon"]');
                occ = allIcons.length;
            }
        }
        
        // Availability urgency
        const urgEl = row.querySelector('[class*="urgency"], .sr_urgency_message');
        const urgency = urgEl ? urgEl.textContent.trim() : '';
        
        if (prices.length > 0) {
            results.push({
                room: currentRoom,
                occupancy: occ,
                origPrice: prices.length > 1 ? Math.max(...prices) : null,
                price: Math.min(...prices),
                discount,
                urgency,
            });
        }
    }
    
    if (results.length === 0) {
        // Check for no-availability message
        const body = document.body.innerText.toLowerCase();
        if (body.includes('no tiene disponibilidad') || body.includes('sold out') || body.includes('no availability')) {
            return {available: false, reason: 'sold_out'};
        }
        return {available: null, reason: 'no_prices_found', url: window.location.href};
    }
    
    return {available: true, rooms: results};
}"""

MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

async def fetch_prices(browser, checkin, checkout, ua, is_mobile=False):
    ctx = await browser.new_context(
        user_agent=ua,
        viewport={"width": 375, "height": 812} if is_mobile else {"width": 1920, "height": 1080},
        is_mobile=is_mobile,
        locale="es-ES",
    )
    page = await ctx.new_page()
    url = f"{HOTEL_BASE}?checkin={checkin}&checkout={checkout}&group_adults=2&no_rooms=1&group_children=0&selected_currency=EUR"
    
    try:
        await page.goto(url, timeout=30000, wait_until="domcontentloaded")
        await asyncio.sleep(3)
        
        # Scroll to availability
        await page.evaluate("""() => {
            const el = document.querySelector('#hprt-table, #availability');
            if (el) el.scrollIntoView({behavior: 'instant'});
            else window.scrollTo(0, 800);
        }""")
        await asyncio.sleep(2)
        
        data = await page.evaluate(EXTRACT_JS)
        await ctx.close()
        return data
    except Exception as e:
        await ctx.close()
        return {"available": None, "reason": f"error: {str(e)[:60]}"}


async def main():
    print("=" * 75)
    print("🏨 MANOLO Beach Resort — Zanzibar, Tanzania")
    print("   3★ | Nota 9.0 | Frente a la playa | Uroa")
    print("   Búsqueda multi-período: desktop + móvil")
    print("=" * 75)
    
    all_data = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for i, (name, ci, co) in enumerate(PERIODS, 1):
            nights = (datetime.strptime(co, "%Y-%m-%d") - datetime.strptime(ci, "%Y-%m-%d")).days
            print(f"\n[{i}/{len(PERIODS)}] {name} ({ci} → {co}, {nights}n)")
            
            # Desktop
            desk = await fetch_prices(browser, ci, co, DESKTOP_UA, False)
            if desk.get("available") and desk.get("rooms"):
                rooms = desk["rooms"]
                # Find cheapest for 2 adults (first rows are usually 2-pax)
                # The table alternates: 2-pax row, 1-pax row per room type
                two_pax = [r for i_r, r in enumerate(rooms) if i_r % 2 == 0]
                if not two_pax: two_pax = rooms
                cheapest = min(r["price"] for r in two_pax)
                c_room = next(r for r in two_pax if r["price"] == cheapest)
                orig = c_room.get("origPrice") or cheapest
                disc = c_room.get("discount", "")
                urg = c_room.get("urgency", "")
                print(f"   💻 {cheapest:.0f}€ ({cheapest/nights:.0f}€/n) | {c_room['room'][:40]} {disc} {urg}")
                desk_price = cheapest
                desk_ppn = cheapest / nights
            elif desk.get("available") is False:
                print(f"   💻 ❌ Sin disponibilidad ({desk.get('reason','')})")
                desk_price = None
                desk_ppn = None
            else:
                print(f"   💻 ⚠️ {desk.get('reason','unknown')}")
                desk_price = None
                desk_ppn = None
            
            await asyncio.sleep(1.5)
            
            # Mobile
            mob = await fetch_prices(browser, ci, co, MOBILE_UA, True)
            if mob.get("available") and mob.get("rooms"):
                rooms = mob["rooms"]
                two_pax = [r for i_r, r in enumerate(rooms) if i_r % 2 == 0]
                if not two_pax: two_pax = rooms
                cheapest_m = min(r["price"] for r in two_pax)
                c_room_m = next(r for r in two_pax if r["price"] == cheapest_m)
                disc_m = c_room_m.get("discount", "")
                print(f"   📱 {cheapest_m:.0f}€ ({cheapest_m/nights:.0f}€/n) | {c_room_m['room'][:40]} {disc_m}")
                mob_price = cheapest_m
                mob_ppn = cheapest_m / nights
            elif mob.get("available") is False:
                print(f"   📱 ❌ Sin disponibilidad")
                mob_price = None
                mob_ppn = None
            else:
                print(f"   📱 ⚠️ {mob.get('reason','unknown')}")
                mob_price = None
                mob_ppn = None
            
            # Compare
            if desk_price and mob_price:
                diff = desk_price - mob_price
                if diff > 0:
                    print(f"   📲 MÓVIL ahorra {diff:.0f}€ ({diff/desk_price*100:.0f}%)")
                elif diff < 0:
                    print(f"   💻 DESKTOP ahorra {-diff:.0f}€ ({-diff/mob_price*100:.0f}%)")
                else:
                    print(f"   = Mismo precio")
            
            all_data.append({
                "name": name, "ci": ci, "co": co, "nights": nights,
                "desk_price": desk_price, "desk_ppn": desk_ppn,
                "mob_price": mob_price, "mob_ppn": mob_ppn,
                "desk_rooms": desk.get("rooms", []),
                "mob_rooms": mob.get("rooms", []),
            })
            
            await asyncio.sleep(1.5)
        
        await browser.close()
    
    # ═══ FINAL SUMMARY ═══
    print("\n" + "=" * 75)
    print("📊 TABLA COMPARATIVA FINAL — MANOLO Beach Resort, Zanzibar")
    print("=" * 75)
    print(f"\n{'Período':<28} {'N':>3} {'Desktop':>10} {'€/n':>6} {'Móvil':>10} {'€/n':>6} {'Mejor':>12}")
    print("-" * 82)
    
    for d in all_data:
        dp = d["desk_price"]
        mp = d["mob_price"]
        n = d["nights"]
        
        d_str = f"{dp:.0f}€" if dp else "N/A"
        m_str = f"{mp:.0f}€" if mp else "N/A"
        d_ppn = f"{dp/n:.0f}€" if dp else "-"
        m_ppn = f"{mp/n:.0f}€" if mp else "-"
        
        best = ""
        best_price = None
        if dp and mp:
            if mp < dp:
                best = f"📱 -{dp-mp:.0f}€"
                best_price = mp
            elif dp < mp:
                best = f"💻 -{mp-dp:.0f}€"
                best_price = dp
            else:
                best = "="
                best_price = dp
        elif dp:
            best_price = dp
            best = "💻 only"
        elif mp:
            best_price = mp
            best = "📱 only"
        
        print(f"{d['name']:<28} {n:>3} {d_str:>10} {d_ppn:>6} {m_str:>10} {m_ppn:>6} {best:>12}")
    
    # Best overall
    available = [d for d in all_data if d["desk_price"] or d["mob_price"]]
    if available:
        def best_ppn(d):
            prices = [p for p in [d["desk_ppn"], d["mob_ppn"]] if p]
            return min(prices) if prices else 99999
        
        best = min(available, key=best_ppn)
        bp = best_ppn(best)
        total = min(p for p in [best["desk_price"], best["mob_price"]] if p)
        print(f"\n🏆 MEJOR PRECIO/NOCHE: {best['name']} → {bp:.0f}€/noche ({total:.0f}€ total)")
    
    # All room types for cheapest period
    if available:
        cheapest_period = min(available, key=lambda d: min(p for p in [d["desk_price"], d["mob_price"]] if p))
        if cheapest_period.get("desk_rooms"):
            print(f"\n📋 Habitaciones disponibles ({cheapest_period['name']}):")
            seen = set()
            for r in cheapest_period["desk_rooms"]:
                key = (r["room"], r["price"])
                if key not in seen:
                    seen.add(key)
                    orig = f" (antes {r['origPrice']:.0f}€)" if r.get("origPrice") else ""
                    print(f"   • {r['room']}: {r['price']:.0f}€{orig} {r.get('discount','')}")

asyncio.run(main())
