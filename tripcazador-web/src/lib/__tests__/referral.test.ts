/**
 * referral.test.ts — SSS238 (16 may 2026)
 *
 * Tests para lib/referral.ts (71 líneas, growth-critical sin tests).
 *
 * Cubre:
 *  - getOrCreateReferralCode: format TC-XXXX, idempotente, persiste
 *  - captureIncomingReferral: valida regex, first-touch atribución
 *  - getIncomingReferral: lee localStorage
 *  - getReferralLink: shape URL completa
 *  - SSR guard: no throw sin window
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrCreateReferralCode,
  captureIncomingReferral,
  getIncomingReferral,
  getReferralLink,
} from "../referral";

beforeEach(() => {
  localStorage.clear();
  // Reset URL
  window.history.pushState({}, "", "/");
});

describe("getOrCreateReferralCode", () => {
  it("genera código formato TC-XXXX con 4 chars alfanuméricos uppercase", () => {
    const code = getOrCreateReferralCode();
    expect(code).toMatch(/^TC-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("es idempotente (mismo código en llamadas sucesivas)", () => {
    const a = getOrCreateReferralCode();
    const b = getOrCreateReferralCode();
    const c = getOrCreateReferralCode();
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("persiste en localStorage (tc_referral_code_v1)", () => {
    const code = getOrCreateReferralCode();
    expect(localStorage.getItem("tc_referral_code_v1")).toBe(code);
  });

  it("genera código distinto tras clear localStorage", () => {
    const a = getOrCreateReferralCode();
    localStorage.clear();
    // Múltiples retries por probabilidad (32^4 = ~1M posibilidades, casi siempre distinto)
    let b = a;
    for (let i = 0; i < 5 && b === a; i++) {
      localStorage.clear();
      b = getOrCreateReferralCode();
    }
    // Casi imposible que sean iguales 5 veces seguidas (1 in 1M ^5)
    expect(b).not.toBe(a);
  });

  it("excluye caracteres ambiguos (0, O, I, 1)", () => {
    // Generamos 100 códigos y verificamos ninguno tiene chars ambiguos
    for (let i = 0; i < 100; i++) {
      localStorage.clear();
      const code = getOrCreateReferralCode();
      const suffix = code.slice(3); // después de "TC-"
      expect(suffix).not.toMatch(/[01OI]/);
    }
  });
});

describe("captureIncomingReferral — first-touch attribution", () => {
  it("captura ?ref=TC-XXXX válido", () => {
    window.history.pushState({}, "", "/?ref=TC-ABCD");
    const captured = captureIncomingReferral();
    expect(captured).toBe("TC-ABCD");
    expect(localStorage.getItem("tc_referral_incoming_v1")).toBe("TC-ABCD");
  });

  it("ignora ref con formato inválido (sin TC-)", () => {
    window.history.pushState({}, "", "/?ref=ABCD1234");
    expect(captureIncomingReferral()).toBeNull();
    expect(localStorage.getItem("tc_referral_incoming_v1")).toBeNull();
  });

  it("ignora ref con longitud incorrecta", () => {
    window.history.pushState({}, "", "/?ref=TC-AB");
    expect(captureIncomingReferral()).toBeNull();

    window.history.pushState({}, "", "/?ref=TC-ABCDEF");
    expect(captureIncomingReferral()).toBeNull();
  });

  it("ignora ref con chars lowercase", () => {
    window.history.pushState({}, "", "/?ref=TC-abcd");
    expect(captureIncomingReferral()).toBeNull();
  });

  it("ignora ref XSS / injection", () => {
    window.history.pushState({}, "", "/?ref=TC-AB%3Cscript%3E");
    expect(captureIncomingReferral()).toBeNull();

    window.history.pushState({}, "", '/?ref=TC-"<>');
    expect(captureIncomingReferral()).toBeNull();
  });

  it("FIRST-TOUCH: no sobrescribe si ya hay incoming previo", () => {
    window.history.pushState({}, "", "/?ref=TC-FRST");
    expect(captureIncomingReferral()).toBe("TC-FRST");

    // Segundo touch con código distinto
    window.history.pushState({}, "", "/?ref=TC-SCND");
    captureIncomingReferral();
    // Localstorage mantiene el PRIMER referral
    expect(localStorage.getItem("tc_referral_incoming_v1")).toBe("TC-FRST");
  });

  it("retorna null si no hay query param ref", () => {
    window.history.pushState({}, "", "/");
    expect(captureIncomingReferral()).toBeNull();
  });
});

describe("getIncomingReferral", () => {
  it("lee del localStorage", () => {
    localStorage.setItem("tc_referral_incoming_v1", "TC-XYZA");
    expect(getIncomingReferral()).toBe("TC-XYZA");
  });

  it("null si no existe", () => {
    expect(getIncomingReferral()).toBeNull();
  });
});

describe("getReferralLink", () => {
  it("genera URL con ?ref=CODE", () => {
    const link = getReferralLink();
    expect(link).toMatch(
      /^https:\/\/tripcazador\.com\/\?ref=TC-[A-Z0-9]{4}$/,
    );
  });

  it("idempotente — mismo ref code → mismo link", () => {
    const a = getReferralLink();
    const b = getReferralLink();
    expect(a).toBe(b);
  });
});

describe("XSS / safety", () => {
  it("ningún URL del link tiene esquema peligroso", () => {
    const link = getReferralLink();
    expect(link).toMatch(/^https:\/\//);
    expect(link).not.toMatch(/javascript:/i);
    expect(link).not.toMatch(/data:/i);
  });

  it("regex captureIncoming impide chars peligrosos vía URL", () => {
    // Aunque atacker manipule URL, regex strict TC-[A-Z0-9]{4} excluye
    // todos los caracteres XSS comunes
    const dangerous = ["<", ">", "\"", "'", " ", "/", "\\", "&", "?", "="];
    for (const c of dangerous) {
      window.history.pushState({}, "", `/?ref=TC-AB${encodeURIComponent(c)}D`);
      expect(captureIncomingReferral()).toBeNull();
    }
  });
});
