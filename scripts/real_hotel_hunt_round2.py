"""
Hotel hunt ronda 2 — destinos distintos de ronda 1 para ampliar cobertura.
Usa la query fix localizada ("hotels in {city}, {country}") para evitar
colisiones con topónimos US (Hoi An → Laughlin, Nevada).

Ventana: fin de año 2026 (27-dic → 3-ene 2027) — high season, alto contraste
con la ronda 1 (mid-sep, baja/media temporada).
"""

import json
import os
import sys
import time
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
import requests


SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")
if not SERPAPI_KEY:
    print("❌ SERPAPI_KEY no está seteado")
    sys.exit(1)


# Destinos NUEVOS — sin solapamiento con ronda 1.
DESTINATIONS = [
    # Europa occidental — Navidad/Nochevieja premium
    ("Paris", "France"),              ("Vienna", "Austria"),
    ("Prague", "Czech Republic"),     ("Salzburg", "Austria"),
    ("Reykjavik", "Iceland"),         ("Copenhagen", "Denmark"),
    ("Stockholm", "Sweden"),          ("Oslo", "Norway"),
    ("Amsterdam", "Netherlands"),     ("Brussels", "Belgium"),
    ("Edinburgh", "Scotland"),        ("Dublin", "Ireland"),
    # Sol de invierno — Canarias, Madeira, Andalucía
    ("Tenerife", "Spain"),            ("Gran Canaria", "Spain"),
    ("Lanzarote", "Spain"),           ("Fuerteventura", "Spain"),
    ("Madeira", "Portugal"),          ("Malaga", "Spain"),
    # Caribe alto contraste
    ("Nassau", "Bahamas"),            ("Montego Bay", "Jamaica"),
    ("Aruba", "Aruba"),               ("Curacao", "Curacao"),
    ("San Juan", "Puerto Rico"),
    # Sudamérica — verano austral
    ("Rio de Janeiro", "Brazil"),     ("Salvador", "Brazil"),
    ("Santiago", "Chile"),            ("Valparaiso", "Chile"),
    ("Cusco", "Peru"),                ("Quito", "Ecuador"),
    ("Montevideo", "Uruguay"),
    # Asia — invierno seco / Año Nuevo Lunar
    ("Singapore", "Singapore"),       ("Hong Kong", "Hong Kong"),
    ("Seoul", "South Korea"),         ("Taipei", "Taiwan"),
    ("Kyoto", "Japan"),               ("Tokyo", "Japan"),
    ("Hanoi", "Vietnam"),             ("Ho Chi Minh City", "Vietnam"),
    ("Luang Prabang", "Laos"),        ("Siem Reap", "Cambodia"),
    ("Yangon", "Myanmar"),            ("Colombo", "Sri Lanka"),
    ("Kathmandu", "Nepal"),           ("Delhi", "India"),
    ("Jaipur", "India"),              ("Goa", "India"),
    # Oriente Medio + Norte África invierno
    ("Petra", "Jordan"),              ("Amman", "Jordan"),
    ("Luxor", "Egypt"),               ("Cairo", "Egypt"),
    ("Sharm El Sheikh", "Egypt"),     ("Fes", "Morocco"),
    # Oceanía
    ("Sydney", "Australia"),          ("Melbourne", "Australia"),
    ("Auckland", "New Zealand"),      ("Queenstown", "New Zealand"),
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
            return [], f"HTTP {r.status_code}"
        d = r.json()
        return d.get("properties", []) or [], None
    except Exception as e:
        return [], f"{type(e).__name__}: {e}"


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


def main() -> int:
    t0 = time.time()
    checkin = "2026-12-27"
    checkout = "2027-01-03"  # 7 noches
    from datetime import date as _d
    nights = (_d.fromisoformat(checkout) - _d.fromisoformat(checkin)).days

    all_properties = []
    errors = []

    for dest, country in DESTINATIONS:
        tq = time.time()
        props, err = search(dest, country, checkin, checkout)
        if err:
            errors.append({"destination": dest, "error": err})
        count = 0
        for p in props:
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
        print(f"  [{dest:<22}] {count:3} hoteles ({time.time()-tq:.1f}s)", flush=True)
        time.sleep(0.2)

    all_properties.sort(key=lambda x: x["price_per_night_eur"])
    elapsed = time.time() - t0

    buckets = defaultdict(int)
    for p in all_properties:
        buckets[categorize(p["price_per_night_eur"])] += 1

    print(f"\n─ Escaneo hoteles ronda 2 (Navidad/Año Nuevo): {elapsed:.1f}s ─")
    print(f"  Destinos escaneados: {len(DESTINATIONS)}")
    print(f"  Errores: {len(errors)}")
    print(f"  Propiedades totales: {len(all_properties)}")
    for cat in ("💥 ERROR_FARE", "🔥 CHOLLO", "🟢 OFERTA", "🟡 NORMAL", "🔵 CARO"):
        print(f"  {cat}: {buckets[cat]}")

    # ≥4.0★ quality top
    quality = [p for p in all_properties if (p.get("rating") or 0) >= 4.0]

    print("\n🏆 TOP 30 hoteles ≥4.0★ más baratos (Navidad-Año Nuevo):")
    for p in quality[:30]:
        print(f"  €{p['price_per_night_eur']:>6.0f}/n  {p['destination']:<22} "
              f"{p['rating']}★  {p['name'][:45]}")

    # Save
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out_dir = Path("/sessions/laughing-modest-bohr/mnt/Viajes/chollos_reales_20260420")
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / f"hoteles_navidad_{ts}.json"
    with open(json_path, "w") as fh:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "window": {"checkin": checkin, "checkout": checkout, "nights": nights},
            "destinations_scanned": len(DESTINATIONS),
            "errors": errors,
            "total_hotels": len(all_properties),
            "top_50_quality": quality[:50],
            "all_buckets": dict(buckets),
            "all_properties": all_properties,
        }, fh, indent=2, ensure_ascii=False)
    print(f"\n✅ JSON: {json_path}")

    # Markdown
    md_path = out_dir / f"hoteles_navidad_{ts}.md"
    with open(md_path, "w") as fh:
        fh.write("# Caza hotelera ronda 2 — Navidad/Año Nuevo 2026-27\n\n")
        fh.write(f"- Escaneo: **{datetime.now().strftime('%Y-%m-%d %H:%M')}**\n")
        fh.write(f"- Fuente: SerpAPI → Google Hotels (query localizada)\n")
        fh.write(f"- Fechas: **{checkin} → {checkout}** ({nights} noches, 2 adultos)\n")
        fh.write(f"- Destinos escaneados: **{len(DESTINATIONS)}**\n")
        fh.write(f"- Hoteles con precio: **{len(all_properties)}**\n")
        fh.write(f"- Errores: **{len(errors)}**\n\n")
        fh.write("## Distribución\n\n| Categoría | Nº |\n|---|---:|\n")
        for cat in ("💥 ERROR_FARE", "🔥 CHOLLO", "🟢 OFERTA", "🟡 NORMAL", "🔵 CARO"):
            fh.write(f"| {cat} | {buckets[cat]} |\n")
        fh.write("\n## TOP 50 ≥4.0★ más baratos\n\n")
        fh.write("| # | €/noche | Destino | País | Hotel | ★ | Reseñas |\n")
        fh.write("|---:|---:|---|---|---|---:|---:|\n")
        for i, p in enumerate(quality[:50], 1):
            fh.write(f"| {i} | €{p['price_per_night_eur']:.0f} | {p['destination']} | "
                     f"{p['country']} | {p['name'][:50]} | {p.get('rating','?')} | "
                     f"{p.get('reviews','?')} |\n")

    print(f"✅ Markdown: {md_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
