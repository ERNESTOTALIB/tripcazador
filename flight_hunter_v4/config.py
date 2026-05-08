"""
Flight Hunter V4 — Configuración Central
==========================================
Mejoras sobre V2:
- 65+ aeropuertos europeos (todos los hubs + secundarios relevantes)
- Umbrales de precio mejorados con más granularidad por ruta
- Umbrales de ratio Business/Economy para detectar errores
- Configuración de Telegram para alertas en tiempo real
- Más destinos preconfigurados
- Scoring multi-factor configurable
"""

import os
from typing import Dict, List, Optional, Tuple

# Cargar variables desde .env si está disponible (silencioso si no).
# Busca .env en la carpeta padre (/Viajes) y en la raíz del módulo.
try:
    from dotenv import load_dotenv
    _here = os.path.dirname(os.path.abspath(__file__))
    for candidate in [
        os.path.join(_here, "..", ".env"),
        os.path.join(_here, ".env"),
    ]:
        if os.path.exists(candidate):
            load_dotenv(candidate, override=False)
            break
except ImportError:
    # python-dotenv no instalado → usar sólo variables de entorno del sistema
    pass

# ==============================================================================
# API KEYS — Se cargan desde .env (ver .env.example). NO hardcodear aquí.
# ==============================================================================

# Kiwi Tequila (PRIMARIA — GRATUITA, ILIMITADA, 750+ aerolíneas)
# Registrar en: https://tequila.kiwi.com/portal/login
KIWI_API_KEY = os.environ.get("KIWI_API_KEY", "")

# SerpApi / Google Flights (VALIDACIÓN — 100 búsquedas/mes gratis)
# Registrar en: https://serpapi.com
SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")

# Duffel (VALIDACIÓN REAL-TIME — 300+ aerolíneas, gratuito para búsquedas)
# Registrar en: https://duffel.com
DUFFEL_TOKEN = os.environ.get("DUFFEL_TOKEN", "")

# RapidAPI — Air Scraper / Sky Scrapper (multi-aerolínea, 20 req/mes gratis)
# Suscrito en: https://rapidapi.com/apiheya/api/sky-scrapper
RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY", "")

# Travelpayouts / Aviasales (PRECIOS CACHEADOS — gratuito)
# Registrar en: https://travelpayouts.com
TRAVELPAYOUTS_TOKEN = os.environ.get("TRAVELPAYOUTS_TOKEN", "")

# Travelpayouts — Marker de afiliado (MONETIZACIÓN DÍA 1)
# ─────────────────────────────────────────────────────────────────────────────
# Obtener en: https://travelpayouts.com → Programas de afiliados → Tu marker
# Es un número (ej: "123456"). Con él, cada reserva vía TripCazador genera 2-6%.
# Sin marker: los enlaces funcionan pero SIN comisión.
# Añadir a .env: TP_MARKER=tu_numero
# ─────────────────────────────────────────────────────────────────────────────
TRAVELPAYOUTS_MARKER = os.environ.get("TP_MARKER", "")  # ← PONER AQUÍ tu marker

# Amadeus Self-Service API
# ─────────────────────────────────────────────────────────────────────────────
# NOTA: Amadeus cerró el registro de nuevas cuentas Self-Service en 2025.
# El motor amadeus_engine.py está desactivado. Para cobertura GDS usar Duffel.
# Variables mantenidas para compatibilidad, no se usan en ningún modo activo.
# ─────────────────────────────────────────────────────────────────────────────
AMADEUS_API_KEY    = os.environ.get("AMADEUS_API_KEY",    "")
AMADEUS_API_SECRET = os.environ.get("AMADEUS_API_SECRET", "")

# Telegram Bot (ALERTAS EN TIEMPO REAL)
# Crear bot en: https://t.me/BotFather → /newbot
# Chat ID: enviar mensaje al bot y llamar https://api.telegram.org/bot<TOKEN>/getUpdates
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

# ==============================================================================
# ARQUITECTURA DEL MOTOR — Stack de APIs (por potencia y cobertura)
# ==============================================================================
#
# ┌─────────────────────────────────────────────────────────────────────────┐
# │  MODO ANYWHERE (--mode anywhere) — MOTOR GLOBAL                        │
# │  Kiwi/Tequila fly_to=anywhere → busca TODO EL MUNDO en una llamada    │
# │  No necesita listas de destinos. Encuentra cualquier IATA automático.  │
# └─────────────────────────────────────────────────────────────────────────┘
#
#  1. Kiwi/Tequila   GRATUITO | Ilimitado   | 750+ aerolíneas | fly_to=anywhere
#  2. RapidAPI       GRATUITO | ~500/mes    | Skyscanner proxy | lookup dinámico
#  3. Ryanair        GRATUITO | Ilimitado   | Solo Ryanair     | scraper directo
#  4. Vueling        GRATUITO | Ilimitado   | Solo Vueling     | scraper directo
#  5. SerpAPI        GRATUITO | 100/mes     | Google Flights   | Business class
#  6. Duffel         GRATUITO | búsquedas   | 300+ aerolíneas  | GDS/NDC real
#  ✗ Amadeus         CERRADO  | no disponible desde 2025        | desactivado
#
#  Para buscar cualquier aeropuerto: python main.py --mode anywhere
#  Para ruta específica:  python main.py --mode all --dests ZNZ,DAR,NBO
#  Las listas DEST_* de abajo son solo PRESETS para el modo targeted.
# ==============================================================================

# ==============================================================================
# AEROPUERTOS EUROPEOS — 65+ orígenes
# ==============================================================================

# Tier 1: Grandes hubs internacionales (máxima conectividad, mejores deals)
EUROPEAN_AIRPORTS_TIER1 = [
    "CDG",  # Paris Charles de Gaulle
    "FRA",  # Frankfurt
    "AMS",  # Amsterdam Schiphol
    "MAD",  # Madrid Barajas
    "BCN",  # Barcelona El Prat
    "LHR",  # Londres Heathrow
    "LGW",  # Londres Gatwick
    "STN",  # Londres Stansted
    "MXP",  # Milan Malpensa
    "FCO",  # Roma Fiumicino
    "IST",  # Istanbul (nuevo aeropuerto)
    "ZRH",  # Zurich
    "VIE",  # Viena
    "BRU",  # Bruselas
    "LIS",  # Lisboa
    "CPH",  # Copenhague
    "OSL",  # Oslo Gardermoen
    "ARN",  # Estocolmo Arlanda
    "HEL",  # Helsinki
    "DUB",  # Dublín
    "MUC",  # Munich
    "WAW",  # Varsovia Chopin
    "PRG",  # Praga
    "BUD",  # Budapest
    "ATH",  # Atenas
]

# Tier 2: Aeropuertos regionales importantes (a menudo tienen deals únicos)
EUROPEAN_AIRPORTS_TIER2 = [
    "PMI",  # Palma de Mallorca
    "AGP",  # Málaga
    "SVQ",  # Sevilla
    "BIO",  # Bilbao
    "VLC",  # Valencia
    "ALC",  # Alicante
    "IBZ",  # Ibiza
    "TFS",  # Tenerife Sur
    "LPA",  # Gran Canaria
    "OPO",  # Oporto
    "FAO",  # Faro
    "LYS",  # Lyon Saint-Exupéry
    "MRS",  # Marsella
    "NCE",  # Niza
    "TLS",  # Toulouse
    "BOD",  # Burdeos
    "BER",  # Berlin Brandenburg
    "HAM",  # Hamburgo
    "DUS",  # Dusseldorf
    "CGN",  # Colonia
    "STR",  # Stuttgart
    "HAJ",  # Hannover
    "NUE",  # Nuremberg
    "NAP",  # Nápoles
    "VCE",  # Venecia
    "BGY",  # Bérgamo (Milan bajo coste)
    "PSA",  # Pisa
    "BLQ",  # Bolonia
    "CTA",  # Catania
    "PMO",  # Palermo
    "GVA",  # Ginebra
    "BSL",  # Basilea-Mulhouse (sirve Basilea, Friburgo, Mulhouse)
    "SXB",  # Estrasburgo
    "FKB",  # Karlsruhe/Baden-Baden (Ryanair hub)
    "HHN",  # Frankfurt Hahn (Ryanair hub, ~120km de Frankfurt)
    "LUX",  # Luxemburgo
    "EDI",  # Edimburgo
    "MAN",  # Manchester
    "BHX",  # Birmingham
    "GLA",  # Glasgow
    "KRK",  # Cracovia
    "WRO",  # Wroclaw
    "KTW",  # Katowice
    "OTP",  # Bucarest Otopeni
    "SOF",  # Sofia
    "BEG",  # Belgrado
    "ZAG",  # Zagreb
    "LJU",  # Ljubljana
    "SKP",  # Skopje
    "TIA",  # Tirana
    "RIX",  # Riga
    "TLL",  # Tallinn
    "VNO",  # Vilnius
    "KBP",  # Kiev Boryspil
    "ODS",  # Odessa
    "SKG",  # Tesalónica
    "HER",  # Heraklion (Creta)
    "RHO",  # Rodas
    "CFU",  # Corfú
    "CHQ",  # Chania
    "DLM",  # Dalaman (Turquía)
    "AYT",  # Antalya
    "SAW",  # Istanbul Sabiha
    "ESB",  # Ankara
]

# Todos los aeropuertos europeos combinados (sin duplicados)
EUROPEAN_AIRPORTS_ALL = list(dict.fromkeys(EUROPEAN_AIRPORTS_TIER1 + EUROPEAN_AIRPORTS_TIER2))

# ═══════════════════════════════════════════════════════════════════
# SSS41 — Latam hubs (audiencia hispanohablante América)
# Conexiones España ↔ Latam y rutas regionales Latam
# ═══════════════════════════════════════════════════════════════════
LATAM_HUBS = [
    "MEX",  # Ciudad de México
    "CUN",  # Cancún
    "GDL",  # Guadalajara
    "MTY",  # Monterrey
    "EZE",  # Buenos Aires Ezeiza
    "AEP",  # Buenos Aires Aeroparque
    "GIG",  # Río de Janeiro
    "GRU",  # São Paulo
    "BSB",  # Brasilia
    "BOG",  # Bogotá
    "MDE",  # Medellín
    "CTG",  # Cartagena
    "SCL",  # Santiago de Chile
    "LIM",  # Lima
    "CUZ",  # Cusco
    "UIO",  # Quito
    "GYE",  # Guayaquil
    "PTY",  # Panamá
    "HAV",  # La Habana
    "PUJ",  # Punta Cana
    "SDQ",  # Santo Domingo
    "GUA",  # Guatemala
    "SAL",  # San Salvador
    "TGU",  # Tegucigalpa
    "MGA",  # Managua
    "SJO",  # San José Costa Rica
    "MVD",  # Montevideo
    "ASU",  # Asunción
    "VVI",  # Santa Cruz Bolivia
    "LPB",  # La Paz
]

# ═══════════════════════════════════════════════════════════════════
# SSS41 — Balcanes (destinos baratos en alza)
# ═══════════════════════════════════════════════════════════════════
DEST_BALCANES = [
    "TIA",  # Tirana
    "BEG",  # Belgrado
    "PRN",  # Pristina
    "SJJ",  # Sarajevo
    "TGD",  # Podgorica
    "TIV",  # Tivat (Montenegro)
    "SKP",  # Skopje
    "ZAG",  # Zagreb
    "DBV",  # Dubrovnik
    "SPU",  # Split
    "LJU",  # Ljubljana
    "BUD",  # Budapest
    "OTP",  # Bucarest
    "SOF",  # Sofia
    "CFU",  # Corfú
    "RHO",  # Rodas
    "HER",  # Heraklion
    "SKG",  # Tesalónica
]

# ═══════════════════════════════════════════════════════════════════
# SSS41 — Europa del Norte (Islandia, Noruega, Lofoten, Suecia)
# ═══════════════════════════════════════════════════════════════════
DEST_EUROPA_NORTE = [
    "KEF",  # Reikiavik
    "AEY",  # Akureyri (Islandia norte)
    "OSL",  # Oslo
    "BGO",  # Bergen
    "TRD",  # Trondheim
    "TOS",  # Tromsø (auroras boreales)
    "SVJ",  # Svolvær (Lofoten)
    "LYR",  # Longyearbyen (Svalbard)
    "ARN",  # Estocolmo
    "GOT",  # Gotemburgo
    "LLA",  # Luleå
    "HEL",  # Helsinki
    "RVN",  # Rovaniemi (Laponia, Papá Noel)
    "OUL",  # Oulu
    "TLL",  # Tallinn
    "RIX",  # Riga
    "VNO",  # Vilnius
    "CPH",  # Copenhague
    "BLL",  # Billund (LEGOLAND)
    "FAE",  # Faroe Islands
]

# ═══════════════════════════════════════════════════════════════════
# SSS46 — MEGA_ORIGINS: cualquier IATA puede ser origen
# Combina TIER1 + TIER2 + SPANISH_HUBS + LATAM_HUBS (170+ unique)
# Permite al hunter rotar entre 170 orígenes para detectar deals
# desde cualquier ciudad — no solo MAD/BCN.
# ═══════════════════════════════════════════════════════════════════
def _build_mega_origins():
    """Lazy-build para que las dependencias estén ya definidas."""
    return list(dict.fromkeys(
        EUROPEAN_AIRPORTS_TIER1
        + EUROPEAN_AIRPORTS_TIER2
        + SPANISH_HUBS_COMPLETE
        + LATAM_HUBS
    ))

# SSS38: España completa — para usuarios que viven fuera de Madrid/BCN.
# Subconjunto pensado para audiencia ES principal (target tripcazador.com).
SPANISH_HUBS_COMPLETE = [
    "MAD",  # Madrid Barajas
    "BCN",  # Barcelona El Prat
    "PMI",  # Palma de Mallorca
    "AGP",  # Málaga Costa del Sol
    "SVQ",  # Sevilla
    "BIO",  # Bilbao
    "VLC",  # Valencia
    "ALC",  # Alicante-Elche
    "IBZ",  # Ibiza
    "TFS",  # Tenerife Sur
    "TFN",  # Tenerife Norte
    "LPA",  # Gran Canaria
    "ACE",  # Lanzarote
    "FUE",  # Fuerteventura
    "MAH",  # Menorca
    "OVD",  # Asturias (Oviedo)
    "SCQ",  # Santiago de Compostela
    "VGO",  # Vigo
    "ZAZ",  # Zaragoza
    "GRO",  # Girona-Costa Brava (Ryanair hub)
    "REU",  # Reus (Tarragona)
    "MJV",  # Murcia (San Javier antiguo, ahora Corvera)
    "SDR",  # Santander
    "PNA",  # Pamplona
    "RJL",  # Logroño
    "EAS",  # San Sebastián
]

# Aeropuertos con mejores conexiones transatlánticas (para Business Hunter)
EUROPEAN_BEST_TRANSATLANTIC = [
    "CDG", "FRA", "AMS", "LHR", "MAD", "BCN", "MXP", "FCO",
    "LIS", "DUB", "ZRH", "VIE", "BRU", "MUC", "CPH", "ARN",
]

# Aeropuertos con mejores conexiones Asia/Medio Oriente
EUROPEAN_BEST_ASIA = [
    "CDG", "FRA", "AMS", "LHR", "MAD", "MXP", "ZRH", "VIE",
    "IST", "HEL", "MUC", "FCO", "BCN",
]

# ==============================================================================
# DESTINOS MUNDIALES — Presets por región
# ==============================================================================

DEST_CARIBBEAN = [
    "PUJ",  # Punta Cana — error fares frecuentes
    "SDQ",  # Santo Domingo
    "CUN",  # Cancún — muy volátil
    "SJU",  # San Juan, Puerto Rico
    "MBJ",  # Montego Bay
    "BGI",  # Barbados
    "HAV",  # La Habana
    "AUA",  # Aruba
    "CUR",  # Curazao
    "NAS",  # Nassau
    "STT",  # Saint Thomas USVI
    "UVF",  # Santa Lucía
]

DEST_MEXICO_CENTROAMERICA = [
    "CUN",  # Cancún
    "MEX",  # Ciudad de México
    "GDL",  # Guadalajara
    "PVR",  # Puerto Vallarta
    "SJD",  # Los Cabos
    "HUX",  # Huatulco
    "ZIH",  # Zihuatanejo
    "GUA",  # Ciudad de Guatemala
    "SJO",  # San José, Costa Rica
    "PTY",  # Ciudad de Panamá
]

DEST_MALDIVAS = ["MLE"]  # Masculino — SIEMPRE interesante para errores

DEST_SUDESTE_ASIATICO = [
    "BKK",  # Bangkok — error fares frecuentes
    "SIN",  # Singapur
    "HKG",  # Hong Kong
    "KUL",  # Kuala Lumpur
    "MNL",  # Manila
    "SGN",  # Ho Chi Minh
    "HAN",  # Hanoi
    "DPS",  # Bali Denpasar
    "CMB",  # Colombo
    "MLE",  # Maldivas
]

DEST_JAPON_COREA = [
    "NRT",  # Tokio Narita — error fares frecuentes
    "HND",  # Tokio Haneda
    "ICN",  # Seúl Incheon
    "KIX",  # Osaka
    "CTS",  # Sapporo
    "OKA",  # Okinawa
    "NGO",  # Nagoya
    "GMP",  # Seúl Gimpo
]

DEST_NORTEAMERICA = [
    "JFK",  # Nueva York — error fares frecuentes
    "EWR",  # Newark
    "LAX",  # Los Ángeles
    "MIA",  # Miami
    "SFO",  # San Francisco
    "ORD",  # Chicago
    "BOS",  # Boston
    "YYZ",  # Toronto
    "YVR",  # Vancouver
    "YUL",  # Montreal
    "LAS",  # Las Vegas
    "MCO",  # Orlando
    "MSP",  # Minneapolis
    "SEA",  # Seattle
    "ATL",  # Atlanta
    "DFW",  # Dallas
    "DEN",  # Denver
    "IAD",  # Washington Dulles
]

DEST_SUDAMERICA = [
    "GRU",  # São Paulo — error fares frecuentes
    "EZE",  # Buenos Aires
    "BOG",  # Bogotá
    "SCL",  # Santiago de Chile
    "LIM",  # Lima
    "GIG",  # Río de Janeiro
    "MDE",  # Medellín
    "UIO",  # Quito
    "MVD",  # Montevideo
    "ASU",  # Asunción
]

DEST_ORIENTE_MEDIO = [
    "DXB",  # Dubai — error fares frecuentes
    "DOH",  # Doha
    "AUH",  # Abu Dhabi
    "TLV",  # Tel Aviv
    "AMM",  # Ammán
    "RUH",  # Riad
    "KWI",  # Kuwait
    "BAH",  # Bahréin
    "MCT",  # Mascate (Omán)
]

DEST_AFRICA = [
    "JNB",  # Johannesburgo — error fares frecuentes
    "CPT",  # Ciudad del Cabo
    "NBO",  # Nairobi
    "CMN",  # Casablanca
    "CAI",  # El Cairo
    "DSS",  # Dakar
    "ADD",  # Addis Abeba
    "LOS",  # Lagos
    "ACC",  # Acra
    "TNR",  # Antananarivo (Madagascar)
    "MRU",  # Mauricio — error fares frecuentes
    "RUN",  # Reunión
    "SSY",  # Cabinda
    # Tanzania — añadidos Track 1 TripCazador
    "ZNZ",  # Zanzíbar — destino turístico premium, error fares frecuentes
    "DAR",  # Dar es Salaam — hub principal Tanzania
    "JRO",  # Kilimanjaro — safaris y trekking, vuelos estacionales
    # Expansión abr-2026g — mercado español dominante, alto volumen de búsqueda
    "RAK",  # Marrakech — escapada invierno, paquetes 3-4 noches
    "AGA",  # Agadir — playa+surf, vuelos directos desde España
    "TNG",  # Tánger — Ryanair directo, fin de semana
    "FEZ",  # Fez — ruta cultural
    "LXR",  # Luxor — Egipto Valle del Nilo
    "HRG",  # Hurghada — buceo Mar Rojo
    "SSH",  # Sharm-el-Sheikh — resorts Mar Rojo
    "RMF",  # Marsa Alam — buceo menos masificado
    "TUN",  # Túnez capital — Mediterráneo sur
    "DJE",  # Djerba — isla Túnez, paquetes
    "NKC",  # Nouakchott — nuevos vuelos Air Senegal
    "KGL",  # Kigali — RwandAir connector
    "SEZ",  # Seychelles — error fares raros pero valiosos
]

# ═══════════════════════════════════════════════════════════════════════════
# PRESETS TEMÁTICOS — Agregados abr-2026g para ampliar cobertura de búsqueda
# ═══════════════════════════════════════════════════════════════════════════
# Estos presets se exponen vía main.py --dest <preset> y cron_runner rotation.
# No romper orden: nuevos IATA al final para no perturbar tests de regresión
# que dependan de índices.

# Mar Rojo + Egipto clásico — alta demanda desde España, precios volátiles
DEST_MAR_ROJO = [
    "HRG",  # Hurghada
    "SSH",  # Sharm-el-Sheikh
    "RMF",  # Marsa Alam
    "LXR",  # Luxor (combinado Nilo)
    "CAI",  # El Cairo (pirámides + tránsito Mar Rojo)
    "AQJ",  # Aqaba, Jordania (Mar Rojo norte)
    "TLV",  # Tel Aviv (costa)
]

# Marruecos — mercado Ryanair/Vueling muy activo, escapadas de 3-4 noches
DEST_MARRUECOS = [
    "RAK",  # Marrakech
    "AGA",  # Agadir
    "CMN",  # Casablanca
    "TNG",  # Tánger
    "FEZ",  # Fez
    "OZZ",  # Ouarzazate (puerta del desierto)
    "ESU",  # Essaouira
    "NDR",  # Nador
]

# Weekend city-break europeo — escapadas de 2-3 noches (lista deduplicada)
DEST_WEEKEND_EUROPE = list(dict.fromkeys([
    "LIS", "OPO",                # Portugal
    "BUD", "PRG", "KRK", "WAW",  # Centroeuropa
    "TIA", "SKP", "SJJ",         # Balcanes
    "RIX", "TLL", "VNO",         # Báltico
    "LCA", "PFO",                # Chipre
    "DBV", "SPU",                # Croacia costa
    "CFU", "RHO", "HER",         # Islas griegas
]))

# Family beach — destinos "todo incluido" y cortos de vuelo (deduplicado)
DEST_FAMILY_BEACH = list(dict.fromkeys([
    "PMI", "IBZ", "TFS", "LPA", "FUE", "ACE",  # España
    "AGA", "RAK",                                # Marruecos
    "SSH", "HRG",                                # Egipto
    "DJE",                                       # Túnez
    "AYT", "DLM", "BJV",                         # Turquía Riviera
    "HER", "RHO", "CFU",                         # Grecia islas
]))

DEST_OCEANIA = [
    "SYD",  # Sydney
    "MEL",  # Melbourne
    "AKL",  # Auckland
    "PER",  # Perth
    "BNE",  # Brisbane
    "CHC",  # Christchurch
    "NAN",  # Fiji
    "PPT",  # Papeete (Polinesia Francesa)
]

DEST_INDIA_SUBCONTINENTE = [
    "DEL",  # Delhi
    "BOM",  # Mumbai
    "BLR",  # Bangalore
    "MAA",  # Chennai
    "CCU",  # Calcuta
    "GOI",  # Goa — error fares frecuentes
    "CMB",  # Colombo
    "DAC",  # Dacca
    "KTM",  # Katmandú
]

# Destinos más volátiles (más propensos a errores de precio)
DEST_VOLATILES_PRIORITARIOS = [
    "CUN",  # Cancún — muy volátil
    "BKK",  # Bangkok — muy volátil
    "NRT",  # Tokio — muy volátil
    "JFK",  # Nueva York — muy volátil
    "DXB",  # Dubai — muy volátil
    "MLE",  # Maldivas — muy volátil
    "GRU",  # São Paulo — muy volátil
    "JNB",  # Johannesburgo — muy volátil
    "SYD",  # Sydney — muy volátil
    "PUJ",  # Punta Cana — muy volátil
    "SIN",  # Singapur — muy volátil
    "MRU",  # Mauricio — muy volátil
]

# Todos los destinos long-haul
DEST_ALL_LONG_HAUL = list(dict.fromkeys(
    DEST_CARIBBEAN + DEST_MEXICO_CENTROAMERICA + DEST_MALDIVAS +
    DEST_SUDESTE_ASIATICO + DEST_JAPON_COREA + DEST_NORTEAMERICA +
    DEST_SUDAMERICA + DEST_ORIENTE_MEDIO + DEST_AFRICA + DEST_OCEANIA +
    DEST_INDIA_SUBCONTINENTE
))

# ==============================================================================
# CLASES DE CABINA
# ==============================================================================

CABIN_ECONOMY = 1
CABIN_PREMIUM_ECONOMY = 2
CABIN_BUSINESS = 3
CABIN_FIRST = 4

CABIN_NAMES = {
    1: "Economy",
    2: "Premium Economy",
    3: "Business",
    4: "First",
}

# Mapeo Kiwi Tequila API
KIWI_CABIN_MAP = {
    CABIN_ECONOMY: "M",
    CABIN_PREMIUM_ECONOMY: "W",
    CABIN_BUSINESS: "C",
    CABIN_FIRST: "F",
}

# Mapeo SerpApi Google Flights
SERPAPI_CABIN_MAP = {
    CABIN_ECONOMY: "1",
    CABIN_PREMIUM_ECONOMY: "2",
    CABIN_BUSINESS: "3",
    CABIN_FIRST: "4",
}

# ==============================================================================
# UMBRALES DE PRECIO — Error Fare Detection
# ==============================================================================
# (min_normal, max_normal) en EUR por cabina y categoría de distancia

PRICE_THRESHOLDS = {
    CABIN_ECONOMY: {
        "corto":       (40,  200),    # <1000km: vuelos europeos
        "medio":       (80,  400),    # 1000-4000km: Mediterráneo, Norte de África
        "largo":       (200, 700),    # 4000-8000km: EEUU, Caribe, Asia Occidental
        "ultra_largo": (350, 900),    # >8000km: Asia, Oceanía, LATAM profundo
    },
    CABIN_PREMIUM_ECONOMY: {
        "corto":       (100, 400),
        "medio":       (200, 700),
        "largo":       (500, 1400),
        "ultra_largo": (700, 2000),
    },
    CABIN_BUSINESS: {
        "corto":       (150, 600),
        "medio":       (400, 1200),
        "largo":       (700, 3000),   # < 700€ transatlántico = posible error
        "ultra_largo": (900, 5000),   # < 900€ Asia/Oceanía = posible error
    },
    CABIN_FIRST: {
        "corto":       (300, 1200),
        "medio":       (800, 3000),
        "largo":       (1500, 6000),
        "ultra_largo": (2500, 10000),
    },
}

# Umbrales absolutos de error fare por cabina (precios que NUNCA deberían existir normalmente)
ERROR_FARE_ABSOLUTE_THRESHOLDS = {
    CABIN_ECONOMY: {
        "largo":       150,   # Economy transatlántico < 150€ = posible error
        "ultra_largo": 200,   # Economy Asia/Oceanía < 200€ = posible error
    },
    CABIN_BUSINESS: {
        "corto":       100,   # Business corto < 100€ = error
        "medio":       250,   # Business medio < 250€ = error
        "largo":       400,   # Business transatlántico < 400€ = ERROR FARE
        "ultra_largo": 500,   # Business Asia/Oceanía < 500€ = ERROR FARE
    },
    CABIN_FIRST: {
        "largo":       600,   # First transatlántico < 600€ = error
        "ultra_largo": 800,   # First Asia/Oceanía < 800€ = error
    },
}

# ==============================================================================
# UMBRALES RATIO BUSINESS/ECONOMY — Detección de anomalías
# ==============================================================================
# El ratio normal Business/Economy es:
# - Corto haul: 2x-4x
# - Largo haul: 4x-10x (normalmente 5-8x)
# Cuando el ratio es bajo, hay una anomalía

BUSINESS_ECONOMY_RATIO = {
    "corto":       {"error": 1.5, "anomalia": 2.0, "oferta": 2.5},
    "medio":       {"error": 2.0, "anomalia": 2.5, "oferta": 3.5},
    "largo":       {"error": 1.8, "anomalia": 2.5, "oferta": 4.0},   # 1.8x transatlántico = ERROR FARE
    "ultra_largo": {"error": 2.0, "anomalia": 3.0, "oferta": 5.0},   # 2x Asia/Oceanía = ERROR FARE
}

# Caída en precio desde baseline histórico (%) para clasificación
ANOMALY_THRESHOLDS = {
    "error":    50,   # > 50% por debajo del baseline = ERROR FARE
    "anomalia": 30,   # 30-50% por debajo = ANOMALÍA
    "oferta":   20,   # 20-30% por debajo = OFERTA
}

# ==============================================================================
# SEASONAL THRESHOLDS — Multiplicadores estacionales (#163)
# ==============================================================================
# Contexto: un "precio bajo" en alta temporada NO es lo mismo que en baja.
# Un vuelo Madrid→Palma a 60€ en enero es normal; a 60€ en agosto es ERROR.
# Este mapa multiplica el umbral base (PRICE_THRESHOLDS) según (región, mes)
# para evitar que el detector mande falsos positivos en temporada alta.
#
# Clave 1 = nombre de región (match laxo — contiene-substring sobre el campo
#           `region` que pone el detector al clasificar el destino).
# Clave 2 = mes (1-12).
# Valor   = multiplicador (1.0 = neutro; >1 temporada alta; <1 temporada baja).
#
# Ejemplo de uso:
#   base_max = 200  # max_normal economy corto
#   threshold = base_max * get_seasonal_multiplier("Europa", 8)  # = 200 * 1.25
#
# Si una región/mes no aparece, se devuelve 1.0 (comportamiento previo).
SEASONAL_MULTIPLIERS: Dict[str, Dict[int, float]] = {
    # Europa — pico vacacional julio-agosto, caída enero-febrero y noviembre
    "Europa": {
        1: 0.80, 2: 0.85, 3: 0.95, 4: 1.00, 5: 1.05, 6: 1.15,
        7: 1.30, 8: 1.30, 9: 1.05, 10: 0.95, 11: 0.85, 12: 1.20,  # 12 = Navidad
    },
    # Caribe + Latam norte — seco (y caro) dic-abril, barato mayo-noviembre
    "Caribe": {
        1: 1.30, 2: 1.30, 3: 1.25, 4: 1.15, 5: 0.90, 6: 0.85,
        7: 0.90, 8: 0.90, 9: 0.75, 10: 0.80, 11: 0.95, 12: 1.35,
    },
    # Sudamérica — alta en enero-febrero (vacaciones austral) y dic (Navidad)
    "América Sur": {
        1: 1.30, 2: 1.25, 3: 1.00, 4: 0.90, 5: 0.85, 6: 0.90,
        7: 1.10, 8: 1.00, 9: 0.90, 10: 0.95, 11: 1.00, 12: 1.30,
    },
    # Norteamérica — pico jul-ago y Thanksgiving/Navidad
    "América Norte": {
        1: 0.85, 2: 0.85, 3: 0.95, 4: 1.00, 5: 1.10, 6: 1.20,
        7: 1.25, 8: 1.25, 9: 1.00, 10: 1.00, 11: 1.15, 12: 1.20,
    },
    # Asia Sudeste — alta dic-febrero (seco), monzón abril-septiembre barato
    "Asia": {
        1: 1.25, 2: 1.25, 3: 1.15, 4: 1.05, 5: 0.85, 6: 0.80,
        7: 0.85, 8: 0.90, 9: 0.85, 10: 0.95, 11: 1.10, 12: 1.30,
    },
    # África subsahariana — pico jul-ago (migraciones) y dic-enero
    "África": {
        1: 1.20, 2: 1.05, 3: 0.95, 4: 0.85, 5: 0.85, 6: 1.00,
        7: 1.25, 8: 1.25, 9: 1.05, 10: 0.95, 11: 0.95, 12: 1.30,
    },
    # Mar Rojo / Oriente Medio — invierno europeo = alta (escapada cálida)
    "Oriente Medio": {
        1: 1.25, 2: 1.20, 3: 1.10, 4: 1.00, 5: 0.90, 6: 0.75,
        7: 0.70, 8: 0.70, 9: 0.85, 10: 1.00, 11: 1.15, 12: 1.30,
    },
    # Oceanía — alta dic-febrero (verano austral), baja jun-agosto
    "Oceanía": {
        1: 1.30, 2: 1.20, 3: 1.00, 4: 0.90, 5: 0.85, 6: 0.80,
        7: 0.85, 8: 0.85, 9: 0.95, 10: 1.00, 11: 1.10, 12: 1.35,
    },
}


def get_seasonal_multiplier(region: str, month: int) -> float:
    """
    Devuelve el multiplicador estacional para (region, month).

    - Si `region` no coincide exactamente con ningún key, se intenta match
      parcial case-insensitive: el primer key que contenga la región (o
      viceversa) gana.
    - Si `month` no está en 1..12, se devuelve 1.0 (safe default).
    - Si la región no se encuentra, 1.0.
    """
    if not isinstance(month, int) or not (1 <= month <= 12):
        return 1.0
    if not region:
        return 1.0
    # Match exacto primero
    if region in SEASONAL_MULTIPLIERS:
        return SEASONAL_MULTIPLIERS[region].get(month, 1.0)
    # Match laxo (case-insensitive, substring en ambos sentidos)
    r_low = region.lower()
    for key, months in SEASONAL_MULTIPLIERS.items():
        k_low = key.lower()
        if k_low in r_low or r_low in k_low:
            return months.get(month, 1.0)
    return 1.0


def get_seasonal_threshold(
    base_threshold: float,
    region: str,
    month: int,
    iso_date: str = "",
) -> float:
    """
    Aplica el multiplicador estacional al umbral base.

    Útil para las funciones que comparan precio < umbral: llamar con el
    `max_normal` de `PRICE_THRESHOLDS` y el mes de salida del vuelo para
    ajustar al rango realista de la temporada.

    abr-2026j (#189): si se provee `iso_date` (YYYY-MM-DD), se aplica
    adicionalmente el `get_holiday_multiplier` — captura picos como Semana
    Santa, Navidad o Golden Week que no encajan en la estacionalidad mensual
    promedio. Sin iso_date, comportamiento idéntico al previo.
    """
    mult = get_seasonal_multiplier(region, month)
    if iso_date:
        # Intencional: evita importar get_holiday_multiplier si no hace falta.
        mult *= get_holiday_multiplier(iso_date, region)
    return float(base_threshold) * mult


# ==============================================================================
# PRESETS TEMÁTICOS ADICIONALES (abr-2026i) — Caribe + Asia Sudeste
# ==============================================================================
# Caribe — foco en long-haul accesibles desde hubs europeos
DEST_CARIBE = [
    "CUN",  # Cancún, México (puerta de entrada)
    "PUJ",  # Punta Cana, RD
    "SDQ",  # Santo Domingo
    "MBJ",  # Montego Bay, Jamaica
    "NAS",  # Nassau, Bahamas
    "SJU",  # San Juan, Puerto Rico
    "HAV",  # La Habana, Cuba
    "VRA",  # Varadero, Cuba
    "CUR",  # Curaçao
    "AUA",  # Aruba
    "SXM",  # Sint Maarten
    "BGI",  # Bridgetown, Barbados
    "POS",  # Puerto España, Trinidad
    "CTG",  # Cartagena (Caribe colombiano)
]

# Asia Sudeste — la tríada clásica Thai/Vietnam/Indonesia
DEST_ASIA_SUDESTE = [
    "BKK",  # Bangkok Suvarnabhumi
    "DMK",  # Bangkok Don Mueang (lowcost)
    "HKT",  # Phuket
    "USM",  # Koh Samui
    "CNX",  # Chiang Mai
    "SGN",  # Ho Chi Minh
    "HAN",  # Hanoi
    "DAD",  # Da Nang
    "PQC",  # Phu Quoc
    "KUL",  # Kuala Lumpur
    "SIN",  # Singapur
    "DPS",  # Denpasar / Bali
    "CGK",  # Yakarta
    "MNL",  # Manila
    "CEB",  # Cebú
    "RGN",  # Rangún, Myanmar
    "PNH",  # Phnom Penh
    "REP",  # Siem Reap (Angkor)
]

# abr-2026p — Preset Asia Luxury (business class, hubs premium asiáticos)
# Audiencia: viajeros que cazan business <€900 a Asia (Tokio, Singapur, Bangkok,
# Hong Kong). Usado por scripts business_real_hunt y rotación premium.
# Precios típicos no-error rondan €1500-2500; <€900 es claramente anomalía.
DEST_ASIA_LUXURY = [
    "HND",  # Tokyo Haneda — preferido por business
    "NRT",  # Tokyo Narita
    "KIX",  # Osaka Kansai
    "ICN",  # Seoul Incheon
    "GMP",  # Seoul Gimpo (regional)
    "SIN",  # Singapur Changi — hub long-haul
    "HKG",  # Hong Kong
    "BKK",  # Bangkok BKK
    "TPE",  # Taipei Taoyuan
    "PVG",  # Shanghai Pudong
    "PEK",  # Beijing Capital
    "PEK",  # Beijing Daxing alt
]

# abr-2026p — Preset Africa Adventure (economy <€350, destinos aventura)
# Audiencia: viajeros con presupuesto que buscan safari/desierto/playa con
# valor por euro alto. Off-peak seasonal mults aplican (lluvias = mejor precio).
# Casablanca actúa como pivot a otros destinos africanos.
DEST_AFRICA_ADVENTURE = [
    "CMN",  # Casablanca — pivot
    "RAK",  # Marrakech — fin de semana corto
    "RBA",  # Rabat
    "TUN",  # Túnez
    "CAI",  # El Cairo (pirámides)
    "JNB",  # Johannesburgo (Krüger)
    "CPT",  # Cape Town
    "NBO",  # Nairobi (Masai Mara)
    "MBA",  # Mombasa (playa Kenia)
    "ZNZ",  # Zanzíbar
    "JRO",  # Kilimanjaro
    "DAR",  # Dar es Salaam
    "ADD",  # Addis Abeba
    "LOS",  # Lagos (Nigeria)
    "ACC",  # Accra (Ghana)
    "DKR",  # Dakar (Senegal)
]

# SSS98 (may 2026) — 3 presets temáticos nuevos para diversificar cobertura.
# Audit detectó 0 deals en estos verticales pese a búsquedas reales en Search Console.

# Ski Alps — invierno (dic-mar). Aeropuertos cerca de pistas o con tren al chalet.
DEST_SKI_ALPS = [
    "GVA",  # Ginebra — pivot Chamonix/Val d'Isère/Verbier
    "INN",  # Innsbruck — Tirol austríaco
    "SZG",  # Salzburgo — Hochkönig
    "MUC",  # Múnich — Garmisch
    "ZRH",  # Zúrich — St. Moritz/Davos
    "BGY",  # Milán Bergamo — Dolomitas
    "TRN",  # Turín — Sestrière
    "GRZ",  # Graz — Schladming
    "FMM",  # Memmingen — Allgäu
    "LJU",  # Liubliana — Kranjska Gora
    "GNB",  # Grenoble — Alpe d'Huez/Les Deux Alpes
    "CMF",  # Chambéry — Val Thorens/Méribel
]

# Gastronomy — destinos foodie con calendario flexible (no estacional).
DEST_GASTRO = [
    "FCO",  # Roma — pasta + cucina romana
    "NAP",  # Nápoles — pizza + Costa Amalfitana
    "FLR",  # Florencia — Toscana + bistecca
    "BLQ",  # Bolonia — la grassa
    "LIS",  # Lisboa — pastéis + marisco
    "OPO",  # Porto — francesinha + vinho do porto
    "BIO",  # Bilbao — pintxos + Asador Etxebarri
    "SDR",  # Santander — anchoas + cocina vasca
    "BCN",  # Barcelona — Disfrutar + boquerones
    "VLC",  # Valencia — paella en l'Albufera
    "BOG",  # Bogotá — bandeja paisa + Andrés
    "MEX",  # Ciudad de México — Pujol + Quintonil
    "OAX",  # Oaxaca — mole + mezcal
    "BKK",  # Bangkok — street food + Sühring
    "HKG",  # Hong Kong — dim sum + cha chaan teng
    "TYO",  # Tokio (HND/NRT alias) — sushiya + ramen + izakaya
]

# Festivales musicales — fechas concretas atraen búsquedas estacionales.
DEST_FESTIVAL = [
    "BCN",  # Sónar (jun) + Primavera Sound (jun)
    "AMS",  # ADE (oct) + Lowlands (ago) + Mysteryland (ago)
    "BUD",  # Sziget (ago)
    "ATH",  # Release Athens (jun)
    "CPH",  # Roskilde (jul) + Distortion (jun)
    "GLA",  # Glasgow — TRNSMT (jul)
    "EDI",  # Edimburgo Fringe (ago)
    "BER",  # Berlín — Lollapalooza Berlin (sep) + clubs todo año
    "PRG",  # Praga — United Islands (jun)
    "LIS",  # NOS Alive (jul) + Super Bock Super Rock (jul)
    "MAD",  # Mad Cool (jul)
    "WAW",  # Open'er Gdynia (jul) — vuelos a GDN cerca
    "RKV",  # Reikiavik — Iceland Airwaves (nov)
    "AUS",  # Austin TX — SXSW (mar) + ACL (oct)
    "MEX",  # Corona Capital (nov)
    "BUE",  # Buenos Aires — Lollapalooza Argentina (mar)
]

# UUU04 — 4 nuevos presets temáticos para diversificar la cobertura del hunter.

# Sports — eventos deportivos crean spikes de búsqueda predecibles.
DEST_SPORTS = [
    "MAD",  # Real Madrid (Champions, Liga, Mundial Clubes)
    "BCN",  # FC Barcelona + GP F1 Catalunya (jun)
    "SIL",  # Silverstone GP (jul) — STN/LTN
    "MIL",  # Inter/Milan + Italian GP Monza (sep)
    "MUC",  # Bayern + Octoberfest (sep)
    "DUB",  # Six Nations rugby (feb-mar)
    "MIA",  # Miami GP F1 (may) + NFL Dolphins
    "AUS",  # COTA F1 (oct) + Texas Longhorns
    "TYO",  # Tokyo Marathon (mar) + Olímpicos legacy
    "RIO",  # Maracanã + Carnaval (feb)
    "DEN",  # Denver — Broncos + Avalanche
    "MEL",  # Australian Open tennis (ene) + AFL
    "MIA",  # Miami Heat NBA + Marathon
    "VLC",  # Maratón Valencia (dic)
    "BOS",  # Boston Marathon (abr)
    "NYC",  # NYC Marathon (nov) + Knicks/Yankees
]

# Wellness/Spa — mercado creciente long-stay 60+ y bienestar.
DEST_WELLNESS = [
    "BUD",  # Budapest baños termales (Széchenyi, Gellért)
    "BAK",  # Baku — termas naturales
    "REK",  # Reykjavik — Blue Lagoon + Sky Lagoon
    "RHO",  # Rodas — talasoterapia
    "DUB",  # Dubai — wellness resorts top
    "BKK",  # Bangkok — Thai massage + spas Asia
    "MLE",  # Maldivas — overwater spas
    "DPS",  # Bali — Ubud yoga retreats
    "FNC",  # Madeira — wellness retreats
    "MAH",  # Menorca — calma + thalasso
    "BOG",  # Boquete (vía PTY) — wellness Panamá
    "ZRH",  # Zurich/Suiza — Bad Ragaz balneario
]

# Estudio idiomas — high-intent keywords "vuelos baratos para estudiar X".
DEST_STUDY_ABROAD = [
    "LON",  # Londres — inglés + universidades top
    "OXF",  # Oxford área — vía LHR/STN
    "DUB",  # Dublín — inglés + Trinity College
    "BER",  # Berlín — alemán + DAAD
    "MUN",  # Múnich — alemán + LMU
    "PAR",  # París — francés + Sorbonne
    "ROM",  # Roma — italiano + Bocconi
    "BCN",  # Barcelona — español + EAE/IESE
    "MAD",  # Madrid — español + IE Business School
    "TOK",  # Tokio — japonés + Waseda
    "SEL",  # Seúl — coreano + Yonsei
    "PEK",  # Pekín — mandarín + BLCU
    "BUE",  # Buenos Aires — español + UBA
    "MEX",  # Ciudad México — español Latam + UNAM
    "MEL",  # Melbourne — inglés + Univ Melbourne
]

# Auroras boreales — keyword estacional alto sept-mar.
DEST_NORTHERN_LIGHTS = [
    "KEF",  # Reikiavik
    "TOS",  # Tromsø — Norway aurora capital
    "OSL",  # Oslo + viaje a Lyngen / Lofoten
    "RVN",  # Rovaniemi — Laponia finlandesa (Santa)
    "KIR",  # Kiruna — Suecia + Abisko Sky Station
    "MQX",  # Mekele — Etiopía? no. → Murmansk RUS skip por sanciones
    "BOO",  # Bodø — Noruega Lofoten gateway
    "FAI",  # Fairbanks Alaska — auroras + Denali
    "YZF",  # Yellowknife Canada — Aurora Village
    "ANC",  # Anchorage Alaska
]

# ==============================================================================
# SCORING MULTI-FACTOR
# ==============================================================================

# Pesos para el score compuesto (0-100)
SCORE_WEIGHTS = {
    "precio_absoluto":    0.30,  # ¿Precio absoluto muy bajo?
    "ratio_bec":          0.25,  # ¿Ratio Business/Economy bajo?
    "caida_historica":    0.25,  # ¿Cuánto cae respecto al histórico?
    "validacion_fuentes": 0.10,  # ¿Confirmado por múltiples fuentes?
    "temporada":          0.10,  # ¿En temporada alta?
}

# ==============================================================================
# CLASIFICACIÓN DE DISTANCIAS POR REGIÓN
# ==============================================================================

# Destinos por categoría de distancia desde Europa
# Aerolíneas low-cost: umbrales T0 distintos (15€ MRS→PMI es normal, no un error)
LOWCOST_AIRLINES = {
    "FR",   # Ryanair
    "U2",   # easyJet
    "W6",   # Wizz Air
    "VY",   # Vueling
    "V7",   # Volotea
    "LS",   # Jet2
    "BE",   # FlyBE
    "HV",   # Transavia
    "TO",   # Transavia France
    "SK",   # Norwegian (low-cost)
    "PC",   # Pegasus
    "XR",   # Corendon
    "D8",   # Norwegian Air International
}

# Aeropuertos europeos (para "corto" haul desde Europa)
# Se genera automáticamente a partir de EUROPEAN_AIRPORTS_ALL (definido arriba)
# + añadidos específicos (islas mediterráneas, etc.)
_EUROPEAN_EXTRAS = {
    "CTA", "PMO", "BRI", "NAP", "FCO", "CIA", "VCE", "MXP", "BGY",
    "PSA", "BLQ", "LIN", "PMI", "IBZ", "MAH", "ACE", "TFN", "TFS",
    "LPA", "FUE", "ALC", "SDR", "VLL", "VGO", "SCQ", "GRO", "REU",
    "MAD", "BCN", "VLC", "AGP", "SVQ", "BIO", "ORY", "BVA", "NCE",
    "TLS", "BOD", "SXB", "LHR", "LGW", "STN", "LTN", "MAN", "EDI",
    "BHX", "BRS", "GLA", "FRA", "MUC", "BER", "HAM", "DUS", "CGN",
    "STR", "NUE", "HAJ", "HHN", "FKB", "BSL", "ZRH", "GVA", "LUX",
    "AMS", "EIN", "BRU", "CRL", "VIE", "SZG", "CPH", "ARN", "GOT",
    "OSL", "BGO", "HEL", "DUB", "ORK", "SNN", "WAW", "KRK", "WRO",
    "KTW", "BUD", "PRG", "BRQ", "OTP", "CLJ", "SOF", "VAR", "BEG",
    "ZAG", "SPU", "DBV", "LJU", "SKP", "TIA", "PRN", "RIX", "TLL",
    "VNO", "KBP", "ATH", "SKG", "HER", "RHO", "CFU", "CHQ", "ZTH",
    "KGS", "JTR", "JMK", "IST", "SAW", "ESB", "ADB", "AYT", "DLM",
    "BJV", "RMO", "SCV", "BUH", "CDG", "LYS", "MRS", "OPO", "FAO",
    "LIS", "MIL", "LON", "ROM", "PAR",
}

DISTANCE_ULTRA_LARGO = {
    "SYD", "MEL", "AKL", "BNE", "PER", "CHC",   # Oceanía
    "NRT", "HND", "ICN", "KIX", "CTS", "OKA",   # Japón/Corea
    "MNL", "DPS",                                  # Filipinas, Bali
    "GRU", "EZE", "SCL", "LIM", "BOG",           # LATAM
    "PPT", "NAN",                                  # Pacífico
}

DISTANCE_LARGO = {
    "JFK", "EWR", "LAX", "MIA", "SFO", "ORD",   # EEUU Este/Oeste
    "BOS", "ATL", "DFW", "SEA", "DEN", "IAD",   # Más EEUU
    "LAS", "MCO", "MSP",
    "YYZ", "YVR", "YUL",                           # Canadá
    "CUN", "MEX", "GDL", "PVR",                   # México
    "PUJ", "SDQ", "SJU", "MBJ", "HAV",           # Caribe
    "BKK", "SIN", "HKG", "KUL", "SGN", "HAN",   # Sudeste Asiático
    "DEL", "BOM", "BLR", "GOI", "CMB",           # India
    "JNB", "CPT", "NBO", "ADD", "MRU",           # África
    "DXB", "DOH", "AUH", "RUH",                   # Oriente Medio
}

DISTANCE_MEDIO = {
    "IST", "SAW", "ESB", "AYT", "DLM",           # Turquía
    "TLV", "AMM", "BEY",                          # Oriente Próximo
    "CAI", "CMN", "TUN", "ALG",                   # Norte África
    "ATH", "HER", "RHO", "SKG",                   # Grecia
    "KWI", "BAH", "MCT",                          # Golfo cercano
    "TFS", "LPA", "FUE",                          # Canarias
    "MTY", "PTY", "BOG",                          # LATAM cercano
}

def get_distance_category(destination: str) -> str:
    """Determina la categoría de distancia de un destino desde Europa."""
    if destination in DISTANCE_ULTRA_LARGO:
        return "ultra_largo"
    elif destination in DISTANCE_LARGO:
        return "largo"
    elif destination in DISTANCE_MEDIO:
        return "medio"
    elif destination in _EUROPEAN_EXTRAS:
        return "corto"   # Aeropuerto europeo conocido → siempre corto
    else:
        # Intentar inferir por prefijo IATA (heurística)
        # Si no se puede clasificar, asumir largo haul por seguridad
        return "largo"

# ==============================================================================
# PARÁMETROS DE BÚSQUEDA
# ==============================================================================

DEFAULT_CABIN = CABIN_ECONOMY
DEFAULT_ADULTS = 1
SEARCH_FLEX_DAYS = 3
WEEKS_TO_COMPARE = 4
CURRENCY = "EUR"
LANGUAGE = "es"

# Límites de búsqueda Kiwi
KIWI_MAX_RESULTS = 50          # Resultados por búsqueda "anywhere"
KIWI_MAX_STOPOVERS = 2         # Máximo escalas
KIWI_MAX_CONCURRENT = 8        # Peticiones paralelas (API free es generosa)
KIWI_RATE_LIMIT_DELAY = 0.3    # Segundos entre peticiones

# Cuota SerpApi
SERPAPI_MONTHLY_BUDGET = 95    # Reservar 5 para uso manual

# ==============================================================================
# BASE DE DATOS
# ==============================================================================

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Usar /tmp si el directorio del script no tiene permisos de escritura para SQLite WAL
_DB_CANDIDATE = os.path.join(_SCRIPT_DIR, "price_history_v4.db")
_SESSION_DIR = "/sessions/inspiring-sleepy-clarke"
if os.path.isdir(_SESSION_DIR) and os.access(_SESSION_DIR, os.W_OK):
    PRICE_DB_PATH = os.path.join(_SESSION_DIR, "price_history_v4.db")
else:
    PRICE_DB_PATH = _DB_CANDIDATE
REPORT_DIR = os.path.join(_SCRIPT_DIR, "..", "")  # Carpeta padre del módulo

# ==============================================================================
# TEMPORADAS (para scoring)
# ==============================================================================

HIGH_SEASON_DATES = {
    "verano_2026":     {"start": "2026-06-15", "end": "2026-09-15", "multiplier": 1.4},
    "navidad_2026":    {"start": "2026-12-18", "end": "2027-01-07", "multiplier": 1.6},
    "semana_santa_27": {"start": "2027-04-09", "end": "2027-04-20", "multiplier": 1.3},
    "verano_2027":     {"start": "2027-06-15", "end": "2027-09-15", "multiplier": 1.4},
    "navidad_2027":    {"start": "2027-12-18", "end": "2028-01-07", "multiplier": 1.6},
}

def get_season_multiplier(date_str: str) -> float:
    """Retorna el multiplicador de precio para una fecha (temporada alta = precios más altos = mejor deal)."""
    try:
        from datetime import datetime
        d = datetime.strptime(date_str, "%Y-%m-%d")
        for season in HIGH_SEASON_DATES.values():
            start = datetime.strptime(season["start"], "%Y-%m-%d")
            end = datetime.strptime(season["end"], "%Y-%m-%d")
            if start <= d <= end:
                return season["multiplier"]
    except Exception:
        pass
    return 1.0

# ==============================================================================
# AEROLÍNEAS DE REFERENCIA POR TIPO
# ==============================================================================

# Aerolíneas conocidas por error fares frecuentes
AIRLINES_ERROR_PRONE = {
    "AF", "KL", "LH", "BA", "IB", "AZ", "TK", "EK", "QR", "EY",
    "SQ", "CX", "JL", "NH", "OZ", "KE", "TG", "MH",
    "AA", "UA", "DL", "AC",
}

# Aerolíneas premium (Business class de calidad)
AIRLINES_PREMIUM_BUSINESS = {
    "SQ",   # Singapore Airlines — mejor Business del mundo
    "CX",   # Cathay Pacific
    "QR",   # Qatar Airways — Qsuites
    "EK",   # Emirates
    "EY",   # Etihad
    "LH",   # Lufthansa
    "AF",   # Air France
    "BA",   # British Airways
    "NH",   # ANA
    "JL",   # JAL
    "TK",   # Turkish Airlines
    "KL",   # KLM
    "AZ",   # Alitalia/ITA
    "IB",   # Iberia
    "AY",   # Finnair
    "SK",   # SAS
    "OS",   # Austrian Airlines
    "SN",   # Brussels Airlines
    "AC",   # Air Canada
    "OZ",   # Asiana
    "KE",   # Korean Air
}

# ==============================================================================
# FUNCIONES DE VALIDACIÓN
# ==============================================================================

def is_error_fare(price: float, cabin: int, destination: str) -> bool:
    """Detecta si un precio es un error fare basado en umbrales absolutos."""
    dist = get_distance_category(destination)
    if cabin not in ERROR_FARE_ABSOLUTE_THRESHOLDS:
        return False
    thresholds = ERROR_FARE_ABSOLUTE_THRESHOLDS[cabin]
    threshold = thresholds.get(dist)
    if threshold is None:
        return False
    return price < threshold


def is_error_fare_seasonal(
    price: float,
    cabin: int,
    destination: str,
    month: int = 0,
    region: str = "",
    iso_date: str = "",
) -> bool:
    """
    Variante estacional de `is_error_fare`: aplica SEASONAL_MULTIPLIERS al
    umbral absoluto según (region, month) del vuelo.

    - Si `month` (1..12) y `region` son válidos, ajusta el umbral.
    - Si el multiplicador es 1.0 (región/mes sin datos), el resultado es
      idéntico a `is_error_fare(...)` — compatibilidad hacia atrás.
    - abr-2026j (#189): si `iso_date` cae en una ventana de `HOLIDAY_WINDOWS`
      para la region, se multiplica adicionalmente por el holiday_multiplier.
      Un 500€ Madrid→Punta Cana que en baja NO es error pasa a serlo si cae
      durante Semana Santa (holiday x1.25).

    Justificación #163: un €150 Madrid→Punta Cana en septiembre NO es error
    (temporada baja, mult≈0.75 → threshold 150*0.75=112€) pero en febrero
    SÍ (temporada alta, mult≈1.30 → threshold 150*1.30=195€, así que 150 lo
    dispara). Evita falsos negativos en alta y falsos positivos en baja.
    """
    dist = get_distance_category(destination)
    if cabin not in ERROR_FARE_ABSOLUTE_THRESHOLDS:
        return False
    thresholds = ERROR_FARE_ABSOLUTE_THRESHOLDS[cabin]
    base = thresholds.get(dist)
    if base is None:
        return False
    if month:
        adjusted = get_seasonal_threshold(base, region, month, iso_date=iso_date)
    else:
        adjusted = float(base)
    return price < adjusted


def _month_from_iso(iso_date: str) -> int:
    """
    Extrae el mes (1..12) de un string ISO YYYY-MM-DD (o primer tramo).

    Retorna 0 si el string no es válido, para que los callers puedan
    combinar con `is_error_fare_seasonal` y caer al comportamiento neutro.
    """
    if not iso_date or not isinstance(iso_date, str):
        return 0
    try:
        parts = iso_date.split("-")
        if len(parts) < 2:
            return 0
        m = int(parts[1])
        return m if 1 <= m <= 12 else 0
    except (ValueError, IndexError):
        return 0


# ==============================================================================
# HOLIDAY CALENDAR — abr-2026j (#189)
# ==============================================================================
# Ventanas de festividades que encarecen vuelos por encima del patrón estacional
# base. Se aplica EN ADICIÓN al SEASONAL_MULTIPLIERS: el threshold final es
# `base * seasonal * holiday`. Esto captura picos como Semana Santa (que cae en
# marzo/abril — meses con estacionalidad media — pero genera subida brutal de
# precio), Navidad/Nochevieja, Golden Week japonesa, Chinese New Year, etc.
#
# Formato de cada ventana:
#   - name: etiqueta humana (para debug/logs)
#   - from / to: YYYY-MM-DD inclusive, pueden ser fechas literales
#   - regions: lista de regiones; "*" = todas
#   - multiplier: factor aplicado sobre el threshold (1.0 = neutral)
#
# Añadir 3 años por delante para no caer en "ventana vacía" en 2027/2028.
# Las fechas móviles (Pascua, Eid, Chinese NY) se hardcodean año a año para
# evitar depender de librerías astronómicas en el motor.
HOLIDAY_WINDOWS: list = [
    # ─── Navidad + Nochevieja (Reyes) — pico universal ───
    {"name": "Navidad/Nochevieja", "from": "2026-12-20", "to": "2027-01-06",
     "regions": ["*"], "multiplier": 1.25},
    {"name": "Navidad/Nochevieja", "from": "2027-12-20", "to": "2028-01-06",
     "regions": ["*"], "multiplier": 1.25},
    {"name": "Navidad/Nochevieja", "from": "2028-12-20", "to": "2029-01-06",
     "regions": ["*"], "multiplier": 1.25},

    # ─── Semana Santa (Europa / LatAm / Caribe) ───
    # 2026: Domingo Resurrección = 5 abr → ventana 28 mar - 6 abr
    {"name": "Semana Santa", "from": "2026-03-28", "to": "2026-04-06",
     "regions": ["Europa", "América Sur", "Caribe", "América Norte"],
     "multiplier": 1.25},
    # 2027: Domingo Resurrección = 28 mar → ventana 20 - 29 mar
    {"name": "Semana Santa", "from": "2027-03-20", "to": "2027-03-29",
     "regions": ["Europa", "América Sur", "Caribe", "América Norte"],
     "multiplier": 1.25},
    # 2028: Domingo Resurrección = 16 abr → ventana 8 - 17 abr
    {"name": "Semana Santa", "from": "2028-04-08", "to": "2028-04-17",
     "regions": ["Europa", "América Sur", "Caribe", "América Norte"],
     "multiplier": 1.25},

    # ─── Carnaval (Río + Caribe) ───
    {"name": "Carnaval", "from": "2026-02-13", "to": "2026-02-18",
     "regions": ["Caribe", "América Sur"], "multiplier": 1.20},
    {"name": "Carnaval", "from": "2027-02-05", "to": "2027-02-10",
     "regions": ["Caribe", "América Sur"], "multiplier": 1.20},
    {"name": "Carnaval", "from": "2028-02-25", "to": "2028-03-01",
     "regions": ["Caribe", "América Sur"], "multiplier": 1.20},

    # ─── Puente Constitución + Inmaculada (España) ───
    {"name": "Puente Constitución", "from": "2026-12-04", "to": "2026-12-09",
     "regions": ["Europa"], "multiplier": 1.15},
    {"name": "Puente Constitución", "from": "2027-12-04", "to": "2027-12-08",
     "regions": ["Europa"], "multiplier": 1.15},

    # ─── Golden Week (Japón) ───
    {"name": "Golden Week", "from": "2026-04-29", "to": "2026-05-06",
     "regions": ["Asia"], "multiplier": 1.25},
    {"name": "Golden Week", "from": "2027-04-29", "to": "2027-05-06",
     "regions": ["Asia"], "multiplier": 1.25},
    {"name": "Golden Week", "from": "2028-04-29", "to": "2028-05-06",
     "regions": ["Asia"], "multiplier": 1.25},

    # ─── Obon (Japón, mediados de agosto) ───
    {"name": "Obon", "from": "2026-08-13", "to": "2026-08-16",
     "regions": ["Asia"], "multiplier": 1.15},
    {"name": "Obon", "from": "2027-08-13", "to": "2027-08-16",
     "regions": ["Asia"], "multiplier": 1.15},

    # ─── Chinese New Year ───
    # 2026-02-17 (Caballo), 2027-02-06 (Cabra), 2028-01-26 (Mono)
    {"name": "Chinese New Year", "from": "2026-02-15", "to": "2026-02-24",
     "regions": ["Asia"], "multiplier": 1.30},
    {"name": "Chinese New Year", "from": "2027-02-04", "to": "2027-02-13",
     "regions": ["Asia"], "multiplier": 1.30},
    {"name": "Chinese New Year", "from": "2028-01-24", "to": "2028-02-02",
     "regions": ["Asia"], "multiplier": 1.30},

    # ─── Eid al-Fitr (Oriente Medio + Norte África) ───
    # Aproximaciones (depende de observación lunar ±1 día)
    {"name": "Eid al-Fitr", "from": "2026-03-19", "to": "2026-03-23",
     "regions": ["Oriente Medio", "África"], "multiplier": 1.15},
    {"name": "Eid al-Fitr", "from": "2027-03-09", "to": "2027-03-13",
     "regions": ["Oriente Medio", "África"], "multiplier": 1.15},
    {"name": "Eid al-Fitr", "from": "2028-02-26", "to": "2028-03-01",
     "regions": ["Oriente Medio", "África"], "multiplier": 1.15},

    # ─── Thanksgiving (EE.UU.) — 4º jueves de noviembre ───
    {"name": "Thanksgiving", "from": "2026-11-24", "to": "2026-11-30",
     "regions": ["América Norte"], "multiplier": 1.20},
    {"name": "Thanksgiving", "from": "2027-11-23", "to": "2027-11-29",
     "regions": ["América Norte"], "multiplier": 1.20},
    {"name": "Thanksgiving", "from": "2028-11-21", "to": "2028-11-27",
     "regions": ["América Norte"], "multiplier": 1.20},

    # ─── Diwali (India + Sudeste Asiático) ───
    {"name": "Diwali", "from": "2026-11-08", "to": "2026-11-10",
     "regions": ["Asia"], "multiplier": 1.15},
    {"name": "Diwali", "from": "2027-10-28", "to": "2027-10-30",
     "regions": ["Asia"], "multiplier": 1.15},
]


def get_holiday_multiplier(iso_date: str, region: str) -> float:
    """
    Devuelve el multiplicador de festividad aplicable a (iso_date, region).

    - Si hay varias ventanas solapadas (raro), toma la mayor.
    - Si `iso_date` no tiene formato ISO YYYY-MM-DD válido, devuelve 1.0.
    - Si `region` no coincide con ninguna ventana (y ninguna es "*"), 1.0.

    Valor 1.0 es el "no-op": seguro para multiplicar sin efecto.
    """
    if not iso_date or not isinstance(iso_date, str):
        return 1.0
    iso = iso_date[:10]
    # Validar formato YYYY-MM-DD
    if len(iso) != 10 or iso[4] != "-" or iso[7] != "-":
        return 1.0
    try:
        # Validar que es una fecha real (mes/día en rango)
        m = int(iso[5:7])
        d = int(iso[8:10])
        if not (1 <= m <= 12 and 1 <= d <= 31):
            return 1.0
    except ValueError:
        return 1.0

    r = (region or "").strip().lower()
    best = 1.0
    for w in HOLIDAY_WINDOWS:
        if w["from"] <= iso <= w["to"]:
            regions = w.get("regions", [])
            if "*" in regions:
                match = True
            else:
                match = any(
                    reg.lower() == r or (r and reg.lower() in r) or (r and r in reg.lower())
                    for reg in regions
                )
            if match:
                mult = float(w.get("multiplier", 1.0))
                if mult > best:
                    best = mult
    return best


def compute_bridging_synthetic(
    origin: str,
    destination: str,
    deals_index: Dict[Tuple[str, str], float],
    direct_price: Optional[float] = None,
    hubs: Optional[List[str]] = None,
) -> Optional[Dict[str, object]]:
    """
    TTT01 — Hub-bridging detector (sintético).

    Para una ruta (origen ES → destino long-haul) sin deal directo o con
    directo caro, calcula min(origen→XXX) + min(XXX→destino) usando hubs
    estratégicos. Si total < 80% del directo Travelpayouts → emite deal
    sintético con bridging:true.

    Args:
        origin: IATA origen (ej. "MAD")
        destination: IATA destino long-haul (ej. "NRT")
        deals_index: dict {(orig, dest): min_price_eur} del último scan
        direct_price: precio Travelpayouts directo si existe (None si no)
        hubs: lista de hubs intermedios. Default: 7 hubs principales.

    Returns:
        Dict con campos del deal sintético, o None si no hay bridging válido.
    """
    if not hubs:
        hubs = ["LHR", "AMS", "CDG", "FRA", "IST", "DOH", "MUC"]

    best_total = None
    best_hub = None
    best_legs = None

    for hub in hubs:
        if hub == origin or hub == destination:
            continue
        leg1 = deals_index.get((origin, hub))
        leg2 = deals_index.get((hub, destination))
        if leg1 is None or leg2 is None:
            continue
        total = leg1 + leg2
        if best_total is None or total < best_total:
            best_total = total
            best_hub = hub
            best_legs = (leg1, leg2)

    if best_total is None:
        return None

    # Solo emitir si total < 80% del directo (si hay directo conocido).
    # Si no hay directo: emitir con score más bajo (60).
    if direct_price is not None:
        if best_total >= direct_price * 0.80:
            return None
        # Score basado en savings: 80→60pts, 50→90pts
        savings_pct = 1 - (best_total / direct_price)
        score = min(95, 60 + savings_pct * 80)
    else:
        score = 60

    return {
        "origin": origin,
        "destination": destination,
        "price_eur": round(best_total, 2),
        "score": int(score),
        "bridging": True,
        "hub_via": best_hub,
        "leg1_price": best_legs[0],
        "leg2_price": best_legs[1],
        "stops": 1,
        "source": "bridging_synthetic",
        "reason": (
            f"Bridging via {best_hub}: €{best_legs[0]:.0f} + €{best_legs[1]:.0f} "
            f"= €{best_total:.0f}"
            + (f" (vs directo €{direct_price:.0f})" if direct_price else "")
        ),
    }


def compute_dual_bridging_synthetic(
    origin: str,
    destination: str,
    deals_index: Dict[Tuple[str, str], float],
    direct_price: Optional[float] = None,
    hubs: Optional[List[str]] = None,
    max_total_legs_pct: float = 0.70,
) -> Optional[Dict[str, object]]:
    """
    UUU05 — Dual-hub bridging detector. Síntesis de 2-stop con 2 hubs.

    Para rutas long-haul exóticas (ej. MAD→DPS), prueba combinaciones
    {origin → hub1 → hub2 → destination} buscando totales aún menores
    que el bridging single-hub. Captura casos como:
      MAD → AMS (€60) → BKK (€350) → DPS (€90) = €500
      vs directo MAD-DPS €850 (>40% savings).

    Args:
        origin: IATA origen
        destination: IATA destino
        deals_index: dict {(orig, dest): min_price_eur}
        direct_price: precio directo Travelpayouts (None si no)
        hubs: lista de hubs intermedios (default 9 mega-hubs)
        max_total_legs_pct: total ≤ 70% del directo para emitir (más
                           estricto que single-hub porque la ruta es peor UX)

    Returns:
        Dict con campos del deal sintético dual-bridging, o None.

    O(hubs²) = 81 combinaciones para el default (9 hubs). Skipea si
    hub1 == hub2, hub1 == origin/destination, hub2 == origin/destination.
    """
    if not hubs:
        # 9 mega-hubs estratégicos (incluye Asia para combos exóticos).
        hubs = ["LHR", "AMS", "CDG", "FRA", "IST", "DOH", "MUC", "DXB", "BKK"]

    best_total: Optional[float] = None
    best_path: Optional[Tuple[str, str]] = None
    best_legs: Optional[Tuple[float, float, float]] = None

    for hub1 in hubs:
        if hub1 == origin or hub1 == destination:
            continue
        leg1 = deals_index.get((origin, hub1))
        if leg1 is None:
            continue
        for hub2 in hubs:
            if hub2 in (hub1, origin, destination):
                continue
            leg2 = deals_index.get((hub1, hub2))
            leg3 = deals_index.get((hub2, destination))
            if leg2 is None or leg3 is None:
                continue
            total = leg1 + leg2 + leg3
            if best_total is None or total < best_total:
                best_total = total
                best_path = (hub1, hub2)
                best_legs = (leg1, leg2, leg3)

    if best_total is None or best_path is None or best_legs is None:
        return None

    if direct_price is not None:
        if best_total >= direct_price * max_total_legs_pct:
            return None
        savings_pct = 1 - (best_total / direct_price)
        score = min(90, 50 + savings_pct * 80)  # ceiling 90 (peor que single-hub 95)
    else:
        score = 50

    return {
        "origin": origin,
        "destination": destination,
        "price_eur": round(best_total, 2),
        "score": int(score),
        "bridging": True,
        "bridging_dual": True,
        "hub1_via": best_path[0],
        "hub2_via": best_path[1],
        "leg1_price": best_legs[0],
        "leg2_price": best_legs[1],
        "leg3_price": best_legs[2],
        "stops": 2,
        "source": "bridging_dual_synthetic",
        "reason": (
            f"Dual-bridging via {best_path[0]}+{best_path[1]}: "
            f"€{best_legs[0]:.0f}+€{best_legs[1]:.0f}+€{best_legs[2]:.0f} "
            f"= €{best_total:.0f}"
            + (f" (vs directo €{direct_price:.0f})" if direct_price else "")
        ),
    }


def is_multi_stop_anomaly(
    price: float,
    cabin: int,
    destination: str,
    stops: int,
) -> bool:
    """
    Detecta multi-stops absurdamente baratos (#216, abr-2026n).

    Regla: si un vuelo con 2+ escalas cuesta < 50% del threshold long-haul
    típico para esa cabina, es candidato a anomalía aunque no entre en el
    threshold absoluto normal (que es para directos o 1 stop).

    Ejemplo: ZRH→DOH→KUL→DPS con Qatar a 220€ economy, mientras el directo
    ZRH→DPS es 950€. La regla absoluta no lo dispara (220 > 200) pero la
    multi-stop sí (220 < 400 = 50% de 800).

    Returns: True si es candidato a anomalía multi-stop.
    """
    if stops < 2:
        return False
    if cabin not in ERROR_FARE_ABSOLUTE_THRESHOLDS:
        return False
    # VVV03 — usar la distance category real del destino en lugar de
    # hardcodear "largo". DPS/NRT/SYD son ultra_largo (€200 economy threshold)
    # mientras que JFK/EWR son largo (€150). Antes se hardcodeaba "largo"
    # → multi-stops a Asia con €220 no disparaban.
    dist_cat = get_distance_category(destination) if destination else "largo"
    threshold = ERROR_FARE_ABSOLUTE_THRESHOLDS[cabin].get(dist_cat)
    if threshold is None:
        # Fallback: si no hay threshold para esa distance, usar largo.
        threshold = ERROR_FARE_ABSOLUTE_THRESHOLDS[cabin].get("largo")
    if threshold is None:
        return False
    # 50% del threshold long-haul + ajuste por cada stop adicional (-10% por
    # stop, máximo -30%) — más stops normalmente = más fricción = aún más
    # barato es necesario para considerarlo anomalía real.
    # VVV03 — base configurable via env MULTI_STOP_ANOMALY_PCT (default 0.50).
    import os as _os
    base_pct = float(_os.environ.get("MULTI_STOP_ANOMALY_PCT", "0.50"))
    extra_stop_discount = min(0.30, 0.10 * (stops - 1))
    multi_stop_threshold = threshold * (base_pct - extra_stop_discount)
    return price < multi_stop_threshold


def get_active_holiday(iso_date: str, region: str) -> str:
    """
    Devuelve el nombre de la festividad activa para `(iso_date, region)`, o
    cadena vacía si no hay. Útil para etiquetar `t0_reason` en el detector.
    """
    if not iso_date or not isinstance(iso_date, str):
        return ""
    iso = iso_date[:10]
    if len(iso) != 10:
        return ""
    r = (region or "").strip().lower()
    for w in HOLIDAY_WINDOWS:
        if w["from"] <= iso <= w["to"]:
            regions = w.get("regions", [])
            match = "*" in regions or any(
                reg.lower() == r or (r and reg.lower() in r) or (r and r in reg.lower())
                for reg in regions
            )
            if match:
                return str(w.get("name", ""))
    return ""

def get_business_economy_ratio_thresholds(destination: str) -> dict:
    """Retorna los umbrales de ratio Business/Economy para un destino."""
    dist = get_distance_category(destination)
    return BUSINESS_ECONOMY_RATIO.get(dist, BUSINESS_ECONOMY_RATIO["largo"])

def classify_ratio(ratio: float, destination: str) -> str:
    """
    Clasifica un ratio Business/Economy.

    Returns: "ERROR", "ANOMALIA", "OFERTA", "NORMAL"
    """
    thresholds = get_business_economy_ratio_thresholds(destination)
    if ratio < thresholds["error"]:
        return "ERROR"
    elif ratio < thresholds["anomalia"]:
        return "ANOMALIA"
    elif ratio < thresholds["oferta"]:
        return "OFERTA"
    return "NORMAL"

def get_report_path(filename: str) -> str:
    """Ruta para archivos de reporte."""
    return os.path.join(REPORT_DIR, filename)

# ==============================================================================
# MODO DE EJECUCIÓN
# ==============================================================================

EXECUTION_MODES = {
    "anywhere":        "Búsqueda abierta a todos los destinos del mundo",
    "business-hunter": "Caza Business class a precio de economy",
    "error-hunter":    "Error fares: precios imposiblemente bajos",
    "matrix":          "Matriz de precios por fecha y origen",
    "monitor":         "Monitorización continua con alertas",
    "custom":          "Rutas y fechas específicas",
}


# SSS46: MEGA_ORIGINS lazy-build después de todas las definiciones
MEGA_ORIGINS = _build_mega_origins()

if __name__ == "__main__":
    print("Flight Hunter V4 — Configuración cargada")
    print(f"✈️  Aeropuertos europeos Tier1: {len(EUROPEAN_AIRPORTS_TIER1)}")
    print(f"✈️  Aeropuertos europeos Tier2: {len(EUROPEAN_AIRPORTS_TIER2)}")
    print(f"✈️  Total aeropuertos europeos: {len(EUROPEAN_AIRPORTS_ALL)}")
    print(f"🌎 MEGA_ORIGINS (TIER1+TIER2+ES+Latam): {len(MEGA_ORIGINS)}")
    print(f"🌍 Destinos long-haul: {len(DEST_ALL_LONG_HAUL)}")
    print(f"🔥 Destinos volátiles prioritarios: {len(DEST_VOLATILES_PRIORITARIOS)}")
    print(f"🤖 Telegram configurado: {bool(TELEGRAM_BOT_TOKEN)}")
    print(f"🔑 Kiwi API: {'✅ CONFIGURADA' if KIWI_API_KEY else '⚠️  SIN CONFIGURAR (registrar en tequila.kiwi.com)'}")
