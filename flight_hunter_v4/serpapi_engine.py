"""
Flight Hunter V4 — Motor Business/Premium (Google Flights vía SerpAPI)
=======================================================================
Busca vuelos Business, Premium Economy y First Class usando Google Flights
a través de SerpAPI. Datos en tiempo real — mismo motor que usa google.com/flights.

Por qué SerpAPI para Business:
  - Google Flights tiene los mejores precios de Business a nivel mundial
  - Cubre TODAS las aerolíneas: Emirates, Qatar, Lufthansa, Singapore...
  - Permite comparar Economy vs Business en la misma ruta (ratio B/E)
  - Datos 100% reales, actualizados en tiempo real
  - Límite: 100 búsquedas/mes (en el plan gratuito)

Estrategia de búsqueda inteligente:
  - Solo rutas LONG-HAUL donde Business tiene sentido (>4h de vuelo)
  - Busca Economy + Business en la misma llamada (2-for-1)
  - Selecciona el mes más barato del rango (usa Travelpayouts como guía)
  - Prioriza rutas donde el ratio B/E tiende a ser sorprendentemente bajo

Presupuesto de llamadas (100/mes):
  - 5 hubs europeos × 10 destinos long-haul = 50 rutas
  - 2 cabinas (Economy + Business) = 100 llamadas exactas

Hubs cubiertos (configurable):
  CDG, FRA, ZRH, GVA, MUC (los 5 mejores para Business desde Europa central)

Destinos long-haul cubiertos:
  Norteamérica: JFK, LAX, MIA, ORD, YYZ
  Asia: NRT, DXB, BKK, SIN, HKG, DOH, ICN
  Latinoamérica: GRU, EZE
  Oceanía: SYD
"""

import asyncio
import aiohttp
import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple
import config
from airline_links import get_booking_url, get_airline_name, name_to_iata
from circuit_breaker import get_breaker

SERPAPI_BASE = "https://serpapi.com/search"
SERPAPI_KEY  = config.SERPAPI_KEY

# Circuit breaker para SerpAPI: tras 3 fallos consecutivos se abre y no se
# realizan más llamadas durante 15 minutos (ahorra cuota + tiempo cuando
# hay outage). Compartido entre todas las instancias de SerpAPIEngine.
_BREAKER = get_breaker("serpapi")

# Cabinas Google Flights
CABIN_GF = {
    "economy":         1,
    "premium_economy": 2,
    "business":        3,
    "first":           4,
}
CABIN_GF_TO_V4 = {1: config.CABIN_ECONOMY, 2: config.CABIN_PREMIUM_ECONOMY,
                   3: config.CABIN_BUSINESS, 4: config.CABIN_FIRST}
CABIN_GF_TO_NAME = {1: "economy", 2: "premium economy", 3: "business", 4: "first"}

# Rutas long-haul prioritarias para Business Hunter
# (origen: lista de destinos interesantes para esa cabecera)
LONG_HAUL_ROUTES = {
    # Norte: Escandinavia, Islandia
    "CDG": ["JFK","LAX","NRT","DXB","BKK","SIN","DOH","ICN","GRU","SYD"],
    "FRA": ["JFK","LAX","NRT","DXB","BKK","SIN","DOH","ICN","ORD","SYD"],
    "ZRH": ["JFK","LAX","NRT","DXB","BKK","SIN","DOH","ICN","GRU","MIA"],
    "GVA": ["JFK","LAX","NRT","DXB","BKK","SIN","DOH","ICN","GRU","YYZ"],
    "MUC": ["JFK","LAX","NRT","DXB","BKK","SIN","DOH","ICN","ORD","EZE"],
    "AMS": ["JFK","LAX","NRT","DXB","BKK","SIN","DOH","ICN","GRU","SYD"],
    "LHR": ["JFK","LAX","NRT","DXB","BKK","SIN","DOH","ICN","GRU","SYD"],
    "MAD": ["JFK","LAX","MIA","GRU","EZE","BOG","SCL","LIM","NRT","DXB"],
    "BCN": ["JFK","LAX","MIA","GRU","EZE","BOG","NRT","DXB","BKK","SIN"],
}

# Destinos longhaul por interés (cuánto merece buscar Business)
LONGHAUL_PRIORITY = [
    "JFK","NRT","DXB","SIN","BKK","LAX","HKG","DOH","ICN","SYD",
    "GRU","ORD","MIA","EZE","YYZ","LOS","CPT","NBO","BOM","DEL",
]


def _gf_flight_to_dict(
    flight_data: Dict,
    origin: str,
    destination: str,
    cabin_code_gf: int,
    date_out: str,
    date_ret: str = "",
) -> Optional[Dict]:
    """Convierte el resultado de Google Flights (SerpAPI) al formato estándar V4."""
    try:
        price = float(flight_data.get("price", 0) or 0)
        if price <= 0:
            return None

        cabin_v4   = CABIN_GF_TO_V4.get(cabin_code_gf, config.CABIN_ECONOMY)
        cabin_name = CABIN_GF_TO_NAME.get(cabin_code_gf, "economy")

        # Aerolínea principal (primer vuelo del itinerario)
        flights = flight_data.get("flights", [{}])
        first   = flights[0] if flights else {}

        # SerpAPI devuelve nombre completo en "airline", no código IATA
        airline_raw  = first.get("airline", "")  # ej: "Air France", "Condor"
        airline_iata = name_to_iata(airline_raw) if airline_raw else ""
        # Intentar extraer IATA del logo URL si el nombre no coincidió
        if not airline_iata or len(airline_iata) > 3:
            logo = first.get("airline_logo", "")
            # URL formato: ".../XX.png" o "airline_logo_XX"
            parts = logo.replace(".png","").split("/")
            candidate = parts[-1].upper() if parts else ""
            if 2 <= len(candidate) <= 3:
                airline_iata = candidate

        # Tiempo de vuelo total
        total_dur = flight_data.get("total_duration", 0)
        stops     = flight_data.get("layovers", [])
        n_stops   = len(stops) if isinstance(stops, list) else 0

        # Si hay varios vuelos, tomamos info del primero
        dep_time  = first.get("departure_airport", {}).get("time", "") if first else ""
        dep_date  = dep_time[:10] if dep_time and len(dep_time) >= 10 else date_out

        dist_cat  = config.get_distance_category(destination)
        booking   = get_booking_url(airline_iata, origin, destination, dep_date or date_out, date_ret)
        al_name   = get_airline_name(airline_iata) if airline_iata else first.get("airline", "?")

        return {
            "source":            "serpapi",
            "origin":            origin,
            "origin_full":       origin,
            "destination":       destination,
            "city_to":           destination,
            "country_to":        "",
            "price_eur":         round(price, 2),
            "cabin_code":        cabin_v4,
            "cabin":             cabin_name,
            "airline":           airline_iata,
            "airline_name":      al_name,
            "flight_number":     first.get("flight_number", ""),
            "date_out":          dep_date or date_out,
            "time_out":          dep_time[11:16] if dep_time and len(dep_time) > 10 else "",
            "date_ret":          date_ret,
            "time_ret":          "",
            "stops":             n_stops,
            "duration_min":      total_dur,
            "distance_category": dist_cat,
            "booking_url":       booking,
            # Campos extra para ratio B/E
            "gf_cabin_gf":       cabin_code_gf,
            "gf_total_duration": total_dur,
        }
    except Exception as exc:  # noqa: BLE001
        # SSS189: schema parse error. Antes silent → 0 deals individuales sin
        # señal del schema change de Google Flights.
        print(
            f"   ⚠️  SerpAPI _gf_flight_to_dict parse error: {type(exc).__name__}: {exc}",
            flush=True,
        )
        return None


class SerpAPIEngine:
    """
    Motor Google Flights (SerpAPI) para Business/Premium Economy/First Class.

    Gestiona el presupuesto de llamadas (100/mes) buscando rutas long-haul
    de forma inteligente. Detecta ratio Business/Economy automáticamente.

    Uso típico:
        engine = SerpAPIEngine()
        deals  = await engine.search_business_routes(
            origins=["CDG","FRA","ZRH"],
            date_from="2026-06-01",
            date_to="2026-08-31",
        )
    """

    def __init__(self):
        self.key = SERPAPI_KEY
        self.available = bool(self.key)
        self._semaphore = asyncio.Semaphore(3)  # SerpAPI: máx 3 concurrentes

    async def _search_one(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destination: str,
        outbound_date: str,
        cabin_gf: int,
        return_date: str = "",
        currency: str = "EUR",
    ) -> List[Dict]:
        """Una búsqueda Google Flights → lista de vuelos."""
        # Circuit breaker: si SerpAPI ha fallado 3+ veces seguidas, no
        # gastamos cuota durante 15 min.
        if not _BREAKER.allow():
            return []

        async with self._semaphore:
            params = {
                "engine":         "google_flights",
                "departure_id":   origin,
                "arrival_id":     destination,
                "outbound_date":  outbound_date,
                "travel_class":   str(cabin_gf),
                "adults":         "1",
                "currency":       currency,
                "hl":             "es",
                "gl":             "es",
                "api_key":        self.key,
            }
            if return_date:
                params["return_date"] = return_date
                params["type"] = "1"   # round-trip
            else:
                params["type"] = "2"   # one-way

            try:
                async with session.get(
                    SERPAPI_BASE,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=25),
                ) as resp:
                    if resp.status != 200:
                        # SSS189 (15 may 2026): además de _BREAKER, log status
                        # + body snippet para que GH Actions logs muestren causa
                        # real (429 rate-limit, 401 key inválida, 5xx).
                        body = ""
                        try:
                            body = (await resp.text())[:200]
                        except Exception:  # noqa: BLE001
                            body = "<failed to read body>"
                        print(
                            f"   ❌ SerpAPI search HTTP {resp.status} body={body}",
                            flush=True,
                        )
                        _BREAKER.record_failure(f"HTTP {resp.status}")
                        return []
                    data = await resp.json()
                    _BREAKER.record_success()
            except Exception as e:
                # SSS189: log exception además de _BREAKER. Antes silent →
                # cuando el motor caía no sabíamos si era network, parse, o auth.
                print(
                    f"   ❌ SerpAPI search exception: {type(e).__name__}: {e}",
                    flush=True,
                )
                _BREAKER.record_failure(e)
                return []

        flights_raw = (
            data.get("best_flights", []) +
            data.get("other_flights", [])
        )

        results = []
        for f in flights_raw[:5]:  # máx 5 opciones por búsqueda
            v4 = _gf_flight_to_dict(f, origin, destination, cabin_gf,
                                    outbound_date, return_date)
            if v4 and v4["price_eur"] > 0:
                results.append(v4)

        return results

    async def search_route_both_cabins(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destination: str,
        date_out: str,
        include_business: bool = True,
        include_economy: bool = True,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Busca Economy + Business para la misma ruta y fecha.
        Devuelve (eco_flights, biz_flights).
        Consume 1-2 créditos SerpAPI.
        """
        tasks = []
        if include_economy:
            tasks.append(self._search_one(session, origin, destination, date_out, 1))
        if include_business:
            tasks.append(self._search_one(session, origin, destination, date_out, 3))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        eco = results[0] if include_economy and isinstance(results[0], list) else []
        idx = 1 if include_economy else 0
        biz = results[idx] if include_business and len(results) > idx and isinstance(results[idx], list) else []

        return eco, biz

    def _best_date_in_range(self, date_from: str, date_to: str) -> str:
        """
        Elige la mejor fecha para buscar en el rango.
        Estrategia: usar una fecha a ~6 semanas de hoy (precios más estables).
        """
        today = date.today()
        df = datetime.strptime(date_from, "%Y-%m-%d").date()
        dt = datetime.strptime(date_to, "%Y-%m-%d").date()

        # Target: 6 semanas en el futuro, dentro del rango
        target = max(df, today + timedelta(weeks=6))
        target = min(target, dt - timedelta(days=7))

        # Preferir jueves (vuelos suelen ser más baratos mid-week)
        while target.weekday() != 3:  # 3 = Thursday
            target += timedelta(days=1)
            if target > dt:
                target = df + (dt - df) // 2  # fallback: mitad del rango
                break

        return target.strftime("%Y-%m-%d")

    async def search_business_routes(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        destinations: Optional[List[str]] = None,
        max_api_calls: int = 80,
        include_premium_economy: bool = True,
        include_first: bool = False,
    ) -> List[Dict]:
        """
        Business Hunter: busca Business + Economy en rutas long-haul.

        - Para cada par (origin, dest), hace 2 búsquedas: Economy + Business
        - Calcula ratio B/E y guarda en el dict del vuelo business
        - Prioriza los pares con más diferencia de precio esperada

        Args:
            origins:      Aeropuertos de origen (usa hubs en LONG_HAUL_ROUTES si no)
            date_from/to: Rango de fechas (elige la mejor fecha automáticamente)
            destinations: Destinos long-haul (usa LONGHAUL_PRIORITY si no)
            max_api_calls: Budget de llamadas API (default 80 para margen)

        Returns:
            Lista de vuelos en formato V4 estándar con campos extra:
            - biz_ratio: precio business / precio economy
            - biz_eco_price: precio economy correspondiente
            - biz_saving: ahorro en € vs precio medio business histórico
        """
        if not self.available:
            print("⚠️  SerpAPI key no configurada. Business Hunter desactivado.")
            return []

        # Filtrar orígenes conocidos en LONG_HAUL_ROUTES
        hub_origins = [o for o in origins if o in LONG_HAUL_ROUTES]
        if not hub_origins:
            hub_origins = origins[:5]  # usar los 5 primeros

        dests = destinations or LONGHAUL_PRIORITY

        # Calcular cuántas rutas caben en el budget
        # Por ruta: Economy + Business = 2 llamadas
        # (+ Premium Economy si se pide = 3 llamadas por ruta)
        calls_per_route = 2 + (1 if include_premium_economy else 0) + (1 if include_first else 0)
        max_routes = max_api_calls // calls_per_route

        # Crear pares (origin, dest) priorizados
        pairs: List[Tuple[str, str]] = []
        for origin in hub_origins:
            hub_dests = LONG_HAUL_ROUTES.get(origin, dests[:10])
            for dest in hub_dests:
                if dest in dests:
                    pairs.append((origin, dest))
            if len(pairs) >= max_routes:
                break

        pairs = pairs[:max_routes]

        # Elegir la mejor fecha en el rango
        search_date = self._best_date_in_range(date_from, date_to)

        print(f"\n   👑 SerpAPI Business Hunter: {len(pairs)} rutas × {calls_per_route} cabinas")
        print(f"      Fecha búsqueda: {search_date} | Presupuesto: ~{len(pairs)*calls_per_route} llamadas")

        all_eco: Dict[Tuple, float] = {}   # (origin, dest) → precio mínimo economy
        all_flights: List[Dict] = []
        success = 0
        errors  = 0

        async with aiohttp.ClientSession() as session:
            for origin, dest in pairs:
                cabins_to_search = [1, 3]  # Economy + Business
                if include_premium_economy:
                    cabins_to_search.append(2)
                if include_first:
                    cabins_to_search.append(4)

                cabin_tasks = [
                    self._search_one(session, origin, dest, search_date, cabin_gf)
                    for cabin_gf in cabins_to_search
                ]
                cabin_results = await asyncio.gather(*cabin_tasks, return_exceptions=True)

                eco_price = None
                for i, cabin_gf in enumerate(cabins_to_search):
                    r = cabin_results[i] if i < len(cabin_results) else []
                    if not isinstance(r, list) or not r:
                        errors += 1
                        continue

                    cheapest = min(r, key=lambda x: x["price_eur"])

                    if cabin_gf == 1:  # Economy
                        eco_price = cheapest["price_eur"]
                        all_eco[(origin, dest)] = eco_price
                    else:
                        all_flights.append(cheapest)
                        success += 1

                # Calcular ratios B/E
                if eco_price:
                    for f in all_flights:
                        if f["origin"] == origin and f["destination"] == dest:
                            if "biz_ratio" not in f:
                                ratio = f["price_eur"] / eco_price if eco_price > 0 else 0
                                f["biz_ratio"]     = round(ratio, 2)
                                f["biz_eco_price"] = eco_price
                                f["biz_eco_class"] = "economy"

        # Añadir también los vuelos Economy con metadata de ratio disponible
        eco_flights = []
        for (origin, dest), price in all_eco.items():
            biz_price = next(
                (f["price_eur"] for f in all_flights
                 if f["origin"] == origin and f["destination"] == dest
                 and f["cabin_code"] == config.CABIN_BUSINESS),
                None,
            )
            eco_flights.append({
                "source": "serpapi",
                "origin": origin,
                "origin_full": origin,
                "destination": dest,
                "city_to": dest,
                "country_to": "",
                "price_eur": round(price, 2),
                "cabin_code": config.CABIN_ECONOMY,
                "cabin": "economy",
                "airline": "",
                "airline_name": "",
                "flight_number": "",
                "date_out": search_date,
                "date_ret": "",
                "stops": 0,
                "distance_category": config.get_distance_category(dest),
                "booking_url": f"https://www.kayak.es/flights/{origin}-{dest}/{search_date}?sort=price_a",
                "biz_price_available": biz_price,
                "biz_ratio": round(biz_price / price, 2) if biz_price and price > 0 else None,
            })

        print(f"   ✅ SerpAPI: {success} vuelos premium ({len(eco_flights)} comparativas eco) | {errors} errores")

        return all_flights + eco_flights

    async def search_specific_route(
        self,
        origin: str,
        destination: str,
        date_out: str,
        cabin: str = "business",
    ) -> List[Dict]:
        """
        Búsqueda puntual de una ruta específica en una cabina concreta.
        Útil para verificar un precio antes de comprar.
        """
        if not self.available:
            return []

        cabin_gf = CABIN_GF.get(cabin.lower(), 3)
        async with aiohttp.ClientSession() as session:
            return await self._search_one(session, origin, destination, date_out, cabin_gf)

    async def compare_cabins(
        self,
        origin: str,
        destination: str,
        date_out: str,
    ) -> Dict:
        """
        Compara Economy, Premium Economy y Business para una ruta y fecha.
        Devuelve dict con precios y ratio B/E.
        """
        if not self.available:
            return {}

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._search_one(session, origin, destination, date_out, 1),  # Economy
                self._search_one(session, origin, destination, date_out, 2),  # Premium Eco
                self._search_one(session, origin, destination, date_out, 3),  # Business
            ]
            eco_res, prem_res, biz_res = await asyncio.gather(*tasks, return_exceptions=True)

        eco_price  = min((f["price_eur"] for f in eco_res),  default=0) if isinstance(eco_res,  list) else 0
        prem_price = min((f["price_eur"] for f in prem_res), default=0) if isinstance(prem_res, list) else 0
        biz_price  = min((f["price_eur"] for f in biz_res),  default=0) if isinstance(biz_res,  list) else 0

        return {
            "route":      f"{origin}→{destination}",
            "date":       date_out,
            "economy":    eco_price,
            "premium":    prem_price,
            "business":   biz_price,
            "ratio_b_e":  round(biz_price / eco_price, 2) if eco_price > 0 else None,
            "ratio_b_pe": round(biz_price / prem_price, 2) if prem_price > 0 else None,
            "eco_flights":  eco_res  if isinstance(eco_res,  list) else [],
            "biz_flights":  biz_res  if isinstance(biz_res,  list) else [],
            "prem_flights": prem_res if isinstance(prem_res, list) else [],
        }
