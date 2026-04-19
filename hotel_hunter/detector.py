"""
Hotel Deal Hunter — Price Error Detector (v2 optimized)
========================================================
Finds REAL pricing errors on Booking.com using statistical
outlier detection across multiple weeks.

A price is an ERROR when it's a statistical outlier:
- 2+ standard deviations below the mean across weeks
- OR price < 40% of median across weeks (60%+ discount)
- AND the hotel has a decent rating (≥ 7.0)
"""

from datetime import datetime
from statistics import median, mean, stdev
from collections import defaultdict


def calculate_nights(checkin, checkout):
    try:
        return (datetime.strptime(checkout, "%Y-%m-%d") - datetime.strptime(checkin, "%Y-%m-%d")).days
    except Exception as e:
        print(f"      ⚠️ Detection error: {str(e)[:60]}", flush=True)
        return 7


# ═══════════════════════════════════════════════════════════
# MAIN DETECTION: Cross-date statistical outlier detection
# ═══════════════════════════════════════════════════════════

def detect_cross_date_errors(results_by_date, date_ranges, min_score=0):
    """
    Compare the same hotel across different weeks.
    Uses both median-ratio AND standard deviation for detection.

    Example:
    Hotel X prices: [1200, 1100, 350, 1300, 1150]
    Mean: 1020, StdDev: 377, Median: 1150
    350 is 1.78 std devs below mean → ANOMALY
    350/1150 = 0.30 → 70% off median → ERROR

    Both methods must agree for strongest signal.
    """
    anomalies = []

    # Build: {(destination, hotel_name): {date: hotel_data}}
    hotel_by_week = defaultdict(dict)

    for ci, hotels in results_by_date.items():
        for h in hotels:
            key = (h["destination"], h["name"])
            hotel_by_week[key][ci] = h

    for key, weeks_data in hotel_by_week.items():
        if len(weeks_data) < 3:
            continue

        dest, name = key
        prices = {d: h["price_total"] for d, h in weeks_data.items() if h["price_total"] > 0}

        if len(prices) < 3:
            continue

        all_prices = list(prices.values())
        ref_median = median(all_prices)
        ref_mean = mean(all_prices)

        if ref_median <= 0:
            continue

        # Calculate standard deviation (need 3+ data points)
        ref_std = stdev(all_prices) if len(all_prices) >= 3 else ref_mean * 0.3

        for date, price in prices.items():
            h = weeks_data[date]

            # Skip low-rated hotels (no point finding deals on bad hotels)
            hotel_score = h.get("score", 0)
            if min_score > 0 and hotel_score > 0 and hotel_score < min_score:
                continue

            ratio = price / ref_median
            pct_off = (1 - ratio) * 100

            # Statistical test: how many std devs below mean?
            if ref_std > 0:
                z_score = (ref_mean - price) / ref_std
            else:
                z_score = 0

            nights = calculate_nights(h["checkin"], h["checkout"])
            ppn = round(price / max(1, nights), 1)
            ref_ppn = round(ref_median / max(1, nights), 1)

            other_prices = {d: p for d, p in prices.items() if d != date}
            savings = round(ref_median - price)

            base_info = {
                "hotel": name,
                "destination": dest,
                "stars": h.get("stars", 0),
                "score": hotel_score,
                "review_count": h.get("review_count", 0),
                "price_total": price,
                "price_per_night": ppn,
                "ref_median": round(ref_median),
                "ref_mean": round(ref_mean),
                "ref_ppn": ref_ppn,
                "pct_off": round(pct_off),
                "ratio": round(ratio, 3),
                "z_score": round(z_score, 2),
                "savings": savings,
                "other_weeks": other_prices,
                "nights": nights,
                "link": h.get("link", ""),
                "sea": h.get("sea", False),
                "checkin": date,
                "checkout": h.get("checkout", ""),
                "distance": h.get("distance", ""),
            }

            # ── Classification ──
            # ERROR: ratio ≤ 0.40 (60%+ off) OR z_score > 2.5
            # ANOMALY: ratio ≤ 0.55 (45%+ off) OR z_score > 1.8
            # DEAL: ratio ≤ 0.70 (30%+ off) OR z_score > 1.2

            if ratio <= 0.40 or (z_score >= 2.5 and ratio <= 0.55):
                base_info["type"] = "PRICE_ERROR"
                base_info["classification"] = "ERROR"
                base_info["reason"] = (
                    f"🚨 {price}€ vs mediana {ref_median:.0f}€ → {pct_off:.0f}% OFF "
                    f"(z={z_score:.1f}σ). Ahorras {savings}€. "
                    f"Otras: {', '.join(f'{p}€' for p in sorted(other_prices.values()))}"
                )
                anomalies.append(base_info)

            elif ratio <= 0.55 or (z_score >= 1.8 and ratio <= 0.65):
                base_info["type"] = "PRICE_ANOMALY"
                base_info["classification"] = "ANOMALY"
                base_info["reason"] = (
                    f"⚠️ {price}€ vs mediana {ref_median:.0f}€ → {pct_off:.0f}% OFF "
                    f"(z={z_score:.1f}σ). Ahorras {savings}€. "
                    f"Otras: {', '.join(f'{p}€' for p in sorted(other_prices.values()))}"
                )
                anomalies.append(base_info)

            elif ratio <= 0.70 or (z_score >= 1.2 and ratio <= 0.75):
                base_info["type"] = "GREAT_DEAL"
                base_info["classification"] = "DEAL"
                base_info["reason"] = (
                    f"💰 {price}€ vs mediana {ref_median:.0f}€ → {pct_off:.0f}% OFF "
                    f"(z={z_score:.1f}σ). Ahorras {savings}€. "
                    f"Otras: {', '.join(f'{p}€' for p in sorted(other_prices.values()))}"
                )
                anomalies.append(base_info)

    return anomalies


# ═══════════════════════════════════════════════════════════
# SECONDARY: Peer comparison within same destination+stars
# ═══════════════════════════════════════════════════════════

def detect_peer_anomalies(hotels, min_score=0):
    """
    Compare hotels of same star level in same destination.
    If one is a massive outlier vs its peers → suspicious.
    """
    anomalies = []

    groups = defaultdict(list)
    for h in hotels:
        if h["stars"] > 0 and h["price_total"] > 0:
            if min_score > 0 and h.get("score", 0) > 0 and h.get("score", 0) < min_score:
                continue
            key = (h["destination"], h["stars"], h["checkin"])
            groups[key].append(h)

    for (dest, stars, checkin), group in groups.items():
        if len(group) < 3:
            continue

        prices = [h["price_total"] for h in group]
        med = median(prices)
        avg = mean(prices)
        sd = stdev(prices) if len(prices) >= 3 else avg * 0.3

        if med <= 0:
            continue

        for h in group:
            ratio = h["price_total"] / med
            pct_off = (1 - ratio) * 100
            z_score = (avg - h["price_total"]) / sd if sd > 0 else 0
            nights = calculate_nights(h["checkin"], h["checkout"])
            ppn = round(h["price_total"] / max(1, nights), 1)

            if ratio <= 0.45 or (z_score >= 2.0 and ratio <= 0.55):
                anomalies.append({
                    "type": "PEER_PRICE_ERROR",
                    "classification": "ERROR",
                    "hotel": h["name"],
                    "destination": dest,
                    "stars": stars,
                    "score": h.get("score", 0),
                    "price_total": h["price_total"],
                    "price_per_night": ppn,
                    "peer_median": round(med),
                    "pct_off": round(pct_off),
                    "ratio": round(ratio, 3),
                    "z_score": round(z_score, 2),
                    "nights": nights,
                    "link": h.get("link", ""),
                    "sea": h.get("sea", False),
                    "checkin": checkin,
                    "checkout": h.get("checkout", ""),
                    "reason": f"🚨 {h['price_total']}€ vs mediana {stars}★ en {dest}: {med:.0f}€ ({pct_off:.0f}% menos, z={z_score:.1f}σ)",
                })
            elif ratio <= 0.60 and h.get("score", 0) >= 7.5:
                anomalies.append({
                    "type": "PEER_PRICE_DEAL",
                    "classification": "DEAL",
                    "hotel": h["name"],
                    "destination": dest,
                    "stars": stars,
                    "score": h.get("score", 0),
                    "price_total": h["price_total"],
                    "price_per_night": ppn,
                    "peer_median": round(med),
                    "pct_off": round(pct_off),
                    "ratio": round(ratio, 3),
                    "z_score": round(z_score, 2),
                    "nights": nights,
                    "link": h.get("link", ""),
                    "sea": h.get("sea", False),
                    "checkin": checkin,
                    "checkout": h.get("checkout", ""),
                    "reason": f"💰 {h['price_total']}€ vs mediana {stars}★: {med:.0f}€ ({pct_off:.0f}% menos, nota {h.get('score',0)})",
                })

    return anomalies


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 3: Room type comparison (1 adult vs 2 adults)
# ═══════════════════════════════════════════════════════════

def detect_room_type_errors(results_1adult, results_2adults, date_ranges=None, min_score=0):
    """
    Compare prices for the SAME hotel with 1 adult vs 2 adults.

    Logic: A double room (2 adults) should cost the SAME or MORE than a single (1 adult).
    If a double room costs significantly LESS → PRICING ERROR.
    Also: if the price is virtually IDENTICAL → interesting (means per-room pricing, no per-person).
    If double is only slightly more (< 20% more) → normal.
    If double costs 30%+ LESS than single → ERROR.
    """
    anomalies = []

    # Build lookup: {(checkin, hotel_name): hotel_data}
    for ci in results_1adult:
        hotels_1 = {h["name"]: h for h in results_1adult.get(ci, [])}
        hotels_2 = {h["name"]: h for h in results_2adults.get(ci, [])}

        # Find hotels present in both searches
        common = set(hotels_1.keys()) & set(hotels_2.keys())

        for name in common:
            h1 = hotels_1[name]
            h2 = hotels_2[name]

            p1 = h1["price_total"]  # single room
            p2 = h2["price_total"]  # double room

            if p1 <= 0 or p2 <= 0:
                continue

            hotel_score = h2.get("score", 0)
            if min_score > 0 and hotel_score > 0 and hotel_score < min_score:
                continue

            nights = calculate_nights(h2["checkin"], h2["checkout"])

            # How much cheaper is the double vs single?
            # Negative = double is cheaper (ERROR)
            # Positive = double is more expensive (normal)
            diff_pct = ((p2 - p1) / p1) * 100  # positive = double costs more
            savings = p1 - p2  # positive = you save by booking double

            ppn_1 = round(p1 / max(1, nights), 1)
            ppn_2 = round(p2 / max(1, nights), 1)

            base_info = {
                "hotel": name,
                "destination": h2.get("destination", ""),
                "stars": h2.get("stars", 0),
                "score": hotel_score,
                "review_count": h2.get("review_count", 0),
                "price_single": p1,
                "price_double": p2,
                "price_total": p2,
                "price_per_night": ppn_2,
                "ppn_single": ppn_1,
                "ppn_double": ppn_2,
                "diff_pct": round(diff_pct, 1),
                "savings": savings,
                "nights": nights,
                "link": h2.get("link", ""),
                "link_single": h1.get("link", ""),
                "sea": h2.get("sea", False),
                "checkin": ci,
                "checkout": h2.get("checkout", ""),
                "distance": h2.get("distance", ""),
            }

            # CLASSIFICATION:
            # Double costs 30%+ LESS than single → ERROR (should never happen!)
            # Double costs 15-30% LESS → ANOMALY
            # Double costs same or up to 10% less → DEAL (room pricing, not per-person)

            if diff_pct <= -30:  # Double is 30%+ cheaper than single
                base_info["type"] = "ROOM_TYPE_ERROR"
                base_info["classification"] = "ERROR"
                base_info["ratio"] = p2 / p1
                base_info["pct_off"] = round(-diff_pct)
                base_info["reason"] = (
                    f"🚨 DOBLE MÁS BARATA: {p2}€ (doble) vs {p1}€ (simple) → "
                    f"la doble cuesta {-diff_pct:.0f}% MENOS. Ahorras {savings}€ "
                    f"reservando para 2. ¡Error de precio claro!"
                )
                anomalies.append(base_info)

            elif diff_pct <= -15:  # Double is 15-30% cheaper
                base_info["type"] = "ROOM_TYPE_ANOMALY"
                base_info["classification"] = "ANOMALY"
                base_info["ratio"] = p2 / p1
                base_info["pct_off"] = round(-diff_pct)
                base_info["reason"] = (
                    f"⚠️ DOBLE más barata: {p2}€ (doble) vs {p1}€ (simple) → "
                    f"la doble cuesta {-diff_pct:.0f}% menos. Ahorras {savings}€. "
                    f"Posible error de precio."
                )
                anomalies.append(base_info)

            elif diff_pct <= -5:  # Double is 5-15% cheaper (suspicious)
                base_info["type"] = "ROOM_TYPE_DEAL"
                base_info["classification"] = "DEAL"
                base_info["ratio"] = p2 / p1
                base_info["pct_off"] = round(-diff_pct)
                base_info["reason"] = (
                    f"💰 Doble ligeramente más barata: {p2}€ (doble) vs {p1}€ (simple) → "
                    f"{-diff_pct:.0f}% menos. Ahorras {savings}€ reservando para 2."
                )
                anomalies.append(base_info)

    return anomalies


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 4: Duration arbitrage (7n vs 14n per-night)
# ═══════════════════════════════════════════════════════════

def detect_duration_errors(results_by_nights, min_score=0):
    """
    Compare per-night price for different stay lengths.
    If 14 nights per-night is 30%+ cheaper than 7 nights → DEAL.
    If 14 nights TOTAL is cheaper than 7 nights total → ERROR (impossible!).
    """
    anomalies = []
    nights_keys = sorted(results_by_nights.keys())  # e.g., [7, 14]

    if len(nights_keys) < 2:
        return anomalies

    short_n = nights_keys[0]  # e.g., 7
    long_n = nights_keys[1]   # e.g., 14

    # Build lookup by hotel name
    short_hotels = {}
    for h in results_by_nights[short_n]:
        key = (h["destination"], h["name"])
        short_hotels[key] = h

    for h in results_by_nights[long_n]:
        key = (h["destination"], h["name"])
        if key not in short_hotels:
            continue

        hs = short_hotels[key]
        hotel_score = h.get("score", 0)
        if min_score > 0 and hotel_score > 0 and hotel_score < min_score:
            continue

        p_short = hs["price_total"]  # e.g., 7 nights total
        p_long = h["price_total"]    # e.g., 14 nights total

        if p_short <= 0 or p_long <= 0:
            continue

        ppn_short = p_short / short_n
        ppn_long = p_long / long_n

        # Per-night comparison
        ppn_diff = ((ppn_long - ppn_short) / ppn_short) * 100  # negative = long is cheaper per night

        base_info = {
            "hotel": h["name"],
            "destination": h["destination"],
            "stars": h.get("stars", 0),
            "score": hotel_score,
            "price_total": h["price_total"],
            "price_per_night": round(ppn_long, 1),
            "price_short": p_short,
            "price_long": p_long,
            "ppn_short": round(ppn_short, 1),
            "ppn_long": round(ppn_long, 1),
            "nights_short": short_n,
            "nights_long": long_n,
            "link": h.get("link", ""),
            "link_short": hs.get("link", ""),
            "sea": h.get("sea", False),
            "checkin": h.get("checkin", ""),
            "checkout": h.get("checkout", ""),
        }

        # If TOTAL price for longer stay is cheaper → definite error
        if p_long < p_short:
            savings = p_short - p_long
            base_info["type"] = "DURATION_ERROR"
            base_info["classification"] = "ERROR"
            base_info["ratio"] = p_long / p_short
            base_info["pct_off"] = round((1 - p_long / p_short) * 100)
            base_info["reason"] = (
                f"🚨 {long_n} NOCHES MÁS BARATO QUE {short_n}: "
                f"{p_long}€ ({long_n}n) vs {p_short}€ ({short_n}n). "
                f"¡Paga MENOS por el DOBLE de noches! Ahorras {savings}€"
            )
            anomalies.append(base_info)

        # If per-night is 40%+ cheaper for long stay
        elif ppn_diff <= -40:
            base_info["type"] = "DURATION_ANOMALY"
            base_info["classification"] = "ANOMALY"
            base_info["ratio"] = ppn_long / ppn_short
            base_info["pct_off"] = round(-ppn_diff)
            base_info["reason"] = (
                f"⚠️ {long_n}n mucho más barato por noche: "
                f"{ppn_long:.0f}€/n vs {ppn_short:.0f}€/n ({short_n}n). "
                f"Total: {p_long}€ vs {p_short}€. {-ppn_diff:.0f}% menos por noche."
            )
            anomalies.append(base_info)

        # If per-night is 25%+ cheaper
        elif ppn_diff <= -25:
            base_info["type"] = "DURATION_DEAL"
            base_info["classification"] = "DEAL"
            base_info["ratio"] = ppn_long / ppn_short
            base_info["pct_off"] = round(-ppn_diff)
            base_info["reason"] = (
                f"💰 {long_n}n más barato por noche: "
                f"{ppn_long:.0f}€/n vs {ppn_short:.0f}€/n ({short_n}n). "
                f"Total: {p_long}€ vs {p_short}€"
            )
            anomalies.append(base_info)

    return anomalies


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 5: Currency arbitrage
# ═══════════════════════════════════════════════════════════

# Approximate exchange rates (updated periodically)
EXCHANGE_TO_EUR = {
    "EUR": 1.0,
    "USD": 0.92,   # 1 USD ≈ 0.92 EUR
    "GBP": 1.17,   # 1 GBP ≈ 1.17 EUR
}

def detect_currency_errors(results_by_currency, min_score=0):
    """
    Compare the same hotel priced in different currencies.
    Convert all to EUR equivalent and compare.
    If one currency gives 20%+ cheaper → error in conversion.
    """
    anomalies = []
    currencies = list(results_by_currency.keys())

    if len(currencies) < 2:
        return anomalies

    # Build lookup: {(dest, hotel): {currency: (price, hotel_data)}}
    hotel_prices = defaultdict(dict)
    for cur, hotels in results_by_currency.items():
        for h in hotels:
            key = (h["destination"], h["name"])
            eur_equiv = h["price_total"] * EXCHANGE_TO_EUR.get(cur, 1.0)
            hotel_prices[key][cur] = (h["price_total"], eur_equiv, h)

    for (dest, name), cur_data in hotel_prices.items():
        if len(cur_data) < 2:
            continue

        # Get EUR equivalents
        eur_prices = {c: data[1] for c, data in cur_data.items()}
        all_eur = list(eur_prices.values())
        med_eur = median(all_eur)

        if med_eur <= 0:
            continue

        for cur, (raw_price, eur_price, h) in cur_data.items():
            hotel_score = h.get("score", 0)
            if min_score > 0 and hotel_score > 0 and hotel_score < min_score:
                continue

            ratio = eur_price / med_eur
            diff_pct = (1 - ratio) * 100
            nights = calculate_nights(h["checkin"], h["checkout"])

            if diff_pct < 15:  # Only flag if 15%+ cheaper
                continue

            base_info = {
                "hotel": name,
                "destination": dest,
                "stars": h.get("stars", 0),
                "score": hotel_score,
                "price_total": raw_price,
                "price_per_night": round(raw_price / max(1, nights), 1),
                "currency_searched": cur,
                "eur_equivalent": round(eur_price),
                "eur_median": round(med_eur),
                "all_currencies": {c: (d[0], round(d[1])) for c, d in cur_data.items()},
                "nights": nights,
                "link": h.get("link", ""),
                "sea": h.get("sea", False),
                "checkin": h.get("checkin", ""),
                "checkout": h.get("checkout", ""),
            }

            if diff_pct >= 30:
                base_info["type"] = "CURRENCY_ERROR"
                base_info["classification"] = "ERROR"
                base_info["ratio"] = round(ratio, 3)
                base_info["pct_off"] = round(diff_pct)
                prices_str = ", ".join(f"{d[0]} {c} (≈{d[1]:.0f}€)" for c, d in cur_data.items())
                base_info["reason"] = (
                    f"🚨 ARBITRAJE MONEDA: {raw_price} {cur} (≈{eur_price:.0f}€) vs "
                    f"mediana {med_eur:.0f}€. {diff_pct:.0f}% más barato en {cur}. "
                    f"Precios: {prices_str}"
                )
                anomalies.append(base_info)

            elif diff_pct >= 15:
                base_info["type"] = "CURRENCY_DEAL"
                base_info["classification"] = "DEAL"
                base_info["ratio"] = round(ratio, 3)
                base_info["pct_off"] = round(diff_pct)
                prices_str = ", ".join(f"{d[0]} {c} (≈{d[1]:.0f}€)" for c, d in cur_data.items())
                base_info["reason"] = (
                    f"💱 Más barato en {cur}: {raw_price} {cur} (≈{eur_price:.0f}€) vs "
                    f"mediana {med_eur:.0f}€. {diff_pct:.0f}% menos. {prices_str}"
                )
                anomalies.append(base_info)

    return anomalies


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 6: Check-in day arbitrage
# ═══════════════════════════════════════════════════════════

def detect_checkin_day_errors(results_by_day, days_info, min_score=0):
    """
    Same hotel, same week, different check-in day.
    If one day is dramatically cheaper → pricing error in daily rate config.
    """
    anomalies = []

    # Build: {(dest, hotel): {checkin_day: (price, hotel_data)}}
    hotel_by_day = defaultdict(dict)
    for ci, hotels in results_by_day.items():
        for h in hotels:
            key = (h["destination"], h["name"])
            hotel_by_day[key][ci] = h

    for (dest, name), day_data in hotel_by_day.items():
        if len(day_data) < 2:
            continue

        prices = {d: h["price_total"] for d, h in day_data.items() if h["price_total"] > 0}
        if len(prices) < 2:
            continue

        med = median(list(prices.values()))
        if med <= 0:
            continue

        for ci, price in prices.items():
            h = day_data[ci]
            hotel_score = h.get("score", 0)
            if min_score > 0 and hotel_score > 0 and hotel_score < min_score:
                continue

            ratio = price / med
            pct_off = (1 - ratio) * 100
            nights = calculate_nights(h["checkin"], h["checkout"])
            day_name = datetime.strptime(ci, "%Y-%m-%d").strftime("%A")

            if pct_off < 20:
                continue

            other_prices = {d: p for d, p in prices.items() if d != ci}
            base_info = {
                "hotel": name,
                "destination": dest,
                "stars": h.get("stars", 0),
                "score": hotel_score,
                "price_total": price,
                "price_per_night": round(price / max(1, nights), 1),
                "ref_median": round(med),
                "checkin_day": day_name,
                "other_days": other_prices,
                "nights": nights,
                "link": h.get("link", ""),
                "sea": h.get("sea", False),
                "checkin": ci,
                "checkout": h.get("checkout", ""),
            }

            if pct_off >= 50:
                base_info["type"] = "CHECKIN_DAY_ERROR"
                base_info["classification"] = "ERROR"
                base_info["ratio"] = round(ratio, 3)
                base_info["pct_off"] = round(pct_off)
                others = ", ".join(f"{datetime.strptime(d,'%Y-%m-%d').strftime('%a')}:{p}€" for d, p in sorted(other_prices.items()))
                base_info["reason"] = (
                    f"🚨 CHECK-IN {day_name}: {price}€ vs mediana {med:.0f}€ → "
                    f"{pct_off:.0f}% OFF. Otros días: {others}"
                )
                anomalies.append(base_info)

            elif pct_off >= 30:
                base_info["type"] = "CHECKIN_DAY_ANOMALY"
                base_info["classification"] = "ANOMALY"
                base_info["ratio"] = round(ratio, 3)
                base_info["pct_off"] = round(pct_off)
                others = ", ".join(f"{datetime.strptime(d,'%Y-%m-%d').strftime('%a')}:{p}€" for d, p in sorted(other_prices.items()))
                base_info["reason"] = (
                    f"⚠️ {day_name} más barato: {price}€ vs mediana {med:.0f}€ → "
                    f"{pct_off:.0f}% OFF. Otros: {others}"
                )
                anomalies.append(base_info)

            elif pct_off >= 20:
                base_info["type"] = "CHECKIN_DAY_DEAL"
                base_info["classification"] = "DEAL"
                base_info["ratio"] = round(ratio, 3)
                base_info["pct_off"] = round(pct_off)
                base_info["reason"] = (
                    f"💰 {day_name} más barato: {price}€ vs mediana {med:.0f}€ → {pct_off:.0f}% OFF"
                )
                anomalies.append(base_info)

    return anomalies


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 7: Room count comparison (1/2/3 rooms)
# ═══════════════════════════════════════════════════════════

def detect_rooms_errors(results_by_rooms, min_score=0):
    """
    Compare per-room price for 1 room vs 2 rooms vs 3 rooms.
    If 2 rooms per-room is 30%+ cheaper than 1 room → suspicious.
    If 3 rooms total is cheaper than 1 room → ERROR.
    """
    anomalies = []
    room_keys = sorted(results_by_rooms.keys())  # e.g., [1, 2, 3]

    if len(room_keys) < 2:
        return anomalies

    base_rooms = room_keys[0]  # 1 room = reference

    # Build lookup: {(dest, hotel): hotel_data} for base (1 room)
    base_hotels = {}
    for h in results_by_rooms[base_rooms]:
        key = (h["destination"], h["name"])
        base_hotels[key] = h

    for n_rooms in room_keys[1:]:  # 2 rooms, 3 rooms
        for h in results_by_rooms[n_rooms]:
            key = (h["destination"], h["name"])
            if key not in base_hotels:
                continue

            hb = base_hotels[key]
            hotel_score = h.get("score", 0)
            if min_score > 0 and hotel_score > 0 and hotel_score < min_score:
                continue

            p_base = hb["price_total"]        # price for 1 room
            p_multi = h["price_total"]         # price for N rooms
            per_room_base = p_base / base_rooms
            per_room_multi = p_multi / n_rooms

            if p_base <= 0 or p_multi <= 0:
                continue

            nights = calculate_nights(h["checkin"], h["checkout"])

            # Per-room comparison
            diff_pct = ((per_room_multi - per_room_base) / per_room_base) * 100

            base_info = {
                "hotel": h["name"],
                "destination": h["destination"],
                "stars": h.get("stars", 0),
                "score": hotel_score,
                "price_total": p_multi,
                "price_per_night": round(p_multi / max(1, nights), 1),
                "price_base": p_base,
                "price_multi": p_multi,
                "per_room_base": round(per_room_base),
                "per_room_multi": round(per_room_multi),
                "rooms_base": base_rooms,
                "rooms_multi": n_rooms,
                "nights": nights,
                "link": h.get("link", ""),
                "link_base": hb.get("link", ""),
                "sea": h.get("sea", False),
                "checkin": h.get("checkin", ""),
                "checkout": h.get("checkout", ""),
            }

            # N rooms TOTAL cheaper than 1 room → definite error
            if p_multi < p_base:
                savings = p_base - p_multi
                base_info["type"] = "ROOMS_ERROR"
                base_info["classification"] = "ERROR"
                base_info["ratio"] = p_multi / p_base
                base_info["pct_off"] = round((1 - p_multi / p_base) * 100)
                base_info["reason"] = (
                    f"🚨 {n_rooms} HAB MÁS BARATO QUE {base_rooms}: "
                    f"{p_multi}€ ({n_rooms} hab) vs {p_base}€ ({base_rooms} hab). "
                    f"¡Pagas MENOS por MÁS habitaciones! Ahorras {savings}€"
                )
                anomalies.append(base_info)

            # Per-room 50%+ cheaper
            elif diff_pct <= -50:
                base_info["type"] = "ROOMS_ANOMALY"
                base_info["classification"] = "ANOMALY"
                base_info["ratio"] = per_room_multi / per_room_base
                base_info["pct_off"] = round(-diff_pct)
                base_info["reason"] = (
                    f"⚠️ {n_rooms} hab por habitación mucho más barato: "
                    f"{per_room_multi:.0f}€/hab vs {per_room_base:.0f}€/hab ({base_rooms} hab). "
                    f"Total: {p_multi}€ vs {p_base}€. {-diff_pct:.0f}% menos por hab."
                )
                anomalies.append(base_info)

            # Per-room 30%+ cheaper
            elif diff_pct <= -30:
                base_info["type"] = "ROOMS_DEAL"
                base_info["classification"] = "DEAL"
                base_info["ratio"] = per_room_multi / per_room_base
                base_info["pct_off"] = round(-diff_pct)
                base_info["reason"] = (
                    f"💰 {n_rooms} hab más barato por habitación: "
                    f"{per_room_multi:.0f}€/hab vs {per_room_base:.0f}€/hab. "
                    f"Total: {p_multi}€ vs {p_base}€"
                )
                anomalies.append(base_info)

    return anomalies


# ═══════════════════════════════════════════════════════════
# TECHNIQUE 9: Mobile vs desktop comparison
# ═══════════════════════════════════════════════════════════

def detect_mobile_errors(results_mobile, min_score=0):
    """
    Compare desktop vs mobile prices for the same hotel.
    If mobile is 20%+ cheaper → pricing discrepancy.
    """
    anomalies = []

    desktop_hotels = {(h["destination"], h["name"]): h for h in results_mobile.get("desktop", [])}

    for h in results_mobile.get("mobile", []):
        key = (h["destination"], h["name"])
        if key not in desktop_hotels:
            continue

        hd = desktop_hotels[key]
        hotel_score = h.get("score", 0)
        if min_score > 0 and hotel_score > 0 and hotel_score < min_score:
            continue

        p_desk = hd["price_total"]
        p_mob = h["price_total"]

        if p_desk <= 0 or p_mob <= 0:
            continue

        nights = calculate_nights(h["checkin"], h["checkout"])

        # Which is cheaper?
        if p_mob < p_desk:
            diff = ((p_desk - p_mob) / p_desk) * 100
            cheaper = "mobile"
            savings = p_desk - p_mob
        else:
            diff = ((p_mob - p_desk) / p_mob) * 100
            cheaper = "desktop"
            savings = p_mob - p_desk

        if diff < 15:
            continue

        base_info = {
            "hotel": h["name"],
            "destination": h["destination"],
            "stars": h.get("stars", 0),
            "score": hotel_score,
            "price_total": min(p_desk, p_mob),
            "price_per_night": round(min(p_desk, p_mob) / max(1, nights), 1),
            "price_desktop": p_desk,
            "price_mobile": p_mob,
            "cheaper_on": cheaper,
            "nights": nights,
            "link": h.get("link", ""),
            "sea": h.get("sea", False),
            "checkin": h.get("checkin", ""),
            "checkout": h.get("checkout", ""),
        }

        if diff >= 30:
            base_info["type"] = "MOBILE_ERROR"
            base_info["classification"] = "ERROR"
            base_info["ratio"] = min(p_desk, p_mob) / max(p_desk, p_mob)
            base_info["pct_off"] = round(diff)
            base_info["reason"] = (
                f"🚨 PRECIO {cheaper.upper()} MUCHO MÁS BARATO: "
                f"desktop {p_desk}€ vs mobile {p_mob}€ → {diff:.0f}% diferencia. "
                f"Ahorras {savings}€ reservando en {cheaper}."
            )
            anomalies.append(base_info)
        elif diff >= 15:
            base_info["type"] = "MOBILE_DEAL"
            base_info["classification"] = "DEAL"
            base_info["ratio"] = min(p_desk, p_mob) / max(p_desk, p_mob)
            base_info["pct_off"] = round(diff)
            base_info["reason"] = (
                f"📱 Más barato en {cheaper}: desktop {p_desk}€ vs mobile {p_mob}€ → "
                f"{diff:.0f}% diferencia. Ahorras {savings}€."
            )
            anomalies.append(base_info)

    return anomalies


# ═══════════════════════════════════════════════════════════
# IQR-BASED OUTLIER DETECTION (per destination)
# ═══════════════════════════════════════════════════════════

def detect_iqr_outliers(all_hotels, min_group_size=3):
    """
    Group hotels by destination (ignoring stars), find outliers using IQR method.
    Q1 = 25th percentile, Q3 = 75th percentile, IQR = Q3-Q1
    Outlier = price < Q1 - 1.5*IQR (lower fence for cheap hotels)
    """
    anomalies = []

    # Group by destination only (not by stars)
    groups = defaultdict(list)
    for h in all_hotels:
        if h["price_total"] > 0:
            dest = h["destination"]
            groups[dest].append(h)

    for dest, hotels in groups.items():
        if len(hotels) < min_group_size:
            continue

        prices = sorted([h["price_total"] for h in hotels])
        n = len(prices)

        # Calculate quartiles
        q1_idx = n // 4
        q3_idx = (3 * n) // 4
        q1 = prices[q1_idx]
        q3 = prices[q3_idx]
        iqr = q3 - q1

        if iqr == 0:
            continue

        lower_fence = q1 - 1.5 * iqr

        # Find hotels below lower fence
        for h in hotels:
            price = h["price_total"]
            if price < lower_fence:
                nights = calculate_nights(h.get("checkin", ""), h.get("checkout", ""))
                ppn = round(price / max(1, nights), 1)

                # Calculate how extreme this outlier is
                outlier_score = (lower_fence - price) / iqr if iqr > 0 else 0

                anomalies.append({
                    "type": "IQR_OUTLIER",
                    "classification": "DEAL" if outlier_score < 2 else "ANOMALY",
                    "hotel": h["name"],
                    "destination": dest,
                    "stars": h.get("stars", 0),
                    "score": h.get("score", 0),
                    "price_total": price,
                    "price_per_night": ppn,
                    "q1": round(q1),
                    "q3": round(q3),
                    "iqr": round(iqr),
                    "lower_fence": round(lower_fence),
                    "outlier_score": round(outlier_score, 2),
                    "nights": nights,
                    "link": h.get("link", ""),
                    "sea": h.get("sea", False),
                    "checkin": h.get("checkin", ""),
                    "checkout": h.get("checkout", ""),
                    "distance": h.get("distance", ""),
                    "reason": (
                        f"📊 IQR Outlier: {price}€ vs Q1-1.5*IQR={lower_fence:.0f}€ "
                        f"({outlier_score:.1f}σ abajo). "
                        f"Rango en {dest}: Q1={q1:.0f}€, Q3={q3:.0f}€"
                    ),
                })

    return anomalies


# ═══════════════════════════════════════════════════════════
# CHAIN COMPARISON (same hotel chain, different destinations)
# ═══════════════════════════════════════════════════════════

def detect_chain_anomalies(all_hotels):
    """
    Detect when the same hotel chain has wildly different prices across destinations.
    Groups by chain name prefix (Iberostar, Atlantica, Grecotel, Club Hotel, etc.)
    """
    anomalies = []

    # Common chain prefixes
    chain_prefixes = [
        "Iberostar", "Atlantica", "Grecotel", "Club Hotel", "TUI",
        "Sunwing", "Grand Palladium", "Barcelo", "Meliá", "Marriott",
        "Hilton", "Hyatt", "Sheraton", "Westin", "Radisson",
        "Novotel", "Mercure", "Accor", "NH Hotel", "Parador",
        "Costa", "Sandals", "Beaches", "Bahia", "Tropical",
    ]

    # Group hotels by chain prefix
    chain_groups = defaultdict(list)
    for h in all_hotels:
        if h["price_total"] > 0:
            name = h["name"].lower()
            found_chain = None
            for prefix in chain_prefixes:
                if prefix.lower() in name:
                    found_chain = prefix
                    break
            if found_chain:
                chain_groups[found_chain].append(h)

    # Check each chain
    for chain, hotels in chain_groups.items():
        if len(hotels) < 3:  # Need at least 3 locations for comparison
            continue

        # Group by destination
        dest_prices = defaultdict(list)
        for h in hotels:
            dest = h["destination"]
            dest_prices[dest].append(h["price_total"])

        # Calculate median price per destination
        dest_medians = {dest: median(prices) for dest, prices in dest_prices.items()}

        if len(dest_medians) < 2:
            continue

        global_median = median(list(dest_medians.values()))
        if global_median <= 0:
            continue

        # Find destinations with extreme prices
        for h in hotels:
            dest = h["destination"]
            dest_med = dest_medians.get(dest, global_median)
            price = h["price_total"]
            ratio = price / global_median if global_median > 0 else 1

            if ratio < 0.4 or ratio > 2.5:  # 60% cheaper or 150% more expensive
                nights = calculate_nights(h.get("checkin", ""), h.get("checkout", ""))
                ppn = round(price / max(1, nights), 1)

                classification = "ERROR" if ratio < 0.4 else "ANOMALY"

                anomalies.append({
                    "type": "CHAIN_ANOMALY",
                    "classification": classification,
                    "hotel": h["name"],
                    "destination": dest,
                    "chain": chain,
                    "stars": h.get("stars", 0),
                    "score": h.get("score", 0),
                    "price_total": price,
                    "price_per_night": ppn,
                    "global_median": round(global_median),
                    "dest_median": round(dest_med),
                    "ratio": round(ratio, 2),
                    "pct_off": round((1 - ratio) * 100) if ratio < 1 else round((ratio - 1) * 100),
                    "nights": nights,
                    "link": h.get("link", ""),
                    "sea": h.get("sea", False),
                    "checkin": h.get("checkin", ""),
                    "checkout": h.get("checkout", ""),
                    "reason": (
                        f"🔗 {chain} - Anomalía de cadena: {price}€ en {dest} "
                        f"vs mediana global {global_median:.0f}€ ({(ratio-1)*100:.0f}%). "
                        f"Otros destinos: {round(dest_med)}€"
                    ),
                })

    return anomalies


# ═══════════════════════════════════════════════════════════
# ABSOLUTE PRICE ERROR DETECTION — Impossibly cheap prices
# ═══════════════════════════════════════════════════════════

# Expected MINIMUM price per night by star rating in peak summer (Jul-Aug)
# Anything below these thresholds is almost certainly a pricing error
SUMMER_MIN_PPN = {
    5: 120,   # 5★ hotel below 120€/n in summer = error
    4: 60,    # 4★ hotel below 60€/n in summer = error
    3: 35,    # 3★ hotel below 35€/n in summer = error
    2: 20,    # 2★ below 20€/n = error
    1: 15,
    0: 15,    # Unknown stars
}

# Absolute floor: ANY hotel below this is definitely an error
ABSOLUTE_FLOOR_PPN = 25  # No real hotel in Europe costs less than 25€/n in July

def detect_absolute_errors(all_hotels, summer_mode=True):
    """
    Detect pricing errors based on ABSOLUTE price thresholds.

    This catches the 30€/night 4★ hotel that the user found — these aren't
    statistical outliers (they might be the only hotel at that price),
    they're simply IMPOSSIBLE prices for the category.

    Logic:
    - 4★ beach hotel at 30€/night in July? → ERROR (should be 150-250€)
    - 3★ hotel at 15€/night? → ERROR (hostels cost more)
    - Any hotel below 25€/night in Europe summer? → ERROR

    Also flags "suspiciously cheap" (below 50% of expected minimum).
    """
    anomalies = []
    seen = set()

    for h in all_hotels:
        name = h.get("name", "")
        dest = h.get("destination", "")
        key = (dest, name, h.get("checkin", ""))
        if key in seen:
            continue
        seen.add(key)

        price = h.get("price_total", 0)
        stars = h.get("stars", 0)

        if price <= 0:
            continue

        nights = calculate_nights(h.get("checkin", ""), h.get("checkout", ""))
        ppn = price / max(1, nights)

        if ppn <= 0:
            continue

        min_expected = SUMMER_MIN_PPN.get(stars, 15) if summer_mode else SUMMER_MIN_PPN.get(stars, 15) * 0.6

        base_info = {
            "hotel": name,
            "destination": dest,
            "stars": stars,
            "score": h.get("score", 0),
            "review_count": h.get("review_count", 0),
            "price_total": price,
            "price_per_night": round(ppn, 1),
            "expected_min_ppn": min_expected,
            "nights": nights,
            "link": h.get("link", ""),
            "sea": h.get("sea", False),
            "beach_badge": h.get("beach_badge", False),
            "checkin": h.get("checkin", ""),
            "checkout": h.get("checkout", ""),
            "distance": h.get("distance", ""),
        }

        # TIER 1: Below absolute floor — definitely an error
        if ppn < ABSOLUTE_FLOOR_PPN:
            base_info["type"] = "ABSOLUTE_PRICE_ERROR"
            base_info["classification"] = "ERROR"
            base_info["ratio"] = round(ppn / min_expected, 3) if min_expected > 0 else 0
            base_info["pct_off"] = round((1 - ppn / min_expected) * 100) if min_expected > 0 else 0
            base_info["reason"] = (
                f"🚨🚨 PRECIO IMPOSIBLE: {ppn:.0f}€/noche para {stars}★ en {dest}. "
                f"Mínimo esperado: {min_expected}€/n. "
                f"¡Reservar INMEDIATAMENTE antes de que lo corrijan!"
            )
            anomalies.append(base_info)

        # TIER 2: Below category minimum — very likely an error
        elif ppn < min_expected:
            pct_below = (1 - ppn / min_expected) * 100
            base_info["type"] = "CATEGORY_PRICE_ERROR"
            base_info["classification"] = "ERROR" if pct_below > 40 else "ANOMALY"
            base_info["ratio"] = round(ppn / min_expected, 3)
            base_info["pct_off"] = round(pct_below)
            base_info["reason"] = (
                f"🚨 PRECIO SOSPECHOSO: {ppn:.0f}€/noche para {stars}★ en {dest}. "
                f"Mínimo esperado verano: {min_expected}€/n ({pct_below:.0f}% por debajo). "
                f"Posible error de configuración."
            )
            anomalies.append(base_info)

        # TIER 3: Below 50% of expected minimum — suspiciously cheap
        elif ppn < min_expected * 1.5 and stars >= 4:
            # Only flag 4-5★ hotels that are below 1.5x the minimum
            # (a 4★ at 80€/n when minimum is 60€ — not an error but worth watching)
            pass  # Don't flag these, they're just cheap

    return anomalies


# ═══════════════════════════════════════════════════════════
# VALUE SCORE RANKING — Find the best value hotels
# ═══════════════════════════════════════════════════════════

def rank_by_value(all_hotels, top_n=30, min_score=7.0, min_stars=4):
    """
    Calculate VALUE_SCORE for every hotel and return the top N.

    Formula: VALUE_SCORE = (review_score * 10 + stars * 50) / price_per_night
    Higher = better value. A 9.3-rated 4★ hotel at 50€/night scores:
    (9.3 * 10 + 4 * 50) / 50 = (93 + 200) / 50 = 5.86

    This finds hidden gems that aren't statistical outliers but offer
    incredible value — like the Manolo Beach Resort (9.0, 3★, 112€/n).
    """
    scored = []
    seen = set()

    for h in all_hotels:
        name = h.get("name", "")
        dest = h.get("destination", "")
        key = (dest, name)

        if key in seen:
            continue
        seen.add(key)

        price = h.get("price_total", 0)
        score = h.get("score", 0)
        stars = h.get("stars", 0)

        if price <= 0 or score < min_score:
            continue
        if min_stars > 0 and stars > 0 and stars < min_stars:
            continue

        nights = calculate_nights(h.get("checkin", ""), h.get("checkout", ""))
        ppn = price / max(1, nights)

        if ppn <= 0:
            continue

        # VALUE_SCORE formula: higher = better deal
        # Review score contributes raw quality, stars add prestige bonus
        value_score = (score * 10 + stars * 50) / ppn

        # Bonus for beachfront
        beach_bonus = 1.2 if h.get("sea", False) or h.get("beach_badge", False) else 1.0
        value_score *= beach_bonus

        scored.append({
            "hotel": name,
            "destination": dest,
            "stars": stars,
            "score": score,
            "review_count": h.get("review_count", 0),
            "price_total": price,
            "price_per_night": round(ppn, 1),
            "value_score": round(value_score, 2),
            "nights": nights,
            "link": h.get("link", ""),
            "sea": h.get("sea", False),
            "beach_badge": h.get("beach_badge", False),
            "checkin": h.get("checkin", ""),
            "checkout": h.get("checkout", ""),
            "distance": h.get("distance", ""),
            "original_price": h.get("original_price", 0),
            "discount_text": h.get("discount_text", ""),
        })

    # Sort by value score descending
    scored.sort(key=lambda x: x["value_score"], reverse=True)
    return scored[:top_n]


def rank_cheapest(all_hotels, top_n=30, min_score=7.0, min_stars=4):
    """
    Simply rank all hotels by price per night (cheapest first).
    Filters by minimum score and stars.
    Returns deduplicated list showing the absolute cheapest options.
    """
    scored = []
    seen = set()

    for h in all_hotels:
        name = h.get("name", "")
        dest = h.get("destination", "")
        key = (dest, name)
        if key in seen:
            continue
        seen.add(key)

        price = h.get("price_total", 0)
        score = h.get("score", 0)
        stars = h.get("stars", 0)

        if price <= 0:
            continue
        if min_score > 0 and score > 0 and score < min_score:
            continue
        if min_stars > 0 and stars > 0 and stars < min_stars:
            continue

        nights = calculate_nights(h.get("checkin", ""), h.get("checkout", ""))
        ppn = price / max(1, nights)

        scored.append({
            "hotel": name,
            "destination": dest,
            "stars": stars,
            "score": score,
            "review_count": h.get("review_count", 0),
            "price_total": price,
            "price_per_night": round(ppn, 1),
            "nights": nights,
            "link": h.get("link", ""),
            "sea": h.get("sea", False),
            "beach_badge": h.get("beach_badge", False),
            "checkin": h.get("checkin", ""),
            "checkout": h.get("checkout", ""),
            "distance": h.get("distance", ""),
        })

    scored.sort(key=lambda x: x["price_per_night"])
    return scored[:top_n]


# ═══════════════════════════════════════════════════════════
# MASTER ANALYZER
# ═══════════════════════════════════════════════════════════

def analyze_all(all_hotels, results_by_date=None, date_ranges=None, min_score=0,
                results_1adult=None, results_2adults=None,
                results_by_nights=None, results_by_currency=None,
                results_by_day=None, days_info=None,
                results_by_rooms=None, results_mobile=None):
    """Run all detection techniques, return deduplicated sorted anomalies"""
    all_anomalies = []

    if results_by_date and date_ranges:
        print("   🔍 T1: Outlier estadístico entre semanas (z-score + ratio)...")
        cross = detect_cross_date_errors(results_by_date, date_ranges, min_score)
        print(f"      → {len(cross)} anomalías")
        all_anomalies.extend(cross)

    if all_hotels:
        print("   🔍 T0: Detección de precios IMPOSIBLES (umbrales absolutos)...")
        absolute = detect_absolute_errors(all_hotels, summer_mode=True)
        print(f"      → {len(absolute)} errores absolutos")
        all_anomalies.extend(absolute)

        print("   🔍 T2: Outlier entre pares (mismas estrellas, mismo destino)...")
        peer = detect_peer_anomalies(all_hotels, min_score)
        print(f"      → {len(peer)} anomalías")
        all_anomalies.extend(peer)

        print("   🔍 T2b: Outliers por IQR (por destino, sin filtrar estrellas)...")
        iqr = detect_iqr_outliers(all_hotels)
        print(f"      → {len(iqr)} anomalías")
        all_anomalies.extend(iqr)

        print("   🔍 T2c: Anomalías de cadena hotelera (misma cadena, distintos destinos)...")
        chain = detect_chain_anomalies(all_hotels)
        print(f"      → {len(chain)} anomalías")
        all_anomalies.extend(chain)

    if results_1adult and results_2adults:
        print("   🔍 T3: Comparación simple vs doble (1 adulto vs 2 adultos)...")
        room = detect_room_type_errors(results_1adult, results_2adults, date_ranges, min_score)
        print(f"      → {len(room)} anomalías")
        all_anomalies.extend(room)

    if results_by_nights:
        print("   🔍 T4: Arbitraje de duración (7n vs 14n por noche)...")
        dur = detect_duration_errors(results_by_nights, min_score)
        print(f"      → {len(dur)} anomalías")
        all_anomalies.extend(dur)

    if results_by_currency:
        print("   🔍 T5: Arbitraje de moneda (EUR vs USD vs GBP)...")
        cur = detect_currency_errors(results_by_currency, min_score)
        print(f"      → {len(cur)} anomalías")
        all_anomalies.extend(cur)

    if results_by_day and days_info:
        print("   🔍 T6: Arbitraje día de check-in...")
        day = detect_checkin_day_errors(results_by_day, days_info, min_score)
        print(f"      → {len(day)} anomalías")
        all_anomalies.extend(day)

    if results_by_rooms:
        print("   🔍 T7: Comparación habitaciones (1 vs 2 vs 3 hab)...")
        rooms = detect_rooms_errors(results_by_rooms, min_score)
        print(f"      → {len(rooms)} anomalías")
        all_anomalies.extend(rooms)

    if results_mobile:
        print("   🔍 T9: Comparación desktop vs mobile...")
        mob = detect_mobile_errors(results_mobile, min_score)
        print(f"      → {len(mob)} anomalías")
        all_anomalies.extend(mob)

    # Deduplicate
    priority = {"ERROR": 0, "ANOMALY": 1, "DEAL": 2}
    seen = {}
    for a in all_anomalies:
        key = (a["destination"], a["hotel"], a.get("checkin", ""), a.get("type", ""))
        p = priority.get(a["classification"], 9)
        if key not in seen or p < priority.get(seen[key]["classification"], 9):
            seen[key] = a

    return sorted(seen.values(), key=lambda x: (priority.get(x["classification"], 9), x.get("ratio", 1)))
