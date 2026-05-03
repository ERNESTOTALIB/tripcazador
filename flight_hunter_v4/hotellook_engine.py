"""
Flight Hunter V4 — Motor Hotellook (Travelpayouts Hotels)
==========================================================
Sin clave adicional. Reusa el mismo `TP_MARKER` que el motor de vuelos
Travelpayouts → activa comisiones de afiliado en cada reserva (4-7%).

Cobertura: ~2M hoteles agregados de Booking.com / Expedia / Hotels.com /
Agoda / Trip.com. Hotellook devuelve el precio mínimo por noche para
cada hotel/ciudad, refrescado cada ~24h.

Endpoints públicos (no requieren API key, sólo `marker` para tracking):
  /cache.json   → precios cacheados de los hoteles más baratos por ciudad
  /lookup.json  → resolución de ciudad/hotel (no usado en pipeline actual)

Doc oficial:
  https://support.travelpayouts.com/hc/en-us/sections/202741098-Hotellook-Data-API
"""

import asyncio
import os
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import aiohttp

try:
    from config import TRAVELPAYOUTS_MARKER as _MARKER_CFG
except ImportError:
    _MARKER_CFG = ""

TP_MARKER = os.environ.get("TP_MARKER", _MARKER_CFG or "")
BASE = "https://engine.hotellook.com/api/v2"

# Mapeo IATA → display info para enriquecer la salida sin depender de
# una API extra de geocoding. Cubre las 16 ciudades top del cron.
CITY_META: Dict[str, Tuple[str, str, str]] = {
    "Madrid":     ("MAD", "España",         "Europa"),
    "Barcelona":  ("BCN", "España",         "Europa"),
    "Paris":      ("PAR", "Francia",        "Europa"),
    "Roma":       ("ROM", "Italia",         "Europa"),
    "Lisboa":     ("LIS", "Portugal",       "Europa"),
    "Berlin":     ("BER", "Alemania",       "Europa"),
    "Amsterdam":  ("AMS", "Países Bajos",   "Europa"),
    "Praga":      ("PRG", "Chequia",        "Europa"),
    "Viena":      ("VIE", "Austria",        "Europa"),
    "Atenas":     ("ATH", "Grecia",         "Europa"),
    "Estambul":   ("IST", "Turquía",        "Oriente Medio"),
    "Marrakech":  ("RAK", "Marruecos",      "África"),
    "Tokio":      ("TYO", "Japón",          "Asia"),
    "Bangkok":    ("BKK", "Tailandia",      "Asia"),
    "Nueva York": ("NYC", "Estados Unidos", "América Norte"),
    "Bali":       ("DPS", "Indonesia",      "Asia"),
}

# Hotellook resuelve mejor las ciudades en inglés que con grafía castellana.
CITY_QUERY_OVERRIDE: Dict[str, str] = {
    "Tokio":      "Tokyo",
    "Atenas":     "Athens",
    "Praga":      "Prague",
    "Viena":      "Vienna",
    "Estambul":   "Istanbul",
    "Lisboa":     "Lisbon",
    "Roma":       "Rome",
    "Nueva York": "New York",
    "Bali":       "Denpasar",
}


def _months_in_range(date_from: str, date_to: str) -> List[Tuple[str, str]]:
    """
    Genera 1 ventana checkin/checkout (3 noches, día 15 del mes) por mes
    en el rango. Limita a 6 ventanas para no abusar de la API.
    16 ciudades × 6 ventanas = 96 requests, seguro para cron 6h.
    """
    try:
        df = datetime.strptime(date_from, "%Y-%m-%d")
        dt = datetime.strptime(date_to, "%Y-%m-%d")
    except (ValueError, TypeError):
        base = datetime.now() + timedelta(days=30)
        return [(base.strftime("%Y-%m-%d"),
                 (base + timedelta(days=3)).strftime("%Y-%m-%d"))]
    if dt <= df:
        return []
    windows: List[Tuple[str, str]] = []
    cur = df.replace(day=1)
    nights = 3
    while cur <= dt and len(windows) < 6:
        checkin = cur.replace(day=15)
        if df <= checkin <= dt:
            checkout = checkin + timedelta(days=nights)
            windows.append((checkin.strftime("%Y-%m-%d"),
                            checkout.strftime("%Y-%m-%d")))
        if cur.month == 12:
            cur = cur.replace(year=cur.year + 1, month=1)
        else:
            cur = cur.replace(month=cur.month + 1)
    return windows


def _build_booking_url(city_query: str, checkin: str, checkout: str,
                       hotel_id: Optional[int] = None) -> str:
    """Construye URL Hotellook con marker afiliado (TP_MARKER)."""
    params = {
        "destination": city_query,
        "checkIn":     checkin,
        "checkOut":    checkout,
        "adults":      "2",
        "currency":    "EUR",
        "language":    "es",
    }
    if TP_MARKER:
        params["marker"] = TP_MARKER
    if hotel_id:
        params["hotelId"] = str(hotel_id)
    return f"https://search.hotellook.com/hotels?{urllib.parse.urlencode(params)}"


def _hotel_to_dict(item: Dict, city: str, checkin: str, checkout: str,
                   nights: int) -> Optional[Dict]:
    """Normaliza una entrada de /cache.json al schema unificado."""
    try:
        ppn_raw = item.get("priceFrom") or item.get("priceAvg") or 0
        ppn = float(ppn_raw) if ppn_raw else 0.0
        if ppn <= 0:
            return None
        hotel_name = (item.get("hotelName") or "").strip()
        if not hotel_name:
            return None

        stars = int(item.get("stars") or 0)
        rating = float(item.get("rating") or 0)  # 0-10
        location = item.get("location") or {}
        country_raw = (location.get("country") or "").strip()

        hotel_id = item.get("hotelId") or item.get("id")
        photo_id = item.get("photoId") or 0
        # CDN público de Hotellook (sin auth)
        if photo_id and hotel_id:
            image_url = (
                f"https://photo.hotellook.com/image_v2/limit/"
                f"h{hotel_id}_{photo_id}/800/520.auto"
            )
        else:
            image_url = ""

        meta_iata, meta_country, meta_region = CITY_META.get(city, ("", "", ""))
        country_label = meta_country or country_raw
        # Si no tenemos meta IATA, generamos un placeholder estable (3
        # primeras letras) para que el dedup_key del exporter sea único.
        iata = meta_iata or (city[:3].upper() if city else "HOT")

        city_query = CITY_QUERY_OVERRIDE.get(city, city)
        booking_url = _build_booking_url(
            city_query, checkin, checkout,
            hotel_id=int(hotel_id) if hotel_id else None,
        )

        total = round(ppn * nights, 2)
        ppn_round = round(ppn, 2)

        # Tags consumidos por HotelCard del frontend
        tags: List[str] = ["hotel"]
        if stars:
            tags.append(f"{stars}-stars")
        if stars >= 5:
            tags.append("luxury")
        elif stars and stars <= 2:
            tags.append("budget")
        beach_cities = {"Bali", "Marrakech", "Bangkok"}
        tags.append("beach" if city in beach_cities else "city")

        if rating >= 9.0:
            rating_label = "Magnífico"
        elif rating >= 8.5:
            rating_label = "Muy bueno"
        elif rating >= 8.0:
            rating_label = "Bien"
        else:
            rating_label = ""

        headline_parts = [hotel_name]
        if stars:
            headline_parts.append(f"{stars}★")
        headline_parts.append(f"— {ppn_round:.0f}€/noche")
        if rating_label:
            headline_parts.append(f"({rating_label})")
        headline = " ".join(headline_parts)

        slug = "".join(c for c in hotel_name.lower() if c.isalnum() or c == "-")[:48]
        deal_id = f"hotellook_{iata.lower()}_{slug}_{checkin.replace('-','')}"
        now_iso = datetime.now().isoformat()
        # TTL 24h: el cache de Hotellook se refresca a ese ritmo
        expires_iso = (datetime.now() + timedelta(hours=24)).isoformat()

        return {
            "id":              deal_id,
            "type":            "hotel",
            "source":          "hotellook",
            "headline":        headline,
            "city":            city,
            "city_from":       "",
            "city_to":         city,
            "country_to":      country_label,
            "region":          meta_region,
            "destination":     iata,
            "origin":          "",
            "hotel_name":      hotel_name,
            "stars":           stars,
            "price_eur":       total,
            "price_per_night": ppn_round,
            "nights":          nights,
            "checkin":         checkin,
            "checkout":        checkout,
            "date_out":        checkin,    # alias para ordenación unificada
            "date_ret":        checkout,
            "rating":          round(rating, 1),
            "review_score":    round(rating, 1),
            "image_url":       image_url,
            "booking_url":     booking_url,
            "found_at":        now_iso,
            "expires_at":      expires_iso,
            "tags":            tags,
            # Campos requeridos por el schema unificado del exporter
            "score":           min(100.0, 60.0 + rating * 4 + stars * 2),
            "verified":        True,        # Hotellook agrega multi-source
            "sources":         ["hotellook"],
            "classification":  "OFERTA",
            "savings_pct":     0.0,
            "savings_eur":     0.0,
            "cabin":           "",
            "airline":         "",
            "stops":           0,
            "duration_min":    0,
        }
    except (TypeError, ValueError, KeyError):
        return None


class HotellookEngine:
    """
    Motor Hotellook para hoteles via Travelpayouts. No requiere API key
    propia — sólo `TP_MARKER` (mismo que vuelos) para activar comisiones.

    Patrón idéntico a TravelpayoutsEngine: aiohttp + semáforo, errores
    silenciados (vuelve [] si la API no responde o `TP_MARKER` falta).
    """

    def __init__(self):
        self.marker = TP_MARKER
        self.available = bool(TP_MARKER)
        self._semaphore = asyncio.Semaphore(4)
        if not self.available:
            print("⚠️  Hotellook: TP_MARKER no configurado — engine deshabilitado.")

    async def _get(self, session: aiohttp.ClientSession, url: str,
                   params: Dict, debug_label: str = "") -> Optional[List[Dict]]:
        """GET con semáforo y manejo de errores. SSS19: log status para debug."""
        async with self._semaphore:
            try:
                async with session.get(
                    url, params=params,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    if resp.status not in (200, 201):
                        # SSS19: log primer fallo para diagnóstico
                        if not getattr(self, "_logged_status", False):
                            print(f"   ⚠️  Hotellook HTTP {resp.status} {debug_label}")
                            self._logged_status = True
                        return None
                    data = await resp.json(content_type=None)
                    if isinstance(data, list):
                        return data
                    if isinstance(data, dict):
                        return [data]
                    return None
            except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as e:
                if not getattr(self, "_logged_err", False):
                    print(f"   ⚠️  Hotellook err {type(e).__name__}: {e}")
                    self._logged_err = True
                return None

    async def fetch_city_window(self, session: aiohttp.ClientSession,
                                 city: str, checkin: str, checkout: str,
                                 limit: int = 20) -> List[Dict]:
        """
        Llama /cache.json para una (city, checkin, checkout) concreta.

        SSS19: estrategia dual — intenta primero con `location=City Name`,
        y si falla (404 o cero hoteles) reintenta con `iata=XXX` que es
        el path canónico de la API y más estable que la búsqueda por texto.
        """
        city_query = CITY_QUERY_OVERRIDE.get(city, city)
        meta = CITY_META.get(city)
        iata = meta[0] if meta else None

        # Intento 1: location-based (search-friendly)
        params = {
            "location": city_query,
            "currency": "eur",
            "checkIn":  checkin,
            "checkOut": checkout,
            "limit":    str(limit),
        }
        if self.marker:
            params["marker"] = self.marker

        raw = await self._get(session, f"{BASE}/cache.json", params,
                              debug_label=f"loc={city_query}")

        # Intento 2 (fallback): iata-based si el primero falló o devolvió vacío
        if not raw and iata:
            params2 = {
                "iata":     iata,
                "currency": "eur",
                "checkIn":  checkin,
                "checkOut": checkout,
                "limit":    str(limit),
            }
            if self.marker:
                params2["marker"] = self.marker
            raw = await self._get(session, f"{BASE}/cache.json", params2,
                                  debug_label=f"iata={iata}")

        if not raw:
            return []
        try:
            d_in = datetime.strptime(checkin, "%Y-%m-%d")
            d_out = datetime.strptime(checkout, "%Y-%m-%d")
            nights = max(1, (d_out - d_in).days)
        except ValueError:
            nights = 3
        out: List[Dict] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            normalized = _hotel_to_dict(item, city, checkin, checkout, nights)
            if normalized:
                out.append(normalized)
        return out

    async def search_top_destinations(
        self, destinations: List[str],
        date_from: str, date_to: str,
    ) -> List[Dict]:
        """
        Lanza /cache.json para cada (destino × ventana). Devuelve la
        unión deduplicada por (city + hotel_name + checkin) manteniendo
        el precio mínimo. Top 100 por price_per_night ascendente.
        """
        if not self.available or not destinations:
            return []
        windows = _months_in_range(date_from, date_to)
        if not windows:
            return []

        print(f"   🏨 Hotellook: {len(destinations)} ciudades × "
              f"{len(windows)} ventanas = "
              f"{len(destinations) * len(windows)} requests")

        results: List[Dict] = []
        async with aiohttp.ClientSession() as session:
            tasks = [
                self.fetch_city_window(session, city, ci, co)
                for city in destinations
                for (ci, co) in windows
            ]
            gathered = await asyncio.gather(*tasks, return_exceptions=True)

        for r in gathered:
            if isinstance(r, list):
                results.extend(r)

        # Dedup por (city, hotel_name, checkin) → quedarnos con precio mínimo
        seen: Dict[Tuple[str, str, str], Dict] = {}
        for h in results:
            key = (h.get("city_to", ""), h.get("hotel_name", ""), h.get("checkin", ""))
            cur = seen.get(key)
            if cur is None or h.get("price_eur", 9e9) < cur.get("price_eur", 9e9):
                seen[key] = h

        deduped = list(seen.values())
        deduped.sort(key=lambda x: float(x.get("price_per_night", 9e9) or 9e9))
        deduped = deduped[:100]

        print(f"   🏨 Hotellook: {len(deduped)} hoteles únicos "
              f"(de {len(results)} bruto)")
        return deduped
