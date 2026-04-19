"""
Search MANOLO Beach Resort Zanzibar — accurate price extraction
Reads directly from the room availability table
"""
import asyncio
import random
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

HOTEL_URL = "https://www.booking.com/hotel/tz/manolo-beach-resort.html"

DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

PERIODS = {
    "Navidad 2026 (7n)":          ("2026-12-23", "2026-12-30"),
    "Fin de Año 2026 (7n)":       ("2026-12-28", "2027-01-04"),
    "Febrero 2027 (7n)":          ("2027-02-14", "2027-02-21"),
    "Semana Santa 2027 (7n)":     ("2027-04-10", "2027-04-17"),
    "Semana Santa 2027 (10n)":    ("2027-04-09", "2027-04-19"),
    "Mayo 2027 (7n)":             ("2027-05-01", "2027-05-08"),
    "Junio 2027 (7n)":            ("2027-06-15", "2027-06-22"),
    "Junio 2027 (14n)":           ("2027-06-15", "2027-06-29"),
    "Julio 2027 (7n)":            ("2027-07-01", "2027-07-08"),
    "Julio 2027 (14n)":           ("2027-07-01", "2027-07-15"),
    "Agosto 2027 (7n)":           ("2027-08-01", "2027-08-08"),
    "Agosto 2027 (14n)":          ("2027-08-01", "2027-08-15"),
    "Septiembre 2027 (7n)":       ("2027-09-15", "2027-09-22"),
    "Octubre 2027 (7n)":          ("2027-10-12", "2027-10-19"),
    "Noviembre 2027 (7n)":        ("2027-11-01", "2027-11-08"),
    "Navidad 2027 (7n)":          ("2027-12-23", "2027-12-30"),
    "Fin de Año 2027 (7n)":       ("2027-12-28", "2028-01-04"),
}

# JS to extract prices from the room availability table
EXTRACT_TABLE_JS = """() => {
    const rooms = [];
    
    // The availability table has rows with room types and prices
    // Each row has: room type name, occupancy icons, price column, conditions
    const table = document.querySelector('#hprt-table, [class*="hprt-table"], table.hprt-table');
    
    if (table) {
        const rows = table.querySelectorAll('tr');
        const results = [];
        let currentRoomName = '';
        
        for (const row of rows) {
            // Get room name if present
            const roomNameEl = row.querySelector('.hprt-roomtype-icon-link, [data-room-name], a[class*="roomtype"]');
            if (roomNameEl) {
                currentRoomName = roomNameEl.textContent.trim();
            }
            
            // Get price - look for the actual price display (not crossed out)
            const priceCell = row.querySelector('.hprt-price-type-price, td[class*="price"]');
            if (!priceCell) continue;
            
            // Current price (not strikethrough)
            const currentPriceEl = priceCell.querySelector('.bui-price-display__value, [data-testid="price-and-discounted-price"]');
            // Original price (strikethrough)  
            const origPriceEl = priceCell.querySelector('.bui-price-display__original, .bui-u-sr-only + span');
            
            let currentPrice = 0;
            let origPrice = 0;
            let discount = '';
            
            // Parse the cell text for EUR prices
            const cellText = priceCell.innerText;
            // Match patterns like "€ 1.359" or "€1.359" or "1.359 €"
            const priceMatches = cellText.match(/€\\s*([\\d.]+(?:,[\\d]+)?)|([\\d.]+(?:,[\\d]+)?)\\s*€/g) || [];
            const parsedPrices = priceMatches.map(m => {
                const cleaned = m.replace(/[€\\s]/g, '').replace(/\\./g, '').replace(',', '.');
                return parseFloat(cleaned);
            }).filter(p => p > 50 && p < 50000);
            
            // Look for discount badge
            const discountEl = priceCell.querySelector('[class*="discount"], .bui-badge');
            if (discountEl) discount = discountEl.textContent.trim();
            
            // Get occupancy
            const occCell = row.querySelector('.hprt-occupancy-occupancy-info, td[class*="occupancy"]');
            const occ = occCell ? occCell.querySelectorAll('.bui-u-sr-only, [aria-hidden="true"]').length : 0;
            // Better: count person icons
            const personIcons = row.querySelectorAll('.bk-icon-wrapper--occupancy');
            const occupancy = personIcons.length || occ;
            
            // Get availability note
            const availNote = row.querySelector('[class*="urgency"], .sr_urgency_message');
            const urgency = availNote ? availNote.textContent.trim() : '';
            
            if (parsedPrices.length > 0) {
                // If 2 prices, first is original (higher), second is current (lower)
                if (parsedPrices.length >= 2) {
                    origPrice = Math.max(...parsedPrices);
                    currentPrice = Math.min(...parsedPrices);
                } else {
                    currentPrice = parsedPrices[0];
                }
                
                results.push({
                    roomName: currentRoomName,
                    price: currentPrice,
                    origPrice: origPrice,
                    discount: discount,
                    occupancy: occupancy,
                    urgency: urgency,
                });
            }
        }
        return {found: true, rooms: results};
    }
    
    // Fallback: look for price elements anywhere
    const allPriceEls = document.querySelectorAll('[data-testid="price-and-discounted-price"], .bui-price-display__value, .prco-valign-middle-helper');
    const fallbackPrices = [];
    allPriceEls.forEach(el => {
        const text = el.textContent.replace(/[€EUR\\s]/g, '').replace(/\\./g, '').replace(',', '.');
        const num = parseFloat(text);
        if (num > 50 && num < 50000) fallbackPrices.push(num);
    });
    
    // Check for no availability
    const bodyText = document.body.innerText.toLowerCase();
    const noAvail = bodyText.includes('no queda') || bodyText.includes('sold out') || 
                    bodyText.includes('no availability') || bodyText.includes('no hay disponibilidad');
    
    // Mobile deal check
    const mobileDeal = bodyText.includes('precio para móvil') || bodyText.includes('mobile-only') || 
                       bodyText.includes('app price') || bodyText.includes('precio app') ||
                       bodyText.includes('descuento móvil');
    
    return {found: false, fallbackPrices, noAvail, mobileDeal};
}"""


async def search_period(browser, period_name, checkin, checkout, ua, is_mobile=False):
    ctx = await browser.new_context(
        user_agent=ua,
        viewport={"width": 375, "height": 812} if is_mobile else {"width": 1920, "height": 1080},
        is_mobile=is_mobile,
        locale="es-ES",
    )
    page = await ctx.new_page()
    nights = (datetime.strptime(checkout, "%Y-%m-%d") - datetime.strptime(checkin, "%Y-%m-%d")).days
    device = "📱" if is_mobile else "💻"
    
    url = f"{HOTEL_URL}?checkin={checkin}&checkout={checkout}&group_adults=2&no_rooms=1&group_children=0&selected_currency=EUR"
    
    try:
        await page.goto(url, timeout=30000, wait_until="domcontentloaded")
        await asyncio.sleep(3)
        
        # Scroll to availability table
        await page.evaluate("""() => {
            const el = document.querySelector('#hprt-table, #availability, [id*="avail"]');
            if (el) el.scrollIntoView({behavior: 'instant'});
            else window.scrollTo(0, 800);
        }""")
        await asyncio.sleep(2)
        
        data = await page.evaluate(EXTRACT_TABLE_JS)
        
        if data.get("found") and data.get("rooms"):
            rooms = data["rooms"]
            # Find cheapest for 2 adults
            two_adult_rooms = [r for r in rooms if r["occupancy"] >= 2] or rooms
            cheapest = min(r["price"] for r in two_adult_rooms)
            ppn = round(cheapest / nights, 1)
            
            room_info = next((r for r in two_adult_rooms if r["price"] == cheapest), rooms[0])
            orig = room_info.get("origPrice", 0)
            discount_str = ""
            if orig > cheapest:
                pct = round((1 - cheapest/orig) * 100)
                discount_str = f" (antes {orig:.0f}€, -{pct}%)"
            
            urgency = room_info.get("urgency", "")
            urg_str = f" ⚠️ {urgency}" if urgency else ""
            
            print(f"   {device} {cheapest:.0f}€ total ({ppn}€/noche) | {room_info['roomName'][:40]}{discount_str}{urg_str}")
            
            result = {
                "period": period_name, "checkin": checkin, "checkout": checkout,
                "nights": nights, "device": "mobile" if is_mobile else "desktop",
                "available": True, "cheapest": cheapest, "ppn": ppn,
                "rooms": rooms, "room_name": room_info["roomName"],
                "orig_price": orig, "discount_str": discount_str,
            }
        elif data.get("fallbackPrices"):
            prices = data["fallbackPrices"]
            cheapest = min(prices)
            ppn = round(cheapest / nights, 1)
            mobile_str = " 📲 PRECIO MÓVIL!" if data.get("mobileDeal") else ""
            print(f"   {device} {cheapest:.0f}€ total ({ppn}€/noche) [fallback]{mobile_str}")
            result = {
                "period": period_name, "checkin": checkin, "checkout": checkout,
                "nights": nights, "device": "mobile" if is_mobile else "desktop",
                "available": True, "cheapest": cheapest, "ppn": ppn,
                "rooms": [], "mobile_deal": data.get("mobileDeal", False),
            }
        elif data.get("noAvail"):
            print(f"   {device} ❌ Sin disponibilidad")
            result = {
                "period": period_name, "checkin": checkin, "checkout": checkout,
                "nights": nights, "device": "mobile" if is_mobile else "desktop",
                "available": False, "cheapest": None, "ppn": None,
            }
        else:
            print(f"   {device} ⚠️ No se encontraron precios")
            result = {
                "period": period_name, "checkin": checkin, "checkout": checkout,
                "nights": nights, "device": "mobile" if is_mobile else "desktop",
                "available": None, "cheapest": None, "ppn": None,
            }
        
        await ctx.close()
        return result
    except Exception as e:
        print(f"   {device} ⚠️ Error: {str(e)[:80]}")
        await ctx.close()
        return {
            "period": period_name, "checkin": checkin, "checkout": checkout,
            "nights": nights, "device": "mobile" if is_mobile else "desktop",
            "available": None, "cheapest": None, "ppn": None, "error": str(e),
        }


async def main():
    print("=" * 70)
    print("🏨 MANOLO Beach Resort — Zanzibar, Tanzania (3★, nota 9.0)")
    print("   Búsqueda multi-período + comparación desktop vs móvil")
    print("=" * 70)
    print(f"📅 {len(PERIODS)} períodos × 2 (desktop+móvil) = {len(PERIODS)*2} búsquedas")
    print()
    
    all_results = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for i, (name, (ci, co)) in enumerate(PERIODS.items(), 1):
            nights = (datetime.strptime(co, "%Y-%m-%d") - datetime.strptime(ci, "%Y-%m-%d")).days
            print(f"\n[{i}/{len(PERIODS)}] {name} ({ci} → {co}, {nights}n)")
            
            r_desk = await search_period(browser, name, ci, co, DESKTOP_UA, False)
            all_results.append(r_desk)
            await asyncio.sleep(random.uniform(1.5, 2.5))
            
            r_mob = await search_period(browser, name, ci, co, MOBILE_UA, True)
            all_results.append(r_mob)
            await asyncio.sleep(random.uniform(1.5, 2.5))
        
        await browser.close()
    
    # ═══ SUMMARY ═══
    print("\n" + "=" * 70)
    print("📊 RESUMEN COMPARATIVO — MANOLO Beach Resort, Zanzibar")
    print("=" * 70)
    
    from collections import defaultdict
    by_period = defaultdict(dict)
    for r in all_results:
        by_period[r["period"]][r["device"]] = r
    
    print(f"\n{'Período':<28} {'Noch':>4} {'Desktop':>12} {'€/n desk':>9} {'Móvil':>12} {'€/n mob':>8} {'Ahorro mob':>11}")
    print("-" * 90)
    
    best_overall = None
    mobile_wins = []
    
    for name, devices in by_period.items():
        d = devices.get("desktop", {})
        m = devices.get("mobile", {})
        nights = d.get("nights") or m.get("nights") or 0
        
        dp = d.get("cheapest")
        mp = m.get("cheapest")
        
        d_str = f"{dp:.0f}€" if dp else ("Agotado" if d.get("available") == False else "N/A")
        m_str = f"{mp:.0f}€" if mp else ("Agotado" if m.get("available") == False else "N/A")
        d_ppn = f"{d.get('ppn',0):.0f}€" if dp else "-"
        m_ppn = f"{m.get('ppn',0):.0f}€" if mp else "-"
        
        saving = ""
        if dp and mp:
            diff = dp - mp
            if diff > 0:
                saving = f"📱 -{diff:.0f}€ ({round(diff/dp*100)}%)"
                mobile_wins.append((name, diff, round(diff/dp*100)))
            elif diff < 0:
                saving = f"💻 -{-diff:.0f}€ ({round(-diff/mp*100)}%)"
        
        # Track best
        cheapest = min(filter(None, [dp, mp]), default=None)
        if cheapest and nights:
            ppn = cheapest / nights
            if best_overall is None or ppn < best_overall[1]:
                best_overall = (name, ppn, cheapest, nights)
        
        print(f"{name:<28} {nights:>3}n {d_str:>12} {d_ppn:>9} {m_str:>12} {m_ppn:>8} {saving:>11}")
    
    print()
    if best_overall:
        print(f"🏆 MEJOR PRECIO/NOCHE: {best_overall[0]} → {best_overall[1]:.0f}€/noche ({best_overall[2]:.0f}€ total, {best_overall[3]}n)")
    
    if mobile_wins:
        print(f"\n📱 PERIODOS DONDE MÓVIL ES MÁS BARATO:")
        for name, diff, pct in sorted(mobile_wins, key=lambda x: -x[2]):
            print(f"   {name}: {diff:.0f}€ menos en móvil ({pct}% ahorro)")

asyncio.run(main())
