"""
Flight Hunter V4 — Motor Kiwi Tequila (Fuente Primaria)
=========================================================
MEJORAS CLAVE sobre V2:

1. MODO "ANYWHERE": fly_to=anywhere → busca los vuelos más baratos desde
   cualquier aeropuerto europeo a CUALQUIER destino del mundo en una sola llamada.
   → Descubre oportunidades que nunca buscarías con rutas fijas.

2. BÚSQUEDA POR RANGO DE FECHAS: date_from/date_to permite buscar en un
   mes completo en lugar de día a día. Kiwi devuelve el precio mínimo del período.
   → 1 llamada = mejor precio en 30 días.

3. BUSINESS + ECONOMY SIMULTÁNEO: lanza ambas búsquedas en paralelo para
   el mismo origen y detecta el ratio automáticamente.
   → Detecta Business a precio de Economy sin trabajo extra.

4. 60+ ORÍGENES EN PARALELO: con la API gratuita de Kiwi podemos lanzar
   todas las búsquedas simultáneamente con semáforo controlado.
   → De 23 aeropuertos a 65+ sin coste adicional.

5. RESULTADO UNIFICADO: todos los resultados siguen el mismo schema
   compatible con el detector y la base de datos.

API Kiwi Tequila: https://tequila.kiwi.com/portal/docs/tequila_api
Registro gratuito: https://tequila.kiwi.com/portal/login
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Tuple, Dict, Optional
import config
from circuit_breaker import get_breaker

# Circuit breaker global para Kiwi (compartido entre instancias).
# Tras 3 fallos consecutivos: 15 min de cooldown.
_BREAKER = get_breaker("kiwi")


class KiwiEngineV4:
    """
    Motor de búsqueda Kiwi V4: anywhere, rangos de fecha, Business/Economy dual.
    """

    SEARCH_URL = "https://tequila-api.kiwi.com/v2/search"

    def __init__(self, api_key: str = None):
        self.api_key = api_key or config.KIWI_API_KEY
        self.available = bool(self.api_key)
        self.searches_used = 0
        self._rate_limit_delay = config.KIWI_RATE_LIMIT_DELAY

        if not self.available:
            print("⚠️  Kiwi API key no configurada.")
            print("   → Registrar GRATIS en: https://tequila.kiwi.com/portal/login")
            print("   → export KIWI_API_KEY=tu_key_aqui")

    # ──────────────────────────────────────────
    # MODO 1: ANYWHERE — El más potente
    # ──────────────────────────────────────────

    async def search_anywhere(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        cabin: int = config.CABIN_ECONOMY,
        nights_min: int = 5,
        nights_max: int = 21,
        max_concurrent: int = None,
        max_results_per_origin: int = 50,
    ) -> List[Dict]:
        """
        Busca los vuelos más baratos desde cada origen europeo hacia
        CUALQUIER destino del mundo. Esta es la búsqueda más potente:
        descubre deals que nunca buscarías con rutas fijas.

        Args:
            origins: Lista de códigos IATA de origen (ej: EUROPEAN_AIRPORTS_TIER1)
            date_from: Fecha inicio del rango (YYYY-MM-DD)
            date_to: Fecha fin del rango (YYYY-MM-DD)
            cabin: Clase de cabina (CABIN_ECONOMY, CABIN_BUSINESS, etc.)
            nights_min: Mínimo noches en destino
            nights_max: Máximo noches en destino
            max_concurrent: Peticiones paralelas simultáneas
            max_results_per_origin: Máximo resultados por aeropuerto origen

        Returns:
            Lista de vuelos ordenados por precio
        """
        if not self.available:
            return []

        if max_concurrent is None:
            max_concurrent = config.KIWI_MAX_CONCURRENT

        cabin_name = config.CABIN_NAMES.get(cabin, "Economy")
        kiwi_cabin = config.KIWI_CABIN_MAP.get(cabin, "M")
        total = len(origins)

        print(f"\n🌍 ANYWHERE SEARCH — {cabin_name.upper()}")
        print(f"   Orígenes: {total} aeropuertos europeos")
        print(f"   Rango: {date_from} → {date_to}")
        print(f"   Estancia: {nights_min}-{nights_max} noches")
        print(f"   Paralelo: {max_concurrent} simultáneas\n")

        all_flights = []
        done = 0
        semaphore = asyncio.Semaphore(max_concurrent)
        timeout = aiohttp.ClientTimeout(total=60)

        async with aiohttp.ClientSession(timeout=timeout) as session:

            async def search_one_origin(origin: str) -> List[Dict]:
                nonlocal done
                async with semaphore:
                    done += 1
                    print(f"   [{done:02d}/{total}] {origin} → 🌍 anywhere [{cabin_name}]", flush=True)

                    params = {
                        "fly_from": origin,
                        "fly_to": "anywhere",
                        "date_from": self._to_kiwi_date(date_from),
                        "date_to": self._to_kiwi_date(date_to),
                        "flight_type": "round",
                        "adults": 1,
                        "selected_cabins": kiwi_cabin,
                        "curr": "EUR",
                        "locale": "es",
                        "nights_in_dst_from": nights_min,
                        "nights_in_dst_to": nights_max,
                        "max_stopovers": config.KIWI_MAX_STOPOVERS,
                        "limit": max_results_per_origin,
                        "sort": "price",
                        "asc": 1,
                    }

                    flights = await self._make_request(session, params, origin, "anywhere", cabin, cabin_name)
                    if flights:
                        cheapest = min(f["price_eur"] for f in flights)
                        print(f"      ✅ {len(flights)} deals (mejor: {cheapest:.0f}€ {cabin_name})", flush=True)
                    else:
                        print(f"      — Sin resultados", flush=True)

                    await asyncio.sleep(self._rate_limit_delay)
                    return flights

            tasks = [search_one_origin(origin) for origin in origins]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for r in results:
                if isinstance(r, list):
                    all_flights.extend(r)

        print(f"\n   📊 ANYWHERE total: {len(all_flights)} deals [{cabin_name}]")
        return sorted(all_flights, key=lambda x: x["price_eur"])

    # ──────────────────────────────────────────
    # MODO 2: BUSINESS HUNTER — Economy + Business simultáneo
    # ──────────────────────────────────────────

    async def search_business_hunter(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        nights_min: int = 5,
        nights_max: int = 21,
        max_concurrent: int = None,
        target_destinations: List[str] = None,
    ) -> Dict[str, List[Dict]]:
        """
        Busca Economy Y Business simultáneamente para detectar ratio B/E.
        Devuelve un dict con 'economy', 'business', y 'anomalies'.

        El MODO MÁS POTENTE para encontrar Business a precio de Economy:
        cuando el ratio Business/Economy es < 2-3x, hay una anomalía clara.

        Args:
            origins: Lista de orígenes europeos
            date_from/date_to: Rango de fechas
            nights_min/max: Estancia en destino
            target_destinations: Si se especifica, solo busca estas rutas (opcional)

        Returns:
            Dict con keys: 'economy', 'business', 'anomalies', 'ratio_stats'
        """
        if not self.available:
            return {"economy": [], "business": [], "anomalies": [], "ratio_stats": {}}

        if max_concurrent is None:
            max_concurrent = config.KIWI_MAX_CONCURRENT

        print(f"\n✈️  BUSINESS HUNTER — Búsqueda dual Economy + Business")
        print(f"   Orígenes: {len(origins)} aeropuertos")
        print(f"   Rango: {date_from} → {date_to}")
        print(f"   Detectando ratio Business/Economy < 3x...\n")

        # Lanzar ambas búsquedas en paralelo
        if target_destinations:
            # Búsqueda específica de rutas
            eco_task = self.search_routes_range(
                origins, target_destinations, date_from, date_to,
                cabin=config.CABIN_ECONOMY, nights_min=nights_min, nights_max=nights_max,
                max_concurrent=max_concurrent,
            )
            biz_task = self.search_routes_range(
                origins, target_destinations, date_from, date_to,
                cabin=config.CABIN_BUSINESS, nights_min=nights_min, nights_max=nights_max,
                max_concurrent=max_concurrent,
            )
        else:
            # Búsqueda "anywhere"
            eco_task = self.search_anywhere(
                origins, date_from, date_to,
                cabin=config.CABIN_ECONOMY, nights_min=nights_min, nights_max=nights_max,
                max_concurrent=max_concurrent,
            )
            biz_task = self.search_anywhere(
                origins, date_from, date_to,
                cabin=config.CABIN_BUSINESS, nights_min=nights_min, nights_max=nights_max,
                max_concurrent=max_concurrent,
            )

        eco_flights, biz_flights = await asyncio.gather(eco_task, biz_task)

        # Calcular ratios Business/Economy por ruta
        anomalies = self._detect_ratio_anomalies(eco_flights, biz_flights)

        ratio_stats = self._compute_ratio_stats(eco_flights, biz_flights)

        print(f"\n   📊 Economy: {len(eco_flights)} | Business: {len(biz_flights)}")
        print(f"   🚨 Anomalías B/E ratio: {len([a for a in anomalies if a['bec_class'] == 'ERROR'])}")
        print(f"   ⚠️  Deals B/E ratio: {len([a for a in anomalies if a['bec_class'] in ['ANOMALIA', 'OFERTA']])}")

        return {
            "economy": eco_flights,
            "business": biz_flights,
            "anomalies": anomalies,
            "ratio_stats": ratio_stats,
        }

    # ──────────────────────────────────────────
    # MODO 3: BÚSQUEDA POR RANGO DE FECHAS
    # ──────────────────────────────────────────

    async def search_routes_range(
        self,
        origins: List[str],
        destinations: List[str],
        date_from: str,
        date_to: str,
        cabin: int = config.CABIN_ECONOMY,
        nights_min: int = 5,
        nights_max: int = 21,
        max_concurrent: int = None,
    ) -> List[Dict]:
        """
        Busca rutas específicas en un rango de fechas completo.
        Kiwi devuelve el precio mínimo disponible en todo el período.
        Mucho más eficiente que buscar día a día.

        Args:
            origins: Lista de orígenes (ej: ["CDG", "FRA", "AMS"])
            destinations: Lista de destinos (ej: ["JFK", "BKK", "NRT"])
            date_from/date_to: Rango de búsqueda (ej: "2026-06-01", "2026-08-31")
        """
        if not self.available:
            return []

        if max_concurrent is None:
            max_concurrent = config.KIWI_MAX_CONCURRENT

        cabin_name = config.CABIN_NAMES.get(cabin, "Economy")
        kiwi_cabin = config.KIWI_CABIN_MAP.get(cabin, "M")
        routes = [(o, d) for o in origins for d in destinations]
        total = len(routes)
        done = 0

        print(f"\n🗺️  ROUTES RANGE — {cabin_name.upper()}")
        print(f"   {len(origins)} orígenes × {len(destinations)} destinos = {total} rutas")
        print(f"   Rango: {date_from} → {date_to}\n")

        all_flights = []
        semaphore = asyncio.Semaphore(max_concurrent)
        timeout = aiohttp.ClientTimeout(total=60)

        async with aiohttp.ClientSession(timeout=timeout) as session:

            async def search_one(origin: str, dest: str) -> List[Dict]:
                nonlocal done
                async with semaphore:
                    done += 1
                    print(f"   [{done:03d}/{total}] {origin}→{dest} [{cabin_name}]", flush=True)

                    params = {
                        "fly_from": origin,
                        "fly_to": dest,
                        "date_from": self._to_kiwi_date(date_from),
                        "date_to": self._to_kiwi_date(date_to),
                        "flight_type": "round",
                        "adults": 1,
                        "selected_cabins": kiwi_cabin,
                        "curr": "EUR",
                        "locale": "es",
                        "nights_in_dst_from": nights_min,
                        "nights_in_dst_to": nights_max,
                        "max_stopovers": config.KIWI_MAX_STOPOVERS,
                        "limit": 10,
                        "sort": "price",
                        "asc": 1,
                    }

                    flights = await self._make_request(session, params, origin, dest, cabin, cabin_name)
                    if flights:
                        cheapest = min(f["price_eur"] for f in flights)
                        print(f"      ✅ {len(flights)} | mejor: {cheapest:.0f}€", flush=True)

                    await asyncio.sleep(self._rate_limit_delay)
                    return flights

            tasks = [search_one(o, d) for o, d in routes]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for r in results:
                if isinstance(r, list):
                    all_flights.extend(r)

        print(f"\n   📊 Routes Range: {len(all_flights)} vuelos [{cabin_name}]")
        return all_flights

    # ──────────────────────────────────────────
    # NÚCLEO: HTTP Request con reintentos
    # ──────────────────────────────────────────

    async def _make_request(
        self, session: aiohttp.ClientSession,
        params: dict, origin: str, dest: str,
        cabin: int, cabin_name: str,
        retries: int = 2,
    ) -> List[Dict]:
        """Hace la petición a Kiwi con manejo de errores y reintentos."""
        if not self.api_key:
            return []

        # Circuit breaker: si Kiwi lleva 3 fallos seguidos, saltamos 15 min
        if not _BREAKER.allow():
            return []

        headers = {"apikey": self.api_key}

        for attempt in range(retries + 1):
            try:
                async with session.get(
                    self.SEARCH_URL, params=params, headers=headers
                ) as resp:
                    self.searches_used += 1

                    if resp.status == 200:
                        data = await resp.json()
                        _BREAKER.record_success()
                        return self._parse_response(data, origin, dest, cabin, cabin_name)

                    elif resp.status == 429:
                        wait = 5 * (attempt + 1)
                        print(f"      ⏳ Rate limit — esperar {wait}s...", flush=True)
                        await asyncio.sleep(wait)
                        continue

                    elif resp.status == 403:
                        if not hasattr(self, "_auth_error_shown"):
                            print(f"      ❌ Kiwi API key inválida o expirada", flush=True)
                            self._auth_error_shown = True
                        self.available = False
                        _BREAKER.record_failure(f"HTTP 403")
                        return []

                    elif resp.status in (500, 502, 503):
                        if attempt < retries:
                            await asyncio.sleep(3)
                            continue
                        _BREAKER.record_failure(f"HTTP {resp.status}")
                        return []

                    else:
                        _BREAKER.record_failure(f"HTTP {resp.status}")
                        return []

            except asyncio.TimeoutError:
                if attempt < retries:
                    await asyncio.sleep(2)
                    continue
                _BREAKER.record_failure("TimeoutError")
                return []
            except Exception as e:
                _BREAKER.record_failure(e)
                return []

        return []

    # ──────────────────────────────────────────
    # PARSEO DE RESPUESTA KIWI
    # ──────────────────────────────────────────

    def _parse_response(
        self, data: dict,
        origin: str, dest: str,
        cabin: int, cabin_name: str,
    ) -> List[Dict]:
        """Parsea la respuesta JSON de Kiwi al schema estándar V4."""
        flights = []
        now = datetime.now().isoformat()

        for offer in data.get("data", []):
            try:
                price_eur = float(offer.get("price", 0))
                if price_eur <= 0:
                    continue

                route = offer.get("route", [])
                if not route:
                    continue

                # Destino real (puede ser diferente si es "anywhere")
                real_dest = dest
                if dest == "anywhere":
                    # Extraer destino del primer segmento de retorno
                    # o del último segmento de ida
                    for seg in route:
                        fly_to = seg.get("flyTo", "")
                        fly_from = seg.get("flyFrom", "")
                        if fly_from == origin or (fly_from in config.EUROPEAN_AIRPORTS_ALL):
                            real_dest = fly_to  # Primer destino fuera de Europa
                    # También podemos mirarlo directamente
                    if offer.get("cityTo"):
                        # Usar el campo cityCodeTo si existe
                        real_dest = offer.get("flyTo", real_dest)

                # Aerolínea (del primer segmento)
                airlines_set = set()
                for seg in route:
                    al = seg.get("airline", "")
                    if al:
                        airlines_set.add(al)
                airline = list(airlines_set)[0] if airlines_set else "?"
                all_airlines = ",".join(sorted(airlines_set))

                # Escalas: contar segmentos de ida (return == 0) explícitamente.
                # Si no hay marca "return" en ningún segmento (oneway), todos son de ida.
                outbound_segs = [s for s in route if s.get("return", 0) == 0]
                segs_outbound = len(outbound_segs) if outbound_segs else len(route)
                stops = max(0, segs_outbound - 1)

                # Duración
                dur_sec = offer.get("duration", {}).get("total", 0)
                dur_min = dur_sec // 60 if dur_sec else 0
                if dur_sec:
                    h = dur_sec // 3600
                    m = (dur_sec % 3600) // 60
                    duration_str = f"{h}h{m:02d}m"
                else:
                    duration_str = ""

                # Fechas de vuelo
                dep_epoch = offer.get("dTimeUTC", 0)
                arr_epoch = offer.get("aTimeUTC", 0)
                dep_dt = datetime.utcfromtimestamp(dep_epoch) if dep_epoch else None
                arr_dt = datetime.utcfromtimestamp(arr_epoch) if arr_epoch else None
                date_out = dep_dt.strftime("%Y-%m-%d") if dep_dt else ""
                date_ret = ""

                # Fecha de retorno: buscar en segmentos de vuelta
                return_segs = [s for s in route if s.get("return", 0) == 1]
                if return_segs:
                    ret_epoch = return_segs[0].get("dTimeUTC", 0)
                    if ret_epoch:
                        ret_dt = datetime.utcfromtimestamp(ret_epoch)
                        date_ret = ret_dt.strftime("%Y-%m-%d")

                # Deep link para reservar
                deep_link = offer.get("deep_link", "")
                booking_url = deep_link if deep_link else \
                    f"https://www.kiwi.com/es/search/results/{origin}/{real_dest}/{date_out}/{date_ret}"

                # Ciudad destino
                city_to = offer.get("cityTo", real_dest)
                country_to = offer.get("countryTo", {}).get("name", "")

                # Escalas info (sólo tramos de ida)
                layover_airports = []
                ida_segs = outbound_segs if outbound_segs else route[:segs_outbound]
                for seg in ida_segs:
                    if seg.get("flyFrom", "") not in (origin,) and \
                       seg.get("flyFrom", "") not in config.EUROPEAN_AIRPORTS_ALL:
                        layover_airports.append(seg.get("flyFrom", ""))
                layover_info = " → ".join(layover_airports) if layover_airports else "Directo" if stops == 0 else ""

                flights.append({
                    "origin": origin,
                    "destination": real_dest,
                    "city_to": city_to,
                    "country_to": country_to,
                    "date_out": date_out,
                    "date_ret": date_ret,
                    "price_eur": price_eur,
                    "airline": airline,
                    "all_airlines": all_airlines,
                    "stops": stops,
                    "cabin": cabin_name,
                    "cabin_code": cabin,
                    "duration_str": duration_str,
                    "duration_min": dur_min,
                    "layover_info": layover_info,
                    "booking_url": booking_url,
                    "source": "kiwi",
                    "scraped_at": now,
                    # Campos adicionales V4
                    "distance_category": config.get_distance_category(real_dest),
                    "is_error_fare": config.is_error_fare(price_eur, cabin, real_dest),
                    "season_multiplier": config.get_season_multiplier(date_out),
                    "premium_airline": airline in config.AIRLINES_PREMIUM_BUSINESS,
                })

            except Exception:
                continue

        return flights

    # ──────────────────────────────────────────
    # DETECCIÓN DE RATIO B/E
    # ──────────────────────────────────────────

    def _detect_ratio_anomalies(
        self, eco_flights: List[Dict], biz_flights: List[Dict]
    ) -> List[Dict]:
        """
        Compara precios Economy vs Business por ruta y detecta anomalías de ratio.
        Una ruta transatlántica con ratio < 1.8x es casi seguro un error fare.
        """
        # Indexar economy por (origin, destination)
        eco_by_route = defaultdict(list)
        for f in eco_flights:
            key = (f["origin"], f["destination"])
            eco_by_route[key].append(f["price_eur"])

        # Para cada vuelo business, calcular ratio
        anomalies = []
        for biz in biz_flights:
            key = (biz["origin"], biz["destination"])
            eco_prices = eco_by_route.get(key, [])
            if not eco_prices:
                continue

            eco_min = min(eco_prices)
            biz_price = biz["price_eur"]
            ratio = biz_price / eco_min if eco_min > 0 else 99

            dest = biz["destination"]
            bec_class = config.classify_ratio(ratio, dest)

            if bec_class in ("ERROR", "ANOMALIA", "OFERTA"):
                # Calcular ahorro
                # Precio normal de Business en esta ruta (estimado: ratio normal × eco)
                dist = config.get_distance_category(dest)
                normal_ratio = config.BUSINESS_ECONOMY_RATIO[dist]["oferta"]
                estimated_normal_biz = eco_min * normal_ratio
                savings_eur = max(0, estimated_normal_biz - biz_price)
                savings_pct = (savings_eur / estimated_normal_biz * 100) if estimated_normal_biz > 0 else 0

                anomaly = {
                    **biz,
                    "bec_ratio": round(ratio, 2),
                    "bec_eco_price": round(eco_min, 0),
                    "bec_class": bec_class,
                    "estimated_normal_biz": round(estimated_normal_biz, 0),
                    "savings_eur": round(savings_eur, 0),
                    "savings_pct": round(savings_pct, 1),
                    "detection_method": "business_economy_ratio",
                    "score": self._compute_deal_score(biz, eco_min, ratio, bec_class),
                }
                anomalies.append(anomaly)

        return sorted(anomalies, key=lambda x: x["score"], reverse=True)

    def _compute_deal_score(
        self, flight: Dict, eco_price: float, ratio: float, bec_class: str
    ) -> float:
        """
        Score 0-100 que combina múltiples factores.
        Cuanto mayor, mejor el deal.
        """
        score = 0.0

        # Factor 1: Ratio B/E (cuanto más bajo, mejor)
        dest = flight["destination"]
        dist = config.get_distance_category(dest)
        thresholds = config.BUSINESS_ECONOMY_RATIO.get(dist, config.BUSINESS_ECONOMY_RATIO["largo"])
        if ratio < thresholds["error"]:
            score += 40
        elif ratio < thresholds["anomalia"]:
            score += 25
        elif ratio < thresholds["oferta"]:
            score += 15

        # Factor 2: Precio absoluto de Business
        abs_thresholds = config.ERROR_FARE_ABSOLUTE_THRESHOLDS.get(config.CABIN_BUSINESS, {})
        abs_threshold = abs_thresholds.get(dist, 999)
        if flight["price_eur"] < abs_threshold:
            score += 25
        elif flight["price_eur"] < abs_threshold * 1.5:
            score += 15
        elif flight["price_eur"] < abs_threshold * 2:
            score += 5

        # Factor 3: Aerolínea premium (Business de calidad)
        if flight.get("premium_airline"):
            score += 15

        # Factor 4: Temporada alta (deal más valioso)
        score += (flight.get("season_multiplier", 1.0) - 1.0) * 20

        # Factor 5: Vuelo directo (más valioso)
        if flight.get("stops", 1) == 0:
            score += 10

        return min(100, score)

    def _compute_ratio_stats(
        self, eco_flights: List[Dict], biz_flights: List[Dict]
    ) -> Dict:
        """Estadísticas de ratios B/E por destino."""
        eco_by_dest = defaultdict(list)
        biz_by_dest = defaultdict(list)

        for f in eco_flights:
            eco_by_dest[f["destination"]].append(f["price_eur"])
        for f in biz_flights:
            biz_by_dest[f["destination"]].append(f["price_eur"])

        stats = {}
        for dest in set(list(eco_by_dest.keys()) + list(biz_by_dest.keys())):
            eco = eco_by_dest.get(dest, [])
            biz = biz_by_dest.get(dest, [])
            if eco and biz:
                eco_min = min(eco)
                biz_min = min(biz)
                ratio = biz_min / eco_min if eco_min > 0 else 99
                stats[dest] = {
                    "eco_min": round(eco_min, 0),
                    "biz_min": round(biz_min, 0),
                    "ratio": round(ratio, 2),
                    "class": config.classify_ratio(ratio, dest),
                }

        return stats

    # ──────────────────────────────────────────
    # BÚSQUEDA EN FECHAS ESPECÍFICAS (compatibilidad V2)
    # ──────────────────────────────────────────

    async def search_routes(
        self,
        routes: List[Tuple[str, str]],
        dates: List[Tuple[str, str]],
        max_concurrent: int = None,
        cabin: int = config.CABIN_ECONOMY,
        budget_limit: int = None,
    ) -> List[Dict]:
        """
        Compatibilidad con V2: búsqueda de rutas con fechas específicas.
        Preferir search_anywhere o search_routes_range para V4.
        """
        if not self.available:
            return []

        if max_concurrent is None:
            max_concurrent = config.KIWI_MAX_CONCURRENT

        cabin_name = config.CABIN_NAMES.get(cabin, "Economy")
        kiwi_cabin = config.KIWI_CABIN_MAP.get(cabin, "M")

        all_flights = []
        total = len(routes) * len(dates)
        done = 0
        semaphore = asyncio.Semaphore(max_concurrent)
        timeout = aiohttp.ClientTimeout(total=60)

        async with aiohttp.ClientSession(timeout=timeout) as session:

            async def search_one(origin: str, dest: str, date_out: str, date_ret: str):
                nonlocal done
                async with semaphore:
                    done += 1
                    if budget_limit and self.searches_used >= budget_limit:
                        return []

                    print(f"   [{done:03d}/{total}] {origin}→{dest} {date_out} [{cabin_name}]", flush=True)

                    params = {
                        "fly_from": origin,
                        "fly_to": dest,
                        "date_from": self._to_kiwi_date(date_out),
                        "date_to": self._to_kiwi_date(date_out),
                        "flight_type": "round" if date_ret else "oneway",
                        "adults": 1,
                        "selected_cabins": kiwi_cabin,
                        "curr": "EUR",
                        "locale": "es",
                        "max_stopovers": config.KIWI_MAX_STOPOVERS,
                        "limit": 20,
                        "sort": "price",
                        "asc": 1,
                    }
                    if date_ret:
                        params["return_from"] = self._to_kiwi_date(date_ret)
                        params["return_to"] = self._to_kiwi_date(date_ret)

                    flights = await self._make_request(session, params, origin, dest, cabin, cabin_name)
                    if flights:
                        cheapest = min(f["price_eur"] for f in flights)
                        print(f"      ✅ {len(flights)} | mejor: {cheapest:.0f}€", flush=True)

                    await asyncio.sleep(self._rate_limit_delay)
                    return flights

            tasks = [
                search_one(o, d, date_out, date_ret)
                for o, d in routes
                for date_out, date_ret in dates
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    all_flights.extend(r)

        return all_flights

    # ──────────────────────────────────────────
    # UTILIDADES
    # ──────────────────────────────────────────

    @staticmethod
    def _to_kiwi_date(date_str: str) -> str:
        """Convierte YYYY-MM-DD a DD/MM/YYYY (formato Kiwi)."""
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            return dt.strftime("%d/%m/%Y")
        except Exception:
            return date_str

    def get_stats(self) -> Dict:
        """Retorna estadísticas de uso."""
        return {
            "searches_used": self.searches_used,
            "available": self.available,
            "api_key_set": bool(self.api_key),
        }


# ──────────────────────────────────────────
# TEST RÁPIDO
# ──────────────────────────────────────────

async def _test():
    engine = KiwiEngineV4()
    if not engine.available:
        print("❌ Configura KIWI_API_KEY para usar el motor")
        return

    from datetime import datetime, timedelta
    date_from = (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d")
    date_to = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")

    print("TEST 1: Anywhere Economy desde CDG, FRA, MAD")
    flights = await engine.search_anywhere(
        ["CDG", "FRA", "MAD"], date_from, date_to,
        cabin=config.CABIN_ECONOMY,
    )
    for f in flights[:5]:
        print(f"  {f['origin']}→{f['destination']} | {f['price_eur']:.0f}€ | {f['airline']} | {f['stops']} escalas")

    print("\nTEST 2: Business Hunter CDG, FRA, MAD")
    result = await engine.search_business_hunter(["CDG", "FRA", "MAD"], date_from, date_to)
    for a in result["anomalies"][:5]:
        print(f"  {a['origin']}→{a['destination']} | B:{a['price_eur']:.0f}€ E:{a['bec_eco_price']:.0f}€ | Ratio:{a['bec_ratio']}x | {a['bec_class']}")


if __name__ == "__main__":
    asyncio.run(_test())
