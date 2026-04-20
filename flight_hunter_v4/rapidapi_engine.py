"""
Flight Hunter V4 — Motor RapidAPI (Skyscanner + Sky Scrapper)
==============================================================
Cubre aerolíneas de todo el mundo a través de la interfaz de Skyscanner via RapidAPI.

COBERTURA: Skyscanner agrega 1200+ aerolíneas mundiales — lo que no cubre Kiwi/Ryanair/Vueling.
GRATUITO: free tier de Sky Scrapper en RapidAPI (~500 req/mes).

OBTENER API KEY (30 segundos, gratis):
  1. Ir a https://rapidapi.com/
  2. "Sign Up" con Google (un clic)
  3. Buscar "Sky Scrapper" → Subscribe → Free tier
  4. Copiar la API key desde el dashboard
  5. export RAPIDAPI_KEY=tu_key

ARQUITECTURA DEL MOTOR (por potencia):
  1. Kiwi/Tequila  → MOTOR PRINCIPAL (fly_to=anywhere → busca TODO el mundo)
  2. RapidAPI      → COMPLEMENTO (Skyscanner: aerolíneas de larga distancia no en Kiwi)
  3. Ryanair       → SCRAPER DIRECTO (vuelos cortos low-cost, sin API key)
  4. Vueling       → SCRAPER DIRECTO (vuelos España/Europa)
  5. SerpAPI       → VALIDACIÓN (Google Flights, Business class, 100 calls/mes)
  6. Duffel        → LARGO HAUL (300+ aerolíneas vía GDS/NDC)

NOTA: Amadeus desactivado — no permite nuevos registros desde 2025.
"""

import asyncio
import aiohttp
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from collections import defaultdict
import config
from circuit_breaker import get_breaker
from response_cache import ResponseCache

# TTL de cache para respuestas RapidAPI.
# 30 min es el sweet spot: suficientemente largo para evitar llamadas duplicadas
# en el mismo batch (cron itera ~65 orígenes × 40 destinos), suficientemente
# corto para no devolver precios stale en ventanas de reserva.
_CACHE_TTL_SECONDS = 1800

# RapidAPI key — se carga exclusivamente desde config/env (ver config.py
# que hace load_dotenv). NO hardcoded para no filtrar secretos en git.
RAPIDAPI_KEY = config.RAPIDAPI_KEY

# Circuit breaker para Sky Scrapper (RapidAPI): 3 fallos → 15 min cooldown
_BREAKER = get_breaker("rapidapi")

# ══════════════════════════════════════════════════════════════════════════════
# TABLA DE ENTITY IDs — Sky Scrapper necesita estos IDs para buscar aeropuertos.
# Cobertura global: Europa, América, Asia, África, Oceanía, Oriente Medio.
# Si un aeropuerto no está en esta tabla, se hace lookup dinámico automático
# (ver _get_entity_id). Los IDs se cachean en _ENTITY_ID_CACHE en runtime.
# ══════════════════════════════════════════════════════════════════════════════
AIRPORT_SKY_IDS: Dict[str, Dict] = {
    # ── EUROPA OCCIDENTAL ────────────────────────────────────────────────────
    "MAD": {"skyId": "MAD", "entityId": "95565077"},
    "BCN": {"skyId": "BCN", "entityId": "95565085"},
    "LIS": {"skyId": "LIS", "entityId": "95565080"},
    "OPO": {"skyId": "OPO", "entityId": "95673631"},
    "CDG": {"skyId": "CDG", "entityId": "95565041"},
    "ORY": {"skyId": "ORY", "entityId": "95565044"},
    "BVA": {"skyId": "BVA", "entityId": "95673358"},
    "LYS": {"skyId": "LYS", "entityId": "95565047"},
    "NCE": {"skyId": "NCE", "entityId": "95565046"},
    "MRS": {"skyId": "MRS", "entityId": "95565048"},
    "LHR": {"skyId": "LHR", "entityId": "95565050"},
    "LGW": {"skyId": "LGW", "entityId": "95565051"},
    "STN": {"skyId": "STN", "entityId": "95565052"},
    "LTN": {"skyId": "LTN", "entityId": "95565053"},
    "MAN": {"skyId": "MAN", "entityId": "95565054"},
    "BHX": {"skyId": "BHX", "entityId": "95565056"},
    "EDI": {"skyId": "EDI", "entityId": "95565057"},
    "DUB": {"skyId": "DUB", "entityId": "95565055"},
    "AMS": {"skyId": "AMS", "entityId": "95565065"},
    "BRU": {"skyId": "BRU", "entityId": "95565070"},
    "LUX": {"skyId": "LUX", "entityId": "95565073"},
    "FRA": {"skyId": "FRA", "entityId": "95673652"},
    "MUC": {"skyId": "MUC", "entityId": "95673616"},
    "DUS": {"skyId": "DUS", "entityId": "95673622"},
    "HAM": {"skyId": "HAM", "entityId": "95673626"},
    "BER": {"skyId": "BER", "entityId": "95673618"},
    "STR": {"skyId": "STR", "entityId": "95673648"},
    "FKB": {"skyId": "FKB", "entityId": "95673654"},
    "NUE": {"skyId": "NUE", "entityId": "95673644"},
    "ZRH": {"skyId": "ZRH", "entityId": "95673694"},
    "GVA": {"skyId": "GVA", "entityId": "95673667"},
    "BSL": {"skyId": "BSL", "entityId": "95673655"},
    "VIE": {"skyId": "VIE", "entityId": "95673686"},
    "SZG": {"skyId": "SZG", "entityId": "95673689"},
    "MXP": {"skyId": "MXP", "entityId": "95565089"},
    "FCO": {"skyId": "FCO", "entityId": "95565090"},
    "VCE": {"skyId": "VCE", "entityId": "95565091"},
    "NAP": {"skyId": "NAP", "entityId": "95565093"},
    "BLQ": {"skyId": "BLQ", "entityId": "95565092"},
    "IST": {"skyId": "IST", "entityId": "95673681"},
    "SAW": {"skyId": "SAW", "entityId": "95673682"},
    # ── EUROPA DEL NORTE / ESCANDINAVIA ──────────────────────────────────────
    "CPH": {"skyId": "CPH", "entityId": "95565064"},
    "ARN": {"skyId": "ARN", "entityId": "95565063"},
    "OSL": {"skyId": "OSL", "entityId": "95565062"},
    "HEL": {"skyId": "HEL", "entityId": "95565061"},
    # ── EUROPA DEL ESTE ──────────────────────────────────────────────────────
    "WAW": {"skyId": "WAW", "entityId": "95673660"},
    "BUD": {"skyId": "BUD", "entityId": "95673663"},
    "PRG": {"skyId": "PRG", "entityId": "95673657"},
    "BTS": {"skyId": "BTS", "entityId": "95673664"},
    "RIX": {"skyId": "RIX", "entityId": "95673675"},
    "VNO": {"skyId": "VNO", "entityId": "95673676"},
    "TLL": {"skyId": "TLL", "entityId": "95673677"},
    "BEG": {"skyId": "BEG", "entityId": "95673684"},
    "SOF": {"skyId": "SOF", "entityId": "95673685"},
    "OTP": {"skyId": "OTP", "entityId": "95673683"},
    "KBP": {"skyId": "KBP", "entityId": "95673679"},
    "ATH": {"skyId": "ATH", "entityId": "95565095"},
    # ── MEDITERRÁNEO / CANARIAS / DESTINOS VACACIONALES ──────────────────────
    "PMI": {"skyId": "PMI", "entityId": "95565086"},
    "IBZ": {"skyId": "IBZ", "entityId": "95565087"},
    "MAH": {"skyId": "MAH", "entityId": "95565088"},
    "TFS": {"skyId": "TFS", "entityId": "95565083"},  # Tenerife Sur
    "TFN": {"skyId": "TFN", "entityId": "95565082"},  # Tenerife Norte
    "LPA": {"skyId": "LPA", "entityId": "95565084"},  # Gran Canaria
    "FUE": {"skyId": "FUE", "entityId": "95565081"},  # Fuerteventura
    "ACE": {"skyId": "ACE", "entityId": "95565080"},  # Lanzarote
    "HER": {"skyId": "HER", "entityId": "95565097"},  # Creta
    "RHO": {"skyId": "RHO", "entityId": "95565096"},  # Rodas
    "CFU": {"skyId": "CFU", "entityId": "95565098"},  # Corfú
    "SKG": {"skyId": "SKG", "entityId": "95565094"},  # Salónica
    # ── NORTEAMÉRICA ─────────────────────────────────────────────────────────
    "JFK": {"skyId": "JFK", "entityId": "95565058"},
    "EWR": {"skyId": "EWR", "entityId": "95565059"},
    "LAX": {"skyId": "LAX", "entityId": "95565060"},
    "MIA": {"skyId": "MIA", "entityId": "95673452"},
    "ORD": {"skyId": "ORD", "entityId": "95673444"},
    "BOS": {"skyId": "BOS", "entityId": "95673446"},
    "YYZ": {"skyId": "YYZ", "entityId": "95673498"},
    "YUL": {"skyId": "YUL", "entityId": "95673499"},
    "YVR": {"skyId": "YVR", "entityId": "95673500"},
    "MEX": {"skyId": "MEX", "entityId": "95673380"},
    "CUN": {"skyId": "CUN", "entityId": "95673382"},
    # ── CARIBE ───────────────────────────────────────────────────────────────
    "PUJ": {"skyId": "PUJ", "entityId": "95673390"},  # Punta Cana
    "SDQ": {"skyId": "SDQ", "entityId": "95673391"},  # Santo Domingo
    "HAV": {"skyId": "HAV", "entityId": "95673395"},  # La Habana
    "SJU": {"skyId": "SJU", "entityId": "95673399"},  # San Juan PR
    "MBJ": {"skyId": "MBJ", "entityId": "95673396"},  # Montego Bay Jamaica
    # ── SUDAMÉRICA ───────────────────────────────────────────────────────────
    "GRU": {"skyId": "GRU", "entityId": "95673332"},
    "GIG": {"skyId": "GIG", "entityId": "95673333"},
    "BOG": {"skyId": "BOG", "entityId": "95673340"},
    "LIM": {"skyId": "LIM", "entityId": "95673344"},
    "SCL": {"skyId": "SCL", "entityId": "95673347"},
    "EZE": {"skyId": "EZE", "entityId": "95673350"},
    "MVD": {"skyId": "MVD", "entityId": "95673352"},
    # ── ORIENTE MEDIO ────────────────────────────────────────────────────────
    "DXB": {"skyId": "DXB", "entityId": "95673506"},
    "DOH": {"skyId": "DOH", "entityId": "95673517"},
    "AUH": {"skyId": "AUH", "entityId": "95673507"},
    "RUH": {"skyId": "RUH", "entityId": "95673510"},
    "KWI": {"skyId": "KWI", "entityId": "95673511"},
    "BAH": {"skyId": "BAH", "entityId": "95673512"},
    "AMM": {"skyId": "AMM", "entityId": "95673518"},
    "BEY": {"skyId": "BEY", "entityId": "95673519"},
    "CAI": {"skyId": "CAI", "entityId": "95673402"},
    # ── NORTE DE ÁFRICA ──────────────────────────────────────────────────────
    "CMN": {"skyId": "CMN", "entityId": "95673404"},
    "RAK": {"skyId": "RAK", "entityId": "95673406"},
    "TUN": {"skyId": "TUN", "entityId": "95673408"},
    "ALG": {"skyId": "ALG", "entityId": "95673410"},
    # ── ÁFRICA SUBSAHARIANA ──────────────────────────────────────────────────
    "NBO": {"skyId": "NBO", "entityId": "95673419"},
    "JNB": {"skyId": "JNB", "entityId": "95673415"},
    "CPT": {"skyId": "CPT", "entityId": "95673416"},
    "ADD": {"skyId": "ADD", "entityId": "95673420"},
    "LOS": {"skyId": "LOS", "entityId": "95673422"},
    "ACC": {"skyId": "ACC", "entityId": "95673421"},
    "DSS": {"skyId": "DSS", "entityId": "95673423"},
    "TNR": {"skyId": "TNR", "entityId": "95673424"},
    "MRU": {"skyId": "MRU", "entityId": "95673425"},
    "ZNZ": {"skyId": "ZNZ", "entityId": "95673430"},  # Zanzíbar
    "DAR": {"skyId": "DAR", "entityId": "95673428"},  # Dar es Salaam
    "JRO": {"skyId": "JRO", "entityId": "95673429"},  # Kilimanjaro
    # ── SUBCONTINENTE INDIO ──────────────────────────────────────────────────
    "BOM": {"skyId": "BOM", "entityId": "95565108"},
    "DEL": {"skyId": "DEL", "entityId": "95565107"},
    "MAA": {"skyId": "MAA", "entityId": "95565109"},
    "BLR": {"skyId": "BLR", "entityId": "95565110"},
    "CMB": {"skyId": "CMB", "entityId": "95565112"},
    "MLE": {"skyId": "MLE", "entityId": "95565113"},  # Maldivas
    "DAC": {"skyId": "DAC", "entityId": "95565111"},
    # ── SUDESTE ASIÁTICO ─────────────────────────────────────────────────────
    "BKK": {"skyId": "BKK", "entityId": "95565099"},
    "DMK": {"skyId": "DMK", "entityId": "95565100"},
    "SIN": {"skyId": "SIN", "entityId": "95673556"},
    "KUL": {"skyId": "KUL", "entityId": "95673557"},
    "CGK": {"skyId": "CGK", "entityId": "95673558"},
    "MNL": {"skyId": "MNL", "entityId": "95673559"},
    "SGN": {"skyId": "SGN", "entityId": "95673560"},
    "HAN": {"skyId": "HAN", "entityId": "95673561"},
    "DPS": {"skyId": "DPS", "entityId": "95673562"},  # Bali
    "RGN": {"skyId": "RGN", "entityId": "95673563"},  # Yangón Myanmar
    "REP": {"skyId": "REP", "entityId": "95673564"},  # Siem Reap Cambodia
    # ── ASIA ESTE ────────────────────────────────────────────────────────────
    "NRT": {"skyId": "NRT", "entityId": "95673533"},
    "HND": {"skyId": "HND", "entityId": "95673534"},
    "ICN": {"skyId": "ICN", "entityId": "95673536"},
    "PEK": {"skyId": "PEK", "entityId": "95565115"},
    "PVG": {"skyId": "PVG", "entityId": "95565116"},
    "HKG": {"skyId": "HKG", "entityId": "95565117"},
    "TPE": {"skyId": "TPE", "entityId": "95565118"},
    # ── OCEANÍA ──────────────────────────────────────────────────────────────
    "SYD": {"skyId": "SYD", "entityId": "95565122"},
    "MEL": {"skyId": "MEL", "entityId": "95565123"},
    "BNE": {"skyId": "BNE", "entityId": "95565124"},
    "PER": {"skyId": "PER", "entityId": "95565125"},
    "AKL": {"skyId": "AKL", "entityId": "95565126"},
}

# Cache en runtime para entity IDs obtenidos dinámicamente via lookup
_ENTITY_ID_CACHE: Dict[str, Dict] = {}

# ── Endpoints ──────────────────────────────────────────────────────────────
SKY_SCRAPPER_HOST = "sky-scrapper.p.rapidapi.com"
SKY_SCRAPPER_BASE = "https://sky-scrapper.p.rapidapi.com/api/v2/flights"

FLIGHT_FARE_HOST  = "flight-fare-search.p.rapidapi.com"
FLIGHT_FARE_BASE  = "https://flight-fare-search.p.rapidapi.com/v2"

# ── Headers helper ─────────────────────────────────────────────────────────

def _headers(host: str) -> Dict:
    return {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": host,
    }


def _normalize_sky_flight(item: Dict, origin: str) -> Optional[Dict]:
    """Convierte respuesta de Sky Scrapper al formato estándar V4."""
    try:
        legs = item.get("legs", [])
        if not legs:
            return None
        leg = legs[0]

        dest = leg.get("destination", {}).get("displayCode", "")
        orig = leg.get("origin", {}).get("displayCode", origin)
        dest_city = leg.get("destination", {}).get("city", dest)
        dest_country = leg.get("destination", {}).get("country", "")

        price_raw = item.get("price", {})
        price = price_raw.get("raw", 0) or price_raw.get("formatted", "0")
        if isinstance(price, str):
            price = float(price.replace("€", "").replace(",", "").strip() or 0)

        carriers = item.get("carriers", {}).get("marketing", [{}])
        airline_code = carriers[0].get("alternateId", "") if carriers else ""
        airline_name = carriers[0].get("name", "") if carriers else ""

        dep_time = leg.get("departure", "")
        arr_time = leg.get("arrival", "")
        stops = leg.get("stopCount", 0)
        duration = leg.get("durationInMinutes", 0)

        date_out = dep_time[:10] if dep_time else ""
        dist_cat = config.get_distance_category(dest)

        booking_url = f"https://www.skyscanner.es/transporte/vuelos/{orig.lower()}/{dest.lower()}/"

        return {
            "source": "rapidapi_skyscrapper",
            "origin": orig,
            "origin_full": leg.get("origin", {}).get("city", orig),
            "destination": dest,
            "city_to": dest_city,
            "country_to": dest_country,
            "price_eur": round(float(price), 2),
            "cabin_code": config.CABIN_ECONOMY,
            "cabin": "economy",
            "airline": airline_code,
            "airline_name": airline_name,
            "flight_number": "",
            "date_out": date_out,
            "time_out": dep_time[11:16] if len(dep_time) > 10 else "",
            "date_ret": "",
            "stops": stops,
            "duration_min": duration,
            "distance_category": dist_cat,
            "booking_url": booking_url,
        }
    except Exception as e:
        return None


def _normalize_fare_flight(item: Dict, origin: str) -> Optional[Dict]:
    """Convierte respuesta de Flight Fare Search al formato estándar V4."""
    try:
        dest = item.get("arrivalAirport", {}).get("iata", "")
        orig = item.get("departureAirport", {}).get("iata", origin)
        dest_city = item.get("arrivalAirport", {}).get("city", dest)
        dest_country = item.get("arrivalAirport", {}).get("country", "")

        price = float(item.get("price", 0) or 0)
        airline_code = item.get("carrierCode", "")
        airline_name = item.get("carrierName", "")
        dep_time = item.get("departureTime", "")
        stops = item.get("stops", 0)
        date_out = dep_time[:10] if dep_time else ""
        dist_cat = config.get_distance_category(dest)

        booking_url = item.get("deepLink", f"https://www.skyscanner.es")

        return {
            "source": "rapidapi_fare",
            "origin": orig,
            "origin_full": item.get("departureAirport", {}).get("city", orig),
            "destination": dest,
            "city_to": dest_city,
            "country_to": dest_country,
            "price_eur": round(price, 2),
            "cabin_code": config.CABIN_ECONOMY,
            "cabin": "economy",
            "airline": airline_code,
            "airline_name": airline_name,
            "flight_number": item.get("flightNumber", ""),
            "date_out": date_out,
            "time_out": dep_time[11:16] if len(dep_time) > 10 else "",
            "date_ret": "",
            "stops": stops,
            "distance_category": dist_cat,
            "booking_url": booking_url,
        }
    except Exception:
        return None


class RapidAPIEngine:
    """
    Motor RapidAPI para Flight Hunter V4.
    Soporta Sky Scrapper (Skyscanner unofficial) y Flight Fare Search.
    Cubre 500+ aerolíneas a nivel mundial — complementa perfectamente Ryanair.
    """

    def __init__(self):
        self.available = bool(RAPIDAPI_KEY)
        if not self.available:
            print("⚠️  RAPIDAPI_KEY no configurada.")
            print("     → Regístrate en https://rapidapi.com (login con Google)")
            print("     → Suscríbete a 'Sky Scrapper' (free tier)")
            print("     → export RAPIDAPI_KEY=tu_key")
        self._semaphore = asyncio.Semaphore(3)  # max 3 requests concurrentes
        # Cache de respuestas normalizadas. Clave incluye endpoint + params,
        # así sky-scrapper y flight-fare no colisionan aunque compartan ruta.
        # El namespace "rapidapi_v1" permite invalidar todo el cache bumping
        # el sufijo si cambia el formato de _normalize_*.
        self._cache = ResponseCache("rapidapi_v1")

    async def _get_entity_id(self, session: aiohttp.ClientSession, iata: str) -> Dict:
        """
        Devuelve el skyId/entityId para cualquier código IATA.

        Prioridad:
          1. AIRPORT_SKY_IDS (tabla estática precargada, ~150 aeropuertos globales)
          2. _ENTITY_ID_CACHE (lookup dinámico ya hecho en este run)
          3. Sky Scrapper searchAirport endpoint (1 request, luego cacheado)
          4. Fallback: usar IATA como skyId (funciona en ~60% de casos)
        """
        iata = iata.upper()

        # 1 + 2: check tablas
        if iata in AIRPORT_SKY_IDS:
            return AIRPORT_SKY_IDS[iata]
        if iata in _ENTITY_ID_CACHE:
            return _ENTITY_ID_CACHE[iata]

        # 3: lookup dinámico (1 request)
        try:
            url = f"https://{SKY_SCRAPPER_HOST}/api/v1/flights/searchAirport"
            params = {"query": iata, "locale": "en-US"}
            data = await self._get(session, url, params, SKY_SCRAPPER_HOST)
            if data:
                places = data.get("data", []) or []
                for place in places:
                    if place.get("iataCode", "").upper() == iata:
                        result = {
                            "skyId": place.get("skyId", iata),
                            "entityId": place.get("entityId", iata),
                        }
                        _ENTITY_ID_CACHE[iata] = result
                        return result
        except Exception:
            pass

        # 4: fallback — usar IATA directamente (funciona para muchos aeropuertos)
        fallback = {"skyId": iata, "entityId": iata}
        _ENTITY_ID_CACHE[iata] = fallback
        return fallback

    async def _get(self, session: aiohttp.ClientSession, url: str, params: Dict, host: str) -> Optional[Dict]:
        """GET con reintentos y rate limiting."""
        # Circuit breaker: si RapidAPI ha fallado 3+ veces seguidas, no
        # gastamos cuota del free tier durante 15 min.
        if not _BREAKER.allow():
            return None

        async with self._semaphore:
            try:
                async with session.get(url, params=params, headers=_headers(host), timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    if resp.status == 429:
                        print(f"      ⚠️  Rate limit RapidAPI — espera 2s")
                        await asyncio.sleep(2)
                        _BREAKER.record_failure("HTTP 429")
                        return None
                    if resp.status != 200:
                        _BREAKER.record_failure(f"HTTP {resp.status}")
                        return None
                    data = await resp.json()
                    _BREAKER.record_success()
                    return data
            except Exception as e:
                _BREAKER.record_failure(e)
                return None

    async def search_skyscrapper_cheapest(
        self,
        origin: str,
        destination: str,
        date_out: str,
        cabin: str = "economy",
        session: aiohttp.ClientSession = None,
    ) -> List[Dict]:
        """
        Busca los vuelos más baratos para una ruta+fecha via Sky Scrapper.
        Funciona con CUALQUIER código IATA mundial — lookup dinámico automático.
        Devuelve múltiples opciones (aerolíneas y escalas distintas).
        """
        if not self.available:
            return []

        # Cache check — mismo (origen, destino, fecha, cabina) en el mismo batch
        # devuelve el resultado normalizado sin tocar Sky Scrapper.
        cache_key = self._cache.make_key(
            endpoint="sky_cheapest",
            origin=origin.upper(),
            destination=destination.upper(),
            date_out=date_out,
            cabin=cabin,
        )
        cached = self._cache.get(cache_key, ttl_seconds=_CACHE_TTL_SECONDS)
        if cached is not None:
            return cached

        async def _do_search(sess: aiohttp.ClientSession) -> List[Dict]:
            # Resolver entity IDs (tabla estática → cache → lookup dinámico)
            orig_ids = await self._get_entity_id(sess, origin)
            dest_ids = await self._get_entity_id(sess, destination)

            search_url = f"{SKY_SCRAPPER_BASE}/searchFlights"
            params = {
                "originSkyId":        orig_ids["skyId"],
                "destinationSkyId":   dest_ids["skyId"],
                "originEntityId":     orig_ids["entityId"],
                "destinationEntityId": dest_ids["entityId"],
                "date": date_out,
                "cabinClass": cabin,
                "adults": "1",
                "currency": "EUR",
                "market": "ES",
                "countryCode": "ES",
                "locale": "es-ES",
            }
            data = await self._get(sess, search_url, params, SKY_SCRAPPER_HOST)
            if not data:
                return []

            itineraries = (
                data.get("data", {}).get("itineraries", []) or
                data.get("itineraries", []) or
                data.get("results", []) or []
            )
            flights = []
            for item in itineraries:
                f = _normalize_sky_flight(item, origin)
                if f and f["price_eur"] > 0:
                    flights.append(f)
            return flights

        if session:
            result = await _do_search(session)
        else:
            async with aiohttp.ClientSession() as sess:
                result = await _do_search(sess)

        # Sólo cacheamos respuestas con datos. Un [] puede venir de un 429,
        # circuit breaker abierto o ruta sin inventario real; guardarlo
        # nos bloquearía revalidar durante 30 min.
        if result:
            self._cache.set(cache_key, result)
        return result

    async def search_fare_oneway(
        self,
        origin: str,
        destination: str,
        date_out: str,
    ) -> List[Dict]:
        """
        Busca vuelos one-way via Flight Fare Search API.
        Más rápida y sencilla, buena para múltiples rutas.
        """
        if not self.available:
            return []

        cache_key = self._cache.make_key(
            endpoint="fare_oneway",
            origin=origin.upper(),
            destination=destination.upper(),
            date_out=date_out,
        )
        cached = self._cache.get(cache_key, ttl_seconds=_CACHE_TTL_SECONDS)
        if cached is not None:
            return cached

        async with aiohttp.ClientSession() as session:
            params = {
                "from": origin,
                "to": destination,
                "date": date_out,
                "adult": "1",
                "type": "one-way",
                "currency": "EUR",
            }
            data = await self._get(session, f"{FLIGHT_FARE_BASE}/flights", params, FLIGHT_FARE_HOST)
            if not data:
                return []

            results = data.get("results", []) or data.get("flights", []) or []
            flights = []
            for item in results:
                f = _normalize_fare_flight(item, origin)
                if f and f["price_eur"] > 0:
                    flights.append(f)
            if flights:
                self._cache.set(cache_key, flights)
            return flights

    async def search_multi_routes(
        self,
        origins: List[str],
        destinations: List[str],
        date_from: str,
        date_to: str,
        cabin: str = "economy",
        max_origins: int = 10,
        max_dests: int = 15,
    ) -> List[Dict]:
        """
        Busca múltiples rutas origen→destino en paralelo.
        Limitado por el free tier (500 req/mes) — usa max_origins y max_dests con cuidado.
        """
        if not self.available:
            return []

        # Seleccionar los aeropuertos más relevantes
        selected_origins = origins[:max_origins]
        selected_dests = destinations[:max_dests]

        # Generar fechas de muestra en el rango (cada ~2 semanas)
        df = datetime.strptime(date_from, "%Y-%m-%d")
        dt = datetime.strptime(date_to, "%Y-%m-%d")
        sample_dates = []
        current = df
        while current <= dt:
            sample_dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=14)

        total_requests = len(selected_origins) * len(selected_dests) * len(sample_dates)
        print(f"\n   🌐 RapidAPI: {len(selected_origins)} orígenes × {len(selected_dests)} destinos × {len(sample_dates)} fechas = {total_requests} rutas")

        all_flights = []
        tasks = []
        for origin in selected_origins:
            for dest in selected_dests:
                for d in sample_dates[:2]:  # Max 2 fechas por ruta para no quemar el free tier
                    tasks.append(self.search_fare_oneway(origin, dest, d))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, list):
                all_flights.extend(r)

        print(f"   📊 Total RapidAPI: {len(all_flights)} vuelos")
        return all_flights

    async def search_anywhere_affordable(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
    ) -> List[Dict]:
        """
        Modo 'affordable' — busca rutas populares desde Europa a destinos long-haul.
        Cubre destinos mundiales que Kiwi/Ryanair/Vueling pueden pasar por alto.
        Optimizado para consumir pocas requests del free tier.
        """
        # Destinos prioritarios para RapidAPI — los que Ryanair/Vueling no cubren
        # Ordenados por potencial de error fare / chollos según histórico
        priority_dests = [
            # América del Norte
            "JFK", "LAX", "MIA", "YYZ", "ORD", "BOS",
            # Caribe
            "PUJ", "SDQ", "CUN", "HAV", "MBJ",
            # América del Sur
            "GRU", "BOG", "LIM", "EZE", "SCL",
            # Oriente Medio (hubs de conexión)
            "DXB", "DOH", "AUH",
            # África — error fares frecuentes
            "NBO", "JNB", "CPT", "CMN", "ADD",
            "ZNZ", "DAR",                           # Tanzania
            "MRU",                                  # Mauricio
            # Subcontinente Indio
            "BOM", "DEL", "CMB", "MLE",             # Maldivas
            # Sudeste Asiático — chollos frecuentes
            "BKK", "SIN", "KUL", "DPS",             # Bali
            # Asia Este
            "NRT", "ICN", "HKG",
            # Oceanía
            "SYD", "MEL",
        ]
        return await self.search_multi_routes(
            origins=origins,
            destinations=priority_dests,
            date_from=date_from,
            date_to=date_to,
            max_origins=6,      # conservador para no quemar el free tier
            max_dests=len(priority_dests),
        )
