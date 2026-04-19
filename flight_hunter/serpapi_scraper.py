"""SerpApi Google Flights integration for real Business class prices.

SerpApi wraps Google Flights with a proper JSON API.
- Free tier: 100 searches/month (no card required)
- Returns real-time prices from ALL airlines via Google Flights
- Supports Business class filtering
- Registration: https://serpapi.com (sign up with Google/GitHub)

Docs: https://serpapi.com/google-flights-api
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
import config


class SerpApiScraper:
    """Fetches prices across multiple cabin classes via SerpApi (Google Flights engine)"""

    SEARCH_URL = "https://serpapi.com/search"

    def __init__(self, api_key=None):
        """
        Initialize SerpApi client.

        Args:
            api_key: SerpApi key (get free at https://serpapi.com)
        """
        self.api_key = api_key
        self.searches_used = 0

    async def search_route(self, session, origin, dest, date_out, date_ret=None, cabin=None):
        """
        Search flights for a specific route and cabin class via Google Flights.

        Args:
            session: aiohttp session
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (YYYY-MM-DD), optional for one-way
            cabin: Cabin class code (1=Economy, 2=Premium Economy, 3=Business, 4=First)
                   Defaults to CABIN_ECONOMY if not specified

        Returns:
            List of flight dictionaries with parsed results
        """
        if cabin is None:
            cabin = config.CABIN_ECONOMY

        if not self.api_key:
            print("   ❌ SerpApi key not configured!")
            return []

        params = {
            "engine": "google_flights",
            "api_key": self.api_key,
            "departure_id": origin,
            "arrival_id": dest,
            "outbound_date": date_out,
            "travel_class": cabin,
            "hl": "en",
            "gl": "es",
            "currency": "EUR",
        }

        if date_ret:
            params["return_date"] = date_ret
            params["type"] = 1  # Round trip
        else:
            params["type"] = 2  # One way

        try:
            async with session.get(self.SEARCH_URL, params=params) as resp:
                self.searches_used += 1

                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_results(data, origin, dest, date_out, date_ret, cabin)
                elif resp.status == 401:
                    print(f"      ❌ Invalid SerpApi key", flush=True)
                    return []
                elif resp.status == 429:
                    print(f"      ⏳ SerpApi rate limited (monthly quota?)", flush=True)
                    return []
                else:
                    error_text = await resp.text()
                    print(f"      ⚠️ SerpApi {resp.status}: {error_text[:100]}", flush=True)
                    return []
        except asyncio.TimeoutError:
            print(f"      ⏱️ Timeout: {origin}→{dest}", flush=True)
            return []
        except Exception as e:
            print(f"      ❌ {origin}→{dest}: {str(e)[:80]}", flush=True)
            return []

    def _parse_results(self, data, origin, dest, date_out, date_ret, cabin):
        """
        Parse SerpApi Google Flights response.

        Args:
            data: JSON response from SerpApi
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date
            date_ret: Return date (optional)
            cabin: Cabin class code

        Returns:
            List of flight dictionaries
        """
        flights = []
        cabin_name = config.get_cabin_name(cabin)

        # Google Flights returns best_flights and other_flights
        all_offers = data.get("best_flights", []) + data.get("other_flights", [])

        for offer in all_offers:
            try:
                price = offer.get("price")
                if not price or price <= 0:
                    continue

                # Get flights (legs) in this itinerary
                legs = offer.get("flights", [])
                if not legs:
                    continue

                # Airline from first leg
                airline = legs[0].get("airline", "Unknown")
                airline_logo = legs[0].get("airline_logo", "")

                # Stops = number of legs - 1 (for outbound)
                total_legs = len(legs)
                # For round trips, Google returns outbound legs only in each offer
                stops = total_legs - 1

                # Duration
                total_duration = offer.get("total_duration", 0)  # in minutes
                if total_duration:
                    hours = total_duration // 60
                    mins = total_duration % 60
                    duration = f"PT{hours}H{mins}M"
                else:
                    duration = ""

                # Departure/arrival times from first and last leg
                dep_time = legs[0].get("departure_airport", {}).get("time", "")
                arr_time = legs[-1].get("arrival_airport", {}).get("time", "")

                # Carbon emissions
                carbon_kg = offer.get("carbon_emissions", {}).get("this_flight", 0)
                if carbon_kg:
                    carbon_kg = carbon_kg / 1000  # grams to kg

                # Booking token for deep link
                booking_token = offer.get("booking_token", "")

                # Extensions (layover info, etc.)
                layovers = offer.get("layovers", [])
                layover_info = ""
                if layovers:
                    layover_cities = [l.get("name", "") for l in layovers]
                    layover_info = " → ".join(layover_cities)

                flights.append({
                    "origin": origin,
                    "destination": dest,
                    "date_out": date_out,
                    "date_ret": date_ret,
                    "price_eur": float(price),
                    "airline": airline,
                    "airline_logo": airline_logo,
                    "stops": stops,
                    "cabin": cabin_name,
                    "cabin_code": cabin,
                    "duration": duration,
                    "duration_minutes": total_duration,
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "layover_info": layover_info,
                    "carbon_kg": carbon_kg,
                    "source": "serpapi_google_flights",
                    "booking_token": booking_token,
                    "scraped_at": datetime.now().isoformat(),
                })

            except Exception:
                continue

        return flights

    async def search_economy_for_comparison(self, session, origin, dest, date_out, date_ret=None):
        """
        Search Economy prices for Business/Economy ratio detection.

        Uses the CABIN_ECONOMY constant from config.
        """
        if not self.api_key:
            return []

        params = {
            "engine": "google_flights",
            "api_key": self.api_key,
            "departure_id": origin,
            "arrival_id": dest,
            "outbound_date": date_out,
            "travel_class": config.CABIN_ECONOMY,
            "hl": "en",
            "gl": "es",
            "currency": "EUR",
        }
        if date_ret:
            params["return_date"] = date_ret
            params["type"] = 1

        try:
            async with session.get(self.SEARCH_URL, params=params) as resp:
                self.searches_used += 1
                if resp.status == 200:
                    data = await resp.json()
                    best = data.get("best_flights", [])
                    if best and best[0].get("price"):
                        return [{"price_eur": float(best[0]["price"]), "source": "serpapi_economy", "cabin": "Economy", "cabin_code": config.CABIN_ECONOMY}]
        except:
            pass
        return []

    async def search_multi_cabin(self, session, origin, dest, date_out, date_ret=None):
        """
        Search same route in both Economy and Business cabin classes.

        Useful for T4 cabin ratio detection and price comparison.

        Args:
            session: aiohttp session
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (YYYY-MM-DD), optional

        Returns:
            Dictionary with 'economy' and 'business' keys, each containing a list of flights
        """
        # Search both cabins concurrently
        economy_task = self.search_route(session, origin, dest, date_out, date_ret, cabin=config.CABIN_ECONOMY)
        business_task = self.search_route(session, origin, dest, date_out, date_ret, cabin=config.CABIN_BUSINESS)

        economy_results, business_results = await asyncio.gather(economy_task, business_task)

        return {
            "economy": economy_results,
            "business": business_results,
        }

    async def search_routes(self, routes, dates, max_concurrent=2, budget_limit=None, cabin=None):
        """
        Search multiple routes in specified cabin class.

        Conservative concurrency for free tier.

        Args:
            routes: List of (origin, dest) tuples
            dates: List of (date_out, date_ret) tuples
            max_concurrent: Max concurrent requests
            budget_limit: Stop after this many API calls (defaults to config.SERPAPI_MONTHLY_BUDGET)
            cabin: Cabin class code (defaults to CABIN_ECONOMY)
        """
        if budget_limit is None:
            budget_limit = config.SERPAPI_MONTHLY_BUDGET

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
                if self.searches_used >= budget_limit:
                    print(f"      ⚠️ Budget limit reached ({budget_limit} searches)", flush=True)
                    return []

                async with semaphore:
                    done += 1
                    print(f"   [{done}/{total}] {origin}→{dest} {date_out} [{cabin_name}] (search #{self.searches_used + 1})", flush=True)

                    results = await self.search_route(session, origin, dest, date_out, date_ret, cabin=cabin)
                    if results:
                        cheapest = min(r["price_eur"] for r in results)
                        print(f"      ✅ {len(results)} offers (cheapest: {cheapest:.0f}€ {cabin_name})", flush=True)
                    else:
                        print(f"      — No results", flush=True)

                    # Be gentle with free tier
                    await asyncio.sleep(2)
                    return results

            tasks = []
            for origin, dest in routes:
                for date_out, date_ret in dates:
                    tasks.append(search_one(origin, dest, date_out, date_ret))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    all_results.extend(r)

        remaining = budget_limit - self.searches_used
        print(f"\n   📊 SerpApi: {self.searches_used} searches used → {len(all_results)} flight offers [{cabin_name}]")
        print(f"   💡 Free tier: {remaining} searches remaining (budget: {budget_limit})")
        return all_results


def load_serpapi_credentials():
    """Load SerpApi key from config module"""
    return config.get_serpapi_key()


async def main():
    """Test SerpApi Google Flights integration"""
    api_key = load_serpapi_credentials()
    if not api_key:
        print("❌ No SerpApi key found!")
        print("Register free at https://serpapi.com (Google/GitHub sign-in)")
        print("Set SERPAPI_KEY in environment or config.py")
        return

    scraper = SerpApiScraper(api_key)
    routes = [("CDG", "NRT"), ("MAD", "JFK")]
    base = datetime.now() + timedelta(days=90)
    dates = [(base.strftime("%Y-%m-%d"), (base + timedelta(days=7)).strftime("%Y-%m-%d"))]

    print("✈️ SERPAPI GOOGLE FLIGHTS — MULTI-CABIN TEST", flush=True)

    # Test single cabin search
    print("\n📍 Business Class Search", flush=True)
    results_biz = await scraper.search_routes(routes, dates, cabin=config.CABIN_BUSINESS, budget_limit=config.SERPAPI_MONTHLY_BUDGET)
    for r in sorted(results_biz, key=lambda x: x["price_eur"])[:5]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops | {r['cabin']}")

    # Test economy search
    print("\n📍 Economy Class Search", flush=True)
    results_eco = await scraper.search_routes(routes, dates, cabin=config.CABIN_ECONOMY, budget_limit=config.SERPAPI_MONTHLY_BUDGET)
    for r in sorted(results_eco, key=lambda x: x["price_eur"])[:5]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops | {r['cabin']}")


if __name__ == "__main__":
    asyncio.run(main())
