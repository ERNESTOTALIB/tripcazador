"""
Flight Hunter V2 Configuration Module

Centralized configuration for flight search, validation, and price monitoring.
Includes API credentials, airport networks, destination presets, cabin classes,
price thresholds, and rate limiting parameters.
"""

import os
from typing import Dict, List, Tuple, Optional

# ==============================================================================
# API CREDENTIALS
# ==============================================================================

# SerpApi fallback key — only used if SERPAPI_KEY environment variable is not set
SERPAPI_KEY_FALLBACK = "5ce5ee202102e8a97aa02d6c468da75e717a1d369ebd51628d0fb811fcf01ae5"

def get_serpapi_key() -> str:
    """
    Retrieve SerpApi key from environment or use fallback.

    Returns:
        str: SerpApi key from ENV or fallback value
    """
    return os.environ.get("SERPAPI_KEY", SERPAPI_KEY_FALLBACK)

# Store credentials
SERPAPI_KEY = get_serpapi_key()
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
SKYSCANNER_API_KEY = os.environ.get("SKYSCANNER_API_KEY", "")

# Travelpayouts / Aviasales API
# Free tier: 200 req/hour, cached prices (2-7 days)
TRAVELPAYOUTS_TOKEN_FALLBACK = "e49bffbd5b77451d5b807508cca921e4"
TRAVELPAYOUTS_PARTNER_ID = "714734"

def get_travelpayouts_token() -> str:
    """Retrieve Travelpayouts token from environment or fallback."""
    return os.environ.get("TRAVELPAYOUTS_TOKEN", TRAVELPAYOUTS_TOKEN_FALLBACK)

TRAVELPAYOUTS_TOKEN = get_travelpayouts_token()

# Duffel API
# Free for searches, $3/booking (we only search). 300+ airlines, real-time.
DUFFEL_TOKEN_FALLBACK = "duffel_test_C4cyWF05GAWfp4ybDiH-RZi_n9bmvB-ZTXmMdlu_R8g"

def get_duffel_token() -> str:
    """Retrieve Duffel token from environment or fallback."""
    return os.environ.get("DUFFEL_TOKEN", DUFFEL_TOKEN_FALLBACK)

DUFFEL_TOKEN = get_duffel_token()

# ==============================================================================
# EUROPEAN ORIGIN AIRPORTS
# ==============================================================================

EUROPEAN_AIRPORTS_TIER1 = [
    "CDG",  # Paris Charles de Gaulle
    "FRA",  # Frankfurt
    "AMS",  # Amsterdam
    "MAD",  # Madrid
    "BCN",  # Barcelona
    "LHR",  # London Heathrow
    "MXP",  # Milan Malpensa
    "FCO",  # Rome Fiumicino
    "IST",  # Istanbul
    "ZRH",  # Zurich
    "VIE",  # Vienna
    "BRU",  # Brussels
    "LIS",  # Lisbon
    "CPH",  # Copenhagen
    "OSL",  # Oslo
    "ARN",  # Stockholm Arlanda
    "HEL",  # Helsinki
    "DUB",  # Dublin
    "MUC",  # Munich
    "WAW",  # Warsaw
    "PRG",  # Prague
    "BUD",  # Budapest
    "ATH",  # Athens
]

EUROPEAN_AIRPORTS_TIER2 = [
    "PMI",  # Palma de Mallorca
    "AGP",  # Málaga
    "SVQ",  # Seville
    "BIO",  # Bilbao
    "VLC",  # Valencia
    "OPO",  # Porto
    "LYS",  # Lyon
    "MRS",  # Marseille
    "BER",  # Berlin
    "HAM",  # Hamburg
    "DUS",  # Düsseldorf
    "CGN",  # Cologne
    "STR",  # Stuttgart
    "NAP",  # Naples
    "VCE",  # Venice
    "BGY",  # Bergamo (Milan)
    "NCE",  # Nice
    "GVA",  # Geneva
    "EDI",  # Edinburgh
    "MAN",  # Manchester
    "STN",  # London Stansted
    "LGW",  # London Gatwick
    "KRK",  # Krakow
    "OTP",  # Bucharest
    "SOF",  # Sofia
    "BEG",  # Belgrade
    "ZAG",  # Zagreb
    "TLS",  # Toulouse
    "VIE",  # Vienna (also in tier1, kept for completeness)
]

EUROPEAN_AIRPORTS_ALL = list(set(EUROPEAN_AIRPORTS_TIER1 + EUROPEAN_AIRPORTS_TIER2))

# ==============================================================================
# DESTINATION PRESETS
# ==============================================================================

DEST_CARIBBEAN = [
    "PUJ",  # Punta Cana
    "SDQ",  # Santo Domingo
    "CUN",  # Cancún
    "SJU",  # San Juan, Puerto Rico
    "MBJ",  # Montego Bay
    "BGI",  # Bridgetown, Barbados
    "HAV",  # Havana
    "AUA",  # Aruba
    "CUR",  # Curaçao
    "NAS",  # Nassau, Bahamas
]

DEST_MEXICO = [
    "CUN",  # Cancún
    "MEX",  # Mexico City
    "GDL",  # Guadalajara
    "PVR",  # Puerto Vallarta
    "SJD",  # Los Cabos
]

DEST_MALDIVES = [
    "MLE",  # Male
]

DEST_SOUTHEAST_ASIA = [
    "BKK",  # Bangkok
    "SIN",  # Singapore
    "HKG",  # Hong Kong
    "KUL",  # Kuala Lumpur
    "MNL",  # Manila
    "SGN",  # Ho Chi Minh City (Saigon)
    "HAN",  # Hanoi
    "DPS",  # Denpasar (Bali)
]

DEST_JAPAN_KOREA = [
    "NRT",  # Narita, Tokyo
    "HND",  # Haneda, Tokyo
    "ICN",  # Incheon, Seoul
    "KIX",  # Kansai, Osaka
]

DEST_NORTH_AMERICA = [
    "JFK",  # New York
    "LAX",  # Los Angeles
    "MIA",  # Miami
    "SFO",  # San Francisco
    "ORD",  # Chicago
    "YYZ",  # Toronto
    "YVR",  # Vancouver
]

DEST_SOUTH_AMERICA = [
    "GRU",  # São Paulo
    "EZE",  # Buenos Aires
    "BOG",  # Bogotá
    "SCL",  # Santiago
    "LIM",  # Lima
    "GIG",  # Rio de Janeiro
]

DEST_MIDDLE_EAST = [
    "DXB",  # Dubai
    "DOH",  # Doha
    "AUH",  # Abu Dhabi
    "TLV",  # Tel Aviv
    "AMM",  # Amman
    "RUH",  # Riyadh
]

DEST_AFRICA = [
    "JNB",  # Johannesburg
    "CPT",  # Cape Town
    "NBO",  # Nairobi
    "CMN",  # Casablanca
    "CAI",  # Cairo
    "DSS",  # Dakar
    "ADD",  # Addis Ababa
]

DEST_OCEANIA = [
    "SYD",  # Sydney
    "MEL",  # Melbourne
    "AKL",  # Auckland
    "PER",  # Perth
]

DEST_VOLATILE_QUICK = [
    "CUN",  # Cancún - frequent error fares
    "BKK",  # Bangkok - frequent error fares
    "NRT",  # Tokyo - frequent error fares
    "JFK",  # New York - frequent error fares
    "DXB",  # Dubai - frequent error fares
    "MLE",  # Maldives - frequent error fares
    "GRU",  # São Paulo - frequent error fares
]

# Combination of all long-haul destinations
DEST_ALL_LONG_HAUL = list(set(
    DEST_CARIBBEAN + DEST_MEXICO + DEST_MALDIVES + DEST_SOUTHEAST_ASIA +
    DEST_JAPAN_KOREA + DEST_NORTH_AMERICA + DEST_SOUTH_AMERICA +
    DEST_MIDDLE_EAST + DEST_AFRICA + DEST_OCEANIA
))

# ==============================================================================
# CABIN CLASSES
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

# ==============================================================================
# PRICE THRESHOLDS FOR ERROR DETECTION
# ==============================================================================
# Format: {cabin: {distance_category: (threshold_low, threshold_high)}}
# Used to flag suspicious prices (typically < 50-60% of normal range)

PRICE_THRESHOLDS = {
    CABIN_ECONOMY: {
        "short_haul": (50, 150),      # <500km
        "medium": (150, 350),         # 500-2000km
        "long": (300, 600),           # 2000-6000km
        "ultra_long": (400, 800),     # >6000km
    },
    CABIN_PREMIUM_ECONOMY: {
        "short_haul": (100, 250),
        "medium": (300, 700),
        "long": (600, 1200),
        "ultra_long": (800, 1500),
    },
    CABIN_BUSINESS: {
        "short_haul": (200, 500),
        "medium": (600, 1500),
        "long": (900, 2500),
        "ultra_long": (1200, 3500),
    },
    CABIN_FIRST: {
        "short_haul": (400, 1000),
        "medium": (1200, 3000),
        "long": (2000, 5000),
        "ultra_long": (3000, 7000),
    },
}

# ==============================================================================
# ROUTE DISTANCE CATEGORIES
# ==============================================================================

def estimate_distance_by_codes(origin: str, destination: str) -> str:
    """
    Estimate distance category based on airport region pairs.

    Args:
        origin: IATA code of origin airport
        destination: IATA code of destination airport

    Returns:
        str: Distance category ('short_haul', 'medium', 'long', 'ultra_long')
    """
    # Simplified mapping: European to destination distance
    european_short = {"BRU", "CDG", "AMS", "FRA", "LHR", "ZRH"}
    european_medium = {"MUC", "VIE", "ATH", "IST"}
    european_long = {"DUB", "LIS", "BUD"}

    caribbean_africa = {"PUJ", "SDQ", "CUN", "JNB", "CPT", "CMN", "CAI"}
    asia = {"BKK", "SIN", "HKG", "KUL", "NRT", "HND", "ICN"}
    americas = {"JFK", "LAX", "MIA", "GRU", "EZE"}

    # Check origin
    if origin in european_short and destination in {"PMI", "AGP", "VLC"}:
        return "short_haul"
    elif origin in european_long and destination in caribbean_africa:
        return "ultra_long"
    elif origin in EUROPEAN_AIRPORTS_ALL and destination in asia:
        return "ultra_long"
    elif origin in EUROPEAN_AIRPORTS_ALL and destination in americas:
        return "long"

    return "medium"  # Default to medium

# ==============================================================================
# HIGH SEASON DATES
# ==============================================================================

HIGH_SEASON_DATES = {
    "summer_peak": {
        "name": "Summer Peak",
        "start": "2026-06-15",
        "end": "2026-08-31",
    },
    "christmas": {
        "name": "Christmas Holiday",
        "start": "2026-12-18",
        "end": "2026-12-26",
    },
    "new_year": {
        "name": "New Year",
        "start": "2026-12-27",
        "end": "2027-01-07",
    },
    "easter_2027": {
        "name": "Easter 2027",
        "start": "2027-04-09",
        "end": "2027-04-20",
    },
    "easter_2028": {
        "name": "Easter 2028",
        "start": "2028-03-31",
        "end": "2028-04-11",
    },
    "golden_week": {
        "name": "Golden Week (Japan)",
        "start": "2027-04-29",
        "end": "2027-05-09",
    },
}

# ==============================================================================
# SEARCH PARAMETERS
# ==============================================================================

DEFAULT_CABIN = CABIN_ECONOMY
DEFAULT_ADULTS = 1
SEARCH_FLEXIBILITY_DAYS = 3
WEEKS_TO_COMPARE = 4
CURRENCY = "EUR"

# ==============================================================================
# RATE LIMITING & TIMEOUT
# ==============================================================================

DELAY_BETWEEN_SEARCHES = (2, 5)  # Random delay in seconds
REQUEST_TIMEOUT = 45  # Seconds
SERPAPI_MONTHLY_BUDGET = 90  # Reserve 10 for manual use; total 100

# ==============================================================================
# USER AGENT ROTATION
# ==============================================================================

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
]

# ==============================================================================
# DATABASE & PATHS
# ==============================================================================

# SQLite database for price history
# Try session directory first, then fall back to script directory
_SESSION_DIR = "/sessions/peaceful-sharp-mccarthy"
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Determine best location for database: prefer session dir if available, fall back to script dir
if os.path.isdir(_SESSION_DIR) and os.access(_SESSION_DIR, os.W_OK):
    PRICE_DB_PATH = os.path.join(_SESSION_DIR, "flight_price_history.db")
else:
    PRICE_DB_PATH = os.path.join(_SCRIPT_DIR, "flight_price_history.db")

# Report directory (parent of config location)
REPORT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    ".."
)

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def get_cabin_name(cabin_code: int) -> str:
    """
    Get human-readable cabin name.

    Args:
        cabin_code: Numeric cabin class code (1-4)

    Returns:
        str: Cabin name or 'Unknown' if invalid code
    """
    return CABIN_NAMES.get(cabin_code, "Unknown")

def is_error_fare(price: float, cabin: int, distance_category: str) -> bool:
    """
    Check if a price appears to be an error fare based on thresholds.

    Error fares are typically priced below 50-60% of normal range.

    Args:
        price: Price in euros
        cabin: Cabin class code (1-4)
        distance_category: Distance category ('short_haul', 'medium', 'long', 'ultra_long')

    Returns:
        bool: True if price falls below error fare threshold
    """
    if cabin not in PRICE_THRESHOLDS:
        return False
    if distance_category not in PRICE_THRESHOLDS[cabin]:
        return False

    threshold_low, _ = PRICE_THRESHOLDS[cabin][distance_category]
    return price < (threshold_low * 0.6)

def get_report_path(filename: str) -> str:
    """
    Get absolute path for report files.

    Args:
        filename: Name of the report file

    Returns:
        str: Absolute path to report file
    """
    return os.path.join(REPORT_DIR, filename)

def validate_airport_code(code: str) -> bool:
    """
    Basic validation for IATA airport codes.

    Args:
        code: Potential IATA code

    Returns:
        bool: True if code appears valid (3 uppercase letters)
    """
    return isinstance(code, str) and len(code) == 3 and code.isupper()

# ==============================================================================
# MODULE INITIALIZATION
# ==============================================================================

if __name__ == "__main__":
    # Quick validation on import
    print("Flight Hunter V2 Configuration Loaded")
    print(f"SerpApi Key available: {bool(SERPAPI_KEY)}")
    print(f"European airports (Tier 1): {len(EUROPEAN_AIRPORTS_TIER1)}")
    print(f"European airports (Tier 2): {len(EUROPEAN_AIRPORTS_TIER2)}")
    print(f"Total destination presets: {len(set(DEST_ALL_LONG_HAUL))}")
    print(f"Price DB path: {PRICE_DB_PATH}")
    print(f"Report directory: {REPORT_DIR}")
