"""
Flight Hunter V4 — Motor Vueling
==================================
Sin API key. Sin registro. Datos 100% reales en tiempo real.

Vueling (grupo IAG) expone endpoints JSON públicos en su proceso de reserva.
Accede a los mismos precios que ves en vueling.com, en tiempo real.

Cobertura: ~200 rutas desde hubs europeos, con fuerte presencia en:
  España (BCN, MAD, VLC, AGP, SVQ, PMI, IBZ, etc.)
  Francia (CDG, ORY, LYS, MRS, NCE, BOD, TLS)
  Italia (FCO, MXP, FCO, NAP, VCE)
  Resto UE: AMS, GVA, ZRH, LIS, OPO, ATH, IST, etc.

Aeropuertos desde zona Estrasburgo con vuelos Vueling:
  BSL (Basilea-Mulhouse) → BCN, MAD, PMI, VLC, AGP, SVQ, IBZ, LPA, TFS
  CDG (Paris CDG)        → BCN, MAD, PMI, VLC, AGP, SVQ + muchos más
  GVA (Ginebra)          → BCN, MAD, PMI, IBZ, ALC
  ZRH (Zurich)           → BCN, MAD, PMI

Instalación (sin dependencias adicionales — usa requests estándar):
    pip install aiohttp --break-system-packages   ← ya instalado
"""

import asyncio
import aiohttp
import json
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional, Tuple
import config
from airline_links import kayak_url as vueling_url

# ── API endpoints de Vueling ──────────────────────────────────────────────────
# Estos son los mismos endpoints que usa vueling.com internamente
VUELING_API_BASE = "https://api.vueling.com/vuelingApi/api"
VUELING_SEARCH_URL = f"{VUELING_API_BASE}/availability/lowestPrices"

# Headers que imitan el navegador de vueling.com
VUELING_HEADERS = {
    "Accept": "application/json",
    "Accept-Language": "es-ES,es;q=0.9",
    "Content-Type": "application/json",
    "Origin": "https://www.vueling.com",
    "Referer": "https://www.vueling.com/",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "X-Requested-With": "XMLHttpRequest",
}

# Rutas donde Vueling opera con más frecuencia desde hubs de interés
VUELING_HUBS = [
    "BCN",  # Hub principal — 200+ destinos
    "MAD",  # Hub secundario fuerte
    "CDG",  # Paris — excelente para zona Alsacia
    "FCO",  # Roma
    "GVA",  # Ginebra
    "ZRH",  # Zurich
    "BSL",  # Basilea — opera desde aquí a España
    "AMS",  # Amsterdam
    "LIS",  # Lisboa
    "OPO",  # Oporto
    "MXP",  # Milan Malpensa
    "LHR",  # Londres
    "MAN",  # Manchester
    "EDI",  # Edimburgo
]

# Destinos populares de Vueling (España + Islas + destinos frecuentes)
VUELING_POPULAR_DESTS = [
    # España peninsular
    "MAD", "BCN", "VLC", "AGP", "SVQ", "BIO", "SDR", "VLL",
    # Islas
    "PMI", "IBZ", "MAH", "LPA", "TFS", "ACE", "FUE", "TFN",
    # Portugal
    "LIS", "OPO", "FAO",
    # Italia
    "FCO", "MXP", "NAP", "VCE", "BLQ", "PSA", "PMO", "CTA",
    # Francia
    "NCE", "MRS", "LYS", "BOD", "TLS",
    # Grecia
    "ATH", "HER", "SKG", "RHO",
    # Destinos vacacionales
    "DXB", "CMN", "TUN", "CAI", "RAK",
    "AYT", "DLM", "IST",
]


def _vueling_flight_to_dict(item: Dict, origin: str) -> Optional[Dict]:
    """Convierte la respuesta de la API de Vueling al formato estándar V4."""
    try:
        dest = item.get("arrivalStation", "") or item.get("destination", "")
        if not dest:
            return None

        price = float(item.get("amount", 0) or item.get("price", 0) or 0)
        if price <= 0:
            return None

        # Fecha de salida
        dep_raw = item.get("departureDate", "") or item.get("date", "")
        date_out = dep_raw[:10] if dep_raw else ""

        # URL de reserva
        booking_url = vueling_url(origin, dest, date_out)

        dist_cat = config.get_distance_category(dest)

        return {
            "source": "vueling",
            "origin": origin,
            "origin_full": origin,
            "destination": dest,
            "city_to": dest,
            "country_to": "",
            "price_eur": round(price, 2),
            "cabin_code": config.CABIN_ECONOMY,
            "cabin": "economy",
            "airline": "VY",
            "airline_name": "Vueling",
            "flight_number": item.get("flightNumber", ""),
            "date_out": date_out,
            "time_out": dep_raw[11:16] if len(dep_raw) > 10 else "",
            "date_ret": "",
            "stops": 0,  # Vueling opera principalmente vuelos directos
            "distance_category": dist_cat,
            "booking_url": booking_url,
        }
    except Exception:
        return None


def _vueling_calendar_to_dict(item: Dict, origin: str, dest: str) -> Optional[Dict]:
    """Convierte entrada de calendario de precios Vueling."""
    try:
        price = float(item.get("amount", 0) or item.get("price", 0) or 0)
        if price <= 0:
            return None

        date_raw = item.get("departureDate", "") or item.get("date", "") or ""
        date_out = date_raw[:10] if date_raw else ""

        booking_url = vueling_url(origin, dest, date_out)
        dist_cat = config.get_distance_category(dest)

        return {
            "source": "vueling",
            "origin": origin,
            "origin_full": origin,
            "destination": dest,
            "city_to": dest,
            "country_to": "",
            "price_eur": round(price, 2),
            "cabin_code": config.CABIN_ECONOMY,
            "cabin": "economy",
            "airline": "VY",
            "airline_name": "Vueling",
            "flight_number": "",
            "date_out": date_out,
            "time_out": "",
            "date_ret": "",
            "stops": 0,
            "distance_category": dist_cat,
            "booking_url": booking_url,
        }
    except Exception:
        return None


class VuelingEngine:
    """
    Motor de búsqueda Vueling — sin API key, datos reales.

    Usa los mismos endpoints JSON que vueling.com internamente.
    Retorna precios en tiempo real para las rutas disponibles.

    Métodos principales:
    - search_cheapest_month(origin, dest, month)
      → Precios día a día de un mes para una ruta
    - search_origin_all_dests(origin, date_from, date_to)
      → Todos los destinos baratos desde un origen
    - search_multi_origins(origins, date_from, date_to)
      → Múltiples orígenes en paralelo
    """

    def __init__(self):
        self.available = True  # No necesita credenciales
        self._semaphore = asyncio.Semaphore(4)

    async def _post(
        self,
        session: aiohttp.ClientSession,
        url: str,
        payload: Dict,
    ) -> Optional[Dict]:
        """POST con manejo de errores."""
        async with self._semaphore:
            try:
                async with session.post(
                    url,
                    json=payload,
                    headers=VUELING_HEADERS,
                    timeout=aiohttp.ClientTimeout(total=20),
                ) as resp:
                    if resp.status != 200:
                        return None
                    return await resp.json(content_type=None)
            except Exception:
                return None

    async def _get(
        self,
        session: aiohttp.ClientSession,
        url: str,
        params: Dict,
    ) -> Optional[Dict]:
        """GET con manejo de errores."""
        async with self._semaphore:
            try:
                async with session.get(
                    url,
                    params=params,
                    headers=VUELING_HEADERS,
                    timeout=aiohttp.ClientTimeout(total=20),
                ) as resp:
                    if resp.status != 200:
                        return None
                    return await resp.json(content_type=None)
            except Exception:
                return None

    async def search_cheapest_month(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destination: str,
        year: int,
        month: int,
    ) -> List[Dict]:
        """
        Precios más baratos día a día para una ruta y mes.
        Endpoint: lowestPrices
        """
        # Construir rango del mes
        date_from = f"{year:04d}-{month:02d}-01"
        if month == 12:
            date_to = f"{year+1:04d}-01-01"
        else:
            date_to = f"{year:04d}-{month+1:02d}-01"

        payload = {
            "departureStation": origin,
            "arrivalStation": destination,
            "beginDate": date_from,
            "endDate": date_to,
            "adults": 1,
            "children": 0,
            "infants": 0,
            "currencyCode": "EUR",
            "market": "es-ES",
        }

        data = await self._post(session, VUELING_SEARCH_URL, payload)
        if not data:
            return []

        flights = []
        # La respuesta puede tener diferentes estructuras
        items = (
            data.get("lowestPrices", []) or
            data.get("availabilityDates", []) or
            data.get("dates", []) or
            data.get("data", []) or
            []
        )

        if isinstance(items, list):
            for item in items:
                f = _vueling_calendar_to_dict(item, origin, destination)
                if f and f["price_eur"] > 0:
                    flights.append(f)
        elif isinstance(items, dict):
            for date_key, item in items.items():
                if isinstance(item, dict):
                    item["date"] = date_key
                    f = _vueling_calendar_to_dict(item, origin, destination)
                    if f and f["price_eur"] > 0:
                        flights.append(f)

        return flights

    async def search_origin_dests(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destinations: List[str],
        date_from: str,
        date_to: str,
    ) -> List[Dict]:
        """
        Busca precios desde un origen a múltiples destinos en un rango de fechas.
        Genera búsquedas por mes para cada (origin, dest).
        """
        # Generar pares (year, month) en el rango
        months = _months_in_range(date_from, date_to)

        tasks = []
        for dest in destinations:
            for (y, m) in months:
                tasks.append(self.search_cheapest_month(session, origin, dest, y, m))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        flights = []
        for r in results:
            if isinstance(r, list):
                flights.extend(r)

        return flights

    async def search_multi_origins(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        destinations: Optional[List[str]] = None,
        max_workers: int = 4,
    ) -> List[Dict]:
        """
        Búsqueda desde múltiples orígenes en paralelo.
        Si no se especifican destinos, usa VUELING_POPULAR_DESTS.
        """
        dests = destinations or VUELING_POPULAR_DESTS

        # Filtrar orígenes con presencia Vueling conocida
        vueling_origins = [o for o in origins if o in VUELING_HUBS] or origins[:10]

        print(f"\n   ✈️  Vueling: {len(vueling_origins)} orígenes × {len(dests)} destinos")

        all_flights: List[Dict] = []
        errors = 0

        async with aiohttp.ClientSession() as session:
            origin_tasks = []
            for origin in vueling_origins:
                origin_tasks.append(
                    self.search_origin_dests(session, origin, dests, date_from, date_to)
                )

            results = await asyncio.gather(*origin_tasks, return_exceptions=True)

        for i, r in enumerate(results):
            if isinstance(r, list) and r:
                all_flights.extend(r)
                origin = vueling_origins[i] if i < len(vueling_origins) else "?"
                prices = [f["price_eur"] for f in r if f["price_eur"] > 0]
                if prices:
                    print(f"      ✅ Vueling {origin}: {len(r)} vuelos (min: {min(prices):.0f}€)")
            else:
                errors += 1

        # Dedup: más barato por (origin, dest, date_out)
        seen: Dict[Tuple, Dict] = {}
        for f in all_flights:
            key = (f["origin"], f["destination"], f["date_out"])
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f

        deduped = list(seen.values())
        print(f"   📊 Vueling total: {len(deduped)} vuelos únicos ({errors} orígenes sin datos)")
        return deduped


# ── Helpers ────────────────────────────────────────────────────────────────────

def _months_in_range(date_from: str, date_to: str) -> List[Tuple[int, int]]:
    """Genera lista de (year, month) entre dos fechas."""
    df = datetime.strptime(date_from, "%Y-%m-%d")
    dt = datetime.strptime(date_to, "%Y-%m-%d")
    months = []
    current = df.replace(day=1)
    while current <= dt:
        months.append((current.year, current.month))
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)
    return months
