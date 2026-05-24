/**
 * dinero_catalog.ts — SUPERSESSION (24 may 2026)
 *
 * Guía dinero por país: cuánto efectivo sacar, dónde cambiar, propinas,
 * tarjetas aceptadas, errores típicos. 10 países top con info accionable.
 */

export interface DineroEntry {
  slug: string;
  pais: string;
  moneda: string; // "Yen japonés"
  emoji: string;
  destinoSlug?: string;
  efectivoSacar: string; // "30.000 JPY (~190€) primer día"
  donde_cambiar: string;
  cambio_evitar: string;
  propinas: string;
  tarjetasAceptadas: "muy alta" | "media" | "baja" | "muy baja";
  tarjetasDetalle: string;
  cajero: string;
  errorTipico: string;
}

export const DINERO_CATALOG: DineroEntry[] = [
  {
    slug: "japon",
    pais: "Japón",
    moneda: "Yen (JPY)",
    emoji: "🇯🇵",
    destinoSlug: "japon",
    efectivoSacar: "30.000 JPY (~180€) primer día. Muchos sitios solo aceptan efectivo (templos, ramen-ya pequeños, taxis fuera de Tokio).",
    donde_cambiar: "Cajeros 7-Eleven (Seven Bank ATM) o Family Mart funcionan 24/7 con tarjetas extranjeras. Bancos locales NO suelen aceptar tarjetas extranjeras.",
    cambio_evitar: "Casas de cambio aeropuerto (5-7% peor) y mostradores en hoteles.",
    propinas: "NUNCA. Es una ofensa. Si dejas dinero en mesa, el camarero correrá detrás para devolverlo. Servicio incluido.",
    tarjetasAceptadas: "media",
    tarjetasDetalle: "Visa/Mastercard sí en hoteles, grandes restaurantes, conveniences. NO en templos, ramen-ya pequeños, mercados, taxis tradicionales.",
    cajero: "7-Eleven ATM cobra 110 JPY (~0.70€) por extracción. Revolut y Wise 0% comisión cambio.",
    errorTipico: "Llegar sin efectivo creyendo que 'todo se paga con tarjeta'. Tokyo metro solo acepta tarjeta IC (Suica/Pasmo) o efectivo, no Visa.",
  },
  {
    slug: "tailandia",
    pais: "Tailandia",
    moneda: "Baht (THB)",
    emoji: "🇹🇭",
    destinoSlug: "tailandia",
    efectivoSacar: "5.000 THB (~125€) primer día. Mercados, tuk-tuks, comida calle todo efectivo.",
    donde_cambiar: "SuperRich (cadena, 8 sucursales Bangkok) tiene mejor cambio del país. Aeropuerto BKK 2-3% peor.",
    cambio_evitar: "Cualquier 'Exchange' en zona turística Khao San, Patpong. Margen 5-8%.",
    propinas: "10% restaurante (no incluido). Spa: 50-100 THB. Tuk-tuk: redondear. Guía: 200-300 THB/día.",
    tarjetasAceptadas: "media",
    tarjetasDetalle: "Hoteles, malls, restaurantes turísticos sí. Mercados/comida calle no. 7-Eleven sí.",
    cajero: "AEON Bank ATM = mejor (150 THB comisión, ~3.50€). Otros bancos cobran 200-220 THB.",
    errorTipico: "Sacar pequeñas cantidades varias veces — cada extracción 150-220 THB comisión. Sacar 8.000-10.000 THB de una vez.",
  },
  {
    slug: "marruecos",
    pais: "Marruecos",
    moneda: "Dirham (MAD)",
    emoji: "🇲🇦",
    destinoSlug: "marruecos",
    efectivoSacar: "2.000 MAD (~190€) primer día. Zoco, taxis, propinas todo efectivo.",
    donde_cambiar: "Bancos oficiales tipo BMCE, Société Générale. Aeropuerto Marrakech está OK (3-4% peor solo).",
    cambio_evitar: "NUNCA cambies en zoco directamente con vendedor. Ratios fraudulentos.",
    propinas: "10% restaurante, 10-20 MAD mozo hotel, 5 MAD vendedor que ayuda. Baksheesh esperado.",
    tarjetasAceptadas: "baja",
    tarjetasDetalle: "Solo hoteles/restaurantes turísticos. Riads pequeños suelen pedir efectivo. Casi todo en medina = efectivo.",
    cajero: "BMCE y Attijariwafa bank ATMs aceptan tarjeta extranjera. ~25 MAD comisión.",
    errorTipico: "Salir del país con muchos dirhams — la moneda NO se cambia fuera de Marruecos (excepto aeropuerto al salir). Gasta antes de irte.",
  },
  {
    slug: "vietnam",
    pais: "Vietnam",
    moneda: "Dong vietnamita (VND)",
    emoji: "🇻🇳",
    destinoSlug: "vietnam",
    efectivoSacar: "5.000.000 VND (~190€) primer día. La moneda tiene muchos ceros — cuidado al contar.",
    donde_cambiar: "Joyerías legales en distrito 1 Saigón (Ho Chi Minh) tienen mejor cambio que bancos. Aeropuerto 5% peor.",
    cambio_evitar: "Hoteles (10% peor que bancos). Cualquier 'unofficial' está fraud.",
    propinas: "5-10% restaurante turístico. NO en bares de calle. Conductor moto: 20.000 VND. Spa: 50.000-100.000 VND.",
    tarjetasAceptadas: "media",
    tarjetasDetalle: "Saigón y Hanói medianas-grandes sí. Provincias = efectivo solo.",
    cajero: "TPBank y Vietcombank ATMs OK con tarjetas internacionales. ~30.000 VND comisión.",
    errorTipico: "Confundir 200.000 VND (~7.5€) con 20.000 VND (~0.75€) por el zero extra. Lee bien antes de pagar.",
  },
  {
    slug: "indonesia",
    pais: "Indonesia",
    moneda: "Rupia (IDR)",
    emoji: "🇮🇩",
    destinoSlug: "bali",
    efectivoSacar: "2.500.000 IDR (~150€) primer día Bali. Más en Jakarta. Warung locales, scooters todo efectivo.",
    donde_cambiar: "Sucursales 'Central Kuta' Bali tienen ratios mejor. NUNCA cambies en kios de calle.",
    cambio_evitar: "Cualquier exchange que ofrezca '2x mejor que banco'. Es fraude clásico Bali.",
    propinas: "10% en restaurante (a veces incluido como 'service charge' 5-10%). Hotel mozo 10-20K IDR.",
    tarjetasAceptadas: "media",
    tarjetasDetalle: "Hoteles, restaurantes Seminyak/Ubud sí. Warungs y locales pequeños no.",
    cajero: "BCA y Bank Mandiri ATMs OK. 35.000-50.000 IDR comisión.",
    errorTipico: "Cambio fraudulento en Kuta — vendedor 'pierde' billete a mitad del conteo, pasa rapidísimo. Cuenta tú mismo siempre.",
  },
  {
    slug: "eau",
    pais: "Emiratos Árabes Unidos",
    moneda: "Dírham EAU (AED)",
    emoji: "🇦🇪",
    destinoSlug: "dubai",
    efectivoSacar: "500 AED (~125€) primer día Dubái. Mayoría con tarjeta.",
    donde_cambiar: "UAE Exchange (cadena) en malls. Aeropuerto OK también.",
    cambio_evitar: "Hoteles (3-5% peor).",
    propinas: "10-15% restaurante. Mozo hotel 5-10 AED. Taxi redondear.",
    tarjetasAceptadas: "muy alta",
    tarjetasDetalle: "Prácticamente todo. Hasta zoco gold de Deira acepta tarjeta.",
    cajero: "Cualquier banco. Comisión típica 10-15 AED por extracción.",
    errorTipico: "Salir sin AED nada porque 'todo con tarjeta' — algunos taxis fuera Dubái Marina solo efectivo. Lleva 200 AED mínimo.",
  },
  {
    slug: "argentina",
    pais: "Argentina",
    moneda: "Peso argentino (ARS)",
    emoji: "🇦🇷",
    destinoSlug: "buenos-aires",
    efectivoSacar: "Trae USD efectivo y cambia en 'cuevas' (mercado paralelo). Cajeros oficiales dan ratio MUCHO peor.",
    donde_cambiar: "'Cueva' = casa de cambio informal con ratio paralelo 'blue'. Florida (Buenos Aires) tiene varias. 30-40% mejor que oficial.",
    cambio_evitar: "Cajeros oficiales y bancos — dan ratio oficial que es muy desfavorable.",
    propinas: "10% restaurante. Mozo hotel 200-500 ARS. Taxi redondear.",
    tarjetasAceptadas: "media",
    tarjetasDetalle: "Sí en grande, pero te aplican ratio MEP/CCL bancario más malo. Mejor pagar en efectivo blue.",
    cajero: "Si necesitas, BBVA y Santander OK. Pero el ratio es muy desfavorable.",
    errorTipico: "Sacar pesos en cajero ATM = pierdes 35-40% vs cueva. Trae dólares en billetes (preferible USD 100s nuevos).",
  },
  {
    slug: "brasil",
    pais: "Brasil",
    moneda: "Real (BRL)",
    emoji: "🇧🇷",
    efectivoSacar: "500 BRL (~85€) primer día. Mucho con tarjeta. Mercados/feiras necesitan efectivo.",
    donde_cambiar: "Casas de cambio en zonas turísticas (Copacabana, Av Paulista). Aeropuerto OK.",
    cambio_evitar: "Hoteles. Cambistas informales en playa.",
    propinas: "10% restaurante (a veces incluido como 'serviço'). Bar/garçom: 10% si no incluido.",
    tarjetasAceptadas: "muy alta",
    tarjetasDetalle: "Tarjeta prácticamente universal. Hasta vendedores playa tienen máquina contactless.",
    cajero: "Banco do Brasil, Itaú, Bradesco OK. ~25-30 BRL comisión.",
    errorTipico: "No detectar gemelos chinos en cajeros — copian PIN. Solo usa cajeros dentro de banco/mall, NUNCA aislados.",
  },
  {
    slug: "estados-unidos",
    pais: "Estados Unidos",
    moneda: "Dólar (USD)",
    emoji: "🇺🇸",
    destinoSlug: "nueva-york",
    efectivoSacar: "100-200 USD primer día. Casi todo con tarjeta excepto: propina cash bar, propina valet, mercados de granjeros.",
    donde_cambiar: "Recomendamos NO cambiar desde Europa — saca USD directamente con tu tarjeta EU (Revolut/Wise).",
    cambio_evitar: "Casas de cambio aeropuerto y bancos en hoteles (5-7% peor).",
    propinas: "OBLIGATORIO. Restaurante 18-22%. Taxi 15-20%. Bar 1-2 USD/copa. Hotel mozo 1-2 USD/maleta.",
    tarjetasAceptadas: "muy alta",
    tarjetasDetalle: "Universal. Tap to pay en NYC subway desde 2024.",
    cajero: "Chase, Bank of America, Citi. Comisión 3-5 USD por extracción + tu banco. Revolut/Wise mejor.",
    errorTipico: "Ratio cambio aeropuerto JFK/LAX es horrible (~7% peor). Saca directo con tu tarjeta en cualquier ATM bank.",
  },
  {
    slug: "egipto",
    pais: "Egipto",
    moneda: "Libra egipcia (EGP)",
    emoji: "🇪🇬",
    efectivoSacar: "2.000 EGP (~40€) primer día. Mercados, taxis, baksheesh todo efectivo.",
    donde_cambiar: "Bancos oficiales (CIB, NBE, QNB). Aeropuerto OK pero margen 3-4%.",
    cambio_evitar: "Cualquier vendedor que ofrezca cambio en zoco (Khan El Khalili). Es fraude.",
    propinas: "Baksheesh es OBLIGATORIO. Lleva billetes pequeños 5, 10, 20 EGP siempre. Cargador maleta 10 EGP, fotógrafo en pirámides 20 EGP, guía 100 EGP/día.",
    tarjetasAceptadas: "baja",
    tarjetasDetalle: "Solo hoteles internacionales. La mayoría es efectivo.",
    cajero: "CIB ATM acepta tarjetas internacionales. Comisión ~50 EGP.",
    errorTipico: "Pagar todo con billetes grandes (100/200 EGP) — los locales no tienen cambio. Lleva billetes pequeños siempre.",
  },
];

export const DINERO_SLUGS: string[] = DINERO_CATALOG.map((d) => d.slug);

export function getDinero(slug: string): DineroEntry | undefined {
  return DINERO_CATALOG.find((d) => d.slug === slug.toLowerCase());
}
