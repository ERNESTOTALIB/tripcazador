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
from typing import Dict, List, Tuple

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
]

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


if __name__ == "__main__":
    print("Flight Hunter V4 — Configuración cargada")
    print(f"✈️  Aeropuertos europeos Tier1: {len(EUROPEAN_AIRPORTS_TIER1)}")
    print(f"✈️  Aeropuertos europeos Tier2: {len(EUROPEAN_AIRPORTS_TIER2)}")
    print(f"✈️  Total aeropuertos europeos: {len(EUROPEAN_AIRPORTS_ALL)}")
    print(f"🌍 Destinos long-haul: {len(DEST_ALL_LONG_HAUL)}")
    print(f"🔥 Destinos volátiles prioritarios: {len(DEST_VOLATILES_PRIORITARIOS)}")
    print(f"🤖 Telegram configurado: {bool(TELEGRAM_BOT_TOKEN)}")
    print(f"🔑 Kiwi API: {'✅ CONFIGURADA' if KIWI_API_KEY else '⚠️  SIN CONFIGURAR (registrar en tequila.kiwi.com)'}")
