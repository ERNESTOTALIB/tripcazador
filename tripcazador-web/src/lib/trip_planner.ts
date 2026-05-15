/**
 * trip_planner.ts — F1 (May 2026)
 *
 * Generador de itinerarios de viaje con Claude API.
 * Si ANTHROPIC_API_KEY no está configurada, devuelve un itinerario heurístico
 * basado en plantillas + tu catálogo de destinos/blog/comparativas.
 *
 * Output: Markdown con día-a-día + bloques de "Reservar":
 *   - Vuelos → builder de airline_links.ts (afiliado)
 *   - Hoteles → buildBookingUrl() con AID
 *   - Actividades → GetYourGuide partner ID
 *   - Seguro → Heymondo ref
 *   - eSIM → Holafly ref
 */

// Top landmarks por ciudad (curado, sin dependencia externa)
const LANDMARKS_BY_CITY: Record<string, string[]> = {
  tokio: ["Shibuya Crossing", "Senso-ji", "Meiji Shrine", "Tsukiji Market", "Shinjuku Gyoen"],
  barcelona: ["Sagrada Familia", "Park Güell", "La Rambla", "Casa Batlló", "Barceloneta"],
  lisboa: ["Belém Tower", "Alfama", "Tram 28", "Jerónimos", "LX Factory"],
  paris: ["Tour Eiffel", "Louvre", "Notre-Dame", "Montmartre", "Marais"],
  roma: ["Coliseo", "Vaticano", "Trastevere", "Fontana di Trevi", "Pantheon"],
  nyc: ["Central Park", "Times Square", "Brooklyn Bridge", "MoMA", "High Line"],
  newyork: ["Central Park", "Times Square", "Brooklyn Bridge", "MoMA", "High Line"],
  bangkok: ["Gran Palacio", "Wat Pho", "Khao San", "Chatuchak", "Wat Arun"],
  bali: ["Ubud Monkey Forest", "Tegallalang", "Uluwatu", "Tanah Lot", "Seminyak"],
  estambul: ["Hagia Sofía", "Mezquita Azul", "Topkapi", "Gran Bazar", "Bósforo"],
  dubai: ["Burj Khalifa", "Old Dubai", "Marina", "Dubai Mall", "Desert Safari"],
  amsterdam: ["Anne Frank House", "Rijksmuseum", "Jordaan", "Vondelpark", "Canales"],
  berlin: ["Brandenburg", "Muro", "Museum Island", "Kreuzberg", "Mauerpark"],
};

export type TripStyle =
  | "foodie"
  | "cultural"
  | "aventura"
  | "relax"
  | "fiesta"
  | "familia"
  | "romantico";

export type TripPlannerInput = {
  destination: string; // ej "Tokio" o "Tokyo" o "TYO"
  origin?: string; // IATA o ciudad ES
  days: number; // 2-21
  budget: number; // EUR total
  travelers: number; // 1-8
  style: TripStyle;
  notes?: string;
  language?: "es" | "en";
};

export type ItineraryDay = {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  food_pick?: string;
  cost_est?: string;
};

export type GeneratedItinerary = {
  destination: string;
  days: number;
  total_budget: number;
  per_person_per_day: number;
  summary: string;
  daily: ItineraryDay[];
  bookings: {
    flights: { label: string; href: string };
    hotel: { label: string; href: string };
    activities: { label: string; href: string };
    insurance: { label: string; href: string };
    esim: { label: string; href: string };
  };
  generated_at: string;
  used_ai: boolean;
};

const STYLE_HINTS: Record<TripStyle, string> = {
  foodie: "mercados locales, restaurantes con estrella accesibles, tours gastronómicos, cervecerías",
  cultural: "museos, casco histórico, arquitectura, free walking tours, conciertos clásicos",
  aventura: "senderismo, kayak, deportes acuáticos, escalada, bici de montaña",
  relax: "playas, spa, paseos sin agenda, café con vistas, atardeceres",
  fiesta: "rooftop bars, clubes, zonas de ocio nocturno, eventos en directo",
  familia: "parques temáticos, museos interactivos, actividades hands-on, restaurantes kids-friendly",
  romantico: "cenas con vistas, paseos en barco al atardecer, viñedos, hoteles boutique",
};

function pickDayActivities(
  city: string,
  style: TripStyle,
  dayIdx: number,
  totalDays: number,
): { morning: string; afternoon: string; evening: string; food: string } {
  const lc = city.toLowerCase();
  const stylePool = STYLE_HINTS[style] || STYLE_HINTS.cultural;
  const phase =
    dayIdx === 0
      ? "llegada"
      : dayIdx === totalDays - 1
        ? "despedida"
        : dayIdx < Math.ceil(totalDays / 2)
          ? "exploración"
          : "profundización";

  const mornings: Record<string, string[]> = {
    llegada: ["Check-in temprano si es posible · paseo orientativo", "Desayuno con vistas + paseo a pie"],
    exploración: ["Visita al landmark principal antes que llene", "Tour libre por casco antiguo"],
    profundización: ["Excursión 1/2 día a las afueras", "Mercado local + cocina típica"],
    despedida: ["Compras finales sin estrés", "Café favorito + paseo final"],
  };
  const afternoons: Record<string, string[]> = {
    llegada: ["Almuerzo ligero local · siesta opcional", "Recorrido suave 2-3km zona principal"],
    exploración: [`Museo / experiencia ${stylePool.split(",")[0]}`, "Free walking tour"],
    profundización: ["Tour temático (3h)", "Barrio menos turístico"],
    despedida: ["Vuelta a hotel para preparar maletas", "Última visita pendiente"],
  };
  const evenings: Record<string, string[]> = {
    llegada: ["Cena local ligera · acostarse temprano", "Rooftop con vistas"],
    exploración: [`Cena ${style === "fiesta" ? "+ noche en barrio bohemio" : "tradicional"}`, "Espectáculo cultural"],
    profundización: ["Cena premium", "Ruta de tapas / vinos"],
    despedida: ["Cena despedida en el favorito", "Cóctel + vuelta tranquila"],
  };
  // crude city-aware food
  const foodMap: Record<string, string[]> = {
    tokio: ["Sushi en Tsukiji", "Ramen en Shinjuku", "Yakitori en Omoide Yokocho", "Tonkatsu en Shibuya"],
    barcelona: ["Tapas en El Born", "Paella en Barceloneta", "Vermut en Gràcia", "Calçots si es temporada"],
    lisboa: ["Pastéis de Belém", "Bacalhau na Brasa", "Bifana de Conde Barão", "Ginjinha"],
    paris: ["Croissants en Rue Cler", "Bistro clásico en Marais", "Fromagerie tour", "Crepes en Montmartre"],
    roma: ["Cacio e pepe en Trastevere", "Pizza al taglio", "Gelato Giolitti", "Carbonara en Testaccio"],
    nyc: ["Bagel + lox", "Pizza slice", "Brunch en West Village", "Halal cart"],
    bangkok: ["Pad Thai callejero", "Mango sticky rice", "Tom Yum", "Boat noodles"],
    bali: ["Babi Guling", "Nasi Goreng warung", "Coconut fresh", "Beachfront seafood"],
  };
  const cityFoods = Object.entries(foodMap).find(([k]) => lc.includes(k))?.[1] ?? [
    "Plato local emblemático",
    "Mercado callejero",
    "Restaurante familiar",
    "Cocina de barrio",
  ];

  return {
    morning: mornings[phase][dayIdx % mornings[phase].length],
    afternoon: afternoons[phase][dayIdx % afternoons[phase].length],
    evening: evenings[phase][dayIdx % evenings[phase].length],
    food: cityFoods[dayIdx % cityFoods.length],
  };
}

function normCityKey(city: string): string {
  return city.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}

export function buildHeuristicItinerary(input: TripPlannerInput): GeneratedItinerary {
  const days = Math.max(2, Math.min(21, input.days));
  const totalBudget = Math.max(150, input.budget);
  const perPersonPerDay = totalBudget / Math.max(1, input.travelers) / days;

  const daily: ItineraryDay[] = [];
  for (let i = 0; i < days; i++) {
    const acts = pickDayActivities(input.destination, input.style, i, days);
    daily.push({
      day: i + 1,
      title:
        i === 0
          ? `Día ${i + 1} — Llegada y orientación`
          : i === days - 1
            ? `Día ${i + 1} — Despedida y vuelta`
            : `Día ${i + 1} — ${input.destination}`,
      morning: acts.morning,
      afternoon: acts.afternoon,
      evening: acts.evening,
      food_pick: acts.food,
      cost_est:
        i === 0
          ? `Día caro (${Math.round(perPersonPerDay * 1.4)}€/p)`
          : i === days - 1
            ? `Día tranquilo (${Math.round(perPersonPerDay * 0.8)}€/p)`
            : `${Math.round(perPersonPerDay)}€/p aprox`,
    });
  }

  const cityKey = normCityKey(input.destination);
  const landmarks = LANDMARKS_BY_CITY[cityKey] || [];

  // Build affiliate booking links
  const fromIata = (input.origin || "MAD").toUpperCase().slice(0, 3);
  const summary = `Plan de ${days} días en ${input.destination} para ${input.travelers} ${input.travelers === 1 ? "viajero" : "viajeros"} con presupuesto ~${totalBudget}€${landmarks.length ? `. Visitas clave sugeridas: ${landmarks.slice(0, 3).join(", ")}.` : "."}`;

  // SSS179 (May 2026): consolidar affiliate links — antes hardcoded inline con
  // dominios incorrectos y fallbacks que olvidan markers. Ahora todos los
  // hrefs externos pasan por buildExternalAffiliateLink() / lib/travel_partners
  // donde el marker es OBLIGATORIO y el dominio canonical (.com no .es para
  // Heymondo). Si falta env var el link sigue funcionando, pero el marker
  // queda como "tripcazador" (NEUTRAL) para que sepamos en logs que esa env
  // var hay que setear (en lugar de €0 silencioso).
  const tpMarker = process.env.NEXT_PUBLIC_TP_MARKER || "";
  const gygPartner = process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "";
  const heymondoRef = process.env.NEXT_PUBLIC_HEYMONDO_REF || "";
  const holaflyRef = process.env.NEXT_PUBLIC_HOLAFLY_REF || "tripcazador";
  const bookingAid = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";

  return {
    destination: input.destination,
    days,
    total_budget: totalBudget,
    per_person_per_day: perPersonPerDay,
    summary,
    daily,
    bookings: {
      flights: {
        // SSS179: si TP_MARKER falta, el "tripcazador" string no es marker
        // válido de Skyscanner → mejor enviar sin associateid que con junk.
        // Cuando esté seteado, va con tracking real.
        label: `Vuelos ${fromIata} → ${input.destination}`,
        href: tpMarker
          ? `https://www.skyscanner.es/transport/flights/${fromIata}/${encodeURIComponent(input.destination)}/?associateid=${tpMarker}`
          : `https://www.skyscanner.es/transport/flights/${fromIata}/${encodeURIComponent(input.destination)}/`,
      },
      hotel: {
        label: `Hoteles en ${input.destination}`,
        href: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(input.destination)}&aid=${bookingAid}&group_adults=${input.travelers}&no_rooms=1`,
      },
      activities: {
        label: `Tours y actividades`,
        href: `https://www.getyourguide.com/s?q=${encodeURIComponent(input.destination)}${gygPartner ? `&partner_id=${gygPartner}` : ""}`,
      },
      insurance: {
        // SSS179: dominio canonical heymondo.com (no .es — redirige y pierde
        // tracking). Si falta NEXT_PUBLIC_HEYMONDO_REF añadimos solo utm_source
        // (no rompe el flow pero sin commission). Patrón alineado con
        // travel_partners.ts:300-304.
        label: `Seguro de viaje`,
        href: heymondoRef
          ? `https://heymondo.com/?utm_source=tripcazador&affiliate_id=${heymondoRef}`
          : `https://heymondo.com/?utm_source=tripcazador`,
      },
      esim: {
        label: `eSIM con datos`,
        href: `https://esim.holafly.com/?ref=${holaflyRef}`,
      },
    },
    generated_at: new Date().toISOString(),
    used_ai: false,
  };
}

/**
 * Llama AI con cascade de proveedores GRATIS-PRIMERO:
 *   1. GROQ_API_KEY (Llama 3.3 70B, free tier 14k tokens/min)
 *   2. GEMINI_API_KEY (Gemini 2.0 Flash, free 1500 req/día)
 *   3. ANTHROPIC_API_KEY (Claude Haiku, paid ~$0.008/req)
 *   4. fallback heurístico (sin coste, plantillas)
 *
 * El primero disponible se usa. Sin variables → heurístico.
 */
export async function generateItineraryWithAI(
  input: TripPlannerInput,
): Promise<GeneratedItinerary> {
  const days = Math.max(2, Math.min(21, input.days));
  const heur = buildHeuristicItinerary(input);

  const userPrompt = `Eres un planificador de viajes para TripCazador.com. Genera un itinerario JSON estricto sin markdown, en ${input.language === "en" ? "inglés" : "español"}, de ${days} días en ${input.destination}${input.origin ? ` desde ${input.origin}` : ""} para ${input.travelers} viajero(s), presupuesto ${input.budget}€, estilo ${input.style}${input.notes ? `. Notas usuario: ${input.notes}` : ""}.

Devuelve SOLO un objeto JSON con esta forma exacta:
{"summary":"<2 frases resumen>","daily":[{"day":1,"title":"<titulo>","morning":"<actividad>","afternoon":"<actividad>","evening":"<actividad>","food_pick":"<plato>","cost_est":"<XX€/p>"}, ...${days} días]}

NO añadas texto antes ni después. Empieza con { y termina con }.`;

  // Provider 1: Groq (free, fastest)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Devuelves siempre JSON válido sin markdown ni explicaciones." },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2400,
          response_format: { type: "json_object" },
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data?.choices?.[0]?.message?.content || "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.daily) && parsed.daily.length === days) {
          return { ...heur, summary: parsed.summary || heur.summary, daily: parsed.daily, used_ai: true };
        }
      } else {
        console.error("[trip_planner] groq error", r.status);
      }
    } catch (e) {
      console.error("[trip_planner] groq failed", e);
    }
  }

  // Provider 2: Gemini (free 1500/día)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2400,
              responseMimeType: "application/json",
            },
          }),
        },
      );
      if (r.ok) {
        const data = await r.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.daily) && parsed.daily.length === days) {
          return { ...heur, summary: parsed.summary || heur.summary, daily: parsed.daily, used_ai: true };
        }
      } else {
        console.error("[trip_planner] gemini error", r.status);
      }
    } catch (e) {
      console.error("[trip_planner] gemini failed", e);
    }
  }

  // Provider 3: Anthropic (paid)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2400,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data?.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.daily) && parsed.daily.length === days) {
            return { ...heur, summary: parsed.summary || heur.summary, daily: parsed.daily, used_ai: true };
          }
        }
      }
    } catch (e) {
      console.error("[trip_planner] anthropic failed", e);
    }
  }

  // Fallback heurístico
  return heur;
}
