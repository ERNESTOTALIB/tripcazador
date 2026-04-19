"""Scraper for Secret Flying error fares - Business & First Class deals"""

import asyncio, json, random, re
from datetime import datetime
from playwright.async_api import async_playwright


class SecretFlyingScraper:
    """Scrapes secretflying.com for business/first class error fares from Europe"""

    BASE = "https://www.secretflying.com"
    CATEGORIES = [
        "/posts/category/error-fare/",
        "/posts/category/business-class/",
        "/posts/category/first-class/",
    ]

    EUROPEAN_CITIES = {
        'london', 'paris', 'madrid', 'barcelona', 'rome', 'milan', 'amsterdam',
        'frankfurt', 'munich', 'berlin', 'vienna', 'zurich', 'geneva', 'brussels',
        'lisbon', 'porto', 'dublin', 'copenhagen', 'stockholm', 'oslo', 'helsinki',
        'warsaw', 'prague', 'budapest', 'athens', 'istanbul', 'bucharest', 'sofia',
        'belgrade', 'zagreb', 'nice', 'lyon', 'toulouse', 'marseille', 'hamburg',
        'dusseldorf', 'cologne', 'stuttgart', 'strasbourg', 'basel', 'naples',
        'venice', 'florence', 'bologna', 'seville', 'malaga', 'valencia', 'bilbao',
        'palma', 'edinburgh', 'manchester', 'birmingham', 'glasgow',
        'europe', 'european', 'spain', 'france', 'germany', 'italy', 'uk',
        'portugal', 'netherlands', 'belgium', 'switzerland', 'austria', 'sweden',
        'norway', 'denmark', 'finland', 'ireland', 'poland', 'czech', 'hungary',
        'greece', 'turkey', 'romania', 'bulgaria', 'croatia', 'serbia',
    }

    async def scrape_all(self, max_pages=3):
        """Scrape all categories for deals"""
        all_deals = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            for cat in self.CATEGORIES:
                cat_name = cat.split("/")[-2]
                print(f"\n🔍 Scraping Secret Flying: {cat_name}", flush=True)
                for page_num in range(1, max_pages + 1):
                    url = f"{self.BASE}{cat}" if page_num == 1 else f"{self.BASE}{cat}page/{page_num}/"
                    print(f"   📄 Page {page_num}...", flush=True)
                    ctx = await browser.new_context(
                        viewport={"width": 1440, "height": 900},
                        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
                    )
                    page = await ctx.new_page()
                    try:
                        deals = await self._scrape_page(page, url, cat_name)
                        all_deals.extend(deals)
                        print(f"      ✅ {len(deals)} deals found", flush=True)
                    except Exception as e:
                        print(f"      ❌ {e}", flush=True)
                    finally:
                        await ctx.close()
                    await asyncio.sleep(random.uniform(3, 6))
            await browser.close()

        # Filter for European origins
        euro_deals = [d for d in all_deals if d.get("from_europe")]
        biz_deals = [d for d in euro_deals if d.get("cabin") in ("business", "first")]

        print(f"\n📊 Total: {len(all_deals)} deals | Europe origin: {len(euro_deals)} | Business/First: {len(biz_deals)}")
        return biz_deals

    async def _scrape_page(self, page, url, category):
        """Scrape a single page of deals"""
        deals = []
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await asyncio.sleep(random.uniform(3, 5))

        # Accept cookies
        for sel in ['button:has-text("Accept")', '#onetrust-accept-btn-handler',
                     'button:has-text("Aceptar")', 'button:has-text("Agree")']:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    await asyncio.sleep(1)
                    break
            except:
                pass

        # Scroll to load content
        for _ in range(3):
            await page.mouse.wheel(0, random.randint(600, 1000))
            await asyncio.sleep(random.uniform(0.8, 1.5))

        # Extract deal cards
        raw_deals = await page.evaluate("""() => {
            const results = [];
            // Try multiple selectors for deal cards
            const selectors = [
                'article', '.deal-card', '.post-card',
                '[class*="deal"]', '[class*="post"]',
                '.entry', '.listing-item'
            ];

            let cards = [];
            for (const sel of selectors) {
                const found = document.querySelectorAll(sel);
                if (found.length > 2) { cards = found; break; }
            }

            // Fallback: grab all links with prices
            if (cards.length === 0) {
                cards = document.querySelectorAll('a[href*="/posts/"]');
            }

            cards.forEach(card => {
                try {
                    // Get title
                    const titleEl = card.querySelector('h2, h3, h4, .title, [class*="title"]');
                    const title = titleEl ? titleEl.textContent.trim() :
                                  card.textContent.substring(0, 200).trim();

                    // Get link
                    const linkEl = card.querySelector('a[href*="/posts/"]') || card.closest('a');
                    const link = linkEl ? linkEl.href : '';

                    // Get price from text
                    const text = card.textContent;

                    // Get image
                    const img = card.querySelector('img');
                    const imgSrc = img ? (img.src || img.dataset.src || '') : '';

                    if (title.length > 10) {
                        results.push({ title, link, text: text.substring(0, 500), imgSrc });
                    }
                } catch(e) {}
            });
            return results;
        }""")

        for raw in raw_deals:
            deal = self._parse_deal(raw, category)
            if deal:
                deals.append(deal)

        return deals

    def _parse_deal(self, raw, category):
        """Parse a raw deal into structured data"""
        title = raw.get("title", "")
        text = raw.get("text", "")
        link = raw.get("link", "")

        if not title or len(title) < 15:
            return None

        # Extract price
        price = self._extract_price(title + " " + text)

        # Detect cabin class
        cabin = "unknown"
        combined = (title + " " + text).lower()
        if "business" in combined:
            cabin = "business"
        elif "first class" in combined or "primera clase" in combined:
            cabin = "first"
        elif "premium" in combined:
            cabin = "premium"
        elif category in ("business-class", "first-class"):
            cabin = category.replace("-class", "")
        elif category == "error-fare":
            cabin = "business" if "business" in combined else "economy"

        # Detect if from Europe
        from_europe = self._is_from_europe(title + " " + text)

        # Extract route info
        route = self._extract_route(title)

        return {
            "title": title,
            "link": link,
            "price": price,
            "currency": self._detect_currency(title + " " + text),
            "cabin": cabin,
            "from_europe": from_europe,
            "route": route,
            "category": category,
            "source": "secret_flying",
            "scraped_at": datetime.now().isoformat(),
        }

    def _extract_price(self, text):
        """Extract the lowest price from text"""
        patterns = [
            r'[€$£][\s]*(\d[\d,\.]*)',
            r'(\d[\d,\.]*)\s*[€$£]',
            r'EUR\s*(\d[\d,\.]*)',
            r'USD\s*(\d[\d,\.]*)',
            r'GBP\s*(\d[\d,\.]*)',
            r'from\s*[€$£]?\s*(\d[\d,\.]*)',
            r'desde\s*[€$£]?\s*(\d[\d,\.]*)',
        ]
        prices = []
        for pat in patterns:
            for m in re.finditer(pat, text, re.IGNORECASE):
                try:
                    p = m.group(1).replace(",", "")
                    val = float(p)
                    if 50 < val < 50000:
                        prices.append(val)
                except:
                    pass
        return min(prices) if prices else None

    def _detect_currency(self, text):
        """Detect currency from text"""
        if "€" in text or "EUR" in text:
            return "EUR"
        elif "$" in text or "USD" in text:
            return "USD"
        elif "£" in text or "GBP" in text:
            return "GBP"
        return "EUR"

    def _is_from_europe(self, text):
        """Check if the deal originates from Europe"""
        tl = text.lower()
        for city in self.EUROPEAN_CITIES:
            # Check if city appears as origin (before "to" or "→" or "-")
            patterns = [
                f"{city} to ",
                f"{city} → ",
                f"from {city}",
                f"desde {city}",
                f"{city} -",
            ]
            for p in patterns:
                if p in tl:
                    return True
        # Also check for general European patterns
        if any(x in tl for x in ["european cities to", "europe to", "from europe"]):
            return True
        return False

    def _extract_route(self, title):
        """Extract origin-destination from title"""
        # Pattern: "City to City" or "City → City"
        patterns = [
            r'(.+?)\s+to\s+(.+?)[\s]*[–\-\|€$£\d]',
            r'(.+?)\s*→\s*(.+?)[\s]*[–\-\|€$£\d]',
            r'(.+?)\s*-\s*(.+?)[\s]*(?:from|€|$|£|\d)',
        ]
        for pat in patterns:
            m = re.search(pat, title, re.IGNORECASE)
            if m:
                return {"origin": m.group(1).strip(), "destination": m.group(2).strip()}
        return {"origin": "", "destination": ""}


async def main():
    """Run Secret Flying scraper"""
    scraper = SecretFlyingScraper()
    deals = await scraper.scrape_all(max_pages=3)

    print(f"\n{'='*60}")
    print(f"✈️ BUSINESS/FIRST CLASS ERROR FARES FROM EUROPE")
    print(f"{'='*60}")

    # Sort by price
    priced = sorted([d for d in deals if d["price"]], key=lambda x: x["price"])

    for i, d in enumerate(priced[:30], 1):
        cabin_icon = "💎" if d["cabin"] == "first" else "✨"
        curr = d.get("currency", "€")
        sym = {"EUR": "€", "USD": "$", "GBP": "£"}.get(curr, curr)
        print(f"\n  {i}. {cabin_icon} {d['title'][:100]}")
        if d["price"]:
            print(f"     💰 {sym}{d['price']:.0f} | {d['cabin'].upper()}")
        print(f"     🔗 {d['link'][:120]}")

    # Save results
    output = {
        "scraped_at": datetime.now().isoformat(),
        "total_deals": len(deals),
        "deals": deals,
    }
    with open("/sessions/ecstatic-nifty-planck/secret_flying_results.json", "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ {len(deals)} deals saved")
    return deals


if __name__ == "__main__":
    asyncio.run(main())
