"""
Flight Hunter V4 — Motor Ryanair
=================================
Sin API key. Sin registro. Datos 100% reales en tiempo real.

Usa ryanair-py (https://github.com/cohaolain/ryanair-py) que accede
directamente a los endpoints públicos de Ryanair sin autenticación.

Cobertura: ~250 destinos desde 85+ aeropuertos europeos de Ryanair.
Los error fares de Ryanair son frecuentes — es una de las aerolíneas
con mayor historial de precios publicados por error.

Instalación:
    pip install ryanair-py --break-system-packages
"""

import asyncio
import concurrent.futures
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import config

try:
    from ryanair import Ryanair as RyanairAPI
    RYANAIR_AVAILABLE = True
except ImportError:
    RYANAIR_AVAILABLE = False
    print("⚠️  ryanair-py no instalado: pip install ryanair-py --break-system-packages")


# Aeropuertos europeos que Ryanair usa como hub / base fuerte
RYANAIR_STRONG_HUBS = [
    "MAD", "BCN", "VLC", "AGP", "SVQ", "PMI", "ACE", "TFN",  # España
    "LIS", "OPO", "FAO",                                        # Portugal
    "DUB", "ORK", "SNN",                                        # Irlanda
    "STN", "LTN", "BRS", "MAN", "EDI", "BHX",                 # UK
    "CIA", "BGY", "PSA", "BRI",                                 # Italia (hubs low-cost)
    "CDG", "BVA", "MRS", "LYS",                                 # Francia
    "HAM", "BER", "CGN", "FRA",                                 # Alemania
    "STR", "HHN", "FKB", "NUE",                                # Sur Alemania / Baden-Württemberg
    "BSL", "SXB",                                               # EuroAirport Basilea + Estrasburgo
    "LUX",                                                       # Luxemburgo
    "ZRH", "GVA",                                               # Suiza
    "AMS", "EIN",                                               # Países Bajos
    "WAW", "KRK", "WRO",                                        # Polonia
    "BUD",                                                       # Hungría
    "PRG",                                                       # Rep. Checa
    "ATH", "SKG",                                               # Grecia
    "SOF",                                                       # Bulgaria
    "OTP", "CLJ",                                               # Rumanía
    "IST", "SAW", "ADB", "ESB",                                 # Turquía
]


def _flight_to_dict(flight, cabin_code: int = config.CABIN_ECONOMY,
                    date_ret: Optional[datetime] = None,
                    return_price: float = 0.0) -> Dict:
    """Convierte un objeto Flight de ryanair-py al formato estándar V4."""
    dest = flight.destination
    dest_full = flight.destinationFull or dest
    city = dest_full.split(",")[0].strip() if "," in dest_full else dest_full
    country = dest_full.split(",")[1].strip() if "," in dest_full else ""

    price = flight.price
    if return_price > 0:
        price = price + return_price  # precio total ida+vuelta

    dist_cat = config.get_distance_category(dest)

    date_str = flight.departureTime.strftime('%Y-%m-%d')
    booking_url = (
        f"https://www.ryanair.com/es/es/trip/flights/select"
        f"?adults=1&teens=0&children=0&infants=0"
        f"&dateOut={date_str}&isConnectedFlight=false&isReturn=false"
        f"&originIata={flight.origin}&destinationIata={dest}"
    )

    # Calcular duración si tenemos arrivalTime
    try:
        duration_min = int((flight.arrivalTime - flight.departureTime).total_seconds() // 60)
    except Exception:
        duration_min = 0

    return {
        "source": "ryanair",
        "origin": flight.origin,
        "origin_full": flight.originFull or flight.origin,
        "destination": dest,
        "city_to": city,
        "country_to": country,
        "price_eur": round(price, 2),
        "cabin_code": cabin_code,
        "cabin": config.CABIN_NAMES.get(cabin_code, "Economy").lower(),
        "airline": "FR",
        "airline_name": "Ryanair",
        "flight_number": flight.flightNumber,
        "date_out": flight.departureTime.strftime("%Y-%m-%d"),
        "time_out": flight.departureTime.strftime("%H:%M"),
        "date_ret": date_ret.strftime("%Y-%m-%d") if date_ret else "",
        "stops": 0,  # Ryanair solo opera vuelos directos
        "duration_min": duration_min,
        "distance_category": dist_cat,
        "booking_url": booking_url,
        "raw": str(flight),
    }


def _trip_to_dict(trip) -> Dict:
    """Convierte un Trip (ida+vuelta) de ryanair-py al formato estándar V4."""
    out = trip.outbound
    ret = trip.inbound
    dest = out.destination
    dest_full = out.destinationFull or dest
    city = dest_full.split(",")[0].strip() if "," in dest_full else dest_full
    country = dest_full.split(",")[1].strip() if "," in dest_full else ""

    dist_cat = config.get_distance_category(dest)

    date_out_str = out.departureTime.strftime('%Y-%m-%d')
    date_ret_str = ret.departureTime.strftime('%Y-%m-%d')
    booking_url = (
        f"https://www.ryanair.com/es/es/trip/flights/select"
        f"?adults=1&teens=0&children=0&infants=0"
        f"&dateOut={date_out_str}&dateIn={date_ret_str}"
        f"&isConnectedFlight=false&isReturn=true"
        f"&originIata={out.origin}&destinationIata={dest}"
    )

    # Calcular duración y noches
    try:
        out_dur_min = int((out.arrivalTime - out.departureTime).total_seconds() // 60)
    except Exception:
        out_dur_min = 0
    try:
        nights = (ret.departureTime.date() - out.arrivalTime.date()).days
        nights = max(0, nights)
    except Exception:
        try:
            nights = (ret.departureTime.date() - out.departureTime.date()).days
            nights = max(0, nights)
        except Exception:
            nights = 0

    return {
        "source": "ryanair",
        "origin": out.origin,
        "origin_full": out.originFull or out.origin,
        "destination": dest,
        "city_to": city,
        "country_to": country,
        "price_eur": round(trip.totalPrice, 2),
        "price_outbound": round(out.price, 2),
        "price_inbound": round(ret.price, 2),
        "cabin_code": config.CABIN_ECONOMY,
        "cabin": "economy",
        "airline": "FR",
        "airline_name": "Ryanair",
        "flight_number": out.flightNumber,
        "flight_number_ret": ret.flightNumber,
        "date_out": out.departureTime.strftime("%Y-%m-%d"),
        "time_out": out.departureTime.strftime("%H:%M"),
        "date_ret": ret.departureTime.strftime("%Y-%m-%d"),
        "time_ret": ret.departureTime.strftime("%H:%M"),
        "stops": 0,
        "duration_min": out_dur_min,
        "nights": nights,
        "distance_category": dist_cat,
        "booking_url": booking_url,
        "raw": str(trip),
    }


class RyanairEngine:
    """
    Motor de búsqueda Ryanair — sin API key, datos reales.

    Estrategia:
    - One-way: get_cheapest_flights(origin, date_from, date_to)
      → devuelve el vuelo más barato a cada destino en el rango
    - Return: get_cheapest_return_flights(origin, df, dt, rf, rt)
      → devuelve el viaje de ida+vuelta más barato

    Paralelismo: múltiples orígenes en hilos (la librería es síncrona),
    coordinados con asyncio via executor.
    """

    def __init__(self, currency: str = "EUR"):
        self.available = RYANAIR_AVAILABLE
        if self.available:
            self.api = RyanairAPI(currency=currency)
        self.currency = currency

    def _search_oneway_sync(self, origin: str, date_from: date, date_to: date) -> List[Dict]:
        """Búsqueda one-way síncrona (para ejecutar en executor)."""
        try:
            flights = self.api.get_cheapest_flights(origin, date_from, date_to)
            return [_flight_to_dict(f) for f in (flights or [])]
        except Exception as e:
            print(f"      ⚠️  Ryanair one-way {origin}: {e}")
            return []

    def _search_return_sync(
        self, origin: str,
        date_from: date, date_to: date,
        return_from: date, return_to: date,
    ) -> List[Dict]:
        """Búsqueda return síncrona."""
        try:
            trips = self.api.get_cheapest_return_flights(
                origin, date_from, date_to, return_from, return_to
            )
            return [_trip_to_dict(t) for t in (trips or [])]
        except Exception as e:
            print(f"      ⚠️  Ryanair return {origin}: {e}")
            return []

    async def search_oneway_multi(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        max_workers: int = 8,
    ) -> List[Dict]:
        """
        Busca vuelos one-way desde múltiples orígenes en paralelo.
        Cada origen hace 1 llamada → N orígenes en paralelo.
        """
        if not self.available:
            return []

        df = datetime.strptime(date_from, "%Y-%m-%d").date()
        dt = datetime.strptime(date_to, "%Y-%m-%d").date()

        # Filtrar a aeropuertos con buena presencia Ryanair
        ryanair_origins = [o for o in origins if o in RYANAIR_STRONG_HUBS] or origins[:20]

        print(f"\n   ✈️  Ryanair ONE-WAY: {len(ryanair_origins)} aeropuertos × {date_from}→{date_to}")

        loop = asyncio.get_event_loop()
        all_flights = []
        errors = 0

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            tasks = {
                loop.run_in_executor(executor, self._search_oneway_sync, origin, df, dt): origin
                for origin in ryanair_origins
            }
            for coro in asyncio.as_completed(tasks):
                flights = await coro
                if flights:
                    all_flights.extend(flights)
                    print(f"      ✅ {flights[0]['origin']}: {len(flights)} vuelos (min: {min(f['price_eur'] for f in flights):.0f}€)")
                else:
                    errors += 1

        print(f"   📊 Total one-way Ryanair: {len(all_flights)} vuelos ({errors} orígenes sin datos)")
        return all_flights

    async def search_return_multi(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        min_nights: int = 3,
        max_nights: int = 14,
        max_workers: int = 8,
    ) -> List[Dict]:
        """
        Busca vuelos de ida+vuelta desde múltiples orígenes.
        Return window: date_from+min_nights → date_to
        """
        if not self.available:
            return []

        df = datetime.strptime(date_from, "%Y-%m-%d").date()
        dt = datetime.strptime(date_to, "%Y-%m-%d").date()
        rf = df + timedelta(days=min_nights)
        rt = dt

        ryanair_origins = [o for o in origins if o in RYANAIR_STRONG_HUBS] or origins[:20]

        print(f"\n   ✈️  Ryanair RETURN: {len(ryanair_origins)} aeropuertos | {min_nights}-{max_nights} noches")

        loop = asyncio.get_event_loop()
        all_trips = []
        errors = 0

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            tasks = {
                loop.run_in_executor(
                    executor, self._search_return_sync, origin, df, dt, rf, rt
                ): origin
                for origin in ryanair_origins
            }
            for coro in asyncio.as_completed(tasks):
                trips = await coro
                if trips:
                    all_trips.extend(trips)
                    print(f"      ✅ {trips[0]['origin']}: {len(trips)} viajes (min: {min(t['price_eur'] for t in trips):.0f}€)")
                else:
                    errors += 1

        print(f"   📊 Total return Ryanair: {len(all_trips)} viajes ({errors} orígenes sin datos)")
        return all_trips

    async def search_error_hunter(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        min_nights: int = 3,
        max_nights: int = 21,
    ) -> List[Dict]:
        """
        Modo error hunter: busca one-way + return simultáneamente.
        Combina resultados y deja al detector encontrar anomalías.
        """
        oneway_task = self.search_oneway_multi(origins, date_from, date_to)
        return_task = self.search_return_multi(origins, date_from, date_to, min_nights, max_nights)

        oneway, returns = await asyncio.gather(oneway_task, return_task)
        combined = oneway + returns

        # Dedup por (origin, destination, date_out) — quedarse con el más barato
        seen: Dict[Tuple, Dict] = {}
        for f in combined:
            key = (f["origin"], f["destination"], f["date_out"])
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f

        deduped = list(seen.values())
        print(f"\n   🔀 Ryanair combinado (sin duplicados): {len(deduped)} vuelos únicos")
        return deduped

    def get_stats(self) -> Dict:
        """Estadísticas básicas de la sesión."""
        return {
            "available": self.available,
            "queries_made": self.api.num_queries if self.available else 0,
        }
