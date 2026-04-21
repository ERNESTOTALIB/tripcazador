"""
Ronda 3: Caza Ryanair en *shoulder season* (oct/nov 2026 — rebajas posTsunami
turístico veraniego, antes del pico navideño). Objetivo: ver si aflora un
nuevo floor de precio distinto al de ronda 1 (full summer) y ronda 2 (winter).

Output comparable con rondas previas para feed en `REPORTE_BUGS_20260421.md`.
"""

import json
import sys
import time
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from ryanair import Ryanair


ORIGINS = [
    "MAD", "BCN", "VLC", "AGP", "SVQ", "PMI", "ACE", "TFN", "IBZ", "BIO",
    "LIS", "OPO", "FAO",
    "DUB", "STN", "LTN", "MAN", "EDI", "BHX", "NCL",
    "CIA", "BGY", "PSA", "BRI", "NAP", "CTA", "PMO", "VCE", "TRN",
    "BVA", "MRS", "NCE", "TLS", "BOD",
    "HAM", "BER", "CGN", "HHN", "FMM",
    "BSL", "ZRH",
    "AMS", "EIN", "CRL", "BRU", "RTM",
    "WAW", "KRK", "GDN", "BUD", "PRG", "POZ", "WRO",
    "ATH", "SKG", "CFU", "RHO", "HER",
    "SOF", "OTP", "BEG", "TIA", "CLJ",
    "KUN", "VNO", "RIX", "TLL", "HEL",
    "ARN", "GOT", "OSL", "CPH", "BLL",
    "MLA",
]


def main() -> int:
    t0 = time.time()
    ryanair = Ryanair(currency="EUR")

    # Ventana shoulder: 2026-10-01 → 2026-11-30 (61 días)
    start = date(2026, 10, 1)
    end = date(2026, 11, 30)

    all_flights: list[dict] = []
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
        if p < 15: return "💥 ERROR_FARE"
        if p < 20: return "🔥 CRÍTICO"
        if p < 30: return "🟢 CHOLLO"
        if p < 40: return "🟡 OFERTA"
        return "🔵 NORMAL"

    buckets = defaultdict(int)
    for f in all_flights:
        buckets[categorize(f["price_eur"])] += 1

    print(f"\n─ Escaneo shoulder oct-nov 2026: {elapsed:.1f}s ─")
    print(f"  Orígenes con data: {origins_with_data}/{len(ORIGINS)}")
    print(f"  Vuelos totales:    {len(all_flights)}")
    for cat in ("💥 ERROR_FARE", "🔥 CRÍTICO", "🟢 CHOLLO", "🟡 OFERTA", "🔵 NORMAL"):
        print(f"  {cat}: {buckets[cat]}")

    # TOP 40 — para mirar floor real
    print("\n🏆 TOP 40 más baratos:")
    for f in all_flights[:40]:
        print(f"  €{f['price_eur']:>6.2f}  {f['origin']}→{f['destination']}  "
              f"{f['departure']:<20}  {f['destination_full']}")

    # Floor stats — por origen para detectar posibles error fares locales
    by_origin_min = defaultdict(lambda: 10**9)
    for f in all_flights:
        o = f["origin"]
        if f["price_eur"] < by_origin_min[o]:
            by_origin_min[o] = f["price_eur"]

    cheap_origins = sorted(by_origin_min.items(), key=lambda x: x[1])[:20]
    print("\n🌍 TOP 20 orígenes con floor más bajo:")
    for o, p in cheap_origins:
        print(f"  {o}: €{p:.2f}")

    # Save JSON
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out_dir = Path("/sessions/laughing-modest-bohr/mnt/Viajes/chollos_reales_20260420")
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / f"ryanair_shoulder_{ts}.json"
    with open(json_path, "w") as fh:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "season": "shoulder (oct-nov)",
            "window": {"from": start.isoformat(), "to": end.isoformat()},
            "origins_scanned": len(ORIGINS),
            "origins_with_data": origins_with_data,
            "total_flights": len(all_flights),
            "buckets": dict(buckets),
            "top_150": all_flights[:150],
            "by_origin_min": dict(by_origin_min),
        }, fh, indent=2, ensure_ascii=False)
    print(f"\n✅ JSON: {json_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
