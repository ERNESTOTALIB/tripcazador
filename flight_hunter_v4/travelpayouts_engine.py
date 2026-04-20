"""
Flight Hunter V4 — Motor Travelpayouts / Aviasales
====================================================
Sin límite de peticiones. Sin registro adicional.
Token ya configurado: usa Aviasales Data API (cache de precios reales).

Cobertura: 750+ aerolíneas a nivel mundial — complemento perfecto para Ryanair.
Datos: precios cacheados de los últimos tickets disponibles, actualizados
varias veces al día por Aviasales (el mayor agregador de vuelos de Europa
del Este y uno de los más grandes del mundo).

Endpoints usados:
  /v1/prices/cheap        → vuelos baratos por origen (con o sin destino)
  /v1/prices/direct       → solo vuelos directos
  /v1/prices/month-matrix → mejor precio por día de un mes
  /v2/prices/latest       → últimos precios indexados (muy recientes)

Documentación: https://support.travelpayouts.com/hc/en-us/categories/200358578
"""

import asyncio
import aiohttp
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import config
from airline_links import get_booking_url, get_airline_name
from circuit_breaker import get_breaker
from response_cache import ResponseCache

BASE_V1 = "https://api.travelpayouts.com/v1"
BASE_V2 = "https://api.travelpayouts.com/v2"

# Circuit breaker para Travelpayouts (3 fallos → 15 min cooldown)
_BREAKER = get_breaker("travelpayouts")

TOKEN = config.TRAVELPAYOUTS_TOKEN

# TTL del cache de respuestas Travelpayouts. La API devuelve datos
# "cacheados" por Aviasales (se actualizan varias veces al día), así que
# 30 min de cache local no introducen staleness material vs. el upstream.
_CACHE_TTL_SECONDS = 1800


def _tp_to_dict(
    item: Dict,
    origin: str,
    destination: str = "",
    month: str = "",
) -> Optional[Dict]:
    """Convierte una entrada de la Travelpayouts API al formato estándar V4."""
    try:
        # Precio en USD → convertimos: la API devuelve en la divisa del token
        # (normalmente USD). Aplicamos ratio aproximado 1 USD ≈ 0.92 EUR
        # Para mayor precisión, usar currency=EUR en los endpoints que lo soporten.
        price_raw = item.get("price", 0) or item.get("value", 0) or 0
        price = float(price_raw) * 0.92 if price_raw else 0
        if price <= 0:
            return None

        # Destination puede venir en el dict o como parámetro
        dest = item.get("destination", destination) or destination
        if not dest:
            return None

        # Fecha de salida
        depart_date = item.get("departure_at") or item.get("depart_date") or month or ""
        date_out = depart_date[:10] if depart_date else ""

        # Fecha de regreso
        return_date = item.get("return_at") or item.get("return_date") or ""
        date_ret = return_date[:10] if return_date else ""

        # Aerolínea
        airline_code = item.get("airline", "") or ""

        # Número de vuelo / transfers
        transfers = item.get("transfers", -1)
        if transfers == -1:
            transfers = item.get("number_of_changes", 0) or 0
        stops = int(transfers)

        dist_cat = config.get_distance_category(dest)

        # Flight number (si disponible)
        flight_num = item.get("flight_number") or item.get("number", "") or ""

        # URL de reserva — directa a la web de la aerolínea (no Aviasales)
        booking_url = get_booking_url(airline_code, origin, dest, date_out, date_ret)

        # Nombre legible de la aerolínea
        airline_name = get_airline_name(airline_code) if airline_code else ""

        return {
            "source": "travelpayouts",
            "origin": origin,
            "origin_full": origin,
            "destination": dest,
            "city_to": dest,
            "country_to": "",
            "price_eur": round(price, 2),
            "cabin_code": config.CABIN_ECONOMY,
            "cabin": "economy",
            "airline": airline_code,
            "airline_name": airline_name,
            "flight_number": str(flight_num),
            "date_out": date_out,
            "time_out": depart_date[11:16] if len(depart_date) > 10 else "",
            "date_ret": date_ret,
            "time_ret": return_date[11:16] if len(return_date) > 10 else "",
            "stops": stops,
            "distance_category": dist_cat,
            "booking_url": booking_url,
        }
    except Exception as e:
        return None


class TravelpayoutsEngine:
    """
    Motor Travelpayouts / Aviasales para Flight Hunter V4.

    Ventajas frente a RapidAPI:
    - Sin límite mensual de peticiones
    - Cubre 750+ aerolíneas (vs ~250 de Ryanair)
    - Incluye vuelos transatlánticos y long-haul
    - Precios actualizados varias veces al día

    Limitaciones:
    - Datos cacheados (no estrictamente real-time como GDS)
    - No soporta búsqueda de Business class directamente
    - Los deep links abren Aviasales, no la aerolínea directamente

    Estrategia:
    1. cheap_from_origin: /v1/prices/cheap?origin=XXX&destination=-
       → Todos los destinos baratos desde un origen
    2. cheap_route: /v1/prices/cheap?origin=XXX&destination=YYY
       → Todos los vuelos baratos para una ruta concreta
    3. direct_only: /v1/prices/direct?origin=XXX&destination=YYY
       → Solo vuelos directos (para detectar error fares más fácilmente)
    4. month_matrix: /v1/prices/month-matrix?origin=XXX&destination=YYY&month=YYYY-MM
       → Mejor precio por día del mes (para encontrar el día más barato)
    """

    def __init__(self):
        self.token = TOKEN
        self.available = bool(TOKEN)
        self._semaphore = asyncio.Semaphore(6)  # 6 peticiones concurrentes
        if not self.available:
            print("⚠️  TRAVELPAYOUTS_TOKEN no configurado.")
        # Cache de respuestas — single chokepoint en _get() cubre los 4
        # endpoints (cheap, direct, month-matrix, latest). Namespace _v1
        # para invalidar en bloque si cambia el formato upstream.
        self._cache = ResponseCache("travelpayouts_v1")

    def _headers(self) -> Dict:
        return {"X-Access-Token": self.token}

    async def _get(
        self,
        session: aiohttp.ClientSession,
        url: str,
        params: Dict,
    ) -> Optional[Dict]:
        """GET con semáforo de concurrencia y manejo de errores."""
        # Circuit breaker: si Travelpayouts falla repetido, cooldown 15 min
        if not _BREAKER.allow():
            return None

        # Cache check — el token forma parte de la autenticación pero no
        # debe formar parte de la clave (si cambia, no queremos invalidar
        # todo el cache; los datos son los mismos).
        cache_params = {k: v for k, v in params.items() if k != "token"}
        cache_key = self._cache.make_key(url=url, **cache_params)
        cached = self._cache.get(cache_key, ttl_seconds=_CACHE_TTL_SECONDS)
        if cached is not None:
            return cached

        async with self._semaphore:
            try:
                async with session.get(
                    url,
                    params=params,
                    headers=self._headers(),
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    if resp.status == 429:
                        await asyncio.sleep(1)
                        _BREAKER.record_failure("HTTP 429")
                        return None
                    if resp.status not in (200, 201):
                        _BREAKER.record_failure(f"HTTP {resp.status}")
                        return None
                    data = await resp.json()
                    _BREAKER.record_success()
                    # Sólo cacheamos respuestas con contenido útil. Un dict
                    # vacío puede ser una ruta sin inventario pero también
                    # una respuesta degradada — preferimos revalidar.
                    if data:
                        self._cache.set(cache_key, data)
                    return data
            except Exception as e:
                _BREAKER.record_failure(e)
                return None

    # ── CHEAP: todos los destinos desde un origen ──────────────────────────

    async def cheap_from_origin(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        month: str,          # YYYY-MM
        one_way: bool = True,
        direct: bool = False,
    ) -> List[Dict]:
        """
        Precios baratos desde un aeropuerto a CUALQUIER destino.
        Usa destination=- para "anywhere".
        Devuelve hasta ~50 destinos distintos con el vuelo más barato del mes.
        """
        params = {
            "origin": origin,
            "destination": "-",
            "depart_date": month,
            "one_way": str(one_way).lower(),
            "currency": "eur",
            "token": self.token,
        }
        if direct:
            endpoint = f"{BASE_V1}/prices/direct"
        else:
            endpoint = f"{BASE_V1}/prices/cheap"

        data = await self._get(session, endpoint, params)
        if not data:
            return []

        flights = []
        # Formato respuesta: {"data": {"DEST": {"0": {...vuelo...}}}}
        raw = data.get("data", data)

        if isinstance(raw, dict):
            for dest_code, dest_data in raw.items():
                if not isinstance(dest_data, dict):
                    continue
                # Puede ser {"0": {...}} o directamente {...}
                items = dest_data.values() if all(k.isdigit() for k in dest_data.keys() if k) else [dest_data]
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    f = _tp_to_dict(item, origin, destination=dest_code, month=month)
                    if f and f["price_eur"] > 0:
                        flights.append(f)
        elif isinstance(raw, list):
            for item in raw:
                dest_code = item.get("destination", "")
                f = _tp_to_dict(item, origin, destination=dest_code, month=month)
                if f and f["price_eur"] > 0:
                    flights.append(f)

        return flights

    # ── CHEAP: ruta concreta ───────────────────────────────────────────────

    async def cheap_route(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destination: str,
        month: str,
    ) -> List[Dict]:
        """Precios baratos para una ruta específica en un mes."""
        params = {
            "origin": origin,
            "destination": destination,
            "depart_date": month,
            "currency": "eur",
            "token": self.token,
        }
        data = await self._get(session, f"{BASE_V1}/prices/cheap", params)
        if not data:
            return []

        flights = []
        raw = data.get("data", data)
        if isinstance(raw, dict):
            for _, dest_data in raw.items():
                if not isinstance(dest_data, dict):
                    continue
                items = list(dest_data.values()) if all(k.isdigit() for k in dest_data.keys() if k) else [dest_data]
                for item in items:
                    if isinstance(item, dict):
                        f = _tp_to_dict(item, origin, destination=destination, month=month)
                        if f and f["price_eur"] > 0:
                            flights.append(f)
        elif isinstance(raw, list):
            for item in raw:
                f = _tp_to_dict(item, origin, destination=destination, month=month)
                if f and f["price_eur"] > 0:
                    flights.append(f)
        return flights

    # ── MONTH MATRIX: mejor precio por día ────────────────────────────────

    async def month_matrix(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destination: str,
        month: str,
        one_way: bool = True,
    ) -> List[Dict]:
        """
        Mejor precio por cada día del mes para una ruta.
        Ideal para encontrar el día más barato.
        """
        params = {
            "origin": origin,
            "destination": destination,
            "month": month,
            "one_way": str(one_way).lower(),
            "currency": "eur",
            "token": self.token,
        }
        data = await self._get(session, f"{BASE_V1}/prices/month-matrix", params)
        if not data:
            return []

        flights = []
        raw = data.get("data", [])
        if isinstance(raw, list):
            for item in raw:
                f = _tp_to_dict(item, origin, destination=destination, month=month)
                if f and f["price_eur"] > 0:
                    flights.append(f)
        return flights

    # ── LATEST: precios más recientes ─────────────────────────────────────

    async def latest_prices(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destination: str = "",
        period_type: str = "month",
        one_way: bool = False,
        limit: int = 30,
    ) -> List[Dict]:
        """
        Últimos precios indexados por Aviasales para una ruta.
        period_type: "month" | "year"
        Muy útil para rutas long-haul específicas.
        """
        params = {
            "currency": "eur",
            "origin": origin,
            "period_type": period_type,
            "one_way": str(one_way).lower(),
            "limit": str(limit),
            "token": self.token,
        }
        if destination:
            params["destination"] = destination

        data = await self._get(session, f"{BASE_V2}/prices/latest", params)
        if not data:
            return []

        flights = []
        raw = data.get("data", [])
        if isinstance(raw, list):
            for item in raw:
                dest_code = item.get("destination", destination)
                f = _tp_to_dict(item, origin, destination=dest_code)
                if f and f["price_eur"] > 0:
                    flights.append(f)
        return flights

    # ── BÚSQUEDA MULTI-ORIGEN ─────────────────────────────────────────────

    async def search_anywhere_multi(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        direct_only: bool = False,
    ) -> List[Dict]:
        """
        Busca vuelos baratos desde múltiples orígenes a CUALQUIER destino.
        Para cada origen genera los meses en el rango y busca en paralelo.
        Perfecto para descubrir error fares y deals que nunca buscarías.
        """
        if not self.available:
            return []

        # Generar lista de meses en el rango
        months = _months_in_range(date_from, date_to)
        print(f"\n   🌐 Travelpayouts ANYWHERE: {len(origins)} orígenes × {len(months)} meses")

        all_flights: List[Dict] = []
        errors = 0

        async with aiohttp.ClientSession() as session:
            tasks = []
            for origin in origins:
                for month in months:
                    tasks.append(
                        self.cheap_from_origin(session, origin, month, direct=direct_only)
                    )

            results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, r in enumerate(results):
            if isinstance(r, list) and r:
                all_flights.extend(r)
                origin_idx = i // len(months)
                if origin_idx < len(origins):
                    origin = origins[origin_idx]
            elif isinstance(r, Exception) or (isinstance(r, list) and not r):
                errors += 1

        # Dedup: quedarse con el vuelo más barato por (origin, destination, date_out)
        seen: Dict[Tuple, Dict] = {}
        for f in all_flights:
            key = (f["origin"], f["destination"], f["date_out"])
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f

        deduped = list(seen.values())
        print(f"   📊 Travelpayouts ANYWHERE: {len(deduped)} vuelos únicos ({errors} errores)")
        return deduped

    async def search_long_haul_multi(
        self,
        origins: List[str],
        destinations: List[str],
        date_from: str,
        date_to: str,
    ) -> List[Dict]:
        """
        Busca rutas long-haul específicas (transatlántico, Asia, etc.).
        Usa latest_prices para máxima frescura de datos.
        """
        if not self.available:
            return []

        print(f"\n   🌍 Travelpayouts LONG-HAUL: {len(origins)} orígenes × {len(destinations)} destinos")

        all_flights: List[Dict] = []

        async with aiohttp.ClientSession() as session:
            tasks = []
            for origin in origins:
                for dest in destinations:
                    tasks.append(self.latest_prices(session, origin, dest, limit=10))

            results = await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            if isinstance(r, list):
                all_flights.extend(r)

        # Dedup
        seen: Dict[Tuple, Dict] = {}
        for f in all_flights:
            key = (f["origin"], f["destination"], f["date_out"])
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f

        deduped = list(seen.values())
        print(f"   📊 Travelpayouts LONG-HAUL: {len(deduped)} rutas encontradas")
        return deduped

    async def search_error_hunter_full(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        include_long_haul: bool = True,
    ) -> List[Dict]:
        """
        Modo completo: búsqueda anywhere + long-haul en paralelo.
        Maximiza la cobertura para detectar error fares.
        """
        anywhere_task = self.search_anywhere_multi(origins, date_from, date_to)

        if include_long_haul:
            # Destinos long-haul prioritarios (los que Ryanair no cubre)
            priority_long_haul = config.DEST_VOLATILES_PRIORITARIOS + [
                "JFK", "LAX", "MIA", "YYZ", "GRU", "EZE",
                "DXB", "DOH", "BKK", "SIN", "NRT", "ICN",
                "JNB", "CPT", "SYD", "MLE", "CMN",
            ]
            priority_long_haul = list(dict.fromkeys(priority_long_haul))  # dedup
            lh_task = self.search_long_haul_multi(origins, priority_long_haul, date_from, date_to)
            anywhere, long_haul = await asyncio.gather(anywhere_task, lh_task)
            combined = anywhere + long_haul
        else:
            combined = await anywhere_task

        # Dedup final
        seen: Dict[Tuple, Dict] = {}
        for f in combined:
            key = (f["origin"], f["destination"], f["date_out"])
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f

        deduped = list(seen.values())
        print(f"\n   🔀 Travelpayouts total (sin duplicados): {len(deduped)} vuelos únicos")
        return deduped


# ── Helpers ────────────────────────────────────────────────────────────────

def _months_in_range(date_from: str, date_to: str) -> List[str]:
    """Genera lista de meses YYYY-MM entre dos fechas."""
    df = datetime.strptime(date_from, "%Y-%m-%d")
    dt = datetime.strptime(date_to, "%Y-%m-%d")
    months = []
    current = df.replace(day=1)
    while current <= dt:
        months.append(current.strftime("%Y-%m"))
        # Avanzar un mes
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)
    return months
