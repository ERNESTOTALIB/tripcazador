"""
Caza real de hoteles baratos usando SerpAPI → Google Hotels.
Recorre destinos top del catálogo TripCazador y busca los más baratos
por noche en septiembre/octubre 2026.

Clasificación:
  < 30 €/noche  → 💥 ERROR_FARE
  < 50 €/noche  → 🔥 CHOLLO
  < 80 €/noche  → 🟢 OFERTA
  < 120 €/noche → 🟡 NORMAL
  ≥ 120         → 🔵 CARO
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
import requests


SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")
if not SERPAPI_KEY:
    print("❌ SERPAPI_KEY no está seteado")
    sys.exit(1)

# Destinos mezcla: clásicos hispanos + novedosos Caribe/Balcanes/Asia.
# Cada destino incluye país para desambiguar queries (evita que Google
# resuelva "Hoi An" como resort en Laughlin, Nevada, etc.)
DESTINATIONS = [
    ("Lisbon", "Portugal"),          ("Porto", "Portugal"),
    ("Madrid", "Spain"),             ("Barcelona", "Spain"),
    ("Rome", "Italy"),               ("Naples", "Italy"),
    ("Milan", "Italy"),              ("Venice", "Italy"),
    ("Athens", "Greece"),            ("Santorini", "Greece"),
    ("Crete", "Greece"),             ("Rhodes", "Greece"),
    ("Istanbul", "Turkey"),          ("Antalya", "Turkey"),
    ("Bodrum", "Turkey"),            ("Kas", "Turkey"),
    ("Tirana", "Albania"),           ("Sarajevo", "Bosnia and Herzegovina"),
    ("Belgrade", "Serbia"),          ("Sofia", "Bulgaria"),
    ("Kaunas", "Lithuania"),         ("Riga", "Latvia"),
    ("Tallinn", "Estonia"),          ("Budapest", "Hungary"),
    ("Cancun", "Mexico"),            ("Tulum", "Mexico"),
    ("Playa del Carmen", "Mexico"),  ("Mexico City", "Mexico"),
    ("Havana", "Cuba"),              ("Varadero", "Cuba"),
    ("Punta Cana", "Dominican Republic"), ("Santo Domingo", "Dominican Republic"),
    ("Cartagena", "Colombia"),       ("Medellin", "Colombia"),
    ("Lima", "Peru"),                ("Buenos Aires", "Argentina"),
    ("Marrakech", "Morocco"),        ("Essaouira", "Morocco"),
    ("Zanzibar", "Tanzania"),        ("Mauritius", "Mauritius"),
    ("Bali Ubud", "Indonesia"),      ("Bali Canggu", "Indonesia"),
    ("Phuket", "Thailand"),          ("Krabi", "Thailand"),
    ("Chiang Mai", "Thailand"),      ("Hoi An", "Vietnam"),
    ("Bangkok", "Thailand"),         ("Kuala Lumpur", "Malaysia"),
    ("Tokyo", "Japan"),              ("Kyoto", "Japan"),
    ("Osaka", "Japan"),              ("Hiroshima", "Japan"),
    ("Dubai", "UAE"),                ("Doha", "Qatar"),
    ("Muscat", "Oman"),
]


def search(destination: str, country: str, checkin: str, checkout: str, adults: int = 2):
    params = {
        "engine": "google_hotels",
        "q": f"hotels in {destination}, {country}",
        "check_in_date": checkin,
        "check_out_date": checkout,
        "adults": adults,
        "currency": "EUR",
        "hl": "en",
        "gl": "us",
        "api_key": SERPAPI_KEY,
    }
    try:
        r = requests.get("https://serpapi.com/search.json", params=params, timeout=30)
        if r.status_code != 200:
            return []
        d = r.json()
        return d.get("properties", []) or []
    except Exception:
        return []


def categorize(price_per_night: float) -> str:
    if price_per_night < 30:
        return "💥 ERROR_FARE"
    if price_per_night < 50:
        return "🔥 CHOLLO"
    if price_per_night < 80:
        return "🟢 OFERTA"
    if price_per_night < 120:
        return "🟡 NORMAL"
    return "🔵 CARO"


def nights_between(a: str, b: str) -> int:
    from datetime import date
    d1 = date.fromisoformat(a)
    d2 = date.fromisoformat(b)
    return (d2 - d1).days


def main() -> int:
    t0 = time.time()
    checkin = "2026-09-15"
    checkout = "2026-09-20"  # 5 noches
    nights = nights_between(checkin, checkout)

    all_properties = []
    from collections import defaultdict

    for dest, country in DESTINATIONS:
        tq = time.time()
        props = search(dest, country, checkin, checkout)
        count = 0
        for p in props:
            # Price puede venir como string "€80" o como número
            rate = p.get("rate_per_night", {}) or {}
            per_night = rate.get("extracted_lowest")
            if per_night is None:
                total = (p.get("total_rate") or {}).get("extracted_lowest")
                if total:
                    per_night = total / nights
            if per_night is None:
                continue
            all_properties.append({
                "destination": dest,
                "country": country,
                "name": p.get("name", ""),
                "type": p.get("type", ""),
                "rating": p.get("overall_rating"),
                "reviews": p.get("reviews"),
                "price_per_night_eur": round(per_night, 2),
                "total_eur": round(per_night * nights, 2),
                "check_in": checkin,
                "check_out": checkout,
                "link": p.get("link"),
                "hotel_class": p.get("hotel_class"),
            })
            count += 1
        print(f"  [{dest:<20}] {count:3} hoteles ({time.time()-tq:.1f}s)", flush=True)
        time.sleep(0.2)

    all_properties.sort(key=lambda x: x["price_per_night_eur"])
    elapsed = time.time() - t0
    print(f"\n─ Escaneo hoteles: {elapsed:.1f}s, {len(all_properties)} hoteles reales ─")

    buckets = defaultdict(int)
    for p in all_properties:
        buckets[categorize(p["price_per_night_eur"])] += 1
    print("\nDistribución:")
    for cat in ("💥 ERROR_FARE", "🔥 CHOLLO", "🟢 OFERTA", "🟡 NORMAL", "🔵 CARO"):
        print(f"  {cat}: {buckets[cat]}")

    # Google Hotels usa escala 1-5, así que umbral 4.0 = muy bueno (~80/100)
    quality = [p for p in all_properties if (p.get("rating") or 0) >= 4.0]
    top_quality = quality[:50]

    print("\n🏆 TOP 30 hoteles ≥4.0★ (Google) más baratos (por noche, 2 adultos, 5n):")
    for p in top_quality[:30]:
        print(f"  €{p['price_per_night_eur']:>6.0f}/n  {p['destination']:<18} "
              f"{p['rating']}★  {p['name'][:50]}")

    # Guardar
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out_dir = Path("/sessions/laughing-modest-bohr/mnt/Viajes/chollos_reales_20260420")
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / f"hoteles_real_{ts}.json"
    with open(json_path, "w") as fh:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "source": "SerpAPI → Google Hotels",
            "check_in": checkin,
            "check_out": checkout,
            "nights": nights,
            "destinations_scanned": len(DESTINATIONS),
            "total_hotels": len(all_properties),
            "top_50_quality": top_quality[:50],
            "all_buckets": dict(buckets),
            "all_properties": all_properties,
        }, fh, indent=2, ensure_ascii=False)
    print(f"\n✅ JSON: {json_path}")

    # Markdown
    md_path = out_dir / f"hoteles_real_{ts}.md"
    with open(md_path, "w") as fh:
        fh.write("# Caza real de hoteles — Top 50 chollos ≥8.0★\n\n")
        fh.write(f"- Escaneo: **{datetime.now().strftime('%Y-%m-%d %H:%M')}**\n")
        fh.write(f"- Fuente: SerpAPI → Google Hotels (precios reales)\n")
        fh.write(f"- Fechas: **{checkin} → {checkout}** ({nights} noches, 2 adultos)\n")
        fh.write(f"- Destinos escaneados: **{len(DESTINATIONS)}**\n")
        fh.write(f"- Hoteles únicos con precio: **{len(all_properties)}**\n\n")

        fh.write("## Distribución por categoría (todos los hoteles)\n\n")
        fh.write("| Categoría | Nº |\n|---|---:|\n")
        for cat in ("💥 ERROR_FARE", "🔥 CHOLLO", "🟢 OFERTA", "🟡 NORMAL", "🔵 CARO"):
            fh.write(f"| {cat} | {buckets[cat]} |\n")

        fh.write("\n## TOP 50 hoteles ≥4.0★ (Google) más baratos (€/noche, 2 adultos)\n\n")
        fh.write("| # | €/noche | Destino | Nombre | ★ | Reseñas | Clase |\n")
        fh.write("|---:|---:|---|---|---:|---:|---:|\n")
        for i, p in enumerate(top_quality[:50], 1):
            name = p["name"][:60]
            rating = p.get("rating", "?")
            reviews = p.get("reviews", "?")
            cls = p.get("hotel_class") or ""
            fh.write(f"| {i} | €{p['price_per_night_eur']:.0f} | {p['destination']} | {name} | {rating} | {reviews} | {cls} |\n")

    print(f"✅ Markdown: {md_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
