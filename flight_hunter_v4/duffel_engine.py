"""
Flight Hunter V4 — Motor Duffel
==================================
API real-time GDS-grade vía Duffel (https://duffel.com).

Cobertura: 300+ aerolíneas con disponibilidad y precio en vivo (no cache).
Auth: header `Authorization: Bearer {DUFFEL_TOKEN}` + `Duffel-Version: v2`.

Flujo en dos pasos:
    1. POST /air/offer_requests        → crea solicitud y devuelve {id}
    2. GET  /air/offer_requests/{id}   → recupera offers[] con precios
       (usamos return_offers=true para evitar /air/offers separado)

Documentación: https://duffel.com/docs/api/v2/overview

Notas:
  - Plan free de Duffel limita rate; semáforo=4 + timeout 30s por búsqueda.
  - Duffel no expone deeplinks de reserva externos — usamos airline_links
    para apuntar al sitio de la aerolínea (política V4 anti-Skyscanner).
"""

import asyncio
import aiohttp
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import config
from airline_links import get_booking_url, get_airline_name

BASE_URL = "https://api.duffel.com/air"

# Long-haul prioritarios (los que Ryanair / low-cost no cubren).
DUFFEL_LONG_HAUL = ["JFK", "LAX", "BKK", "NRT", "SIN", "GRU", "EZE", "JNB", "DXB", "SYD"]

_CONCURRENCY = 4
_REQUEST_TIMEOUT = 25   # s por petición HTTP
_SEARCH_TIMEOUT = 30    # s por búsqueda completa (create + retrieve)

# Conversión a EUR — rates aproximados; sync con travelpayouts si desvía >5%.
_FX_TO_EUR = {
    "EUR": 1.0, "USD": 0.92, "GBP": 1.17, "CHF": 1.04, "JPY": 0.0061,
    "AUD": 0.61, "CAD": 0.68, "BRL": 0.18, "ARS": 0.0011, "ZAR": 0.050,
    "AED": 0.25, "SGD": 0.69, "THB": 0.026,
}


def _to_eur(amount: float, currency: str) -> float:
    """Convierte un importe a EUR usando rates aproximados."""
    rate = _FX_TO_EUR.get((currency or "EUR").upper(), 0.92)
    return amount * rate


def _offer_to_dict(offer: Dict, origin: str, destination: str) -> Optional[Dict]:
    """Convierte una offer Duffel al formato estándar V4."""
    try:
        amount_raw = offer.get("total_amount") or "0"
        currency = offer.get("total_currency") or "EUR"
        try:
            amount = float(amount_raw)
        except (TypeError, ValueError):
            return None
        if amount <= 0:
            return None
        price_eur = round(_to_eur(amount, currency), 2)
        if price_eur <= 0:
            return None

        slices = offer.get("slices") or []
        if not slices:
            return None
        segments = (slices[0].get("segments") or [])
        if not segments:
            return None
        first_seg = segments[0]

        # Aerolínea operadora (preferimos operating sobre marketing).
        op = first_seg.get("operating_carrier") or first_seg.get("marketing_carrier") or {}
        airline_code = (op.get("iata_code") or "").upper()
        airline_name = op.get("name") or get_airline_name(airline_code) or ""

        flight_num_raw = (first_seg.get("operating_carrier_flight_number") or
                          first_seg.get("marketing_carrier_flight_number") or "")
        flight_number = (f"{airline_code}{flight_num_raw}"
                         if airline_code and flight_num_raw else str(flight_num_raw or ""))

        departing_at = first_seg.get("departing_at") or ""  # ISO 2026-09-15T10:30:00
        date_out = departing_at[:10] if departing_at else ""
        time_out = departing_at[11:16] if len(departing_at) >= 16 else ""
        stops = max(0, len(segments) - 1)  # escalas en el primer slice

        dist_cat = config.get_distance_category(destination)
        booking_url = get_booking_url(airline_code, origin, destination, date_out, "")

        return {
            "source": "duffel",
            "origin": origin,
            "origin_full": origin,
            "destination": destination,
            "city_to": destination,
            "country_to": "",
            "price_eur": price_eur,
            "cabin_code": config.CABIN_ECONOMY,
            "cabin": "economy",
            "airline": airline_code,
            "airline_name": airline_name,
            "flight_number": flight_number,
            "date_out": date_out,
            "time_out": time_out,
            "date_ret": "",
            "stops": stops,
            "distance_category": dist_cat,
            "booking_url": booking_url,
        }
    except Exception:
        return None


class DuffelEngine:
    """
    Motor Duffel para Flight Hunter V4.

    Modo: real-time (sin cache), 300+ aerolíneas vía API GDS-grade.
    Estrategia: para cada (origin, destination, fecha) crea una offer_request
    y recupera todas las offers; cada offer se normaliza al formato V4.
    """

    def __init__(self):
        # Token desde env (config.py ya lo expone como DUFFEL_TOKEN).
        self.token = getattr(config, "DUFFEL_TOKEN", "") or ""
        self.available = bool(self.token)
        self._semaphore = asyncio.Semaphore(_CONCURRENCY)
        if not self.available:
            print("⚠️  DUFFEL_TOKEN no configurado.")

    def _headers(self) -> Dict:
        return {
            "Authorization": f"Bearer {self.token}",
            "Duffel-Version": "v2",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    async def _create_offer_request(self, session: aiohttp.ClientSession,
                                    origin: str, destination: str,
                                    departure_date: str) -> Optional[str]:
        """POST /offer_requests → devuelve el id de la solicitud."""
        payload = {
            "data": {
                "slices": [{
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date,
                }],
                "passengers": [{"type": "adult"}],
                "cabin_class": "economy",
            }
        }
        try:
            async with session.post(
                f"{BASE_URL}/offer_requests",
                json=payload,
                headers=self._headers(),
                timeout=aiohttp.ClientTimeout(total=_REQUEST_TIMEOUT),
            ) as resp:
                if resp.status == 429:
                    print(f"   ⚠️  Duffel rate-limit en {origin}-{destination} {departure_date}")
                    return None
                if resp.status not in (200, 201):
                    return None
                data = await resp.json()
                return ((data or {}).get("data") or {}).get("id")
        except Exception:
            return None

    async def _retrieve_offers(self, session: aiohttp.ClientSession,
                               request_id: str) -> List[Dict]:
        """GET /offer_requests/{id} → devuelve la lista de offers."""
        try:
            async with session.get(
                f"{BASE_URL}/offer_requests/{request_id}",
                headers=self._headers(),
                # Pedimos hasta 50 offers; suficiente para encontrar la más barata.
                params={"return_offers": "true", "limit": "50"},
                timeout=aiohttp.ClientTimeout(total=_REQUEST_TIMEOUT),
            ) as resp:
                if resp.status not in (200, 201):
                    return []
                data = await resp.json()
                return ((data or {}).get("data") or {}).get("offers") or []
        except Exception:
            return []

    async def _search_one(self, session: aiohttp.ClientSession,
                          origin: str, destination: str,
                          departure_date: str) -> List[Dict]:
        """Búsqueda completa (create + retrieve) con timeout total y semáforo."""
        async with self._semaphore:
            try:
                async def _flow():
                    rid = await self._create_offer_request(session, origin, destination, departure_date)
                    if not rid:
                        return []
                    offers = await self._retrieve_offers(session, rid)
                    flights = []
                    for offer in offers:
                        f = _offer_to_dict(offer, origin, destination)
                        if f and f["price_eur"] > 0:
                            flights.append(f)
                    return flights

                return await asyncio.wait_for(_flow(), timeout=_SEARCH_TIMEOUT)
            except asyncio.TimeoutError:
                return []
            except Exception:
                return []

    async def search_routes(self, origins: List[str], date_from: str,
                            date_to: str,
                            destinations: List[str] = None,
                            step_days: int = 7) -> List[Dict]:
        """
        Búsqueda multi-origen × multi-destino × ventana de fechas.
        Genera una offer_request por combinación (limitado por _CONCURRENCY).
        Devuelve lista de dicts en formato V4 (más barato por ruta+fecha).
        """
        if not self.available:
            return []
        if not destinations:
            return []

        dates = _dates_in_range(date_from, date_to, step_days=step_days)
        if not dates:
            return []

        print(f"\n   🦆 Duffel: {len(origins)} orígenes × {len(destinations)} destinos × {len(dates)} fechas")

        all_flights: List[Dict] = []
        async with aiohttp.ClientSession() as session:
            tasks = []
            for origin in origins:
                for dest in destinations:
                    if origin == dest:
                        continue
                    for d in dates:
                        tasks.append(self._search_one(session, origin, dest, d))

            results = await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            if isinstance(r, list):
                all_flights.extend(r)

        # Dedup: más barato por (origin, dest, date_out).
        seen: Dict[Tuple, Dict] = {}
        for f in all_flights:
            key = (f["origin"], f["destination"], f["date_out"])
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f
        deduped = list(seen.values())
        print(f"   📊 Duffel: {len(deduped)} vuelos únicos")
        return deduped

    async def search_long_haul(self, origins: List[str], date_from: str,
                               date_to: str) -> List[Dict]:
        """
        Atajo: usa DUFFEL_LONG_HAUL como destinos.

        SSS17 (may-2026): caps agresivos para test-mode (rate-limit ~50 req/min).
        Si el token es Live el cap se relaja vía DUFFEL_NO_CAP=1.
        Test mode: 3 origins × 5 dests × 4 dates = 60 requests (≈ 1.5 min con sem=4).
        Live mode: 25 origins × 10 dests × 11 dates = 2750 requests.
        """
        no_cap = os.getenv("DUFFEL_NO_CAP", "").lower() in ("1", "true", "yes")
        is_live = self.token and self.token.startswith("duffel_live_")
        if no_cap or is_live:
            origins_capped = origins
            dests_capped = DUFFEL_LONG_HAUL
            step = 7
        else:
            # Test mode caps — rate-limit-friendly
            origins_capped = origins[:3]
            dests_capped = DUFFEL_LONG_HAUL[:5]
            step = 14  # cada 2 semanas en vez de cada 1
        return await self.search_routes(origins_capped, date_from, date_to, dests_capped, step_days=step)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _dates_in_range(date_from: str, date_to: str, step_days: int = 7) -> List[str]:
    """Genera fechas YYYY-MM-DD entre date_from y date_to cada step_days días."""
    try:
        df = datetime.strptime(date_from, "%Y-%m-%d")
        dt = datetime.strptime(date_to, "%Y-%m-%d")
    except Exception:
        return []
    if df > dt:
        return []
    out = []
    cur = df
    while cur <= dt:
        out.append(cur.strftime("%Y-%m-%d"))
        cur += timedelta(days=step_days)
    return out
