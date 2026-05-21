"use client";

/**
 * HotlineClient — SSS372 + SSS378 (21 may 2026)
 *
 * UI cliente para /premium/hotline. Acepta texto + voz (Web Speech API
 * SpeechRecognition cuando navegador soporta). Llama /api/voice/hotline
 * y renderiza la respuesta + reproduce audio si la API lo devuelve.
 *
 * SSS378: añadido push-to-talk con WebkitSpeechRecognition / SpeechRecognition.
 * Fallback: si navegador no soporta, mic button deshabilitado con tooltip.
 */

import { useEffect, useRef, useState } from "react";

// Tipos mínimos para SpeechRecognition (no incluidos en libs DOM por defecto)
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecCtor;
    webkitSpeechRecognition?: SpeechRecCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface DealMatch {
  id: string;
  route: string;
  price_eur: number;
}

interface HotlineApiResponse {
  ok: boolean;
  reply_text?: string;
  reply_audio_url?: string;
  matched_deals?: DealMatch[];
  used_ai?: boolean;
  reason?: string;
}

export function HotlineClient() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<HotlineApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    setMicSupported(!!Ctor);
  }, []);

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Tu navegador no soporta dictado por voz. Usa Chrome/Edge en escritorio.");
      return;
    }
    setError(null);
    const r = new Ctor();
    r.lang = "es-ES";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      setText(t.slice(0, 500));
    };
    r.onerror = (e) => {
      setError(`Error mic: ${e.error || "desconocido"}`);
      setListening(false);
    };
    r.onend = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    r.start();
  }

  function stopListening() {
    recogRef.current?.stop();
    setListening(false);
  }

  async function onAsk() {
    if (!text.trim()) {
      setError("Escribe tu pregunta");
      return;
    }
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const r = await fetch("/api/voice/hotline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: getCustomerId(),
          user_text: text.trim(),
        }),
      });
      const data: HotlineApiResponse = await r.json();
      if (!r.ok || !data.ok) {
        setError(data.reason === "rate_limited" ? "Has alcanzado el límite de hoy." : "No pudimos procesar tu pregunta.");
        return;
      }
      setResponse(data);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function getCustomerId(): string {
    if (typeof document === "undefined") return "anon";
    const m = document.cookie.match(/tc_cid=([^;]+)/);
    return m?.[1] || "anon";
  }

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-5">
      <label
        htmlFor="hotline-input"
        className="block text-sm font-semibold text-white mb-2"
      >
        Pregúntale a tu AI Concierge
      </label>
      <textarea
        id="hotline-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ej: Vuelos a Tokio en agosto baratos"
        rows={3}
        maxLength={500}
        className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
        disabled={loading}
      />
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        <p className="text-xs text-gray-500">{text.length}/500</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={!micSupported}
            title={
              !micSupported
                ? "Tu navegador no soporta dictado (Chrome/Edge requerido)"
                : listening
                  ? "Detener dictado"
                  : "Hablar"
            }
            aria-label={listening ? "Detener dictado" : "Hablar"}
            className={`px-3 py-2.5 rounded-xl text-sm font-bold transition ${
              listening
                ? "bg-red-500 hover:bg-red-400 text-white animate-pulse"
                : micSupported
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {listening ? "⏹ Detener" : "🎤 Hablar"}
          </button>
          <button
            type="button"
            onClick={onAsk}
            disabled={loading || !text.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-sm"
          >
            {loading ? "Procesando…" : "🎙️ Preguntar"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {response && response.ok && (
        <div className="mt-5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <p className="text-sm font-semibold text-amber-300 mb-2">
            AI Concierge dice:
          </p>
          <p className="text-white">{response.reply_text}</p>

          {response.reply_audio_url && (
            <audio
              controls
              src={response.reply_audio_url}
              className="mt-3 w-full"
            />
          )}

          {response.matched_deals && response.matched_deals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <p className="text-xs text-amber-300 mb-2 font-semibold">
                Chollos relacionados:
              </p>
              <ul className="space-y-1">
                {response.matched_deals.map((d) => (
                  <li key={d.id} className="text-sm text-white">
                    ✈️ {d.route} · desde {d.price_eur}€
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!response.used_ai && (
            <p className="mt-3 text-[10px] text-gray-500">
              ✱ Respuesta determinística (AI deshabilitada — activa Premium Anual para
              voz GPT + ElevenLabs)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
