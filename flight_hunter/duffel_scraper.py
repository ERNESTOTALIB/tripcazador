"""Duffel API integration for real-time flight prices across 300+ airlines.

Duffel provides direct access to 300+ airlines via their REST API:
- Free for searches, $3 per booking (we only search)
- Real-time pricing and availability
- Supports multiple cabin classes (economy, premium_economy, business, first)
- Returns comprehensive flight data including operators, timings, and availability

Registration: https://duffel.com
API Docs: https://docs.duffel.com/api-reference
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timedelta
import config


class DuffelScraper:
    """Fetches flight prices across multiple cabin classes via Duffel REST API"""

    API_BASE = "https://api.duffel.com"
    OFFER_REQUEST_ENDPOINT = "/air/offer_requests"

    # Map config cabin codes to Duffel cabin strings
    CABIN_MAPPING = {
        config.CABIN_ECONOMY: "economy",
        config.CABIN_PREMIUM_ECONOMY: "premium_economy",
        config.CABIN_BUSINESS: "business",
        config.CABIN_FIRST: "first",
    }

    def __init__(self, token=None):
        """
        Initialize Duffel API client.

        Args:
            token: Duffel API token (get at https://duffel.com)
        """
        self.token = token or self._get_duffel_token()
        self.searches_used = 0
        self.available = bool(self.token)
        self.session = None

    @staticmethod
    def _get_duffel_token():
        """
        Get Duffel token from environment or hardcoded fallback.

        Returns:
            str: Duffel API token
        """
        return os.environ.get("DUFFEL_TOKEN", "duffel_test_C4cyWF05GAWfp4ybDiH-RZi_n9bmvB-ZTXmMdlu_R8g")

    def _get_headers(self):
        """
        Get HTTP headers for Duffel API requests.

        Returns:
            dict: Authorization and content-type headers
        """
        return {
            "Authorization": f"Bearer {self.token}",
            "Duffel-Version": "v2",
            "Content-Type": "application/json",
        }

    async def search_route(self, session, origin, dest, date_out, date_ret=None, cabin=None):
        """
        Search flights for a specific route and cabin class via Duffel.

        Args:
            session: aiohttp session
            origin: Origin airport code (IATA)
            dest: Destination airport code (IATA)
            date_out: Outbound date (YYYY-MM-DD)
            date_ret: Return date (YYYY-MM-DD), optional for one-way
            cabin: Cabin class code (1=Economy, 2=Premium Economy, 3=Business, 4=First)
                   Defaults to CABIN_ECONOMY if not specified

        Returns:
            List of flight dictionaries with parsed results
        """
        if cabin is None:
            cabin = config.CABIN_ECONOMY

        if not self.token:
            print("   ❌ Duffel token not configured!", flush=True)
            return []

        # Map cabin code to Duffel string
        duffel_cabin = self.CABIN_MAPPING.get(cabin, "economy")
        cabin_name = config.get_cabin_name(cabin)

        # Build offer request payload
        payload = {
            "data": {
                "slices": [
                    {
                        "origin": origin,
                        "destination": dest,
                        "departure_date": date_out,
                    }
                ],
                "passengers": [{"type": "adult"}],
                "cabin_class": duffel_cabin,
                "return_offers": bool(date_ret),
            }
        }

        # Add return slice if round-trip
        if date_ret:
            payload["data"]["slices"].append({
                "origin": dest,
                "destination": origin,
                "departure_date": date_ret,
            })

        url = f"{self.API_BASE}{self.OFFER_REQUEST_ENDPOINT}"

        try:
            async with session.post(url, json=payload, headers=self._get_headers()) as resp:
                self.searches_used += 1

                if resp.status in (200, 201):
                    data = await resp.json()
                    return self._parse_results(data, origin, dest, date_out, date_ret, cabin)
                elif resp.status == 401:
                    print(f"      ❌ Invalid Duffel token", flush=True)
                    return []
                elif resp.status == 429:
                    print(f"      ⏳ Duffel rate limited", flush=True)
                    return []
                else:
                    error_text = await resp.text()
                    print(f"      ⚠️ Duffel {resp.status}: {error_text[:100]}", flush=True)
                    return []
        except asyncio.TimeoutError:
            print(f"      ⏱️ Timeout: {origin}→{dest}", flush=True)
            return []
        except Exception as e:
            print(f"      ❌ {origin}→{dest}: {str(e)[:80]}", flush=True)
            return []

    def _parse_results(self, data, origin, dest, date_out, date_ret, cabin):
        """
        Parse Duffel API response.

        Args:
            data: JSON response from Duffel
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

        offers = data.get("data", {}).get("offers", [])

        # Sort by price (lowest first)
        sorted_offers = sorted(offers, key=lambda o: float(o.get("total_amount", 0)))

        for offer in sorted_offers:
            try:
                # Extract price
                price_str = offer.get("total_amount", "0")
                try:
                    price = float(price_str)
                except (ValueError, TypeError):
                    continue

                if price <= 0:
                    continue

                # Currency should be EUR by default from Duffel
                currency = offer.get("total_currency", "EUR")
                if currency != "EUR":
                    # Convert if needed (simple approximation)
                    if currency == "USD":
                        price = price * 0.92
                    elif currency == "GBP":
                        price = price * 1.17

                # Extract slices (outbound and optional return)
                slices = offer.get("slices", [])
                if not slices:
                    continue

                outbound_slice = slices[0]
                segments = outbound_slice.get("segments", [])
                if not segments:
                    continue

                # Get airline from first segment's operating_carrier
                airline = "Unknown"
                operating_carrier = segments[0].get("operating_carrier", {})
                if isinstance(operating_carrier, dict):
                    airline = operating_carrier.get("name", "Unknown")
                else:
                    airline = str(operating_carrier)

                # Count stops (segments - 1)
                stops = len(segments) - 1

                # Extract departure and arrival times from outbound
                first_segment = segments[0]
                last_segment = segments[-1]
                departure_time = first_segment.get("departing_at", "")
                arrival_time = last_segment.get("arriving_at", "")

                # Calculate duration from outbound slice
                duration_str = outbound_slice.get("duration", "")
                duration_minutes = self._parse_duration(duration_str)
                if duration_minutes:
                    hours = duration_minutes // 60
                    mins = duration_minutes % 60
                    duration = f"PT{hours}H{mins}M"
                else:
                    duration = ""

                # Extract origin and destination IATA codes from slice
                slice_origin = outbound_slice.get("origin", {})
                slice_dest = outbound_slice.get("destination", {})

                if isinstance(slice_origin, dict):
                    slice_origin_code = slice_origin.get("iata_code", origin)
                else:
                    slice_origin_code = origin

                if isinstance(slice_dest, dict):
                    slice_dest_code = slice_dest.get("iata_code", dest)
                else:
                    slice_dest_code = dest

                flights.append({
                    "origin": slice_origin_code,
                    "destination": slice_dest_code,
                    "date_out": date_out,
                    "date_ret": date_ret,
                    "price_eur": float(price),
                    "airline": airline,
                    "stops": stops,
                    "cabin": cabin_name,
                    "cabin_code": cabin,
                    "duration": duration,
                    "duration_minutes": duration_minutes,
                    "departure_time": departure_time,
                    "arrival_time": arrival_time,
                    "source": "duffel",
                    "scraped_at": datetime.now().isoformat(),
                })

            except Exception:
                continue

        return flights

    @staticmethod
    def _parse_duration(duration_str):
        """
        Parse ISO 8601 duration string to minutes.

        Args:
            duration_str: Duration in format "PT2H30M" or similar

        Returns:
            int: Total duration in minutes
        """
        if not duration_str or not duration_str.startswith("PT"):
            return 0

        duration_str = duration_str[2:]  # Remove 'PT'
        total_minutes = 0

        # Parse hours
        if "H" in duration_str:
            hours_str, duration_str = duration_str.split("H")
            try:
                total_minutes += int(hours_str) * 60
            except ValueError:
                pass

        # Parse minutes
        if "M" in duration_str:
            mins_str = duration_str.replace("M", "")
            try:
                total_minutes += int(mins_str)
            except ValueError:
                pass

        return total_minutes

    async def search_routes(self, routes, dates, max_concurrent=2, budget_limit=None, cabin=None):
        """
        Search multiple routes in specified cabin class.

        Conservative concurrency for API rate limits.

        Args:
            routes: List of (origin, dest) tuples
            dates: List of (date_out, date_ret) tuples
            max_concurrent: Max concurrent requests (default 2 for safety)
            budget_limit: Not used for Duffel (searches are free)
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

                    # Rate limiting: 1 second between requests to be safe
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

        print(f"\n   📊 Duffel: {self.searches_used} searches → {len(all_results)} flight offers [{cabin_name}]")
        return all_results


def load_duffel_token():
    """Load Duffel token from environment or config"""
    return DuffelScraper._get_duffel_token()


async def main():
    """Test Duffel API integration"""
    token = load_duffel_token()
    if not token:
        print("❌ No Duffel token found!", flush=True)
        print("Set DUFFEL_TOKEN in environment or check duffel_scraper.py", flush=True)
        return

    scraper = DuffelScraper(token)
    routes = [("MAD", "ATH"), ("CDG", "NRT")]
    base = datetime.now() + timedelta(days=90)
    dates = [(base.strftime("%Y-%m-%d"), (base + timedelta(days=7)).strftime("%Y-%m-%d"))]

    print("✈️ DUFFEL API — MULTI-CABIN TEST", flush=True)

    # Test Economy search
    print("\n📍 Economy Class Search", flush=True)
    results_eco = await scraper.search_routes(routes, dates, cabin=config.CABIN_ECONOMY)
    for r in sorted(results_eco, key=lambda x: x["price_eur"])[:5]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops | {r['cabin']}")

    # Test Business search
    print("\n📍 Business Class Search", flush=True)
    results_biz = await scraper.search_routes(routes, dates, cabin=config.CABIN_BUSINESS)
    for r in sorted(results_biz, key=lambda x: x["price_eur"])[:5]:
        print(f"  {r['origin']}→{r['destination']} | {r['price_eur']:.0f}€ | {r['airline']} | {r['stops']} stops | {r['cabin']}")


if __name__ == "__main__":
    asyncio.run(main())
