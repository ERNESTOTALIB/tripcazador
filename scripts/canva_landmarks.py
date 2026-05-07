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


class PlateContent(TypedDict, total=False):
    name: str        # Title (serif italic terracotta) — REQUIRED
    desc: str        # Description (serif justified) — REQUIRED
    label: str       # Top-left pill (mono uppercase) — REQUIRED
    coord: str       # Top-right pill (mono coord) — REQUIRED
    photo: str       # Background photo URL (Wikimedia or Unsplash) — REQUIRED
    # SSS88: query Wikipedia explícita para resolución dinámica.
    # Si está, place_photo_resolver buscará usando este string. Si no,
    # usará `name` como fallback. Útil para casos donde `name` da hits
    # ambiguos (ej. "Coliseo, Roma" → "Coliseo Amauta"; mejor "Coliseum").
    wiki_query: str


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
            "wiki_query": "Park Güell",
            "desc": "El jardín que Gaudí pintó con cerámica rota. Reserva online — la cola in situ supera 2h en alta temporada. Entrada 13€, abre 08:30.",
            "label": "LUGAR  Nº 1  ·  ALTA",
            "coord": "41°24′ N · 02°09′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Barcelona_Parc_G%C3%BCell_el_drac.jpg/1280px-Barcelona_Parc_G%C3%BCell_el_drac.jpg",
        },
        "food": {
            "name": "El Born, Gòtico",
            "wiki_query": "Tapa (gastronomía)",
            "desc": "El barrio donde se come y se bebe la ciudad. Menú del día 13-17€, vermut a 3,50€. Evita Las Ramblas: los locales del Born sirven mejor a mitad de precio.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "41°23′ N · 02°10′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Tapas_in_Barcelona_02.jpg/1280px-Tapas_in_Barcelona_02.jpg",
        },
        "tips": {
            "name": "Casa Batlló, Eixample",
            "wiki_query": "Casa Batlló",
            "desc": "Modernismo en la espina del Eixample. Combo con Sagrada Familia y Park Güell desde 65€ — ahorras 22€ frente a entradas sueltas.",
            "label": "TIP  ·  AHORRO",
            "coord": "41°23′ N · 02°09′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Casa_Batll%C3%B3_01.jpg/1280px-Casa_Batll%C3%B3_01.jpg",
        },
        "cta": {
            "name": "Barceloneta, Mediterráneo",
            "wiki_query": "La Barceloneta",
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
    "roma": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1280px-Colosseo_2020.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Vatican_StPeter_Square.jpg/1280px-Vatican_StPeter_Square.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg/1280px-Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Spaghetti_alla_Carbonara.jpg/1280px-Spaghetti_alla_Carbonara.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Trastevere_Roma.jpg/1280px-Trastevere_Roma.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre ruinas eternas",
        "places": {
            "name": "Coliseo, Roma",
            "wiki_query": "Colosseum",
            "desc": "Anfiteatro del año 80 d.C. Entrada combinada con Foro Romano + Palatino 16€. Reserva online — la cola física puede llegar a 2h en temporada alta.",
            "label": "LUGAR  Nº 1  ·  UNESCO",
            "coord": "41°53′ N · 12°29′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/1280px-Colosseo_2020.jpg",
        },
        "food": {
            "name": "Carbonara en Trastevere",
            "wiki_query": "Carbonara",
            "desc": "Pasta con guanciale, huevo y pecorino — la auténtica romana sin nata. Menú trattoria 12-18€. Evita las turísticas del Vaticano: Trastevere y Testaccio sirven mejor.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "41°53′ N · 12°28′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Spaghetti_alla_Carbonara.jpg/1280px-Spaghetti_alla_Carbonara.jpg",
        },
        "tips": {
            "name": "Vaticano + Capilla Sixtina",
            "wiki_query": "Capilla Sixtina",
            "desc": "Reserva el primer turno (08:00) saltándote la cola por 5€ extra. Capilla Sixtina + Museos Vaticanos 27€. Domingo último del mes entrada gratis (cola gigante).",
            "label": "TIP  ·  AHORRO",
            "coord": "41°54′ N · 12°27′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Vatican_StPeter_Square.jpg/1280px-Vatican_StPeter_Square.jpg",
        },
        "cta": {
            "name": "Trastevere de noche",
            "wiki_query": "Trastevere",
            "desc": "Barrio de callejones empedrados, bares de vino y pizza al trancio. Aperitivo 8-12€ con stuzzichini incluidos. Próximo chollo saliendo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "41°53′ N · 12°28′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Trastevere_Roma.jpg/1280px-Trastevere_Roma.jpg",
        },
    },
    "paris": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/1280px-Tour_Eiffel_Wikimedia_Commons.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Louvre_Museum_Wikimedia_Commons.jpg/1280px-Louvre_Museum_Wikimedia_Commons.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Notre_Dame_de_Paris_DSC_0846w.jpg/1280px-Notre_Dame_de_Paris_DSC_0846w.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Croissants%2C_Paris.jpg/1280px-Croissants%2C_Paris.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Montmartre_Sacre_Coeur.jpg/1280px-Montmartre_Sacre_Coeur.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado en la Ciudad de la Luz",
        "places": {
            "name": "Torre Eiffel, París",
            "desc": "330 m de hierro forjado de 1889. Subida en ascensor 28€, escaleras 19€. Reserva online — sin reserva la cola supera 2h. Vistas mejores al atardecer.",
            "label": "LUGAR  Nº 1  ·  ICÓNICO",
            "coord": "48°51′ N · 02°17′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/1280px-Tour_Eiffel_Wikimedia_Commons.jpg",
        },
        "food": {
            "name": "Croissant + café crème",
            "desc": "El desayuno parisino: panadería de barrio (no cadenas), 1.30€ croissant + 3€ café. Du Pain et des Idées en 10ème es referencia. Vermut a 4€ en bistró.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "48°52′ N · 02°21′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Croissants%2C_Paris.jpg/1280px-Croissants%2C_Paris.jpg",
        },
        "tips": {
            "name": "Museo del Louvre",
            "desc": "Mona Lisa, Venus de Milo, antigüedades egipcias. Entrada 22€, gratis 1er sábado del mes a partir 18:00. Reserva slot online — sin él pierdes 1h en la pirámide.",
            "label": "TIP  ·  AHORRO",
            "coord": "48°51′ N · 02°20′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Louvre_Museum_Wikimedia_Commons.jpg/1280px-Louvre_Museum_Wikimedia_Commons.jpg",
        },
        "cta": {
            "name": "Montmartre, Sacré-Cœur",
            "desc": "Colina con basílica blanca y el barrio bohemio de los pintores. Subida en funicular con billete metro. Atardecer desde la escalinata es el plan. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "48°53′ N · 02°20′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Montmartre_Sacre_Coeur.jpg/1280px-Montmartre_Sacre_Coeur.jpg",
        },
    },
    "estambul": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Sultan_Ahmed_Mosque_at_dusk%2C_Istanbul.jpg/1280px-Sultan_Ahmed_Mosque_at_dusk%2C_Istanbul.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Hagia_Sophia_Mars_2013.jpg/1280px-Hagia_Sophia_Mars_2013.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Grand_Bazaar_Shop.jpg/1280px-Grand_Bazaar_Shop.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Turkish_baklava.jpg/1280px-Turkish_baklava.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bosphorus_Strait_Istanbul.jpg/1280px-Bosphorus_Strait_Istanbul.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre dos continentes",
        "places": {
            "name": "Mezquita Azul, Estambul",
            "desc": "Sultanahmet, 6 minaretes y 20.000 azulejos İznik. Entrada gratis fuera de horarios de oración. Cubre hombros y rodillas. Frente a Santa Sofía.",
            "label": "LUGAR  Nº 1  ·  GRATIS",
            "coord": "41°00′ N · 28°58′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Sultan_Ahmed_Mosque_at_dusk%2C_Istanbul.jpg/1280px-Sultan_Ahmed_Mosque_at_dusk%2C_Istanbul.jpg",
        },
        "food": {
            "name": "Baklava + çay",
            "desc": "Hojaldre con pistacho y miel — 8-12€ por kilo en Karaköy Güllüoğlu. Té turco gratis en bazares. Kebap callejero 4-6€. No pidas precio sin regatear.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "41°01′ N · 28°59′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Turkish_baklava.jpg/1280px-Turkish_baklava.jpg",
        },
        "tips": {
            "name": "Gran Bazar",
            "desc": "4000 tiendas bajo cúpulas otomanas desde 1461. Regatea 30-50% del precio inicial. Mejores compras: cerámica, alfombras, especias. Cerrado domingos.",
            "label": "TIP  ·  AHORRO",
            "coord": "41°01′ N · 28°58′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Grand_Bazaar_Shop.jpg/1280px-Grand_Bazaar_Shop.jpg",
        },
        "cta": {
            "name": "Crucero Bósforo",
            "desc": "Ferry público (10₺ ≈ 0.30€) Eminönü → Anadolu Kavağı, 1h30 ida. Cruzas Europa-Asia con vista a palacios y fortalezas. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "41°01′ N · 29°00′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bosphorus_Strait_Istanbul.jpg/1280px-Bosphorus_Strait_Istanbul.jpg",
        },
    },
    "atenas": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Acropolis_of_Athens_01361.JPG/1280px-Acropolis_of_Athens_01361.JPG",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Plaka_Athens_2009.jpg/1280px-Plaka_Athens_2009.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Greek_souvlaki.jpg/1280px-Greek_souvlaki.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Cape_Sounion_Temple_of_Poseidon.jpg/1280px-Cape_Sounion_Temple_of_Poseidon.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Anafiotika%2C_Athens.jpg/1280px-Anafiotika%2C_Athens.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado bajo el Partenón",
        "places": {
            "name": "Acrópolis, Atenas",
            "desc": "Partenón + Erecteión + Templo de Atenea Niké en la roca sagrada. Entrada combinada (5 sitios) 30€, válida 5 días. Abre 08:00 — sube temprano antes del calor.",
            "label": "LUGAR  Nº 1  ·  UNESCO",
            "coord": "37°58′ N · 23°43′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Acropolis_of_Athens_01361.JPG/1280px-Acropolis_of_Athens_01361.JPG",
        },
        "food": {
            "name": "Souvlaki + tzatziki",
            "desc": "Pincho de cerdo o pollo con pita y salsa de yogur — 3-5€ en taberna de barrio. Evita Plaka (turística): mejores en Psyrri y Exarchia. Ouzo a 2.50€.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "37°58′ N · 23°44′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Greek_souvlaki.jpg/1280px-Greek_souvlaki.jpg",
        },
        "tips": {
            "name": "Cabo Sounion + Poseidón",
            "desc": "Templo del s.V a.C. al borde del mar Egeo, 70 km de Atenas. Bus KTEL desde Mavromateon 7€ ida (1h45). Atardecer entre columnas — postal griega de manual.",
            "label": "TIP  ·  AHORRO",
            "coord": "37°39′ N · 24°01′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Cape_Sounion_Temple_of_Poseidon.jpg/1280px-Cape_Sounion_Temple_of_Poseidon.jpg",
        },
        "cta": {
            "name": "Anafiótika, barrio cíclades",
            "desc": "Calles encaladas escondidas en la falda de la Acrópolis — parece una isla en pleno centro. Caminable, gratis, fotogénico. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "37°58′ N · 23°43′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Anafiotika%2C_Athens.jpg/1280px-Anafiotika%2C_Athens.jpg",
        },
    },
    "berlin": {
        # Para Berlín mezclamos Unsplash (verificadas) + Wikimedia
        # porque varias URLs Wikimedia de los landmarks específicos dan 404.
        "hero_strips": [
            "https://images.unsplash.com/photo-1567593810070-7a3d471af022?auto=format&fit=crop&w=1280&q=80",  # Brandenburg
            "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1280&q=80",    # Berlin landmarks
            "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1280&q=80", # East Side Gallery alt
            "https://images.unsplash.com/photo-1554072675-66db59dba46f?auto=format&fit=crop&w=1280&q=80",    # Berlin streets
            "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=1280&q=80", # Kreuzberg
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado en el corazón europeo",
        "places": {
            "name": "Puerta de Brandeburgo",
            "desc": "Símbolo de la unificación alemana. Caminable desde Reichstag y Holocaust Memorial. Gratis 24/7. Pariser Platz al amanecer = sin gente para fotos.",
            "label": "LUGAR  Nº 1  ·  GRATIS",
            "coord": "52°31′ N · 13°22′ E",
            "photo": "https://images.unsplash.com/photo-1567593810070-7a3d471af022?auto=format&fit=crop&w=1280&q=80",
        },
        "food": {
            "name": "Currywurst + Pilsner",
            "desc": "Salchicha con salsa curry-ketchup, 3-4€ en quioscos. Konnopke's en Prenzlauer Berg es el clásico desde 1930. Cerveza Berliner Pilsner 1.50€ supermercado.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "52°32′ N · 13°25′ E",
            "photo": "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=1280&q=80",
        },
        "tips": {
            "name": "East Side Gallery",
            "desc": "1.3 km del Muro original convertido en galería al aire libre con 100+ murales. Gratis, abierto 24/7. Friedrichshain — combina con cena en Kreuzberg.",
            "label": "TIP  ·  AHORRO",
            "coord": "52°30′ N · 13°27′ E",
            "photo": "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1280&q=80",
        },
        "cta": {
            "name": "Kreuzberg, contracultura",
            "desc": "Barrio multicultural con döner kebab originales (3-5€), bares de techno y mercados turcos los martes. Próximo chollo saliendo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "52°30′ N · 13°25′ E",
            "photo": "https://images.unsplash.com/photo-1554072675-66db59dba46f?auto=format&fit=crop&w=1280&q=80",
        },
    },
    "praga": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Karluv_most_Vltava_Prague_Hradcany.jpg/1280px-Karluv_most_Vltava_Prague_Hradcany.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Prague_Castle_Wikimedia_Commons.jpg/1280px-Prague_Castle_Wikimedia_Commons.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Old_Town_Square_Prague.jpg/1280px-Old_Town_Square_Prague.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Trdelnik_Prague.jpg/1280px-Trdelnik_Prague.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Prague_at_dawn_from_Letna.jpg/1280px-Prague_at_dawn_from_Letna.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado en la ciudad de las cien torres",
        "places": {
            "name": "Puente de Carlos",
            "desc": "Puente gótico del s.XIV con 30 estatuas barrocas. Gratis 24/7. Cruzar al amanecer (06:00) = sin turistas, luz dorada sobre el Moldava.",
            "label": "LUGAR  Nº 1  ·  GRATIS",
            "coord": "50°05′ N · 14°25′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Karluv_most_Vltava_Prague_Hradcany.jpg/1280px-Karluv_most_Vltava_Prague_Hradcany.jpg",
        },
        "food": {
            "name": "Trdelník + cerveza Pilsner",
            "desc": "Postre dulce de masa enrollada con canela 70-100 CZK (3-4€). Pilsner Urquell 50 CZK (2€) en U Fleků o Lokál. Goulash + knedlíky 12-15€ menú completo.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "50°05′ N · 14°25′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Trdelnik_Prague.jpg/1280px-Trdelnik_Prague.jpg",
        },
        "tips": {
            "name": "Castillo + Catedral S.Vito",
            "desc": "Complejo desde el s.IX. Entrada combinada B (5 sitios) 250 CZK (10€). Cambio de guardia 12:00. Vistas a la ciudad desde los jardines (gratis).",
            "label": "TIP  ·  AHORRO",
            "coord": "50°05′ N · 14°23′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Prague_Castle_Wikimedia_Commons.jpg/1280px-Prague_Castle_Wikimedia_Commons.jpg",
        },
        "cta": {
            "name": "Letná, mirador secreto",
            "desc": "Parque al norte del Moldava con la mejor vista panorámica de Praga. Gratis, sin turistas. Cerveza al aire libre en biergarten 35 CZK (1.50€). Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "50°05′ N · 14°25′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Prague_at_dawn_from_Letna.jpg/1280px-Prague_at_dawn_from_Letna.jpg",
        },
    },
    "amsterdam": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Amsterdam_canal_houses.jpg/1280px-Amsterdam_canal_houses.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Anne_Frank_House_Amsterdam.jpg/1280px-Anne_Frank_House_Amsterdam.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Stroopwafels_in_Amsterdam.jpg/1280px-Stroopwafels_in_Amsterdam.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Bloemenmarkt_Amsterdam.jpg/1280px-Bloemenmarkt_Amsterdam.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Vondelpark_Amsterdam.jpg/1280px-Vondelpark_Amsterdam.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre canales y bicis",
        "places": {
            "name": "Casas-canal del Jordaan",
            "desc": "Barrio del s.XVII con 165 canales y 1500 puentes. Gratis pasear, 18€ tour en barco. Mejor luz al atardecer reflejándose en el agua.",
            "label": "LUGAR  Nº 1  ·  UNESCO",
            "coord": "52°22′ N · 04°53′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Amsterdam_canal_houses.jpg/1280px-Amsterdam_canal_houses.jpg",
        },
        "food": {
            "name": "Stroopwafel + bitterballen",
            "desc": "Galleta de caramelo recién hecha 2.50€ en Albert Cuyp Markt. Bitterballen (croquetas calientes) con cerveza Heineken 6-8€ en café marrón típico.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "52°22′ N · 04°54′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Stroopwafels_in_Amsterdam.jpg/1280px-Stroopwafels_in_Amsterdam.jpg",
        },
        "tips": {
            "name": "Casa de Ana Frank",
            "desc": "Reserva con MESES de antelación — entradas online se agotan el mismo día (16€). Sin reserva no se entra. Lunes-domingo 09:00-22:00.",
            "label": "TIP  ·  AHORRO",
            "coord": "52°22′ N · 04°53′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Anne_Frank_House_Amsterdam.jpg/1280px-Anne_Frank_House_Amsterdam.jpg",
        },
        "cta": {
            "name": "Vondelpark + bici",
            "desc": "47 hectáreas de parque urbano con cafés y conciertos gratis en verano. Bici 12€/día — la mejor forma de moverse por la ciudad. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "52°21′ N · 04°52′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Vondelpark_Amsterdam.jpg/1280px-Vondelpark_Amsterdam.jpg",
        },
    },
    "milan": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Milan_Cathedral_from_Piazza_del_Duomo.jpg/1280px-Milan_Cathedral_from_Piazza_del_Duomo.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Galleria_Vittorio_Emanuele_II_Milan.jpg/1280px-Galleria_Vittorio_Emanuele_II_Milan.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Risotto_alla_Milanese.jpg/1280px-Risotto_alla_Milanese.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Castello_Sforzesco_Milano.jpg/1280px-Castello_Sforzesco_Milano.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Naviglio_Grande_Milano.jpg/1280px-Naviglio_Grande_Milano.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado en la capital del estilo",
        "places": {
            "name": "Duomo de Milán",
            "desc": "Catedral gótica de 600 años. Entrada 10€, terraza 15€ (subes a la cubierta entre los gárgolas). Reserva online — fila física insufrible al mediodía.",
            "label": "LUGAR  Nº 1  ·  GÓTICO",
            "coord": "45°27′ N · 09°11′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Milan_Cathedral_from_Piazza_del_Duomo.jpg/1280px-Milan_Cathedral_from_Piazza_del_Duomo.jpg",
        },
        "food": {
            "name": "Risotto alla Milanese",
            "desc": "Arroz con azafrán y médula — auténtico desde 1574. 14-18€ trattoria. Aperitivo Aperol Spritz 8€ con buffet incluido entre 18-21h en Navigli.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "45°27′ N · 09°10′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Risotto_alla_Milanese.jpg/1280px-Risotto_alla_Milanese.jpg",
        },
        "tips": {
            "name": "Galleria Vittorio Emanuele II",
            "desc": "Centro comercial techado de 1877 — Prada original aquí. Gratis pasear bajo la cúpula de hierro. Pisar el toro en mosaico = trae suerte (cola para foto).",
            "label": "TIP  ·  AHORRO",
            "coord": "45°27′ N · 09°11′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Galleria_Vittorio_Emanuele_II_Milan.jpg/1280px-Galleria_Vittorio_Emanuele_II_Milan.jpg",
        },
        "cta": {
            "name": "Navigli, canales aperitivo",
            "desc": "Canales diseñados por Da Vinci con bares de aperitivo cada metro. Mercado antigüedades último domingo del mes. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "45°27′ N · 09°10′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Naviglio_Grande_Milano.jpg/1280px-Naviglio_Grande_Milano.jpg",
        },
    },
    "londres": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Big_Ben_London_2014.jpg/1280px-Big_Ben_London_2014.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Tower_Bridge_from_Shad_Thames.jpg/1280px-Tower_Bridge_from_Shad_Thames.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Fish_and_chips_London.jpg/1280px-Fish_and_chips_London.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/British_Museum_Great_Court.jpg/1280px-British_Museum_Great_Court.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Camden_Town_market.jpg/1280px-Camden_Town_market.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre niebla y dobles",
        "places": {
            "name": "Big Ben + Westminster",
            "desc": "Reloj icónico + Parlamento + Abadía. Entrada Abadía 27£ (33€). Big Ben gratis verlo desde puente Westminster — atardecer con luces encendidas.",
            "label": "LUGAR  Nº 1  ·  ICÓNICO",
            "coord": "51°30′ N · 00°07′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Big_Ben_London_2014.jpg/1280px-Big_Ben_London_2014.jpg",
        },
        "food": {
            "name": "Fish & chips + pint",
            "desc": "Bacalao rebozado + patatas + guisantes 12-15£ (14-18€) en pub clásico. Pint de London Pride 6£. Pubs de Borough Market sirven mejor que cadenas.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "51°30′ N · 00°05′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Fish_and_chips_London.jpg/1280px-Fish_and_chips_London.jpg",
        },
        "tips": {
            "name": "British Museum (gratis)",
            "desc": "8 millones de objetos: Piedra Rosetta, momias, mármoles del Partenón. Entrada gratis SIEMPRE (donativo opcional 5£). Mejor martes-jueves antes 11:00.",
            "label": "TIP  ·  GRATIS",
            "coord": "51°31′ N · 00°07′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/British_Museum_Great_Court.jpg/1280px-British_Museum_Great_Court.jpg",
        },
        "cta": {
            "name": "Camden Market",
            "desc": "Mercado alternativo con 1000 puestos: vintage, vinilos, street food (8-12£). Sábados rebosa — mejor entre semana. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "51°32′ N · 00°08′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Camden_Town_market.jpg/1280px-Camden_Town_market.jpg",
        },
    },
    "marrakech": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Jardin_Majorelle%2C_Marrakech.jpg/1280px-Jardin_Majorelle%2C_Marrakech.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jemaa_el-Fna_at_dusk%2C_Marrakech.jpg/1280px-Jemaa_el-Fna_at_dusk%2C_Marrakech.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Tagine_Moroccan_dish.jpg/1280px-Tagine_Moroccan_dish.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Bahia_Palace_Marrakesh.jpg/1280px-Bahia_Palace_Marrakesh.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Atlas_Mountains_Morocco.jpg/1280px-Atlas_Mountains_Morocco.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre zellige y especias",
        "places": {
            "name": "Plaza Jemaa el-Fna",
            "desc": "Patrimonio UNESCO desde el s.XII. Encantadores de serpientes, cuentacuentos, zumos a 5 dirhams (0.50€). Gratis. Al anochecer se transforma en restaurante.",
            "label": "LUGAR  Nº 1  ·  UNESCO",
            "coord": "31°37′ N · 07°59′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jemaa_el-Fna_at_dusk%2C_Marrakech.jpg/1280px-Jemaa_el-Fna_at_dusk%2C_Marrakech.jpg",
        },
        "food": {
            "name": "Tajine + té de menta",
            "desc": "Cordero con ciruelas o pollo con limón confitado, 60-100 dh (6-10€) en riad. Té de menta 15 dh (1.50€). Evita platos turísticos: come donde están los locales.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "31°37′ N · 08°00′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Tagine_Moroccan_dish.jpg/1280px-Tagine_Moroccan_dish.jpg",
        },
        "tips": {
            "name": "Jardín Majorelle",
            "desc": "Jardín de Yves Saint Laurent con villa azul cobalto. 70 dh (7€) jardín, 130 dh (13€) combo Museo Bereber. Reserva online: cola en taquilla 1h+.",
            "label": "TIP  ·  AHORRO",
            "coord": "31°38′ N · 08°00′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Jardin_Majorelle%2C_Marrakech.jpg/1280px-Jardin_Majorelle%2C_Marrakech.jpg",
        },
        "cta": {
            "name": "Atlas + Ourika Valley",
            "desc": "Excursión 1 día desde 25-40€: cascadas, pueblos bereberes, té con familias locales. Salida 08:30. Próximo chollo saliendo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "31°20′ N · 07°45′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Atlas_Mountains_Morocco.jpg/1280px-Atlas_Mountains_Morocco.jpg",
        },
    },
    "madrid": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Plaza_Mayor_de_Madrid_06.jpg/1280px-Plaza_Mayor_de_Madrid_06.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Palacio_Real_de_Madrid_-_03.jpg/1280px-Palacio_Real_de_Madrid_-_03.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Cocido_madrile%C3%B1o.jpg/1280px-Cocido_madrile%C3%B1o.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Parque_del_Retiro_Madrid_2010.jpg/1280px-Parque_del_Retiro_Madrid_2010.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mercado_de_San_Miguel_Madrid.jpg/1280px-Mercado_de_San_Miguel_Madrid.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado en el centro castizo",
        "places": {
            "name": "Plaza Mayor + Palacio Real",
            "desc": "Plaza barroca de 1620 + palacio borbónico. Plaza gratis 24/7. Palacio entrada 14€ (gratis ciudadanos UE lunes-jueves 17-19h en invierno).",
            "label": "LUGAR  Nº 1  ·  HISTÓRICO",
            "coord": "40°25′ N · 03°42′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Palacio_Real_de_Madrid_-_03.jpg/1280px-Palacio_Real_de_Madrid_-_03.jpg",
        },
        "food": {
            "name": "Cocido madrileño",
            "desc": "Garbanzos + 3 vuelcos (sopa, verduras, carnes) — el plato del invierno madrileño. Menú 18-25€ en taberna La Bola desde 1870. Caña Mahou 1.80€.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "40°25′ N · 03°42′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Cocido_madrile%C3%B1o.jpg/1280px-Cocido_madrile%C3%B1o.jpg",
        },
        "tips": {
            "name": "Mercado San Miguel",
            "desc": "Mercado gourmet del s.XX en estructura de hierro. Tapas 3-6€, vermut 2.50€. Próximo a Plaza Mayor. Evita 14-16h (lleno) — ve 12:00 o 17:00.",
            "label": "TIP  ·  AHORRO",
            "coord": "40°25′ N · 03°42′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mercado_de_San_Miguel_Madrid.jpg/1280px-Mercado_de_San_Miguel_Madrid.jpg",
        },
        "cta": {
            "name": "Parque del Retiro",
            "desc": "125 hectáreas, lago para barcas de remo (6€/45min), Palacio Cristal y monumento Alfonso XII. Domingos teatro y música gratis. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "40°25′ N · 03°41′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Parque_del_Retiro_Madrid_2010.jpg/1280px-Parque_del_Retiro_Madrid_2010.jpg",
        },
    },
    "viena": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Schloss_Sch%C3%B6nbrunn_2018-08-04_b.jpg/1280px-Schloss_Sch%C3%B6nbrunn_2018-08-04_b.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Stephansdom_Vienna_June_2006_482.JPG/1280px-Stephansdom_Vienna_June_2006_482.JPG",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Sachertorte.jpg/1280px-Sachertorte.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Belvedere_Palace_Vienna.jpg/1280px-Belvedere_Palace_Vienna.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Naschmarkt_Vienna_2010.jpg/1280px-Naschmarkt_Vienna_2010.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre valses imperiales",
        "places": {
            "name": "Palacio Schönbrunn",
            "desc": "Residencia veraniega imperial Habsburgo, 1441 habitaciones. Imperial Tour 22€, Grand Tour 26€. Jardines gratis. Reserva slot online — cola física 1h+.",
            "label": "LUGAR  Nº 1  ·  UNESCO",
            "coord": "48°11′ N · 16°18′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Schloss_Sch%C3%B6nbrunn_2018-08-04_b.jpg/1280px-Schloss_Sch%C3%B6nbrunn_2018-08-04_b.jpg",
        },
        "food": {
            "name": "Sachertorte + melange",
            "desc": "Tarta de chocolate icónica desde 1832, original solo en Hotel Sacher (8€ porción). Café Melange (espresso + leche espumada) 4-5€ en café tradicional.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "48°12′ N · 16°22′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Sachertorte.jpg/1280px-Sachertorte.jpg",
        },
        "tips": {
            "name": "Belvedere + Klimt",
            "desc": "Palacio barroco con la mayor colección Klimt (incluye El Beso). Entrada 16€. Vienna Pass 72h 99€ incluye 70+ atracciones — rentable si haces 4+/día.",
            "label": "TIP  ·  AHORRO",
            "coord": "48°11′ N · 16°22′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Belvedere_Palace_Vienna.jpg/1280px-Belvedere_Palace_Vienna.jpg",
        },
        "cta": {
            "name": "Naschmarkt + Stephansdom",
            "desc": "Mercado de 1.5 km con 120 puestos de comida (5-12€ menús internacionales). Catedral San Esteban con cripta 6€. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "48°12′ N · 16°22′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Naschmarkt_Vienna_2010.jpg/1280px-Naschmarkt_Vienna_2010.jpg",
        },
    },
    "budapest": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Hungarian_Parliament_Building_at_dusk.jpg/1280px-Hungarian_Parliament_Building_at_dusk.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Sz%C3%A9chenyi_Thermal_Bath.jpg/1280px-Sz%C3%A9chenyi_Thermal_Bath.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Goulash.jpg/1280px-Goulash.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Buda_Castle_at_night.jpg/1280px-Buda_Castle_at_night.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Ruin_bar_Szimpla_Kert.jpg/1280px-Ruin_bar_Szimpla_Kert.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado a orillas del Danubio",
        "places": {
            "name": "Parlamento, Budapest",
            "desc": "Edificio neogótico de 1904 a la orilla del Danubio. Tour interior 35€ (idiomas). Vista mejor: cruzar al lado Buda y mirar a Pest, sobre todo de noche iluminado.",
            "label": "LUGAR  Nº 1  ·  ICÓNICO",
            "coord": "47°30′ N · 19°02′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Hungarian_Parliament_Building_at_dusk.jpg/1280px-Hungarian_Parliament_Building_at_dusk.jpg",
        },
        "food": {
            "name": "Goulash + tokaj",
            "desc": "Estofado húngaro con páprika 1500-2500 HUF (4-7€). Vino dulce Tokaji 6 puttonyos copa 1500 HUF (4€). Cervecería Belváros mejor que zonas turísticas.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "47°30′ N · 19°03′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Goulash.jpg/1280px-Goulash.jpg",
        },
        "tips": {
            "name": "Termas Széchenyi",
            "desc": "21 piscinas termales en palacio neobarroco amarillo. Entrada día 9000 HUF (24€). Mejor 09:00 antes de la masa o noche con luna. Lleva chanclas.",
            "label": "TIP  ·  AHORRO",
            "coord": "47°31′ N · 19°05′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Sz%C3%A9chenyi_Thermal_Bath.jpg/1280px-Sz%C3%A9chenyi_Thermal_Bath.jpg",
        },
        "cta": {
            "name": "Ruin bars + barrio judío",
            "desc": "Bares en edificios abandonados con decoración ecléctica. Szimpla Kert es el original (1500 HUF cerveza, 4€). Distrito VII, abierto hasta 04:00. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "47°30′ N · 19°04′ E",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Ruin_bar_Szimpla_Kert.jpg/1280px-Ruin_bar_Szimpla_Kert.jpg",
        },
    },
    "dublin": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Trinity_College_Library_Dublin.jpg/1280px-Trinity_College_Library_Dublin.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Temple_Bar_Pub_Dublin.jpg/1280px-Temple_Bar_Pub_Dublin.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Guinness_Storehouse_Dublin.jpg/1280px-Guinness_Storehouse_Dublin.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Cliffs_of_Moher_Ireland.jpg/1280px-Cliffs_of_Moher_Ireland.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/St_Stephen%27s_Green_Dublin.jpg/1280px-St_Stephen%27s_Green_Dublin.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre pubs y poesía",
        "places": {
            "name": "Trinity College + Book of Kells",
            "desc": "Universidad de 1592, Long Room con 200.000 libros + manuscrito Book of Kells (s.IX). Entrada 18-25€. Reserva online slot mañana, mejor luz para fotos.",
            "label": "LUGAR  Nº 1  ·  HISTÓRICO",
            "coord": "53°20′ N · 06°15′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Trinity_College_Library_Dublin.jpg/1280px-Trinity_College_Library_Dublin.jpg",
        },
        "food": {
            "name": "Pint Guinness + irish stew",
            "desc": "Cerveza negra 6-7€ en pub tradicional + estofado de cordero 14-18€. Brazen Head (1198) es el pub más antiguo. Música tradicional gratis 21:00.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "53°20′ N · 06°16′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Temple_Bar_Pub_Dublin.jpg/1280px-Temple_Bar_Pub_Dublin.jpg",
        },
        "tips": {
            "name": "Guinness Storehouse",
            "desc": "Tour 7 plantas + pinta gratis en Gravity Bar con vistas 360°. Entrada 26-30€ (más barato online). 2.5h totales. Mejor entre semana 11:00.",
            "label": "TIP  ·  AHORRO",
            "coord": "53°20′ N · 06°17′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Guinness_Storehouse_Dublin.jpg/1280px-Guinness_Storehouse_Dublin.jpg",
        },
        "cta": {
            "name": "Cliffs of Moher",
            "desc": "Acantilados 214 m sobre el Atlántico. Tour día desde Dublín 50-65€ incluyendo Galway. Salida 07:00, vuelta 19:00. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "52°58′ N · 09°25′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Cliffs_of_Moher_Ireland.jpg/1280px-Cliffs_of_Moher_Ireland.jpg",
        },
    },
    "sevilla": {
        "hero_strips": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Plaza_de_Espa%C3%B1a%2C_Sevilla.jpg/1280px-Plaza_de_Espa%C3%B1a%2C_Sevilla.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Catedral_y_Giralda_de_Sevilla.jpg/1280px-Catedral_y_Giralda_de_Sevilla.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Real_Alcazar_Sevilla.jpg/1280px-Real_Alcazar_Sevilla.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Salmorejo_andaluz.jpg/1280px-Salmorejo_andaluz.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Triana_Sevilla.jpg/1280px-Triana_Sevilla.jpg",
        ],
        "hero_subtitle": "Cinco lugares imprescindibles  ·  y un precio cazado entre azahar y compás",
        "places": {
            "name": "Plaza de España",
            "desc": "Plaza semicircular de 1929, 50.000 m² con bancos de cerámica por provincia. Gratis 24/7. Mejor luz al atardecer. Aparece en Star Wars Episodio II.",
            "label": "LUGAR  Nº 1  ·  GRATIS",
            "coord": "37°22′ N · 05°59′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Plaza_de_Espa%C3%B1a%2C_Sevilla.jpg/1280px-Plaza_de_Espa%C3%B1a%2C_Sevilla.jpg",
        },
        "food": {
            "name": "Salmorejo + flamenquín",
            "desc": "Crema fría de tomate con jamón y huevo 5-7€. Tapas en Triana 2.50-4€. Las Teresas en Santa Cruz desde 1870 — caña 1.80€, montaditos a 2€.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "37°23′ N · 05°59′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Salmorejo_andaluz.jpg/1280px-Salmorejo_andaluz.jpg",
        },
        "tips": {
            "name": "Real Alcázar + Catedral",
            "desc": "Alcázar (Juego de Tronos) 13.50€, Catedral + Giralda 12€. Combo nocturno Alcázar 25€. Reserva online: cola física 1h+ Semana Santa y Feria.",
            "label": "TIP  ·  AHORRO",
            "coord": "37°23′ N · 05°59′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Real_Alcazar_Sevilla.jpg/1280px-Real_Alcazar_Sevilla.jpg",
        },
        "cta": {
            "name": "Triana, flamenco auténtico",
            "desc": "Barrio cuna del flamenco, tablaos 18-25€ con bebida (Casa Anselma gratis pero llega a las 23:00). Cerámica artesanal. Próximo chollo en tripcazador.com.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "37°23′ N · 06°00′ W",
            "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Triana_Sevilla.jpg/1280px-Triana_Sevilla.jpg",
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


# Fotos genéricas Wikimedia/Unsplash temáticas (no específicas de ciudad).
# Se usan cuando un destino no está en LANDMARKS para que cada slide siga
# teniendo una foto VISUALMENTE DISTINTA aunque no esté hiper-curada.
# Cada fila representa un tema diferente:
#   places  → arquitectura/skyline genérico
#   food    → bodegón comida internacional
#   tips    → mercado / transporte público
#   cta     → atardecer / mirador
# El hero strips muestra 5 fotos diferentes mezclando los temas anteriores
# para no ver una sola imagen 5x en plate I.
_GENERIC_PLACES = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/European_old_town.jpg/1280px-European_old_town.jpg"
_GENERIC_FOOD = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Mediterranean_food_platter.jpg/1280px-Mediterranean_food_platter.jpg"
_GENERIC_MARKET = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Local_market_food_stall.jpg/1280px-Local_market_food_stall.jpg"
_GENERIC_SUNSET = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Mediterranean_sunset_coast.jpg/1280px-Mediterranean_sunset_coast.jpg"
_GENERIC_STREET = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Cobblestone_street_evening.jpg/1280px-Cobblestone_street_evening.jpg"

# Pool Unsplash IDs de respaldo para diferentes temas — robustos al 100%
# (ya verificados en producción dest_images.ts). Si una URL Wikimedia falla,
# el generador usará estos como segundo fallback.
_UNSPLASH_GENERIC = {
    "places": "1502602898657-3e91760cbb34",  # París architecture
    "food":   "1565958011703-44f9829ba187",  # mediterranean food platter
    "tips":   "1555881400-74d7acaacd8b",     # market scene Lisboa
    "sunset": "1473496169904-658ba7c44d8a",  # mediterranean coast sunset
    "street": "1592906209472-a36b1f3782ef",  # cobblestone Praga
}


def _unsplash(photo_id: str, w: int = 1280) -> str:
    """Construye URL Unsplash con tamaño explícito."""
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={w}&q=80"


def fallback_landmarks(dest_key: str, dest_photo_url: str) -> DestinationLandmarks:
    """
    Para destinos sin entry curada en LANDMARKS, usamos:
      - dest_photo_url para el hero strip principal (la foto Unsplash que
        SÍ es específica de la ciudad)
      - 4 fotos genéricas temáticas (arquitectura/comida/mercado/atardecer)
        para los otros slides → cada slide se ve VISUALMENTE DISTINTO.

    Esto evita el bug SSS87 donde todas las 5 slides salían con la misma
    foto cuando el destino no estaba en el catálogo curado.
    """
    city = dest_key.replace("_", " ").title()

    # Fotos diferenciadas por slide. dest_photo_url va al hero principal
    # (sigue siendo específico de la ciudad), las otras 4 son genéricas.
    photo_places = dest_photo_url  # arquitectura ciudad
    photo_food = _unsplash(_UNSPLASH_GENERIC["food"])  # bodegón comida
    photo_tips = _unsplash(_UNSPLASH_GENERIC["tips"])  # mercado/transporte
    photo_cta = _unsplash(_UNSPLASH_GENERIC["sunset"])  # atardecer
    photo_street = _unsplash(_UNSPLASH_GENERIC["street"])  # callejear

    return {
        "hero_strips": [
            photo_places,  # ciudad
            photo_food,    # comida
            photo_tips,    # mercado
            photo_street,  # calle
            photo_cta,     # atardecer
        ],
        "hero_subtitle": "Cinco motivos para coger el vuelo  ·  y el precio que lo hace urgente",
        "places": {
            "name": f"Centro de {city}",
            "desc": "El casco histórico concentra museos, miradores y arquitectura icónica. Caminable, gratis explorar — el primer día sirve para orientarte.",
            "label": "LUGAR  Nº 1  ·  CENTRO",
            "coord": "—",
            "photo": photo_places,
        },
        "food": {
            "name": f"Sabores de {city}",
            "desc": "Cocina local en mercados y tabernas — busca el menú del día (10-15€) frente a las ofertas turísticas. Los locales saben dónde comer.",
            "label": "GASTRO  ·  TÍPICO",
            "coord": "—",
            "photo": photo_food,
        },
        "tips": {
            "name": "Tarjeta turística",
            "desc": "La mayoría de capitales tienen una city pass 24-72h: combina transporte ilimitado + entradas museos. Suele ahorrar 30-50% si planeas 3+ visitas/día.",
            "label": "TIP  ·  AHORRO",
            "coord": "—",
            "photo": photo_tips,
        },
        "cta": {
            "name": f"{city}, te espera",
            "desc": "El próximo chollo ya está saliendo en tripcazador.com — síguenos para no perdértelo. Cazadores de chollos en activo 24/7.",
            "label": "CIERRE  ·  TU TURNO",
            "coord": "—",
            "photo": photo_cta,
        },
    }
