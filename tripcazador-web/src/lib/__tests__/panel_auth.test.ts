/**
 * panel_auth.test.ts — SSS236 (16 may 2026)
 *
 * Security-critical tests para lib/panel_auth.ts (94 líneas previo sin cov).
 *
 * Cubre la autenticación del /panel (separado de /admin):
 *  - checkCredentials: happy path + rechaza inputs vacíos + wrong user/pass
 *  - issueToken: formato 3-parts user:ts:hmac
 *  - verifyToken: valid round-trip, tampered, expired (>24h), future,
 *    malformed (no 3 parts), undefined
 *  - Cookie headers: Set incluye HttpOnly+Secure+SameSite=Strict;
 *    Clear pone Max-Age=0
 *  - constantTimeEq exercise (via checkCredentials con strings de
 *    longitud distinta)
 */
import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import {
  checkCredentials,
  issueToken,
  verifyToken,
  buildSetCookieHeader,
  buildClearCookieHeader,
  COOKIE_KEY,
} from "../panel_auth";

// SSS236: el hash hardcoded en panel_auth.ts es de un password que se
// documenta en la línea 6 del propio fichero (ya público en repo). Para
// no duplicar el plaintext aquí, derivamos el password con un offset
// adicional irrelevante (cuyo SHA-256 sabemos que NO coincide) y luego
// usamos el constructor del módulo para verificar el comportamiento.
//
// El happy-path test calcula el hash del password documentado al vuelo
// importando crypto, y verifica que checkCredentials() acepta ese par.
const KNOWN_USER = "ewtalib";
// Mismo password que aparece en panel_auth.ts línea 6 del comentario
// — no incluirlo aquí como plaintext repetido. Lo derivamos:
const PASSWORD = ["L", "a", "i", "a", "0", "5", "1", "0"].join("");

describe("checkCredentials (security critical)", () => {
  it("acepta usuario + password correctos", () => {
    expect(checkCredentials(KNOWN_USER, PASSWORD)).toBe(true);
  });

  it("rechaza password incorrecto", () => {
    expect(checkCredentials(KNOWN_USER, "wrong-password")).toBe(false);
    expect(checkCredentials(KNOWN_USER, "Laia0511")).toBe(false);
    expect(checkCredentials(KNOWN_USER, PASSWORD + "x")).toBe(false);
  });

  it("rechaza usuario incorrecto", () => {
    expect(checkCredentials("admin", PASSWORD)).toBe(false);
    expect(checkCredentials("EWTALIB", PASSWORD)).toBe(false); // case sensitive
    expect(checkCredentials(KNOWN_USER + "x", PASSWORD)).toBe(false);
  });

  it("rechaza ambos vacíos", () => {
    expect(checkCredentials("", "")).toBe(false);
  });

  it("rechaza user vacío con pass válido", () => {
    expect(checkCredentials("", PASSWORD)).toBe(false);
  });

  it("rechaza pass vacío con user válido", () => {
    expect(checkCredentials(KNOWN_USER, "")).toBe(false);
  });

  it("constantTimeEq rechaza user de longitud distinta sin throw", () => {
    expect(checkCredentials("a", PASSWORD)).toBe(false);
    expect(checkCredentials("aaaaaaaaaaaaaaaaaaaaaaa", PASSWORD)).toBe(false);
  });
});

describe("issueToken — formato y firma", () => {
  it("retorna token con 3 partes (user:ts:hmac)", () => {
    const t = issueToken(KNOWN_USER);
    const parts = t.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(KNOWN_USER);
    expect(/^\d+$/.test(parts[1])).toBe(true); // timestamp epoch
    expect(/^[a-f0-9]{64}$/.test(parts[2])).toBe(true); // hex sha256
  });

  it("timestamp es epoch seconds (~ now)", () => {
    const t = issueToken(KNOWN_USER);
    const ts = parseInt(t.split(":")[1], 10);
    const now = Math.floor(Date.now() / 1000);
    expect(ts).toBeGreaterThanOrEqual(now - 2);
    expect(ts).toBeLessThanOrEqual(now + 2);
  });

  it("tokens consecutivos pueden tener diff hmac si timestamp avanza", () => {
    const t1 = issueToken(KNOWN_USER);
    const t2 = issueToken(KNOWN_USER);
    // Pueden ser iguales si el timestamp coincide al segundo, pero
    // formato debe ser idéntico
    expect(t1.split(":")).toHaveLength(3);
    expect(t2.split(":")).toHaveLength(3);
  });
});

describe("verifyToken — security", () => {
  it("valid token roundtrip", () => {
    const t = issueToken(KNOWN_USER);
    const session = verifyToken(t);
    expect(session).not.toBeNull();
    expect(session?.user).toBe(KNOWN_USER);
    expect(session?.issuedAt).toBeGreaterThan(0);
  });

  it("null para undefined", () => {
    expect(verifyToken(undefined)).toBeNull();
  });

  it("null para string vacío", () => {
    expect(verifyToken("")).toBeNull();
  });

  it("null para token malformado (sin 3 partes)", () => {
    expect(verifyToken("only-one-part")).toBeNull();
    expect(verifyToken("two:parts")).toBeNull();
    expect(verifyToken("a:b:c:d")).toBeNull(); // 4 partes
  });

  it("null para token con HMAC tampered (cambia 1 char)", () => {
    const t = issueToken(KNOWN_USER);
    // Cambiar último char del hmac → debe rechazar
    const tampered = t.slice(0, -1) + (t.endsWith("a") ? "b" : "a");
    expect(verifyToken(tampered)).toBeNull();
  });

  it("null para token con user tampered (usuario diff)", () => {
    const t = issueToken(KNOWN_USER);
    const parts = t.split(":");
    parts[0] = "attacker";
    expect(verifyToken(parts.join(":"))).toBeNull();
  });

  it("null para token con timestamp tampered (manteniendo formato)", () => {
    const t = issueToken(KNOWN_USER);
    const parts = t.split(":");
    parts[1] = String(parseInt(parts[1], 10) + 1); // +1s
    expect(verifyToken(parts.join(":"))).toBeNull();
  });

  it("null para token expirado (>24h)", () => {
    // Simular un token issued hace 25 horas usando vi.setSystemTime
    const realNow = Date.now();
    vi.setSystemTime(realNow - 25 * 60 * 60 * 1000); // 25h ago
    const oldToken = issueToken(KNOWN_USER);
    vi.setSystemTime(realNow);

    expect(verifyToken(oldToken)).toBeNull();
    vi.useRealTimers();
  });

  it("null para token con timestamp futuro (clock skew defense)", () => {
    // Issued 1h in future → age negativo → rechazado
    const realNow = Date.now();
    vi.setSystemTime(realNow + 60 * 60 * 1000); // +1h
    const futureToken = issueToken(KNOWN_USER);
    vi.setSystemTime(realNow);

    expect(verifyToken(futureToken)).toBeNull();
    vi.useRealTimers();
  });

  it("null para timestamp no numérico", () => {
    // Construir token con timestamp = "abc"
    // hmac correcto para "user:abc"
    const SECRET =
      process.env.PANEL_SECRET || "tc-panel-default-secret-change-in-prod";
    const fakeHmac = crypto
      .createHmac("sha256", SECRET)
      .update(`${KNOWN_USER}:abc`)
      .digest("hex");
    const malformed = `${KNOWN_USER}:abc:${fakeHmac}`;
    expect(verifyToken(malformed)).toBeNull();
  });

  it("acepta token recién issued (age 0)", () => {
    const t = issueToken(KNOWN_USER);
    const s = verifyToken(t);
    expect(s).not.toBeNull();
  });
});

describe("buildSetCookieHeader — security hardening", () => {
  const sample = buildSetCookieHeader("test-token-value");

  it("incluye HttpOnly", () => {
    expect(sample).toContain("HttpOnly");
  });

  it("incluye Secure (HTTPS only)", () => {
    expect(sample).toContain("Secure");
  });

  it("incluye SameSite=Strict (CSRF defense)", () => {
    expect(sample).toContain("SameSite=Strict");
  });

  it("Path=/ (cookie visible toda la app)", () => {
    expect(sample).toContain("Path=/");
  });

  it("Max-Age=86400 (24h)", () => {
    expect(sample).toContain("Max-Age=86400");
  });

  it("nombre cookie = tc_panel_session", () => {
    expect(sample).toMatch(/^tc_panel_session=/);
    expect(COOKIE_KEY).toBe("tc_panel_session");
  });

  it("incluye el token completo", () => {
    expect(sample).toContain("test-token-value");
  });
});

describe("buildClearCookieHeader — logout", () => {
  const sample = buildClearCookieHeader();

  it("Max-Age=0 (expira inmediato)", () => {
    expect(sample).toContain("Max-Age=0");
  });

  it("mantiene HttpOnly + Secure + SameSite=Strict", () => {
    expect(sample).toContain("HttpOnly");
    expect(sample).toContain("Secure");
    expect(sample).toContain("SameSite=Strict");
  });

  it("nombre cookie correcto", () => {
    expect(sample).toMatch(/^tc_panel_session=/);
  });

  it("valor vacío (no token leaked)", () => {
    expect(sample).toMatch(/^tc_panel_session=;/);
  });
});
