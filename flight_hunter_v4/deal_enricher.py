"""
Flight Hunter V4 — Deal Enricher
==================================
Enriquece cada deal con campos adicionales para la web TripCazador:
- headline: titular atractivo del deal
- tags: etiquetas para filtros web (beach, ciudad, ski, etc.)
- expires_at: cuándo expira el deal (TTL por fuente)
- price_per_night: precio por noche (para comparativa hoteles+vuelos)
- image_url: imagen de Unsplash del destino
- coords: (lat, lon) del aeropuerto destino
- region: continente/región geográfica

Uso:
    from deal_enricher import enrich_deal, enrich_all
    deals = enrich_all(analyzed_flights)
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
from geo_data import get_image_url, get_coords, AIRPORT_GEO


# ─────────────────────────────────────────────
# TTL por fuente (cuánto tiempo es válido el precio)
# ─────────────────────────────────────────────
SOURCE_TTL_HOURS = {
    "ryanair":       12,
    "kiwi":          18,
    "travelpayouts": 24,
    "serpapi":        6,
    "rapidapi":      12,
    "vueling":       12,
    "duffel":        24,
}
DEFAULT_TTL_HOURS = 18


# ─────────────────────────────────────────────
# TAGS por destino y región
# ─────────────────────────────────────────────
DESTINATION_TAGS = {
    # Playas
    "PMI": ["beach", "island", "party", "summer"],
    "IBZ": ["beach", "party", "island", "summer"],
    "TFS": ["beach", "island", "sol", "canarias"],
    "LPA": ["beach", "island", "sol", "canarias"],
    "FUE": ["beach", "island", "sol", "canarias"],
    "ACE": ["beach", "island", "sol", "canarias"],
    "HKT": ["beach", "asia", "island", "tropical"],
    "DPS": ["beach", "island", "tropical", "asia"],
    "MLE": ["beach", "island", "luxury", "tropical"],
    "PUJ": ["beach", "caribe", "resort", "all-inclusive"],
    "CUN": ["beach", "caribe", "resort", "mexico"],
    "HAV": ["beach", "cultura", "caribe", "retro"],
    "MBJ": ["beach", "caribe", "island", "jamaica"],
    "HRG": ["beach", "egipto", "resort", "buceo"],
    "SSH": ["beach", "egipto", "buceo", "resort"],
    "MRU": ["beach", "island", "luxury", "africa"],
    "ZNZ": ["beach", "island", "africa", "safari"],
    "GOI": ["beach", "india", "tropical"],
    "CMB": ["beach", "sri-lanka", "island"],
    # Ciudades
    "NRT": ["ciudad", "japón", "cultura", "asia"],
    "HND": ["ciudad", "japón", "cultura", "asia"],
    "ICN": ["ciudad", "corea", "cultura", "asia"],
    "BKK": ["ciudad", "asia", "gastronomia", "templos"],
    "SIN": ["ciudad", "asia", "moderno", "gastronomia"],
    "HKG": ["ciudad", "asia", "compras", "negocios"],
    "JFK": ["ciudad", "usa", "negocios", "cultura"],
    "LAX": ["ciudad", "usa", "entretenimiento"],
    "MIA": ["ciudad", "usa", "beach", "caribe"],
    "GRU": ["ciudad", "brasil", "sudamerica"],
    "EZE": ["ciudad", "argentina", "tango", "sudamerica"],
    "BOG": ["ciudad", "colombia", "sudamerica"],
    "SCL": ["ciudad", "chile", "sudamerica"],
    "LIM": ["ciudad", "peru", "cultura", "sudamerica"],
    # Safari / Naturaleza
    "NBO": ["safari", "africa", "naturaleza", "wildlife"],
    "MBA": ["beach", "africa", "safari"],
    "JNB": ["safari", "africa", "ciudad"],
    "CPT": ["ciudad", "africa", "naturaleza", "wine"],
    "DAR": ["africa", "naturaleza", "safari", "tanzania"],
    # Lujo
    "DXB": ["lujo", "compras", "moderno", "oriente-medio"],
    "DOH": ["lujo", "oriente-medio", "business"],
    "AUH": ["lujo", "oriente-medio"],
    # Cultura
    "CAI": ["cultura", "historia", "egipto", "piramides"],
    "ATH": ["cultura", "historia", "grecia", "ciudad"],
    "IST": ["cultura", "historia", "turquia", "ciudad"],
    "TLV": ["cultura", "historia", "israel"],
    "CMN": ["cultura", "marruecos", "medina"],
    "RAK": ["cultura", "marruecos", "medina", "desierto"],
    # Esquí / Montaña
    "GVA": ["ski", "montaña", "lujo", "suiza"],
    "ZRH": ["ski", "montaña", "negocios", "suiza"],
    # Oceania
    "SYD": ["ciudad", "beach", "australia", "oceania"],
    "MEL": ["ciudad", "australia", "cultura", "oceania"],
    "AKL": ["naturaleza", "nueva-zelanda", "oceania"],
}

REGION_TAGS = {
    "Europa":        ["europa", "corto", "city-break"],
    "Asia":          ["asia", "largo", "exotic"],
    "América Norte": ["usa", "canada", "transatlantico"],
    "América Sur":   ["latam", "sudamerica", "transatlantico"],
    "Caribe":        ["caribe", "beach", "tropical"],
    "Oriente Medio": ["oriente-medio", "largo", "lujo"],
    "África":        ["africa", "largo", "safari"],
    "Oceanía":       ["oceania", "largo", "exotic"],
}

# Tags por cabina
CABIN_TAGS = {
    "economy":         ["economy"],
    "premium_economy": ["premium-economy", "comfort"],
    "business":        ["business", "lujo", "cama-plana"],
    "first":           ["first-class", "lujo-extremo"],
}


def _generate_headline(flight: Dict) -> str:
    """
    Genera un titular atractivo para el deal.
    Ejemplos:
    - "🔥 Error fare: Tokio desde Madrid a solo 198€ en Business"
    - "🌴 Bali desde Frankfurt a 312€ — 67% de descuento"
    - "💰 Error fare confirmado: Nueva York desde 189€ (Vuelo directo)"
    """
    price = flight.get("price_eur", 0)
    origin = flight.get("origin", "")
    dest = flight.get("destination", "")
    city = flight.get("city_to") or dest
    cabin = flight.get("cabin", "economy").lower()
    classification = flight.get("classification", "")
    savings_pct = flight.get("savings_pct", 0)
    stops = flight.get("stops", 1)
    airline_name = flight.get("airline_name", flight.get("airline", ""))
    region = flight.get("region", "")

    # Emoji por clasificación
    emoji = {
        "CRÍTICO": "🔥",
        "ERROR": "⚡",
        "ANOMALÍA": "🎯",
        "OFERTA": "💰",
    }.get(classification, "✈️")

    # Tipo de vuelo
    direct = "vuelo directo" if stops == 0 else f"{stops} escala"

    # Cabin label
    cabin_label = {
        "economy": "",
        "business": " en Business",
        "premium_economy": " en Premium Economy",
        "first": " en First Class",
    }.get(cabin, "")

    # Headline base
    if classification in ("CRÍTICO", "ERROR"):
        if savings_pct >= 50:
            return f"{emoji} Error fare: {city} desde {origin} a solo {price:.0f}€{cabin_label}"
        else:
            return f"{emoji} Precio anómalo: {city} desde {origin} a {price:.0f}€{cabin_label}"
    elif savings_pct >= 40:
        return f"{emoji} {city} desde {origin} a {price:.0f}€ — {savings_pct:.0f}% descuento{cabin_label}"
    elif cabin in ("business", "first"):
        return f"{emoji} {city} en {cabin.title()} desde {origin} a {price:.0f}€ — ¡ofertón!"
    elif region in ("Asia", "Oceanía", "América Norte", "América Sur"):
        return f"{emoji} {city} desde {origin} a solo {price:.0f}€ ({direct}){cabin_label}"
    else:
        return f"{emoji} {city} desde {origin} a {price:.0f}€{cabin_label}"


def _compute_expires_at(flight: Dict) -> str:
    """Calcula cuándo expira el deal según la fuente."""
    source = flight.get("source", "kiwi")
    ttl_hours = SOURCE_TTL_HOURS.get(source, DEFAULT_TTL_HOURS)
    found_at = flight.get("found_at") or flight.get("scraped_at") or datetime.now().isoformat()
    try:
        found_dt = datetime.fromisoformat(found_at[:19])
    except Exception:
        found_dt = datetime.now()
    expires_dt = found_dt + timedelta(hours=ttl_hours)
    return expires_dt.isoformat()


def _compute_price_per_night(flight: Dict) -> Optional[float]:
    """Calcula el precio por noche si hay datos de duración de estancia."""
    nights = flight.get("nights", 0)
    price = flight.get("price_eur", 0)
    if nights and nights > 0 and price > 0:
        return round(price / nights, 2)
    return None


def _get_tags(flight: Dict) -> List[str]:
    """Genera lista de tags para filtros web."""
    dest = flight.get("destination", "")
    region = flight.get("region", "")
    cabin = flight.get("cabin", "economy").lower()
    stops = flight.get("stops", 1)
    price = flight.get("price_eur", 0)

    tags = set()

    # Tags por destino específico
    dest_tags = DESTINATION_TAGS.get(dest, [])
    tags.update(dest_tags)

    # Tags por región (solo si no hay tags específicos de destino)
    if not dest_tags:
        region_tags = REGION_TAGS.get(region, [])
        tags.update(region_tags)

    # Tags por cabina
    cabin_tags = CABIN_TAGS.get(cabin, [cabin])
    tags.update(cabin_tags)

    # Tags funcionales
    if stops == 0:
        tags.add("directo")
    elif stops == 1:
        tags.add("1-escala")

    # Tags por precio
    if price < 100:
        tags.add("menos-100")
    elif price < 200:
        tags.add("menos-200")
    elif price < 400:
        tags.add("menos-400")

    # Tag por clasificación
    classification = flight.get("classification", "")
    if classification in ("CRÍTICO", "ERROR"):
        tags.add("error-fare")
    elif classification == "ANOMALÍA":
        tags.add("anomalia")

    return sorted(list(tags))


def enrich_deal(flight: Dict) -> Dict:
    """
    Enriquece un deal con todos los campos adicionales para la web.
    Retorna el mismo dict con los campos nuevos añadidos.
    """
    dest = flight.get("destination", "")
    region = flight.get("region", "")

    # Imagen
    image_url = get_image_url(dest, region)

    # Coordenadas
    coords = get_coords(dest)

    # Titular
    headline = _generate_headline(flight)

    # Tags
    tags = _get_tags(flight)

    # Expiración
    expires_at = _compute_expires_at(flight)

    # Precio por noche
    price_per_night = _compute_price_per_night(flight)

    # Normalizar cabin a lowercase
    cabin = flight.get("cabin", "economy")
    if isinstance(cabin, str):
        cabin = cabin.lower().replace(" ", "_").replace("-", "_")
    flight["cabin"] = cabin

    # Añadir campos enriquecidos
    flight.update({
        "headline": headline,
        "tags": tags,
        "expires_at": expires_at,
        "image_url": image_url,
        "lat": coords[0] if coords else None,
        "lon": coords[1] if coords else None,
    })

    if price_per_night is not None:
        flight["price_per_night"] = price_per_night

    return flight


def enrich_all(flights: List[Dict]) -> List[Dict]:
    """
    Enriquece todos los deals de una lista.
    Aplica enrich_deal() a cada vuelo y retorna la lista completa.
    """
    return [enrich_deal(f) for f in flights]
