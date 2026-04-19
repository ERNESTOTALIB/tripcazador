"""
Flight Hunter V4 — Generador de enlaces directos por aerolínea
==============================================================
Genera la URL de reserva TESTADA Y FUNCIONAL para cada aerolínea.

Estrategia (basada en tests HTTP reales):
  Ryanair   → ryanair.com      (200 OK, deep link directo ✅)
  easyJet   → easyjet.com      (200 OK, ruta+fecha precargada ✅)
  Wizz Air  → wizzair.com      (200 OK, formato corregido ✅)
  Vueling   → kayak.es         (Vueling.com redirige sin resultados, Kayak funciona ✅)
  Iberia    → kayak.es         (iberia.com bloquea bots con 403 ✅)
  Air Europa → kayak.es        (fallback universal ✅)
  Resto      → kayak.es        (universal, sin captcha, muestra todas las opciones ✅)

Kayak URL format: https://www.kayak.es/flights/{ORIGIN}-{DEST}/{DATE}?sort=price_a
  - Siempre 200 OK
  - URL limpia y legible
  - Muestra precios de todas las aerolíneas para esa ruta+fecha
  - Filtro de aerolínea disponible si se quiere afinar

Tests realizados el 2026-04-17:
  Ryanair    200 OK (ryanair.com/trip/flights/select?...)
  easyJet    200 OK (easyjet.com/es/vuelos-baratos/...)
  Wizz Air   200 OK (wizzair.com/en-gb/flights/search?...)
  Kayak      200 OK (kayak.es/flights/BSL-BCN/2026-06-08)
  Skyscanner captcha en bot (funciona en navegador, pero menos fiable)
  Iberia     403 Forbidden en todos los formatos
  Vueling    200 pero redirige sin precargar búsqueda
"""

import os
from typing import Optional

# ==============================================================================
# AFILIACIÓN TRAVELPAYOUTS — Configurar TP_MARKER para activar comisiones
# ==============================================================================
# Para activar: registrarse en https://travelpayouts.com → obtener marker (número)
# Luego añadir a .env:  TP_MARKER=tu_numero
# o editar config.py:   TRAVELPAYOUTS_MARKER = "tu_numero"
# Con marker activo: cada reserva genera 2-6% de comisión automáticamente.
# Sin marker: los enlaces siguen funcionando, solo sin comisión.
# ------------------------------------------------------------------------------
try:
    from config import TRAVELPAYOUTS_MARKER as _TP_MARKER_CFG
except Exception:
    _TP_MARKER_CFG = ""

TP_MARKER = os.environ.get("TP_MARKER", _TP_MARKER_CFG or "")

# ── Helpers ───────────────────────────────────────────────────────────────────

def _yymmdd(date_str: str) -> str:
    """YYYY-MM-DD → YYMMDD (para Skyscanner)"""
    if not date_str or len(date_str) < 10:
        return ""
    return date_str[2:4] + date_str[5:7] + date_str[8:10]


# ── Generadores de URL TESTADOS ───────────────────────────────────────────────

def kayak_url(origin: str, destination: str, date_out: str, date_ret: str = "", airline_code: str = "") -> str:
    """
    Kayak — funciona para CUALQUIER aerolínea. URL simple y limpia.
    Testado: 200 OK sin captcha.
    """
    if date_ret:
        url = f"https://www.kayak.es/flights/{origin}-{destination}/{date_out}/{date_ret}?sort=price_a"
    else:
        url = f"https://www.kayak.es/flights/{origin}-{destination}/{date_out}?sort=price_a"
    return url


def ryanair_url(origin: str, destination: str, date_out: str, date_ret: str = "") -> str:
    """
    Ryanair — deep link directo a selección de vuelo.
    Testado: 200 OK, abre directamente el vuelo. ✅
    """
    if date_ret:
        return (
            f"https://www.ryanair.com/es/es/trip/flights/select"
            f"?adults=1&teens=0&children=0&infants=0"
            f"&dateOut={date_out}&dateIn={date_ret}"
            f"&isConnectedFlight=false&isReturn=true"
            f"&originIata={origin}&destinationIata={destination}"
        )
    return (
        f"https://www.ryanair.com/es/es/trip/flights/select"
        f"?adults=1&teens=0&children=0&infants=0"
        f"&dateOut={date_out}&isConnectedFlight=false&isReturn=false"
        f"&originIata={origin}&destinationIata={destination}"
    )


def easyjet_url(origin: str, destination: str, date_out: str, date_ret: str = "") -> str:
    """
    easyJet — abre la búsqueda con ruta y fecha precargadas.
    Testado: 200 OK. ✅
    """
    o = origin.lower()
    d = destination.lower()
    if date_ret:
        return (
            f"https://www.easyjet.com/es/vuelos-baratos/{o}/{d}"
            f"?departDate={date_out}&returnDate={date_ret}&adults=1"
        )
    return (
        f"https://www.easyjet.com/es/vuelos-baratos/{o}/{d}"
        f"?departDate={date_out}&adults=1"
    )


def wizzair_url(origin: str, destination: str, date_out: str, date_ret: str = "") -> str:
    """
    Wizz Air — URL corregida, formato testado que devuelve 200 OK. ✅
    """
    if date_ret:
        return (
            f"https://www.wizzair.com/en-gb/flights/search"
            f"?isRoundTrip=true"
            f"&departureIata={origin}&arrivalIata={destination}"
            f"&departureDate={date_out}&returnDate={date_ret}&adultsCount=1"
        )
    return (
        f"https://www.wizzair.com/en-gb/flights/search"
        f"?isRoundTrip=false"
        f"&departureIata={origin}&arrivalIata={destination}"
        f"&departureDate={date_out}&adultsCount=1"
    )


def skyscanner_url(origin: str, destination: str, date_out: str, date_ret: str = "") -> str:
    """
    Skyscanner — funciona en navegador (captcha solo para bots).
    Usar como alternativa a Kayak si se prefiere.
    """
    o = origin.lower()
    d = destination.lower()
    dd = _yymmdd(date_out)
    if date_ret:
        dr = _yymmdd(date_ret)
        return f"https://www.skyscanner.es/transporte/vuelos/{o}/{d}/{dd}/{dr}/"
    return f"https://www.skyscanner.es/transporte/vuelos/{o}/{d}/{dd}/"


def travelpayouts_url(origin: str, destination: str, date_out: str, date_ret: str = "") -> str:
    """
    Travelpayouts / Aviasales — URL de afiliación con marker.

    Genera un link a Aviasales.es (motor de Travelpayouts) con marker de afiliado.
    Cuando el usuario reserva a través de este link, TripCazador recibe 2-6% de comisión.

    Si TP_MARKER no está configurado, devuelve Kayak como fallback (sin comisión).
    """
    if not TP_MARKER:
        return kayak_url(origin, destination, date_out, date_ret)

    # Aviasales affiliate URL — formato validado por Travelpayouts
    base = "https://www.aviasales.es/search"
    # Formato fecha Aviasales: DDMM (ej: 2026-10-15 → 1510)
    def _avias_date(d: str) -> str:
        if not d or len(d) < 10:
            return ""
        return d[8:10] + d[5:7]

    dep = _avias_date(date_out)
    trip = f"{origin}{dep}{destination}1"  # 1 adulto
    if date_ret:
        ret = _avias_date(date_ret)
        trip += f"{destination}{ret}{origin}1"

    return f"{base}/{trip}?marker={TP_MARKER}&powered_by=true"


# ── Mapa aerolínea → función URL ─────────────────────────────────────────────
# Solo aerolíneas con URLs TESTADAS Y FUNCIONALES.
# Todo lo demás → Kayak (universal).

AIRLINE_URL_BUILDERS = {
    "FR":  ryanair_url,   # Ryanair            ✅ testado
    "RK":  ryanair_url,   # Ryanair UK         → mismo deep link
    "U2":  easyjet_url,   # easyJet            ✅ testado
    "EC":  easyjet_url,   # easyJet Switzerland → mismo formato
    "DS":  easyjet_url,   # easyJet Europe     → mismo formato
    "W6":  wizzair_url,   # Wizz Air           ✅ testado
    "W4":  wizzair_url,   # Wizz Air Malta     ✅ testado
    "W9":  wizzair_url,   # Wizz Air Abu Dhabi → mismo formato
    # Todos los demás → kayak_url (asignado dinámicamente en get_booking_url)
}

# Nombres legibles por código IATA
# Lista ordenada, sin duplicados, ~200+ aerolíneas — cubre Europa, África,
# Asia, Oriente Medio, Norteamérica, Latinoamérica y Oceanía.
AIRLINE_NAMES = {
    # ── LOW-COST EUROPA ─────────────────────────────────────────────────
    "FR":  "Ryanair",
    "RK":  "Ryanair UK",
    "U2":  "easyJet",
    "EC":  "easyJet Switzerland",
    "DS":  "easyJet Europe",
    "W6":  "Wizz Air",
    "W4":  "Wizz Air Malta",
    "W9":  "Wizz Air Abu Dhabi",
    "VY":  "Vueling",
    "VLG": "Vueling",
    "V7":  "Volotea",
    "DY":  "Norwegian",
    "D8":  "Norwegian Air International",
    "EI":  "Aer Lingus",
    "EW":  "Eurowings",
    "LS":  "Jet2",
    "TO":  "Transavia France",
    "HV":  "Transavia",
    "YW":  "Air Nostrum (Iberia Regional)",
    "EN":  "Air Dolomiti",
    "FH":  "Freebird Airlines",
    "H4":  "HiSky",
    "9X":  "Air Corsica",
    "WX":  "CityJet",
    "ZQ":  "Smartwings",
    "NE":  "Nesma Airlines",
    "PQ":  "PAN Air",
    # ── CHÁRTERES EUROPEOS / MEDITERRÁNEO ────────────────────────────────
    "DE":  "Condor",
    "VF":  "Volare / Air VF",
    "MW":  "Enter Air",
    "BJ":  "Nouvelair",
    "5F":  "ASL Airlines",
    "5O":  "ASL Airlines France",
    "LW":  "Latin Air",
    "E6":  "Euro Atlantic Airways",
    "3O":  "Air Arabia Maroc",
    "4X":  "Mediterranean Airlines",
    "X3":  "TUIfly",
    "WK":  "Edelweiss Air",
    "BV":  "Blue Air",
    "XC":  "Corendon Airlines",
    "XR":  "Corendon Airlines Europe",
    "XQ":  "SunExpress",
    # ── FULLSERVICE EUROPA ──────────────────────────────────────────────
    "IB":  "Iberia",
    "I2":  "Iberia Express",
    "UX":  "Air Europa",
    "LH":  "Lufthansa",
    "CL":  "Lufthansa CityLine",
    "LX":  "SWISS",
    "OS":  "Austrian Airlines",
    "SN":  "Brussels Airlines",
    "AF":  "Air France",
    "A5":  "HOP! (Air France regional)",
    "KL":  "KLM",
    "BA":  "British Airways",
    "SK":  "SAS",
    "AZ":  "ITA Airways",
    "TP":  "TAP Air Portugal",
    "LO":  "LOT Polish Airlines",
    "BT":  "airBaltic",
    "JU":  "Air Serbia",
    "LG":  "Luxair",
    "OU":  "Croatia Airlines",
    "KM":  "Air Malta / KM Malta",
    "FI":  "Icelandair",
    "FB":  "Bulgaria Air",
    "JP":  "Adria Airways",
    "RO":  "TAROM",
    "OK":  "Czech Airlines",
    "PC":  "Pegasus Airlines",
    "TK":  "Turkish Airlines",
    "H6":  "Bulgarian Air Charter",
    "S4":  "Azores Airlines",
    # ── ÁFRICA ───────────────────────────────────────────────────────────
    "AH":  "Air Algérie",
    "TU":  "Tunisair",
    "AT":  "Royal Air Maroc",
    "MS":  "EgyptAir",
    "SM":  "Air Cairo",
    "SA":  "South African Airways",
    "ET":  "Ethiopian Airlines",
    "KQ":  "Kenya Airways",
    "WB":  "RwandAir",
    "KP":  "ASKY Airlines",
    "P4":  "Air Peace",                # Nigeria
    "VK":  "Air Nigeria / Dana Air",
    "UR":  "Uganda Airlines",
    "4Z":  "Airlink (Sudáfrica)",
    "MN":  "kulula.com",
    "FA":  "Safair / FlySafair",
    "MD":  "Tsaradia (ex Air Madagascar)",
    "MK":  "Air Mauritius",
    "TM":  "LAM Mozambique",
    "PW":  "Precision Air (Tanzania)",
    "TC":  "Air Tanzania",
    "BP":  "Air Botswana",
    "QC":  "Camair-Co",
    "FN":  "Fastjet",
    "NI":  "Air Sénégal",
    # ── ORIENTE MEDIO ────────────────────────────────────────────────────
    "EK":  "Emirates",
    "QR":  "Qatar Airways",
    "EY":  "Etihad",
    "FZ":  "flydubai",
    "G9":  "Air Arabia",
    "IX":  "Air India Express",
    "XY":  "flynas",
    "SV":  "Saudi Arabian Airlines",
    "F3":  "Flyadeal",
    "GF":  "Gulf Air",
    "WY":  "Oman Air",
    "RJ":  "Royal Jordanian",
    "ME":  "Middle East Airlines",
    "RR":  "Royal Jordanian (alt)",
    # ── SUBCONTINENTE INDIO ──────────────────────────────────────────────
    "AI":  "Air India",
    "UK":  "Vistara",
    "6E":  "IndiGo",
    "SG":  "SpiceJet",
    "QP":  "Akasa Air",
    "I5":  "Air India Express Connect",
    "UL":  "SriLankan Airlines",
    "PK":  "Pakistan Airlines",
    # ── ASIA-PACÍFICO FULLSERVICE ────────────────────────────────────────
    "SQ":  "Singapore Airlines",
    "CX":  "Cathay Pacific",
    "NH":  "ANA",
    "JL":  "JAL",
    "OZ":  "Asiana",
    "KE":  "Korean Air",
    "TG":  "Thai Airways",
    "MH":  "Malaysia Airlines",
    "GA":  "Garuda Indonesia",
    "BR":  "EVA Air",
    "CI":  "China Airlines",
    "CA":  "Air China",
    "MU":  "China Eastern",
    "CZ":  "China Southern",
    "HU":  "Hainan Airlines",
    "MF":  "XiamenAir",
    "HX":  "Hong Kong Airlines",
    "NX":  "Air Macau",
    "VN":  "Vietnam Airlines",
    "PR":  "Philippine Airlines",
    # ── ASIA-PACÍFICO LOW-COST ───────────────────────────────────────────
    "5J":  "Cebu Pacific",
    "AK":  "AirAsia",
    "D7":  "AirAsia X",
    "FD":  "Thai AirAsia",
    "XJ":  "Thai AirAsia X",
    "QZ":  "Indonesia AirAsia",
    "Z2":  "Philippines AirAsia",
    "JT":  "Lion Air",
    "ID":  "Batik Air",
    "JQ":  "Jetstar",
    "3K":  "Jetstar Asia",
    "GK":  "Jetstar Japan",
    "TR":  "Scoot",
    "UO":  "HK Express",
    "K6":  "Cambodia Angkor Air",
    "VJ":  "VietJet Air",
    "7C":  "Jeju Air",
    "LJ":  "Jin Air",
    "TW":  "T'way Air",
    "BX":  "Air Busan",
    "ZE":  "Eastar Jet",
    "9C":  "Spring Airlines",
    "GJ":  "Loong Air",
    "GS":  "Tianjin Airlines",
    "JD":  "Beijing Capital Airlines",
    "MM":  "Peach Aviation",
    "NQ":  "Air Japan",
    # ── NORTEAMÉRICA ─────────────────────────────────────────────────────
    "AA":  "American Airlines",
    "UA":  "United Airlines",
    "DL":  "Delta Air Lines",
    "AC":  "Air Canada",
    "WS":  "WestJet",
    "TS":  "Air Transat",
    "F8":  "Flair Airlines",
    "Y9":  "Lynx Air",
    "B6":  "JetBlue",
    "AS":  "Alaska Airlines",
    "WN":  "Southwest Airlines",
    "F9":  "Frontier Airlines",
    "NK":  "Spirit Airlines",
    "SY":  "Sun Country",
    "G4":  "Allegiant Air",
    "HA":  "Hawaiian Airlines",
    # ── MÉXICO / CENTROAMÉRICA ───────────────────────────────────────────
    "AM":  "Aeroméxico",
    "Y4":  "Volaris",
    "VB":  "Viva (ex Viva Aerobus)",
    "4O":  "Interjet",
    "6D":  "Travel Service México",
    "CM":  "Copa Airlines",
    # ── SUDAMÉRICA ───────────────────────────────────────────────────────
    "LA":  "LATAM",
    "4M":  "LATAM Argentina",
    "XL":  "LATAM Ecuador",
    "LU":  "LATAM Chile Express",
    "H2":  "Sky Airline (Chile)",
    "JA":  "JetSMART",
    "AR":  "Aerolíneas Argentinas",
    "G3":  "GOL",
    "AD":  "Azul",
    "2Z":  "Voepass",
    "AV":  "Avianca",
    "P5":  "Wingo",
    "EQ":  "TAME (Ecuador)",
    "LP":  "LATAM Perú",
    # ── CARIBE ───────────────────────────────────────────────────────────
    "BW":  "Caribbean Airlines",
    "JM":  "Air Jamaica",
    "V0":  "Conviasa",
    "DM":  "Arajet",
    "IB6": "Iberojet",
    # ── OCEANÍA ──────────────────────────────────────────────────────────
    "QF":  "Qantas",
    "VA":  "Virgin Australia",
    "NZ":  "Air New Zealand",
    "FJ":  "Fiji Airways",
    "PX":  "Air Niugini",
    "IE":  "Solomon Airlines",
    "SB":  "Aircalin",
    "VH":  "Aeropost",
}


def get_booking_url(
    airline_code: str,
    origin: str,
    destination: str,
    date_out: str,
    date_ret: str = "",
) -> str:
    """
    Devuelve la URL de reserva funcional para un vuelo.

    Prioridad:
      1. Web directa de la aerolínea (solo si URL testada y funcional)
      2. Travelpayouts / Aviasales con marker de afiliado (si TP_MARKER configurado)
      3. Kayak como fallback universal (sin comisión)

    Para activar comisiones: configurar TP_MARKER en config.py o en .env
    """
    code = airline_code.upper() if airline_code else ""
    builder = AIRLINE_URL_BUILDERS.get(code)
    if builder:
        return builder(origin, destination, date_out, date_ret)
    # Fallback con afiliación (Aviasales/TP si marker configurado, Kayak si no)
    return travelpayouts_url(origin, destination, date_out, date_ret)


def get_airline_name(code: str) -> str:
    """Devuelve el nombre legible de una aerolínea por su código IATA."""
    return AIRLINE_NAMES.get(code.upper() if code else "", code or "?")


# Mapa inverso: nombre → código IATA (para APIs que devuelven nombres, como SerpAPI/Google Flights)
_NAME_TO_CODE: dict = {}

def _build_name_to_code() -> dict:
    """Construye mapa inverso nombre → código IATA."""
    mapping = {}
    for code, name in AIRLINE_NAMES.items():
        # Nombre exacto
        mapping[name.lower()] = code
        # Primer token (ej: "Air France" → "air")
        first = name.split()[0].lower()
        if first not in mapping:
            mapping[first] = code
    # Aliases manuales para nombres que devuelve Google Flights
    extra = {
        "condor":                    "DE",
        "easyjet":                   "U2",
        "ryanair":                   "FR",
        "vueling":                   "VY",
        "wizz air":                  "W6",
        "eurowings":                 "EW",
        "aer lingus":                "EI",
        "jet2":                      "LS",
        "jet2.com":                  "LS",
        "transavia":                 "HV",
        "transavia france":          "TO",
        "air corsica":               "W9",
        "volotea":                   "V7",
        "air nostrum":               "YW",
        "iberia":                    "IB",
        "iberia express":            "I2",
        "air europa":                "UX",
        "lufthansa":                 "LH",
        "lufthansa city airlines":   "LH",
        "swiss":                     "LX",
        "swiss international air lines": "LX",
        "austrian":                  "OS",
        "austrian airlines":         "OS",
        "brussels airlines":         "SN",
        "air france":                "AF",
        "klm":                       "KL",
        "klm royal dutch airlines":  "KL",
        "british airways":           "BA",
        "sas":                       "SK",
        "scandinavian airlines":     "SK",
        "ita":                       "AZ",
        "ita airways":               "AZ",
        "tap air portugal":          "TP",
        "tap":                       "TP",
        "lot polish airlines":       "LO",
        "lot":                       "LO",
        "airbaltic":                 "BT",
        "air baltic":                "BT",
        "air serbia":                "JU",
        "croatia airlines":          "OU",
        "icelandair":                "FI",
        "turkish airlines":          "TK",
        "pegasus":                   "PC",
        "pegasus airlines":          "PC",
        "sunexpress":                "XQ",
        "emirates":                  "EK",
        "qatar airways":             "QR",
        "etihad":                    "EY",
        "etihad airways":            "EY",
        "gulf air":                  "GF",
        "oman air":                  "WY",
        "royal jordanian":           "RJ",
        "egyptair":                  "MS",
        "royal air maroc":           "AT",
        "tunisair":                  "TU",
        "air algerie":               "AH",
        "air algérie":               "AH",
        "air india":                 "AI",
        "eva air":                   "BR",
        "eva":                       "BR",
        "cathay pacific":            "CX",
        "singapore airlines":        "SQ",
        "thai airways":              "TG",
        "malaysia airlines":         "MH",
        "ana":                       "NH",
        "all nippon airways":        "NH",
        "japan airlines":            "JL",
        "jal":                       "JL",
        "korean air":                "KE",
        "asiana":                    "OZ",
        "asiana airlines":           "OZ",
        "hainan airlines":           "HU",
        "hainan":                    "HU",
        "xiamenair":                 "MF",
        "american airlines":         "AA",
        "united airlines":           "UA",
        "united":                    "UA",
        "delta":                     "DL",
        "delta air lines":           "DL",
        "air canada":                "AC",
        "copa airlines":             "CM",
        "copa":                      "CM",
        "latam":                     "LA",
        "avianca":                   "AV",
        "gol":                       "G3",
        "azul":                      "AD",
        "azul brazilian airlines":   "AD",
        "azores airlines":           "S4",
        "south african airways":     "SA",
        "ethiopian airlines":        "ET",
        "ethiopian":                 "ET",
        "kenya airways":             "KQ",
        "enter air":                 "MW",
        "nouvelair":                 "BJ",
        "norwegian":                 "DY",
        "norwegian air":             "DY",
        # ── África nuevos ─────────────────────────────────────────────
        "rwandair":                  "WB",
        "asky":                      "KP",
        "asky airlines":             "KP",
        "air peace":                 "P4",
        "uganda airlines":           "UR",
        "airlink":                   "4Z",
        "flysafair":                 "FA",
        "safair":                    "FA",
        "kulula":                    "MN",
        "kulula.com":                "MN",
        "tsaradia":                  "MD",
        "air madagascar":            "MD",
        "air mauritius":             "MK",
        "lam mozambique":            "TM",
        "lam":                       "TM",
        "precision air":             "PW",
        "air tanzania":              "TC",
        "air botswana":              "BP",
        "camair-co":                 "QC",
        "camair":                    "QC",
        "fastjet":                   "FN",
        "air sénégal":               "NI",
        "air senegal":               "NI",
        # ── Oriente Medio LCC ─────────────────────────────────────────
        "flydubai":                  "FZ",
        "air arabia":                "G9",
        "air arabia maroc":          "3O",
        "flynas":                    "XY",
        "flyadeal":                  "F3",
        "middle east airlines":      "ME",
        "mea":                       "ME",
        "saudia":                    "SV",
        "saudi arabian airlines":    "SV",
        # ── Subcontinente indio ───────────────────────────────────────
        "indigo":                    "6E",
        "spicejet":                  "SG",
        "akasa air":                 "QP",
        "akasa":                     "QP",
        "vistara":                   "UK",
        "air india express":         "IX",
        "srilankan airlines":        "UL",
        "srilankan":                 "UL",
        # ── Asia-Pacífico LCC ─────────────────────────────────────────
        "airasia":                   "AK",
        "air asia":                  "AK",
        "airasia x":                 "D7",
        "thai airasia":              "FD",
        "thai airasia x":            "XJ",
        "indonesia airasia":         "QZ",
        "philippines airasia":       "Z2",
        "lion air":                  "JT",
        "batik air":                 "ID",
        "jetstar":                   "JQ",
        "jetstar asia":              "3K",
        "jetstar japan":             "GK",
        "scoot":                     "TR",
        "hk express":                "UO",
        "hong kong express":         "UO",
        "cambodia angkor air":       "K6",
        "vietjet":                   "VJ",
        "vietjet air":               "VJ",
        "jeju air":                  "7C",
        "jin air":                   "LJ",
        "t'way air":                 "TW",
        "tway air":                  "TW",
        "air busan":                 "BX",
        "eastar jet":                "ZE",
        "spring airlines":           "9C",
        "loong air":                 "GJ",
        "tianjin airlines":          "GS",
        "beijing capital airlines":  "JD",
        "peach aviation":            "MM",
        "peach":                     "MM",
        "philippine airlines":       "PR",
        "pal":                       "PR",
        "garuda indonesia":          "GA",
        "garuda":                    "GA",
        "air macau":                 "NX",
        "china eastern":             "MU",
        "china southern":            "CZ",
        "air china":                 "CA",
        # ── Norteamérica LCC ──────────────────────────────────────────
        "southwest":                 "WN",
        "southwest airlines":        "WN",
        "frontier":                  "F9",
        "frontier airlines":         "F9",
        "spirit":                    "NK",
        "spirit airlines":           "NK",
        "sun country":               "SY",
        "allegiant":                 "G4",
        "allegiant air":             "G4",
        "hawaiian airlines":         "HA",
        "hawaiian":                  "HA",
        "jetblue":                   "B6",
        "alaska airlines":           "AS",
        "alaska":                    "AS",
        "westjet":                   "WS",
        "air transat":               "TS",
        "flair airlines":            "F8",
        "flair":                     "F8",
        "lynx air":                  "Y9",
        # ── México / Centroamérica ────────────────────────────────────
        "aeromexico":                "AM",
        "aeroméxico":                "AM",
        "volaris":                   "Y4",
        "viva":                      "VB",
        "viva aerobus":              "VB",
        "vivaaerobus":               "VB",
        "interjet":                  "4O",
        # ── Sudamérica ────────────────────────────────────────────────
        "latam argentina":           "4M",
        "sky airline":               "H2",
        "sky chile":                 "H2",
        "jetsmart":                  "JA",
        "aerolineas argentinas":     "AR",
        "aerolíneas argentinas":     "AR",
        "wingo":                     "P5",
        "arajet":                    "DM",
        "conviasa":                  "V0",
        "iberojet":                  "IB6",
        # ── Oceanía ───────────────────────────────────────────────────
        "qantas":                    "QF",
        "virgin australia":          "VA",
        "air new zealand":           "NZ",
        "fiji airways":              "FJ",
        "air niugini":               "PX",
        "solomon airlines":          "IE",
        "aircalin":                  "SB",
        # ── Europa extra ──────────────────────────────────────────────
        "tarom":                     "RO",
        "czech airlines":            "OK",
        "csa":                       "OK",
        "bulgaria air":              "FB",
        "edelweiss":                 "WK",
        "edelweiss air":             "WK",
        "tuifly":                    "X3",
        "tui fly":                   "X3",
        "condor":                    "DE",
        "eurowings discover":        "EW",
        "corendon":                  "XC",
        "corendon airlines":         "XC",
        "smartwings":                "ZQ",
        "jet2":                      "LS",
        "jet2.com":                  "LS",
        "ryanair uk":                "RK",
        "easyjet switzerland":       "EC",
        "easyjet europe":            "DS",
        "wizz air malta":            "W4",
        "wizz air abu dhabi":        "W9",
    }
    mapping.update(extra)
    return mapping


def name_to_iata(name: str) -> str:
    """
    Convierte un nombre de aerolínea (como los devuelve SerpAPI/Google Flights)
    al código IATA de 2 letras.
    Devuelve el nombre original si no hay coincidencia.
    """
    global _NAME_TO_CODE
    if not _NAME_TO_CODE:
        _NAME_TO_CODE = _build_name_to_code()
    key = (name or "").strip().lower()
    return _NAME_TO_CODE.get(key, name or "?")


def enrich_flight(flight: dict) -> dict:
    """
    Enriquece un dict de vuelo con:
    - booking_url funcional (web aerolínea o Kayak)
    - airline_name legible
    Modifica in-place y devuelve el dict.
    """
    airline = flight.get("airline", "")
    origin = flight.get("origin", "")
    destination = flight.get("destination", "")
    date_out = flight.get("date_out", "")
    date_ret = flight.get("date_ret", "")

    flight["booking_url"] = get_booking_url(airline, origin, destination, date_out, date_ret)

    if not flight.get("airline_name") or flight["airline_name"] == airline:
        flight["airline_name"] = get_airline_name(airline)

    return flight
