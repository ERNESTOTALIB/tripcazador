"""Amadeus API integration for real Business class flight prices"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from config import EUROPEAN_AIRPORTS_TIER1, DEST_ALL_LONG_HAUL


class AmadeusScraper:
    """Fetches real Business class prices from Amadeus Flight Offers Search API"""

    TOKEN_URL = "https://api.amadeus.com/v1/security/oauth2/token"  # production
    TOKEN_URL_TEST = "https://test.api.amadeus.com/v1/security/oauth2/token"  # test/sandbox
    SEARCH_URL = "https://api.amadeus.com/v2/shopping/flight-offers"
    SEARCH_URL_TEST = "https://test.api.amadeus.com/v2/shopping/flight-offers"

    def __init__(self, client_id=None, client_secret=None, use_test=True):
        """
        Initialize Amadeus API client.

        Args:
            client_id: Amadeus API Key (from developers.amadeus.com)
            client_secret: Amadeus API Secret
            use_test: Use test environment (free, 2000 calls/month) vs production
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.use_test = use_test
        self.access_token = None
        self.token_expires = None

        # Select endpoints
        if use_test:
            self._token_url = self.TOKEN_URL_TEST
            self._search_url = self.SEARCH_URL_TEST
        else:
            self._token_url = self.TOKEN_URL
            self._search_url = self.SEARCH_URL

    async def authenticate(self, session):
        """Get OAuth2 access token"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return True

        if not self.client_id or not self.client_secret:
            print("   ❌ Amadeus API credentials not configured!")
            print("   👉 Register at https://developers.amadeus.com")
            print("   👉 Then add your API Key and Secret to config.py")
            return False

        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        try:
            async with session.post(self._token_url, data=data) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    self.access_token = result["access_token"]
                    expires_in = result.get("expires_in", 1799)
                    self.token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
                    print(f"   ✅ Amadeus authenticated (token valid {expires_in}s)")
                    return True
                else:
                    error = await resp.text()
                    print(f"   ❌ Auth failed ({resp.status}): {error[:200]}")
                    return False
        except Exception as e:
            print(f"   ❌ Auth error: {e}")
            return False

    async def search_route(self, session, origin, dest, date_out, date_ret=None, adults=1):
        """
        Search Business class flights for a specific route.
        Returns list of flight offers with prices.
        """
        if not self.access_token:
            return []

        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {
            "originLocationCode": origin,
            "destinationLocationCode": dest,
            "departureDate": date_out,
            "adults": adults,
            "travelClass": "BUSINESS",
            "nonStop": "false",
            "currencyCode": "EUR",
            "max": 10,  # max results per search
        }
        if date_ret:
            params["returnDate"] = date_ret

        try:
            async with session.get(self._search_url, headers=headers, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_offers(data, origin, dest, date_out, date_ret)
                elif resp.status == 401:
                    # Token expired, re-authenticate
                    self.access_token = None
                    if await self.authenticate(session):
                        return await self.search_route(session, origin, dest, date_out, date_ret, adults)
                    return []
                elif resp.status == 429:
                    print(f"      ⏳ Rate limited, waiting...", flush=True)
                    await asyncio.sleep(5)
                    return []
                else:
                    error_text = await resp.text()
                    # Don't spam on common errors (no results, invalid route)
                    if resp.status != 400:
                        print(f"      ⚠️ {origin}→{dest}: HTTP {resp.status}", flush=True)
                    return []
        except asyncio.TimeoutError:
            print(f"      ⏱️ Timeout: {origin}→{dest}", flush=True)
            return []
        except Exception as e:
            print(f"      ❌ {origin}→{dest}: {str(e)[:80]}", flush=True)
            return []

    def _parse_offers(self, data, origin, dest, date_out, date_ret):
        """Parse Amadeus flight offers response into our standard format"""
        flights = []
        offers = data.get("data", [])
        dictionaries = data.get("dictionaries", {})
        carriers = dictionaries.get("carriers", {})

        for offer in offers:
            try:
                price_total = float(offer.get("price", {}).get("grandTotal", 0))
                currency = offer.get("price", {}).get("currency", "EUR")

                # Convert to EUR if needed (approximate)
                if currency == "USD":
                    price_eur = price_total * 0.92
                elif currency == "GBP":
                    price_eur = price_total * 1.17
                else:
                    price_eur = price_total

                if price_eur <= 0:
                    continue

                # Extract itinerary details
                itineraries = offer.get("itineraries", [])
                segments_out = itineraries[0].get("segments", []) if itineraries else []

                # Get airline from first segment
                airline_code = segments_out[0].get("carrierCode", "") if segments_out else ""
                airline_name = carriers.get(airline_code, airline_code)

                # Count stops
                stops = len(segments_out) - 1 if segments_out else -1

                # Get cabin class from traveler pricing
                cabin = "business"
                traveler_pricings = offer.get("travelerPricings", [])
                if traveler_pricings:
                    fare_details = traveler_pricings[0].get("fareDetailsBySegment", [])
                    if fare_details:
                        cabin = fare_details[0].get("cabin", "BUSINESS").lower()

                # Get duration
                duration = itineraries[0].get("duration", "") if itineraries else ""

                flights.append({
                    "origin": origin,
                    "destination": dest,
                    "date_out": date_out,
                    "date_ret": date_ret,
                    "price_eur": round(price_eur, 2),
                    "price_raw": price_total,
                    "currency": currency,
                    "airline": airline_name,
                    "airline_code": airline_code,
                    "stops": stops,
                    "cabin": cabin,
                    "duration": duration,
                    "source": "amadeus",
                    "offer_id": offer.get("id", ""),
                    "last_ticketing": offer.get("lastTicketingDate", ""),
                    "scraped_at": datetime.now().isoformat(),
                })

            except Exception as e:
                continue

        return flights

    async def search_routes(self, routes, dates, max_concurrent=3):
        """
        Search multiple routes with rate limiting.
        Amadeus test API: ~10 requests/second, 2000/month
        """
        all_results = []
        total = len(routes) * len(dates)
        done = 0
        api_calls = 0

        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            if not await self.authenticate(session):
                return []

            # Process in batches to respect rate limits
            semaphore = asyncio.Semaphore(max_concurrent)

            async def search_one(origin, dest, date_out, date_ret):
                nonlocal done, api_calls
                async with semaphore:
                    done += 1
                    api_calls += 1
                    print(f"   [{done}/{total}] {origin}→{dest} {date_out} (API call #{api_calls})", flush=True)

                    results = await self.search_route(session, origin, dest, date_out, date_ret)
                    if results:
                        cheapest = min(r["price_eur"] for r in results)
                        print(f"      ✅ {len(results)} offers (cheapest: {cheapest:.0f}€ BIZ)", flush=True)
                    else:
                        print(f"      — No results", flush=True)

                    # Rate limiting: ~1 request per second for test API
                    await asyncio.sleep(1.2)
                    return results

            tasks = []
            for origin, dest in routes:
                for date_out, date_ret in dates:
                    tasks.append(search_one(origin, dest, date_out, date_ret))

            # Execute with concurrency control
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    all_results.extend(r)

        print(f"\n   📊 Amadeus: {api_calls} API calls → {len(all_results)} flight offers")
        return all_results

    async def search_business_economy_comparison(self, session, origin, dest, date_out, date_ret=None):
        """
        Search both Business and Economy for the same route to detect ratio anomalies.
        Returns (business_offers, economy_offers)
        """
        biz = await self.search_route(session, origin, dest, date_out, date_ret, adults=1)

        # Small delay between Business and Economy search
        await asyncio.sleep(0.5)

        # Search Economy for comparison
        if not self.access_token:
            return biz, []

        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {
            "originLocationCode": origin,
            "destinationLocationCode": dest,
            "departureDate": date_out,
            "adults": 1,
            "travelClass": "ECONOMY",
            "nonStop": "false",
            "currencyCode": "EUR",
            "max": 5,
        }
        if date_ret:
            params["returnDate"] = date_ret

        econ = []
        try:
            async with session.get(self._search_url, headers=headers, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for offer in data.get("data", []):
                        try:
                            price = float(offer["price"]["grandTotal"])
                            econ.append({"price_eur": price, "source": "amadeus_economy"})
                        except:
                            pass
        except:
            pass

        return biz, econ


# Convenience function to load credentials
def load_amadeus_credentials():
    """Load Amadeus credentials from config or environment"""
    import os
    client_id = os.environ.get("AMADEUS_API_KEY", "")
    client_secret = os.environ.get("AMADEUS_API_SECRET", "")

    # Try config file
    if not client_id:
        try:
            from config import AMADEUS_API_KEY, AMADEUS_API_SECRET
            client_id = AMADEUS_API_KEY
            client_secret = AMADEUS_API_SECRET
        except ImportError:
            pass

    return client_id, client_secret


async def main():
    """Test Amadeus integration"""
    client_id, client_secret = load_amadeus_credentials()

    if not client_id:
        print("❌ No Amadeus credentials found!")
        print("Set AMADEUS_API_KEY and AMADEUS_API_SECRET in environment or config.py")
        return

    scraper = AmadeusScraper(client_id, client_secret, use_test=True)
    routes = [("CDG", "NRT"), ("FRA", "JFK"), ("MAD", "BKK")]
    base = datetime.now() + timedelta(days=90)
    dates = [(base.strftime("%Y-%m-%d"), (base + timedelta(days=7)).strftime("%Y-%m-%d"))]

    print("✈️ AMADEUS BUSINESS CLASS TEST", flush=True)
    results = await scraper.search_routes(routes, dates)
    print(f"\n📊 {len(results)} results")
    for r in sorted(results, key=lambda x: x["price_eur"])[:10]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops")


if __name__ == "__main__":
    asyncio.run(main())
