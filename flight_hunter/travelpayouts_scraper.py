"""Travelpayouts/Aviasales API integration for cached flight prices.

Travelpayouts is a flight search aggregator providing cached price data:
- Free tier: No API key required for basic access
- Data freshness: 2-7 days old (cached, not real-time)
- No cabin class filtering: Always returns economy class
- Rate limit: 200 requests per hour
- Currency: EUR supported
- Partner Program: commission-based monetization available
- Registration: https://travelpayouts.com/

API Documentation: https://support.travelpayouts.com/hc/en-us/articles/203972996
Aviasales Search API: https://www.travelpayouts.com/developers/docs/aviasales_api
"""

import asyncio
import aiohttp
import os
import json
from datetime import datetime, timedelta
import config


# Travelpayouts API credentials
TRAVELPAYOUTS_TOKEN_FALLBACK = "e49bffbd5b77451d5b807508cca921e4"
TRAVELPAYOUTS_PARTNER_ID = "714734"


def get_travelpayouts_token():
    """
    Get Travelpayouts API token from environment or use fallback.

    Returns:
        str: Travelpayouts token from ENV or fallback value
    """
    return os.environ.get("TRAVELPAYOUTS_TOKEN", TRAVELPAYOUTS_TOKEN_FALLBACK)


class TravelpayoutsScraper:
    """Fetches flight prices from Travelpayouts/Aviasales API (cached data)"""

    BASE_URL = "https://api.travelpayouts.com"
    PRICES_FOR_DATES_URL = f"{BASE_URL}/aviasales/v3/prices_for_dates"
    GET_LATEST_PRICES_URL = f"{BASE_URL}/aviasales/v3/get_latest_prices"
    CHEAP_PRICES_URL = f"{BASE_URL}/v1/prices/cheap"

    def __init__(self, token=None, partner_id=None):
        """
        Initialize Travelpayouts client.

        Args:
            token: Travelpayouts API token (defaults to env var or fallback)
            partner_id: Partner ID for commission tracking (optional)
        """
        self.token = token or get_travelpayouts_token()
        self.partner_id = partner_id or TRAVELPAYOUTS_PARTNER_ID
        self.searches_used = 0
        self.available = bool(self.token)

    async def search_route(self, session, origin, dest, date_out, date_ret=None, cabin=None):
        """
        Search flights for a specific route via Travelpayouts.

        Note: Travelpayouts does not support cabin class filtering.
        Always returns economy prices. The cabin parameter is accepted
        for interface compatibility but ignored in the API call.

        Args:
            session: aiohttp session
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (YYYY-MM-DD), optional for one-way
            cabin: Cabin class code (ignored - Travelpayouts is economy-only)

        Returns:
            List of flight dictionaries matching serpapi schema
        """
        if not self.available:
            return []

        # Travelpayouts doesn't support cabin filtering
        cabin_name = "Economy"
        cabin_code = config.CABIN_ECONOMY

        # Try primary endpoint: prices_for_dates
        results = await self._search_prices_for_dates(
            session, origin, dest, date_out, date_ret, cabin_code, cabin_name
        )

        if results:
            return results

        # Fallback to get_latest_prices endpoint
        results = await self._search_latest_prices(
            session, origin, dest, cabin_code, cabin_name
        )

        return results

    async def _search_prices_for_dates(
        self, session, origin, dest, date_out, date_ret, cabin_code, cabin_name
    ):
        """
        Search using prices_for_dates endpoint (primary method).

        Args:
            session: aiohttp session
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (optional)
            cabin_code: Cabin class code (for output only)
            cabin_name: Cabin name (for output only)

        Returns:
            List of flight dictionaries or empty list
        """
        # Travelpayouts accepts YYYY-MM-DD or YYYY-MM format.
        # Month-only (YYYY-MM) returns more results since data is cached.
        # We send the full date first; if that fails, the fallback uses month format.
        departure_month = date_out[:7]  # e.g. "2026-07"
        return_month = date_ret[:7] if date_ret else None

        params = {
            "origin": origin,
            "destination": dest,
            "departure_at": departure_month,
            "currency": "EUR",
            "sorting": "price",
            "limit": 30,
            "token": self.token,
        }

        if return_month:
            params["return_at"] = return_month

        try:
            async with session.get(self.PRICES_FOR_DATES_URL, params=params) as resp:
                self.searches_used += 1

                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_results(
                        data, origin, dest, date_out, date_ret, cabin_code, cabin_name
                    )
                elif resp.status == 429:
                    print(f"      ⏳ Travelpayouts rate limited (200 req/hour)", flush=True)
                    await asyncio.sleep(2)
                    return []
                elif resp.status == 401 or resp.status == 403:
                    if self.available:
                        print(f"      ❌ Travelpayouts token invalid or expired", flush=True)
                        self.available = False
                    return []
                else:
                    error_text = await resp.text()
                    print(
                        f"      ⚠️ Travelpayouts {resp.status}: {error_text[:80]}",
                        flush=True,
                    )
                    return []

        except asyncio.TimeoutError:
            print(f"      ⏱️ Timeout: {origin}→{dest}", flush=True)
            return []
        except Exception as e:
            print(f"      ❌ {origin}→{dest}: {str(e)[:80]}", flush=True)
            return []

    async def _search_latest_prices(
        self, session, origin, dest, cabin_code, cabin_name
    ):
        """
        Search using get_latest_prices endpoint (fallback method).

        Returns latest cached prices for the given origin/destination.

        Args:
            session: aiohttp session
            origin: Origin airport code
            dest: Destination airport code
            cabin_code: Cabin class code (for output only)
            cabin_name: Cabin name (for output only)

        Returns:
            List of flight dictionaries or empty list
        """
        params = {
            "origin": origin,
            "currency": "EUR",
            "period_type": "month",
            "limit": 30,
            "token": self.token,
        }

        # Optional: filter by specific destination if provided
        if dest:
            params["destination"] = dest

        try:
            async with session.get(self.GET_LATEST_PRICES_URL, params=params) as resp:
                self.searches_used += 1

                if resp.status == 200:
                    data = await resp.json()
                    # get_latest_prices returns a different format
                    # Filter for destination if specified
                    flights = []
                    for offer in data.get("data", []):
                        if dest and offer.get("destination") != dest:
                            continue

                        try:
                            price_eur = float(offer.get("price", 0))
                            if price_eur <= 0:
                                continue

                            # Parse dates from offer
                            departure_at = offer.get("departure_at", "")
                            return_at = offer.get("return_at", "")

                            airline = offer.get("airline", "Unknown")
                            transfers = offer.get("transfers", 0)

                            flights.append(
                                {
                                    "origin": origin,
                                    "destination": offer.get("destination", dest),
                                    "date_out": departure_at,
                                    "date_ret": return_at,
                                    "price_eur": price_eur,
                                    "airline": airline,
                                    "stops": transfers,
                                    "cabin": cabin_name,
                                    "cabin_code": cabin_code,
                                    "duration": "",
                                    "source": "travelpayouts",
                                    "scraped_at": datetime.now().isoformat(),
                                }
                            )
                        except Exception:
                            continue

                    return flights

                elif resp.status == 429:
                    print(f"      ⏳ Travelpayouts rate limited (200 req/hour)", flush=True)
                    await asyncio.sleep(2)
                    return []
                elif resp.status == 401 or resp.status == 403:
                    if self.available:
                        print(f"      ❌ Travelpayouts token invalid or expired", flush=True)
                        self.available = False
                    return []
                else:
                    error_text = await resp.text()
                    print(
                        f"      ⚠️ Travelpayouts {resp.status}: {error_text[:80]}",
                        flush=True,
                    )
                    return []

        except asyncio.TimeoutError:
            print(f"      ⏱️ Timeout: {origin}→{dest}", flush=True)
            return []
        except Exception as e:
            print(f"      ❌ {origin}→{dest}: {str(e)[:80]}", flush=True)
            return []

    def _parse_results(self, data, origin, dest, date_out, date_ret, cabin_code, cabin_name):
        """
        Parse Travelpayouts prices_for_dates response.

        Travelpayouts returns data in format:
        {
            "origin": "CDG",
            "destination": "NRT",
            "departure_at": "2026-06-15",
            "return_at": "2026-06-22",
            "price": 850.0,
            "airline": "AF",
            "transfers": 0,
            "flight_number": "AF001"
        }

        Args:
            data: JSON response from Travelpayouts API
            origin: Origin airport code
            dest: Destination airport code
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (optional)
            cabin_code: Cabin class code (for output only)
            cabin_name: Cabin name (for output only)

        Returns:
            List of flight dictionaries matching serpapi schema
        """
        flights = []

        for offer in data.get("data", []):
            try:
                price_eur = float(offer.get("price", 0))
                if price_eur <= 0:
                    continue

                airline = offer.get("airline", "Unknown")
                stops = int(offer.get("transfers", 0))

                # Travelpayouts doesn't provide duration info in basic response
                duration = ""
                duration_minutes = 0

                flights.append(
                    {
                        "origin": origin,
                        "destination": dest,
                        "date_out": date_out,
                        "date_ret": date_ret,
                        "price_eur": price_eur,
                        "airline": airline,
                        "stops": stops,
                        "cabin": cabin_name,
                        "cabin_code": cabin_code,
                        "duration": duration,
                        "duration_minutes": duration_minutes,
                        "source": "travelpayouts",
                        "scraped_at": datetime.now().isoformat(),
                    }
                )

            except Exception:
                continue

        return flights

    async def search_routes(self, routes, dates, max_concurrent=5, budget_limit=None, cabin=None):
        """
        Search multiple routes.

        Note: Travelpayouts has a 200 req/hour rate limit.
        Default max_concurrent=5 respects this limit.

        Args:
            routes: List of (origin, dest) tuples
            dates: List of (date_out, date_ret) tuples
            max_concurrent: Max concurrent requests (default 5, respects 200 req/hour limit)
            budget_limit: Not used for Travelpayouts, kept for compatibility
            cabin: Cabin class code (ignored - Travelpayouts is economy-only)
        """
        # Travelpayouts is economy-only
        cabin_name = "Economy"

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
                    print(
                        f"   [{done}/{total}] {origin}→{dest} {date_out} [{cabin_name}] (search #{self.searches_used + 1})",
                        flush=True,
                    )

                    results = await self.search_route(
                        session, origin, dest, date_out, date_ret, cabin=cabin
                    )
                    if results:
                        cheapest = min(r["price_eur"] for r in results)
                        print(
                            f"      ✅ {len(results)} offers (cheapest: {cheapest:.0f}€ {cabin_name})",
                            flush=True,
                        )
                    else:
                        print(f"      — No results", flush=True)

                    # Rate limit: respect 200 req/hour (18 sec per request)
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

        print(
            f"\n   📊 Travelpayouts: {self.searches_used} searches used → {len(all_results)} flight offers [{cabin_name}]"
        )
        print(f"   💡 Rate limit: 200 req/hour (estimated: {self.searches_used} of 200)")
        print(f"   ⚠️ Data freshness: 2-7 days old (cached, not real-time)")
        return all_results


async def main():
    """Test Travelpayouts integration"""
    scraper = TravelpayoutsScraper()

    if not scraper.available:
        print("❌ Travelpayouts token not available!", flush=True)
        print("Get token at: https://travelpayouts.com/", flush=True)
        print("Set TRAVELPAYOUTS_TOKEN environment variable or use hardcoded fallback")
        return

    routes = [("CDG", "NRT"), ("FRA", "JFK"), ("MAD", "BKK")]
    base = datetime.now() + timedelta(days=90)
    dates = [(base.strftime("%Y-%m-%d"), (base + timedelta(days=7)).strftime("%Y-%m-%d"))]

    print("✈️ TRAVELPAYOUTS API — CACHED PRICE SEARCH", flush=True)
    print("⚠️ Note: Data is 2-7 days old (cached), not real-time", flush=True)
    print("⚠️ Note: Cabin class filtering not supported (economy only)", flush=True)

    # Test search
    print("\n📍 Economy Class Search (cached data)", flush=True)
    results = await scraper.search_routes(
        routes, dates, max_concurrent=5, cabin=config.CABIN_ECONOMY
    )

    if results:
        print("\n✅ Sample Results:")
        for r in sorted(results, key=lambda x: x["price_eur"])[:10]:
            print(
                f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops | {r['cabin']}"
            )
    else:
        print("❌ No results found")


if __name__ == "__main__":
    asyncio.run(main())
