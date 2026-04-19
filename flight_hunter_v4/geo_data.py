"""
Flight Hunter V4 — Datos geográficos por aeropuerto
=====================================================
Mapeo IATA → (ciudad, país, región/continente)
Usado para enriquecer vuelos y habilitar filtros de región/país en el dashboard.
"""

# IATA → (ciudad, país, región)
# Regiones: Europa, Asia, América Norte, América Sur, Caribe, Oriente Medio, África, Oceanía
AIRPORT_GEO = {
    # ── EUROPA ────────────────────────────────────────────────────────
    "MAD": ("Madrid",       "España",          "Europa"),
    "BCN": ("Barcelona",    "España",          "Europa"),
    "VLC": ("Valencia",     "España",          "Europa"),
    "AGP": ("Málaga",       "España",          "Europa"),
    "SVQ": ("Sevilla",      "España",          "Europa"),
    "BIO": ("Bilbao",       "España",          "Europa"),
    "PMI": ("Palma Mallorca","España",         "Europa"),
    "IBZ": ("Ibiza",        "España",          "Europa"),
    "MAH": ("Menorca",      "España",          "Europa"),
    "ACE": ("Lanzarote",    "España",          "Europa"),
    "TFS": ("Tenerife Sur", "España",          "Europa"),
    "TFN": ("Tenerife Norte","España",         "Europa"),
    "LPA": ("Gran Canaria", "España",          "Europa"),
    "FUE": ("Fuerteventura","España",          "Europa"),
    "ALC": ("Alicante",     "España",          "Europa"),
    "SDR": ("Santander",    "España",          "Europa"),
    "VLL": ("Valladolid",   "España",          "Europa"),
    "VGO": ("Vigo",         "España",          "Europa"),
    "SCQ": ("Santiago Compostela","España",    "Europa"),
    "GRO": ("Girona",       "España",          "Europa"),
    "REU": ("Reus",         "España",          "Europa"),
    "LIS": ("Lisboa",       "Portugal",        "Europa"),
    "OPO": ("Oporto",       "Portugal",        "Europa"),
    "FAO": ("Faro",         "Portugal",        "Europa"),
    "CDG": ("París CDG",    "Francia",         "Europa"),
    "ORY": ("París Orly",   "Francia",         "Europa"),
    "BVA": ("París Beauvais","Francia",        "Europa"),
    "LYS": ("Lyon",         "Francia",         "Europa"),
    "MRS": ("Marsella",     "Francia",         "Europa"),
    "NCE": ("Niza",         "Francia",         "Europa"),
    "TLS": ("Toulouse",     "Francia",         "Europa"),
    "BOD": ("Burdeos",      "Francia",         "Europa"),
    "SXB": ("Estrasburgo",  "Francia",         "Europa"),
    "LHR": ("Londres Heathrow","Reino Unido",  "Europa"),
    "LGW": ("Londres Gatwick","Reino Unido",   "Europa"),
    "STN": ("Londres Stansted","Reino Unido",  "Europa"),
    "LTN": ("Londres Luton","Reino Unido",     "Europa"),
    "MAN": ("Manchester",   "Reino Unido",     "Europa"),
    "EDI": ("Edimburgo",    "Reino Unido",     "Europa"),
    "BHX": ("Birmingham",   "Reino Unido",     "Europa"),
    "BRS": ("Bristol",      "Reino Unido",     "Europa"),
    "GLA": ("Glasgow",      "Reino Unido",     "Europa"),
    "FRA": ("Frankfurt",    "Alemania",        "Europa"),
    "MUC": ("Múnich",       "Alemania",        "Europa"),
    "BER": ("Berlín",       "Alemania",        "Europa"),
    "HAM": ("Hamburgo",     "Alemania",        "Europa"),
    "DUS": ("Düsseldorf",   "Alemania",        "Europa"),
    "CGN": ("Colonia",      "Alemania",        "Europa"),
    "STR": ("Stuttgart",    "Alemania",        "Europa"),
    "NUE": ("Nuremberg",    "Alemania",        "Europa"),
    "HAJ": ("Hannover",     "Alemania",        "Europa"),
    "HHN": ("Frankfurt Hahn","Alemania",       "Europa"),
    "FKB": ("Baden-Baden",  "Alemania",        "Europa"),
    "BSL": ("Basilea",      "Suiza/Francia",   "Europa"),
    "ZRH": ("Zúrich",       "Suiza",           "Europa"),
    "GVA": ("Ginebra",      "Suiza",           "Europa"),
    "LUX": ("Luxemburgo",   "Luxemburgo",      "Europa"),
    "AMS": ("Ámsterdam",    "Países Bajos",    "Europa"),
    "EIN": ("Eindhoven",    "Países Bajos",    "Europa"),
    "BRU": ("Bruselas",     "Bélgica",         "Europa"),
    "CRL": ("Bruselas Charleroi","Bélgica",    "Europa"),
    "VIE": ("Viena",        "Austria",         "Europa"),
    "SZG": ("Salzburgo",    "Austria",         "Europa"),
    "MXP": ("Milán Malpensa","Italia",         "Europa"),
    "BGY": ("Milán Bérgamo","Italia",          "Europa"),
    "LIN": ("Milán Linate", "Italia",          "Europa"),
    "FCO": ("Roma Fiumicino","Italia",         "Europa"),
    "CIA": ("Roma Ciampino","Italia",          "Europa"),
    "NAP": ("Nápoles",      "Italia",          "Europa"),
    "VCE": ("Venecia",      "Italia",          "Europa"),
    "BLQ": ("Bolonia",      "Italia",          "Europa"),
    "PSA": ("Pisa",         "Italia",          "Europa"),
    "CTA": ("Catania",      "Italia",          "Europa"),
    "PMO": ("Palermo",      "Italia",          "Europa"),
    "BRI": ("Bari",         "Italia",          "Europa"),
    "CPH": ("Copenhague",   "Dinamarca",       "Europa"),
    "ARN": ("Estocolmo",    "Suecia",          "Europa"),
    "GOT": ("Gotemburgo",   "Suecia",          "Europa"),
    "OSL": ("Oslo",         "Noruega",         "Europa"),
    "BGO": ("Bergen",       "Noruega",         "Europa"),
    "HEL": ("Helsinki",     "Finlandia",       "Europa"),
    "DUB": ("Dublín",       "Irlanda",         "Europa"),
    "ORK": ("Cork",         "Irlanda",         "Europa"),
    "SNN": ("Shannon",      "Irlanda",         "Europa"),
    "WAW": ("Varsovia",     "Polonia",         "Europa"),
    "KRK": ("Cracovia",     "Polonia",         "Europa"),
    "WRO": ("Wroclaw",      "Polonia",         "Europa"),
    "KTW": ("Katowice",     "Polonia",         "Europa"),
    "BUD": ("Budapest",     "Hungría",         "Europa"),
    "PRG": ("Praga",        "Rep. Checa",      "Europa"),
    "BRQ": ("Brno",         "Rep. Checa",      "Europa"),
    "OTP": ("Bucarest",     "Rumanía",         "Europa"),
    "CLJ": ("Cluj-Napoca",  "Rumanía",         "Europa"),
    "SOF": ("Sofía",        "Bulgaria",        "Europa"),
    "VAR": ("Varna",        "Bulgaria",        "Europa"),
    "BEG": ("Belgrado",     "Serbia",          "Europa"),
    "ZAG": ("Zagreb",       "Croacia",         "Europa"),
    "SPU": ("Split",        "Croacia",         "Europa"),
    "DBV": ("Dubrovnik",    "Croacia",         "Europa"),
    "LJU": ("Liubliana",    "Eslovenia",       "Europa"),
    "SKP": ("Skopje",       "Macedonia",       "Europa"),
    "TIA": ("Tirana",       "Albania",         "Europa"),
    "PRN": ("Pristina",     "Kosovo",          "Europa"),
    "RIX": ("Riga",         "Letonia",         "Europa"),
    "TLL": ("Tallin",       "Estonia",         "Europa"),
    "VNO": ("Vilna",        "Lituania",        "Europa"),
    "KBP": ("Kiev",         "Ucrania",         "Europa"),
    "ATH": ("Atenas",       "Grecia",          "Europa"),
    "SKG": ("Tesalónica",   "Grecia",          "Europa"),
    "HER": ("Heraklion",    "Grecia",          "Europa"),
    "RHO": ("Rodas",        "Grecia",          "Europa"),
    "CFU": ("Corfú",        "Grecia",          "Europa"),
    "CHQ": ("Chania",       "Grecia",          "Europa"),
    "ZTH": ("Zante",        "Grecia",          "Europa"),
    "KGS": ("Kos",          "Grecia",          "Europa"),
    "JTR": ("Santorini",    "Grecia",          "Europa"),
    "JMK": ("Mykonos",      "Grecia",          "Europa"),
    "IST": ("Estambul",     "Turquía",         "Europa"),
    "SAW": ("Estambul Sabiha","Turquía",       "Europa"),
    "ESB": ("Ankara",       "Turquía",         "Europa"),
    "ADB": ("Esmirna",      "Turquía",         "Europa"),
    "AYT": ("Antalya",      "Turquía",         "Europa"),
    "DLM": ("Dalaman",      "Turquía",         "Europa"),
    "BJV": ("Bodrum",       "Turquía",         "Europa"),
    "RMO": ("Kishinev",     "Moldavia",        "Europa"),
    "SCV": ("Suceava",      "Rumanía",         "Europa"),
    "BUH": ("Bucarest",     "Rumanía",         "Europa"),
    # Ciudades (Travelpayouts devuelve city codes)
    "LON": ("Londres",      "Reino Unido",     "Europa"),
    "ROM": ("Roma",         "Italia",          "Europa"),
    "MIL": ("Milán",        "Italia",          "Europa"),
    "PAR": ("París",        "Francia",         "Europa"),
    "MOW": ("Moscú",        "Rusia",           "Europa"),
    "LED": ("San Petersburgo","Rusia",         "Europa"),

    # ── ORIENTE MEDIO ──────────────────────────────────────────────────
    "DXB": ("Dubái",        "Emiratos Árabes", "Oriente Medio"),
    "AUH": ("Abu Dabi",     "Emiratos Árabes", "Oriente Medio"),
    "DOH": ("Doha",         "Qatar",           "Oriente Medio"),
    "RUH": ("Riad",         "Arabia Saudí",    "Oriente Medio"),
    "JED": ("Yeda",         "Arabia Saudí",    "Oriente Medio"),
    "KWI": ("Kuwait",       "Kuwait",          "Oriente Medio"),
    "BAH": ("Baréin",       "Baréin",          "Oriente Medio"),
    "MCT": ("Mascate",      "Omán",            "Oriente Medio"),
    "TLV": ("Tel Aviv",     "Israel",          "Oriente Medio"),
    "AMM": ("Ammán",        "Jordania",        "Oriente Medio"),
    "BEY": ("Beirut",       "Líbano",          "Oriente Medio"),

    # ── ASIA ───────────────────────────────────────────────────────────
    "BKK": ("Bangkok",      "Tailandia",       "Asia"),
    "HKT": ("Phuket",       "Tailandia",       "Asia"),
    "CNX": ("Chiang Mai",   "Tailandia",       "Asia"),
    "SIN": ("Singapur",     "Singapur",        "Asia"),
    "KUL": ("Kuala Lumpur", "Malasia",         "Asia"),
    "MNL": ("Manila",       "Filipinas",       "Asia"),
    "CGK": ("Yakarta",      "Indonesia",       "Asia"),
    "DPS": ("Bali",         "Indonesia",       "Asia"),
    "SGN": ("Ho Chi Minh",  "Vietnam",         "Asia"),
    "HAN": ("Hanói",        "Vietnam",         "Asia"),
    "DAD": ("Da Nang",      "Vietnam",         "Asia"),
    "REP": ("Siem Reap",    "Camboya",         "Asia"),
    "PNH": ("Nom Pen",      "Camboya",         "Asia"),
    "RGN": ("Yangón",       "Myanmar",         "Asia"),
    "CMB": ("Colombo",      "Sri Lanka",       "Asia"),
    "DEL": ("Nueva Delhi",  "India",           "Asia"),
    "BOM": ("Bombay",       "India",           "Asia"),
    "BLR": ("Bangalore",    "India",           "Asia"),
    "MAA": ("Chennai",      "India",           "Asia"),
    "GOI": ("Goa",          "India",           "Asia"),
    "CCU": ("Calcuta",      "India",           "Asia"),
    "HYD": ("Hyderabad",    "India",           "Asia"),
    "NRT": ("Tokio Narita", "Japón",           "Asia"),
    "HND": ("Tokio Haneda", "Japón",           "Asia"),
    "KIX": ("Osaka",        "Japón",           "Asia"),
    "CTS": ("Sapporo",      "Japón",           "Asia"),
    "OKA": ("Okinawa",      "Japón",           "Asia"),
    "NGO": ("Nagoya",       "Japón",           "Asia"),
    "ICN": ("Seúl Incheon", "Corea del Sur",   "Asia"),
    "GMP": ("Seúl Gimpo",   "Corea del Sur",   "Asia"),
    "PUS": ("Busan",        "Corea del Sur",   "Asia"),
    "HKG": ("Hong Kong",    "Hong Kong",       "Asia"),
    "TPE": ("Taipéi",       "Taiwán",          "Asia"),
    "PVG": ("Shanghái",     "China",           "Asia"),
    "PEK": ("Pekín",        "China",           "Asia"),
    "CAN": ("Guangzhou",    "China",           "Asia"),
    "CTU": ("Chengdú",      "China",           "Asia"),
    "DAC": ("Daca",         "Bangladesh",      "Asia"),
    "KTM": ("Katmandú",     "Nepal",           "Asia"),
    "MLE": ("Malé",         "Maldivas",        "Asia"),
    "NQZ": ("Astana",       "Kazajistán",      "Asia"),
    "TBS": ("Tiflis",       "Georgia",         "Asia"),
    "EVN": ("Ereván",       "Armenia",         "Asia"),
    "GYD": ("Bakú",         "Azerbaiyán",      "Asia"),
    "ALA": ("Almaty",       "Kazajistán",      "Asia"),
    "TAS": ("Taskent",      "Uzbekistán",      "Asia"),
    "TSE": ("Nur-Sultan",   "Kazajistán",      "Asia"),
    "DMK": ("Bangkok Don Mueang","Tailandia",  "Asia"),
    "USM": ("Koh Samui",    "Tailandia",       "Asia"),
    "KBV": ("Krabi",        "Tailandia",       "Asia"),
    "DLI": ("Dalat",        "Vietnam",         "Asia"),
    "CEB": ("Cebú",         "Filipinas",       "Asia"),
    "KLO": ("Kalibo (Boracay)","Filipinas",    "Asia"),
    "LOP": ("Lombok",       "Indonesia",       "Asia"),
    "SUB": ("Surabaya",     "Indonesia",       "Asia"),
    "PEN": ("Penang",       "Malasia",         "Asia"),
    "BKI": ("Kota Kinabalu","Malasia",         "Asia"),
    "MFM": ("Macao",        "Macao",           "Asia"),
    "XMN": ("Xiamen",       "China",           "Asia"),
    "ULN": ("Ulán Bator",   "Mongolia",        "Asia"),

    # ── ÁFRICA ─────────────────────────────────────────────────────────
    "CMN": ("Casablanca",   "Marruecos",       "África"),
    "RAK": ("Marrakech",    "Marruecos",       "África"),
    "TNG": ("Tánger",       "Marruecos",       "África"),
    "FEZ": ("Fez",          "Marruecos",       "África"),
    "TUN": ("Túnez",        "Túnez",           "África"),
    "ALG": ("Argel",        "Argelia",         "África"),
    "CAI": ("El Cairo",     "Egipto",          "África"),
    "HRG": ("Hurghada",     "Egipto",          "África"),
    "SSH": ("Sharm el Sheij","Egipto",         "África"),
    "JNB": ("Johannesburgo","Sudáfrica",       "África"),
    "CPT": ("Ciudad del Cabo","Sudáfrica",     "África"),
    "DUR": ("Durban",       "Sudáfrica",       "África"),
    "NBO": ("Nairobi",      "Kenia",           "África"),
    "MBA": ("Mombasa",      "Kenia",           "África"),
    "ADD": ("Addis Abeba",  "Etiopía",         "África"),
    "DSS": ("Dakar",        "Senegal",         "África"),
    "LOS": ("Lagos",        "Nigeria",         "África"),
    "ABV": ("Abuja",        "Nigeria",         "África"),
    "ACC": ("Acra",         "Ghana",           "África"),
    "TNR": ("Antananarivo", "Madagascar",      "África"),
    "MRU": ("Mauricio",     "Mauricio",        "África"),
    "RUN": ("La Reunión",   "Francia",         "África"),
    "ZNZ": ("Zanzíbar",     "Tanzania",        "África"),
    "DAR": ("Dar es Salaam","Tanzania",        "África"),
    "KGL": ("Kigali",       "Ruanda",          "África"),
    "EBB": ("Entebbe",      "Uganda",          "África"),
    "JRO": ("Kilimanjaro",  "Tanzania",        "África"),
    "SEZ": ("Mahé",         "Seychelles",      "África"),
    "ASM": ("Asmara",       "Eritrea",         "África"),
    "KRT": ("Jartum",       "Sudán",           "África"),
    "LAD": ("Luanda",       "Angola",          "África"),
    "MPM": ("Maputo",       "Mozambique",      "África"),
    "LUN": ("Lusaka",       "Zambia",          "África"),
    "HRE": ("Harare",       "Zimbabue",        "África"),
    "WDH": ("Windhoek",     "Namibia",         "África"),
    "VFA": ("Victoria Falls","Zimbabue",       "África"),

    # ── OCEANÍA ────────────────────────────────────────────────────────
    "SYD": ("Sídney",       "Australia",       "Oceanía"),
    "MEL": ("Melbourne",    "Australia",       "Oceanía"),
    "BNE": ("Brisbane",     "Australia",       "Oceanía"),
    "PER": ("Perth",        "Australia",       "Oceanía"),
    "ADL": ("Adelaida",     "Australia",       "Oceanía"),
    "AKL": ("Auckland",     "Nueva Zelanda",   "Oceanía"),
    "CHC": ("Christchurch", "Nueva Zelanda",   "Oceanía"),
    "WLG": ("Wellington",   "Nueva Zelanda",   "Oceanía"),
    "NAN": ("Nadi",         "Fiyi",            "Oceanía"),
    "PPT": ("Papeete",      "Polinesia Francesa","Oceanía"),

    # ── AMÉRICA NORTE ──────────────────────────────────────────────────
    "JFK": ("Nueva York JFK","EE.UU.",         "América Norte"),
    "EWR": ("Nueva York EWR","EE.UU.",         "América Norte"),
    "LGA": ("Nueva York LGA","EE.UU.",         "América Norte"),
    "LAX": ("Los Ángeles",  "EE.UU.",          "América Norte"),
    "SFO": ("San Francisco","EE.UU.",          "América Norte"),
    "MIA": ("Miami",        "EE.UU.",          "América Norte"),
    "ORD": ("Chicago",      "EE.UU.",          "América Norte"),
    "BOS": ("Boston",       "EE.UU.",          "América Norte"),
    "ATL": ("Atlanta",      "EE.UU.",          "América Norte"),
    "DFW": ("Dallas",       "EE.UU.",          "América Norte"),
    "IAD": ("Washington",   "EE.UU.",          "América Norte"),
    "DEN": ("Denver",       "EE.UU.",          "América Norte"),
    "SEA": ("Seattle",      "EE.UU.",          "América Norte"),
    "LAS": ("Las Vegas",    "EE.UU.",          "América Norte"),
    "MCO": ("Orlando",      "EE.UU.",          "América Norte"),
    "MSP": ("Minneapolis",  "EE.UU.",          "América Norte"),
    "PHX": ("Phoenix",      "EE.UU.",          "América Norte"),
    "YYZ": ("Toronto",      "Canadá",          "América Norte"),
    "YVR": ("Vancouver",    "Canadá",          "América Norte"),
    "YUL": ("Montreal",     "Canadá",          "América Norte"),
    "YYC": ("Calgary",      "Canadá",          "América Norte"),
    "MEX": ("Ciudad de México","México",       "América Norte"),
    "CUN": ("Cancún",       "México",          "América Norte"),
    "GDL": ("Guadalajara",  "México",          "América Norte"),
    "PVR": ("Puerto Vallarta","México",        "América Norte"),
    "SJD": ("Los Cabos",    "México",          "América Norte"),
    "HUX": ("Huatulco",     "México",          "América Norte"),
    "ZIH": ("Zihuatanejo",  "México",          "América Norte"),
    "GUA": ("Guatemala",    "Guatemala",       "América Norte"),
    "SJO": ("San José",     "Costa Rica",      "América Norte"),
    "PTY": ("Panamá",       "Panamá",          "América Norte"),
    "MGA": ("Managua",      "Nicaragua",       "América Norte"),
    "SAP": ("San Pedro Sula","Honduras",       "América Norte"),

    # ── CARIBE ─────────────────────────────────────────────────────────
    "PUJ": ("Punta Cana",   "Rep. Dominicana", "Caribe"),
    "SDQ": ("Santo Domingo","Rep. Dominicana", "Caribe"),
    "STI": ("Santiago RD",  "Rep. Dominicana", "Caribe"),
    "SJU": ("San Juan",     "Puerto Rico",     "Caribe"),
    "MBJ": ("Montego Bay",  "Jamaica",         "Caribe"),
    "KIN": ("Kingston",     "Jamaica",         "Caribe"),
    "HAV": ("La Habana",    "Cuba",            "Caribe"),
    "CMW": ("Camagüey",     "Cuba",            "Caribe"),
    "HOG": ("Holguín",      "Cuba",            "Caribe"),
    "VRA": ("Varadero",     "Cuba",            "Caribe"),
    "BGI": ("Barbados",     "Barbados",        "Caribe"),
    "AUA": ("Aruba",        "Aruba",           "Caribe"),
    "CUR": ("Curazao",      "Curazao",         "Caribe"),
    "NAS": ("Nassau",       "Bahamas",         "Caribe"),
    "STT": ("St. Thomas",   "USVI",            "Caribe"),
    "UVF": ("Santa Lucía",  "Santa Lucía",     "Caribe"),
    "GCM": ("Gran Caimán",  "Islas Caimán",    "Caribe"),
    "SXM": ("Sint Maarten", "Sint Maarten",    "Caribe"),
    "TAB": ("Tobago",       "Trinidad y Tobago","Caribe"),

    # ── AMÉRICA SUR ────────────────────────────────────────────────────
    "GRU": ("São Paulo",    "Brasil",          "América Sur"),
    "GIG": ("Río de Janeiro","Brasil",         "América Sur"),
    "BSB": ("Brasilia",     "Brasil",          "América Sur"),
    "SSA": ("Salvador",     "Brasil",          "América Sur"),
    "FOR": ("Fortaleza",    "Brasil",          "América Sur"),
    "REC": ("Recife",       "Brasil",          "América Sur"),
    "EZE": ("Buenos Aires", "Argentina",       "América Sur"),
    "AEP": ("Buenos Aires Aeroparque","Argentina","América Sur"),
    "MVD": ("Montevideo",   "Uruguay",         "América Sur"),
    "SCL": ("Santiago",     "Chile",           "América Sur"),
    "LIM": ("Lima",         "Perú",            "América Sur"),
    "BOG": ("Bogotá",       "Colombia",        "América Sur"),
    "MDE": ("Medellín",     "Colombia",        "América Sur"),
    "CTG": ("Cartagena",    "Colombia",        "América Sur"),
    "UIO": ("Quito",        "Ecuador",         "América Sur"),
    "GYE": ("Guayaquil",    "Ecuador",         "América Sur"),
    "ASU": ("Asunción",     "Paraguay",        "América Sur"),
    "LPB": ("La Paz",       "Bolivia",         "América Sur"),
    "CCS": ("Caracas",      "Venezuela",       "América Sur"),
}


# ══════════════════════════════════════════════════════════════════
# COORDENADAS GPS — (latitud, longitud) por código IATA
# Para mapas y cálculo de distancias en el dashboard web
# ══════════════════════════════════════════════════════════════════

AIRPORT_COORDS = {
    # Europa
    "MAD": (40.472, -3.561), "BCN": (41.297, 2.078), "VLC": (39.489, -0.481),
    "AGP": (36.675, -4.499), "SVQ": (37.418, -5.893), "LIS": (38.774, -9.134),
    "CDG": (49.013, 2.550), "ORY": (48.726, 2.365), "LHR": (51.477, -0.461),
    "LGW": (51.157, -0.182), "STN": (51.885, 0.235), "FRA": (50.033, 8.571),
    "MUC": (48.354, 11.786), "BER": (52.367, 13.503), "ZRH": (47.464, 8.549),
    "GVA": (46.238, 6.109), "BSL": (47.590, 7.529), "AMS": (52.309, 4.764),
    "BRU": (50.902, 4.484), "VIE": (48.110, 16.570), "CPH": (55.618, 12.656),
    "ARN": (59.652, 17.919), "OSL": (60.194, 11.100), "HEL": (60.317, 24.963),
    "DUB": (53.421, -6.270), "WAW": (52.166, 20.967), "PRG": (50.101, 14.260),
    "BUD": (47.437, 19.261), "ATH": (37.936, 23.944), "IST": (41.275, 28.752),
    "FCO": (41.800, 12.239), "MXP": (45.631, 8.724), "PMI": (39.551, 2.739),
    "STR": (48.690, 9.222), "FKB": (48.779, 8.080), "MRS": (43.437, 5.215),
    "LYS": (45.726, 5.091), "NCE": (43.660, 7.215), "TFS": (28.045, -16.572),
    "LPA": (27.931, -15.387), "OPO": (41.248, -8.681), "FAO": (37.014, -7.966),
    # África / Medio Oriente
    "CMN": (33.368, -7.590), "RAK": (31.607, -8.036), "CAI": (30.122, 31.406),
    "HRG": (27.179, 33.799), "SSH": (27.977, 34.395), "TUN": (36.851, 10.227),
    "JNB": (-26.134, 28.246), "CPT": (-33.969, 18.602), "NBO": (-1.319, 36.928),
    "MBA": (-4.035, 39.594), "DSS": (14.741, -17.490), "LOS": (6.577, 3.321),
    "MRU": (-20.430, 57.683), "ZNZ": (-6.222, 39.225), "DAR": (-6.878, 39.203),
    "ADD": (8.978, 38.799), "DXB": (25.253, 55.365), "DOH": (25.261, 51.565),
    "AUH": (24.433, 54.651), "TLV": (32.011, 34.887), "AMM": (31.723, 35.993),
    "KGL": (-1.962, 30.135), "EBB": (0.044, 32.443), "JRO": (-3.429, 37.074),
    "SEZ": (-4.674, 55.522), "ASM": (15.292, 38.911), "KRT": (15.590, 32.553),
    "LAD": (-8.858, 13.231), "MPM": (-25.920, 32.573), "LUN": (-15.331, 28.453),
    "HRE": (-17.918, 31.093), "WDH": (-22.480, 17.471), "VFA": (-18.096, 25.839),
    # Asia
    "BKK": (13.681, 100.747), "HKT": (8.113, 98.317), "SIN": (1.350, 103.994),
    "KUL": (2.745, 101.710), "MNL": (14.509, 121.020), "DPS": (-8.748, 115.167),
    "SGN": (10.818, 106.652), "HAN": (21.221, 105.807), "NRT": (35.765, 140.386),
    "HND": (35.549, 139.779), "ICN": (37.463, 126.440), "KIX": (34.427, 135.244),
    "HKG": (22.308, 113.915), "TPE": (25.077, 121.233), "PVG": (31.143, 121.805),
    "PEK": (40.080, 116.584), "DEL": (28.556, 77.100), "BOM": (19.089, 72.868),
    "MLE": (4.192, 73.529), "CMB": (7.180, 79.884), "GOI": (15.381, 73.831),
    "DMK": (13.913, 100.607), "USM": (9.548, 100.062), "KBV": (8.099, 98.988),
    "CEB": (10.308, 123.979), "KLO": (11.679, 122.376), "LOP": (-8.757, 116.277),
    "SUB": (-7.380, 112.787), "PEN": (5.297, 100.277), "BKI": (5.937, 116.051),
    "MFM": (22.149, 113.592), "XMN": (24.544, 118.127), "ULN": (47.843, 106.767),
    "ALA": (43.352, 77.040), "TAS": (41.258, 69.281), "TSE": (51.022, 71.467),
    "DLI": (11.750, 108.367), "HAN": (21.221, 105.807),
    # América
    "JFK": (40.640, -73.779), "EWR": (40.693, -74.168), "LAX": (33.943, -118.408),
    "MIA": (25.796, -80.287), "SFO": (37.619, -122.375), "ORD": (41.978, -87.905),
    "BOS": (42.365, -71.010), "YYZ": (43.677, -79.631), "YVR": (49.195, -123.184),
    "CUN": (21.037, -86.877), "PUJ": (18.567, -68.363), "SDQ": (18.430, -69.669),
    "MEX": (19.436, -99.072), "SJU": (18.440, -66.001), "HAV": (22.989, -82.409),
    "GRU": (-23.432, -46.469), "EZE": (-34.822, -58.536), "BOG": (4.702, -74.146),
    "SCL": (-33.393, -70.786), "LIM": (-12.022, -77.114), "GIG": (-22.810, -43.251),
    # Oceanía
    "SYD": (-33.947, 151.177), "MEL": (-37.669, 144.841), "BNE": (-27.384, 153.117),
    "AKL": (-37.008, 174.792), "PER": (-31.940, 115.967),
}


def get_coords(iata: str):
    """Devuelve (lat, lon) para un aeropuerto, o None si no está en la tabla."""
    return AIRPORT_COORDS.get(iata)


# ══════════════════════════════════════════════════════════════════
# IMÁGENES DE DESTINO — URLs de Unsplash (libres de derechos)
# Para el dashboard web de TripCazador
# ══════════════════════════════════════════════════════════════════

AIRPORT_IMAGES = {
    # Europa
    "MAD": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800",
    "BCN": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    "PMI": "https://images.unsplash.com/photo-1514477917009-389c76a86b68?w=800",
    "LIS": "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=800",
    "CDG": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    "ATH": "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800",
    "IST": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
    "FCO": "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800",
    "ZRH": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800",
    "VIE": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800",
    "TFS": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800",
    "LPA": "https://images.unsplash.com/photo-1565023074671-9e3da1d67c14?w=800",
    # África
    "RAK": "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800",
    "CMN": "https://images.unsplash.com/photo-1548613053-22087dd8edb8?w=800",
    "HRG": "https://images.unsplash.com/photo-1540202403-b7abd6747a18?w=800",
    "SSH": "https://images.unsplash.com/photo-1586861256159-af4e7440d5be?w=800",
    "ZNZ": "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800",
    "DAR": "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800",
    "JNB": "https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=800",
    "CPT": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800",
    "NBO": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800",
    "MRU": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    # Asia
    "BKK": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800",
    "HKT": "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800",
    "SIN": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
    "DPS": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
    "NRT": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    "ICN": "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800",
    "HKG": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800",
    "MLE": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800",
    "GOI": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
    "DEL": "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
    "BOM": "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800",
    # América
    "JFK": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800",
    "LAX": "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=800",
    "MIA": "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=800",
    "CUN": "https://images.unsplash.com/photo-1547970827-46d48f7ecd61?w=800",
    "PUJ": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    "HAV": "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=800",
    "GRU": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
    "EZE": "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800",
    "SCL": "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=800",
    "LIM": "https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800",
    "BOG": "https://images.unsplash.com/photo-1566661032092-8473c96b8553?w=800",
    # Oriente Medio
    "DXB": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
    "DOH": "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800",
    "TLV": "https://images.unsplash.com/photo-1549144511-f099e773c147?w=800",
    # Oceanía
    "SYD": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800",
    "MEL": "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800",
    "AKL": "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800",
}

# Imagen de fallback por región
REGION_FALLBACK_IMAGES = {
    "Europa":        "https://images.unsplash.com/photo-1485081669829-bacb8c7bb1f3?w=800",
    "Asia":          "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800",
    "América Norte": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800",
    "América Sur":   "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
    "Caribe":        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    "Oriente Medio": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
    "África":        "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800",
    "Oceanía":       "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800",
}


def get_image_url(iata: str, region: str = "") -> str:
    """
    Devuelve la URL de imagen para un destino.
    Prioridad: imagen específica del aeropuerto → fallback por región → genérico.
    """
    if iata in AIRPORT_IMAGES:
        return AIRPORT_IMAGES[iata]
    if region in REGION_FALLBACK_IMAGES:
        return REGION_FALLBACK_IMAGES[region]
    return "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800"  # avión genérico


def enrich_geo(flight: dict) -> dict:
    """
    Añade city_to, country_to y region a un vuelo usando el código IATA de destino.
    Solo sobreescribe si está vacío o es igual al código IATA.
    """
    dest = flight.get("destination", "")
    geo = AIRPORT_GEO.get(dest)
    if geo:
        city, country, region = geo
        if not flight.get("city_to") or flight["city_to"] == dest:
            flight["city_to"] = city
        if not flight.get("country_to") or flight["country_to"] == dest:
            flight["country_to"] = country
        flight["region"] = region
    else:
        # Fallback: inferir región por categoría de distancia
        dist = flight.get("distance_category", "")
        if dist == "corto":
            flight["region"] = "Europa"
        elif dist == "medio":
            flight["region"] = "Oriente Medio"
        else:
            flight.setdefault("region", "Internacional")
    return flight


def get_all_regions() -> list:
    """Devuelve todas las regiones disponibles."""
    return ["Europa", "Asia", "América Norte", "América Sur", "Caribe",
            "Oriente Medio", "África", "Oceanía"]


def get_countries_by_region() -> dict:
    """Devuelve un dict {región: [países]} para construir filtros en cascada."""
    from collections import defaultdict
    result = defaultdict(set)
    for _, (_, country, region) in AIRPORT_GEO.items():
        result[region].add(country)
    return {r: sorted(countries) for r, countries in result.items()}
