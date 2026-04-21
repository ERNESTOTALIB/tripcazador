"""
Caza real, grande, de precios Ryanair (público, sin API key).
Escaneo de todos los hubs fuertes Ryanair + los nuevos del catálogo.
Exporta los top 100 más baratos a JSON + tabla Markdown lista para pegar.
"""

import json
import sys
import time
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from ryanair import Ryanair


# Todos los hubs + nuevos del catálogo. El SDK ignora orígenes sin base Ryanair.
ORIGINS = [
    # España
    "MAD", "BCN", "VLC", "AGP", "SVQ", "PMI", "ACE", "TFN", "IBZ", "BIO", "SCQ",
    # Portugal
    "LIS", "OPO", "FAO",
    # Irlanda + UK
    "DUB", "ORK", "SNN", "STN", "LTN", "BRS", "MAN", "EDI", "BHX", "LBA", "EMA", "BFS", "LPL", "BOH",
    # Italia
    "CIA", "BGY", "PSA", "BRI", "NAP", "CTA", "PMO", "CAG", "TRN", "TSF",
    # Francia
    "BVA", "MRS", "LYS", "NCE", "NTE", "TLS", "BOD", "MPL",
    # Alemania
    "HAM", "BER", "CGN", "FRA", "STR", "HHN", "FKB", "NUE", "DTM",
    # Centroeuropa
    "BSL", "SXB", "LUX", "ZRH", "GVA",
    # BeNeLux
    "AMS", "EIN", "CRL", "BRU",
    # Europa del Este
    "WAW", "KRK", "WRO", "GDN", "POZ",
    "BUD", "DEB",
    "PRG", "BRQ", "OSR",
    "ATH", "SKG", "CHQ", "HER", "ZTH", "KGS", "CFU",
    "SOF", "VAR", "BOJ",
    "OTP", "CLJ", "TSR",
    "IST", "SAW", "ADB", "ESB", "DLM", "AYT",
    # Nuevos del catálogo — bases secundarias
    "KUN", "PLQ",   # Lituania
    "RIX",          # Letonia
    "TLL",          # Estonia
    "SKP", "TGD", "TIA", "SJJ", "PRN", "CHQ",
]


def categorize(price: float) -> str:
    if price < 15:
        return "💥 ERROR_FARE_CANDIDATE"
    if price < 20:
        return "🔥 CRÍTICO"
    if price < 30:
        return "🟢 CHOLLO"
    if price < 40:
        return "🟡 OFERTA"
    return "🔵 NORMAL"


def main() -> int:
    api = Ryanair(currency="EUR")
    date_from = date(2026, 7, 1)
    date_to = date(2026, 9, 15)

    all_flights = []
    per_origin = {}
    errors = []
    t_total = time.time()

    for origin in sorted(set(ORIGINS)):
        t0 = time.time()
        try:
            flights = api.get_cheapest_flights(origin, date_from, date_to)
            per_origin[origin] = len(flights)
            for f in flights:
                all_flights.append({
                    "origin": f.origin,
                    "destination": f.destination,
                    "destinationFull": f.destinationFull,
                    "price": float(f.price),
                    "currency": f.currency,
                    "departureTime": f.departureTime.isoformat(),
                })
            if len(flights):
                print(f"  [{origin:3}] {len(flights):3} ({time.time()-t0:.1f}s)", flush=True)
        except Exception as e:
            errors.append((origin, str(e)[:60]))

    all_flights.sort(key=lambda x: x["price"])
    elapsed = time.time() - t_total
    print(f"\n─ Escaneo completado en {elapsed:.1f}s — {len(all_flights)} vuelos reales ─")

    # Buckets por categoría
    buckets = defaultdict(int)
    for f in all_flights:
        buckets[categorize(f["price"])] += 1
    print("\nDistribución por categoría:")
    for cat in ("💥 ERROR_FARE_CANDIDATE", "🔥 CRÍTICO", "🟢 CHOLLO", "🟡 OFERTA", "🔵 NORMAL"):
        print(f"  {cat}: {buckets[cat]}")

    # TOP 50
    top = all_flights[:50]
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out_dir = Path("/sessions/laughing-modest-bohr/mnt/Viajes/chollos_reales_20260420")
    out_dir.mkdir(parents=True, exist_ok=True)

    # JSON con todo
    json_path = out_dir / f"ryanair_real_{ts}.json"
    with open(json_path, "w") as fh:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "source": "ryanair public API (unauthenticated)",
            "date_range": [date_from.isoformat(), date_to.isoformat()],
            "origins_scanned": len(ORIGINS),
            "origins_with_data": len(per_origin),
            "total_flights": len(all_flights),
            "top50_cheapest": top,
            "per_origin_counts": per_origin,
            "errors": errors[:20],
            "category_buckets": dict(buckets),
        }, fh, indent=2, ensure_ascii=False)
    print(f"\n✅ JSON: {json_path}")

    # Markdown pegable
    md_path = out_dir / f"ryanair_real_{ts}.md"
    with open(md_path, "w") as fh:
        fh.write("# Caza real Ryanair — Top 50 chollos\n\n")
        fh.write(f"- Fecha escaneo: **{datetime.now().strftime('%Y-%m-%d %H:%M')}**\n")
        fh.write(f"- Ventana de viaje: **{date_from} → {date_to}**\n")
        fh.write(f"- Orígenes consultados: **{len(ORIGINS)}**\n")
        fh.write(f"- Orígenes con vuelos: **{len(per_origin)}**\n")
        fh.write(f"- Total vuelos encontrados: **{len(all_flights)}**\n\n")

        fh.write("## Distribución por categoría\n\n")
        fh.write("| Categoría | Nº vuelos |\n|---|---:|\n")
        for cat in ("💥 ERROR_FARE_CANDIDATE", "🔥 CRÍTICO", "🟢 CHOLLO", "🟡 OFERTA", "🔵 NORMAL"):
            fh.write(f"| {cat} | {buckets[cat]} |\n")

        fh.write("\n## TOP 50 vuelos más baratos (one-way, real)\n\n")
        fh.write("| # | Precio | Ruta | Fecha | Destino |\n|---:|---:|---|---|---|\n")
        for i, f in enumerate(top, 1):
            dep = f["departureTime"][:16].replace("T", " ")
            full = f.get("destinationFull") or ""
            fh.write(f"| {i} | €{f['price']:.2f} | {f['origin']}→{f['destination']} | {dep} | {full} |\n")

    print(f"✅ Markdown: {md_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
