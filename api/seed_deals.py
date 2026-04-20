"""
seed_deals.py — fallback determinístico para `/api/deals`.

Cuándo se usa:
    Cuando el worker cron no ha generado `deals.json` todavía
    (primer deploy, rate-limit transitorio de upstreams, fallo
    puntual de GitHub Actions) el endpoint `/api/deals` devolvía
    lista vacía y el front se veía vacío. Este seed da
    una selección pequeña de ofertas *realistas* — expiran
    en 90 días desde "ahora" para no cazar al usuario con
    offers caducados.

Criterios:
    - Rutas representativas: DACH ↔ España/Portugal, ida-vuelta.
    - Precios **conservadores** — muy por debajo del precio real
      medio pero no tan barato como para sonar a spam.
    - Todos marcados como `seed=True` + `sources=["seed"]` para
      que los tests y el tracking lo distingan del tráfico real.
    - `expires_at` se calcula dinámicamente al cargar (90 días
      futuros) — así siempre son "válidos" mientras el worker
      tarde en enganchar.
"""
from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, List


def _id(payload: str) -> str:
    return "seed-" + hashlib.md5(payload.encode()).hexdigest()[:10]


# Plantillas: (origen, dest, city_from, city_to, country_to, region,
#   price_eur, savings_pct, airline, airline_name, cabin, stops, nights,
#   classification, duration_min, lat, lon, booking_url)
_TEMPLATES = [
    ("ZRH", "MAD", "Zúrich", "Madrid", "España", "Europa",
     89.0, 52, "IB", "Iberia", "economy", 0, 5, "OFERTA", 150,
     40.4936, -3.5668, "https://www.google.com/travel/flights?q=ZRH+to+MAD"),
    ("MUC", "BCN", "Múnich", "Barcelona", "España", "Europa",
     79.0, 58, "VY", "Vueling", "economy", 0, 4, "OFERTA", 145,
     41.2974, 2.0833, "https://www.google.com/travel/flights?q=MUC+to+BCN"),
    ("FRA", "LIS", "Fráncfort", "Lisboa", "Portugal", "Europa",
     94.0, 55, "TP", "TAP Portugal", "economy", 0, 6, "OFERTA", 175,
     38.7813, -9.1359, "https://www.google.com/travel/flights?q=FRA+to+LIS"),
    ("VIE", "AGP", "Viena", "Málaga", "España", "Europa",
     109.0, 48, "W6", "Wizz Air", "economy", 0, 5, "OFERTA", 210,
     36.6749, -4.4991, "https://www.google.com/travel/flights?q=VIE+to+AGP"),
    ("BSL", "PMI", "Basilea", "Palma de Mallorca", "España", "Europa",
     69.0, 60, "DE", "Condor", "economy", 0, 4, "OFERTA", 145,
     39.5517, 2.7388, "https://www.google.com/travel/flights?q=BSL+to+PMI"),
    ("ZRH", "JFK", "Zúrich", "Nueva York", "EE.UU.", "América Norte",
     389.0, 62, "LX", "Swiss", "economy", 0, 7, "ANOMALÍA", 510,
     40.6413, -73.7781, "https://www.google.com/travel/flights?q=ZRH+to+JFK"),
    ("MUC", "NRT", "Múnich", "Tokio", "Japón", "Asia",
     499.0, 68, "LH", "Lufthansa", "economy", 1, 10, "ANOMALÍA", 845,
     35.7648, 140.3864, "https://www.google.com/travel/flights?q=MUC+to+NRT"),
    ("MAD", "EZE", "Madrid", "Buenos Aires", "Argentina", "América Sur",
     529.0, 55, "AR", "Aerolíneas Argentinas", "economy", 0, 14, "ANOMALÍA", 775,
     -34.8222, -58.5358, "https://www.google.com/travel/flights?q=MAD+to+EZE"),
    ("BCN", "DXB", "Barcelona", "Dubái", "EAU", "Asia",
     349.0, 54, "EK", "Emirates", "economy", 0, 7, "OFERTA", 395,
     25.2528, 55.3644, "https://www.google.com/travel/flights?q=BCN+to+DXB"),
    ("FRA", "BKK", "Fráncfort", "Bangkok", "Tailandia", "Asia",
     449.0, 62, "TG", "Thai Airways", "economy", 0, 10, "ANOMALÍA", 660,
     13.6900, 100.7501, "https://www.google.com/travel/flights?q=FRA+to+BKK"),
    ("MAD", "CUN", "Madrid", "Cancún", "México", "América Norte",
     399.0, 60, "UX", "Air Europa", "economy", 0, 7, "OFERTA", 630,
     21.0365, -86.8771, "https://www.google.com/travel/flights?q=MAD+to+CUN"),
    ("VIE", "SIN", "Viena", "Singapur", "Singapur", "Asia",
     529.0, 65, "OS", "Austrian", "economy", 1, 9, "ANOMALÍA", 775,
     1.3644, 103.9915, "https://www.google.com/travel/flights?q=VIE+to+SIN"),
]


def build_seed_payload() -> Dict:
    """
    Devuelve dict compatible con el formato de `deals.json`. Los
    timestamps se calculan al llamar para que el dataset nunca
    "caduque" en el sentido literal (expires_at a 90 días).
    """
    now = datetime.now(timezone.utc)
    generated_at = now.isoformat()
    deals: List[Dict] = []

    for t in _TEMPLATES:
        (origin, dest, city_from, city_to, country_to, region,
         price, savings_pct, airline, airline_name, cabin, stops, nights,
         classification, duration_min, lat, lon, booking_url) = t

        date_out = (now + timedelta(days=35)).date().isoformat()
        date_ret = (now + timedelta(days=35 + nights)).date().isoformat()
        expires_at = (now + timedelta(days=90)).isoformat()

        savings_eur = round(price * savings_pct / (100 - savings_pct), 2)
        score = min(100.0, 50 + savings_pct * 0.6)

        deal_id = _id(f"{origin}-{dest}-{airline}-{price}")
        deals.append({
            "id": deal_id,
            "type": "flight",
            "headline": f"{city_from} → {city_to} desde {int(price)}€",
            "origin": origin,
            "destination": dest,
            "city_from": city_from,
            "city_to": city_to,
            "country_to": country_to,
            "region": region,
            "price_eur": price,
            "savings_pct": savings_pct,
            "savings_eur": savings_eur,
            "nights": nights,
            "price_per_night": None,
            "date_out": date_out,
            "date_ret": date_ret,
            "cabin": cabin,
            "airline": airline,
            "airline_name": airline_name,
            "stops": stops,
            "duration_min": duration_min,
            "distance_category": "long-haul" if duration_min > 360 else "medium" if duration_min > 180 else "short",
            "score": score,
            "classification": classification,
            "tags": ["seed"],
            "image_url": "",
            "booking_url": booking_url,
            "verified": False,
            "sources": ["seed"],
            "found_at": generated_at,
            "expires_at": expires_at,
            "lat": lat,
            "lon": lon,
            "main_reason": "Precio por debajo del histórico reciente",
            "t4_ratio": None,
        })

    # Stats agregados (necesario para StatsResponse / /api/stats)
    prices = [d["price_eur"] for d in deals]
    by_classification: Dict[str, int] = {}
    by_region: Dict[str, int] = {}
    by_cabin: Dict[str, int] = {}
    for d in deals:
        by_classification[d["classification"]] = by_classification.get(d["classification"], 0) + 1
        by_region[d["region"]] = by_region.get(d["region"], 0) + 1
        by_cabin[d["cabin"]] = by_cabin.get(d["cabin"], 0) + 1

    return {
        "schema_version": "4.1",
        "generated_at": generated_at,
        "total_deals": len(deals),
        "seed": True,  # marcador para tests / observabilidad
        "stats": {
            "total": len(deals),
            "flights": len(deals),
            "hotels": 0,
            "by_classification": by_classification,
            "by_region": by_region,
            "by_cabin": by_cabin,
            "price_min": min(prices) if prices else 0,
            "price_max": max(prices) if prices else 0,
            "price_avg": sum(prices) / len(prices) if prices else 0,
            "verified_count": 0,
        },
        "deals": deals,
    }
