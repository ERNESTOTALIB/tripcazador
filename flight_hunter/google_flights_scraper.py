"""Google Flights scraper for Business class fares using Playwright - Form interaction"""

import asyncio, json, random, re
from datetime import datetime, timedelta
from playwright.async_api import async_playwright


class GoogleFlightsScraper:
    """Scrapes Google Flights by interacting with the search UI"""

    BASE = "https://www.google.com/travel/flights"

    async def search_route(self, page, origin, dest, date_out, date_ret=None):
        """Search a single route using Google Flights UI interaction"""
        try:
            # Navigate to Google Flights
            await page.goto(f"{self.BASE}?hl=en&curr=EUR", wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(random.uniform(4, 7))

            # Accept cookies
            for sel in ['button:has-text("Accept all")', 'button:has-text("Aceptar todo")',
                        '#L2AGLb', 'button:has-text("I agree")', 'button:has-text("Tout accepter")']:
                try:
                    btn = page.locator(sel).first
                    if await btn.is_visible(timeout=3000):
                        await btn.click()
                        await asyncio.sleep(2)
                        break
                except:
                    pass

            # Switch to Business class
            # Click on cabin selector (usually shows "Economy")
            cabin_selectors = [
                'button:has-text("Economy")', 'button:has-text("Económica")',
                '[aria-label*="cabin"]', '[aria-label*="class"]',
                'button:has-text("Clase")',
            ]
            for sel in cabin_selectors:
                try:
                    btn = page.locator(sel).first
                    if await btn.is_visible(timeout=3000):
                        await btn.click()
                        await asyncio.sleep(1)
                        # Select Business
                        for biz_sel in ['li:has-text("Business")', 'li:has-text("Ejecutiva")',
                                        '[data-value="BUSINESS"]', 'span:has-text("Business")']:
                            try:
                                biz = page.locator(biz_sel).first
                                if await biz.is_visible(timeout=2000):
                                    await biz.click()
                                    await asyncio.sleep(1)
                                    break
                            except:
                                pass
                        break
                except:
                    pass

            # Enter origin
            origin_input = page.locator('[aria-label*="Where from"], [placeholder*="Where from"], [aria-label*="origen"], input[aria-label*="From"]').first
            try:
                if await origin_input.is_visible(timeout=3000):
                    await origin_input.click()
                    await asyncio.sleep(0.5)
                    await origin_input.fill("")
                    await page.keyboard.type(origin, delay=80)
                    await asyncio.sleep(2)
                    # Select first suggestion
                    await page.keyboard.press("ArrowDown")
                    await asyncio.sleep(0.3)
                    await page.keyboard.press("Enter")
                    await asyncio.sleep(1)
            except:
                pass

            # Enter destination
            dest_input = page.locator('[aria-label*="Where to"], [placeholder*="Where to"], [aria-label*="destino"], input[aria-label*="To"]').first
            try:
                if await dest_input.is_visible(timeout=3000):
                    await dest_input.click()
                    await asyncio.sleep(0.5)
                    await dest_input.fill("")
                    await page.keyboard.type(dest, delay=80)
                    await asyncio.sleep(2)
                    await page.keyboard.press("ArrowDown")
                    await asyncio.sleep(0.3)
                    await page.keyboard.press("Enter")
                    await asyncio.sleep(1)
            except:
                pass

            # Enter dates
            date_input = page.locator('[aria-label*="Departure"], [data-placeholder*="Departure"], [aria-label*="salida"]').first
            try:
                if await date_input.is_visible(timeout=3000):
                    await date_input.click()
                    await asyncio.sleep(1)
                    await date_input.fill(date_out)
                    await asyncio.sleep(1)
                    if date_ret:
                        ret_input = page.locator('[aria-label*="Return"], [data-placeholder*="Return"], [aria-label*="vuelta"]').first
                        if await ret_input.is_visible(timeout=2000):
                            await ret_input.click()
                            await asyncio.sleep(0.5)
                            await ret_input.fill(date_ret)
                            await asyncio.sleep(1)
                    # Confirm dates
                    done_btn = page.locator('button:has-text("Done"), button:has-text("Listo")').first
                    if await done_btn.is_visible(timeout=2000):
                        await done_btn.click()
                        await asyncio.sleep(1)
            except:
                pass

            # Click Search
            search_btn = page.locator('button:has-text("Search"), button:has-text("Buscar"), button:has-text("Explore")').first
            try:
                if await search_btn.is_visible(timeout=3000):
                    await search_btn.click()
                    await asyncio.sleep(random.uniform(6, 10))
            except:
                pass

            # Wait for results and scroll
            for _ in range(5):
                await page.mouse.wheel(0, random.randint(400, 700))
                await asyncio.sleep(random.uniform(1, 2))

            # Extract prices from results page
            flights = await page.evaluate("""() => {
                const results = [];
                const allText = document.body.innerText;

                // Method 1: aria-labels with flight info
                document.querySelectorAll('[aria-label]').forEach(el => {
                    const label = el.getAttribute('aria-label') || '';
                    if ((label.includes('€') || label.includes('EUR')) &&
                        label.length > 20 && label.length < 500) {
                        results.push({ type: 'aria', text: label });
                    }
                });

                // Method 2: Price elements
                document.querySelectorAll('span, div').forEach(el => {
                    const text = el.textContent.trim();
                    // Match price patterns like "€1,234" or "1.234 €" or "EUR 1,234"
                    if (/^[€$£]\\s?\\d/.test(text) || /\\d\\s?[€$£]$/.test(text)) {
                        if (text.length < 20) {
                            results.push({ type: 'price', text: text });
                        }
                    }
                });

                // Method 3: List items that look like flight results
                document.querySelectorAll('li, [role="listitem"]').forEach(el => {
                    const text = el.textContent || '';
                    if (text.includes('€') && text.length > 50 && text.length < 600) {
                        // Check if it has flight-like content (times, airlines)
                        if (/\\d{1,2}:\\d{2}/.test(text) || /\\d+h/.test(text)) {
                            results.push({ type: 'flight', text: text.substring(0, 400) });
                        }
                    }
                });

                return results.slice(0, 50);
            }""")

            # Parse extracted data
            parsed = []
            seen_prices = set()

            for f in flights:
                text = f.get("text", "")
                # Extract price
                price_matches = re.findall(r'€\s?([\d,.]+)|(\d[\d,.]+)\s?€|EUR\s?([\d,.]+)', text)
                for pm in price_matches:
                    raw = pm[0] or pm[1] or pm[2]
                    try:
                        # Handle European format (1.234,56) and US format (1,234.56)
                        clean = raw.replace(" ", "")
                        if "," in clean and "." in clean:
                            if clean.index(",") > clean.index("."):
                                clean = clean.replace(".", "").replace(",", ".")
                            else:
                                clean = clean.replace(",", "")
                        elif "," in clean:
                            clean = clean.replace(",", "")
                        elif "." in clean and len(clean.split(".")[-1]) == 3:
                            clean = clean.replace(".", "")

                        price = float(clean)
                        if price < 50 or price > 50000:
                            continue
                        if price in seen_prices:
                            continue
                        seen_prices.add(price)

                        # Extract airline
                        airline = ""
                        for a in ['Lufthansa', 'Air France', 'KLM', 'British Airways',
                                   'Iberia', 'Turkish Airlines', 'Swiss', 'Austrian',
                                   'Emirates', 'Qatar Airways', 'Etihad', 'Singapore Airlines',
                                   'Cathay Pacific', 'ANA', 'JAL', 'Korean Air',
                                   'Delta', 'United', 'American', 'ITA Airways', 'TAP',
                                   'SAS', 'Finnair', 'LOT', 'Ethiopian', 'LATAM']:
                            if a.lower() in text.lower():
                                airline = a
                                break

                        # Extract stops
                        stops = -1
                        if 'nonstop' in text.lower() or 'directo' in text.lower():
                            stops = 0
                        elif '1 stop' in text.lower() or '1 escala' in text.lower():
                            stops = 1
                        elif '2 stop' in text.lower() or '2 escala' in text.lower():
                            stops = 2

                        parsed.append({
                            "origin": origin,
                            "destination": dest,
                            "date_out": date_out,
                            "date_ret": date_ret,
                            "price_eur": price,
                            "airline": airline,
                            "stops": stops,
                            "cabin": "business",
                            "source": "google_flights",
                            "raw_text": text[:200],
                            "scraped_at": datetime.now().isoformat(),
                        })
                    except:
                        pass

            return parsed

        except Exception as e:
            print(f"      ❌ Error: {str(e)[:100]}", flush=True)
            return []

    async def search_routes(self, routes, dates):
        """Search multiple routes"""
        all_results = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox",
                       "--disable-dev-shm-usage", "--disable-gpu", "--lang=en-US,en"]
            )

            total = len(routes) * len(dates)
            done = 0

            for origin, dest in routes:
                for date_out, date_ret in dates:
                    done += 1
                    print(f"   [{done}/{total}] {origin}→{dest} {date_out}", flush=True)

                    ctx = await browser.new_context(
                        viewport={"width": 1440, "height": 900},
                        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
                        locale="en-US"
                    )
                    pg = await ctx.new_page()
                    try:
                        results = await self.search_route(pg, origin, dest, date_out, date_ret)
                        all_results.extend(results)
                        if results:
                            cheapest = min(r["price_eur"] for r in results)
                            print(f"      ✅ {len(results)} prices (cheapest: {cheapest:.0f}€ BIZ)", flush=True)
                        else:
                            print(f"      ⚠️ No prices extracted", flush=True)
                    finally:
                        await ctx.close()
                    await asyncio.sleep(random.uniform(8, 15))

            await browser.close()

        return all_results


async def main():
    scraper = GoogleFlightsScraper()
    routes = [("CDG", "NRT"), ("FRA", "JFK"), ("MAD", "BKK")]
    base = datetime.now() + timedelta(days=90)
    dates = [(base.strftime("%Y-%m-%d"), (base + timedelta(days=7)).strftime("%Y-%m-%d"))]

    print("✈️ GOOGLE FLIGHTS BUSINESS CLASS TEST", flush=True)
    results = await scraper.search_routes(routes, dates)
    print(f"\n📊 {len(results)} results")
    for r in sorted(results, key=lambda x: x["price_eur"])[:10]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r.get('airline','')}")

if __name__ == "__main__":
    asyncio.run(main())
