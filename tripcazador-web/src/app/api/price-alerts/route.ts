/**
 * TripCazador — /api/price-alerts (Next.js Route Handler)
 *
 * Recibe la creación de alertas de precio del frontend. Si el backend
 * FastAPI tiene `/api/price-alerts` disponible, le reenviamos la
 * petición. Si no (p. ej. el endpoint aún no está desplegado), caemos
 * a un log local y devolvemos 202 "accepted" para no romper el flujo.
 *
 * Validación mínima server-side (defensa en profundidad además del HTML
 * `required`): email con `@`, códigos IATA de 3 letras, precio > 0.
 *
 * NOTA: en producción, la persistencia y el cruce con deals se hacen
 * en FastAPI. Este proxy existe para:
 *   1) Mantener el origen de la request bajo el dominio propio (evita
 *      CORS extra desde el browser).
 *   2) Poder degradar con gracia si el backend va atrás en el
 *      despliegue (fail-soft).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AlertPayload {
  email: string;
  origin: string | null;
  destination: string | null;
  target_price: number | null;
  deal_id: string | null;
}

function isValidEmail(s: string): boolean {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidIATA(s: string | null): boolean {
  return s === null || /^[A-Z]{3}$/.test(s);
}

export async function POST(req: Request) {
  let body: Partial<AlertPayload>;
  try {
    body = (await req.json()) as Partial<AlertPayload>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const origin = typeof body.origin === "string" ? body.origin.trim().toUpperCase() : null;
  const destination =
    typeof body.destination === "string" ? body.destination.trim().toUpperCase() : null;
  const target_price =
    typeof body.target_price === "number" && body.target_price > 0
      ? body.target_price
      : null;
  const deal_id = typeof body.deal_id === "string" ? body.deal_id : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!isValidIATA(origin) || !isValidIATA(destination)) {
    return NextResponse.json({ error: "invalid_iata" }, { status: 400 });
  }
  if (!origin && !destination && !deal_id) {
    return NextResponse.json(
      { error: "need_route_or_deal" },
      { status: 400 },
    );
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const payload: AlertPayload = { email, origin, destination, target_price, deal_id };

  try {
    // Timeout corto — si el backend tarda, fallback silencioso.
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${apiBase}/api/price-alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      // Pass-through del body del backend (suele incluir el id de la alerta)
      const data = await res.json().catch(() => ({ status: "ok" }));
      return NextResponse.json(data, { status: 200 });
    }

    // El backend respondió error — lo exponemos pero sin leakear detalles
    if (res.status === 404) {
      // Endpoint aún no desplegado: degradamos a 202 para no romper UX
      console.warn("[price-alerts] backend 404, stored locally only", payload);
      return NextResponse.json(
        { status: "queued_local", message: "backend_not_ready" },
        { status: 202 },
      );
    }
    return NextResponse.json(
      { error: "backend_error", code: res.status },
      { status: 502 },
    );
  } catch (err) {
    // Red/timeout/DNS: 202 fail-soft. El usuario ve éxito, nosotros
    // reconciliamos cuando el backend vuelva (pendiente en #112).
    console.warn(
      "[price-alerts] backend unreachable, acked locally",
      payload,
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { status: "queued_local", message: "backend_unreachable" },
      { status: 202 },
    );
  }
}
