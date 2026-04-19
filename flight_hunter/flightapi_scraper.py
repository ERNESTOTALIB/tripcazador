"""FlightAPI.io integration for real Business class flight prices.

FlightAPI.io advantages:
- 20 free API calls (no card required)
- 700+ airlines
- Business class support
- Instant registration
- Registration: https://api.flightapi.io/register

Docs: https://docs.flightapi.io/flight-price-api/round-trip-api
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta


class FlightApiScraper:
    """Fetches Business class prices from FlightAPI.io"""

    BASE_URL = "https://api.flightapi.io"

    def __init__(self, api_key=None):
        """
        Initialize FlightAPI.io client.

        Args:
            api_key: FlightAPI key (get free at https://api.flightapi.io/register)
        """
        self.api_key = api_key
        self.calls_used = 0

    async def search_route(self, session, origin, dest, date_out, date_ret=None, adults=1):
        """Search Business class flights for a route"""
        if not self.api_key:
            print("   ❌ FlightAPI key not configured!")
            return []

        # FlightAPI uses path-based parameters
        # /roundtrip/<key>/<from>/<to>/<dep_date>/<ret_date>/<adults>/<children>/<infants>/<cabin>/<currency>
        if date_ret:
            url = (
                f"{self.BASE_URL}/roundtrip/{self.api_key}/"
                f"{origin}/{dest}/{date_out}/{date_ret}/"
                f"{adults}/0/0/Business/EUR"
            )
        else:
            url = (
                f"{self.BASE_URL}/onewaytrip/{self.api_key}/"
                f"{origin}/{dest}/{date_out}/"
                f"{adults}/0/0/Business/EUR"
            )

        try:
            async with session.get(url) as resp:
                self.calls_used += 1

                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_results(data, origin, dest, date_out, date_ret)
                elif resp.status == 429:
                    print(f"      ⏳ FlightAPI rate limited / quota exceeded", flush=True)
                    return []
                elif resp.status == 401 or resp.status == 403:
                    print(f"      ❌ FlightAPI invalid/expired key", flush=True)
                    return []
                else:
                    return []
        except asyncio.TimeoutError:
            print(f"      ⏱️ Timeout: {origin}→{dest}", flush=True)
            return []
        except Exception as e:
            print(f"      ❌ {origin}→{dest}: {str(e)[:80]}", flush=True)
            return []

    def _parse_results(self, data, origin, dest, date_out, date_ret):
        """Parse FlightAPI response into standard format"""
        flights = []

        # FlightAPI returns different structures - handle both
        # Structure: { "legs": [...], "trips": [...], "fares": [...] }
        # or { "itineraries": [...] }

        fares = data.get("fares", [])
        legs = {leg.get("id"): leg for leg in data.get("legs", [])}
        trips = data.get("trips", [])

        if fares:
            for fare in fares:
                try:
                    price_info = fare.get("price", {})
                    price_total = price_info.get("totalAmount", 0)
                    currency = price_info.get("currencyCode", "EUR")

                    if not price_total or float(price_total) <= 0:
                        continue

                    price_eur = float(price_total)
                    if currency == "USD":
                        price_eur *= 0.92
                    elif currency == "GBP":
                        price_eur *= 1.17

                    # Get trip/leg details
                    trip_refs = fare.get("tripId", [])
                    airline = "Unknown"
                    stops = -1
                    duration = ""

                    for trip_id in trip_refs if isinstance(trip_refs, list) else [trip_refs]:
                        for trip in trips:
                            if trip.get("id") == trip_id:
                                leg_ids = trip.get("legIds", [])
                                stops = max(0, len(leg_ids) - 1)
                                if leg_ids and leg_ids[0] in legs:
                                    first_leg = legs[leg_ids[0]]
                                    airline_data = first_leg.get("airlines", [{}])
                                    if airline_data:
                                        airline = airline_data[0].get("name", "Unknown")
                                    dur_min = first_leg.get("duration", 0)
                                    if dur_min:
                                        h = dur_min // 60
                                        m = dur_min % 60
                                        duration = f"PT{h}H{m}M"
                                break

                    flights.append({
                        "origin": origin,
                        "destination": dest,
                        "date_out": date_out,
                        "date_ret": date_ret,
                        "price_eur": round(price_eur, 2),
                        "currency": currency,
                        "airline": airline,
                        "stops": stops,
                        "cabin": "business",
                        "duration": duration,
                        "source": "flightapi",
                        "scraped_at": datetime.now().isoformat(),
                    })
                except Exception:
                    continue

        # Alternative: flat itinerary format
        if not flights:
            itineraries = data.get("itineraries", data.get("data", []))
            if isinstance(itineraries, list):
                for itin in itineraries[:15]:
                    try:
                        price = itin.get("price", itin.get("amount", 0))
                        if not price or float(price) <= 0:
                            continue

                        flights.append({
                            "origin": origin,
                            "destination": dest,
                            "date_out": date_out,
                            "date_ret": date_ret,
                            "price_eur": round(float(price), 2),
                            "airline": itin.get("airline", itin.get("carrier", "Unknown")),
                            "stops": itin.get("stops", -1),
                            "cabin": "business",
                            "duration": itin.get("duration", ""),
                            "source": "flightapi",
                            "scraped_at": datetime.now().isoformat(),
                        })
                    except Exception:
                        continue

        return flights

    async def search_routes(self, routes, dates, budget_limit=15):
        """
        Search multiple routes. Conservative for free tier (20 calls total).
        Each roundtrip search costs 2 credits.
        """
        all_results = []
        total = len(routes) * len(dates)
        done = 0

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            for origin, dest in routes:
                for date_out, date_ret in dates:
                    if self.calls_used >= budget_limit:
                        print(f"      ⚠️ Budget limit reached ({budget_limit} calls)", flush=True)
                        break

                    done += 1
                    print(f"   [{done}/{total}] {origin}→{dest} {date_out} (call #{self.calls_used + 1})", flush=True)

                    results = await self.search_route(session, origin, dest, date_out, date_ret)
                    if results:
                        cheapest = min(r["price_eur"] for r in results)
                        print(f"      ✅ {len(results)} offers (cheapest: {cheapest:.0f}€ BIZ)", flush=True)
                        all_results.extend(results)
                    else:
                        print(f"      — No results", flush=True)

                    # Gentle with API
                    await asyncio.sleep(2)

        print(f"\n   📊 FlightAPI: {self.calls_used} calls used → {len(all_results)} flight offers")
        remaining = max(0, 20 - self.calls_used * 2)  # 2 credits per roundtrip
        print(f"   💡 Free tier: ~{remaining} credits remaining")
        return all_results


def load_flightapi_credentials():
    """Load FlightAPI key from config or environment"""
    import os
    api_key = os.environ.get("FLIGHTAPI_KEY", "")
    if not api_key:
        try:
            from config import FLIGHTAPI_KEY
            api_key = FLIGHTAPI_KEY
        except ImportError:
            pass
    return api_key


async def main():
    """Test FlightAPI.io integration"""
    api_key = load_flightapi_credentials()
    if not api_key:
        print("❌ No FlightAPI key found!")
        print("Register free at https://api.flightapi.io/register")
        print("Set FLIGHTAPI_KEY in environment or config.py")
        return

    scraper = FlightApiScraper(api_key)
    routes = [("CDG", "NRT"), ("MAD", "JFK")]
    base = datetime.now() + timedelta(days=90)
    dates = [(base.strftime("%Y-%m-%d"), (base + timedelta(days=7)).strftime("%Y-%m-%d"))]

    print("✈️ FLIGHTAPI.IO — BUSINESS CLASS TEST", flush=True)
    results = await scraper.search_routes(routes, dates)
    for r in sorted(results, key=lambda x: x["price_eur"])[:10]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops")


if __name__ == "__main__":
    asyncio.run(main())
