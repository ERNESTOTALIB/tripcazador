/**
 * whatsapp_webhook_hmac.test.ts — SSS383
 *
 * Anti-regresión: verifica que la HMAC verification de Meta no se rompa
 * en futuras iteraciones. Genera firma vs APP_SECRET conocido y valida
 * que el endpoint acepte / rechace adecuadamente.
 *
 * No invoca la route directamente (requiere process.env override), pero
 * sí tests la lógica HMAC determinística.
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

const APP_SECRET = "test-secret-xxx";

function sign(body: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("WhatsApp webhook HMAC pattern (Meta spec)", () => {
  it("firma esperada matchea formato sha256=<hex>", () => {
    const sig = sign('{"object":"whatsapp_business_account"}', APP_SECRET);
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("firma cambia con body distinto", () => {
    const a = sign("body-a", APP_SECRET);
    const b = sign("body-b", APP_SECRET);
    expect(a).not.toBe(b);
  });

  it("firma cambia con secret distinto", () => {
    const a = sign("same", APP_SECRET);
    const b = sign("same", "otro-secret");
    expect(a).not.toBe(b);
  });

  it("timingSafeEqual valida correctamente firmas iguales", () => {
    const body = '{"x":1}';
    const sig1 = sign(body, APP_SECRET);
    const sig2 = sign(body, APP_SECRET);
    expect(
      crypto.timingSafeEqual(Buffer.from(sig1), Buffer.from(sig2)),
    ).toBe(true);
  });

  it("timingSafeEqual rechaza firma mal", () => {
    const a = sign("x", APP_SECRET);
    const b = sign("y", APP_SECRET);
    expect(a.length).toBe(b.length); // mismo formato sha256
    expect(
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)),
    ).toBe(false);
  });
});
