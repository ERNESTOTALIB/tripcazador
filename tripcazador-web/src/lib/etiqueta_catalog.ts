/**
 * etiqueta_catalog.ts — SSS486 (24 may 2026)
 *
 * Catálogo seed para /etiqueta/[pais]. Guía cultural por país para
 * que viajeros españoles eviten gaffes (propinas, saludos, tabúes,
 * vestuario, comida, gestos).
 *
 * 10 países high-traffic: Japón, EAU, Marruecos, India, Tailandia,
 * USA, Reino Unido, China, México, Argentina.
 */

export interface EtiquetaEntry {
  slug: string;
  country: string;
  emoji: string;
  destinoSlug?: string; // si está en DESTINOS_CATALOG, para cross-link
  oneLiner: string;
  saludo: string;
  propinas: string;
  vestuario: string;
  tabues: string[];
  gestos: { do: string[]; dont: string[] };
  comida: string;
  curiosidad: string;
}

export const ETIQUETA_CATALOG: EtiquetaEntry[] = [
  {
    slug: "japon",
    country: "Japón",
    emoji: "🇯🇵",
    destinoSlug: "japon",
    oneLiner: "La cultura más codificada del mundo. Cada gesto tiene significado.",
    saludo:
      "Inclinación (ojigi) — no estrechar manos. Profundidad según jerarquía: 15° saludo casual, 30° formal, 45° disculpa profunda. Españoles: imita la profundidad del local que saluda.",
    propinas:
      "NUNCA. Es una ofensa. Si dejas dinero en mesa, el camarero correrá detrás para devolverlo. El precio incluye servicio.",
    vestuario:
      "Conservador en templos (hombros y rodillas cubiertos). En ryokan se descalza al entrar. Tatuajes: cubrir en onsen (asociados con yakuza).",
    tabues: [
      "Sonarse la nariz en público (muy mal visto)",
      "Hablar fuerte en transporte público (móviles silenciados)",
      "Clavar palillos verticales en arroz (ritual funerario)",
      "Pasar comida de palillo a palillo (también funerario)",
      "Caminar mientras comes en la calle (excepto festivales)",
    ],
    gestos: {
      do: ["Saludo inclinado", "Recibir tarjetas con ambas manos", "Quitarse zapatos en casa/ryokan"],
      dont: ["Apuntar con dedo (usa mano abierta)", "Tocar a desconocidos", "Discutir en voz alta"],
    },
    comida:
      "Slurp del ramen es elogio. Sushi se come con dedos (nigiri) o palillos (maki). No mezclar wasabi con soja agresivamente.",
    curiosidad:
      "Si llegas tarde a una reunión laboral japonesa, considera la jornada perdida. Puntualidad = respeto absoluto.",
  },
  {
    slug: "eau",
    country: "Emiratos Árabes Unidos",
    emoji: "🇦🇪",
    destinoSlug: "dubai",
    oneLiner: "Mezcla de modernidad cosmopolita y tradición islámica conservadora.",
    saludo:
      "Mano derecha (nunca izquierda — impura). Hombres a hombres: apretón largo + 'As-salamu alaykum'. Hombre a mujer: solo si ella ofrece mano. Mujer a mujer: doble beso entre conocidas.",
    propinas:
      "10-15% en restaurantes (servicio no incluido excepto buffet). Taxi: redondear. Bellboy: 5-10 AED. Sí es costumbre, no obligación.",
    vestuario:
      "Mujeres: hombros y rodillas cubiertos en lugares públicos, mall y zoco. En playa privada hotel: bikini OK. Hombres: NO short corto en lugares oficiales/mezquita. Mezquita Sheikh Zayed: abaya y velo gratuitos.",
    tabues: [
      "Beso público entre pareja (multa posible)",
      "Alcohol en público fuera de hoteles licenciados",
      "Insultos / blasfemia (delito grave, cárcel posible)",
      "Fotografiar mujeres locales sin permiso",
      "Comer en público durante Ramadán (sol arriba)",
    ],
    gestos: {
      do: ["Aceptar café/dátiles ofrecidos (cortesía)", "Mano derecha siempre", "Lentes oscuros sí, pero no dentro"],
      dont: ["Cruzar piernas mostrando suela", "Apuntar con índice (usa pulgar)", "Dar la mano izquierda nunca"],
    },
    comida:
      "Come con derecha (incluso si eres zurdo). Halal universal. Carne de cerdo solo en hoteles internacionales. Cordero, dátiles, hummus son típicos.",
    curiosidad:
      "Viernes es día sagrado (no domingo). Fin de semana laboral es sábado-domingo. Bancos cierran viernes.",
  },
  {
    slug: "marruecos",
    country: "Marruecos",
    emoji: "🇲🇦",
    destinoSlug: "marruecos",
    oneLiner: "Hospitalidad árabe + influencia bereber + colonial francesa.",
    saludo:
      "'Salam alaykum' + mano derecha. Hombres se besan en mejilla (2-4 veces) si son amigos. Mujer extranjera a hombre marroquí: mano sola, no beso.",
    propinas:
      "Esencial. Camarero 10%, guía 50-100 MAD/día, mozo hotel 10-20 MAD. Vendedor que ayuda: pequeña propina aunque no compres.",
    vestuario:
      "Mujeres: cubrirse hombros y rodillas en medinas tradicionales. En Marrakech ciudad moderna y playa: relajado. NUNCA shorts en zonas rurales/medina.",
    tabues: [
      "Beso público entre pareja (especialmente fuera Marrakech)",
      "Alcohol en público fuera de hoteles/bares licenciados",
      "Fotografiar personas sin permiso (especialmente mujeres velo)",
      "Mostrar suela del zapato",
      "Apuntar con dedo (insulto)",
    ],
    gestos: {
      do: ["Aceptar té de menta ofrecido (insultarías si rechazas)", "Regatear en zoco (esperado, ~50% del precio inicial)", "Vestir modesto en medina"],
      dont: ["Comer/saludar con mano izquierda", "Decir no a hospitalidad sin gracias enfático", "Negarse a fotos a cambio de propinas"],
    },
    comida:
      "Tajine, cuscús (viernes tradicional), pastilla. Con manos derecha en plato comunal. Pan (khobz) en todas las comidas. No alcohol con familia musulmana conservadora.",
    curiosidad:
      "Regateo NO es opcional. El precio inicial es 2-3x lo razonable. Salir caminando es estrategia válida.",
  },
  {
    slug: "india",
    country: "India",
    emoji: "🇮🇳",
    oneLiner: "Diversidad religiosa + jerarquías sociales + hospitalidad legendaria.",
    saludo:
      "'Namaste' con palmas juntas frente al pecho (no se da mano, especialmente a mujeres). Saludo respeta la jerarquía: a mayor edad, mayor inclinación.",
    propinas:
      "Hoteles 10-50 INR mozo, restaurante 5-10%, conductor private car 100-200 INR/día. Bakshish es esperado pero modesto.",
    vestuario:
      "Mujeres: cubrirse hombros y rodillas. En templos hindúes: descalzarse. Templos sikh: cabeza cubierta. Hombres: camisa con mangas en templos.",
    tabues: [
      "Tocar la cabeza de alguien (sagrada)",
      "Mostrar suela del zapato",
      "Vaca sagrada — no tocar, no apartar",
      "Comer con izquierda (impura)",
      "Foto en templos sin permiso",
    ],
    gestos: {
      do: ["Quitarse zapatos en templos y casas", "Comer con mano derecha", "Cabeza ladeada = sí o entiendo"],
      dont: ["Beso público pareja", "Tocar mujer desconocida", "Discutir religión/política"],
    },
    comida:
      "Vegetariana 30%+ de India. Hindús: no carne vacuno. Musulmanes: no cerdo. Sikhs/Jainistas/Brahmines: estrictos. Pregunta antes de invitar/cocinar.",
    curiosidad:
      "El movimiento de cabeza (head wobble) significa 'sí, entiendo, estoy de acuerdo, ok' según contexto. Confuso al principio para europeos.",
  },
  {
    slug: "tailandia",
    country: "Tailandia",
    emoji: "🇹🇭",
    destinoSlug: "tailandia",
    oneLiner: "Budismo + monarquía respetada absolutamente + hospitalidad cálida.",
    saludo:
      "'Wai' — manos juntas frente al pecho con leve inclinación. Mayor altura de manos = más respeto. Niños no se les devuelve wai.",
    propinas:
      "20-50 THB camarero, 100 THB mozo hotel, 20 THB taxista. No agresivo, redondear es la norma.",
    vestuario:
      "Templos: hombros y rodillas cubiertos siempre. Mujeres: NO tocar monje (literalmente, evitarlo). Playa: bikini OK, pero topless prohibido.",
    tabues: [
      "Insultar al rey/monarquía (delito grave, hasta 15 años cárcel — Lèse-majesté)",
      "Tocar cabeza de alguien (sagrada)",
      "Apuntar pies a alguien o a estatua de Buda",
      "Mujer toca monje (incluso por accidente)",
      "Insultar la religión budista",
    ],
    gestos: {
      do: ["Quitarse zapatos en templo y casa", "Sonreír siempre (sonrisa = paz)", "Wai a mayores y a monjes"],
      dont: ["Mostrar enfado en público (perder cara)", "Subir al monumento Buda", "Tocar estatua Buda"],
    },
    comida:
      "Picante real. Pad thai, tom yum, mango sticky rice. Comer con cuchara (derecha) + tenedor (izquierda) — palillos solo para sopa/noodle.",
    curiosidad:
      "Sonreír es defensa universal: confusión, vergüenza, desacuerdo, alegría — todo se expresa con sonrisa. Frustrar a un tailandés = perder cara.",
  },
  {
    slug: "usa",
    country: "Estados Unidos",
    emoji: "🇺🇸",
    destinoSlug: "nueva-york",
    oneLiner: "Cultura de propinas + small talk + casualismo + reglas de seguridad.",
    saludo:
      "Apretón de manos firme + sonrisa + 'how are you'. Es ritual, no esperan respuesta real. 'I'm good, thanks' suficiente.",
    propinas:
      "OBLIGATORIO. Restaurante 18-22%. Taxi 15-20%. Bar 1-2 USD/copa. Hotel mozo 1-2 USD/maleta. Uber Eats 15%. Sin propina = ofensa grave (camareros viven de propinas).",
    vestuario:
      "Casual mayoría. Iglesia: smart casual (sin tank top). Restaurante fine dining: chaqueta hombre. NYC más formal que LA.",
    tabues: [
      "Hablar de salarios/dinero específico (incómodo)",
      "Comentarios sobre raza/origen sin contexto",
      "Beber alcohol en calle (excepto Nueva Orleans, Las Vegas)",
      "Fumar en interiores (todos los estados)",
      "Hacer fotos a niños desconocidos",
    ],
    gestos: {
      do: ["Tip generoso", "Small talk con desconocidos", "Sonreír al servidor desde primer contacto"],
      dont: ["Pedir 'la cuenta' — debes pedirla explícitamente 'check please'", "Discutir el tip con el camarero", "Dar precio sin propina/impuesto"],
    },
    comida:
      "Porciones enormes (toma para llevar normal). Brunch sagrado domingo. Cafés grandes (sustituye espresso). Refill gratis en algunos lugares.",
    curiosidad:
      "El precio en menú no incluye impuesto (~8-10%) ni propina. Si menú dice 30 USD, paga ~40 USD. Bring cash for bartender ($1-2/drink).",
  },
  {
    slug: "reino-unido",
    country: "Reino Unido",
    emoji: "🇬🇧",
    destinoSlug: "londres",
    oneLiner: "Respeto a la cola + politeness extrema + ironía sutil + pub culture.",
    saludo:
      "Apretón firme. Beso solo entre amigos cercanos. 'How are you?' = saludo, no pregunta. 'I'm fine, thanks' suficiente.",
    propinas:
      "10-15% restaurante (algunos lo añaden 'service charge'). Pub no es obligatorio. Taxi redondear. Hotel mozo 1-2 GBP.",
    vestuario:
      "Smart-casual general. Pub: casual. Theatre/Opera: chaqueta. Iglesia/funeral: oscuro. Lluvia constante = paraguas.",
    tabues: [
      "Saltarse cola (es ofensa moral)",
      "Hablar fuerte en transporte/restaurante",
      "Discutir Brexit con desconocidos",
      "Tocar a desconocidos (incluso de espaldas)",
      "Quejarse abiertamente (es muy 'unBritish')",
    ],
    gestos: {
      do: ["Respeta cola con paciencia infinita", "Decir 'sorry' por TODO (incluso si chocan contigo)", "Pequeño talk sobre clima"],
      dont: ["Saltarse cola", "Mostrar enfado público", "Llegar a pub sin saludar bartender"],
    },
    comida:
      "Fish & chips, sunday roast, full English breakfast. Pinta cerveza en pub. Curry indo-británico (post-colonial) es comida nacional secundaria.",
    curiosidad:
      "Ironía británica es sutil. 'Not bad' = excelente. 'Quite good' = mediocre. 'Interesting' = no me gusta. Los españoles toman literal = malentendidos.",
  },
  {
    slug: "china",
    country: "China",
    emoji: "🇨🇳",
    oneLiner: "Cultura confuciana + jerarquía + 'guanxi' (relaciones) + sincretismo.",
    saludo:
      "Apretón suave (no firme). Nombre completo (apellido primero). Tarjeta de visita con DOS manos. 'Nǐ hǎo' (hola).",
    propinas:
      "Históricamente no, ahora 10% en hoteles internacionales y restaurantes con extranjeros. Taxi NO. Guías privados: 50-100 CNY/día.",
    vestuario:
      "Modesto en templos budistas/taoístas. Modernidad en ciudades. Mujeres mejor cubierta hombros incluso verano caluroso.",
    tabues: [
      "Tabu del número 4 (suena como 'muerte' en mandarín)",
      "Regalar reloj (sugiere muerte)",
      "Regalar pañuelo blanco/funeral",
      "Discutir política (Tiananmen, Taiwán, Xinjiang)",
      "Mostrar suela del zapato",
    ],
    gestos: {
      do: ["Tarjetas/regalos con DOS manos", "Comer con palillos (chopsticks)", "Aceptar té ofrecido"],
      dont: ["Clavar palillos en arroz vertical (ritual funeral)", "Dejar palillos cruzados", "Tocar cabeza de adulto"],
    },
    comida:
      "Diversidad regional gigante: cantonés, sichuan, hunan, dongbei. Picante real en sichuan. Té siempre. Brindis con baijiu (40% alcohol).",
    curiosidad:
      "Apellido va PRIMERO. 'Mr. Wang' = es señor con apellido Wang. Saludar correctamente = primer paso de guanxi (relaciones, esencial en negocios).",
  },
  {
    slug: "mexico",
    country: "México",
    emoji: "🇲🇽",
    oneLiner: "Hospitalidad cálida + jerarquía respetada + indirecto cortés.",
    saludo:
      "Apretón mano hombre-hombre. Beso mejilla (1 derecha) mujer-mujer o hombre-mujer en social. Profesional: solo mano.",
    propinas:
      "10-15% restaurante (no siempre en bill). Cargador maleta 20-50 MXN. Taxi NO (excepto Uber: round-up). Hotelería 50 MXN/día housekeeping.",
    vestuario:
      "Casual playa. En ciudad (CDMX): smart casual. Iglesia: hombros cubiertos. Pueblo Mayan o indígena: respeto especial.",
    tabues: [
      "Decir 'estás gordo' (gordito es cariño, no gordo directo)",
      "Hablar mal de la Virgen Guadalupe",
      "Confundir mexicano con español (peninsular)",
      "Discutir narcotráfico ligero",
      "Llegar puntual (5-10 min tarde es la norma social)",
    ],
    gestos: {
      do: ["Aceptar comida ofrecida", "'Buen provecho' al comer y al ver comer", "Llamar 'señor/señora' formales"],
      dont: ["Confundir mexicano con 'español castellano'", "Hablar de drugs jokes", "Burlarse de mariachi/fiestas"],
    },
    comida:
      "Tacos al pastor, mole, chiles rellenos, tamales. PICANTE REAL (no como falafel). Frijoles + tortilla en todo. Tequila/mezcal con sal y limón.",
    curiosidad:
      "Día de los Muertos (1-2 nov) no es Halloween — es celebración familiar con ofrendas. Respeto absoluto cuando se ve cementerio decorado.",
  },
  {
    slug: "argentina",
    country: "Argentina",
    emoji: "🇦🇷",
    destinoSlug: "buenos-aires",
    oneLiner: "Cultura italo-rioplatense + asado social + pasión + 'voseo'.",
    saludo:
      "Beso mejilla (1, lado izquierdo) entre todos en social, incluso hombre-hombre amigos. Profesional: apretón firme y nombre.",
    propinas:
      "10% restaurante (raramente en bill). Bar 5-10 ARS/copa. Mozo hotel 50-100 ARS/maleta. Taxi NO (excepto si ayuda con maleta). Cambiar pesos en cueva (mercado paralelo, mejor cambio).",
    vestuario:
      "Smart-casual urbano (Buenos Aires con elegancia). Teatro: chaqueta. Asado: casual. Iglesia: cubierto modesto.",
    tabues: [
      "Confundir argentino con brasileño/chileno",
      "Decir 'tú' (se usa 'vos' — 'vos sos' no 'tú eres')",
      "Discutir Malvinas con desinformación",
      "Burlarse del tango o de Maradona",
      "Llegar puntual a fiesta privada (siempre 1h+ tarde)",
    ],
    gestos: {
      do: ["Aceptar mate (chupar y devolver — tradición)", "Comer asado con calma (5-6 horas)", "Decir 'che' (interjección amistosa)"],
      dont: ["Decir 'pasame el mate, gracias' (gracias = no quiero más)", "Llegar puntual a cena privada", "Pedir picante a la comida criolla"],
    },
    comida:
      "Asado sagrado domingo (3-6 PM). Bife de chorizo, empanadas, milanesa. Mate continuamente. Vino Malbec. Dulce de leche en todo.",
    curiosidad:
      "Voseo: el 'vos' reemplaza al 'tú' completamente. 'Vos podés' no 'tú puedes'. Es seña inconfundible del rioplatense. Los españoles parecen 'formales' con el 'tú'.",
  },
  // AUDIT-FULL-2 (24 may 2026): +5 países high-traffic
  {
    slug: "brasil",
    country: "Brasil",
    emoji: "🇧🇷",
    oneLiner: "Calidez personal + cuerpo cercano + 'jeitinho' (apaño informal).",
    saludo:
      "Beso 1 vez (Río) o 2 veces (São Paulo) entre mujeres o entre hombre-mujer en social. Hombres: abrazo + palmada espalda en amigos. Profesional: apretón firme.",
    propinas:
      "10% en restaurante (a veces ya incluido como 'serviço' — verifica bill). Taxi NO. Hotel mozo 5 R$/maleta. Garçom de bar: redondear o 10% si abierto.",
    vestuario:
      "Playa: bikini diminuto socialmente normal (no shorts encima). Ciudad: smart-casual relajado (pantalón corto sólo turistas). Iglesia: hombros cubiertos.",
    tabues: [
      "Comparar Brasil con Argentina (rivalidad histórica fútbol)",
      "Asumir que se habla español (es portugués)",
      "Hacer chistes con drogas (favelas no es Disney)",
      "Ostentar tecnología cara en zonas turísticas (asalto)",
      "Llegar puntual a fiesta privada (siempre 1-2h tarde)",
    ],
    gestos: {
      do: ["Sonreír mucho — gesto cultural clave", "Decir 'obrigado/a' al recibir cualquier cosa", "Aceptar comida ofrecida en casa"],
      dont: ["Gesto OK (puño con pulgar e índice circular) — es ofensivo grave", "Apuntar con dedo", "Hablar fuerte de política o Lula"],
    },
    comida:
      "Feijoada sábado (judías + carne ahumada). Pão de queijo, açaí, brigadeiro, caipirinha (lima + cachaça). Almoço 12-14h, cena 20h+.",
    curiosidad:
      "'Jeitinho brasileiro' es cultura: encontrar la forma de saltarse reglas amablemente. NO es corrupción — es flexibilidad social. Aprenderla = mejor experiencia turística (saltarte colas, conseguir mesa, descuentos).",
  },
  {
    slug: "egipto",
    country: "Egipto",
    emoji: "🇪🇬",
    destinoSlug: "el-cairo",
    oneLiner: "Hospitalidad árabe legendaria + regateo + influencia islámica conservadora.",
    saludo:
      "'As-salamu alaykum' + mano derecha (la izquierda es impura). Beso entre hombres amigos (mejilla). Mujer extranjera a hombre: sólo si ella ofrece mano. 'Habibi' como cariño universal.",
    propinas:
      "Baksheesh es OBLIGATORIO. Camarero 10%, mozo 10 EGP, taxi redondear, guía 50-100 EGP/día, fotógrafo en pirámides 20 EGP. Lleva billetes 5/10 EGP siempre.",
    vestuario:
      "Mujeres: cubrir hombros y rodillas en El Cairo/zonas religiosas. Resorts Sharm/Hurghada: bikini OK en playa privada. Mezquita: pañuelo cabeza (se prestan).",
    tabues: [
      "Mostrar suela del zapato (apuntar al rostro = insulto)",
      "Beso público entre pareja",
      "Mano izquierda para comer o saludar",
      "Fotografiar mujeres locales sin permiso",
      "Comer en público durante Ramadán (sol arriba)",
    ],
    gestos: {
      do: ["Aceptar té/café ofrecido (es cortesía clave)", "Regatear (50-70% del precio inicial)", "Vestir modesto en El Cairo"],
      dont: ["Negarse a hospitalidad sin agradecer enfático", "Mostrar fortuna ostentosa", "Discutir Israel/Palestina con desconocidos"],
    },
    comida:
      "Koshari (lentejas + arroz + pasta), ful medames, baklawa, té karkadé (hibisco). Pan baladi en todas comidas. No alcohol con musulmán conservador.",
    curiosidad:
      "El regateo es deporte social — no es ofensivo, es esperado. Salir caminando del puesto es estrategia válida y respetada. Si aceptas primer precio, el vendedor pierde respeto (no estás jugando el juego).",
  },
  {
    slug: "indonesia",
    country: "Indonesia",
    emoji: "🇮🇩",
    destinoSlug: "bali",
    oneLiner: "Mayoritariamente musulmana + Bali hindú. 'Senyum' (sonrisa) universal.",
    saludo:
      "Apretón suave (no firme), mano derecha. Inclinación leve cabeza para respeto a mayores. 'Selamat pagi/siang/malam' según hora. En Bali: 'Om Swastiastu' (saludo hindú).",
    propinas:
      "Bali 10% restaurante (a veces ya en bill como 'service'). Hotel mozo 10-15 K Rp. Guía 100-200 K Rp/día. Taxi NO. Bemo (mini-bus): pago acordado.",
    vestuario:
      "Bali: sarong + faja para templos (se prestan). Java/Sumatra (musulmana): cubre hombros y rodillas siempre. Playa: bikini OK pero sin shock visual al pasar pueblo.",
    tabues: [
      "Tocar cabeza de alguien (especialmente niños — sagrada en hinduismo)",
      "Apuntar pies a templo, ofrenda o persona",
      "Pasar por encima de ofrenda balinesa (canang sari en suelo)",
      "Beso público entre pareja",
      "Insultar el Islam (Java) o el hinduismo (Bali)",
    ],
    gestos: {
      do: ["Quitarse zapatos en templos y casas", "Sonreír siempre — incluso confuso o tenso", "Aceptar comida con mano derecha"],
      dont: ["Mano izquierda para comer/saludar", "Mostrar enfado público (perder cara)", "Apuntar con índice (usa pulgar)"],
    },
    comida:
      "Nasi goreng, mie goreng, rendang, sate ayam. Con mano derecha en algunos sitios tradicionales. Picante variable — pedir 'tidak pedas' si sensible.",
    curiosidad:
      "'Jam karet' (tiempo de goma): puntualidad relativa en Bali. Llegar 30-60 min tarde es socialmente OK. En Java es más estricto. Aprende a relajar el reloj — frustración por demoras es cultural friction principal.",
  },
  {
    slug: "vietnam",
    country: "Vietnam",
    emoji: "🇻🇳",
    destinoSlug: "vietnam",
    oneLiner: "Cultura confuciana + budista + influencia francesa. Hospitalidad cálida pero formal.",
    saludo:
      "Apretón suave con 2 manos para respeto. Inclinación leve a mayores. 'Xin chào' (hola). NO besos sociales. Nombre completo: apellido va primero (familia primero), nombre personal después.",
    propinas:
      "Históricamente no, ahora 5-10% en restaurante turístico. Spa: 20-50K VND. Hotel mozo: 20K VND/maleta. Taxi: redondear. Conductor moto particular: 50K VND/día.",
    vestuario:
      "Modesto en templos (pagodas) y zonas rurales. Ciudades modernas (Saigón, Hanói): relajado. Casa local: descalzarse al entrar.",
    tabues: [
      "Tocar cabeza de alguien (sagrado para budistas)",
      "Apuntar con pie a estatua de Buda",
      "Discutir Guerra de Vietnam con vietnamitas mayores",
      "Pedir cambio en dólares (se prefiere VND)",
      "Tomar fotos a militares o instalaciones gubernamentales",
    ],
    gestos: {
      do: ["Aceptar té ofrecido (cortesía clave)", "Quitarse zapatos en templos y casas", "Comer pho con palillos + cuchara"],
      dont: ["Mostrar enfado público (perder cara fatal)", "Tocar a desconocidos", "Beso público pareja"],
    },
    comida:
      "Pho (sopa fideos res/pollo), banh mi (bocadillo francés), goi cuon (rollo fresco). Café muy fuerte con leche condensada. Salsa de pescado en todo.",
    curiosidad:
      "Saigón se llama oficialmente Ho Chi Minh City pero todos dicen Saigón. Hanói es Hanói siempre. La división norte/sur sigue siendo cultural: norte más formal/confuciana, sur más relajada/comercial.",
  },
  {
    slug: "turquia",
    country: "Turquía",
    emoji: "🇹🇷",
    destinoSlug: "estambul",
    oneLiner: "Puente Europa-Asia. Hospitalidad legendaria + té omnipresente + influencia islámica moderada.",
    saludo:
      "Apretón firme + contacto visual. Beso doble mejilla entre amigos cercanos. Hombres mayores: mano derecha en pecho como respeto. 'Merhaba' (hola), 'Nasılsın?' (¿cómo estás?).",
    propinas:
      "10% restaurante (raramente en bill como 'servis'). Hotel mozo 10-20 TL. Taxi redondear. Spa hamam: 50-100 TL. Lokum (delicia turca) en mesa: gratis cortesía.",
    vestuario:
      "Mezquita: hombros y rodillas cubiertos OBLIGATORIO + pañuelo cabeza mujeres (se prestan en Mezquita Azul). Estambul moderno: smart casual. Costa egea/mediterránea: bikini OK.",
    tabues: [
      "Discutir Armenia con turcos (tema histórico tenso)",
      "Mostrar suela del zapato",
      "Hablar mal de Atatürk (fundador, casi sagrado)",
      "Negarse a té cuando se ofrece (es insulto)",
      "Tomar fotos en mezquita durante oración",
    ],
    gestos: {
      do: ["Aceptar té (siempre. Siempre)", "Regatear en zoco (50-60% precio inicial)", "Quitarse zapatos en mezquita"],
      dont: ["Decir gracias por té rechazado — di 'Çok teşekkürler' al aceptar", "Apuntar con dedo", "Discutir religión o Erdogan"],
    },
    comida:
      "Kebab, baklava, dolma, meze (entrantes). Té (çay) en vaso tulipán omnipresente. Café turco final comida. Raki en cena formal (anís).",
    curiosidad:
      "Té (çay) NO se rechaza nunca — es ritual social. Lo ofrecen al sentarse en restaurante, al entrar tienda, al esperar autobús. Aceptar = respeto. Rechazar = insulto leve. Si no puedes más, di 'doluyum' (lleno).",
  },
];

export const ETIQUETA_SLUGS: string[] = ETIQUETA_CATALOG.map((e) => e.slug);

export function getEtiqueta(slug: string): EtiquetaEntry | undefined {
  return ETIQUETA_CATALOG.find((e) => e.slug === slug.toLowerCase());
}
