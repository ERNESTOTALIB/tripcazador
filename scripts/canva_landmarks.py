"""
canva_landmarks.py — fase SSS75 (May 2026)

Catálogo de 5 landmarks (atracciones / comida / barrio) por destino para
generar el carrusel IG estilo Canva Barcelona reference. Cada destino
provee 5 entradas: hero_strips (5 photo URLs para Plate I background),
places, food, tips, cta (cada uno con name/desc/label/coord/photo).

Si un destino no está en el catálogo, el generador cae a un fallback
genérico usando la foto principal del destino para los 5 slides.
"""
from typing import TypedDict, Dict, List, Optional


class PlateContent(TypedDict):
    name: str        # Title (serif italic terracotta)
    desc: str        # Description (serif justified)
    label: str       # Top-left pill (mono uppercase)
    coord: str       # Top-right pill (mono coord)
    photo: str       # Background photo URL (Wikimedia or Unsplash)


class DestinationLandmarks(TypedDict):
    hero_strips: List[str]      # 5 photo URLs for Plate I bg
    hero_subtitle: str          # Tagline italic
    places: PlateContent
    food: PlateContent
    tips: PlateContent
    cta: PlateContent


# Wikimedia Commons URLs (high res, free, no API key needed)
LANDMARKS: Dict[str, DestinationLandmarks] = {
    "barcelona": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg/1280px-Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Barcelona_Parc_G%C3%BCell_el_drac.jpg/1280px-Barcelona_Parc_G%C3%BCell_el_drac.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Casa_Batll%C3%B3_01.jpg/1280px-Casa_Batll%C3%B3_01.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Tapas_in_Barcelona_02.jpg/1280px-Tapas_in_Barcelona_02.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Promenade_and_beach%2C_Platja_de_la_Barceloneta%2C_Barcelona%2C_2015.jpg/1280px-Promenade_and_beach%2C_Platja_de_la_Barceloneta%2C_Barcelona%2C_2015.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado que lo paga todo",
        "places": {
            "name": "Park Güell, Barcelona",
            "desc": "El jardín que Gaudí pintó con cerámica rota. Reserva online — la cola in situ supera 2h en alta temporada. Entrada 13€, abre 08:30.",
            "label": "LUGAR  Nº 1  ·  ALTA",
            "coord": "41°24′ N · 02°09′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Barcelona_Parc_G%C3%BCell_el_drac.jpg/1280px-Barcelona_Parc_G%C3%BCell_el_drac.jpg",
        },
        "food": {
            "name": "El Born, Gòtico",
            "desc": "El barrio donde se come y se bebe la ciudad. Menú del día 13-17€, vermut a 3,50€. Evita Las Ramblas: los locales del Born sirven mejor a mitad de precio.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "41°23′ N · 02°10′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Tapas_in_Barcelona_02.jpg/1280px-Tapas_in_Barcelona_02.jpg",
        },
        "tips": {
            "name": "Casa Batlló, Eixample",
            "desc": "Modernismo en la espina del Eixample. Combo con Sagrada Familia y Park Güell desde 65€ — ahorras 22€ frente a entradas sueltas.",
            "label": "TIP  ·  AHORRO",
            "coord": "41°23′ N · 02°09′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Casa_Batll%C3%B3_01.jpg/1280px-Casa_Batll%C3%B3_01.jpg",
        },
        "cta": {
            "name": "Barceloneta, Mediterráneo",
            "desc": "Playa caminable desde el centro: metro L4 te deja en 15 min desde plaza Catalunya. Paella en chiringuito al atardecer y el próximo chollo ya está saliendo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "41°22′ N · 02°11′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Promenade_and_beach%2C_Platja_de_la_Barceloneta%2C_Barcelona%2C_2015.jpg/1280px-Promenade_and_beach%2C_Platja_de_la_Barceloneta%2C_Barcelona%2C_2015.jpg",
        },
    },
    "lisboa": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Bel%C3%A9m_Tower_at_night%2C_Lisbon_%282%29.jpg/1280px-Bel%C3%A9m_Tower_at_night%2C_Lisbon_%282%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Tram_28_in_Lisbon_%2848358972832%29.jpg/1280px-Tram_28_in_Lisbon_%2848358972832%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Lisbon_%2836831596606%29.jpg/1280px-Lisbon_%2836831596606%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Pasteis_de_Belem.jpg/1280px-Pasteis_de_Belem.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lisbon_Cascais_beach.jpg/1280px-Lisbon_Cascais_beach.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado en la luz portuguesa",
        "places": {
            "name": "Torre de Belém, Lisboa",
            "desc": "Patrimonio UNESCO frente al Tajo. Entrada 8€, abre 10:00. Combina con Mosteiro dos Jerónimos a 5 min andando — ahorras con el combo 16€.",
            "label": "LUGAR  Nº 1  ·  UNESCO",
            "coord": "38°41′ N · 09°12′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Bel%C3%A9m_Tower_at_night%2C_Lisbon_%282%29.jpg/1280px-Bel%C3%A9m_Tower_at_night%2C_Lisbon_%282%29.jpg",
        },
        "food": {
            "name": "Pastéis de Belém",
            "desc": "El pastel de nata original desde 1837. Receta secreta. 1.40€ cada uno — pídelos al horno con canela. Cola larga sí, vale 100% la pena.",
            "label": "GASTRO  ·  ICÓNICO",
            "coord": "38°41′ N · 09°12′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Pasteis_de_Belem.jpg/1280px-Pasteis_de_Belem.jpg",
        },
        "tips": {
            "name": "Tranvía 28, ruta clásica",
            "desc": "El icónico tram amarillo cruza Alfama, Bairro Alto y Estrela. 3.10€ billete suelto o 6.80€ Lisboa Card 24h ilimitado. Súbete temprano — al mediodía va lleno.",
            "label": "TIP  ·  AHORRO",
            "coord": "38°43′ N · 09°08′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Tram_28_in_Lisbon_%2848358972832%29.jpg/1280px-Tram_28_in_Lisbon_%2848358972832%29.jpg",
        },
        "cta": {
            "name": "Cascais, Atlántico",
            "desc": "Pueblo costero a 40 min en tren desde Cais do Sodré (2.30€). Playas del Guincho y centro histórico encantador. Próximo chollo ya saliendo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "38°42′ N · 09°25′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lisbon_Cascais_beach.jpg/1280px-Lisbon_Cascais_beach.jpg",
        },
    },
    "palma": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Palma_Cathedral.jpg/1280px-Palma_Cathedral.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Castell_de_Bellver%2C_Palma_de_Mallorca%2C_Espanya_%28cropped%29.jpg/1280px-Castell_de_Bellver%2C_Palma_de_Mallorca%2C_Espanya_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Cala_Mondrag%C3%B3.jpg/1280px-Cala_Mondrag%C3%B3.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Tapas_de_Mallorca.jpg/1280px-Tapas_de_Mallorca.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Cala_Llombards.jpg/1280px-Cala_Llombards.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado bajo el sol balear",
        "places": {
            "name": "Catedral La Seu, Palma",
            "desc": "Gótico mediterráneo del siglo XIII frente al puerto. Entrada 9€. Cripta + terrazas con vistas a la bahía. Abre 10:00.",
            "label": "LUGAR  Nº 1  ·  GÓTICO",
            "coord": "39°34′ N · 02°39′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Palma_Cathedral.jpg/1280px-Palma_Cathedral.jpg",
        },
        "food": {
            "name": "Tumbet + sobrasada",
            "desc": "Plato típico mallorquín: verduras al horno + sobrasada artesanal. Menú del día 12-15€ en Santa Catalina. Vermut local 3€ al atardecer.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "39°34′ N · 02°38′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Tapas_de_Mallorca.jpg/1280px-Tapas_de_Mallorca.jpg",
        },
        "tips": {
            "name": "Calas escondidas",
            "desc": "Salta los resorts: alquila coche 25€/día y descubre Cala Mondragó, Es Trenc o Sa Calobra. Mejor antes 10:00 — sin gente, sin parking lleno.",
            "label": "TIP  ·  AHORRO",
            "coord": "39°20′ N · 03°11′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Cala_Mondrag%C3%B3.jpg/1280px-Cala_Mondrag%C3%B3.jpg",
        },
        "cta": {
            "name": "Cala Llombards, sur",
            "desc": "Arena fina + agua turquesa al sur de la isla. 30 min en coche desde Palma. Chiringuito con paella y el próximo chollo saliendo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "39°20′ N · 03°06′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Cala_Llombards.jpg/1280px-Cala_Llombards.jpg",
        },
    },
}


def get_landmarks(dest_key: str) -> Optional[DestinationLandmarks]:
    """Lookup landmarks by destination key (city slug). Returns None if not found."""
    if not dest_key:
        return None
    key = dest_key.lower().strip().replace(" ", "_")
    # Normalize accents
    key_norm = (
        key.replace("é", "e").replace("á", "a").replace("í", "i")
        .replace("ó", "o").replace("ú", "u").replace("ñ", "n")
    )
    return LANDMARKS.get(key) or LANDMARKS.get(key_norm)


def fallback_landmarks(dest_key: str, dest_photo_url: str) -> DestinationLandmarks:
    """
    Para destinos sin entry curada usamos la foto del destino en los 5 slides
    + copy genérico. No es ideal pero al menos sale con estética magazine.
    """
    city = dest_key.replace("_", " ").title()
    return {
        "hero_strips": [dest_photo_url] * 5,
        "hero_subtitle": "Cinco motivos para coger el vuelo  ·  y el precio que lo hace urgente",
        "places": {
            "name": f"Centro de {city}",
            "desc": f"El casco histórico concentra museos, miradores y arquitectura icónica. Caminable, gratis explorar — el primer día sirve para orientarte.",
            "label": "LUGAR  Nº 1  ·  CENTRO",
            "coord": "—",
            "photo": dest_photo_url,
        },
        "food": {
            "name": f"Sabores de {city}",
            "desc": f"Cocina local en mercados y tabernas — busca el menú del día (10-15€) frente a las ofertas turísticas. Los locales saben dónde comer.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "—",
            "photo": dest_photo_url,
        },
        "tips": {
            "name": "Tarjeta turística",
            "desc": "La mayoría de capitales tienen una city pass 24-72h: combina transporte ilimitado + entradas museos. Suele ahorrar 30-50% si planeas 3+ visitas/día.",
            "label": "TIP  ·  AHORRO",
            "coord": "—",
            "photo": dest_photo_url,
        },
        "cta": {
            "name": f"{city}, te espera",
            "desc": "El próximo chollo ya está saliendo en tripcazador.com — síguenos para no perdértelo. Cazadores de chollos en activo 24/7.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "—",
            "photo": dest_photo_url,
        },
    }
