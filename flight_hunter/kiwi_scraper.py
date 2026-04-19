"""Kiwi.com Tequila API integration for real-time flight prices.

Uses the Kiwi Tequila API (free registration required):
- Free tier: generous search quota
- Real-time prices from 750+ airlines
- Supports all cabin classes (Economy, Business, First)
- Returns prices in EUR directly
- Registration: https://tequila.kiwi.com/portal/login

API docs: https://tequila.kiwi.com/portal/docs/tequila_api
"""

import asyncio
import aiohttp
import os
import json
from datetime import datetime, timedelta
import config


def get_kiwi_key():
    """Get Kiwi Tequila API key from env or config"""
    return os.environ.get("KIWI_API_KEY", getattr(config, "KIWI_API_KEY", ""))


class KiwiScraper:
    """Fetches flight prices from Kiwi Tequila API (free key required)"""

    SEARCH_URL = "https://tequila-api.kiwi.com/v2/search"

    # Cabin class mapping for Kiwi/Skypicker: M=Economy, C=Business, F=First
    CABIN_MAPPING = {
        config.CABIN_ECONOMY: "M",
        config.CABIN_BUSINESS: "C",
        config.CABIN_FIRST: "F",
    }

    def __init__(self, api_key=None):
        """Initialize Kiwi Tequila client"""
        self.api_key = api_key or get_kiwi_key()
        self.searches_used = 0
        self.available = bool(self.api_key)

    async def search_route(self, session, origin, dest, date_out, date_ret=None, cabin=None):
        """
        Search flights for a specific route and cabin class via Kiwi Tequila.

        Args:
            session: aiohttp session
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (YYYY-MM-DD), optional for one-way
            cabin: Cabin class code (1=Economy, 3=Business, 4=First)

        Returns:
            List of flight dictionaries matching serpapi schema
        """
        if not self.api_key:
            return []

        if cabin is None:
            cabin = config.CABIN_ECONOMY

        cabin_code = self.CABIN_MAPPING.get(cabin, "M")
        cabin_name = config.get_cabin_name(cabin)

        date_from = self._convert_date(date_out)
        date_to = date_from

        params = {
            "fly_from": origin,
            "fly_to": dest,
            "date_from": date_from,
            "date_to": date_to,
            "flight_type": "round" if date_ret else "oneway",
            "adults": 1,
            "curr": "EUR",
            "locale": "en",
            "max_stopovers": 2,
            "selected_cabins": cabin_code,
            "limit": 30,
        }
        if date_ret:
            params["return_from"] = self._convert_date(date_ret)
            params["return_to"] = self._convert_date(date_ret)

        headers = {"apikey": self.api_key}

        try:
            async with session.get(self.SEARCH_URL, params=params, headers=headers) as resp:
                self.searches_used += 1

                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_results(data, origin, dest, date_out, date_ret, cabin, cabin_name)
                elif resp.status == 429:
                    print(f"      ⏳ Kiwi rate limited", flush=True)
                    await asyncio.sleep(3)
                    return []
                elif resp.status == 403:
                    if self.available:
                        print(f"      ❌ Kiwi API key inválida o expirada", flush=True)
                        self.available = False
                    return []
                else:
                    error_text = await resp.text()
                    print(f"      ⚠️ Kiwi {resp.status}: {error_text[:80]}", flush=True)
                    return []

        except asyncio.TimeoutError:
            print(f"      ⏱️ Timeout: {origin}→{dest}", flush=True)
            return []
        except Exception as e:
            print(f"      ❌ {origin}→{dest}: {str(e)[:80]}", flush=True)
            return []

    def _convert_date(self, date_str):
        """Convert YYYY-MM-DD to DD/MM/YYYY"""
        if not date_str:
            return None
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            return dt.strftime("%d/%m/%Y")
        except:
            return date_str

    def _parse_results(self, data, origin, dest, date_out, date_ret, cabin, cabin_name):
        """
        Parse Kiwi Skypicker response into standard flight schema.

        Args:
            data: JSON response from Skypicker API
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (optional)
            cabin: Cabin class code (numeric)
            cabin_name: Human-readable cabin name

        Returns:
            List of flight dictionaries matching serpapi schema
        """
        flights = []

        for offer in data.get("data", []):
            try:
                price_eur = float(offer.get("price", 0))
                if price_eur <= 0:
                    continue

                # Get airlines from route segments
                route = offer.get("route", [])
                if not route:
                    continue

                airlines_list = list(set(s.get("airline", "") for s in route if s.get("airline")))
                airline = airlines_list[0] if airlines_list else "Unknown"

                # Count stops: total segments - 1 for each leg
                # For round trip, divide by 2 (outbound and return are separate)
                total_segments = len(route)
                if date_ret:
                    # Round trip: typically split between outbound and return
                    # Count stops in outbound leg only
                    segments_per_leg = total_segments // 2 if total_segments > 1 else 1
                    stops = max(0, segments_per_leg - 1)
                else:
                    stops = max(0, total_segments - 1)

                # Duration in seconds
                duration_sec = offer.get("duration", {}).get("total", 0)
                if duration_sec:
                    hours = duration_sec // 3600
                    mins = (duration_sec % 3600) // 60
                    duration = f"PT{hours}H{mins}M"
                    duration_minutes = duration_sec
                else:
                    duration = ""
                    duration_minutes = 0

                # Booking token (deep_link for Kiwi)
                deep_link = offer.get("deep_link", "")

                # Departure and arrival times
                dep_time = ""
                arr_time = ""
                if route:
                    dep_time = route[0].get("departure", {}).get("time", "") if isinstance(route[0].get("departure"), dict) else ""
                    arr_time = route[-1].get("arrival", {}).get("time", "") if isinstance(route[-1].get("arrival"), dict) else ""

                # Layover info
                layover_info = ""
                if stops > 0 and len(route) > 1:
                    # Middle airports in the route
                    layover_airports = []
                    for i in range(1, len(route)):
                        airport = route[i].get("flyFrom", "")
                        if airport and airport != origin and airport != dest:
                            layover_airports.append(airport)
                    if layover_airports:
                        layover_info = " → ".join(layover_airports)

                flights.append({
                    "origin": origin,
                    "destination": dest,
                    "date_out": date_out,
                    "date_ret": date_ret,
                    "price_eur": float(price_eur),
                    "airline": airline,
                    "stops": stops,
                    "cabin": cabin_name,
                    "cabin_code": cabin,
                    "duration": duration,
                    "duration_minutes": duration_minutes,
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "layover_info": layover_info,
                    "source": "kiwi",
                    "booking_token": deep_link,
                    "scraped_at": datetime.now().isoformat(),
                })

            except Exception:
                continue

        return flights

    async def search_routes(self, routes, dates, max_concurrent=3, budget_limit=None, cabin=None):
        """
        Search multiple routes in specified cabin class.

        Args:
            routes: List of (origin, dest) tuples
            dates: List of (date_out, date_ret) tuples
            max_concurrent: Max concurrent requests (Kiwi is free, so we can be generous)
            budget_limit: Not used for Kiwi (unlimited free API), kept for compatibility
            cabin: Cabin class code (defaults to CABIN_ECONOMY)
        """
        if cabin is None:
            cabin = config.CABIN_ECONOMY

        cabin_name = config.get_cabin_name(cabin)
        all_results = []
        total = len(routes) * len(dates)
        done = 0

        timeout = aiohttp.ClientTimeout(total=45)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            semaphore = asyncio.Semaphore(max_concurrent)

            async def search_one(origin, dest, date_out, date_ret):
                nonlocal done
                async with semaphore:
                    done += 1
                    print(f"   [{done}/{total}] {origin}→{dest} {date_out} [{cabin_name}] (search #{self.searches_used + 1})", flush=True)

                    results = await self.search_route(session, origin, dest, date_out, date_ret, cabin=cabin)
                    if results:
                        cheapest = min(r["price_eur"] for r in results)
                        print(f"      ✅ {len(results)} offers (cheapest: {cheapest:.0f}€ {cabin_name})", flush=True)
                    else:
                        print(f"      — No results", flush=True)

                    # Rate limit: 1-2 seconds between requests to be respectful
                    await asyncio.sleep(1)
                    return results

            tasks = []
            for origin, dest in routes:
                for date_out, date_ret in dates:
                    tasks.append(search_one(origin, dest, date_out, date_ret))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    all_results.extend(r)

        print(f"\n   📊 Kiwi: {self.searches_used} searches used → {len(all_results)} flight offers [{cabin_name}]")
        return all_results


async def main():
    """Test Kiwi Skypicker integration (no API key required)"""
    scraper = KiwiScraper()
    routes = [("CDG", "NRT"), ("FRA", "JFK"), ("MAD", "BKK")]
    base = datetime.now() + timedelta(days=90)
    dates = [(base.strftime("%Y-%m-%d"), (base + timedelta(days=7)).strftime("%Y-%m-%d"))]

    # Test Business class search
    print("✈️ KIWI SKYPICKER — MULTI-CABIN TEST", flush=True)

    print("\n📍 Business Class Search", flush=True)
    results_biz = await scraper.search_routes(routes, dates, cabin=config.CABIN_BUSINESS)
    for r in sorted(results_biz, key=lambda x: x["price_eur"])[:5]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops | {r['cabin']}")

    # Test Economy search
    print("\n📍 Economy Class Search", flush=True)
    results_eco = await scraper.search_routes(routes, dates, cabin=config.CABIN_ECONOMY)
    for r in sorted(results_eco, key=lambda x: x["price_eur"])[:5]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops | {r['cabin']}")


if __name__ == "__main__":
    asyncio.run(main())
