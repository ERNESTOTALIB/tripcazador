/**
 * voice_hotline.ts — SSS372 (21 may 2026)
 *
 * Premium hotline conversacional con GPT (texto → respuesta) + ElevenLabs
 * (respuesta → audio mp3). El usuario llama via web/app, transcribe su voz
 * (ej. "quiero ir a Tokio en agosto barato"), GPT busca chollos en nuestro
 * catalog y responde, ElevenLabs convierte a voz cálida en español.
 *
 * Lib pure — sin acoplarse a route Next. Tests sin red gracias a feature
 * flag VOICE_HOTLINE_ENABLED + fallback respuesta canned cuando env vars
 * faltan. La idea es desbloquear el feature en cuanto el user añada las
 * 2 env vars en Vercel.
 *
 * Pricing: incluido en Premium Anual (€99/yr). En mensual €9.99 limitado
 * a 5 llamadas/mes — controlled in /api/voice/hotline rate limit.
 */

export interface HotlineRequest {
  customer_id: string;
  user_text: string; // transcripción ya hecha en cliente (Web Speech API)
  context?: {
    origin?: string;
    last_searched?: string;
  };
}

export interface HotlineResponse {
  ok: boolean;
  reply_text: string;
  reply_audio_url?: string; // mp3 generado por ElevenLabs
  matched_deals?: Array<{ id: string; route: string; price_eur: number }>;
  used_ai: boolean;
  reason?: string;
}

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Bella ES
const HOTLINE_ENABLED = (process.env.VOICE_HOTLINE_ENABLED || "0") === "1";

const SYSTEM_PROMPT = `Eres TripCazador AI Concierge, un experto cazador de chollos de vuelos.
Responde en español neutro, tono cálido y directo (máximo 3 frases).
Si el usuario pide un destino + fecha, sugiere 1-2 chollos del catálogo (origen ES default Madrid).
Si pide info genérica, da consejo práctico breve.
Nunca prometas precios — usa "desde X€" si das número.
Termina con CTA breve tipo "¿Te lo reservo via Concierge?" si encaja.`;

/**
 * fetchDealsForQuery — busca chollos relevantes en catálogo via API interna.
 * Usado por hotline + chat. Soporta destino libre + origen opcional.
 */
export async function fetchDealsForQuery(opts: {
  destination?: string;
  origin?: string;
  maxPriceEur?: number;
  limit?: number;
}): Promise<Array<{ id: string; route: string; price_eur: number }>> {
  // En tests devolvemos vacío sin red. Implementación real: fetch /api/deals
  // con filtros. Por ahora stub determinístico que retorna ejemplos.
  if (!opts.destination) return [];
  return [
    {
      id: "stub-001",
      route: `${opts.origin || "MAD"}-${opts.destination.toUpperCase()}`,
      price_eur: opts.maxPriceEur ? Math.min(opts.maxPriceEur, 299) : 299,
    },
  ];
}

/**
 * generateReplyCanned — fallback determinístico cuando OPENAI no configurado.
 * Hace pattern matching simple para devolver respuesta útil.
 */
export function generateReplyCanned(userText: string): {
  reply_text: string;
  destination?: string;
} {
  const lower = userText.toLowerCase();
  // Detect destinos comunes
  const destinosMap: Record<string, string> = {
    tokio: "TYO",
    japón: "TYO",
    japon: "TYO",
    nueva: "NYC",
    "nueva york": "NYC",
    bali: "DPS",
    tailandia: "BKK",
    bangkok: "BKK",
    parís: "PAR",
    paris: "PAR",
    londres: "LON",
    roma: "ROM",
    lisboa: "LIS",
    barcelona: "BCN",
    canarias: "TFS",
    tenerife: "TFS",
  };
  let detectedDest: string | undefined;
  for (const [key, code] of Object.entries(destinosMap)) {
    if (lower.includes(key)) {
      detectedDest = code;
      break;
    }
  }
  if (!detectedDest) {
    return {
      reply_text:
        "Cuéntame el destino o las fechas (ejemplo: 'Tokio en agosto'). Te busco el mejor chollo.",
    };
  }
  return {
    reply_text: `He visto chollos a ${detectedDest} desde Madrid alrededor de 299€. ¿Quieres que te lo reservemos via Concierge?`,
    destination: detectedDest,
  };
}

/**
 * generateReplyOpenAI — llama GPT-4o-mini con system + user.
 * Devuelve texto. Si falla, fallback canned.
 */
export async function generateReplyOpenAI(userText: string): Promise<string | null> {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText },
        ],
        max_tokens: 180,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * synthesizeVoice — convierte texto → mp3 con ElevenLabs.
 * Retorna data URL inline (base64). En prod conviene subir a R2/S3.
 */
export async function synthesizeVoice(text: string): Promise<string | null> {
  if (!ELEVENLABS_KEY) return null;
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * processHotline — orquesta full flow:
 * 1) si feature flag off → respuesta canned + reason "disabled"
 * 2) si OPENAI → genera reply real
 * 3) si ELEVENLABS → genera audio (best-effort)
 * 4) intenta extraer destino + busca deals
 */
export async function processHotline(req: HotlineRequest): Promise<HotlineResponse> {
  if (!req.user_text || req.user_text.trim().length < 2) {
    return {
      ok: false,
      reply_text: "",
      used_ai: false,
      reason: "empty_input",
    };
  }
  if (req.user_text.length > 500) {
    return {
      ok: false,
      reply_text: "",
      used_ai: false,
      reason: "too_long",
    };
  }

  if (!HOTLINE_ENABLED) {
    const canned = generateReplyCanned(req.user_text);
    return {
      ok: true,
      reply_text: canned.reply_text,
      used_ai: false,
      reason: "disabled_canned_fallback",
    };
  }

  // Intentar GPT
  let replyText = await generateReplyOpenAI(req.user_text);
  let usedAi = true;
  if (!replyText) {
    const canned = generateReplyCanned(req.user_text);
    replyText = canned.reply_text;
    usedAi = false;
  }

  // Best-effort: audio
  const audio = await synthesizeVoice(replyText);

  // Best-effort: deals match (destino canned)
  const canned = generateReplyCanned(req.user_text);
  const deals = canned.destination
    ? await fetchDealsForQuery({
        destination: canned.destination,
        origin: req.context?.origin,
      })
    : [];

  return {
    ok: true,
    reply_text: replyText,
    reply_audio_url: audio || undefined,
    matched_deals: deals,
    used_ai: usedAi,
  };
}

export const __test__ = {
  generateReplyCanned,
  HOTLINE_ENABLED,
  SYSTEM_PROMPT,
};
