"""
Hotel Deal Hunter — Configuration v4
======================================
Customize your destinations, dates, and detection thresholds.
Now with: error-prone presets, expanded weeks, UA rotation.
"""

# ═══════════════════════════════════════════════════════════════
# DESTINATIONS — Standard packs
# ═══════════════════════════════════════════════════════════════

DESTINATIONS_ITALY_BEACH = {
    "Tropea":           "Tropea",
    "Cefalù":           "Cefalù",
    "Polignano a Mare": "Polignano+a+Mare",
    "Vieste":           "Vieste",
    "Amalfi":           "Amalfi",
    "Positano":         "Positano",
    "Taormina":         "Taormina",
    "Cagliari":         "Cagliari",
    "Alghero":          "Alghero",
    "Rodi Garganico":   "Rodi+Garganico",
    "San Vito Lo Capo": "San+Vito+Lo+Capo",
    "Gallipoli":        "Gallipoli",
}

DESTINATIONS_SPAIN_BEACH = {
    "Marbella":         "Marbella",
    "San Sebastián":    "San+Sebastián",
    "Cádiz":            "Cádiz",
    "Mallorca":         "Mallorca",
    "Ibiza":            "Ibiza",
    "Menorca":          "Menorca",
    "Tenerife":         "Tenerife",
    "Lanzarote":        "Lanzarote",
    "Fuerteventura":    "Fuerteventura",
    "Costa Brava":      "Costa+Brava",
    "Formentera":       "Formentera",
}

DESTINATIONS_GREECE = {
    "Santorini":        "Santorini",
    "Mykonos":          "Mykonos",
    "Creta":            "Creta",
    "Rodas":            "Rodas",
    "Corfú":            "Corfú",
    "Zakynthos":        "Zakynthos",
    "Atenas":           "Atenas",
}

DESTINATIONS_CITIES = {
    "París":            "París",
    "Roma":             "Roma",
    "Londres":          "Londres",
    "Praga":            "Praga",
    "Ámsterdam":        "Ámsterdam",
    "Lisboa":           "Lisboa",
    "Estambul":         "Estambul",
    "Viena":            "Viena",
    "Budapest":         "Budapest",
    "Dubrovnik":        "Dubrovnik",
}

# ═══════════════════════════════════════════════════════════════
# IMPROVEMENT 7: Error-prone destination presets
# Markets with volatile pricing where errors appear most often
# ═══════════════════════════════════════════════════════════════

DESTINATIONS_VOLATILE_ITALY = {
    "Costa Amalfitana": "Amalfi+Coast",
    "Positano":         "Positano",
    "Ravello":          "Ravello",
    "Sorrento":         "Sorrento",
    "Sardinia Costa Smeralda": "Costa+Smeralda",
    "Taormina":         "Taormina",
    "Cefalù":           "Cefalù",
    "Tropea":           "Tropea",
}

DESTINATIONS_VOLATILE_GREECE = {
    "Santorini":        "Santorini",
    "Mykonos":          "Mykonos",
    "Creta":            "Crete",
    "Rodas":            "Rhodes",
    "Corfú":            "Corfu",
    "Zakynthos":        "Zakynthos",
    "Kefalonia":        "Kefalonia",
    "Naxos":            "Naxos",
}

DESTINATIONS_VOLATILE_TURKEY = {
    "Bodrum":           "Bodrum",
    "Antalya":          "Antalya",
    "Fethiye":          "Fethiye",
    "Kas":              "Kas",
    "Alanya":           "Alanya",
    "Side":             "Side",
}

DESTINATIONS_VOLATILE_THAILAND = {
    "Phuket":           "Phuket",
    "Koh Samui":        "Koh+Samui",
    "Krabi":            "Krabi",
    "Koh Lanta":        "Koh+Lanta",
    "Pattaya":          "Pattaya",
}

DESTINATIONS_VOLATILE_BALI = {
    "Bali Seminyak":    "Seminyak",
    "Bali Ubud":        "Ubud",
    "Bali Nusa Dua":    "Nusa+Dua",
    "Bali Kuta":        "Kuta+Bali",
    "Bali Canggu":      "Canggu",
}

DESTINATIONS_VOLATILE_PORTUGAL = {
    "Algarve":          "Algarve",
    "Lagos":            "Lagos+Portugal",
    "Albufeira":        "Albufeira",
    "Faro":             "Faro",
    "Tavira":           "Tavira",
    "Vilamoura":        "Vilamoura",
}

DESTINATIONS_VOLATILE_MEXICO = {
    "Cancún":           "Cancún",
    "Playa del Carmen": "Playa+del+Carmen",
    "Tulum":            "Tulum",
    "Riviera Maya":     "Riviera+Maya",
    "Puerto Vallarta":  "Puerto+Vallarta",
    "Los Cabos":        "Los+Cabos",
}

DESTINATIONS_VOLATILE_MALDIVES = {
    "Maldivas":         "Maldives",
    "Maldivas Malé":    "Malé+Maldives",
    "Maldivas Ari":     "Ari+Atoll+Maldives",
}

DESTINATIONS_VOLATILE_SPAIN = {
    "Costa Brava":      "Costa+Brava",
    "Mallorca":         "Mallorca",
    "Ibiza":            "Ibiza",
    "Menorca":          "Menorca",
    "Tenerife":         "Tenerife",
    "Marbella":         "Marbella",
    "Formentera":       "Formentera",
}

DESTINATIONS_ITALY_REGIONS = {
    # Puglia
    "Polignano a Mare": "Polignano+a+Mare",
    "Ostuni":           "Ostuni",
    "Lecce":            "Lecce",
    "Gallipoli":        "Gallipoli",
    "Vieste":           "Vieste",
    "Rodi Garganico":   "Rodi+Garganico",
    # Sicilia
    "Taormina":         "Taormina",
    "Cefalù":           "Cefalù",
    "San Vito Lo Capo": "San+Vito+Lo+Capo",
    "Siracusa":         "Siracusa",
    "Trapani":          "Trapani",
    # Cerdeña
    "Alghero":          "Alghero",
    "Cagliari":         "Cagliari",
    "Villasimius":      "Villasimius",
    "Stintino":         "Stintino",
    # Costa Amalfitana
    "Amalfi":           "Amalfi",
    "Positano":         "Positano",
    "Sorrento":         "Sorrento",
    "Ravello":          "Ravello",
    # Cinque Terre / Liguria
    "Cinque Terre":     "Cinque+Terre",
    "Monterosso":       "Monterosso+al+Mare",
    "Portofino":        "Portofino",
    # Calabria
    "Tropea":           "Tropea",
    "Pizzo":            "Pizzo+Calabro",
    # Lagos
    "Lago di Garda":    "Lago+di+Garda",
    "Lago di Como":     "Lago+di+Como",
    "Lago Maggiore":    "Lago+Maggiore",
}

# ═══════════════════════════════════════════════════════════════
# MEDITERRANEAN SUMMER 2027 — Albania, Montenegro, Greece, Italy
# ═══════════════════════════════════════════════════════════════

DESTINATIONS_ALBANIA = {
    "Sarandë":          "Sarandë",
    "Ksamil":           "Ksamil",
    "Vlorë":            "Vlorë",
    "Durrës":           "Durrës",
    "Dhërmi":           "Dhërmi",
    "Himara":           "Himara",
}

DESTINATIONS_MONTENEGRO = {
    "Budva":            "Budva",
    "Kotor":            "Kotor",
    "Tivat":            "Tivat",
    "Herceg Novi":      "Herceg+Novi",
    "Sveti Stefan":     "Sveti+Stefan",
    "Bečići":           "Bečići",
    "Petrovac":         "Petrovac",
    "Ulcinj":           "Ulcinj",
}

DESTINATIONS_CROATIA = {
    "Dubrovnik":        "Dubrovnik",
    "Split":            "Split",
    "Hvar":             "Hvar",
    "Zadar":            "Zadar",
    "Makarska":         "Makarska",
    "Brela":            "Brela",
    "Bol":              "Bol",
    "Rovinj":           "Rovinj",
    "Opatija":          "Opatija",
    "Cavtat":           "Cavtat",
    "Korčula":          "Korčula",
    "Trogir":           "Trogir",
}

DESTINATIONS_GREECE_EXTENDED = {
    "Creta":            "Crete",
    "Rodas":            "Rhodes",
    "Corfú":            "Corfu",
    "Zakynthos":        "Zakynthos",
    "Kefalonia":        "Kefalonia",
    "Kos":              "Kos",
    "Halkidiki":        "Halkidiki",
    "Lefkada":          "Lefkada",
    "Thassos":          "Thassos",
    "Parga":            "Parga",
    "Kalamata":         "Kalamata",
}

DESTINATIONS_ITALY_BEACH_EXTENDED = {
    "Tropea":           "Tropea",
    "Cefalù":           "Cefalù",
    "Taormina":         "Taormina",
    "Cagliari":         "Cagliari",
    "Alghero":          "Alghero",
    "Gallipoli":        "Gallipoli",
    "Vieste":           "Vieste",
    "Sorrento":         "Sorrento",
    "Villasimius":      "Villasimius",
    "San Vito Lo Capo": "San+Vito+Lo+Capo",
    "Rimini":           "Rimini",
    "Pesaro":           "Pesaro",
}

DESTINATIONS_MED_SUMMER = {
    **DESTINATIONS_ALBANIA,
    **DESTINATIONS_MONTENEGRO,
    **DESTINATIONS_GREECE_EXTENDED,
    **DESTINATIONS_ITALY_BEACH_EXTENDED,
}

# All volatile/error-prone destinations combined
DESTINATIONS_ERROR_PRONE = {
    **DESTINATIONS_VOLATILE_ITALY,
    **DESTINATIONS_VOLATILE_GREECE,
    **DESTINATIONS_VOLATILE_TURKEY,
    **DESTINATIONS_VOLATILE_PORTUGAL,
    **DESTINATIONS_VOLATILE_MEXICO,
    **DESTINATIONS_VOLATILE_SPAIN,
}

# Quick volatile search (subset for faster testing)
DESTINATIONS_VOLATILE_QUICK = {
    "Costa Amalfitana": "Amalfi+Coast",
    "Santorini":        "Santorini",
    "Bodrum":           "Bodrum",
    "Cancún":           "Cancún",
    "Phuket":           "Phuket",
    "Algarve":          "Algarve",
    "Mallorca":         "Mallorca",
    "Creta":            "Crete",
}

# ═══════════════════════════════════════════════════════════════
# ACTIVE DESTINATIONS — Change this to search different packs
# ═══════════════════════════════════════════════════════════════
ACTIVE_DESTINATIONS = {**DESTINATIONS_ITALY_BEACH, **DESTINATIONS_SPAIN_BEACH}


# ═══════════════════════════════════════════════════════════════
# SEARCH PARAMETERS
# ═══════════════════════════════════════════════════════════════

# Default dates (override via CLI)
DEFAULT_CHECKIN = "2026-08-01"
DEFAULT_CHECKOUT = "2026-08-08"  # 7 nights

# Hotel filters
MIN_STARS = 4                    # Minimum stars (4 or 5) — user requires 4★+
ONLY_HOTELS = True               # Filter out villas, apartments, B&Bs
ADULTS = 2                       # Number of adults

# Results — MASSIVE INCREASE: 150+ hotels per destination
MAX_RESULTS_PER_DESTINATION = 200  # Hotels to analyze per destination (was 30)
CURRENCY = "EUR"

# IMPROVEMENT 1: Multi-page scraping — DEEP SEARCH
PAGES_TO_SCRAPE = 6              # 6 pages × 25 results = ~150 hotels per destination (was 3)
RESULTS_PER_PAGE = 25            # Booking shows 25 per page


# ═══════════════════════════════════════════════════════════════
# DETECTION THRESHOLDS
# ═══════════════════════════════════════════════════════════════

# IMPROVEMENT 6: More weeks for comparison (was 6, now 8)
WEEKS_TO_COMPARE = 8

MIN_HOTEL_SCORE = 7.0

# Ratio thresholds
RATIO_ERROR = 0.40
RATIO_ANOMALY = 0.55
RATIO_DEAL = 0.70

# Z-score thresholds
ZSCORE_ERROR = 2.5
ZSCORE_ANOMALY = 1.8
ZSCORE_DEAL = 1.2

# IMPROVEMENT 6: High season dates (when errors are most common)
HIGH_SEASON_DATES = {
    "summer_peak":  "2027-08-01",   # August peak
    "summer_early": "2027-07-15",   # Mid-July
    "christmas":    "2027-12-20",   # Christmas week
    "new_year":     "2027-12-27",   # New Year's Eve
    "easter_2027":  "2027-04-14",   # Easter 2027
    "easter_2028":  "2028-04-06",   # Easter 2028
}


# ═══════════════════════════════════════════════════════════════
# HOTEL NAME FILTERING
# ═══════════════════════════════════════════════════════════════

EXCLUDE_KEYWORDS = [
    'villa ', 'villas ', 'villetta', 'villaggio',
    'casa ', 'casale', 'casolare', 'home',
    'appartament', 'apartment', 'residence', 'residenza', 'agriresidence',
    'monolocale', 'loft ', 'studio ', 'suite ', 'suites',
    'masseria', 'tenuta', 'agriturismo', 'agriresort', 'fattoria', 'podere',
    'country house', 'farm', 'borgo ',
    'b&b', 'b & b', 'bed and breakfast', 'bed & breakfast',
    'affittacamere', 'locanda', 'pensione', 'albergo diffuso',
    'chalet', 'cottage', 'bungalow', 'dimora', 'palazzo ',
    'relax', 'oasi', 'welcomely', 'room ', 'rooms',
]

HOTEL_CONFIRM = [
    'hotel', 'resort', 'grand hotel', 'palace hotel', 'spa hotel',
    'beach hotel', 'boutique hotel', 'albergo', 'parador',
    'riad', 'riyad', 'ryad', 'dar ', 'kasbah',
    'nh ', 'iberostar', 'meliá', 'marriott', 'hilton', 'hyatt',
    'novotel', 'mercure', 'radisson', 'sheraton', 'westin',
]


# ═══════════════════════════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════════════════════════
DELAY_BETWEEN_SEARCHES = (3, 6)    # Random seconds between requests
REQUEST_TIMEOUT = 30               # Seconds


# ═══════════════════════════════════════════════════════════════
# IMPROVEMENT 8: User-Agent rotation
# ═══════════════════════════════════════════════════════════════

USER_AGENTS = [
    # Chrome Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    # Chrome Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    # Firefox
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:121.0) Gecko/20100101 Firefox/121.0",
    # Safari
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    # Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]

MOBILE_USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
]

# SQLite database path for price history
PRICE_DB_PATH = "/sessions/loving-gifted-cray/mnt/Viajes/hotel_hunter/price_history.db"
