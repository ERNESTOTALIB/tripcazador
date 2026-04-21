"""
Ronda 2: Caza Ryanair en invierno 2026-27 (nov→mar).
Distinta ventana que la primera pasada → debería aflorar otros patrones
(vuelos escuela, escapadas a sol de invierno, polar Express).

Clasificación idéntica a ronda 1 para poder comparar.
"""

import json
import sys
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from ryanair import Ryanair


ORIGINS = [
    # Mix de hubs fuertes + outliers — 60 orígenes, enfoque invierno.
    "MAD", "BCN", "VLC", "AGP", "SVQ", "PMI", "ACE", "TFN", "IBZ", "BIO",
    "LIS", "OPO", "FAO",
    "DUB", "STN", "LTN", "MAN", "EDI", "BHX",
    "CIA", "BGY", "PSA", "BRI", "NAP", "CTA", "PMO",
    "BVA", "MRS", "NCE", "TLS",
    "HAM", "BER", "CGN", "HHN",
    "BSL", "ZRH",
    "AMS", "EIN", "CRL", "BRU",
    "WAW", "KRK", "GDN", "BUD", "PRG",
    "ATH", "SKG", "CFU",
    "SOF", "OTP", "BEG", "TIA",
    "KUN", "VNO", "RIX", "TLL", "HEL",
    "ARN", "GOT", "OSL", "CPH", "BLL",
    "MLA", "FAO",
]


def main() -> int:
    t0 = time.time()
    ryanair = Ryanair(currency="EUR")

    # Ventana invierno: 2026-11-01 → 2027-03-31 (153 días)
    start = date(2026, 11, 1)
    end = date(2027, 3, 31)

    all_flights = []
    origins_with_data = 0

    for origin in ORIGINS:
        tq = time.time()
        try:
            flights = ryanair.get_cheapest_flights(
                origin, start.isoformat(), end.isoformat(),
            )
        except Exception as e:
            print(f"  [{origin}] skip ({type(e).__name__}: {str(e)[:40]})")
            continue
        if flights:
            origins_with_data += 1
        for f in flights:
            # f es NamedTuple con atributos price, departureTime, origin, destination, currency, flightNumber
            all_flights.append({
                "origin": f.origin,
                "destination": f.destination,
                "destination_full": getattr(f, "destinationFull", "") or "",
                "price_eur": round(float(f.price), 2),
                "departure": str(f.departureTime),
                "flight_number": getattr(f, "flightNumber", ""),
            })
        print(f"  [{origin}] {len(flights):3} vuelos ({time.time()-tq:.1f}s)", flush=True)
        time.sleep(0.1)

    all_flights.sort(key=lambda x: x["price_eur"])
    elapsed = time.time() - t0

    def categorize(p: float) -> str:
        if p < 15:
            return "💥 ERROR_FARE"
        if p < 20:
            return "🔥 CRÍTICO"
        if p < 30:
            return "🟢 CHOLLO"
        if p < 40:
            return "🟡 OFERTA"
        return "🔵 NORMAL"

    buckets = defaultdict(int)
    for f in all_flights:
        buckets[categorize(f["price_eur"])] += 1

    print(f"\n─ Escaneo invierno 2026-27: {elapsed:.1f}s ─")
    print(f"  Orígenes con data: {origins_with_data}/{len(ORIGINS)}")
    print(f"  Vuelos totales:    {len(all_flights)}")
    for cat in ("💥 ERROR_FARE", "🔥 CRÍTICO", "🟢 CHOLLO", "🟡 OFERTA", "🔵 NORMAL"):
        print(f"  {cat}: {buckets[cat]}")

    print("\n🏆 TOP 30 más baratos:")
    for f in all_flights[:30]:
        print(f"  €{f['price_eur']:>6.2f}  {f['origin']}→{f['destination']}  "
              f"{f['departure']}  {f['destination_full']}")

    # Guardar
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out_dir = Path("/sessions/laughing-modest-bohr/mnt/Viajes/chollos_reales_20260420")
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / f"ryanair_invierno_{ts}.json"
    with open(json_path, "w") as fh:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "window": {"from": start.isoformat(), "to": end.isoformat()},
            "origins_scanned": len(ORIGINS),
            "origins_with_data": origins_with_data,
            "total_flights": len(all_flights),
            "buckets": dict(buckets),
            "top_100": all_flights[:100],
            "all_flights": all_flights,
        }, fh, indent=2, ensure_ascii=False)
    print(f"\n✅ JSON: {json_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
