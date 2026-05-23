/**
 * check_in_rules.ts — SSS427 (23 may 2026)
 *
 * Reglas de check-in por aerolínea para landings SEO
 * /check-in/[aerolinea]. Complementa /equipaje/[aerolinea].
 *
 * High-intent queries: "ryanair check-in cuando abre", "check-in
 * iberia online vs mostrador", "vueling fee mostrador",
 * "easyjet boarding pass impreso obligatorio".
 *
 * Datos verificados may 2026 — marcar lastUpdated.
 */

export interface CheckInRule {
  /** IATA code. */
  code: string;
  name: string;
  slug: string;
  emoji: string;
  lastUpdated: string;

  /** Online check-in ventana (cuando abre - cuando cierra). */
  online: {
    opens: string; // "60 días antes"
    closes: string; // "2 horas antes"
    method: string; // "Web + app móvil"
  };
  /** Si online es opcional o obligatorio. */
  onlineRequired: boolean;
  /** Boarding pass impreso/digital. */
  boardingPass: {
    digital: boolean;
    printed: "obligatorio" | "opcional" | "no_aceptado";
    note: string;
  };
  /** Tarifa por check-in en mostrador del aeropuerto. */
  airportCheckIn: {
    feeEur: number; // 0 = gratis
    detail: string;
  };
  /** Mostrador: cuándo abre y cierra. */
  airportCounter: {
    opens: string; // "3h antes vuelos largos / 2h cortos"
    closes: string; // "40 min antes"
  };
  /** Tips clave. */
  tips: string[];
  /** Errores típicos que cuestan dinero. */
  commonMistakes: string[];
  /** FAQ JSON-LD. */
  faq: Array<{ q: string; a: string }>;
}

export const CHECK_IN_RULES: CheckInRule[] = [
  {
    code: "FR",
    name: "Ryanair",
    slug: "ryanair",
    emoji: "🟦",
    lastUpdated: "2026-05",
    online: {
      opens: "60 días antes (sin Priority) / 30 días antes (con Priority)",
      closes: "2 horas antes del vuelo",
      method: "Web myRyanair + app móvil",
    },
    onlineRequired: true,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App móvil es válida en todos los aeropuertos europeos. Si no tienes app, imprimir antes de llegar al aeropuerto.",
    },
    airportCheckIn: {
      feeEur: 55,
      detail: "Check-in en mostrador cuesta €55 — sólo úsalo si no pudiste hacer online por causa justificada.",
    },
    airportCounter: {
      opens: "2 horas antes",
      closes: "40 min antes del vuelo",
    },
    tips: [
      "Haz el check-in online tan pronto puedas (60 días antes con Priority, 24h antes sin Priority).",
      "Descarga el boarding pass en la app — si no tienes datos en el aeropuerto, ya lo tendrás guardado offline.",
      "Verifica que tu DNI/pasaporte coincide exactamente con el nombre del billete antes de cerrar el check-in.",
    ],
    commonMistakes: [
      "No hacer check-in online → €55 en mostrador.",
      "Hacer check-in con nombre mal escrito → cambio de nombre €115 (€155 en aeropuerto).",
      "Quedarse sin batería sin boarding pass impreso → re-imprimir €20.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Ryanair?",
        a: "60 días antes del vuelo si tienes Priority Boarding o asiento reservado; 24 horas antes sin Priority. Cierra 2 horas antes del vuelo.",
      },
      {
        q: "¿Puedo hacer check-in con Ryanair en el mostrador del aeropuerto?",
        a: "Sí, pero cuesta €55 obligatorio. Ryanair te penaliza por no hacer el check-in online — sólo te lo perdonan si demuestras causa justificada.",
      },
      {
        q: "¿Es obligatorio imprimir el boarding pass en Ryanair?",
        a: "No. La app móvil es válida en todos los aeropuertos. Pero baja antes el PDF del boarding pass por si te quedas sin datos o batería.",
      },
    ],
  },
  {
    code: "VY",
    name: "Vueling",
    slug: "vueling",
    emoji: "🟨",
    lastUpdated: "2026-05",
    online: {
      opens: "7 días antes",
      closes: "1 hora antes (Schengen) / 1.5h antes (no-Schengen)",
      method: "Web vueling.com + app móvil",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App móvil válida. Print recomendado si vuelas a aeropuerto pequeño con escáner inestable.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Check-in mostrador gratis en Vueling. Pero llega con tiempo — la cola puede ser larga en BCN.",
    },
    airportCounter: {
      opens: "2.5h antes",
      closes: "45 min antes",
    },
    tips: [
      "Vueling permite check-in mostrador sin cargo (a diferencia de Ryanair).",
      "Hacer check-in online te da prioridad de embarque en algunas rutas.",
      "En BCN T1, las colas Vueling son largas en jul-ago — llega con 2.5h de antelación.",
    ],
    commonMistakes: [
      "No reservar asiento → te asignan el peor disponible al hacer check-in.",
      "Hacer check-in online con nombre erróneo — cambio €40 web / €70 aeropuerto.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Vueling?",
        a: "7 días antes del vuelo, cierra 1 hora antes (vuelos Schengen) o 1.5 horas (vuelos internacionales).",
      },
      {
        q: "¿Cobra Vueling por check-in en mostrador?",
        a: "No. El check-in en mostrador es gratuito, pero llega con 2-2.5h de antelación para evitar colas, especialmente en Barcelona T1.",
      },
      {
        q: "¿Sirve el boarding pass digital en Vueling?",
        a: "Sí, la app móvil de Vueling muestra el boarding pass digital aceptado en todos los aeropuertos. Recomendable también descargarlo en PDF.",
      },
    ],
  },
  {
    code: "U2",
    name: "easyJet",
    slug: "easyjet",
    emoji: "🟧",
    lastUpdated: "2026-05",
    online: {
      opens: "30 días antes",
      closes: "2 horas antes del vuelo",
      method: "Web easyjet.com + app móvil",
    },
    onlineRequired: true,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App móvil válida en todos los aeropuertos. Si no tienes app, descarga PDF antes.",
    },
    airportCheckIn: {
      feeEur: 30,
      detail: "easyJet cobra £25/€30 por check-in mostrador si no has hecho el online a tiempo.",
    },
    airportCounter: {
      opens: "2h antes",
      closes: "40 min antes",
    },
    tips: [
      "Haz check-in en cuanto se abra (30 días antes) para tener prioridad asignación asiento si no reservaste.",
      "El bag drop (depósito equipaje facturado) cierra 40 min antes — más estricto que la regla genérica.",
      "easyJet Plus members tienen check-in flexible hasta 2h antes sin recargo.",
    ],
    commonMistakes: [
      "No diferenciar check-in (online) de bag drop (mostrador) → llegar 50min antes pensando que estás OK y perderlo.",
      "Pensar que app sustituye al DNI/pasaporte físico — siempre obligatorio mostrar documento original.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en easyJet?",
        a: "30 días antes del vuelo. Cierra 2 horas antes del vuelo. Hacer check-in online es obligatorio o pagas £25/€30 en mostrador.",
      },
      {
        q: "¿Cuánto cuesta el check-in en mostrador con easyJet?",
        a: "£25/€30 por persona y dirección si no hiciste el check-in online a tiempo.",
      },
      {
        q: "¿Se acepta el boarding pass en el móvil con easyJet?",
        a: "Sí, en todos los aeropuertos europeos. La app móvil es válida. PDF también funciona.",
      },
    ],
  },
  {
    code: "IB",
    name: "Iberia",
    slug: "iberia",
    emoji: "🇪🇸",
    lastUpdated: "2026-05",
    online: {
      opens: "30 días antes (vuelo doméstico) / 24h antes (internacional)",
      closes: "1 hora antes (doméstico) / 2 horas antes (internacional)",
      method: "Web iberia.com + app móvil + kiosco aeropuerto",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF aceptados. Kioscos en T4 (Madrid) y T1 (BCN) emiten boarding pass impreso gratis.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Check-in mostrador gratuito. Sin penalización por hacerlo allí.",
    },
    airportCounter: {
      opens: "3h antes (internacional) / 2h (doméstico)",
      closes: "45 min antes",
    },
    tips: [
      "T4 (Madrid) tiene kioscos express en zona check-in — si no tienes equipaje facturado, evita la cola del mostrador.",
      "Hacer check-in online libera tiempo para usar lounge Velázquez/Dalí si eres Gold/Platinum.",
      "Iberia Plus members pueden hacer check-in con conexiones automáticas.",
    ],
    commonMistakes: [
      "Olvidar imprimir documentación visado para destinos requeridos — Iberia verifica antes de embarque.",
      "Llegar a 45 min antes en mostrador internacional — cierra y se pierde el vuelo aunque haya llegado tarde la cola.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online de Iberia?",
        a: "30 días antes para vuelos domésticos, 24-48 horas antes para vuelos internacionales. Cierra 1-2 horas antes del vuelo.",
      },
      {
        q: "¿Iberia cobra por check-in en mostrador?",
        a: "No. El check-in en mostrador es gratuito en todos los vuelos Iberia. Pero llega con 3h de antelación en internacional.",
      },
      {
        q: "¿Acepta Iberia boarding pass digital en el móvil?",
        a: "Sí, en todos los aeropuertos. App Iberia o PDF descargado funcionan. También hay kioscos auto-check-in en T4 Madrid y T1 Barcelona.",
      },
    ],
  },
  {
    code: "W6",
    name: "Wizz Air",
    slug: "wizz",
    emoji: "🟪",
    lastUpdated: "2026-05",
    online: {
      opens: "48 horas antes (sin Priority) / 60 días antes (con Priority/WIZZ Plus)",
      closes: "3 horas antes del vuelo",
      method: "Web wizzair.com + app móvil",
    },
    onlineRequired: true,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App móvil aceptada. PDF también funciona.",
    },
    airportCheckIn: {
      feeEur: 35,
      detail: "Wizz cobra €35 por check-in mostrador. Llega ya con check-in hecho.",
    },
    airportCounter: {
      opens: "2.5h antes",
      closes: "40 min antes",
    },
    tips: [
      "Haz check-in tan pronto puedas — el plazo de 3h antes es muy estricto, sin excepciones.",
      "Wizz Discount Club members pueden hacer check-in con prioridad de embarque incluida.",
      "Cargo de mostrador €35 puede ser superado solo si pruebas falla técnica del sistema online (raro).",
    ],
    commonMistakes: [
      "No hacer check-in dentro del plazo → €35 en mostrador.",
      "Comprar equipaje extra en aeropuerto en lugar de online → 3x más caro.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Wizz Air?",
        a: "48 horas antes para tarifas básicas, 60 días antes con Priority Boarding o WIZZ Plus. Cierra 3 horas antes del vuelo.",
      },
      {
        q: "¿Cuánto cuesta el check-in en mostrador con Wizz Air?",
        a: "€35 por persona y vuelo. Mostrador es solo como último recurso.",
      },
      {
        q: "¿Acepta Wizz Air el boarding pass en el móvil?",
        a: "Sí, en todos los aeropuertos. La app Wizz muestra el boarding pass digital.",
      },
    ],
  },
  {
    code: "LH",
    name: "Lufthansa",
    slug: "lufthansa",
    emoji: "🟦",
    lastUpdated: "2026-05",
    online: {
      opens: "23 horas antes",
      closes: "45 min antes (doméstico) / 60 min antes (internacional)",
      method: "Web lufthansa.com + app móvil + WhatsApp boarding pass",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF aceptados. Servicio único: boarding pass por WhatsApp si activas notificaciones.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Check-in mostrador gratuito en todos los vuelos Lufthansa.",
    },
    airportCounter: {
      opens: "3h antes (internacional) / 2h (doméstico)",
      closes: "45 min antes (doméstico) / 1h (internacional)",
    },
    tips: [
      "Lufthansa permite boarding pass por WhatsApp — activa notificaciones al hacer check-in.",
      "Status Senator/HON Circle members tienen check-in priority + cierre flexible.",
      "FRA (Frankfurt) tiene kioscos auto-check-in muy eficientes — usa esos antes que el mostrador.",
    ],
    commonMistakes: [
      "Llegar 50 min antes pensando que basta para vuelo internacional — el cierre es 1h.",
      "No verificar documentación visa en check-in — Lufthansa puede denegar embarque sin compensación.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Lufthansa?",
        a: "23 horas antes del vuelo. Cierra 45 min (vuelos domésticos) o 60 min antes (internacionales).",
      },
      {
        q: "¿Cobra Lufthansa por check-in en mostrador?",
        a: "No. Check-in mostrador gratuito en todos los vuelos.",
      },
      {
        q: "¿Puedo recibir el boarding pass por WhatsApp con Lufthansa?",
        a: "Sí, Lufthansa ofrece notificación del boarding pass por WhatsApp si lo activas al hacer check-in online.",
      },
    ],
  },
  {
    code: "AF",
    name: "Air France",
    slug: "air-france",
    emoji: "🇫🇷",
    lastUpdated: "2026-05",
    online: {
      opens: "30 horas antes",
      closes: "30 min antes (doméstico) / 60 min (internacional)",
      method: "Web airfrance.com + app móvil",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF aceptados. CDG tiene kioscos en todas las terminales.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Mostrador gratuito en todos los vuelos.",
    },
    airportCounter: {
      opens: "3h antes (internacional) / 1.5h (doméstico)",
      closes: "45 min antes (corto) / 1h (largo)",
    },
    tips: [
      "CDG (Paris) requiere llegar con tiempo extra — los traslados entre terminales son lentos.",
      "Flying Blue members tienen check-in priority gratis.",
      "Usa kioscos en CDG/ORY si no tienes equipaje — más rápido que cola mostrador.",
    ],
    commonMistakes: [
      "Llegar a CDG con poco tiempo y perder vuelo por seguridad lenta — separa terminales 2A/2B/2C/2D/2E/2F.",
      "No confirmar la terminal de salida — Air France usa múltiples en CDG.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Air France?",
        a: "30 horas antes del vuelo. Cierra 30 min (doméstico) o 60 min antes (internacional).",
      },
      {
        q: "¿Cobra Air France por check-in en mostrador?",
        a: "No. Mostrador gratuito en todos los vuelos.",
      },
      {
        q: "¿Boarding pass digital aceptado en Air France?",
        a: "Sí, app y PDF aceptados en todos los aeropuertos. Kioscos disponibles en CDG y ORY.",
      },
    ],
  },
  {
    code: "BA",
    name: "British Airways",
    slug: "british-airways",
    emoji: "🇬🇧",
    lastUpdated: "2026-05",
    online: {
      opens: "24 horas antes",
      closes: "1 hora antes",
      method: "Web ba.com + app móvil",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF aceptados. LHR tiene kioscos en todas las terminales.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Mostrador gratuito en todos los vuelos.",
    },
    airportCounter: {
      opens: "3h antes (internacional) / 2h (doméstico UK)",
      closes: "1h antes",
    },
    tips: [
      "BA opera 5 terminales en LHR (T1-T5) + Heathrow Express conecta T5 con T2/T3. Verifica terminal.",
      "Executive Club members tienen check-in priority + lounge access.",
      "Visados UK requieren mostrar documentación al check-in — sin ella, denegación de embarque.",
    ],
    commonMistakes: [
      "Llegar a LHR sin saber terminal exacta — pierdes 30 min mínimo en cambio.",
      "No verificar visado UK requerido para tu nacionalidad → denegación embarque.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en British Airways?",
        a: "24 horas antes del vuelo. Cierra 1 hora antes del vuelo.",
      },
      {
        q: "¿Boarding pass digital en British Airways?",
        a: "Sí, app + PDF aceptados. Kioscos en LHR T2/T3/T5.",
      },
      {
        q: "¿BA cobra por check-in en mostrador?",
        a: "No. Mostrador gratuito en todos los vuelos.",
      },
    ],
  },
  {
    code: "KL",
    name: "KLM",
    slug: "klm",
    emoji: "🇳🇱",
    lastUpdated: "2026-05",
    online: {
      opens: "30 horas antes",
      closes: "1 hora antes (Schengen) / 1.5h (no-Schengen)",
      method: "Web klm.com + app móvil + WhatsApp boarding pass",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF + WhatsApp. KLM lidera digital boarding.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Mostrador gratuito en todos los vuelos.",
    },
    airportCounter: {
      opens: "2.5h antes",
      closes: "40 min antes",
    },
    tips: [
      "AMS (Amsterdam Schiphol) tiene self-service drop bag — más rápido que mostrador.",
      "Flying Blue Silver+ tiene priority drop-off + fast track security.",
      "KLM permite cambio de gate via app — activa notificaciones.",
    ],
    commonMistakes: [
      "No descargar boarding pass offline → problemas si Schiphol WiFi cae.",
      "Llegar 35 min antes — el cierre es 40 min.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online de KLM?",
        a: "30 horas antes del vuelo. Cierra 1 hora antes (Schengen) o 1.5 horas (no-Schengen).",
      },
      {
        q: "¿KLM cobra por check-in mostrador?",
        a: "No. Mostrador gratuito.",
      },
      {
        q: "¿Boarding pass por WhatsApp con KLM?",
        a: "Sí, KLM ofrece boarding pass por WhatsApp si lo activas al check-in online.",
      },
    ],
  },
  {
    code: "TK",
    name: "Turkish Airlines",
    slug: "turkish-airlines",
    emoji: "🇹🇷",
    lastUpdated: "2026-05",
    online: {
      opens: "24 horas antes",
      closes: "90 min antes (internacional) / 60 min (doméstico)",
      method: "Web turkishairlines.com + app móvil",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "obligatorio",
      note: "Hub IST aún pide boarding pass impreso en algunos puntos — imprime por seguridad.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Mostrador gratuito.",
    },
    airportCounter: {
      opens: "3h antes (internacional)",
      closes: "60 min antes (internacional) / 30 min (doméstico)",
    },
    tips: [
      "IST (Estambul) es enorme — calcula 30 min mínimo entre check-in y gate.",
      "Free Istanbul stopover program: si tu layover es >20h, hotel + tour gratuito con Turkish.",
      "Miles&Smiles Elite/Plus tiene fast track + lounge.",
    ],
    commonMistakes: [
      "No imprimir boarding pass para vuelos via IST → cola adicional en gate.",
      "No comprobar visa Turquía si stopover >24h (eVisa $20).",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online de Turkish Airlines?",
        a: "24 horas antes del vuelo. Cierra 90 min antes (internacional) o 60 min (doméstico).",
      },
      {
        q: "¿Tengo que imprimir el boarding pass con Turkish?",
        a: "Recomendado para vuelos via IST. La app digital es válida pero algunos controles secundarios piden papel.",
      },
      {
        q: "¿Turkish ofrece hotel gratis en stopover Estambul?",
        a: "Sí, si tu layover es >20h en IST, Turkish ofrece hotel + tour gratuitos con su programa Free Istanbul.",
      },
    ],
  },
  {
    code: "DY",
    name: "Norwegian",
    slug: "norwegian",
    emoji: "🟥",
    lastUpdated: "2026-05",
    online: {
      opens: "24 horas antes",
      closes: "1 hora antes",
      method: "Web norwegian.com + app móvil",
    },
    onlineRequired: true,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App móvil aceptada. PDF también.",
    },
    airportCheckIn: {
      feeEur: 40,
      detail: "Norwegian cobra €40 por check-in mostrador si no hiciste el online.",
    },
    airportCounter: {
      opens: "2h antes",
      closes: "45 min antes",
    },
    tips: [
      "Norwegian Premium tiene check-in priority + bag drop dedicado.",
      "Para vuelos transatlánticos (Norwegian Air long-haul reemplazado por norse), confirmar siempre nuevo PNR.",
    ],
    commonMistakes: [
      "No diferenciar Norwegian (DY) de Norse Atlantic (N0) — son aerolíneas distintas tras 2022.",
      "Pagar mostrador €40 cuando podías haber hecho online en 2 min.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Norwegian?",
        a: "24 horas antes del vuelo. Cierra 1 hora antes.",
      },
      {
        q: "¿Norwegian cobra por mostrador?",
        a: "Sí, €40 por persona si no hiciste el check-in online a tiempo.",
      },
      {
        q: "¿Boarding pass digital aceptado?",
        a: "Sí, app + PDF válidos en todos los aeropuertos.",
      },
    ],
  },
  {
    code: "EK",
    name: "Emirates",
    slug: "emirates",
    emoji: "🇦🇪",
    lastUpdated: "2026-05",
    online: {
      opens: "48 horas antes",
      closes: "90 min antes",
      method: "Web emirates.com + app móvil",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF aceptados. Recomendado imprimir para conexiones internacionales largas.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Mostrador gratuito. Tiene check-in dedicado para Business/First.",
    },
    airportCounter: {
      opens: "4h antes (internacional)",
      closes: "60 min antes",
    },
    tips: [
      "DXB (Dubai) tiene Emirates check-in en hotel para algunos resorts — pregunta en recepción.",
      "Business/First tienen lounge dedicado en T3 DXB — el mejor de la red mundial.",
      "Emirates Skywards Gold tiene priority + extra equipaje.",
    ],
    commonMistakes: [
      "Llegar a DXB sin tiempo para inmigración si vienes en tránsito >6h — necesitas eVisa.",
      "No confirmar terminal — Emirates usa solo T3 en DXB.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online de Emirates?",
        a: "48 horas antes. Cierra 90 min antes del vuelo.",
      },
      {
        q: "¿Emirates cobra por mostrador?",
        a: "No. Mostrador gratuito. Hay check-in dedicado para Business/First.",
      },
      {
        q: "¿Emirates acepta boarding pass digital?",
        a: "Sí, app + PDF. Para conexiones largas recomendado tener impreso por si acaso.",
      },
    ],
  },
  {
    code: "QR",
    name: "Qatar Airways",
    slug: "qatar-airways",
    emoji: "🇶🇦",
    lastUpdated: "2026-05",
    online: {
      opens: "48 horas antes",
      closes: "90 min antes",
      method: "Web qatarairways.com + app móvil",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF. DOH (Doha) acepta digital.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Mostrador gratuito.",
    },
    airportCounter: {
      opens: "3.5h antes (internacional)",
      closes: "60 min antes",
    },
    tips: [
      "DOH (Hamad International) lidera rankings World Airport — lounge Privilege de Qatar es referencia.",
      "Programa Discover Qatar: si layover >5h y <24h, tour gratis a Doha.",
      "Qatar Privilege Club Platinum tiene chauffeur incluido al aeropuerto.",
    ],
    commonMistakes: [
      "No aprovechar Discover Qatar si layover suficiente — desperdicia oportunidad de tour gratis.",
      "Pensar que Qatar y Emirates son intercambiables — programas, alianzas, lounges distintos.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Qatar Airways?",
        a: "48 horas antes. Cierra 90 min antes del vuelo.",
      },
      {
        q: "¿Qatar Airways tiene tour gratis en Doha?",
        a: "Sí, Discover Qatar ofrece tour Doha gratuito si tu layover es entre 5 y 24 horas.",
      },
      {
        q: "¿Qatar cobra por mostrador?",
        a: "No. Mostrador gratuito.",
      },
    ],
  },
  {
    code: "TP",
    name: "TAP Air Portugal",
    slug: "tap-portugal",
    emoji: "🇵🇹",
    lastUpdated: "2026-05",
    online: {
      opens: "32 horas antes",
      closes: "60 min antes (Schengen) / 90 min (no-Schengen)",
      method: "Web flytap.com + app móvil",
    },
    onlineRequired: false,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF aceptados.",
    },
    airportCheckIn: {
      feeEur: 0,
      detail: "Mostrador gratuito.",
    },
    airportCounter: {
      opens: "2.5h antes",
      closes: "45 min antes",
    },
    tips: [
      "LIS (Lisboa) Humberto Delgado es un hub estrecho — separa terminales doméstico/internacional.",
      "TAP Stopover Lisboa: hasta 5 noches gratis en Lisboa o Porto con vuelo trans-atlántico.",
      "Miles&Go Gold/Platinum tiene priority + bagaje extra.",
    ],
    commonMistakes: [
      "No aprovechar el stopover gratis Lisboa — TAP es la mejor opción Europa-Sudamérica.",
      "Llegar tarde a LIS T1/T2 conexión sin tiempo suficiente.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en TAP?",
        a: "32 horas antes. Cierra 60 min antes (Schengen) o 90 min (no-Schengen).",
      },
      {
        q: "¿TAP cobra por mostrador?",
        a: "No. Mostrador gratuito.",
      },
      {
        q: "¿TAP tiene stopover gratis en Lisboa?",
        a: "Sí, hasta 5 noches gratis en Lisboa o Porto en vuelos trans-atlánticos con su programa TAP Portugal Stopover.",
      },
    ],
  },
  {
    code: "EI",
    name: "Aer Lingus",
    slug: "aer-lingus",
    emoji: "🇮🇪",
    lastUpdated: "2026-05",
    online: {
      opens: "30 horas antes",
      closes: "45 min antes",
      method: "Web aerlingus.com + app móvil",
    },
    onlineRequired: true,
    boardingPass: {
      digital: true,
      printed: "opcional",
      note: "App + PDF aceptados.",
    },
    airportCheckIn: {
      feeEur: 30,
      detail: "Aer Lingus cobra €30 por check-in mostrador si no hiciste el online.",
    },
    airportCounter: {
      opens: "2h antes",
      closes: "30 min antes",
    },
    tips: [
      "DUB (Dublin) tiene U.S. Preclearance — pasas inmigración USA en Irlanda, ganas tiempo al llegar.",
      "AerClub Platinum tiene priority + lounges Heathrow.",
      "Vuelos Aer Lingus a USA usan T2 en DUB — separa del resto.",
    ],
    commonMistakes: [
      "No aprovechar U.S. Preclearance Dublin — perderás horas de cola al llegar a USA.",
      "No hacer check-in online → €30 mostrador.",
    ],
    faq: [
      {
        q: "¿Cuándo abre el check-in online en Aer Lingus?",
        a: "30 horas antes. Cierra 45 min antes del vuelo.",
      },
      {
        q: "¿Aer Lingus cobra por mostrador?",
        a: "Sí, €30 si no hiciste el check-in online.",
      },
      {
        q: "¿Aer Lingus tiene preclearance USA?",
        a: "Sí, Dublin tiene U.S. Preclearance — pasas inmigración USA en Dublin y llegas como vuelo doméstico a USA.",
      },
    ],
  },
];

export const CHECK_IN_BY_SLUG: Record<string, CheckInRule> = Object.fromEntries(
  CHECK_IN_RULES.map((r) => [r.slug, r]),
);

export const CHECK_IN_SLUGS = CHECK_IN_RULES.map((r) => r.slug);

export function getCheckInRule(slug: string): CheckInRule | null {
  return CHECK_IN_BY_SLUG[slug] ?? null;
}
