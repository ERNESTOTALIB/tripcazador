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

# SSS33 (may-2026): la combinación sem=1 + sleep 7s causaba runtime 7h con
# scope NO_CAP (2,750 reqs). Solución: con NO_CAP la cuenta Live aguanta 4
# concurrentes sin throttle agresivo + budget global 6 min para no acaparar
# el worker GitHub Actions (45 min total).
_CONCURRENCY_DEFAULT = 1   # cuentas test/free
_CONCURRENCY_NO_CAP  = 2   # cuentas Live verificadas (SSS35: 4 → 2 = menos cascada 429)
_REQUEST_TIMEOUT = 25      # s por petición HTTP individual
_SEARCH_TIMEOUT = 30       # s por búsqueda completa (create + retrieve)
_GLOBAL_BUDGET_SEC = int(os.getenv("DUFFEL_BUDGET_SEC", "420"))  # 7 min total
# Throttle entre requests, distinto por modo. Cuenta Live nueva ~10-20 req/min,
# por eso en NO_CAP ponemos 2s sleep × sem=2 = ~30 reqs/min sostenido.
_THROTTLE_DEFAULT = 7.0    # s entre requests en modo conservador
_THROTTLE_NO_CAP = 2.0     # SSS35: 0.5 → 2.0s para no saturar rate-limit

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
        # SSS33: concurrency depende del modo. NO_CAP escala para cuentas Live.
        no_cap = os.getenv("DUFFEL_NO_CAP", "").lower() in ("1", "true", "yes")
        self._no_cap = no_cap
        self._concurrency = _CONCURRENCY_NO_CAP if no_cap else _CONCURRENCY_DEFAULT
        self._throttle = _THROTTLE_NO_CAP if no_cap else _THROTTLE_DEFAULT
        self._semaphore = asyncio.Semaphore(self._concurrency)
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
        """Búsqueda completa (create + retrieve) con timeout total y semáforo.

        SSS27: throttle explícito 7s entre requests para no exceder 10 req/min
        de cuentas Live nuevas. Sin esto el burst inicial dispara HTTP 429
        en cascada.
        """
        async with self._semaphore:
            try:
                async def _flow():
                    rid = await self._create_offer_request(session, origin, destination, departure_date)
                    if not rid:
                        # Sleep aún en fallo para no saturar el rate-limit
                        await asyncio.sleep(self._throttle)
                        return []
                    offers = await self._retrieve_offers(session, rid)
                    flights = []
                    for offer in offers:
                        f = _offer_to_dict(offer, origin, destination)
                        if f and f["price_eur"] > 0:
                            flights.append(f)
                    await asyncio.sleep(self._throttle)
                    return flights

                return await asyncio.wait_for(_flow(), timeout=_SEARCH_TIMEOUT + 8)
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

        total = len(origins) * (len(destinations) - 1) * len(dates)
        mode = "NO_CAP" if self._no_cap else "CAPPED"
        print(f"\n   🦆 Duffel ({mode}): {len(origins)} orígenes × {len(destinations)} destinos × {len(dates)} fechas = ~{total} reqs (sem={self._concurrency}, budget={_GLOBAL_BUDGET_SEC}s)")

        all_flights: List[Dict] = []
        async with aiohttp.ClientSession() as session:
            tasks = []
            for origin in origins:
                for dest in destinations:
                    if origin == dest:
                        continue
                    for d in dates:
                        tasks.append(self._search_one(session, origin, dest, d))

            # SSS33: budget global — si las tareas no terminan en N segundos,
            # cancelamos lo pendiente y devolvemos lo que ya tengamos.
            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=_GLOBAL_BUDGET_SEC,
                )
            except asyncio.TimeoutError:
                print(f"   ⏱️  Duffel: budget {_GLOBAL_BUDGET_SEC}s agotado — recopilando parciales")
                # Cancelar tasks pendientes y juntar las completadas
                for t in tasks:
                    if not t.done():
                        t.cancel()
                results = []
                for t in tasks:
                    if t.done() and not t.cancelled():
                        try:
                            results.append(t.result())
                        except Exception:
                            results.append([])

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
        # SSS35: scope conservador para evitar cascada 429 en cuenta Live nueva.
        # NO_CAP: 5 origins × 6 dests × step=21d (~4 fechas) = ~120 reqs.
        # Con sem=2 + 2.0s throttle = 120/2 × 2s ≈ 2 min runtime.
        # Cuando la cuenta Live escale en límites, se puede subir scope.
        # CAPPED (test/free): scope mínimo conservador para no quemar quota.
        if self._no_cap:
            origins_capped = origins[:5]
            dests_capped = DUFFEL_LONG_HAUL[:6]
            step = 21
        else:
            origins_capped = origins[:3]
            dests_capped = DUFFEL_LONG_HAUL[:4]
            step = 21
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
