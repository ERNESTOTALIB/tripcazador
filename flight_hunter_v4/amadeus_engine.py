"""
Flight Hunter V4 — Motor Amadeus Self-Service API
==================================================
Amadeus es el GDS (Global Distribution System) más grande del mundo.
Cubre prácticamente TODAS las aerolíneas que venden a través de agencias
de viajes, incluyendo las que Ryanair y Travelpayouts NO cubren bien.

AEROLÍNEAS QUE AMADEUS AÑADE (y no teníamos bien):
  ✈️  Eurowings (EW)        — Lufthansa Group lowcost, hub FRA/DUS/CGN
  ✈️  Condor (DE)           — Chárter alemán grande, rutas a Caribe/Asia
  ✈️  TUIfly (X3)           — Chárter turístico alemán (TUI Group)
  ✈️  LOT Polish (LO)       — Hub Varsovia, buenas conexiones EE
  ✈️  airBaltic (BT)        — Hub Riga, rutas a Bálticos y más
  ✈️  Aer Lingus (EI)       — IAG Group, hub Dublín (escala USA barata)
  ✈️  Icelandair (FI)       — Escala Reykjavik (hub transatlántico barato)
  ✈️  Edelweiss Air (WK)    — Chárter suizo, hub ZRH, Mediterráneo/Caribe
  ✈️  Air Serbia (JU)       — Hub Belgrado, conexiones Balcanes/Asia
  ✈️  Luxair (LG)           — Hub LUX (¡aeropuerto clave del usuario!)
  ✈️  Croatia Airlines (OU) — Hub Zagreb, rutas Mediterráneo
  ✈️  Air Malta (KM)        — Malta, connexión Mediterráneo
  ✈️  SunExpress (XQ)       — JV Lufthansa+Turkish, rutas turcas
  ✈️  Nuevelair (BJ)        — Chárter tunecino
  ✈️  Tunisair (TU)         — Línea bandera Túnez
  ✈️  Air Algérie (AH)      — Línea bandera Argelia
  + TODOS los long-haul: Emirates, Qatar, Singapore, ANA, JAL...
  + Business class COMPLETO en todas las rutas

REGISTRO GRATUITO (2 minutos):
  1. https://developers.amadeus.com/register
  2. Crear app → obtener API Key + API Secret
  3. Copiar en config.py:
       AMADEUS_API_KEY    = "tu_key"
       AMADEUS_API_SECRET = "tu_secret"
  4. Límite gratuito: 2000 llamadas/mes (test) — suficiente para uso mensual
  5. Test y producción usan los MISMOS datos de vuelos reales

LÍMITE INTELIGENTE (2000 llamadas/mes):
  - Por defecto usa BASE_URL de PRODUCCIÓN si hay credenciales
  - Modo test: BASE_URL = "https://test.api.amadeus.com"
  - Cada llamada devuelve hasta 20 ofertas de vuelo para (origen, destino, fecha)
  - Estrategia: 11 orígenes × 30 destinos × 1 fecha = 330 llamadas/búsqueda
  - Mensualmente: 1-2 ejecuciones completas dentro del límite gratuito
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple
import config
from airline_links import get_booking_url, get_airline_name

# ── Endpoints ─────────────────────────────────────────────────────────────────
AMADEUS_TEST_URL = "https://test.api.amadeus.com"
AMADEUS_PROD_URL = "https://api.amadeus.com"

AMADEUS_API_KEY    = getattr(config, "AMADEUS_API_KEY",    "")
AMADEUS_API_SECRET = getattr(config, "AMADEUS_API_SECRET", "")

# Cabina: Amadeus usa nombres en inglés mayúsculas
CABIN_AMADEUS = {
    "economy":         "ECONOMY",
    "premium_economy": "PREMIUM_ECONOMY",
    "business":        "BUSINESS",
    "first":           "FIRST",
}
CABIN_AMADEUS_TO_V4 = {
    "ECONOMY":         config.CABIN_ECONOMY,
    "PREMIUM_ECONOMY": config.CABIN_PREMIUM_ECONOMY,
    "BUSINESS":        config.CABIN_BUSINESS,
    "FIRST":           config.CABIN_FIRST,
}
CABIN_AMADEUS_TO_NAME = {
    "ECONOMY":         "economy",
    "PREMIUM_ECONOMY": "premium economy",
    "BUSINESS":        "business",
    "FIRST":           "first",
}

# Destinos IDEALES para Amadeus (aerolíneas GDS que Ryanair/TP no cubre bien)
# Con Amadeus encontramos deals de Eurowings, Condor, LOT, etc. en estas rutas
AMADEUS_ROUTE_PRESETS = {
    # Rutas donde Eurowings/Condor/LOT son fuertes → gran diferencia vs Ryanair
    "eurowings_stronghold": [
        "PMI", "IBZ", "AGP", "ACE", "LPA", "TFS", "FUE", "TFN",   # Islas (Eurowings+Condor)
        "HER", "RHO", "CFU", "SKG", "ATH", "KGS", "JMK",          # Grecia (EW+TUI)
        "AYT", "DLM", "BJV", "SAW", "IST", "ADB",                  # Turquía (SunExpress+EW)
        "SSH", "HRG", "CAI",                                         # Egipto (Edelweiss+Condor)
        "CMN", "RAK", "AGA", "OZZ",                                  # Marruecos (EW+AT+3O)
        "TUN", "MIR", "DJE",                                         # Túnez (Nouvelair+TU)
    ],
    # LOT Polish: hub WAW + conexiones CEE y long-haul
    "lot_connections": [
        "WAW", "KRK", "GDN", "KTW",    # Polonia (LOT hub)
        "JFK", "ORD", "LAX", "YYZ",    # Norteamérica (LOT long-haul)
        "NRT", "ICN", "BKK", "SIN",    # Asia (LOT via WAW)
        "TLV", "BEG", "SKP",           # Balcanes/Oriente (LOT partner)
    ],
    # Icelandair: hub KEF → transatlántico barato vía Reykjavik
    "icelandair": [
        "KEF", "JFK", "BOS", "ORD", "SEA", "YYZ", "YUL",
    ],
    # Aer Lingus: hub DUB → transatlántico barato (IAG Group)
    "aer_lingus": [
        "DUB", "JFK", "BOS", "ORD", "LAX", "SFO", "YYZ", "MIA",
    ],
    # airBaltic: hub RIX + destinos Bálticos/Escandinavia
    "airbaltic": [
        "RIX", "TLL", "VNO", "HEL", "ARN", "OSL", "CPH",
    ],
    # Rutas charter que Amadeus cubre mejor que TP
    "charter_routes": [
        "PMI", "IBZ", "AGP", "FAO", "VLC", "BCN", "MAD",   # España
        "HER", "RHO", "ATH", "SKG",                          # Grecia
        "AYT", "DLM", "IST",                                 # Turquía
        "CMN", "RAK", "TUN", "HRG",                          # África Norte
        "BOJ", "SOF",                                         # Bulgaria
    ],
}

# Aerolíneas que Amadeus cubre especialmente bien (para priorizarlas)
AMADEUS_PRIORITY_AIRLINES = {
    "EW", "DE", "X3", "LO", "BT", "EI", "FI", "WK", "JU", "LG",
    "OU", "KM", "XQ", "BJ", "TU", "AH", "AV", "SM", "NI", "GF",
    "EN", "A5", "YW", "FH", "H4", "ZQ", "W9", "3O", "LS",
    "LH", "AF", "KL", "BA", "SK", "AZ", "TP", "OS", "SN",  # full service también
}


def _parse_iso_duration(dur: str) -> int:
    """Convierte 'PT7H30M' a minutos."""
    if not dur:
        return 0
    dur = dur.replace("PT", "")
    h = m = 0
    if "H" in dur:
        parts = dur.split("H")
        h = int(parts[0])
        dur = parts[1]
    if "M" in dur and dur.replace("M","").isdigit():
        m = int(dur.replace("M",""))
    return h * 60 + m


def _amadeus_offer_to_dict(offer: Dict, origin: str) -> Optional[Dict]:
    """Convierte una oferta Amadeus al formato estándar V4."""
    try:
        price_total = float(offer.get("price", {}).get("total", 0) or 0)
        if price_total <= 0:
            return None

        itineraries = offer.get("itineraries", [])
        if not itineraries:
            return None

        # Itinerario de ida (primero)
        out_itin   = itineraries[0]
        segments   = out_itin.get("segments", [])
        if not segments:
            return None

        first_seg  = segments[0]
        last_seg   = segments[-1]

        # Origen y destino del itinerario completo
        dep = first_seg.get("departure", {})
        arr = last_seg.get("arrival", {})
        dest      = arr.get("iataCode", "")
        date_out  = dep.get("at", "")[:10]
        time_out  = dep.get("at", "")[11:16] if dep.get("at", "") else ""

        # Vuelta (si es roundtrip)
        date_ret = time_ret = ""
        if len(itineraries) > 1:
            ret_segs = itineraries[1].get("segments", [])
            if ret_segs:
                date_ret = ret_segs[0].get("departure", {}).get("at", "")[:10]
                time_ret = ret_segs[0].get("departure", {}).get("at", "")[11:16]

        # Aerolínea validante (principal)
        airline_code = (offer.get("validatingAirlineCodes") or [""])[0]
        if not airline_code:
            airline_code = first_seg.get("carrierCode", "")
        airline_code = airline_code.upper()
        airline_name = get_airline_name(airline_code)

        # Cabina desde travelerPricings
        cabin_amadeus = "ECONOMY"
        try:
            tp = offer.get("travelerPricings", [{}])[0]
            fd = tp.get("fareDetailsBySegment", [{}])[0]
            cabin_amadeus = fd.get("cabin", "ECONOMY").upper()
        except Exception:
            pass

        cabin_v4   = CABIN_AMADEUS_TO_V4.get(cabin_amadeus, config.CABIN_ECONOMY)
        cabin_name = CABIN_AMADEUS_TO_NAME.get(cabin_amadeus, "economy")

        # Escalas
        stops   = len(segments) - 1
        dur_min = _parse_iso_duration(out_itin.get("duration", ""))

        dist_cat = config.get_distance_category(dest)
        booking  = get_booking_url(airline_code, origin, dest, date_out, date_ret)

        return {
            "source":            "amadeus",
            "origin":            origin,
            "origin_full":       origin,
            "destination":       dest,
            "city_to":           dest,
            "country_to":        "",
            "price_eur":         round(price_total, 2),
            "cabin_code":        cabin_v4,
            "cabin":             cabin_name,
            "airline":           airline_code,
            "airline_name":      airline_name,
            "flight_number":     first_seg.get("carrierCode","") + first_seg.get("number",""),
            "date_out":          date_out,
            "time_out":          time_out,
            "date_ret":          date_ret,
            "time_ret":          time_ret,
            "stops":             stops,
            "duration_min":      dur_min,
            "distance_category": dist_cat,
            "booking_url":       booking,
        }
    except Exception:
        return None


class AmadeusEngine:
    """
    Motor Amadeus para Flight Hunter V4.

    Cubre las aerolíneas que Ryanair+Travelpayouts pierden:
    Eurowings, Condor, TUIfly, LOT, airBaltic, Aer Lingus, Icelandair,
    Edelweiss, Air Serbia, Luxair, SunExpress, y TODAS las aerolíneas GDS.

    CONFIGURACIÓN NECESARIA (gratuita, 2 min):
      https://developers.amadeus.com/register
      → AMADEUS_API_KEY + AMADEUS_API_SECRET en config.py

    LÍMITE GRATUITO: 2000 llamadas/mes → suficiente para 1-2 búsquedas completas/mes.

    USO:
      engine = AmadeusEngine()
      if engine.available:
          deals = await engine.search_gds_deals(origins, date_from, date_to)
    """

    def __init__(self, use_test: bool = False):
        self.key    = AMADEUS_API_KEY
        self.secret = AMADEUS_API_SECRET
        self.base   = AMADEUS_TEST_URL if use_test else AMADEUS_PROD_URL
        self.available = bool(self.key and self.secret)
        self._token: Optional[str] = None
        self._token_expiry: float = 0
        self._semaphore = asyncio.Semaphore(5)  # Amadeus permite más concurrencia
        self._call_count = 0

        if not self.available:
            pass  # Silencioso — el motor simplemente no estará activo

    async def _get_token(self, session: aiohttp.ClientSession) -> Optional[str]:
        """Obtiene o renueva el Bearer token OAuth2."""
        now = time.time()
        if self._token and now < self._token_expiry - 60:
            return self._token

        try:
            async with session.post(
                f"{self.base}/v1/security/oauth2/token",
                data={
                    "grant_type":    "client_credentials",
                    "client_id":     self.key,
                    "client_secret": self.secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                self._token        = data.get("access_token")
                expires_in         = int(data.get("expires_in", 1799))
                self._token_expiry = now + expires_in
                return self._token
        except Exception:
            return None

    async def _search_one(
        self,
        session: aiohttp.ClientSession,
        origin: str,
        destination: str,
        departure_date: str,
        cabin: str = "ECONOMY",
        max_results: int = 20,
        non_stop: bool = False,
    ) -> List[Dict]:
        """
        Una búsqueda Amadeus para (origen, destino, fecha, cabina).
        Devuelve hasta max_results vuelos.
        """
        async with self._semaphore:
            token = await self._get_token(session)
            if not token:
                return []

            params = {
                "originLocationCode":      origin,
                "destinationLocationCode": destination,
                "departureDate":           departure_date,
                "adults":                  "1",
                "travelClass":             cabin,
                "currencyCode":            "EUR",
                "max":                     str(max_results),
            }
            if non_stop:
                params["nonStop"] = "true"

            self._call_count += 1
            try:
                async with session.get(
                    f"{self.base}/v2/shopping/flight-offers",
                    params=params,
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=aiohttp.ClientTimeout(total=20),
                ) as resp:
                    if resp.status == 401:
                        self._token = None  # Forzar renovación
                        return []
                    if resp.status not in (200, 201):
                        return []
                    data = await resp.json()
            except Exception:
                return []

        offers = data.get("data", [])
        results = []
        for offer in offers:
            v4 = _amadeus_offer_to_dict(offer, origin)
            if v4 and v4["price_eur"] > 0:
                results.append(v4)

        return results

    def _best_dates_in_range(self, date_from: str, date_to: str, count: int = 2) -> List[str]:
        """
        Genera `count` fechas representativas del rango.
        Spread: inicio del rango, punto medio, 2/3 del rango.
        Prefiere miércoles/jueves (vuelos más baratos mid-week).
        """
        df = datetime.strptime(date_from, "%Y-%m-%d").date()
        dt = datetime.strptime(date_to, "%Y-%m-%d").date()
        total_days = (dt - df).days

        if total_days <= 0:
            return [date_from]

        # Puntos del rango equidistribuidos
        offsets = [total_days // (count + 1) * i for i in range(1, count + 1)]
        dates = []
        for off in offsets:
            d = df + timedelta(days=max(0, off))
            # Buscar el miércoles más cercano (weekday=2)
            for delta in range(-3, 4):
                candidate = d + timedelta(days=delta)
                if candidate.weekday() == 2 and df <= candidate <= dt:
                    d = candidate
                    break
            dates.append(d.strftime("%Y-%m-%d"))

        return list(dict.fromkeys(dates))[:count]  # Dedup manteniendo orden

    async def search_gds_deals(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        destinations: Optional[List[str]] = None,
        cabin: str = "economy",
        max_calls: int = 300,
        focus_gds_airlines: bool = True,
    ) -> List[Dict]:
        """
        Búsqueda principal: encuentra deals GDS que Ryanair/TP no tienen.

        Cubre: Eurowings, Condor, TUIfly, LOT, airBaltic, Aer Lingus,
               Icelandair, Edelweiss, todas las aerolíneas full service.

        Args:
            origins:            Lista de aeropuertos de origen
            date_from/to:       Rango de fechas de búsqueda
            destinations:       Destinos (default: preset optimizado para GDS)
            cabin:              economy, business, premium_economy, first
            max_calls:          Presupuesto de llamadas API (default 300)
            focus_gds_airlines: Si True, prioriza rutas con más aerolíneas GDS

        Returns:
            Lista de vuelos en formato V4 estándar.
        """
        if not self.available:
            print("⚠️  Amadeus: sin credenciales. Regístrate en developers.amadeus.com")
            return []

        cabin_am = CABIN_AMADEUS.get(cabin.lower(), "ECONOMY")

        # Seleccionar destinos
        if destinations:
            dests = destinations
        else:
            # Combinar presets: charter routes (Eurowings+Condor) + LOT connections
            all_dests = list(dict.fromkeys(
                AMADEUS_ROUTE_PRESETS["eurowings_stronghold"] +
                AMADEUS_ROUTE_PRESETS["charter_routes"] +
                AMADEUS_ROUTE_PRESETS["lot_connections"][:8] +
                AMADEUS_ROUTE_PRESETS["icelandair"][:4]
            ))
            dests = all_dests[:40]  # Max 40 destinos

        # Fechas representativas del rango
        search_dates = self._best_dates_in_range(date_from, date_to, count=2)

        # Crear pares (origin, dest, date)
        pairs = []
        for origin in origins:
            for dest in dests:
                if dest != origin:
                    for sd in search_dates:
                        pairs.append((origin, dest, sd))

        # Limitar por presupuesto de llamadas
        pairs = pairs[:max_calls]

        print(f"\n   🌐 Amadeus GDS: {len(origins)} orígenes × {len(dests)} destinos × {len(search_dates)} fechas = {len(pairs)} llamadas")
        print(f"      Aerolíneas cubiertas: Eurowings, Condor, TUIfly, LOT, airBaltic, Aer Lingus, Icelandair + todas GDS")

        all_flights: List[Dict] = []
        errors = 0
        gds_hits = 0  # Vuelos de aerolíneas que antes no teníamos

        async with aiohttp.ClientSession() as session:
            # Autenticar antes de empezar
            token = await self._get_token(session)
            if not token:
                print("   ❌ Amadeus: fallo de autenticación. Verifica AMADEUS_API_KEY y AMADEUS_API_SECRET")
                return []

            # Búsquedas en paralelo (grupos de 10 para respetar rate limit)
            BATCH = 10
            for i in range(0, len(pairs), BATCH):
                batch = pairs[i:i + BATCH]
                tasks = [
                    self._search_one(session, o, d, date, cabin_am)
                    for o, d, date in batch
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for r in results:
                    if isinstance(r, list) and r:
                        # Filtrar el vuelo más barato por (origen, destino, aerolínea)
                        for f in r:
                            all_flights.append(f)
                            if f.get("airline") in AMADEUS_PRIORITY_AIRLINES:
                                gds_hits += 1
                    elif isinstance(r, Exception) or not isinstance(r, list):
                        errors += 1

                # Pequeña pausa entre batches para no saturar
                if i + BATCH < len(pairs):
                    await asyncio.sleep(0.5)

        # Dedup: vuelo más barato por (origin, dest, date_out, airline)
        seen: Dict[Tuple, Dict] = {}
        for f in all_flights:
            key = (f["origin"], f["destination"], f["date_out"], f.get("airline",""))
            if key not in seen or f["price_eur"] < seen[key]["price_eur"]:
                seen[key] = f

        deduped = list(seen.values())

        # Stats por aerolínea
        al_counts: Dict[str, int] = {}
        for f in deduped:
            al = f.get("airline_name") or f.get("airline","?")
            al_counts[al] = al_counts.get(al, 0) + 1
        top_als = sorted(al_counts.items(), key=lambda x: -x[1])[:8]

        print(f"   ✅ Amadeus: {len(deduped)} vuelos únicos ({gds_hits} de aerolíneas GDS nuevas, {errors} errores)")
        print(f"      Top aerolíneas: {', '.join(f'{al}({n})' for al,n in top_als[:5])}")

        return deduped

    async def search_business_gds(
        self,
        origins: List[str],
        date_from: str,
        date_to: str,
        destinations: Optional[List[str]] = None,
        max_calls: int = 150,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Busca Business class + Economy en rutas long-haul vía GDS.
        Devuelve (economy_flights, business_flights) con ratio calculado.

        Cubre aerolíneas que SerpAPI puede no tener: Eurowings Business,
        LOT Business, airBaltic Business, etc.
        """
        if not self.available:
            return [], []

        # Destinos long-haul donde Business clase tiene sentido
        lh_dests = destinations or (
            AMADEUS_ROUTE_PRESETS["lot_connections"] +
            AMADEUS_ROUTE_PRESETS["icelandair"] +
            AMADEUS_ROUTE_PRESETS["aer_lingus"] + [
                "JFK","LAX","ORD","MIA","YYZ","GRU","EZE","SCL",
                "NRT","ICN","BKK","SIN","HKG","DXB","DOH",
            ]
        )
        lh_dests = list(dict.fromkeys(lh_dests))[:30]

        search_date = self._best_dates_in_range(date_from, date_to, count=1)[0]
        pairs = [(o, d) for o in origins for d in lh_dests if d != o]
        pairs = pairs[:max_calls // 2]  # 2 calls per pair (eco + biz)

        print(f"\n   👑 Amadeus Business GDS: {len(pairs)} rutas × 2 cabinas = {len(pairs)*2} llamadas")

        eco_flights: List[Dict] = []
        biz_flights: List[Dict] = []

        async with aiohttp.ClientSession() as session:
            token = await self._get_token(session)
            if not token:
                return [], []

            for origin, dest in pairs:
                eco_task = self._search_one(session, origin, dest, search_date, "ECONOMY", max_results=5)
                biz_task = self._search_one(session, origin, dest, search_date, "BUSINESS", max_results=5)
                eco_res, biz_res = await asyncio.gather(eco_task, biz_task, return_exceptions=True)

                eco_best = min(eco_res, key=lambda x: x["price_eur"]) if isinstance(eco_res, list) and eco_res else None
                biz_best = min(biz_res, key=lambda x: x["price_eur"]) if isinstance(biz_res, list) and biz_res else None

                if eco_best:
                    eco_flights.append(eco_best)

                if biz_best and eco_best:
                    ratio = biz_best["price_eur"] / eco_best["price_eur"] if eco_best["price_eur"] > 0 else 0
                    biz_best["biz_ratio"]     = round(ratio, 2)
                    biz_best["biz_eco_price"] = eco_best["price_eur"]
                    biz_flights.append(biz_best)
                elif biz_best:
                    biz_flights.append(biz_best)

        biz_by_ratio = sorted(biz_flights, key=lambda x: x.get("biz_ratio") or 99)
        print(f"   ✅ Amadeus Business: {len(biz_flights)} business | {len(eco_flights)} economy")
        if biz_by_ratio[:3]:
            for b in biz_by_ratio[:3]:
                ratio = b.get("biz_ratio","—")
                eco   = b.get("biz_eco_price","—")
                print(f"      {b['origin']}→{b['destination']} | B:{b['price_eur']:.0f}€ E:{eco}€ | Ratio:{ratio}x | {b.get('airline_name','?')}")

        return eco_flights, biz_flights
