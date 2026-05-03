"""
Flight Hunter V4 — Motor SerpAPI Google Hotels (SSS28, May 2026)
================================================================
Reemplaza HotellookEngine (endpoint público deprecated mayo 2026) con
SerpAPI Google Hotels que devuelve precios reales tiempo-real desde
Booking.com / Hotels.com / Expedia / etc agregados por Google.

Auth: SERPAPI_KEY (ya configurado en GH Secrets para vuelos business).
Precio: SerpAPI plan Hobby ~$50/mes = 5,000 queries.
       16 ciudades × 1 ventana = 16 queries/run × 6 runs/día = 96/día = ~3K/mes.
       Margen amplio dentro del plan.

Output: schema unificado type=hotel para deals.json. Booking URL ya
incluye el affiliate aid de Booking.com (TP_MARKER) cuando aplica.

Doc: https://serpapi.com/google-hotels-api
"""
import asyncio
import aiohttp
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from urllib.parse import urlencode

try:
    from config import SERPAPI_KEY as _SERPAPI_KEY
except ImportError:
    _SERPAPI_KEY = ""

try:
    from config import TRAVELPAYOUTS_MARKER as _TP_MARKER
except ImportError:
    _TP_MARKER = ""

SERPAPI_KEY = os.environ.get("SERPAPI_KEY", _SERPAPI_KEY or "")
TP_MARKER = os.environ.get("TP_MARKER", _TP_MARKER or "")
BASE = "https://serpapi.com/search.json"

# SSS30 — cuotas REALES SerpAPI:
#   Plan FREE = 250 queries/mes (NO 5,000 — Hobby es $50/mes)
#   Disponible para hotels = ~200/mes (50 reserva business class)
#   Budget = ~7 queries/día → 6 ciudades × 1/día = 180/mes ✅
#
# Top 6 ciudades = los destinos más buscados desde España (orígenes
# Tier1 del hunter). Para más cobertura, frontend /hoteles usa
# hotel_seed.ts con 12 ciudades curated + booking via TP_MARKER (gratis).
TOP_CITIES: List[Tuple[str, str, str]] = [
    ("Madrid, Spain", "España", "Europa"),
    ("Barcelona, Spain", "España", "Europa"),
    ("Paris, France", "Francia", "Europa"),
    ("Rome, Italy", "Italia", "Europa"),
    ("London, UK", "Reino Unido", "Europa"),
    ("Lisbon, Portugal", "Portugal", "Europa"),
]

# Lista extendida — usar sólo si DUFFEL_NO_CAP=1 o usuario actualiza
# SerpAPI a plan Hobby ($50/mes 5K queries). Para activar: setear
# env var SERPAPI_HOTELS_FULL_CITIES=1.
TOP_CITIES_FULL: List[Tuple[str, str, str]] = [
    # Europa Occidental
    ("Madrid, Spain", "España", "Europa"),
    ("Barcelona, Spain", "España", "Europa"),
    ("Sevilla, Spain", "España", "Europa"),
    ("Valencia, Spain", "España", "Europa"),
    ("Mallorca, Spain", "España", "Europa"),
    ("Tenerife, Spain", "España", "Europa"),
    ("Paris, France", "Francia", "Europa"),
    ("Nice, France", "Francia", "Europa"),
    ("Rome, Italy", "Italia", "Europa"),
    ("Florence, Italy", "Italia", "Europa"),
    ("Venice, Italy", "Italia", "Europa"),
    ("Lisbon, Portugal", "Portugal", "Europa"),
    ("Porto, Portugal", "Portugal", "Europa"),
    ("Amsterdam, Netherlands", "Países Bajos", "Europa"),
    ("Brussels, Belgium", "Bélgica", "Europa"),
    # Europa Central / Norte
    ("Berlin, Germany", "Alemania", "Europa"),
    ("Munich, Germany", "Alemania", "Europa"),
    ("Vienna, Austria", "Austria", "Europa"),
    ("Prague, Czech Republic", "Chequia", "Europa"),
    ("Budapest, Hungary", "Hungría", "Europa"),
    ("Zurich, Switzerland", "Suiza", "Europa"),
    ("Copenhagen, Denmark", "Dinamarca", "Europa"),
    ("Stockholm, Sweden", "Suecia", "Europa"),
    ("Reykjavik, Iceland", "Islandia", "Europa"),
    ("Dublin, Ireland", "Irlanda", "Europa"),
    # UK + Mediterráneo
    ("London, UK", "Reino Unido", "Europa"),
    ("Edinburgh, UK", "Reino Unido", "Europa"),
    ("Athens, Greece", "Grecia", "Europa"),
    ("Santorini, Greece", "Grecia", "Europa"),
    ("Mykonos, Greece", "Grecia", "Europa"),
    # Oriente Medio + África
    ("Istanbul, Turkey", "Turquía", "Oriente Medio"),
    ("Dubai, UAE", "Emiratos Árabes", "Oriente Medio"),
    ("Marrakech, Morocco", "Marruecos", "África"),
    ("Cairo, Egypt", "Egipto", "África"),
    ("Cape Town, South Africa", "Sudáfrica", "África"),
    # Asia
    ("Tokyo, Japan", "Japón", "Asia"),
    ("Kyoto, Japan", "Japón", "Asia"),
    ("Bangkok, Thailand", "Tailandia", "Asia"),
    ("Phuket, Thailand", "Tailandia", "Asia"),
    ("Bali, Indonesia", "Indonesia", "Asia"),
    ("Singapore", "Singapur", "Asia"),
    ("Hong Kong", "Hong Kong", "Asia"),
    ("Hanoi, Vietnam", "Vietnam", "Asia"),
    # Américas
    ("New York, USA", "Estados Unidos", "América Norte"),
    ("Miami, USA", "Estados Unidos", "América Norte"),
    ("Los Angeles, USA", "Estados Unidos", "América Norte"),
    ("Cancun, Mexico", "México", "América Norte"),
    ("Mexico City, Mexico", "México", "América Norte"),
    ("Buenos Aires, Argentina", "Argentina", "América Sur"),
    ("Rio de Janeiro, Brazil", "Brasil", "América Sur"),
]


def _get_cities_for_run() -> List[Tuple[str, str, str]]:
    """Devuelve TOP_CITIES_FULL si SERPAPI_HOTELS_FULL_CITIES=1, sino TOP_CITIES."""
    if os.getenv("SERPAPI_HOTELS_FULL_CITIES", "").lower() in ("1", "true", "yes"):
        return TOP_CITIES_FULL
    return TOP_CITIES


def _next_window(days_ahead: int = 30, nights: int = 3) -> Tuple[str, str]:
    """Genera ventana checkin/checkout para el mes próximo (día 15)."""
    today = datetime.utcnow().date()
    target = today + timedelta(days=days_ahead)
    # Aterrizar en día 15 del mes target para precios "típicos"
    checkin = target.replace(day=15)
    if checkin < today + timedelta(days=7):
        # Si día 15 ya pasó este mes, saltar al siguiente
        if checkin.month == 12:
            checkin = checkin.replace(year=checkin.year + 1, month=1)
        else:
            checkin = checkin.replace(month=checkin.month + 1)
    checkout = checkin + timedelta(days=nights)
    return checkin.strftime("%Y-%m-%d"), checkout.strftime("%Y-%m-%d")


class SerpApiHotelsEngine:
    """
    Motor hoteles via SerpAPI Google Hotels. Reemplazo de HotellookEngine
    (endpoint deprecated). Búsqueda por query="Ciudad, País" → top 10
    hoteles ordenados por precio asc.
    """

    def __init__(self):
        self.api_key = SERPAPI_KEY
        self.tp_marker = TP_MARKER or "714734"
        self.available = bool(self.api_key)
        # Conservador: SerpAPI no documenta rate limits estrictos pero
        # 4 concurrent es seguro y rápido (16 ciudades = 4 batches).
        self._semaphore = asyncio.Semaphore(4)
        if not self.available:
            print("⚠️  SerpAPI Hotels: SERPAPI_KEY no configurada — engine deshabilitado.")

    async def _search_one(self, session: aiohttp.ClientSession,
                          query: str, country: str, region: str,
                          checkin: str, checkout: str) -> List[Dict]:
        params = {
            "engine": "google_hotels",
            "q": query,
            "check_in_date": checkin,
            "check_out_date": checkout,
            "adults": "2",
            "currency": "EUR",
            "hl": "es",
            "gl": "es",
            "api_key": self.api_key,
        }
        async with self._semaphore:
            try:
                async with session.get(
                    BASE, params=params,
                    timeout=aiohttp.ClientTimeout(total=20),
                ) as resp:
                    if resp.status != 200:
                        return []
                    data = await resp.json()
            except (aiohttp.ClientError, asyncio.TimeoutError, ValueError):
                return []

        properties = data.get("properties") or []
        nights_count = max(1, (datetime.strptime(checkout, "%Y-%m-%d") -
                                datetime.strptime(checkin, "%Y-%m-%d")).days)
        out: List[Dict] = []
        for p in properties[:10]:  # top 10 más baratos
            try:
                rate = p.get("rate_per_night") or {}
                price = float(rate.get("extracted_lowest") or 0)
                if price <= 0:
                    continue
                total = float((p.get("total_rate") or {}).get("extracted_lowest") or price * nights_count)
                hotel = {
                    "id": f"hotel_{query.lower().replace(', ', '_').replace(' ', '_')}_{p.get('property_token','')[:8]}",
                    "type": "hotel",
                    "headline": p.get("name", "Hotel"),
                    "hotel_name": p.get("name", "Hotel"),
                    "city_to": query.split(",")[0].strip(),
                    "country_to": country,
                    "region": region,
                    "price_eur": round(price, 2),
                    "price_total_eur": round(total, 2),
                    "price_per_night": round(price, 2),
                    "nights": nights_count,
                    "checkin": checkin,
                    "checkout": checkout,
                    "stars": float(p.get("hotel_class") or p.get("extracted_hotel_class") or 0),
                    "rating": float(p.get("overall_rating") or 0),
                    "reviews": int(p.get("reviews") or 0),
                    "image_url": (p.get("images") or [{}])[0].get("thumbnail", ""),
                    "booking_url": _build_booking_url(query, checkin, checkout, self.tp_marker),
                    "source": "serpapi-google-hotels",
                    "sources": ["serpapi-google-hotels"],
                    "found_at": datetime.utcnow().isoformat(),
                    "expires_at": (datetime.utcnow() + timedelta(hours=12)).isoformat(),
                    "verified": True,
                    "score": min(95, 50 + int(price < 100) * 10 + int(p.get("overall_rating", 0) >= 8) * 15),
                    "savings_pct": 0,
                    "savings_eur": 0,
                }
                out.append(hotel)
            except (ValueError, TypeError, KeyError):
                continue
        return out

    async def search_top_destinations(
        self, destinations: Optional[List[Tuple[str, str, str]]] = None,
        date_from: str = "", date_to: str = "",
    ) -> List[Dict]:
        """Compatible con HotellookEngine.search_top_destinations(). date_from/to ignorados — usamos próximo mes día 15."""
        if not self.available:
            return []
        cities = destinations or _get_cities_for_run()
        checkin, checkout = _next_window(days_ahead=30, nights=3)
        print(f"   🏨 SerpAPI Hotels: {len(cities)} ciudades × 1 ventana ({checkin} → {checkout})")

        async with aiohttp.ClientSession() as session:
            tasks = [self._search_one(session, q, c, r, checkin, checkout)
                     for (q, c, r) in cities]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        flat: List[Dict] = []
        ok = 0
        for r in results:
            if isinstance(r, list):
                flat.extend(r)
                if r:
                    ok += 1
        print(f"   🏨 SerpAPI Hotels: {ok}/{len(cities)} ciudades con datos, {len(flat)} hoteles totales")
        return flat


def _build_booking_url(query: str, checkin: str, checkout: str, marker: str) -> str:
    """URL Booking.com con afiliado TP_MARKER."""
    params = {
        "ss": query,
        "checkin": checkin,
        "checkout": checkout,
        "group_adults": "2",
        "no_rooms": "1",
        "aid": marker,
        "label": "tripcazador-hunter",
    }
    return f"https://www.booking.com/searchresults.html?{urlencode(params)}"
