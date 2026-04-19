"""
Hotel Deal Hunter — Booking.com Scraper v4
============================================
Smart scraper with:
- Multi-page scraping (3 pages = ~75 hotels per destination)
- User-Agent rotation to avoid detection
- All 9 detection technique scrapers
"""

import asyncio
import random
import re
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

from config import (
    EXCLUDE_KEYWORDS, HOTEL_CONFIRM, MIN_STARS, ONLY_HOTELS,
    DELAY_BETWEEN_SEARCHES, REQUEST_TIMEOUT, MAX_RESULTS_PER_DESTINATION,
    CURRENCY, PAGES_TO_SCRAPE, RESULTS_PER_PAGE, USER_AGENTS,
    MOBILE_USER_AGENTS,
)


def is_hotel(name, allow_riads=False):
    """Filter: only keep real hotels, not villas/apartments/B&Bs"""
    if not ONLY_HOTELS:
        return True
    nl = name.lower().strip()
    # Always allow riads and boutiques if flag is set
    if allow_riads:
        for kw in ['riad', 'riyad', 'ryad', 'dar ', 'boutique']:
            if kw in nl:
                return True
    for kw in HOTEL_CONFIRM:
        if kw in nl:
            return True
    for kw in EXCLUDE_KEYWORDS:
        if kw in nl:
            return False
    return True


def get_random_ua():
    """Get a random desktop user-agent"""
    return random.choice(USER_AGENTS)


def get_random_mobile_ua():
    """Get a random mobile user-agent"""
    return random.choice(MOBILE_USER_AGENTS)


def build_url(destination, checkin, checkout, adults=2, offset=0,
              beachfront=False, all_inclusive=False, sea_view=False, min_stars=None,
              no_rooms=1, currency=None, breakfast=False, half_board=False, full_board=False,
              no_hotel_filter=False, min_review=None,
              pool=False, spa=False, parking=False, ac=False, wifi=False,
              private_pool=False, restaurant=False, reception_24h=False, gym=False,
              free_cancel=False, no_prepay=False, pets=False, adults_only=False,
              double_bed=False, kitchen=False, breakfast_dinner=False,
              hotel_type=None, max_distance=None, district=None,
              no_stars_filter=False, beach_only=False):
    """Build Booking.com search URL with ALL available Booking.com filters.

    Booking.com filter codes (scraped from sidebar):
    ──────────────────────────────────────────────────
    ACCOMMODATION TYPE (ht_id):
        204=Hotel, 206=Resort, 227=Riad, 201=Apartment, 213=Villa,
        216=Guest House, 208=B&B, 203=Hostel, 224=Glamping
    MEAL PLAN (mealplan):
        1=Breakfast, 2=Half board, 3=Full board, 4=All inclusive,
        9=Breakfast+Dinner, 999=Self catering/kitchen
    REVIEW SCORE: 60=6+, 70=7+, 80=8+, 90=9+
    FACILITIES (hotelfacility):
        2=Parking, 3=Restaurant, 5=Room service, 8=24h reception,
        11=Gym/Fitness, 54=Spa, 107=Free WiFi, 433=Pool
    ROOM FEATURES (roomfacility):
        5=Bathtub, 80=Marble floor, 81=View, 93=Private pool, 108=Sea view
    STARS (class): 2-5
    CANCELLATION (fc): 2=Free cancellation, 5=No prepayment
    STAY TYPE: 1=Pets allowed, 2=Adults only
    BED TYPE (tdb): 2=Twin beds, 3=Double bed
    DISTANCE: 1000=<1km, 3000=<3km, 5000=<5km from center
    DISTRICT (di): location-specific IDs
    """
    stars_min = min_stars if min_stars else MIN_STARS
    cur = currency if currency else CURRENCY

    # ─── Base filters ───
    parts = []

    # Accommodation type
    if hotel_type:
        # Allow custom type: "riad", "hotel", "resort", "villa", "apartment", "guesthouse", etc.
        type_map = {
            "hotel": "204", "resort": "206", "riad": "227", "apartment": "201",
            "villa": "213", "guesthouse": "216", "bb": "208", "hostel": "203",
            "glamping": "224", "lodge": "221",
        }
        for t in hotel_type.split(","):
            t = t.strip().lower()
            if t in type_map:
                parts.append(f"ht_id%3D{type_map[t]}")
    elif not no_hotel_filter:
        parts.append("ht_id%3D204")  # Hotel
        parts.append("ht_id%3D206")  # Resort

    # Star rating
    if not no_stars_filter:
        for s in range(stars_min, 6):
            parts.append(f"class%3D{s}")

    # Review score
    if min_review:
        parts.append(f"review_score%3D{min_review}")

    # ─── Beach ───
    if beachfront:
        parts.append("ht_beach%3D1")                  # Frente a la playa (beachfront tag)
        parts.append("popular_activities%3D302")       # Playa (beach activity filter)
    elif beach_only:
        parts.append("ht_beach%3D1")                  # Solo beachfront, sin doble filtro

    # ─── Meal plans ───
    if all_inclusive:
        parts.append("mealplan%3D4")
    if breakfast:
        parts.append("mealplan%3D1")
    if half_board:
        parts.append("mealplan%3D2")
    if full_board:
        parts.append("mealplan%3D3")
    if breakfast_dinner:
        parts.append("mealplan%3D9")
    if kitchen:
        parts.append("mealplan%3D999")

    # ─── Room features ───
    if sea_view:
        parts.append("roomfacility%3D108")
    if private_pool:
        parts.append("roomfacility%3D93")

    # ─── Hotel facilities ───
    if pool:
        parts.append("hotelfacility%3D433")
    if spa:
        parts.append("hotelfacility%3D54")
    if parking:
        parts.append("hotelfacility%3D2")
    if restaurant:
        parts.append("hotelfacility%3D3")
    if reception_24h:
        parts.append("hotelfacility%3D8")
    if gym:
        parts.append("hotelfacility%3D11")
    if ac:
        parts.append("hotelfacility%3D11")  # fitness center code
    if wifi:
        parts.append("hotelfacility%3D107")

    # ─── Cancellation / payment ───
    if free_cancel:
        parts.append("fc%3D2")
    if no_prepay:
        parts.append("fc%3D5")

    # ─── Stay type ───
    if pets:
        parts.append("stay_type%3D1")
    if adults_only:
        parts.append("stay_type%3D2")

    # ─── Bed type ───
    if double_bed:
        parts.append("tdb%3D3")

    # ─── Distance from center ───
    if max_distance:
        parts.append(f"distance%3D{max_distance}")

    # ─── District ───
    if district:
        parts.append(f"di%3D{district}")

    nflt = "%3B".join(parts)

    url = (
        f"https://www.booking.com/searchresults.html"
        f"?ss={destination}"
        f"&checkin={checkin}"
        f"&checkout={checkout}"
        f"&group_adults={adults}"
        f"&no_rooms={no_rooms}"
        f"&group_children=0"
        f"&nflt={nflt}"
        f"&selected_currency={cur}"
        f"&order=price"
    )
    return url


# JavaScript extraction code (reused across all scrape functions)
EXTRACT_JS = """() => {
    const cards = document.querySelectorAll('[data-testid="property-card"]');
    const results = [];
    cards.forEach(card => {
        try {
            const nameEl = card.querySelector('[data-testid="title"]');
            const name = nameEl ? nameEl.textContent.trim() : '';

            const priceEl = card.querySelector('[data-testid="price-and-discounted-price"]')
                || card.querySelector('span[data-testid="price-and-discounted-price"]')
                || card.querySelector('.prco-valign-middle-helper')
                || card.querySelector('[class*="price"]');
            let priceText = priceEl ? priceEl.textContent.trim() : '';
            let price = 0;
            // Handle European format (1.234,56) and US format (1,234.56)
            let cleaned = priceText.replace(/[^0-9.,]/g, '');
            // If has both . and ,: check which is decimal separator
            if (cleaned.includes(',') && cleaned.includes('.')) {
                if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                    // European: 1.234,56 → remove dots, replace comma with dot
                    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                } else {
                    // US: 1,234.56 → remove commas
                    cleaned = cleaned.replace(/,/g, '');
                }
            } else if (cleaned.includes(',')) {
                // Could be European decimal (234,56) or US thousands (1,234)
                const parts = cleaned.split(',');
                if (parts[parts.length - 1].length === 2) {
                    // Likely European decimal: 234,56
                    cleaned = cleaned.replace(',', '.');
                } else {
                    // Likely US thousands: 1,234
                    cleaned = cleaned.replace(',', '');
                }
            } else if (cleaned.includes('.')) {
                // Only dots: could be decimal (12.50) or thousands (2.500)
                const parts = cleaned.split('.');
                if (parts[parts.length - 1].length === 3) {
                    // Likely European thousands: 2.500 → 2500
                    cleaned = cleaned.replace(/\\./g, '');
                }
                // Otherwise keep as-is (normal decimal like 12.50)
            }
            const nums = cleaned;
            if (nums) price = parseInt(nums);

            // Stars: first try aria-label (most reliable: "4 stars", "5 estrellas")
            let stars = 0;
            const ariaEl = card.querySelector('[aria-label*="star"], [aria-label*="estrellas"], [aria-label*="stelle"], [aria-label*="étoile"]');
            if (ariaEl) {
                const m = ariaEl.getAttribute('aria-label').match(/(\\d)/);
                if (m) stars = parseInt(m[1]);
            }
            // Fallback: count spans in rating-stars div, divide by 2 (Booking uses 2 spans per star)
            if (stars === 0) {
                const ratingDiv = card.querySelector('[data-testid="rating-stars"]');
                if (ratingDiv) {
                    const spanCount = ratingDiv.querySelectorAll('span').length;
                    stars = Math.round(spanCount / 2);
                }
            }
            // Fallback 2: count SVGs
            if (stars === 0) {
                const svgs = card.querySelectorAll('[data-testid="rating-stars"] svg, [class*="star"] svg');
                if (svgs.length > 0) stars = Math.round(svgs.length / 2);
            }
            // Sanity: stars must be 1-5
            if (stars > 5) stars = Math.round(stars / 2);
            if (stars > 5) stars = 5;

            const scoreEl = card.querySelector('[data-testid="review-score"] > div:first-child')
                || card.querySelector('[aria-label*="score"], [aria-label*="Scored"]');
            let score = 0;
            if (scoreEl) {
                const scoreText = scoreEl.textContent || scoreEl.getAttribute('aria-label') || '';
                const sm = scoreText.match(/([\\d.]+)/);
                if (sm) score = parseFloat(sm[1]);
            }

            const reviewCountEl = card.querySelector('[data-testid="review-score"] > div:nth-child(2) > div:nth-child(2)');
            let reviewCount = 0;
            if (reviewCountEl) {
                const rcm = reviewCountEl.textContent.match(/([\\d.,]+)/);
                if (rcm) reviewCount = parseInt(rcm[1].replace(/[.,]/g, ''));
            }

            const linkEl = card.querySelector('a[data-testid="title-link"], a[href*="/hotel/"]');
            const link = linkEl ? linkEl.href : '';

            const distEl = card.querySelector('[data-testid="distance"]');
            const distance = distEl ? distEl.textContent.trim() : '';

            const cardText = card.textContent.toLowerCase();
            const sea = cardText.includes('sea view') || cardText.includes('vista mare')
                || cardText.includes('beach') || cardText.includes('spiaggia')
                || cardText.includes('playa') || cardText.includes('fronte mare')
                || cardText.includes('sul mare') || cardText.includes('vista al mar');

            // Detect beachfront badge specifically
            const beachBadge = cardText.includes('beachfront') || cardText.includes('frente a la playa')
                || cardText.includes('fronte mare') || cardText.includes('sulla spiaggia')
                || cardText.includes('on the beach') || cardText.includes('first line')
                || cardText.includes('primera línea') || cardText.includes('beach access')
                || cardText.includes('acceso a la playa') || cardText.includes('playa privada')
                || cardText.includes('private beach');

            // Check if card is a promoted/ad result (not matching filters)
            const isAd = card.querySelector('[data-testid="deals-badge"]') !== null
                || cardText.includes('anuncio') || cardText.includes('sponsored')
                || cardText.includes('patrocinado');

            const origPriceEl = card.querySelector('[aria-hidden="true"] [class*="price"], [class*="crossed"], [style*="line-through"]');
            let originalPrice = 0;
            if (origPriceEl) {
                const opn = origPriceEl.textContent.replace(/[^0-9.,]/g, '').replace(',', '');
                if (opn) originalPrice = parseInt(opn);
            }

            const discountEl = card.querySelector('[class*="discount"], [class*="deal"], [data-testid*="discount"]');
            const discountText = discountEl ? discountEl.textContent.trim() : '';

            if (name && price > 0) {
                results.push({
                    name, price, stars, score, reviewCount,
                    link, distance, sea, beachBadge, isAd, originalPrice, discountText
                });
            }
        } catch(e) {}
    });
    return results;
}"""


async def scrape_destination(page, destination_name, destination_query, checkin, checkout, adults=2,
                             no_rooms=1, currency=None, pages=1, **filter_kwargs):
    """
    Scrape hotels for one destination using infinite scroll.
    v4.2: All Booking.com filters passed via **filter_kwargs to build_url().
    pages param controls scroll depth (pages * 25 ~ target hotels).
    Returns list of hotel dicts with name, stars, price, score, etc.
    """
    all_hotels = []
    seen_names = set()

    url = build_url(destination_query, checkin, checkout, adults,
                    no_rooms=no_rooms, currency=currency, **filter_kwargs)

    try:
        for attempt in range(3):
            try:
                await page.goto(url, timeout=REQUEST_TIMEOUT * 1000, wait_until="domcontentloaded")
                break
            except Exception as goto_err:
                if attempt < 2:
                    print(f"      ⚠️ Retry {attempt+1}/3: {str(goto_err)[:50]}", flush=True)
                    await asyncio.sleep(3 * (attempt + 1))
                else:
                    raise goto_err
        await asyncio.sleep(3)

        # Infinite scroll: scroll down to load more results
        target_hotels = pages * RESULTS_PER_PAGE
        prev_count = 0
        stale_rounds = 0
        max_scrolls = pages * 4  # safety limit

        for scroll_i in range(max_scrolls):
            raw = await page.evaluate(EXTRACT_JS)
            current_count = len(raw)

            if current_count >= target_hotels:
                break  # Got enough
            if current_count == prev_count:
                stale_rounds += 1
                if stale_rounds >= 3:
                    break  # No more results loading
            else:
                stale_rounds = 0

            prev_count = current_count
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1.2)

        # Final extraction after all scrolling
        raw = await page.evaluate(EXTRACT_JS)

        for h in raw:
            if not is_hotel(h["name"], allow_riads=filter_kwargs.get("no_hotel_filter", False)):
                continue
            if h["name"] in seen_names:
                continue
            # Skip promoted/ad results that may not match filters
            if h.get("isAd", False):
                continue
            seen_names.add(h["name"])

            raw_link = h["link"]
            if raw_link:
                base = raw_link.split("?")[0] if "?" in raw_link else raw_link
                clean_link = (
                    f"{base}?checkin={checkin}&checkout={checkout}"
                    f"&group_adults={adults}&no_rooms={no_rooms}&group_children=0"
                    f"&selected_currency={currency or CURRENCY}"
                )
            else:
                clean_link = ""

            all_hotels.append({
                "destination": destination_name,
                "name": h["name"],
                "price_total": h["price"],
                "stars": h["stars"],
                "score": h["score"],
                "review_count": h["reviewCount"],
                "link": clean_link,
                "distance": h["distance"],
                "sea": h["sea"],
                "beach_badge": h.get("beachBadge", False),
                "original_price": h["originalPrice"],
                "discount_text": h["discountText"],
                "adults": adults,
                "no_rooms": no_rooms,
                "currency": currency or CURRENCY,
                "checkin": checkin,
                "checkout": checkout,
                "scraped_at": datetime.now().isoformat(),
            })

    except Exception as e:
        print(f"      ❌ Error scraping {destination_name}: {str(e)[:80]}")

    return all_hotels[:MAX_RESULTS_PER_DESTINATION]


async def create_context(browser, mobile=False):
    """Create a browser context with random UA (Improvement 8: UA rotation)"""
    if mobile:
        return await browser.new_context(
            viewport={"width": 390, "height": 844},
            locale="en-US",
            user_agent=get_random_mobile_ua(),
            is_mobile=True,
        )
    else:
        return await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            user_agent=get_random_ua(),
        )


async def scrape_all_destinations(destinations, checkin, checkout, adults=2, show_progress=True,
                                   pages=1, **filter_kwargs):
    """Scrape multiple destinations with a single browser instance.
    All filter params (beachfront, pool, min_review, etc.) passed via **filter_kwargs."""
    all_hotels = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        total = len(destinations)
        for i, (name, query) in enumerate(destinations.items(), 1):
            if show_progress:
                print(f"   [{i}/{total}] {name}...", end=" ", flush=True)

            hotels = await scrape_destination(page, name, query, checkin, checkout, adults,
                                              pages=pages, **filter_kwargs)

            if show_progress:
                if hotels:
                    cheapest = min(h["price_total"] for h in hotels)
                    print(f"✅ {len(hotels)} hotels (from {cheapest}€)", flush=True)
                else:
                    print(f"— No results", flush=True)

            all_hotels.extend(hotels)
            delay = random.uniform(*DELAY_BETWEEN_SEARCHES)
            await asyncio.sleep(delay)

            # Rotate UA every 5 destinations
            if i % 5 == 0:
                await context.close()
                context = await create_context(browser)
                page = await context.new_page()

        await browser.close()

    return all_hotels


async def scrape_multi_date(destinations, base_checkin, nights=7, weeks_to_compare=4, adults=2,
                            pages=1, concurrent=3, **filter_kwargs):
    """
    Scrape same destinations across multiple weeks for cross-date comparison.
    Uses parallel execution with N concurrent pages for speed.
    Returns dict: {destination: {week_start: [hotels]}}
    """
    # Remove 'adults' from filter_kwargs if present to avoid duplicate keyword
    filter_kwargs.pop('adults', None)
    base = datetime.strptime(base_checkin, "%Y-%m-%d")
    date_ranges = []
    for w in range(weeks_to_compare):
        ci = base + timedelta(weeks=w)
        co = ci + timedelta(days=nights)
        date_ranges.append((ci.strftime("%Y-%m-%d"), co.strftime("%Y-%m-%d")))

    print(f"\n   📅 Cross-date search: {weeks_to_compare} weeks starting {base_checkin}")
    print(f"   ⚡ Parallel scraping: {concurrent} concurrent pages")
    for ci, co in date_ranges:
        print(f"      {ci} → {co}")

    results_by_date = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        total_searches = len(destinations) * len(date_ranges)
        done = 0
        ua_rotation_counter = 0

        for ci, co in date_ranges:
            results_by_date[ci] = []

            # Build task list: [(dest_name, dest_query, checkin, checkout), ...]
            tasks = [(name, query, ci, co) for name, query in destinations.items()]

            # Process tasks in batches of concurrent
            for batch_start in range(0, len(tasks), concurrent):
                batch = tasks[batch_start:batch_start + concurrent]

                # Create N pages for this batch
                contexts_and_pages = []
                for _ in range(len(batch)):
                    ctx = await create_context(browser)
                    pg = await ctx.new_page()
                    contexts_and_pages.append((ctx, pg))

                # Run scrape_destination for each destination in parallel
                async def scrape_task(idx, ctx, pg, name, query, ci_d, co_d):
                    nonlocal done
                    done += 1
                    print(f"   [{done}/{total_searches}] {name} ({ci_d})...", end=" ", flush=True)

                    hotels = await scrape_destination(pg, name, query, ci_d, co_d, adults,
                                                     pages=pages, **filter_kwargs)

                    if hotels:
                        cheapest = min(h["price_total"] for h in hotels)
                        print(f"✅ {len(hotels)} ({cheapest}€)", flush=True)
                    else:
                        print(f"—", flush=True)

                    return hotels

                # Gather all parallel scrapes
                coroutines = [
                    scrape_task(idx, ctx, pg, name, query, ci_d, co_d)
                    for idx, ((ctx, pg), (name, query, ci_d, co_d)) in enumerate(zip(contexts_and_pages, batch))
                ]
                batch_results = await asyncio.gather(*coroutines)

                # Collect results
                for hotels in batch_results:
                    results_by_date[ci].extend(hotels)
                    await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

                # Close contexts
                for ctx, pg in contexts_and_pages:
                    await ctx.close()

                # Rotate UA every ~10 requests
                ua_rotation_counter += len(batch)
                if ua_rotation_counter >= 10:
                    ua_rotation_counter = 0

        await browser.close()

    return results_by_date, date_ranges


async def scrape_flexible_dates(destinations, flex_start, flex_end, nights=7, flex_step=3,
                                adults=2, pages=1, concurrent=3, **filter_kwargs):
    """
    Scan a full date range to find the cheapest check-in for each destination.
    Generates check-in dates every flex_step days across the range.
    Returns: (all_results_by_date, best_by_hotel, date_list)
    """
    flex_start_dt = datetime.strptime(flex_start, "%Y-%m-%d")
    flex_end_dt = datetime.strptime(flex_end, "%Y-%m-%d")

    # Generate check-in dates every flex_step days, accounting for stay duration
    date_list = []
    current = flex_start_dt
    while current <= flex_end_dt - timedelta(days=nights):
        ci = current.strftime("%Y-%m-%d")
        co = (current + timedelta(days=nights)).strftime("%Y-%m-%d")
        date_list.append((ci, co))
        current += timedelta(days=flex_step)

    print(f"\n   📅 Flexible date search: {len(date_list)} check-in dates from {flex_start} to {flex_end}")
    print(f"   ⚡ Parallel scraping: {concurrent} concurrent pages | Step: {flex_step} days")

    results_by_date = {}
    best_by_hotel = {}  # {(destination, hotel_name): (best_price, best_date, hotel_data)}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        total_searches = len(destinations) * len(date_list)
        done = 0

        for ci, co in date_list:
            results_by_date[ci] = []

            # Build task list
            tasks = [(name, query, ci, co) for name, query in destinations.items()]

            # Process tasks in batches of concurrent
            for batch_start in range(0, len(tasks), concurrent):
                batch = tasks[batch_start:batch_start + concurrent]

                # Create N pages for this batch
                contexts_and_pages = []
                for _ in range(len(batch)):
                    ctx = await create_context(browser)
                    pg = await ctx.new_page()
                    contexts_and_pages.append((ctx, pg))

                # Run scrape_destination for each destination in parallel
                async def scrape_task(idx, ctx, pg, name, query, ci_d, co_d):
                    nonlocal done
                    done += 1
                    print(f"   [{done}/{total_searches}] {name} ({ci_d})...", end=" ", flush=True)

                    hotels = await scrape_destination(pg, name, query, ci_d, co_d, adults,
                                                     pages=pages, **filter_kwargs)

                    if hotels:
                        cheapest = min(h["price_total"] for h in hotels)
                        print(f"✅ {len(hotels)} ({cheapest}€)", flush=True)
                    else:
                        print(f"—", flush=True)

                    return hotels

                # Gather all parallel scrapes
                coroutines = [
                    scrape_task(idx, ctx, pg, name, query, ci_d, co_d)
                    for idx, ((ctx, pg), (name, query, ci_d, co_d)) in enumerate(zip(contexts_and_pages, batch))
                ]
                batch_results = await asyncio.gather(*coroutines)

                # Collect results and track best prices
                for hotels in batch_results:
                    results_by_date[ci].extend(hotels)
                    for h in hotels:
                        key = (h["destination"], h["name"])
                        price = h["price_total"]
                        if key not in best_by_hotel or price < best_by_hotel[key][0]:
                            best_by_hotel[key] = (price, ci, h)
                    await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

                # Close contexts
                for ctx, pg in contexts_and_pages:
                    await ctx.close()

        await browser.close()

    return results_by_date, best_by_hotel, date_list


async def verify_price_google(page, hotel_name, destination, checkin, checkout):
    """
    Search Google Hotels for this hotel and extract competing prices.
    Returns dict with prices from different OTAs.
    """
    try:
        # Format dates for Google Hotels (YYYY-MM-DD format already used)
        url = f"https://www.google.com/travel/hotels/{destination.replace(' ', '+')}"

        # Add search parameters
        url += f"?q={hotel_name.replace(' ', '+')}"
        url += f"&dates={checkin}%2C{checkout}"

        await page.goto(url, timeout=REQUEST_TIMEOUT * 1000, wait_until="domcontentloaded")
        await asyncio.sleep(2)

        # Extract prices from different OTAs (they appear as tabs or in comparison view)
        price_data = await page.evaluate("""() => {
            const results = {};

            // Look for price cards from different OTAs
            const priceElements = document.querySelectorAll('[data-ota]');
            priceElements.forEach(el => {
                const ota = el.getAttribute('data-ota');
                const priceText = el.textContent;
                const match = priceText.match(/([\\d.,]+)/);
                if (match && ota) {
                    results[ota] = parseInt(match[1].replace(/[.,]/g, ''));
                }
            });

            return results;
        }""")

        return {
            "hotel": hotel_name,
            "destination": destination,
            "checkin": checkin,
            "checkout": checkout,
            "ota_prices": price_data,
            "verified_at": datetime.now().isoformat(),
        }

    except Exception as e:
        return {
            "hotel": hotel_name,
            "destination": destination,
            "error": str(e)[:100],
        }


async def scrape_adult_comparison(destinations, checkin, checkout,
                                   pages=1, **filter_kwargs):
    """Scrape with 1 adult AND 2 adults for room type comparison."""
    print(f"\n   👤 Comparación habitación simple vs doble")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        hotels_1 = []
        hotels_2 = []
        total = len(destinations)

        for i, (name, query) in enumerate(destinations.items(), 1):
            print(f"   [{i}/{total}] {name}...", flush=True)

            h1 = await scrape_destination(page, name, query, checkin, checkout, adults=1,
                                           pages=pages, **filter_kwargs)
            print(f"      👤 1 adulto (simple): {len(h1)} hoteles", flush=True)
            hotels_1.extend(h1)
            await asyncio.sleep(random.uniform(3, 6))

            h2 = await scrape_destination(page, name, query, checkin, checkout, adults=2,
                                           pages=pages, **filter_kwargs)
            print(f"      👥 2 adultos (doble):  {len(h2)} hoteles", flush=True)
            hotels_2.extend(h2)
            await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

        await browser.close()

    return hotels_1, hotels_2


async def scrape_full_comparison(destinations, base_checkin, nights=7, weeks_to_compare=4,
                                  pages=1, concurrent=3, adults=2, **filter_kwargs):
    """Full comparison: cross-date + room type (1 vs 2 adults)."""
    # Remove 'adults' from filter_kwargs if present to avoid duplicate keyword
    filter_kwargs.pop('adults', None)
    base = datetime.strptime(base_checkin, "%Y-%m-%d")
    date_ranges = []
    for w in range(weeks_to_compare):
        ci = base + timedelta(weeks=w)
        co = ci + timedelta(days=nights)
        date_ranges.append((ci.strftime("%Y-%m-%d"), co.strftime("%Y-%m-%d")))

    print(f"\n   📅 Full comparison: {weeks_to_compare} weeks × 2 room types")
    print(f"   ⚡ Parallel scraping: {concurrent} concurrent pages")
    for ci, co in date_ranges:
        print(f"      {ci} → {co}")

    results_1adult = {}
    results_2adults = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        total_searches = len(destinations) * len(date_ranges) * 2
        done = 0

        for ci, co in date_ranges:
            results_2adults[ci] = []
            results_1adult[ci] = []
            for name, query in destinations.items():
                done += 1
                print(f"   [{done}/{total_searches}] {name} ({ci}) 👥2 adultos...", end=" ", flush=True)
                h2 = await scrape_destination(page, name, query, ci, co, adults=2,
                                               pages=pages, **filter_kwargs)
                if h2:
                    cheapest = min(h["price_total"] for h in h2)
                    print(f"✅ {len(h2)} ({cheapest}€)", flush=True)
                else:
                    print(f"—", flush=True)
                results_2adults[ci].extend(h2)
                await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

                done += 1
                print(f"   [{done}/{total_searches}] {name} ({ci}) 👤1 adulto...", end=" ", flush=True)
                h1 = await scrape_destination(page, name, query, ci, co, adults=1,
                                               pages=pages, **filter_kwargs)
                if h1:
                    cheapest = min(h["price_total"] for h in h1)
                    print(f"✅ {len(h1)} ({cheapest}€)", flush=True)
                else:
                    print(f"—", flush=True)
                results_1adult[ci].extend(h1)
                await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

                # Rotate UA periodically
                if done % 10 == 0:
                    await context.close()
                    context = await create_context(browser)
                    page = await context.new_page()

        await browser.close()

    return results_1adult, results_2adults, date_ranges


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 4: Duration arbitrage (7n vs 14n per-night price)
# ═══════════════════════════════════════════════════════════

async def scrape_duration_comparison(destinations, checkin, nights_options=(7, 14),
                                      pages=1, **filter_kwargs):
    """Same hotel, same check-in, but different stay lengths."""
    print(f"\n   📏 Comparación de duración: {' vs '.join(f'{n}n' for n in nights_options)}")

    results_by_nights = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        total = len(destinations) * len(nights_options)
        done = 0

        for nights in nights_options:
            co = (datetime.strptime(checkin, "%Y-%m-%d") + timedelta(days=nights)).strftime("%Y-%m-%d")
            results_by_nights[nights] = []

            for name, query in destinations.items():
                done += 1
                print(f"   [{done}/{total}] {name} ({nights}n)...", end=" ", flush=True)
                hotels = await scrape_destination(page, name, query, checkin, co, adults=2,
                                                   pages=pages, **filter_kwargs)
                if hotels:
                    cheapest = min(h["price_total"] for h in hotels)
                    print(f"✅ {len(hotels)} ({cheapest}€)", flush=True)
                else:
                    print(f"—", flush=True)
                results_by_nights[nights].extend(hotels)
                await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

        await browser.close()

    return results_by_nights


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 5: Currency arbitrage (EUR vs USD vs GBP)
# ═══════════════════════════════════════════════════════════

async def scrape_currency_comparison(destinations, checkin, checkout, currencies=("EUR", "USD", "GBP"),
                                      pages=1, **filter_kwargs):
    """Same hotel, same dates, but searched in different currencies."""
    print(f"\n   💱 Comparación de moneda: {', '.join(currencies)}")

    results_by_currency = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        total = len(destinations) * len(currencies)
        done = 0

        for cur in currencies:
            results_by_currency[cur] = []

            for name, query in destinations.items():
                done += 1
                print(f"   [{done}/{total}] {name} ({cur})...", end=" ", flush=True)
                kw = {**filter_kwargs, "currency": cur}
                hotels = await scrape_destination(page, name, query, checkin, checkout, adults=2,
                                                   pages=pages, **kw)
                if hotels:
                    cheapest = min(h["price_total"] for h in hotels)
                    print(f"✅ {len(hotels)} ({cheapest} {cur})", flush=True)
                else:
                    print(f"—", flush=True)
                results_by_currency[cur].extend(hotels)
                await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

        await browser.close()

    return results_by_currency


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 6: Check-in day arbitrage (different days same week)
# ═══════════════════════════════════════════════════════════

async def scrape_checkin_day_comparison(destinations, base_checkin, nights=7, day_offsets=(0, 2, 4),
                                         pages=1, **filter_kwargs):
    """Same hotel, same week, but different check-in days."""
    base = datetime.strptime(base_checkin, "%Y-%m-%d")
    days = []
    for offset in day_offsets:
        ci = base + timedelta(days=offset)
        co = ci + timedelta(days=nights)
        days.append((ci.strftime("%Y-%m-%d"), co.strftime("%Y-%m-%d"), ci.strftime("%A")))

    print(f"\n   📅 Comparación de día de check-in:")
    for ci, co, day_name in days:
        print(f"      {day_name}: {ci} → {co}")

    results_by_day = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        total = len(destinations) * len(days)
        done = 0

        for ci, co, day_name in days:
            results_by_day[ci] = []

            for name, query in destinations.items():
                done += 1
                print(f"   [{done}/{total}] {name} ({day_name} {ci})...", end=" ", flush=True)
                hotels = await scrape_destination(page, name, query, ci, co, adults=2,
                                                   pages=pages, **filter_kwargs)
                if hotels:
                    cheapest = min(h["price_total"] for h in hotels)
                    print(f"✅ {len(hotels)} ({cheapest}€)", flush=True)
                else:
                    print(f"—", flush=True)
                results_by_day[ci].extend(hotels)
                await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

        await browser.close()

    return results_by_day, days


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 7: Room count comparison (1 vs 2 vs 3 rooms)
# ═══════════════════════════════════════════════════════════

async def scrape_rooms_comparison(destinations, checkin, checkout, room_configs=((1, 2), (2, 4), (3, 6)),
                                   pages=1, **filter_kwargs):
    """Same hotel, different room configurations. Compare per-room price."""
    print(f"\n   🛏️  Comparación de habitaciones: {', '.join(f'{r}hab/{a}ad' for r, a in room_configs)}")

    results_by_rooms = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        total = len(destinations) * len(room_configs)
        done = 0

        for no_rooms, adults in room_configs:
            results_by_rooms[no_rooms] = []

            for name, query in destinations.items():
                done += 1
                print(f"   [{done}/{total}] {name} ({no_rooms} hab, {adults} ad)...", end=" ", flush=True)
                hotels = await scrape_destination(page, name, query, checkin, checkout,
                                                   adults=adults, no_rooms=no_rooms,
                                                   pages=pages, **filter_kwargs)
                if hotels:
                    cheapest = min(h["price_total"] for h in hotels)
                    print(f"✅ {len(hotels)} ({cheapest}€)", flush=True)
                else:
                    print(f"—", flush=True)
                results_by_rooms[no_rooms].extend(hotels)
                await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

        await browser.close()

    return results_by_rooms


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 9: Mobile vs desktop user-agent comparison
# ═══════════════════════════════════════════════════════════

async def scrape_mobile_comparison(destinations, checkin, checkout,
                                    pages=1, **filter_kwargs):
    """Compare desktop vs mobile user-agent prices."""
    print(f"\n   📱 Comparación desktop vs mobile")

    results = {"desktop": [], "mobile": []}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        ctx_desktop = await create_context(browser, mobile=False)
        page_desktop = await ctx_desktop.new_page()

        ctx_mobile = await create_context(browser, mobile=True)
        page_mobile = await ctx_mobile.new_page()

        total = len(destinations) * 2
        done = 0

        for name, query in destinations.items():
            done += 1
            print(f"   [{done}/{total}] {name} (desktop)...", end=" ", flush=True)
            hd = await scrape_destination(page_desktop, name, query, checkin, checkout, adults=2,
                                           pages=pages, **filter_kwargs)
            if hd:
                cheapest = min(h["price_total"] for h in hd)
                print(f"✅ {len(hd)} ({cheapest}€)", flush=True)
            else:
                print(f"—", flush=True)
            results["desktop"].extend(hd)
            await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

            done += 1
            print(f"   [{done}/{total}] {name} (mobile)...", end=" ", flush=True)
            hm = await scrape_destination(page_mobile, name, query, checkin, checkout, adults=2,
                                           pages=pages, **filter_kwargs)
            if hm:
                cheapest = min(h["price_total"] for h in hm)
                print(f"✅ {len(hm)} ({cheapest}€)", flush=True)
            else:
                print(f"—", flush=True)
            results["mobile"].extend(hm)
            await asyncio.sleep(random.uniform(*DELAY_BETWEEN_SEARCHES))

        await browser.close()

    return results


# ═══════════════════════════════════════════════════════════
# IMPROVEMENT 4: Scrape room types within a hotel page
# ═══════════════════════════════════════════════════════════

async def scrape_hotel_room_types(page, hotel_url):
    """
    Navigate to a specific hotel page and extract room type pricing.
    Returns list of {room_type, price, meal_plan, capacity} dicts.
    """
    try:
        await page.goto(hotel_url, timeout=REQUEST_TIMEOUT * 1000, wait_until="domcontentloaded")
        await asyncio.sleep(3)

        rooms = await page.evaluate("""() => {
            const rows = document.querySelectorAll('table.hprt-table tbody tr, [data-testid="room-type-card"]');
            const results = [];
            const seen = new Set();

            rows.forEach(row => {
                try {
                    // Room name
                    const nameEl = row.querySelector('.hprt-roomtype-icon-link, [data-testid="room-type-title"], .room_link');
                    const name = nameEl ? nameEl.textContent.trim() : '';

                    // Price
                    const priceEl = row.querySelector('.prco-valign-middle-helper, [data-testid="price-and-discounted-price"], .bui-price-display__value');
                    let price = 0;
                    if (priceEl) {
                        const nums = priceEl.textContent.replace(/[^0-9.,]/g, '').replace(',', '');
                        if (nums) price = parseInt(nums);
                    }

                    // Meal plan
                    const mealEl = row.querySelector('.hprt-roomtype-mealplan, [class*="meal"]');
                    const meal = mealEl ? mealEl.textContent.trim() : '';

                    // Capacity
                    const capEl = row.querySelector('.hprt-occupancy-occupancy-info, [class*="occupancy"]');
                    const capacity = capEl ? capEl.textContent.trim() : '';

                    if (name && price > 0 && !seen.has(name)) {
                        seen.add(name);
                        results.push({name, price, meal, capacity});
                    }
                } catch(e) {}
            });
            return results;
        }""")

        return rooms or []

    except Exception as e:
        return []


async def scrape_room_types_for_hotels(hotel_links, max_hotels=10,
                                        beachfront=False, all_inclusive=False, sea_view=False, min_stars=None):
    """
    IMPROVEMENT 4: For top N hotels, navigate to their pages and extract room type pricing.
    hotel_links: list of {name, destination, link, ...} dicts
    Returns {hotel_name: [room_types]}
    """
    print(f"\n   🏷️  Scraping room types for top {min(max_hotels, len(hotel_links))} hotels...")

    results = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await create_context(browser)
        page = await context.new_page()

        for i, hotel in enumerate(hotel_links[:max_hotels]):
            link = hotel.get("link", "")
            name = hotel.get("name", "Unknown")
            if not link:
                continue

            print(f"   [{i+1}/{min(max_hotels, len(hotel_links))}] {name[:40]}...", end=" ", flush=True)
            rooms = await scrape_hotel_room_types(page, link)

            if rooms:
                results[name] = {
                    "destination": hotel.get("destination", ""),
                    "hotel_data": hotel,
                    "room_types": rooms,
                }
                print(f"✅ {len(rooms)} tipos de habitación", flush=True)
            else:
                print(f"— No room data", flush=True)

            await asyncio.sleep(random.uniform(3, 6))

        await browser.close()

    return results
