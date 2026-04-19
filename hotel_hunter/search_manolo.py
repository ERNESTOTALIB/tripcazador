"""
Search MANOLO Beach Resort Zanzibar across multiple date periods
Including mobile vs desktop price comparison
"""
import asyncio
import random
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

HOTEL_URL = "https://www.booking.com/hotel/tz/manolo-beach-resort.html"

# User agents
DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

# Date periods to search
PERIODS = {
    # Navidad / Fin de Año 2026
    "Navidad 2026 (7n)":          ("2026-12-23", "2026-12-30"),
    "Fin de Año 2026 (7n)":       ("2026-12-28", "2027-01-04"),
    "Fin de Año 2026 (10n)":      ("2026-12-26", "2027-01-05"),
    # Semana Santa 2027
    "Semana Santa 2027 (7n)":     ("2027-04-10", "2027-04-17"),
    "Semana Santa 2027 (10n)":    ("2027-04-09", "2027-04-19"),
    # Mayo / Puente
    "Mayo 2027 (7n)":             ("2027-05-01", "2027-05-08"),
    "Mayo 2027 (10n)":            ("2027-04-30", "2027-05-10"),
    # Junio (pre-temporada)
    "Junio 2027 (7n)":            ("2027-06-15", "2027-06-22"),
    "Junio 2027 (14n)":           ("2027-06-15", "2027-06-29"),
    # Julio
    "Julio 2027 (7n)":            ("2027-07-01", "2027-07-08"),
    "Julio 2027 (14n)":           ("2027-07-01", "2027-07-15"),
    "Julio 2027 (21n)":           ("2027-07-01", "2027-07-22"),
    # Agosto
    "Agosto 2027 (7n)":           ("2027-08-01", "2027-08-08"),
    "Agosto 2027 (14n)":          ("2027-08-01", "2027-08-15"),
    "Agosto 2027 (21n)":          ("2027-08-01", "2027-08-22"),
    # Septiembre (post-temporada, suele ser barato)
    "Septiembre 2027 (7n)":       ("2027-09-01", "2027-09-08"),
    "Septiembre 2027 (14n)":      ("2027-09-01", "2027-09-15"),
    # Octubre
    "Octubre 2027 (7n)":          ("2027-10-12", "2027-10-19"),
    # Noviembre (temporada baja)
    "Noviembre 2027 (7n)":        ("2027-11-01", "2027-11-08"),
}

EXTRACT_JS = """() => {
    const results = [];
    
    // Method 1: Look for room/rate rows in the hotel page
    const rows = document.querySelectorAll('tr[data-block-id], .hprt-table tr, [class*="room"], [data-testid="property-section-room"]');
    
    // Method 2: Get the main price display
    const priceElements = document.querySelectorAll('[data-testid="price-and-discounted-price"], .bui-price-display__value, .prco-valign-middle-helper, [class*="price"], .bui-f-font-display_one');
    
    const prices = [];
    priceElements.forEach(el => {
        const text = el.textContent.trim();
        // Match prices like €123, 123€, EUR 123, US$123, $123
        const matches = text.match(/(?:€|EUR\\s*|US?\\$|\\$)\\s*([\\d.,]+)|([\\d.,]+)\\s*(?:€|EUR)/g);
        if (matches) {
            matches.forEach(m => {
                const numStr = m.replace(/[€$EUR\\s]/g, '').replace(/\\./g, '').replace(',', '.');
                const num = parseFloat(numStr);
                if (num > 10 && num < 50000) {
                    prices.push(num);
                }
            });
        }
    });
    
    // Method 3: Try room type table
    const roomBlocks = document.querySelectorAll('[data-testid="property-section-room-item"], .hprt-table .hprt-table-cell-roomtype');
    const roomData = [];
    roomBlocks.forEach(block => {
        const nameEl = block.querySelector('[data-testid="room-type-link"], .hprt-roomtype-icon-link, a[class*="room"]');
        const name = nameEl ? nameEl.textContent.trim() : '';
        
        const priceEl = block.querySelector('[data-testid="price-and-discounted-price"], .bui-price-display__value, [class*="price"]');
        let price = 0;
        if (priceEl) {
            const pText = priceEl.textContent.replace(/[^\\d.,]/g, '').replace(/\\./g, '').replace(',', '.');
            price = parseFloat(pText);
        }
        
        if (name && price > 0) {
            roomData.push({name, price});
        }
    });
    
    // Get page title to confirm hotel
    const title = document.title || '';
    
    // Get all visible text prices as fallback
    const bodyText = document.body.innerText;
    const allPriceMatches = bodyText.match(/(?:€|EUR)\\s*[\\d.,]+|[\\d.,]+\\s*€/g) || [];
    const allPrices = allPriceMatches.map(m => {
        const n = parseFloat(m.replace(/[€EUR\\s]/g, '').replace(/\\./g, '').replace(',', '.'));
        return n;
    }).filter(n => n > 10 && n < 50000);
    
    // Check for "sold out" or "no availability"
    const noAvail = bodyText.toLowerCase().includes('no queda') || 
                    bodyText.toLowerCase().includes('sold out') || 
                    bodyText.toLowerCase().includes('no availability') ||
                    bodyText.toLowerCase().includes('no hay disponibilidad') ||
                    bodyText.toLowerCase().includes('not available');
    
    // Get discounted / crossed-out prices
    const origPriceEls = document.querySelectorAll('[data-testid="price-for-x-nights"], .bui-price-display__original, del, s, [class*="strikethrough"], [class*="crossed"]');
    const origPrices = [];
    origPriceEls.forEach(el => {
        const t = el.textContent.replace(/[^\\d.,]/g, '').replace(/\\./g, '').replace(',', '.');
        const n = parseFloat(t);
        if (n > 10 && n < 50000) origPrices.push(n);
    });
    
    // Mobile-only deal badge
    const mobileDeal = bodyText.includes('Precio para móvil') || bodyText.includes('Mobile-only price') || 
                       bodyText.includes('app price') || bodyText.includes('precio app');
    
    return {
        title,
        prices: [...new Set(prices)].sort((a,b) => a-b),
        allPrices: [...new Set(allPrices)].sort((a,b) => a-b),
        roomData,
        noAvailability: noAvail,
        origPrices: [...new Set(origPrices)].sort((a,b) => a-b),
        mobileDeal,
    };
}"""

async def search_hotel_period(browser, period_name, checkin, checkout, ua, is_mobile=False):
    """Search one period for this specific hotel"""
    ctx = await browser.new_context(
        user_agent=ua,
        viewport={"width": 375, "height": 812} if is_mobile else {"width": 1920, "height": 1080},
        is_mobile=is_mobile,
        locale="es-ES",
    )
    page = await ctx.new_page()
    
    nights = (datetime.strptime(checkout, "%Y-%m-%d") - datetime.strptime(checkin, "%Y-%m-%d")).days
    
    url = f"{HOTEL_URL}?checkin={checkin}&checkout={checkout}&group_adults=2&no_rooms=1&group_children=0&selected_currency=EUR"
    
    try:
        await page.goto(url, timeout=30000, wait_until="domcontentloaded")
        await asyncio.sleep(3)
        
        # Scroll to load prices
        await page.evaluate("window.scrollTo(0, 600)")
        await asyncio.sleep(1)
        await page.evaluate("window.scrollTo(0, 1200)")
        await asyncio.sleep(1)
        
        data = await page.evaluate(EXTRACT_JS)
        
        device = "📱" if is_mobile else "💻"
        
        # Find cheapest price
        all_p = data.get("allPrices", []) + data.get("prices", [])
        all_p = [p for p in all_p if p > 20]
        
        if data.get("noAvailability"):
            print(f"   {device} {period_name}: ❌ Sin disponibilidad")
            result = {"period": period_name, "checkin": checkin, "checkout": checkout, 
                     "nights": nights, "device": "mobile" if is_mobile else "desktop",
                     "available": False, "prices": [], "cheapest": None, "rooms": []}
        elif all_p:
            cheapest = min(all_p)
            ppn = round(cheapest / nights, 1)
            rooms = data.get("roomData", [])
            orig = data.get("origPrices", [])
            mobile_deal = data.get("mobileDeal", False)
            
            discount_str = ""
            if orig:
                max_orig = max(orig)
                if max_orig > cheapest:
                    pct = round((1 - cheapest/max_orig) * 100)
                    discount_str = f" (antes {max_orig}€, -{pct}%)"
            
            mobile_str = " 📲 PRECIO MÓVIL!" if mobile_deal else ""
            
            print(f"   {device} {period_name}: {cheapest}€ total ({ppn}€/noche){discount_str}{mobile_str}")
            if rooms:
                for r in rooms[:3]:
                    print(f"      → {r['name'][:50]}: {r['price']}€")
            
            result = {"period": period_name, "checkin": checkin, "checkout": checkout,
                     "nights": nights, "device": "mobile" if is_mobile else "desktop",
                     "available": True, "cheapest": cheapest, "ppn": ppn,
                     "prices": all_p, "rooms": rooms, "orig_prices": orig,
                     "mobile_deal": mobile_deal, "discount_str": discount_str}
        else:
            print(f"   {device} {period_name}: ⚠️ No se encontraron precios (página cargó pero sin datos)")
            result = {"period": period_name, "checkin": checkin, "checkout": checkout,
                     "nights": nights, "device": "mobile" if is_mobile else "desktop",
                     "available": None, "prices": [], "cheapest": None, "rooms": []}
        
        await ctx.close()
        return result
        
    except Exception as e:
        print(f"   {device} {period_name}: ⚠️ Error: {str(e)[:60]}")
        await ctx.close()
        return {"period": period_name, "checkin": checkin, "checkout": checkout,
               "nights": nights, "device": "mobile" if is_mobile else "desktop",
               "available": None, "prices": [], "cheapest": None, "error": str(e)}


async def main():
    print("=" * 65)
    print("🏨 MANOLO Beach Resort — Zanzibar, Tanzania")
    print("   Búsqueda multi-período + comparación móvil/desktop")
    print("=" * 65)
    print(f"📅 Períodos a buscar: {len(PERIODS)}")
    print(f"🔍 Cada período: desktop + móvil = {len(PERIODS) * 2} búsquedas")
    print()
    
    results = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for i, (period_name, (checkin, checkout)) in enumerate(PERIODS.items(), 1):
            print(f"\n[{i}/{len(PERIODS)}] {period_name} ({checkin} → {checkout})")
            
            # Desktop search
            r_desktop = await search_hotel_period(browser, period_name, checkin, checkout, DESKTOP_UA, is_mobile=False)
            results.append(r_desktop)
            
            await asyncio.sleep(random.uniform(1, 2))
            
            # Mobile search
            r_mobile = await search_hotel_period(browser, period_name, checkin, checkout, MOBILE_UA, is_mobile=True)
            results.append(r_mobile)
            
            await asyncio.sleep(random.uniform(1, 2))
        
        await browser.close()
    
    # ═══ Summary ═══
    print("\n" + "=" * 65)
    print("📊 RESUMEN COMPARATIVO")
    print("=" * 65)
    
    # Group by period
    from collections import defaultdict
    by_period = defaultdict(dict)
    for r in results:
        by_period[r["period"]][r["device"]] = r
    
    print(f"\n{'Período':<30} {'Noches':>6} {'Desktop':>10} {'Móvil':>10} {'Ahorro':>8} {'€/noche':>8}")
    print("-" * 80)
    
    best_deal = None
    best_ppn = None
    mobile_savings = []
    
    for period_name, devices in by_period.items():
        d = devices.get("desktop", {})
        m = devices.get("mobile", {})
        nights = d.get("nights", m.get("nights", 0))
        
        d_price = d.get("cheapest")
        m_price = m.get("cheapest")
        
        d_str = f"{d_price}€" if d_price else ("N/A" if d.get("available") is None else "Agotado")
        m_str = f"{m_price}€" if m_price else ("N/A" if m.get("available") is None else "Agotado")
        
        saving = ""
        if d_price and m_price:
            diff = d_price - m_price
            if diff > 0:
                saving = f"-{round(diff)}€"
                mobile_savings.append((period_name, diff, round(diff/d_price*100)))
        
        # Best €/night
        cheapest = min(filter(None, [d_price, m_price]), default=None)
        ppn_str = ""
        if cheapest and nights:
            ppn = round(cheapest / nights, 1)
            ppn_str = f"{ppn}€"
            if best_ppn is None or ppn < best_ppn:
                best_ppn = ppn
                best_deal = (period_name, cheapest, nights, ppn)
        
        print(f"{period_name:<30} {nights:>4}n  {d_str:>10} {m_str:>10} {saving:>8} {ppn_str:>8}")
    
    print()
    if best_deal:
        print(f"🏆 MEJOR PRECIO POR NOCHE: {best_deal[0]} → {best_deal[3]}€/noche ({best_deal[1]}€ total, {best_deal[2]} noches)")
    
    if mobile_savings:
        print(f"\n📱 AHORROS MÓVIL DETECTADOS:")
        for name, diff, pct in sorted(mobile_savings, key=lambda x: -x[1]):
            print(f"   {name}: {diff}€ menos en móvil ({pct}%)")
    
    return results

asyncio.run(main())
