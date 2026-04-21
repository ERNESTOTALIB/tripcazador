"""
Caza real de precios económicos Ryanair (sin API key).
Usa los endpoints públicos vía ryanair-py.

Objetivo: encontrar vuelos por debajo de 25 € (one-way) desde
aeropuertos de los nuevos códigos IATA añadidos al catálogo
(Balcanes, Bálticos, UK regional, Escandinavia, islas griegas).
"""

import sys
import time
from datetime import date, timedelta
from ryanair import Ryanair


def main() -> int:
    api = Ryanair(currency="EUR")

    # Mezcla de hubs Ryanair existentes + aeropuertos nuevos del catálogo
    # que realmente son bases Ryanair.
    ORIGINS = [
        # Nuevos añadidos que son bases Ryanair
        "CLJ",  # Cluj-Napoca
        "TSR",  # Timisoara
        "VAR",  # Varna
        "BOJ",  # Burgas
        "KUN",  # Kaunas
        # Hubs clásicos
        "MAD", "BCN", "AGP", "LIS", "DUB", "STN", "CDG", "BSL",
        "MUC", "BER", "BGY", "CIA", "WAW", "BUD", "ATH",
    ]

    # Ventana: julio–agosto 2026 (pico de demanda, ideal para detectar
    # anomalías de precio muy bajo que son las que publicamos).
    date_from = date(2026, 7, 1)
    date_to = date(2026, 8, 31)

    all_flights = []
    per_origin_counts = {}
    errors = []

    for origin in ORIGINS:
        t0 = time.time()
        try:
            flights = api.get_cheapest_flights(origin, date_from, date_to)
            per_origin_counts[origin] = len(flights)
            all_flights.extend(flights)
            elapsed = time.time() - t0
            print(f"  [{origin:3}] {len(flights):3} vuelos en {elapsed:.1f}s", flush=True)
        except Exception as e:
            errors.append((origin, str(e)[:80]))
            print(f"  [{origin:3}] ERROR: {str(e)[:80]}", flush=True)

    print(f"\n─ Total: {len(all_flights)} vuelos desde {len(per_origin_counts)} orígenes ─\n")

    if errors:
        print(f"⚠️  {len(errors)} orígenes fallaron (probablemente no tienen base Ryanair)")

    # Ordenar por precio, los 30 más baratos
    all_flights.sort(key=lambda f: f.price)
    top = all_flights[:30]

    print("\n" + "=" * 80)
    print("🏆 TOP 30 VUELOS MÁS BARATOS (one-way, Ryanair real, julio-ago 2026)")
    print("=" * 80)
    for f in top:
        dep = f.departureTime.strftime("%Y-%m-%d %H:%M")
        print(f"  €{f.price:6.2f}  {f.origin}→{f.destination}  "
              f"{dep}  {f.destinationFull or ''}")

    # Por debajo de 15 €
    very_cheap = [f for f in all_flights if f.price < 15]
    print(f"\n💥 Vuelos a < 15€: {len(very_cheap)}")
    for f in very_cheap[:20]:
        dep = f.departureTime.strftime("%Y-%m-%d")
        print(f"     €{f.price:5.2f}  {f.origin}→{f.destination}  {dep}")

    # Resumen por origen
    print("\nConteo por origen:")
    for o, n in sorted(per_origin_counts.items(), key=lambda x: -x[1]):
        print(f"  {o}: {n}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
