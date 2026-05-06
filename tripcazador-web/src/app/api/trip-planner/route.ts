import { NextResponse } from "next/server";
import { generateItineraryWithAI, type TripPlannerInput, type TripStyle } from "@/lib/trip_planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STYLES: TripStyle[] = [
  "foodie",
  "cultural",
  "aventura",
  "relax",
  "fiesta",
  "familia",
  "romantico",
];

// Rudimentary in-memory rate limit per IP (free tier: 1/day localStorage en cliente, esto es defense-in-depth)
const rateLimits = new Map<string, { count: number; reset: number }>();
const FREE_DAILY = 5; // 5 generaciones por IP por día

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.reset < now) {
    rateLimits.set(ip, { count: 1, reset: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= FREE_DAILY) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  let body: Partial<TripPlannerInput> & { destination?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Has alcanzado el límite gratuito. Suscríbete a Premium para uso ilimitado." },
      { status: 429 },
    );
  }

  // Validate
  if (!body.destination || typeof body.destination !== "string" || body.destination.length < 2 || body.destination.length > 80) {
    return NextResponse.json({ error: "Destino inválido" }, { status: 400 });
  }
  const days = Math.max(2, Math.min(21, Number(body.days) || 5));
  const budget = Math.max(150, Math.min(50000, Number(body.budget) || 1000));
  const travelers = Math.max(1, Math.min(8, Number(body.travelers) || 1));
  const style = (VALID_STYLES.includes(body.style as TripStyle) ? body.style : "cultural") as TripStyle;
  const origin = typeof body.origin === "string" && body.origin.length <= 4 ? body.origin.toUpperCase() : undefined;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 300) : undefined;

  try {
    const itin = await generateItineraryWithAI({
      destination: body.destination.slice(0, 80),
      origin,
      days,
      budget,
      travelers,
      style,
      notes,
      language: "es",
    });
    return NextResponse.json(itin, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[/api/trip-planner] error", e);
    return NextResponse.json({ error: "Generación falló — inténtalo de nuevo" }, { status: 500 });
  }
}
