"""
Caza real de Business Class a precio reducido.
Travelpayouts /aviasales/v3/prices_for_dates con trip_class=1.

Ratio vs. tarifa típica Business:
  < 1500 €  → ERROR_FARE_CANDIDATE (típico MAD→NRT business = 3k-5k €)
  < 2500 €  → CHOLLO HISTÓRICO
  < 3500 €  → OFERTA
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
import requests


TOKEN = os.environ.get("TRAVELPAYOUTS_TOKEN", "")
if not TOKEN:
    print("❌ TRAVELPAYOUTS_TOKEN no está seteado")
    sys.exit(1)

BASE = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"

# Hubs principales europeos (mayoría con conexiones long-haul business)
ORIGINS = ["MAD", "BCN", "LIS", "CDG", "FRA", "LHR", "AMS", "MUC", "FCO", "ZRH"]

# Destinos de long-haul donde el arbitraje business/economy compensa
DESTS = [
    "NRT", "HND", "ICN", "HKG", "PEK", "PVG",   # Este asiático
    "SIN", "BKK", "KUL", "DPS", "MNL",             # Sudeste asiático
    "JFK", "LAX", "MIA", "SFO", "YYZ", "ORD",     # Norteamérica
    "DXB", "DOH", "AUH",                           # Golfo
    "SYD", "MEL", "AKL",                           # Oceanía
    "GRU", "EZE", "SCL", "LIM", "BOG",             # Sudamérica
    "CPT", "JNB", "NBO",                           # África
    "MLE", "SEZ",                                   # Maldivas / Seychelles
]


def fetch(origin: str, dest: str, depart_month: str, return_month: str):
    params = {
        "origin": origin,
        "destination": dest,
        "departure_at": depart_month,
        "return_at": return_month,
        "trip_class": 1,        # 1 = business
        "currency": "eur",
        "limit": 5,
        "sorting": "price",
        "token": TOKEN,
    }
    try:
        r = requests.get(BASE, params=params, timeout=15)
        if r.status_code != 200:
            return []
        d = r.json()
        if not d.get("success"):
            return []
        return d.get("data", []) or []
    except Exception:
        return []


def categorize(price: float) -> str:
    if price < 1200:
        return "💥 ERROR_FARE_BUSINESS"
    if price < 1800:
        return "🔥 CHOLLO_HISTÓRICO"
    if price < 2800:
        return "🟢 OFERTA_BUENA"
    return "🔵 NORMAL"


def main() -> int:
    t0 = time.time()
    all_flights = []
    attempts = 0
    hits = 0

    # Ventanas de búsqueda: otoño 2026 + primavera 2027
    windows = [
        ("2026-09", "2026-10"),
        ("2026-10", "2026-11"),
        ("2027-02", "2027-03"),
        ("2027-03", "2027-04"),
    ]

    for depart, ret in windows:
        for origin in ORIGINS:
            for dest in DESTS:
                attempts += 1
                flights = fetch(origin, dest, depart, ret)
                if flights:
                    hits += 1
                    for f in flights:
                        f["_window"] = f"{depart} → {ret}"
                        all_flights.append(f)
                # Pequeño delay para ser buenos ciudadanos
                time.sleep(0.05)
        print(f"  Ventana {depart}→{ret}: {attempts} intentos, {hits} rutas con data, {len(all_flights)} vuelos acumulados", flush=True)

    all_flights.sort(key=lambda f: f["price"])
    print(f"\n─ Escaneo Business completado en {time.time()-t0:.1f}s ─")
    print(f"   Rutas con data: {hits}/{attempts}")
    print(f"   Total vuelos Business: {len(all_flights)}")

    from collections import defaultdict
    buckets = defaultdict(int)
    for f in all_flights:
        buckets[categorize(f["price"])] += 1
    print("\nDistribución:")
    for cat in ("💥 ERROR_FARE_BUSINESS", "🔥 CHOLLO_HISTÓRICO", "🟢 OFERTA_BUENA", "🔵 NORMAL"):
        print(f"  {cat}: {buckets[cat]}")

    # TOP 30
    top = all_flights[:30]
    print("\n🏆 TOP 30 Business más baratos (return, precios reales):")
    for f in top:
        dep = f.get("departure_at", "")[:10]
        ret = f.get("return_at", "")[:10]
        print(f"  €{f['price']:>6}  {f['origin']}→{f['destination']}  "
              f"{dep} → {ret}  [{f.get('airline')} vía {f.get('gate','')}]")

    # Guardar
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out_dir = Path("/sessions/laughing-modest-bohr/mnt/Viajes/chollos_reales_20260420")
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / f"business_real_{ts}.json"
    with open(json_path, "w") as fh:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "source": "Travelpayouts /aviasales/v3/prices_for_dates (trip_class=1)",
            "total_flights": len(all_flights),
            "top30": top,
            "category_buckets": dict(buckets),
        }, fh, indent=2, ensure_ascii=False)
    print(f"\n✅ JSON: {json_path}")

    # Markdown
    md_path = out_dir / f"business_real_{ts}.md"
    with open(md_path, "w") as fh:
        fh.write("# Caza real Business Class — Top 30 chollos\n\n")
        fh.write(f"- Escaneo: **{datetime.now().strftime('%Y-%m-%d %H:%M')}**\n")
        fh.write(f"- Fuente: Travelpayouts/Aviasales real-time (trip_class=1)\n")
        fh.write(f"- Total Business encontrados: **{len(all_flights)}**\n")
        fh.write(f"- Rutas consultadas: {attempts} (ventana otoño 2026 + primavera 2027)\n\n")

        fh.write("## Distribución\n\n| Categoría | Nº |\n|---|---:|\n")
        for cat in ("💥 ERROR_FARE_BUSINESS", "🔥 CHOLLO_HISTÓRICO", "🟢 OFERTA_BUENA", "🔵 NORMAL"):
            fh.write(f"| {cat} | {buckets[cat]} |\n")

        fh.write("\n## TOP 30 Business Class más baratos (ida+vuelta, EUR)\n\n")
        fh.write("| # | Precio | Ruta | Salida | Vuelta | Aerolínea | Gate |\n|---:|---:|---|---|---|---|---|\n")
        for i, f in enumerate(top, 1):
            dep = f.get("departure_at", "")[:10]
            ret = f.get("return_at", "")[:10]
            fh.write(f"| {i} | €{f['price']} | {f['origin']}→{f['destination']} | {dep} | {ret} | {f.get('airline','')} | {f.get('gate','')} |\n")

    print(f"✅ Markdown: {md_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
