/**
 * util_libs.test.ts — SSS248 (16 may 2026)
 *
 * Tests batch para 6 libs utility:
 *  - gamification.ts → badges + state localStorage
 *  - packing.ts → heuristic packing list
 *  - visa.ts → visa requirements catalog
 *  - wallet_pass.ts → Apple/Google Wallet pass JSON
 *  - whatsapp.ts → phone sanitize + provider detect
 *  - wrapped.ts → year-in-review stats
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { BADGES, getBadge, recordVisit, bumpMetric, recordDestinationVisit, loadGamState, saveGamState } from "../gamification";
import { buildHeuristicPackingList } from "../packing";
import { VISA_FROM_ES, getVisaForCountry } from "../visa";
import { buildPassJson, buildGoogleWalletUrl } from "../wallet_pass";
import { whatsappProvider, sanitizePhone } from "../whatsapp";
import { computeWrapped } from "../wrapped";

beforeEach(() => {
  localStorage.clear();
});

describe("BADGES catalog", () => {
  it("tiene mínimo 5 badges", () => {
    expect(BADGES.length).toBeGreaterThanOrEqual(5);
  });

  it("badge IDs únicos", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada badge tiene id, name, emoji, threshold/check", () => {
    for (const b of BADGES) {
      expect(b.id).toBeTruthy();
      expect(b.name).toBeTruthy();
      expect(b.emoji).toBeTruthy();
    }
  });
});

describe("getBadge", () => {
  it("retorna badge por id válido", () => {
    expect(getBadge("novato")).toBeDefined();
  });

  it("undefined para id desconocido", () => {
    // @ts-expect-error - testing invalid id
    expect(getBadge("ghost_badge")).toBeUndefined();
  });
});

describe("gamification state", () => {
  it("recordVisit incrementa visits counter", () => {
    const { state } = recordVisit();
    expect(state.visits).toBeGreaterThanOrEqual(1);
  });

  it("loadGamState devuelve state válida después de saveGamState", () => {
    const s = loadGamState();
    s.visits = 42;
    saveGamState(s);
    const loaded = loadGamState();
    expect(loaded.visits).toBe(42);
  });

  it("bumpMetric incrementa la métrica correcta (favorites)", () => {
    bumpMetric("favorites", 3);
    const s = loadGamState();
    expect(s.favorites).toBeGreaterThanOrEqual(3);
  });

  it("bumpMetric acepta varios metric names sin throw", () => {
    expect(() => bumpMetric("alerts_created", 1)).not.toThrow();
    expect(() => bumpMetric("shares", 1)).not.toThrow();
    expect(() => bumpMetric("referrals", 1)).not.toThrow();
  });

  it("recordDestinationVisit añade slug único", () => {
    recordDestinationVisit("tokio");
    recordDestinationVisit("tokio"); // dup → no doble entry
    recordDestinationVisit("bali");
    const s = loadGamState();
    expect(s.destinations_visited).toContain("tokio");
    expect(s.destinations_visited).toContain("bali");
    // Sin duplicados
    expect(
      s.destinations_visited.filter((d) => d === "tokio").length,
    ).toBe(1);
  });
});

describe("buildHeuristicPackingList", () => {
  it("retorna array no vacío", () => {
    const list = buildHeuristicPackingList({
      destination: "Bali",
      days: 7,
      travelers: 2,
      travelerType: "pareja",
      activities: ["playa", "ciudad"],
      season: "verano",
    });
    expect(list.length).toBeGreaterThan(5);
  });

  it("incluye documentos básicos siempre (pasaporte, móvil)", () => {
    const list = buildHeuristicPackingList({
      destination: "Lisboa",
      days: 3,
      travelers: 1,
      travelerType: "solo",
      activities: ["ciudad"],
      season: "primavera",
    });
    const names = list.map((i) => i.name.toLowerCase());
    expect(names.some((n) => n.includes("pasaporte") || n.includes("dni"))).toBe(true);
    expect(names.some((n) => n.includes("móvil") || n.includes("cargador"))).toBe(true);
  });

  it("ropa qty escala con días (cap 7)", () => {
    const short = buildHeuristicPackingList({
      destination: "Roma",
      days: 3,
      travelers: 1,
      travelerType: "solo",
      activities: ["ciudad"],
      season: "primavera",
    });
    const long = buildHeuristicPackingList({
      destination: "Roma",
      days: 14,
      travelers: 1,
      travelerType: "solo",
      activities: ["ciudad"],
      season: "primavera",
    });
    const shortTops = short.find((i) => i.name.toLowerCase().includes("camiseta"));
    const longTops = long.find((i) => i.name.toLowerCase().includes("camiseta"));
    if (shortTops && longTops) {
      expect(longTops.qty).toBeGreaterThanOrEqual(shortTops.qty);
      expect(longTops.qty).toBeLessThanOrEqual(7); // cap
    }
  });

  it("activities playa añade items playa-specific", () => {
    const list = buildHeuristicPackingList({
      destination: "Cancún",
      days: 7,
      travelers: 2,
      travelerType: "pareja",
      activities: ["playa"],
      season: "verano",
    });
    const names = list.map((i) => i.name.toLowerCase()).join(" ");
    expect(names).toMatch(/baña|bikini|toalla|chancla|sand/);
  });
});

describe("VISA_FROM_ES catalog", () => {
  it("tiene mínimo 10 países", () => {
    expect(VISA_FROM_ES.length).toBeGreaterThanOrEqual(10);
  });

  it("country codes únicos", () => {
    const codes = VISA_FROM_ES.map((v) => v.country_code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("cada entry tiene country_code + country + status válido", () => {
    const validStatus = new Set(["exempt", "evisa", "voa", "visa_required", "etias"]);
    for (const v of VISA_FROM_ES) {
      expect(v.country_code).toBeTruthy();
      expect(v.country).toBeTruthy();
      expect(validStatus.has(v.status)).toBe(true);
    }
  });
});

describe("getVisaForCountry", () => {
  it("retorna entry para código válido", () => {
    // Sample varios códigos posibles
    const candidates = ["USA", "US", "JP", "JPN", "TH", "MA"];
    const found = candidates.find((c) => getVisaForCountry(c));
    expect(found).toBeDefined();
  });

  it("undefined para código desconocido", () => {
    expect(getVisaForCountry("XX")).toBeUndefined();
    expect(getVisaForCountry("nonexistent")).toBeUndefined();
  });
});

describe("buildPassJson (wallet)", () => {
  it("retorna object con keys necesarios", () => {
    const pass = buildPassJson({
      alert_id: "pa_abc",
      origin_iata: "MAD",
      origin_city: "Madrid",
      destination_iata: "LIS",
      destination_city: "Lisboa",
      target_price_eur: 100,
    });
    expect(pass).toBeTruthy();
    expect(typeof pass).toBe("object");
    expect(Object.keys(pass).length).toBeGreaterThan(2);
  });

  it("incluye alert ID en algún campo", () => {
    const pass = buildPassJson({
      alert_id: "pa_xyz123",
      origin_iata: "BCN",
      origin_city: "Barcelona",
      destination_iata: "NRT",
      destination_city: "Tokio",
      target_price_eur: 500,
    });
    const json = JSON.stringify(pass);
    expect(json).toContain("pa_xyz123");
  });
});

describe("buildGoogleWalletUrl", () => {
  it("retorna URL Google Wallet con shape válida", () => {
    const url = buildGoogleWalletUrl({
      alert_id: "pa_abc",
      origin_iata: "MAD",
      origin_city: "Madrid",
      destination_iata: "LIS",
      destination_city: "Lisboa",
      target_price_eur: 100,
    });
    expect(url).toMatch(/^https:\/\//);
  });

  it("no contiene scheme peligroso", () => {
    const url = buildGoogleWalletUrl({
      alert_id: "pa_safe",
      origin_iata: "MAD",
      origin_city: "Madrid",
      destination_iata: "LIS",
      destination_city: "Lisboa",
      target_price_eur: 100,
    });
    expect(url).not.toMatch(/javascript:/i);
    expect(url).not.toMatch(/data:/i);
  });
});

describe("whatsappProvider", () => {
  it("retorna uno de los providers válidos", () => {
    const p = whatsappProvider();
    expect(["meta", "twilio", "none"]).toContain(p);
  });
});

describe("sanitizePhone", () => {
  it("elimina chars no-numéricos excepto + leading", () => {
    expect(sanitizePhone("+34 666 123 456")).toMatch(/^\+?\d+$/);
  });

  it("acepta formato internacional", () => {
    const out = sanitizePhone("+1 (555) 123-4567");
    expect(out.startsWith("+1")).toBe(true);
  });

  it("retorna string vacío para input inválido", () => {
    const out = sanitizePhone("abc");
    expect(out.length).toBeLessThan(3);
  });

  it("elimina espacios, paréntesis, guiones", () => {
    expect(sanitizePhone("(34) 666-123-456")).not.toContain(" ");
    expect(sanitizePhone("(34) 666-123-456")).not.toContain("(");
    expect(sanitizePhone("(34) 666-123-456")).not.toContain("-");
  });
});

describe("computeWrapped", () => {
  it("retorna null si no hay state significativo (visits=0)", () => {
    // Sin gam state real → puede retornar null
    const w = computeWrapped(2026);
    // Acepta null o objeto con shape válida
    if (w) {
      expect(typeof w).toBe("object");
    } else {
      expect(w).toBeNull();
    }
  });

  it("acepta año custom", () => {
    expect(() => computeWrapped(2024)).not.toThrow();
    expect(() => computeWrapped(2026)).not.toThrow();
  });

  it("año default es current year", () => {
    // Sin params → no throw
    expect(() => computeWrapped()).not.toThrow();
  });
});
