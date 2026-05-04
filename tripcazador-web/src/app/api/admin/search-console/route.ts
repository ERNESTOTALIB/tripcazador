import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/search-console — fase SSS64 (May 2026)
 *
 * Wrapper sobre Google Search Console API. Devuelve top queries +
 * impressions + clicks + posición media de los últimos 7 días.
 *
 * Setup requerido (one-time, cuando Ernesto lo conecte):
 *   1. Crear service account en Google Cloud Console
 *   2. Compartir tripcazador.com con email del service account en GSC
 *      (Settings → Users and permissions → Add user)
 *   3. Subir el JSON de la service account a Vercel env como GSC_SA_JSON
 *      (multiline secret, basta con copiar-pegar el JSON entero)
 *   4. Set GSC_SITE_URL=https://tripcazador.com en Vercel
 *
 * Sin esos secrets devuelve 503 con instrucciones — UI lo renderiza como
 * "Conectar Search Console" CTA.
 */

interface GscRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function getAccessToken(saJson: string): Promise<string | null> {
  try {
    const sa = JSON.parse(saJson) as {
      client_email: string;
      private_key: string;
      token_uri: string;
    };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    };
    const enc = (o: object) =>
      Buffer.from(JSON.stringify(o)).toString("base64url");
    const header = enc({ alg: "RS256", typ: "JWT" });
    const payload = enc(claim);
    const signingInput = `${header}.${payload}`;

    // Sign with private key (Node crypto)
    const { createSign } = await import("crypto");
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();
    const sig = signer.sign(sa.private_key).toString("base64url");
    const jwt = `${signingInput}.${sig}`;

    const res = await fetch(sa.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const saJson = process.env.GSC_SA_JSON || "";
  const siteUrl = process.env.GSC_SITE_URL || "https://tripcazador.com";

  if (!saJson) {
    return NextResponse.json(
      {
        connected: false,
        setup_steps: [
          "1. Google Cloud → IAM → service account 'tripcazador-gsc'",
          "2. Generar JSON key, descargar",
          "3. Search Console → Settings → Users → añadir email del SA",
          "4. Vercel env: GSC_SA_JSON=<contenido completo del JSON>",
          "5. Vercel env: GSC_SITE_URL=https://tripcazador.com",
          "6. Redeploy",
        ],
        note: "Sin Search Console conectado, top queries no disponibles en /panel",
      },
      { status: 200 },
    );
  }

  const accessToken = await getAccessToken(saJson);
  if (!accessToken) {
    return NextResponse.json({ error: "auth_failed", connected: false }, { status: 502 });
  }

  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  try {
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["query"],
        rowLimit: 50,
      }),
    });
    if (!r.ok) {
      return NextResponse.json(
        { error: `gsc_${r.status}`, connected: true },
        { status: 502 },
      );
    }
    const data = (await r.json()) as {
      rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }>;
    };
    const queries: GscRow[] = (data.rows || []).map((row) => ({
      query: row.keys[0] || "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 1000) / 10,
      position: Math.round(row.position * 10) / 10,
    }));

    return NextResponse.json({
      connected: true,
      window_days: 7,
      queries,
      totals: {
        clicks: queries.reduce((a, b) => a + b.clicks, 0),
        impressions: queries.reduce((a, b) => a + b.impressions, 0),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch_failed" },
      { status: 502 },
    );
  }
}
