/**
 * escapadas_catalog.ts — SSS433 (23 may 2026)
 *
 * 12 destinos típicos de escapada fin de semana desde España.
 * Cada entry contiene: itinerario 2-3 días, vuelo medio desde MAD/BCN,
 * hotel zona recomendada, presupuesto aprox 2-3 noches.
 *
 * SEO: "escapada fin de semana barata desde madrid", "escapada
 * roma 3 dias", "que hacer en lisboa fin de semana".
 *
 * Cross-links monetizables: /deals filtered por destino, /seguro-viaje,
 * /esim, /destinos/[slug] (hotel cross-sell Booking AID 714734).
 */

export interface EscapadaEntry {
  slug: string;
  name: string;
  country: string;
  emoji: string;
  /** Destino slug compatible con /destinos/[slug] catalog si existe. */
  destinoSlug?: string;
  /** Hours of flight from MAD. */
  flightHoursFromMad: number;
  /** Vuelo medio detectado por el motor. */
  avgFlightMadEur: number;
  /** Hotel medio 2 noches en zona central. */
  avgHotel2nEur: number;
  /** Plan sugerido 2-3 días. */
  itinerary: Array<{ day: string; title: string; activities: string[] }>;
  /** Mejor época. */
  bestSeason: string;
  /** Zona donde alojarse. */
  bestArea: string;
  /** Tips de transporte aeropuerto-centro. */
  transportTip: string;
  /** Total budget aprox 2-3 noches (vuelo + hotel + comidas). */
  totalBudgetEur: number;
  /** Pros + cons cortos. */
  pros: string[];
  cons: string[];
}

export const ESCAPADAS_CATALOG: EscapadaEntry[] = [
  {
    slug: "roma",
    name: "Roma",
    country: "Italia",
    emoji: "🇮🇹",
    destinoSlug: "roma",
    flightHoursFromMad: 2.5,
    avgFlightMadEur: 90,
    avgHotel2nEur: 180,
    itinerary: [
      {
        day: "Día 1",
        title: "Coliseo + Foro Romano + Trastevere",
        activities: [
          "Coliseo + Foro Romano (entrada combinada 18€, reservar online)",
          "Comer en Trastevere — carbonara o cacio e pepe",
          "Paseo nocturno por Castel Sant'Angelo",
        ],
      },
      {
        day: "Día 2",
        title: "Vaticano + Trevi + Pantheon",
        activities: [
          "Museos Vaticanos + Capilla Sixtina (entrada 25€, reservar 4-6 semanas antes)",
          "Plaza de San Pedro",
          "Tour walking centro: Trevi, Pantheon, Plaza Navona",
        ],
      },
      {
        day: "Día 3",
        title: "Villa Borghese + compras",
        activities: [
          "Villa Borghese mañana (gratis caminar parque, museo €13)",
          "Vía Condotti + Plaza de España",
          "Cena despedida en barrio Monti",
        ],
      },
    ],
    bestSeason: "Abril-junio y septiembre-octubre (evitar agosto por calor + turistas)",
    bestArea: "Centro Storico (Pantheon/Trevi) o Trastevere para más bohemio",
    transportTip:
      "FCO al centro: tren Leonardo Express 14€ en 32 min; bus SIT 6€ en 50 min. Taxi tarifa fija 50€.",
    totalBudgetEur: 450,
    pros: [
      "Imbatible en historia + comida",
      "Caminable casi todo desde centro",
      "Vuelos baratos desde Madrid (Vueling, Ryanair)",
    ],
    cons: [
      "Verano insoportable (40°C + multitudes)",
      "Vaticano cola enorme sin reserva (3-4h)",
    ],
  },
  {
    slug: "lisboa",
    name: "Lisboa",
    country: "Portugal",
    emoji: "🇵🇹",
    destinoSlug: "lisboa",
    flightHoursFromMad: 1.5,
    avgFlightMadEur: 70,
    avgHotel2nEur: 140,
    itinerary: [
      {
        day: "Día 1",
        title: "Alfama + Castillo + tranvía 28",
        activities: [
          "Subir al Castillo de São Jorge (€10, mejor vista de Lisboa)",
          "Pasear Alfama y comer bacalhau à brás",
          "Tomar el tranvía 28 a Estrela (recorrido turístico icónico)",
        ],
      },
      {
        day: "Día 2",
        title: "Belém + tarte de Belém + LX Factory",
        activities: [
          "Torre de Belém + Monasterio Jerónimos (entradas combinadas €15)",
          "Pastéis de Belém en pastelería original (cola pero merece la pena)",
          "Tarde en LX Factory (boutiques + cafés modernos)",
        ],
      },
      {
        day: "Día 3 (opcional)",
        title: "Sintra",
        activities: [
          "Día completo en Sintra (tren desde Rossio 5€)",
          "Palacio da Pena + Quinta da Regaleira",
        ],
      },
    ],
    bestSeason: "Marzo-junio y septiembre-noviembre",
    bestArea: "Baixa-Chiado o Bairro Alto para vida nocturna",
    transportTip:
      "LIS al centro: Aerobús €4 en 25 min, Metro Vermelha hasta São Sebastião €1,50 en 20 min.",
    totalBudgetEur: 380,
    pros: [
      "Vuelo muy barato y corto desde España",
      "Mejor relación calidad/precio Europa Occidental",
      "Sin barrera idioma con español",
    ],
    cons: [
      "Subidas constantes — calzado cómodo imprescindible",
      "Restaurantes turísticos en Rossio sobrevalorados",
    ],
  },
  {
    slug: "oporto",
    name: "Oporto",
    country: "Portugal",
    emoji: "🇵🇹",
    destinoSlug: "oporto",
    flightHoursFromMad: 1.5,
    avgFlightMadEur: 75,
    avgHotel2nEur: 130,
    itinerary: [
      {
        day: "Día 1",
        title: "Ribeira + crucero Douro + Vila Nova de Gaia",
        activities: [
          "Pasear Ribeira (UNESCO)",
          "Crucero por el Duero 1h (€20)",
          "Cruzar puente Luis I a Vila Nova de Gaia — bodegas vino oporto",
        ],
      },
      {
        day: "Día 2",
        title: "Bairros + Livraria Lello + Bolhão",
        activities: [
          "Livraria Lello (€8 entrada, inspiración Harry Potter)",
          "Mercado do Bolhão remodelado",
          "Tarde en Foz do Douro (zona playa) + cena en Matosinhos",
        ],
      },
      {
        day: "Día 3 (opcional)",
        title: "Valle del Duero",
        activities: [
          "Excursión guiada por viñedos Douro (~60€)",
          "Cata de oporto en quinta",
        ],
      },
    ],
    bestSeason: "Abril-octubre",
    bestArea: "Cedofeita (cool/joven) o Ribeira (turístico)",
    transportTip:
      "OPO al centro: Metro Violeta hasta Trindade €2,55 en 30 min. Taxi €25.",
    totalBudgetEur: 370,
    pros: [
      "Menos turístico que Lisboa, más auténtico",
      "Vino, comida y arquitectura excelentes",
      "Vuelos baratos low-cost desde Madrid",
    ],
    cons: [
      "Tiempo variable — siempre llevar paraguas",
      "Subidas/bajadas constantes",
    ],
  },
  {
    slug: "marrakech",
    name: "Marrakech",
    country: "Marruecos",
    emoji: "🇲🇦",
    destinoSlug: "marrakech",
    flightHoursFromMad: 2.5,
    avgFlightMadEur: 100,
    avgHotel2nEur: 100,
    itinerary: [
      {
        day: "Día 1",
        title: "Medina + Plaza Jemaa el-Fna",
        activities: [
          "Plaza Jemaa el-Fna al atardecer (encantadores serpientes, comida callejera)",
          "Zoco de las especias + textiles",
          "Hammam tradicional para terminar día (€20-40)",
        ],
      },
      {
        day: "Día 2",
        title: "Palacios + Jardín Majorelle",
        activities: [
          "Palacio Bahia + Palacio El Badi",
          "Jardín Majorelle + Museo Yves Saint Laurent (€20)",
          "Té de menta en una terraza vista Atlas",
        ],
      },
      {
        day: "Día 3",
        title: "Atlas + valle de Ourika",
        activities: [
          "Excursión Atlas + Ourika con guía (€40-60)",
          "Volver tarde para últimas compras zoco",
        ],
      },
    ],
    bestSeason: "Marzo-mayo y septiembre-noviembre (evitar julio-agosto: 45°C)",
    bestArea: "Riad en la Medina (auténtico) o Gueliz (moderno + tiendas)",
    transportTip:
      "RAK al centro: Bus 19 €3 en 20 min, taxi €10 (negociar antes de subir).",
    totalBudgetEur: 350,
    pros: [
      "Choque cultural cercano (3h vuelo)",
      "Riads (hoteles boutique) muy buena relación €",
      "Comida deliciosa y barata",
    ],
    cons: [
      "Calor extremo verano",
      "Mucho regateo necesario en zocos — no es para todos",
    ],
  },
  {
    slug: "berlin",
    name: "Berlín",
    country: "Alemania",
    emoji: "🇩🇪",
    destinoSlug: "berlin",
    flightHoursFromMad: 3,
    avgFlightMadEur: 110,
    avgHotel2nEur: 180,
    itinerary: [
      {
        day: "Día 1",
        title: "Mitte + Brandenburger Tor + Memorial",
        activities: [
          "Puerta de Brandeburgo + Reichstag (cúpula gratis con reserva)",
          "Memorial Holocausto + Topografía del Terror (gratis)",
          "Caminar Unter den Linden → Alexanderplatz",
        ],
      },
      {
        day: "Día 2",
        title: "East Side Gallery + Kreuzberg",
        activities: [
          "East Side Gallery — restos del muro (gratis)",
          "Comer currywurst en Curry 36",
          "Tarde de bares en Kreuzberg (Görlitzer Park area)",
        ],
      },
      {
        day: "Día 3",
        title: "Museos Insel + Charlottenburg",
        activities: [
          "Isla de los Museos (Pergamon en restauración — checar 2026)",
          "Volver al barrio Charlottenburg para Käthe-Kollwitz y compras Ku'damm",
        ],
      },
    ],
    bestSeason: "Mayo-septiembre",
    bestArea: "Mitte (céntrico) o Friedrichshain-Kreuzberg (joven/alternativo)",
    transportTip:
      "BER al centro: tren FEX €4,40 en 30 min, U-Bahn S9 €4,40 en 50 min. Taxi €50.",
    totalBudgetEur: 480,
    pros: [
      "Capital cultural — museos, historia, contracultura",
      "Cerveza y comida baratas",
      "Vida nocturna legendaria",
    ],
    cons: [
      "Comida tradicional alemana puede ser monótona",
      "Vuelos a veces caros vs comparables (Lisboa)",
    ],
  },
  {
    slug: "praga",
    name: "Praga",
    country: "República Checa",
    emoji: "🇨🇿",
    destinoSlug: "praga",
    flightHoursFromMad: 3,
    avgFlightMadEur: 110,
    avgHotel2nEur: 150,
    itinerary: [
      {
        day: "Día 1",
        title: "Ciudad vieja + reloj astronómico",
        activities: [
          "Plaza de la Ciudad Vieja + reloj astronómico (espectáculo cada hora)",
          "Cruzar Puente de Carlos",
          "Cervezas en pub tradicional U Pinkasů (1843)",
        ],
      },
      {
        day: "Día 2",
        title: "Castillo + Mala Strana",
        activities: [
          "Castillo de Praga + Catedral San Vito (entrada €15)",
          "Bajar a Mala Strana y comer trdelník",
          "John Lennon Wall + monte Petrín (vistas)",
        ],
      },
      {
        day: "Día 3",
        title: "Barrio judío + cervecería",
        activities: [
          "Sinagoga Vieja-Nueva + cementerio judío",
          "Tour cervecería local (Pivovarský Dům)",
        ],
      },
    ],
    bestSeason: "Mayo-septiembre y diciembre (mercados de Navidad)",
    bestArea: "Stare Mesto (ciudad vieja) o Vinohrady (residencial + bares)",
    transportTip:
      "PRG al centro: Bus 119 + metro €1,40 en 45 min, taxi fijo €30.",
    totalBudgetEur: 420,
    pros: [
      "Arquitectura intacta de siglos",
      "Cerveza más barata del mundo (€1-2)",
      "Comida abundante y barata",
    ],
    cons: [
      "Centro muy turístico, restaurantes ahí están sobrevalorados",
      "Inviernos brutales (-10°C)",
    ],
  },
  {
    slug: "amsterdam",
    name: "Ámsterdam",
    country: "Países Bajos",
    emoji: "🇳🇱",
    destinoSlug: "amsterdam",
    flightHoursFromMad: 2.5,
    avgFlightMadEur: 105,
    avgHotel2nEur: 230,
    itinerary: [
      {
        day: "Día 1",
        title: "Canales + Anne Frank + Jordaan",
        activities: [
          "Tour canales en barco (€18)",
          "Casa de Ana Frank (reserva 2-3 meses antes €16)",
          "Cena en Jordaan (Café Restaurant De Reiger)",
        ],
      },
      {
        day: "Día 2",
        title: "Museos + Vondelpark",
        activities: [
          "Rijksmuseum + Van Gogh Museum (combo €40, reserva online)",
          "Vondelpark al atardecer (alquila bici €15/día)",
          "Cena en zona De Pijp",
        ],
      },
      {
        day: "Día 3",
        title: "Mercados + escapada Zaanse Schans",
        activities: [
          "Mercado Albert Cuyp",
          "Excursión a Zaanse Schans (molinos típicos, tren 30 min)",
        ],
      },
    ],
    bestSeason: "Abril (tulipanes) y mayo-septiembre",
    bestArea: "Jordaan (encantador) o De Pijp (joven + restaurantes)",
    transportTip:
      "AMS al centro: tren €5,90 en 16 min cada 10 min. Taxi fijo €45-55.",
    totalBudgetEur: 530,
    pros: [
      "Caminable + bici (alquila desde día 1)",
      "Museos de talla mundial",
      "Inglés universal — sin barrera",
    ],
    cons: [
      "Hoteles caros (uno de los más caros Europa)",
      "Restaurantes turísticos malos — buscar locales",
    ],
  },
  {
    slug: "edimburgo",
    name: "Edimburgo",
    country: "Escocia",
    emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    flightHoursFromMad: 3.5,
    avgFlightMadEur: 120,
    avgHotel2nEur: 200,
    itinerary: [
      {
        day: "Día 1",
        title: "Royal Mile + Castillo",
        activities: [
          "Castillo de Edimburgo (entrada £21, reserva online)",
          "Caminar Royal Mile → Holyroodhouse",
          "Cena en restaurante tradicional con haggis",
        ],
      },
      {
        day: "Día 2",
        title: "Arthur's Seat + New Town",
        activities: [
          "Subir Arthur's Seat al amanecer (1h, vistas 360°)",
          "Calton Hill + monumento Nelson",
          "Tomar whisky en The Scotch Whisky Experience",
        ],
      },
      {
        day: "Día 3",
        title: "Excursión Highlands",
        activities: [
          "Tour día Highlands + Loch Ness (£60, día completo)",
        ],
      },
    ],
    bestSeason: "Agosto (Festival Fringe — caro) o mayo-junio y septiembre",
    bestArea: "Old Town (turístico) o Stockbridge (local + bohemio)",
    transportTip:
      "EDI al centro: Tram £8 ida en 35 min, bus Airlink 100 £5 en 25 min.",
    totalBudgetEur: 580,
    pros: [
      "Pueblo pequeño caminable — todo a 15 min andando",
      "Historia + naturaleza accesible",
      "Festival Fringe en agosto (mayor festival de artes del mundo)",
    ],
    cons: [
      "Lluvia constante todo el año",
      "Caro (libra esterlina)",
    ],
  },
  {
    slug: "dublin",
    name: "Dublín",
    country: "Irlanda",
    emoji: "🇮🇪",
    destinoSlug: "dublin",
    flightHoursFromMad: 3,
    avgFlightMadEur: 95,
    avgHotel2nEur: 220,
    itinerary: [
      {
        day: "Día 1",
        title: "Temple Bar + Trinity College",
        activities: [
          "Trinity College + Libro de Kells (€18)",
          "Pasear Grafton Street y St. Stephen's Green",
          "Pub crawling en Temple Bar (caro pero cliché obligatorio)",
        ],
      },
      {
        day: "Día 2",
        title: "Guinness + Kilmainham Gaol",
        activities: [
          "Guinness Storehouse (€26 — entrada con pinta panorámica)",
          "Kilmainham Gaol (€8, historia carcelaria + independencia)",
          "Cena en barrio Stoneybatter",
        ],
      },
      {
        day: "Día 3 (opcional)",
        title: "Cliffs of Moher",
        activities: [
          "Tour día completo Cliffs of Moher (€60)",
        ],
      },
    ],
    bestSeason: "Mayo-septiembre",
    bestArea: "Temple Bar (turístico + ruidoso) o Portobello (residencial)",
    transportTip:
      "DUB al centro: Aircoach 700 €8 en 25 min, Dublin Express €8 en 25 min.",
    totalBudgetEur: 510,
    pros: [
      "Pubs únicos con música en vivo",
      "Mucha conexión vuelos low-cost Ryanair",
      "U.S. Preclearance — útil si conexión USA",
    ],
    cons: [
      "Caro (pinta €7-9)",
      "Lluvia 60% de días",
    ],
  },
  {
    slug: "bruselas",
    name: "Bruselas",
    country: "Bélgica",
    emoji: "🇧🇪",
    flightHoursFromMad: 2.5,
    avgFlightMadEur: 100,
    avgHotel2nEur: 170,
    itinerary: [
      {
        day: "Día 1",
        title: "Grand Place + Manneken Pis",
        activities: [
          "Grand Place al atardecer (luces)",
          "Manneken Pis + Galerías Saint-Hubert",
          "Cena en Restaurant Vincent (especialidad steak tartar)",
        ],
      },
      {
        day: "Día 2",
        title: "Atomium + Museos",
        activities: [
          "Atomium + Mini-Europe (entrada €15)",
          "Volver al centro: Museo Magritte + Royal Galleries",
          "Probar gofres en Maison Dandoy",
        ],
      },
      {
        day: "Día 3",
        title: "Brujas (día)",
        activities: [
          "Excursión día a Brujas (tren 1h, €14 ida y vuelta)",
        ],
      },
    ],
    bestSeason: "Mayo-octubre",
    bestArea: "Sablon (clásico) o Saint-Gilles (joven)",
    transportTip:
      "BRU al centro: tren €9,90 en 17 min cada 15 min.",
    totalBudgetEur: 450,
    pros: [
      "Capital UE — museos y arquitectura",
      "Cerveza belga inigualable",
      "Brujas a 1h en tren (gem absoluto)",
    ],
    cons: [
      "Comida en restaurantes turísticos sobrevalorada",
      "Centro pequeño — saturado fines de semana",
    ],
  },
  {
    slug: "atenas",
    name: "Atenas",
    country: "Grecia",
    emoji: "🇬🇷",
    destinoSlug: "atenas",
    flightHoursFromMad: 3.5,
    avgFlightMadEur: 130,
    avgHotel2nEur: 140,
    itinerary: [
      {
        day: "Día 1",
        title: "Acrópolis + Plaka",
        activities: [
          "Acrópolis + Partenón al amanecer (€20, evita multitudes)",
          "Museo de la Acrópolis (€10)",
          "Comer souvlaki en Plaka",
        ],
      },
      {
        day: "Día 2",
        title: "Anafiotika + Monastiraki",
        activities: [
          "Anafiotika — barrio cicládico dentro de Atenas",
          "Mercado Monastiraki",
          "Atardecer en colina Filopapou (vistas Acrópolis iluminada)",
        ],
      },
      {
        day: "Día 3 (opcional)",
        title: "Cabo Sounion",
        activities: [
          "Excursión Cabo Sounion + Templo Poseidón (atardecer mágico)",
        ],
      },
    ],
    bestSeason: "Abril-mayo y septiembre-octubre",
    bestArea: "Plaka (turístico+barato) o Koukaki (moderno, cerca Acrópolis)",
    transportTip:
      "ATH al centro: Metro M3 €9 en 40 min, taxi fijo €40.",
    totalBudgetEur: 450,
    pros: [
      "Historia milenaria — Partenón, Acrópolis, Ágora",
      "Comida excelente y económica",
      "Puerta a las islas griegas",
    ],
    cons: [
      "Caos urbano (no es ciudad para minimalistas)",
      "Verano insufriblemente caluroso",
    ],
  },
  {
    slug: "estambul",
    name: "Estambul",
    country: "Turquía",
    emoji: "🇹🇷",
    destinoSlug: "estambul",
    flightHoursFromMad: 4,
    avgFlightMadEur: 140,
    avgHotel2nEur: 130,
    itinerary: [
      {
        day: "Día 1",
        title: "Santa Sofía + Mezquita Azul + Gran Bazar",
        activities: [
          "Santa Sofía + Mezquita Azul (entrada gratis a la azul)",
          "Topkapi (palacio sultanes, €17)",
          "Tarde en Gran Bazar",
        ],
      },
      {
        day: "Día 2",
        title: "Bósforo + Asia",
        activities: [
          "Crucero Bósforo (2h €15-25)",
          "Cruzar a la parte asiática (Kadıköy)",
          "Cena pescado en barrios de pescadores",
        ],
      },
      {
        day: "Día 3",
        title: "Hammam + zoco egipcio",
        activities: [
          "Hammam histórico (Cağaloğlu Hamamı, 500 años, €60)",
          "Zoco egipcio (especias)",
        ],
      },
    ],
    bestSeason: "Marzo-mayo y septiembre-noviembre",
    bestArea: "Sultanahmet (turístico/histórico) o Beyoğlu (moderno)",
    transportTip:
      "IST aeropuerto al centro: bus HAVAIST 18€ TL en 1h, Metro M11 8€ TL en 40 min.",
    totalBudgetEur: 400,
    pros: [
      "Encrucijada Europa-Asia — choque cultural ideal",
      "Vuelos Turkish con stopover gratis posible",
      "Comida única (kebab, baklava, çay)",
    ],
    cons: [
      "Megalópolis (16M) — moverse cansa",
      "Distancia mayor que otras escapadas (~4h vuelo)",
    ],
  },
];

export const ESCAPADAS_BY_SLUG: Record<string, EscapadaEntry> = Object.fromEntries(
  ESCAPADAS_CATALOG.map((e) => [e.slug, e]),
);

export const ESCAPADAS_SLUGS = ESCAPADAS_CATALOG.map((e) => e.slug);

export function getEscapada(slug: string): EscapadaEntry | null {
  return ESCAPADAS_BY_SLUG[slug] ?? null;
}
