"""
Flight Deal Hunter — Advanced Anomaly Detection (v2)
====================================================
Detects pricing errors, anomalies, and deals using 6 sophisticated techniques:

T0: Impossible Price Detection     — Absolute thresholds by cabin+distance
T1: Cross-Date Comparison          — Same route across multiple weeks
T2: Peer Comparison                — Same origin-cabin vs different distances
T3: Cross-Source Validation        — Price consistency across sources
T4: Cabin Ratio Detection          — Business vs Economy price ratios
T5: Route Anomaly (Geography)      — Direct vs connecting, hub vs secondary
"""

from datetime import datetime, timedelta
from statistics import median, mean, stdev
from collections import defaultdict
import config

# ═══════════════════════════════════════════════════════════════
# ROUTE DISTANCES & CATEGORIZATION
# ═══════════════════════════════════════════════════════════════

ROUTE_DISTANCES = {
    # North America
    "JFK": 8, "LAX": 11, "MIA": 10, "SFO": 11, "ORD": 9, "YYZ": 8,
    "YVR": 10, "MEX": 11, "CUN": 10, "BOS": 7,
    # South America
    "GRU": 12, "EZE": 14, "BOG": 11, "SCL": 14, "LIM": 12, "GIG": 12,
    # Asia
    "NRT": 12, "HND": 12, "ICN": 11, "BKK": 11, "SIN": 12, "HKG": 11,
    "PVG": 11, "PEK": 10, "DEL": 8, "BOM": 9, "KUL": 12, "MNL": 13, "TPE": 12,
    # Middle East
    "DXB": 7, "DOH": 7, "AUH": 7, "TLV": 4, "AMM": 4, "RUH": 6,
    # Africa
    "JNB": 11, "CPT": 12, "NBO": 8, "CMN": 3, "CAI": 4, "ADD": 7,
    # Oceania
    "SYD": 22, "MEL": 22, "AKL": 24, "PER": 17,
    # Caribbean
    "SJU": 9, "PUJ": 9, "HAV": 10, "MBJ": 10, "BGI": 10,
    # Intra-Europe
    "LHR": 2, "CDG": 2, "FRA": 2, "AMS": 2, "MAD": 3, "BCN": 2,
    "FCO": 2, "MXP": 2, "IST": 4, "ATH": 3, "LIS": 3, "NCE": 2,
    "SXB": 1, "MRS": 2, "BER": 2, "HAM": 2, "DUS": 1, "CGN": 1,
}

# European hubs (more common, baseline prices)
EUROPEAN_HUBS = {
    "CDG": "Paris Charles de Gaulle",
    "FRA": "Frankfurt",
    "AMS": "Amsterdam",
    "MAD": "Madrid",
    "BCN": "Barcelona",
    "LHR": "London Heathrow",
    "MXP": "Milan Malpensa",
    "FCO": "Rome Fiumicino",
}

# Secondary European airports (usually more expensive from these)
SECONDARY_HUBS = {
    "MRS": "Marseille",
    "NCE": "Nice",
    "LYS": "Lyon",
    "TLS": "Toulouse",
}

# Source reliability weights (higher = more trustworthy)
SOURCE_WEIGHTS = {
    "SerpApi": 1.0,
    "Kiwi": 0.85,
    "FlightAPI": 0.75,
    "Google": 0.7,
}


def get_distance_category(dest_code):
    """Get the distance category for a destination"""
    hours = ROUTE_DISTANCES.get(dest_code, 8)
    if hours <= 4:
        return "short_haul"
    elif hours <= 7:
        return "medium_haul"
    elif hours <= 14:
        return "long_haul"
    else:
        return "ultra_long_haul"


def get_price_threshold(distance_category, cabin):
    """Get absolute minimum price threshold for a cabin+distance combo"""
    # Map cabin name to code for config.PRICE_THRESHOLDS
    cabin_map = {"economy": 1, "premium economy": 2, "business": 3, "first": 4}
    cabin_code = cabin_map.get(cabin.lower(), 1)

    # Map distance categories (detector uses _haul, config uses short_haul/medium/long/ultra_long)
    dist_map = {
        "short_haul": "short_haul",
        "medium_haul": "medium",
        "long_haul": "long",
        "ultra_long_haul": "ultra_long",
    }
    config_dist = dist_map.get(distance_category, "medium")

    thresholds = getattr(config, 'PRICE_THRESHOLDS', {})
    if cabin_code in thresholds and config_dist in thresholds[cabin_code]:
        low, _ = thresholds[cabin_code][config_dist]
        return low * 0.5  # Threshold at 50% of low range = truly impossible

    # Fallback thresholds
    fallback = {
        ("economy", "short_haul"): 30,
        ("economy", "medium_haul"): 60,
        ("economy", "long_haul"): 150,
        ("economy", "ultra_long_haul"): 250,
        ("business", "short_haul"): 200,
        ("business", "medium_haul"): 600,
        ("business", "long_haul"): 900,
        ("business", "ultra_long_haul"): 1200,
    }
    return fallback.get((cabin.lower(), distance_category), 0)


# ═══════════════════════════════════════════════════════════════
# T0: IMPOSSIBLE PRICE DETECTION
# ═══════════════════════════════════════════════════════════════

def detect_impossible_prices(flight):
    """T0: Check if price is below absolute threshold for cabin+distance"""
    price = flight.get("price_eur", 0)
    if not price or price <= 0:
        return None

    dest = flight.get("destination", "")
    cabin = flight.get("cabin", "economy").lower()
    distance_cat = get_distance_category(dest)
    threshold = get_price_threshold(distance_cat, cabin)

    if price < threshold:
        pct_off = ((threshold - price) / threshold) * 100
        return {
            "classification": "ERROR",
            "type": "T0",
            "reason": f"Precio imposible: {price:.0f}€ {cabin} ({distance_cat}), minimo: {threshold}€",
            "pct_off": round(pct_off),
            "severity": "critical",
        }

    return None


# ═══════════════════════════════════════════════════════════════
# T1: CROSS-DATE COMPARISON
# ═══════════════════════════════════════════════════════════════

def detect_cross_date_anomalies(flights_by_date, date_ranges, origin, destination, cabin):
    """
    T1: Compare the same route across multiple weeks using median + z-score.
    Returns list of anomalies found in this route's data.
    """
    anomalies = []

    # Group prices by (origin, destination, cabin) across dates
    route_prices = defaultdict(dict)

    for date_str, flights in flights_by_date.items():
        for f in flights:
            if (f.get("origin") == origin and
                f.get("destination") == destination and
                f.get("cabin", "").lower() == cabin.lower()):

                price = f.get("price_eur", 0)
                if price > 0:
                    # Use min price for this date if multiple flights
                    route_key = f"{origin}_{destination}"
                    if date_str not in route_prices[route_key]:
                        route_prices[route_key][date_str] = price
                    else:
                        route_prices[route_key][date_str] = min(
                            route_prices[route_key][date_str], price
                        )

    # If we don't have enough data points, skip
    if not route_prices or len(list(route_prices.values())[0]) < 2:
        return anomalies

    for route_key, prices_by_date in route_prices.items():
        prices_list = list(prices_by_date.values())
        if len(prices_list) < 2:
            continue

        ref_median = median(prices_list)
        ref_mean = mean(prices_list)
        ref_std = stdev(prices_list) if len(prices_list) >= 3 else ref_mean * 0.2

        for date_str, price in prices_by_date.items():
            ratio = price / ref_median
            pct_off = (1 - ratio) * 100
            z_score = (ref_mean - price) / ref_std if ref_std > 0 else 0

            other_prices = [p for d, p in prices_by_date.items() if d != date_str]

            base_info = {
                "origin": origin,
                "destination": destination,
                "date_out": date_str,
                "cabin": cabin,
                "price_eur": price,
                "price_ref": round(ref_median),
                "pct_off": round(pct_off),
                "z_score": round(z_score, 2),
                "type": "T1",
            }

            # Classification based on hotel_hunter thresholds
            if ratio <= 0.40 or (z_score >= 2.5 and ratio <= 0.55):
                anomalies.append({
                    **base_info,
                    "classification": "ERROR",
                    "reason": f"Comparacion entre fechas: {price:.0f}€ vs mediana {ref_median:.0f}€ ({pct_off:.0f}% OFF, z={z_score:.1f}σ)",
                })
            elif ratio <= 0.55 or (z_score >= 1.8 and ratio <= 0.65):
                anomalies.append({
                    **base_info,
                    "classification": "ANOMALY",
                    "reason": f"Comparacion entre fechas: {price:.0f}€ vs mediana {ref_median:.0f}€ ({pct_off:.0f}% OFF, z={z_score:.1f}σ)",
                })
            elif ratio <= 0.70 or (z_score >= 1.2 and ratio <= 0.75):
                anomalies.append({
                    **base_info,
                    "classification": "DEAL",
                    "reason": f"Comparacion entre fechas: {price:.0f}€ vs mediana {ref_median:.0f}€ ({pct_off:.0f}% OFF, z={z_score:.1f}σ)",
                })

    return anomalies


# ═══════════════════════════════════════════════════════════════
# T2: PEER COMPARISON
# ═══════════════════════════════════════════════════════════════

def detect_peer_anomalies(all_flights, origin, cabin):
    """
    T2: Compare same origin-cabin flights to different destinations
    of similar distance category. Unusual outliers → anomalies.
    """
    anomalies = []

    # Group flights by distance category
    flights_by_distance = defaultdict(list)

    for f in all_flights:
        if f.get("origin") == origin and f.get("cabin", "").lower() == cabin.lower():
            dest = f.get("destination", "")
            dist_cat = get_distance_category(dest)
            price = f.get("price_eur", 0)
            if price > 0:
                flights_by_distance[dist_cat].append({
                    "flight": f,
                    "price": price,
                    "destination": dest,
                })

    # Within each distance category, find outliers
    for dist_cat, flights in flights_by_distance.items():
        if len(flights) < 2:
            continue

        prices = [f["price"] for f in flights]
        ref_median = median(prices)
        ref_mean = mean(prices)
        ref_std = stdev(prices) if len(prices) >= 3 else ref_mean * 0.25

        for item in flights:
            f = item["flight"]
            price = item["price"]
            dest = item["destination"]

            ratio = price / ref_median
            pct_off = (1 - ratio) * 100
            z_score = (ref_mean - price) / ref_std if ref_std > 0 else 0

            # T2 thresholds: 35%+ below peer median = suspicious
            if ratio <= 0.65 and pct_off >= 35:
                anomalies.append({
                    "origin": origin,
                    "destination": dest,
                    "date_out": f.get("date_out"),
                    "cabin": cabin,
                    "price_eur": price,
                    "price_ref": round(ref_median),
                    "pct_off": round(pct_off),
                    "z_score": round(z_score, 2),
                    "type": "T2",
                    "classification": "ANOMALY" if pct_off >= 35 else "DEAL",
                    "reason": f"Comparacion de pares: {price:.0f}€ mucho mas barato que destinos similares (mediana: {ref_median:.0f}€, {pct_off:.0f}% OFF)",
                    "peer_count": len(flights),
                    "peer_prices": sorted([f["price"] for f in flights]),
                })

    return anomalies


# ═══════════════════════════════════════════════════════════════
# T3: CROSS-SOURCE VALIDATION
# ═══════════════════════════════════════════════════════════════

def detect_source_inconsistencies(flights_by_source, origin, destination, cabin, date_out):
    """
    T3: Compare prices from different sources for same route.
    If one source is 40%+ cheaper → possible error or glitch.
    """
    anomalies = []

    # Group by source
    sources_data = defaultdict(list)
    for source, flights in flights_by_source.items():
        for f in flights:
            if (f.get("origin") == origin and
                f.get("destination") == destination and
                f.get("cabin", "").lower() == cabin.lower() and
                f.get("date_out") == date_out):

                price = f.get("price_eur", 0)
                if price > 0:
                    sources_data[source].append({
                        "price": price,
                        "flight": f,
                        "weight": SOURCE_WEIGHTS.get(source, 0.7),
                    })

    if len(sources_data) < 2:
        return anomalies

    # Find min and max weighted prices
    all_prices = []
    for source, items in sources_data.items():
        min_price = min(item["price"] for item in items)
        all_prices.append({
            "source": source,
            "price": min_price,
            "weight": items[0]["weight"],
        })

    all_prices.sort(key=lambda x: x["price"])
    cheapest = all_prices[0]
    median_price = median([p["price"] for p in all_prices])

    for item in all_prices:
        source = item["source"]
        price = item["price"]
        ratio = price / median_price if median_price > 0 else 1.0
        pct_off = (1 - ratio) * 100

        if pct_off >= 40:  # 40%+ cheaper than median
            anomalies.append({
                "origin": origin,
                "destination": destination,
                "cabin": cabin,
                "date_out": date_out,
                "price_eur": price,
                "source": source,
                "median_price": round(median_price),
                "pct_off": round(pct_off),
                "type": "T3",
                "classification": "ANOMALY",
                "reason": f"Inconsistencia entre fuentes: {source} {price:.0f}€ vs mediana {median_price:.0f}€ ({pct_off:.0f}% OFF)",
                "all_sources": {s: round(p["price"]) for s, p in [(x["source"], x["price"]) for x in all_prices]},
            })

    return anomalies


# ═══════════════════════════════════════════════════════════════
# T4: CABIN RATIO DETECTION
# ═══════════════════════════════════════════════════════════════

def detect_cabin_ratio_anomalies(all_flights, origin, destination, date_out, date_ret=None):
    """
    T4: Compare Business vs Economy for same route on same dates.
    Normal ratio: 3x-6x. Unusual ratios → errors or deals.
    """
    anomalies = []

    economy_flights = []
    business_flights = []

    for f in all_flights:
        if (f.get("origin") == origin and
            f.get("destination") == destination and
            f.get("date_out") == date_out and
            (not date_ret or f.get("date_ret") == date_ret)):

            price = f.get("price_eur", 0)
            if price > 0:
                if f.get("cabin", "").lower() == "economy":
                    economy_flights.append({"price": price, "airline": f.get("airline")})
                elif f.get("cabin", "").lower() == "business":
                    business_flights.append({"price": price, "airline": f.get("airline")})

    if not economy_flights or not business_flights:
        return anomalies

    # Prefer comparing same airline if available
    econ_airlines = {f["airline"] for f in economy_flights if f.get("airline")}
    biz_airlines = {f["airline"] for f in business_flights if f.get("airline")}
    common_airlines = econ_airlines & biz_airlines

    if common_airlines:
        # Use prices from same airline
        econ_price = min(f["price"] for f in economy_flights if f.get("airline") in common_airlines)
        biz_price = min(f["price"] for f in business_flights if f.get("airline") in common_airlines)
    else:
        # Fall back to min prices
        econ_price = min(f["price"] for f in economy_flights)
        biz_price = min(f["price"] for f in business_flights)

    ratio = biz_price / econ_price if econ_price > 0 else 0

    base_info = {
        "origin": origin,
        "destination": destination,
        "date_out": date_out,
        "date_ret": date_ret,
        "cabin": "business",
        "price_eur": biz_price,
        "econ_price": round(econ_price),
        "biz_econ_ratio": round(ratio, 2),
        "type": "T4",
    }

    if ratio < 1.5:  # Business cheaper or similar to Economy
        anomalies.append({
            **base_info,
            "classification": "ERROR",
            "reason": f"Ratio Business/Economy {ratio:.2f}x anormalmente bajo (esperado 3-6x). Business {biz_price:.0f}€ vs Economy {econ_price:.0f}€",
        })
    elif ratio < 2.0:  # Too close together
        anomalies.append({
            **base_info,
            "classification": "ANOMALY",
            "reason": f"Ratio Business/Economy {ratio:.2f}x (esperado 3-6x). Business {biz_price:.0f}€ vs Economy {econ_price:.0f}€",
        })
    elif ratio < 2.5:  # Good deal on Business
        anomalies.append({
            **base_info,
            "classification": "DEAL",
            "reason": f"Ratio Business/Economy {ratio:.2f}x es bajo (esperado 3-6x). Business bueno: {biz_price:.0f}€ vs Economy {econ_price:.0f}€",
        })

    return anomalies


# ═══════════════════════════════════════════════════════════════
# T5: ROUTE ANOMALY (PRICING GEOGRAPHY)
# ═══════════════════════════════════════════════════════════════

def detect_route_anomalies(all_flights, origin, destination, cabin, date_out):
    """
    T5: Detect anomalies in pricing geography:
    - Direct more expensive than connecting on same route
    - Hub prices 50%+ higher than secondary hubs
    """
    anomalies = []

    # Group by (stops or connecting info)
    direct_flights = []
    connecting_flights = []

    for f in all_flights:
        if (f.get("origin") == origin and
            f.get("destination") == destination and
            f.get("cabin", "").lower() == cabin.lower() and
            f.get("date_out") == date_out):

            price = f.get("price_eur", 0)
            if price > 0:
                stops = f.get("stops", 0)
                duration = f.get("duration_minutes", 0)

                if stops == 0:
                    direct_flights.append({
                        "flight": f,
                        "price": price,
                        "duration": duration,
                    })
                else:
                    connecting_flights.append({
                        "flight": f,
                        "price": price,
                        "stops": stops,
                        "duration": duration,
                    })

    # T5a: Direct vs Connecting
    if direct_flights and connecting_flights:
        min_direct = min(f["price"] for f in direct_flights)
        min_connecting = min(f["price"] for f in connecting_flights)

        if min_connecting > min_direct * 1.15:  # Connecting >15% more expensive
            pct_diff = ((min_connecting - min_direct) / min_direct) * 100
            anomalies.append({
                "origin": origin,
                "destination": destination,
                "cabin": cabin,
                "date_out": date_out,
                "price_eur": min_direct,
                "price_ref": round(min_connecting),
                "direct_price": round(min_direct),
                "pct_off": round(pct_diff),
                "type": "T5",
                "classification": "ANOMALY",
                "reason": f"Directo {min_direct:.0f}€ mas barato que con paradas {min_connecting:.0f}€ (+{pct_diff:.0f}%). Buena oferta directa.",
            })

    # T5b: Hub vs Secondary hub pricing
    hub_flights = [f for f in all_flights if f.get("origin") in EUROPEAN_HUBS]
    secondary_flights = [f for f in all_flights if f.get("origin") in SECONDARY_HUBS]

    if hub_flights and secondary_flights:
        hub_prices = [f.get("price_eur", 0) for f in hub_flights if f.get("price_eur", 0) > 0]
        secondary_prices = [f.get("price_eur", 0) for f in secondary_flights if f.get("price_eur", 0) > 0]

        if hub_prices and secondary_prices:
            hub_median = median(hub_prices)
            secondary_median = median(secondary_prices)

            if secondary_median > 0 and hub_median / secondary_median > 1.5:
                pct_more = ((hub_median - secondary_median) / secondary_median) * 100
                anomalies.append({
                    "type": "T5",
                    "classification": "ANOMALY",
                    "reason": f"Precios desde hubs ({hub_median:.0f}€) 50%+ mas altos que secundarios ({secondary_median:.0f}€). Revisar arbitraje.",
                    "hub_price": round(hub_median),
                    "secondary_price": round(secondary_median),
                    "pct_more": round(pct_more),
                })

    return anomalies


# ═══════════════════════════════════════════════════════════════
# MAIN ANALYSIS FUNCTION
# ═══════════════════════════════════════════════════════════════

def analyze_all(all_flights, flights_by_date=None, date_ranges=None, cabin='economy',
                economy_prices=None, business_prices=None, flights_by_source=None):
    """
    Run all 6 detection techniques on flight data.

    Args:
        all_flights: List of all flight dicts
        flights_by_date: Dict of {date: [flights]}
        date_ranges: List of date range tuples
        cabin: 'economy' or 'business' focus
        economy_prices, business_prices: Precomputed price dicts
        flights_by_source: Dict of {source: [flights]}

    Returns:
        List of anomaly dicts, each with:
        - origin, destination, date_out, cabin, price_eur
        - classification: ERROR / ANOMALY / DEAL
        - type: T0/T1/T2/T3/T4/T5
        - reason: human-readable explanation
        - pct_off: percentage below reference
        - source: source that found it
    """
    anomalies = []

    if not all_flights:
        return anomalies

    # T0: Impossible prices (simple check on all flights)
    for f in all_flights:
        result = detect_impossible_prices(f)
        if result:
            anomalies.append({**f, **result})

    # Extract unique routes from flights
    routes = set()
    for f in all_flights:
        origin = f.get("origin")
        dest = f.get("destination")
        if origin and dest:
            routes.add((origin, dest))

    # T1: Cross-date comparison (if data available)
    if flights_by_date and date_ranges:
        for origin, destination in routes:
            for cabin_type in ['economy', 'business']:
                results = detect_cross_date_anomalies(
                    flights_by_date, date_ranges, origin, destination, cabin_type
                )
                anomalies.extend(results)

    # T2: Peer comparison (same origin, different destinations)
    origins = set(f.get("origin") for f in all_flights if f.get("origin"))
    for origin in origins:
        for cabin_type in ['economy', 'business']:
            results = detect_peer_anomalies(all_flights, origin, cabin_type)
            anomalies.extend(results)

    # T3: Cross-source validation (if source data available)
    if flights_by_source:
        for origin, destination in routes:
            for cabin_type in ['economy', 'business']:
                dates = set(f.get("date_out") for f in all_flights
                          if f.get("origin") == origin and f.get("destination") == destination)
                for date in dates:
                    results = detect_source_inconsistencies(
                        flights_by_source, origin, destination, cabin_type, date
                    )
                    anomalies.extend(results)

    # T4: Cabin ratio detection
    for origin, destination in routes:
        dates = set(f.get("date_out") for f in all_flights
                   if f.get("origin") == origin and f.get("destination") == destination)
        for date_out in dates:
            ret_dates = set(f.get("date_ret") for f in all_flights
                          if f.get("origin") == origin and f.get("destination") == destination)
            for date_ret in ret_dates:
                results = detect_cabin_ratio_anomalies(
                    all_flights, origin, destination, date_out, date_ret
                )
                anomalies.extend(results)

    # T5: Route anomalies
    for origin, destination in routes:
        for cabin_type in ['economy', 'business']:
            dates = set(f.get("date_out") for f in all_flights
                       if f.get("origin") == origin and f.get("destination") == destination)
            for date_out in dates:
                results = detect_route_anomalies(all_flights, origin, destination, cabin_type, date_out)
                anomalies.extend(results)

    # Deduplicate and sort by severity
    seen = set()
    unique_anomalies = []
    for a in anomalies:
        key = (
            a.get("origin"), a.get("destination"), a.get("date_out"),
            a.get("cabin"), a.get("type"), a.get("price_eur")
        )
        if key not in seen:
            seen.add(key)
            unique_anomalies.append(a)

    # Sort: ERRORs first, then ANOMALIEs, then DEALs; within each, by price
    severity_order = {"ERROR": 0, "ANOMALY": 1, "DEAL": 2}
    unique_anomalies.sort(
        key=lambda x: (severity_order.get(x.get("classification", "DEAL"), 3), x.get("price_eur", 99999))
    )

    return unique_anomalies


# ═══════════════════════════════════════════════════════════════
# VALUE & PRICE RANKING FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def rank_by_value(all_flights, top_n=30, min_stops=None, max_stops=None):
    """
    Score flights by value = quality / price
    Quality factors: airline reputation, stops, duration
    """
    if not all_flights:
        return []

    # Score each flight
    scored = []
    for f in all_flights:
        price = f.get("price_eur", 0)
        if price <= 0:
            continue

        # Quality components
        stops = f.get("stops", 0)
        duration = f.get("duration_minutes", 600)  # Default 10 hours
        airline = f.get("airline", "Unknown")
        rating = f.get("airline_rating", 3.5)

        # Penalize more stops
        stop_penalty = 1.0 - (stops * 0.15)
        stop_penalty = max(0.5, stop_penalty)

        # Penalize longer flights
        duration_score = 1.0 if duration < 720 else 0.8 if duration < 1080 else 0.6

        # Airline reputation
        airline_score = min(1.0, rating / 5.0)

        # Combined quality score (0-1)
        quality = (airline_score * 0.4) + (duration_score * 0.3) + (stop_penalty * 0.3)

        # Value = quality / price (normalized by typical price ~500)
        value_score = (quality * 100) / (price / 500)

        scored.append({
            **f,
            "value_score": round(value_score, 2),
            "quality_score": round(quality, 2),
        })

    # Filter by stops if requested
    if min_stops is not None:
        scored = [f for f in scored if f.get("stops", 0) >= min_stops]
    if max_stops is not None:
        scored = [f for f in scored if f.get("stops", 0) <= max_stops]

    # Sort by value score
    scored.sort(key=lambda x: x.get("value_score", 0), reverse=True)

    return scored[:top_n]


def rank_cheapest(all_flights, top_n=30):
    """Simply return cheapest flights"""
    if not all_flights:
        return []

    valid = [f for f in all_flights if f.get("price_eur", 0) > 0]
    valid.sort(key=lambda x: x.get("price_eur", 0))

    return valid[:top_n]


# ═══════════════════════════════════════════════════════════════
# REPORT GENERATION
# ═══════════════════════════════════════════════════════════════

def generate_report(anomalies, all_flights, search_params, flash_alerts=None,
                    top_value=None, top_cheap=None, db_stats=None):
    """
    Generate a detailed markdown report in Spanish.

    Args:
        anomalies: List from analyze_all()
        all_flights: All flight data
        search_params: Dict with origin, destinations, dates, etc.
        flash_alerts: List of flash deals/alerts
        top_value: Output from rank_by_value()
        top_cheap: Output from rank_cheapest()
        db_stats: Dict with database statistics

    Returns:
        Markdown string report
    """
    lines = []

    # Header
    lines.append("# Reporte de Anomalias - Flight Hunter v2")
    lines.append(f"**Generado:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")

    # Search parameters summary
    lines.append("## Parametros de Busqueda")
    lines.append(f"- **Origen(es):** {', '.join(search_params.get('origins', []))}")
    lines.append(f"- **Destino(s):** {', '.join(search_params.get('destinations', []))}")
    lines.append(f"- **Fechas:** {search_params.get('date_from', 'N/A')} a {search_params.get('date_to', 'N/A')}")
    lines.append(f"- **Cabina:** {search_params.get('cabin', 'economy')}")
    lines.append("")

    # Statistics
    if db_stats:
        lines.append("## Estadisticas")
        lines.append(f"- **Total vuelos:** {len(all_flights)}")
        lines.append(f"- **Anomalias detectadas:** {len(anomalies)}")
        lines.append(f"- **Errores:** {len([a for a in anomalies if a.get('classification') == 'ERROR'])}")
        lines.append(f"- **Anomalias:** {len([a for a in anomalies if a.get('classification') == 'ANOMALY'])}")
        lines.append(f"- **Chollos:** {len([a for a in anomalies if a.get('classification') == 'DEAL'])}")
        if db_stats.get("min_price"):
            lines.append(f"- **Precio minimo:** {db_stats['min_price']:.0f}€")
        if db_stats.get("avg_price"):
            lines.append(f"- **Precio promedio:** {db_stats['avg_price']:.0f}€")
        lines.append("")

    # Flash Alerts (if any)
    if flash_alerts:
        lines.append("## 🚀 Flash Alerts — Bajadas vs Historial")
        lines.append("")
        lines.append("| Ruta | Airline | Ahora | Antes | Bajada | Tipo |")
        lines.append("|------|---------|-------|-------|--------|------|")
        for alert in sorted(flash_alerts, key=lambda x: x.get("drop_pct", 0), reverse=True)[:15]:
            origin = alert.get("origin", "?")
            dest = alert.get("destination", "?")
            airline = (alert.get("airline") or "?")[:15]
            curr = f"{alert.get('price_current', 0):.0f}€"
            prev = f"{alert.get('price_previous', 0):.0f}€"
            drop = f"-{alert.get('drop_pct', 0):.0f}%"
            cls = alert.get("classification", "DEAL")
            icon = {"ERROR": "🚨", "ANOMALY": "⚠️", "DEAL": "💰"}.get(cls, "•")
            lines.append(f"| {origin}→{dest} | {airline} | {curr} | {prev} | {drop} | {icon} {cls} |")
        lines.append("")

    # Group anomalies by classification
    for cls in ["ERROR", "ANOMALY", "DEAL"]:
        group = [a for a in anomalies if a.get("classification") == cls]
        if not group:
            continue

        icons = {"ERROR": "🚨", "ANOMALY": "⚠️", "DEAL": "💰"}
        icon = icons.get(cls, "•")

        lines.append(f"---")
        lines.append(f"## {icon} {cls}S ({len(group)})")
        lines.append("")

        # Unified table for all classification types
        lines.append("| Ruta | Fecha | Precio | Ref | Tecnica | Razon |")
        lines.append("|------|-------|--------|-----|---------|-------|")
        for a in group[:50]:
            origin = a.get("origin", "?")
            dest = a.get("destination", "?")
            date = a.get("date_out", "?")
            price = f"{a.get('price_eur', 0):.0f}€"
            ref = a.get("price_ref", a.get("econ_price", a.get("direct_price", "")))
            ref_str = f"{ref:.0f}€" if isinstance(ref, (int, float)) and ref else "-"
            atype = a.get("type", "?")
            reason = a.get("reason", "")[:80]
            lines.append(f"| {origin}→{dest} | {date} | {price} | {ref_str} | {atype} | {reason} |")

        lines.append("")

    # Top value flights
    if top_value:
        lines.append("---")
        lines.append("## ⭐ Top Vuelos por Valor")
        lines.append("")
        lines.append("| Ruta | Fecha | Precio | Valor | Paradas | Duracion |")
        lines.append("|------|-------|--------|-------|---------|----------|")
        for f in top_value[:20]:
            origin = f.get("origin", "?")
            dest = f.get("destination", "?")
            date = f.get("date_out", "?")
            price = f"{f.get('price_eur', 0):.0f}€"
            value = f"{f.get('value_score', 0):.1f}"
            stops = f.get("stops", "?")
            duration_h = f.get("duration_minutes", 0) // 60
            duration_m = f.get("duration_minutes", 0) % 60
            lines.append(f"| {origin}→{dest} | {date} | {price} | {value} | {stops} | {duration_h}h{duration_m:02d}m |")
        lines.append("")

    # Top cheapest
    if top_cheap:
        lines.append("---")
        lines.append("## 💵 Top 20 Mas Baratos")
        lines.append("")
        lines.append("| Ruta | Fecha | Precio | Airline | Paradas |")
        lines.append("|------|-------|--------|---------|---------|")
        for f in top_cheap[:20]:
            origin = f.get("origin", "?")
            dest = f.get("destination", "?")
            date = f.get("date_out", "?")
            price = f"{f.get('price_eur', 0):.0f}€"
            airline = f.get("airline", "?")[:15]
            stops = f.get("stops", "?")
            lines.append(f"| {origin}→{dest} | {date} | {price} | {airline} | {stops} |")
        lines.append("")

    # Summary
    lines.append("---")
    lines.append("## Resumen")
    error_count = len([a for a in anomalies if a.get("classification") == "ERROR"])
    anomaly_count = len([a for a in anomalies if a.get("classification") == "ANOMALY"])
    deal_count = len([a for a in anomalies if a.get("classification") == "DEAL"])

    if error_count > 0:
        lines.append(f"🚨 **{error_count} errores detectados** - revisar inmediatamente")
    if anomaly_count > 0:
        lines.append(f"⚠️ **{anomaly_count} anomalias** - pueden ser chollos o errores")
    if deal_count > 0:
        lines.append(f"💰 **{deal_count} chollos** - precios notablemente bajos")
    if not anomalies:
        lines.append("✅ No se detectaron anomalias. Precios normales.")

    lines.append("")
    lines.append(f"*Reporte generado por Flight Hunter v2 - 6 tecnicas de deteccion*")

    return "\n".join(lines)
