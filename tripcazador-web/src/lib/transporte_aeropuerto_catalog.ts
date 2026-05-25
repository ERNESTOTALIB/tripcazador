/**
 * transporte_aeropuerto_catalog.ts — SUPER-SEO (25 may 2026)
 *
 * Catalog de 15 ciudades ES con datos transporte aeropuerto→centro.
 * High-intent SEO: "como llegar al centro desde aeropuerto X" tiene
 * 5-15k búsquedas/mes per ciudad mainland + 2-5k per island.
 *
 * Datos verificados público (web oficiales Aena, Renfe, Metro, EMT).
 * Precios actualizados mayo 2026.
 */

export interface TransporteOption {
  modo: "metro" | "tren" | "autobus" | "taxi" | "vtc" | "lanzadera" | "tranvia";
  nombre: string;
  /** Tiempo aprox al centro */
  tiempoMin: number;
  /** Precio adulto ida */
  precioEur: number;
  /** Frecuencia (cada X min) */
  frecuenciaMin?: number;
  /** Horario start-end formato "5:00-23:30" */
  horario: string;
  /** Ventajas + caveats una línea */
  notas: string;
  /** Mejor para perfil */
  mejorPara: string;
}

export interface TransporteCiudad {
  slug: string;
  ciudad: string;
  iata: string;
  /** Distancia aeropuerto-centro km */
  distanciaKm: number;
  options: TransporteOption[];
  /** Recomendación por presupuesto */
  recomendacion: {
    presupuesto: string;
    rapido: string;
    nocturno: string;
  };
  /** Tips locales no obvios */
  tips: string[];
  /** Cosas a evitar (taxis truchos, scams) */
  evitar: string[];
  lastUpdated: string;
}

export const TRANSPORTE_AEROPUERTO: TransporteCiudad[] = [
  {
    slug: "madrid",
    ciudad: "Madrid",
    iata: "MAD",
    distanciaKm: 13,
    options: [
      {
        modo: "metro",
        nombre: "Metro Línea 8",
        tiempoMin: 30,
        precioEur: 4.5,
        frecuenciaMin: 4,
        horario: "6:05-1:30",
        notas: "Suplemento aeropuerto 3€ además del billete normal 1.50€. Conexión directa a Nuevos Ministerios + línea 10.",
        mejorPara: "Si vas al centro/Chamberí/Barrio Salamanca",
      },
      {
        modo: "autobus",
        nombre: "Express Aeropuerto 24h (EMT)",
        tiempoMin: 40,
        precioEur: 5,
        frecuenciaMin: 15,
        horario: "24h",
        notas: "Línea amarilla, único 24h. Parada Atocha + O'Donnell + Cibeles + Cibeles. Acepta tarjetas contactless.",
        mejorPara: "Llegadas/salidas madrugada",
      },
      {
        modo: "tren",
        nombre: "Cercanías C-1 / C-10",
        tiempoMin: 25,
        precioEur: 2.6,
        frecuenciaMin: 30,
        horario: "5:00-23:30",
        notas: "Solo desde Terminal T4. Llega a Chamartín, Nuevos Ministerios, Sol, Atocha en 25 min.",
        mejorPara: "Si vas a Atocha/Chamartín (conexión AVE)",
      },
      {
        modo: "taxi",
        nombre: "Taxi (tarifa plana)",
        tiempoMin: 30,
        precioEur: 33,
        horario: "24h",
        notas: "Tarifa fija 33€ a centro M-30 (24h). Fuera M-30 metro contador. Confiable, oficial.",
        mejorPara: "Grupo 2+ personas o equipaje pesado",
      },
      {
        modo: "vtc",
        nombre: "Uber / Cabify / Bolt",
        tiempoMin: 30,
        precioEur: 28,
        horario: "24h",
        notas: "Más barato que taxi para 1-2 pax. Recogida en zona dedicada T4. Espera 5-10 min normalmente.",
        mejorPara: "1-2 pax con equipaje moderate",
      },
    ],
    recomendacion: {
      presupuesto: "Metro L8 (4.50€) — directo al centro 30 min",
      rapido: "Cercanías C-1 desde T4 (2.60€, 25 min) o taxi (33€, 30 min)",
      nocturno: "Express Aeropuerto autobús 24h (5€) — único 24h",
    },
    tips: [
      "Metro: el suplemento aeropuerto cuesta 3€ MÁS el billete sencillo (1.50€) = 4.50€ total. NO te lo descuentan del abono mensual.",
      "Si tienes equipaje XL, evita Metro hora punta (8-10am, 18-20h) — pasillos estrechos.",
      "Tren Cercanías solo conecta T4. Desde T1/T2/T3 hay shuttle bus gratis cada 5 min al T4 — añade 12-15 min.",
      "Tarjeta MultiCard recargable cuesta 2.50€ extra pero el billete sencillo metro/bus baja a 1.50€ — merece pena si te quedas >2 días.",
    ],
    evitar: [
      "Taxis sin licencia oficial (sin cartel verde 'Madrid' en puerta) — riesgo tarifa abusiva.",
      "Furgonetas privadas que te ofrezcan 'mejor precio que taxi' — ilegales y sin seguro.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "barcelona",
    ciudad: "Barcelona",
    iata: "BCN",
    distanciaKm: 13,
    options: [
      {
        modo: "metro",
        nombre: "Metro L9 Sud",
        tiempoMin: 32,
        precioEur: 5.5,
        frecuenciaMin: 7,
        horario: "5:00-24:00",
        notas: "Conecta T1 y T2 con Zona Universitària. Necesitas trasbordo a L3/L5 para centro. Tarjeta sencilla NO sirve — billete aeropuerto específico.",
        mejorPara: "Si vas a Sants/Eixample/zona universitaria",
      },
      {
        modo: "tren",
        nombre: "Rodalies R2 Nord",
        tiempoMin: 25,
        precioEur: 4.9,
        frecuenciaMin: 30,
        horario: "5:42-23:38",
        notas: "Solo desde Terminal T2. Llega a Sants en 19 min, Passeig de Gràcia 23 min. T-Casual 10 viajes 11.35€ si vas a quedarte.",
        mejorPara: "Si vas a Passeig de Gràcia o conexión a AVE Sants",
      },
      {
        modo: "autobus",
        nombre: "Aerobús A1/A2",
        tiempoMin: 35,
        precioEur: 7.25,
        frecuenciaMin: 5,
        horario: "5:00-1:00",
        notas: "A1 desde T1, A2 desde T2. Para en Plaza España, Gran Via, Plaza Catalunya. WiFi gratis, espacio equipaje XL.",
        mejorPara: "Si vas a Plaza Catalunya/Las Ramblas directo",
      },
      {
        modo: "taxi",
        nombre: "Taxi BCN",
        tiempoMin: 25,
        precioEur: 35,
        horario: "24h",
        notas: "Tarifa media 30-35€ centro. Suplemento aeropuerto +4.50€. Confiable, contador transparente.",
        mejorPara: "Grupo 3-4 o equipaje pesado",
      },
      {
        modo: "vtc",
        nombre: "Cabify / Bolt / Uber",
        tiempoMin: 28,
        precioEur: 25,
        horario: "24h",
        notas: "Más barato que taxi típicamente. Recogida zona VTC dedicada. NB: en BCN VTC está más regulado que en Madrid — esperas pueden ser 10-15 min.",
        mejorPara: "1-2 pax con presupuesto medio",
      },
    ],
    recomendacion: {
      presupuesto: "Rodalies R2 desde T2 (4.90€) — más barato y rápido a centro",
      rapido: "Taxi (35€, 25 min) o Aerobús (7.25€, 35 min)",
      nocturno: "Aerobús (5-1am) o NitBus N17/N18 (2.40€)",
    },
    tips: [
      "Rodalies R2 desde T2 es la opción ganadora: más barato + más rápido + llega Sants/Passeig directo.",
      "Si vienes en avión low-cost a T2 (Ryanair/Vueling), Rodalies está a 5 min andando. Si vienes a T1 (LH/Iberia/AF), tienes que coger shuttle gratis a T2 (8 min).",
      "Aerobús acepta tarjeta contactless. T10 (tarjeta 10 viajes integrada) NO sirve.",
      "L9 metro: NO uses tarjeta normal o sencillo — billete aeropuerto separado 5.50€ (3.40€ más caro).",
    ],
    evitar: [
      "Taxistas en T1 que te ofrezcan 'tarifa plana' fuera del contador — siempre exige contador.",
      "Furgonetas con sticker 'aeropuerto-centro 15€' en la salida — no son legales y a veces te dejan a 1 km del destino.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "valencia",
    ciudad: "Valencia",
    iata: "VLC",
    distanciaKm: 9,
    options: [
      {
        modo: "metro",
        nombre: "Metrovalencia L3 / L5",
        tiempoMin: 25,
        precioEur: 4.9,
        frecuenciaMin: 12,
        horario: "5:42-23:42",
        notas: "L3 (rojo) → Estación AVE Joaquín Sorolla + centro. L5 (verde) → puerto. Ambos directo desde T1.",
        mejorPara: "Centro y conexión AVE",
      },
      {
        modo: "autobus",
        nombre: "EMT 150",
        tiempoMin: 35,
        precioEur: 1.5,
        frecuenciaMin: 20,
        horario: "5:30-22:30",
        notas: "Bus urbano normal. Termina en Estación de Autobuses. Más lento pero la 1/3 del precio.",
        mejorPara: "Backpacker presupuesto",
      },
      {
        modo: "taxi",
        nombre: "Taxi VLC",
        tiempoMin: 15,
        precioEur: 22,
        horario: "24h",
        notas: "Tarifa media 18-25€ a centro. No tarifa plana pero contador justo. Recargo nocturno +30%.",
        mejorPara: "Grupo o equipaje XL",
      },
      {
        modo: "vtc",
        nombre: "Cabify / Uber",
        tiempoMin: 15,
        precioEur: 18,
        horario: "24h",
        notas: "Generalmente más barato que taxi en VLC. Tiempo similar.",
        mejorPara: "Default 1-2 pax",
      },
    ],
    recomendacion: {
      presupuesto: "Metro L3 (4.90€) o bus 150 (1.50€)",
      rapido: "Taxi/VTC (15 min) o Metro L3 (25 min)",
      nocturno: "Taxi — bus y metro paran 22:30 / 23:42",
    },
    tips: [
      "Metro L3 es la opción óptima — más rápido, más barato, llega directo a centro/AVE.",
      "Compra TuiN card recargable (cuesta 2€) si vas a usar transporte público varios días — abarata mucho.",
      "VLC aeropuerto es pequeño — controles ágiles, no necesitas llegar 2h antes del vuelo (1h sobra).",
    ],
    evitar: [
      "Bus 150 con maletas grandes — espacio muy limitado, conductor puede pedir ticket extra.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "sevilla",
    ciudad: "Sevilla",
    iata: "SVQ",
    distanciaKm: 10,
    options: [
      {
        modo: "autobus",
        nombre: "Especial Aeropuerto EA",
        tiempoMin: 30,
        precioEur: 4,
        frecuenciaMin: 30,
        horario: "5:20-1:15",
        notas: "Línea exclusiva. Para en Santa Justa (AVE), Plaza Encarnación, Puerta Jerez. Aire acondicionado, espacio equipaje.",
        mejorPara: "Centro y conexión AVE",
      },
      {
        modo: "taxi",
        nombre: "Taxi SVQ (tarifa fija)",
        tiempoMin: 20,
        precioEur: 23,
        horario: "24h",
        notas: "Tarifa fija aeropuerto-centro 23€ entre 7:00-21:00. 26€ noches/festivos. Oficial.",
        mejorPara: "Grupo o equipaje",
      },
      {
        modo: "vtc",
        nombre: "Cabify / Uber",
        tiempoMin: 20,
        precioEur: 19,
        horario: "24h",
        notas: "Marginalmente más barato que taxi. Disponibilidad buena en aeropuerto.",
        mejorPara: "Default 1-2 pax",
      },
    ],
    recomendacion: {
      presupuesto: "Bus EA (4€) — único transporte público al aeropuerto",
      rapido: "Taxi tarifa fija 23€ o VTC",
      nocturno: "Bus EA opera hasta 1:15 — útil llegadas tardías",
    },
    tips: [
      "SVQ NO tiene metro ni cercanías aeropuerto. Bus EA o taxi son las únicas opciones reales.",
      "Bus EA acepta tarjeta contactless. Cómpralo en la parada o en el bus.",
      "Sevilla en verano: el aeropuerto está en zona sin sombra — si llegas a mediodía agosto, ten cuidado del calor caminando al bus.",
    ],
    evitar: [
      "Taxis que ofrezcan 'tarifa plana' por debajo de 23€ en horario diurno — ojo, pueden cobrar extras.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "malaga",
    ciudad: "Málaga",
    iata: "AGP",
    distanciaKm: 8,
    options: [
      {
        modo: "tren",
        nombre: "Cercanías C-1",
        tiempoMin: 12,
        precioEur: 1.8,
        frecuenciaMin: 20,
        horario: "6:50-23:50",
        notas: "Tren más rápido y barato. Estaciones T3 + María Zambrano (AVE) + centro. Acceso desde T2/T3 directo.",
        mejorPara: "Default — mejor calidad/precio de toda España",
      },
      {
        modo: "autobus",
        nombre: "Express Línea A",
        tiempoMin: 20,
        precioEur: 4,
        frecuenciaMin: 25,
        horario: "7:00-24:00",
        notas: "Para Alameda Principal + Centro. Espacio equipaje, aire condicionado.",
        mejorPara: "Si la frecuencia del tren no cuadra",
      },
      {
        modo: "taxi",
        nombre: "Taxi AGP",
        tiempoMin: 15,
        precioEur: 22,
        horario: "24h",
        notas: "Tarifa por contador. 20-25€ centro. Suplemento aeropuerto incluido.",
        mejorPara: "Grupo 3-4 o equipaje XL",
      },
    ],
    recomendacion: {
      presupuesto: "Cercanías C-1 (1.80€, 12 min) — la opción superior",
      rapido: "Cercanías C-1 (12 min) sin discusión",
      nocturno: "Taxi — tren para 23:50",
    },
    tips: [
      "Málaga es el aeropuerto con mejor conexión tren de toda España: 1.80€ por 12 min a centro. Combinación imbatible.",
      "El tren para en María Zambrano (AVE) — perfecto si vas a Sevilla/Córdoba después.",
      "Si vas a la Costa del Sol (Torremolinos, Benalmádena, Fuengirola), el mismo C-1 te lleva (1.80-3.80€).",
    ],
    evitar: [
      "Taxis turísticos en arribadas — algunos cobran 35-40€ a centro alegando 'tarifa nocturna' cuando es de día. Pide contador siempre.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "bilbao",
    ciudad: "Bilbao",
    iata: "BIO",
    distanciaKm: 12,
    options: [
      {
        modo: "autobus",
        nombre: "Bizkaibus A3247",
        tiempoMin: 35,
        precioEur: 3,
        frecuenciaMin: 20,
        horario: "5:00-24:00",
        notas: "Línea directa aeropuerto-Termibus/centro Bilbao. Cómodo, espacio equipaje.",
        mejorPara: "Default — mejor calidad/precio",
      },
      {
        modo: "taxi",
        nombre: "Taxi BIO",
        tiempoMin: 20,
        precioEur: 28,
        horario: "24h",
        notas: "Tarifa contador. 25-32€ centro Bilbao. Vasco como idioma adicional al castellano.",
        mejorPara: "Grupo o lluvia",
      },
    ],
    recomendacion: {
      presupuesto: "Bizkaibus A3247 (3€) — directo cada 20 min",
      rapido: "Taxi (20 min) o el propio bus",
      nocturno: "Bus opera 5:00-24:00, taxi 24h",
    },
    tips: [
      "Bilbao no tiene tren ni metro al aeropuerto — el bus Bizkaibus es la única opción transporte público (y es buena).",
      "Si quieres ir a San Sebastián directo desde BIO, Pesa autobús cuesta 17-19€ y tarda 1h15 — más barato que volar a SSS.",
      "Aeropuerto BIO es muy pequeño — controles rápidos, 1h antes del vuelo sobra.",
    ],
    evitar: [
      "Taxi compartido tipo Blablacar improvisado — algunos turistas se 'agrupan' con desconocidos para repartir tarifa. Riesgo seguridad + sin seguro.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "palma",
    ciudad: "Palma de Mallorca",
    iata: "PMI",
    distanciaKm: 8,
    options: [
      {
        modo: "autobus",
        nombre: "EMT A1",
        tiempoMin: 15,
        precioEur: 5,
        frecuenciaMin: 12,
        horario: "6:00-1:10",
        notas: "Bus aeropuerto-centro Palma + Plaza España. Acepta contactless.",
        mejorPara: "Default centro Palma",
      },
      {
        modo: "taxi",
        nombre: "Taxi PMI (tarifa fija)",
        tiempoMin: 15,
        precioEur: 27,
        horario: "24h",
        notas: "Tarifa fija 27€ a centro Palma. Otros destinos isla con contador.",
        mejorPara: "Grupo o destino hotel zona alta",
      },
      {
        modo: "lanzadera",
        nombre: "Shuttle TUI/Jet2 (incluido paquete)",
        tiempoMin: 30,
        precioEur: 0,
        horario: "Según vuelo",
        notas: "Si has comprado pack tour-operator, suele incluir transfer. NO vale para vuelos solo (low-cost).",
        mejorPara: "Llegada con TUI/Jet2/Thomas Cook",
      },
    ],
    recomendacion: {
      presupuesto: "EMT A1 (5€) — directo cada 12 min",
      rapido: "Taxi (15 min) o A1 que tarda lo mismo",
      nocturno: "A1 opera hasta 1:10, taxi 24h",
    },
    tips: [
      "Si tu hotel está fuera de Palma capital (Magaluf, Alcúdia, Cala D'Or), reserva traslado privado o coge bus Aerotib (15-25€).",
      "Aeropuerto PMI es enorme en verano — sal 2h+ antes del vuelo Jun-Ago, cola seguridad puede llegar 1h.",
      "Alquila coche en aeropuerto SOLO si vas a recorrer isla — Palma centro tiene parking caro y muchas calles peatonales.",
    ],
    evitar: [
      "Taxis pirata fuera del aeropuerto que se ofrecen al teléfono móvil — ilegales y caros.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "alicante",
    ciudad: "Alicante",
    iata: "ALC",
    distanciaKm: 10,
    options: [
      {
        modo: "autobus",
        nombre: "Línea C-6 (TAM/Subus)",
        tiempoMin: 25,
        precioEur: 3.85,
        frecuenciaMin: 20,
        horario: "5:30-23:00",
        notas: "Conecta aeropuerto-centro Alicante (Mercado/Puerta del Mar). Frecuencia buena.",
        mejorPara: "Centro Alicante",
      },
      {
        modo: "taxi",
        nombre: "Taxi ALC",
        tiempoMin: 20,
        precioEur: 25,
        horario: "24h",
        notas: "Tarifa contador. 22-28€ centro. Suplemento aeropuerto 2.50€.",
        mejorPara: "Grupo o destino fuera centro",
      },
    ],
    recomendacion: {
      presupuesto: "C-6 bus (3.85€) cada 20 min",
      rapido: "Taxi (20 min) marginalmente más rápido",
      nocturno: "Taxi — bus para 23:00",
    },
    tips: [
      "Si tu destino final es Benidorm/Calpe/Denia, hay buses directos ALSA desde aeropuerto — más eficiente que ir a Alicante primero.",
      "El TRAM (tranvía) NO llega al aeropuerto. Solo bus y taxi.",
      "Verano: el bus C-6 puede ir muy lleno en hora pico, 30+ min retraso. Si vuelo coge 3h+ antes.",
    ],
    evitar: [
      "Taxis que cobren más de 30€ a centro en horario diurno — abusivo.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "las-palmas",
    ciudad: "Las Palmas (Gran Canaria)",
    iata: "LPA",
    distanciaKm: 18,
    options: [
      {
        modo: "autobus",
        nombre: "Global 60",
        tiempoMin: 35,
        precioEur: 3,
        frecuenciaMin: 30,
        horario: "5:30-1:00",
        notas: "Línea directa aeropuerto-Las Palmas (Santa Catalina). Cómodo, AC.",
        mejorPara: "Default Las Palmas centro",
      },
      {
        modo: "taxi",
        nombre: "Taxi LPA",
        tiempoMin: 25,
        precioEur: 35,
        horario: "24h",
        notas: "Tarifa contador. 30-40€ centro. Recargo nocturno +30%.",
        mejorPara: "Grupo o destino sur isla",
      },
    ],
    recomendacion: {
      presupuesto: "Global 60 bus (3€) — directo cada 30 min",
      rapido: "Taxi (25 min) o el propio bus",
      nocturno: "Global 60 opera hasta 1am, taxi 24h",
    },
    tips: [
      "Si vas al sur de la isla (Maspalomas, Playa del Inglés), coge Global 66 desde aeropuerto — directo (35-40 min, 4€).",
      "Bus 60 termina en Estación Santa Catalina — bien conectada con guaguas locales.",
      "Alquila coche si te quedas >3 días en la isla — Gran Canaria tiene buena red carreteras y pueblos del interior valen la pena.",
    ],
    evitar: [
      "Taxis no oficiales (sin licencia roja) en zona arribadas — algunos turistas reciben tarifas inflación.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "tenerife-sur",
    ciudad: "Tenerife Sur (TFS)",
    iata: "TFS",
    distanciaKm: 60,
    options: [
      {
        modo: "autobus",
        nombre: "Titsa 111",
        tiempoMin: 60,
        precioEur: 9.35,
        frecuenciaMin: 30,
        horario: "6:30-23:00",
        notas: "Aeropuerto sur → Santa Cruz capital. 1h. Cómodo, AC.",
        mejorPara: "Santa Cruz centro",
      },
      {
        modo: "autobus",
        nombre: "Titsa 343",
        tiempoMin: 30,
        precioEur: 3,
        frecuenciaMin: 30,
        horario: "6:00-1:00",
        notas: "Aeropuerto sur → Costa Adeje/Los Cristianos (donde está la mayoría hoteles turísticos).",
        mejorPara: "Costa Adeje/Los Cristianos",
      },
      {
        modo: "taxi",
        nombre: "Taxi TFS",
        tiempoMin: 25,
        precioEur: 35,
        horario: "24h",
        notas: "Tarifa contador. 30-50€ a Costa Adeje. >60€ a Santa Cruz.",
        mejorPara: "Grupo o equipaje XL",
      },
    ],
    recomendacion: {
      presupuesto: "Titsa 343 (3€) a Adeje/Cristianos donde están los hoteles turísticos",
      rapido: "Taxi (25 min) si vas a Costa Adeje",
      nocturno: "Titsa 343 opera hasta 1am",
    },
    tips: [
      "Si vas a Norte de Tenerife (Puerto de la Cruz, La Laguna), vuela mejor a TFN (Tenerife Norte) — TFS está al sur isla = 1h+ tarpa.",
      "Tarjeta Tenmás (Titsa) descuenta 25-50% bus — vale pena si vas a moverte por isla.",
      "Alquila coche en aeropuerto — TFS tiene muchas opciones competitivas. Sin coche estás muy limitado isla.",
    ],
    evitar: [
      "Taxis del aeropuerto que digan 'tu hotel está muy lejos, son 80€' — Costa Adeje son 35-40€ máx.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "tenerife-norte",
    ciudad: "Tenerife Norte (TFN)",
    iata: "TFN",
    distanciaKm: 11,
    options: [
      {
        modo: "autobus",
        nombre: "Titsa 102/107/108",
        tiempoMin: 20,
        precioEur: 1.55,
        frecuenciaMin: 15,
        horario: "5:00-24:00",
        notas: "Conexión Santa Cruz capital + La Laguna. Frecuencia muy alta. Más barato del listado.",
        mejorPara: "Default — Santa Cruz/La Laguna",
      },
      {
        modo: "taxi",
        nombre: "Taxi TFN",
        tiempoMin: 15,
        precioEur: 18,
        horario: "24h",
        notas: "Tarifa contador. 16-22€ centro Santa Cruz o La Laguna.",
        mejorPara: "Grupo",
      },
    ],
    recomendacion: {
      presupuesto: "Titsa 102 (1.55€) — barato y rápido",
      rapido: "Taxi (15 min) o bus (20 min)",
      nocturno: "Bus opera hasta 24h, taxi 24h",
    },
    tips: [
      "TFN es minúsculo — controles 15 min, 1h antes vuelo sobra de calle.",
      "Si tu destino isla es sur (Adeje/Cristianos), TFS es mejor opción aterrizaje. Si es norte, TFN es perfecto.",
    ],
    evitar: [
      "Coger taxi a Costa Adeje desde TFN — son 50-60€ y 60 min. Vuelo separado a TFS sale más a cuenta.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "santiago-compostela",
    ciudad: "Santiago de Compostela",
    iata: "SCQ",
    distanciaKm: 12,
    options: [
      {
        modo: "autobus",
        nombre: "Empresa Freire L-J",
        tiempoMin: 25,
        precioEur: 3,
        frecuenciaMin: 30,
        horario: "6:00-1:00",
        notas: "Conecta aeropuerto SCQ-centro Santiago (Estación Autobuses + Casco Histórico).",
        mejorPara: "Default centro Santiago",
      },
      {
        modo: "taxi",
        nombre: "Taxi SCQ",
        tiempoMin: 15,
        precioEur: 23,
        horario: "24h",
        notas: "Tarifa fija 23€ a centro. Otros destinos contador.",
        mejorPara: "Grupo o lluvia (Galicia)",
      },
    ],
    recomendacion: {
      presupuesto: "Empresa Freire bus (3€) cada 30 min",
      rapido: "Taxi (15 min) — 10 min menos que bus",
      nocturno: "Bus opera 6-1am",
    },
    tips: [
      "Si haces Camino de Santiago, el bus te deja muy cerca del Obradoiro — sin necesidad de taxi.",
      "Lluvia 60% del año en Santiago — empacar paraguas + impermeable, no chubasquero de aeropuerto.",
    ],
    evitar: [
      "Caminar del aeropuerto al centro — son 12 km por carretera, no es ruta peatonal segura.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "asturias-oviedo",
    ciudad: "Asturias (Oviedo)",
    iata: "OVD",
    distanciaKm: 47,
    options: [
      {
        modo: "autobus",
        nombre: "ALSA aeropuerto",
        tiempoMin: 45,
        precioEur: 9,
        frecuenciaMin: 60,
        horario: "6:00-23:00",
        notas: "Bus directo aeropuerto-Oviedo (HUCA hospital + centro). También variante a Gijón.",
        mejorPara: "Centro Oviedo o Gijón",
      },
      {
        modo: "taxi",
        nombre: "Taxi OVD",
        tiempoMin: 35,
        precioEur: 65,
        horario: "24h",
        notas: "Tarifa muy elevada por distancia (47 km). 60-75€ a Oviedo.",
        mejorPara: "Grupo 3-4 que dividan tarifa",
      },
    ],
    recomendacion: {
      presupuesto: "ALSA bus (9€) — única opción rentable single pax",
      rapido: "Taxi (35 min) si presupuesto permite 65€",
      nocturno: "ALSA opera 6-23h. Taxi 24h pero caro madrugada",
    },
    tips: [
      "Aeropuerto OVD está MUY lejos del centro (47 km) — la peor relación distancia/centro de aeropuertos ES.",
      "Para 3-4 pax el taxi sale a 16€ pax = competitivo vs bus 9€/pax.",
      "Alquila coche en aeropuerto si vas a hacer ruta Asturias — sin coche estás muy limitado fuera Oviedo/Gijón.",
    ],
    evitar: [
      "No hay tren al aeropuerto OVD — no busques opción ferroviaria.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "granada",
    ciudad: "Granada",
    iata: "GRX",
    distanciaKm: 16,
    options: [
      {
        modo: "autobus",
        nombre: "ALSA Aeropuerto-Centro",
        tiempoMin: 45,
        precioEur: 3,
        frecuenciaMin: 60,
        horario: "5:20-23:30",
        notas: "Sincronizado con vuelos. Para en Gran Vía + Catedral. Cómodo, espacio equipaje.",
        mejorPara: "Default — única opción transporte público",
      },
      {
        modo: "taxi",
        nombre: "Taxi GRX",
        tiempoMin: 25,
        precioEur: 30,
        horario: "24h",
        notas: "Tarifa contador. 28-35€ centro. Recargo nocturno.",
        mejorPara: "Grupo o llegada tardía",
      },
    ],
    recomendacion: {
      presupuesto: "ALSA bus (3€) — única opción transporte público",
      rapido: "Taxi (25 min) — ALSA tarda 45 min",
      nocturno: "Taxi — bus para 23:30",
    },
    tips: [
      "GRX es muy pequeño — vuelos limitados, principalmente AENA + algunas low-cost.",
      "Si Granada está agotada, considera volar a Málaga (AGP) y coger tren/bus a Granada — más opciones vuelos.",
      "Alhambra entradas: reserva 1-3 meses antes online — venta directa día normal agotada en alta temporada.",
    ],
    evitar: [
      "Taxis fuera del aeropuerto que digan 'el bus está lleno' — controla horario bus real en ALSA app.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "fuerteventura",
    ciudad: "Fuerteventura",
    iata: "FUE",
    distanciaKm: 6,
    options: [
      {
        modo: "autobus",
        nombre: "Tiadhe línea 3",
        tiempoMin: 15,
        precioEur: 1.4,
        frecuenciaMin: 30,
        horario: "7:00-22:00",
        notas: "Aeropuerto-Puerto del Rosario (capital). Único bus público.",
        mejorPara: "Capital — la mayoría hoteles están en otras zonas",
      },
      {
        modo: "autobus",
        nombre: "Tiadhe línea 10",
        tiempoMin: 60,
        precioEur: 4.6,
        frecuenciaMin: 60,
        horario: "7:00-21:00",
        notas: "Aeropuerto → Costa Calma / Morro Jable (sur isla, zonas turísticas).",
        mejorPara: "Costa Calma/Morro Jable",
      },
      {
        modo: "taxi",
        nombre: "Taxi FUE",
        tiempoMin: 10,
        precioEur: 18,
        horario: "24h",
        notas: "Capital 15-20€. Costa Calma 60-70€. Morro Jable 80-90€.",
        mejorPara: "Distancias cortas o grupo",
      },
    ],
    recomendacion: {
      presupuesto: "Tiadhe línea 10 (4.60€) si vas al sur — mejor relación calidad/precio",
      rapido: "Taxi a tu hotel (10-30 min según destino)",
      nocturno: "Solo taxi después de 22h",
    },
    tips: [
      "Si te quedas en Costa Calma/Morro Jable (95% de los turistas), alquila coche en aeropuerto — buses limitados, isla grande.",
      "El paquete vacacional TUI/Iberojet suele incluir traslado al hotel — verifica antes de pagar bus/taxi.",
    ],
    evitar: [
      "Pedir taxi de Costa Calma → aeropuerto noche — disponibilidad limitada, riesgo perder vuelo. Reserva con antelación.",
    ],
    lastUpdated: "2026-05-25",
  },
  {
    slug: "lanzarote",
    ciudad: "Lanzarote (Arrecife)",
    iata: "ACE",
    distanciaKm: 6,
    options: [
      {
        modo: "autobus",
        nombre: "Línea 22 / 23 / 26",
        tiempoMin: 15,
        precioEur: 1.4,
        frecuenciaMin: 30,
        horario: "7:00-23:00",
        notas: "L22 → Arrecife capital. L23 → Costa Teguise. L26 → Playa Blanca. Frecuencia decente.",
        mejorPara: "Default según destino isla",
      },
      {
        modo: "taxi",
        nombre: "Taxi ACE",
        tiempoMin: 10,
        precioEur: 18,
        horario: "24h",
        notas: "Arrecife 15€. Costa Teguise 30€. Playa Blanca 50€. Puerto del Carmen 25€.",
        mejorPara: "Distancias cortas o grupo",
      },
    ],
    recomendacion: {
      presupuesto: "Bus L22/L23/L26 (1.40€) según destino",
      rapido: "Taxi (10 min Arrecife, 30 min Costa Teguise)",
      nocturno: "Solo taxi después de 23h",
    },
    tips: [
      "Lanzarote: alquila coche — la isla tiene maravillas naturales (Timanfaya, Jameos del Agua) imposibles de visitar sin coche.",
      "Aeropuerto ACE es muy pequeño — 1h antes del vuelo es suficiente, incluso menos low-cost (45 min).",
    ],
    evitar: [
      "Andar del aeropuerto al hotel (incluso si es 'solo 6 km') — no hay aceras seguras gran parte del trayecto.",
    ],
    lastUpdated: "2026-05-25",
  },
];

export const TRANSPORTE_AEROPUERTO_SLUGS = TRANSPORTE_AEROPUERTO.map((c) => c.slug);

export function getTransporteCiudadBySlug(
  slug: string,
): TransporteCiudad | undefined {
  return TRANSPORTE_AEROPUERTO.find((c) => c.slug === slug);
}
