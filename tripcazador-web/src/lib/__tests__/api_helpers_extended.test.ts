/**
 * api_helpers_extended.test.ts — SSS230 (16 may 2026)
 *
 * Tests para helpers públicos de lib/api.ts (761 líneas previo sin cov):
 *  - formatDate / formatDuration / getCabinLabel / getClassificationColor
 *  - safeExternalUrl + safeImageUrl (security XSS defense)
 *
 * Foco en safeExternalUrl y safeImageUrl: son defensa critical contra XSS
 * via booking_url o image_url malicioso del backend. Tests cubren los
 * patrones de attack más comunes.
 */
import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDuration,
  getCabinLabel,
  getClassificationColor,
  safeExternalUrl,
  safeImageUrl,
} from "../api";

describe("formatDate", () => {
  it("formatea fecha ISO en formato español", () => {
    expect(formatDate("2026-08-15")).toBe("15 Ago 2026");
    expect(formatDate("2026-12-01")).toBe("01 Dic 2026");
    expect(formatDate("2026-01-31")).toBe("31 Ene 2026");
  });

  it("string vacío → string vacío", () => {
    expect(formatDate("")).toBe("");
  });

  it("malformado → devuelve original (fallback)", () => {
    // formatDate no throws, no rompe UI
    expect(formatDate("not-a-date")).toBeTruthy();
  });
});

describe("formatDuration", () => {
  it("minutos → horas y minutos", () => {
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(135)).toBe("2h 15m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(45)).toBe("0h 45m");
  });

  it("0 minutos → string vacío", () => {
    expect(formatDuration(0)).toBe("");
  });
});

describe("getCabinLabel", () => {
  it("mapea cabin codes", () => {
    expect(getCabinLabel("economy")).toBe("Economy");
    expect(getCabinLabel("premium_economy")).toBe("Premium Eco");
    expect(getCabinLabel("business")).toBe("Business");
    expect(getCabinLabel("first")).toBe("First");
  });

  it("unknown cabin → return as-is", () => {
    expect(getCabinLabel("weird_class")).toBe("weird_class");
  });
});

describe("getClassificationColor", () => {
  it("CRÍTICO → red", () => {
    expect(getClassificationColor("CRÍTICO")).toContain("red");
  });

  it("ERROR → orange", () => {
    expect(getClassificationColor("ERROR")).toContain("orange");
  });

  it("OFERTA → amber", () => {
    expect(getClassificationColor("OFERTA")).toContain("amber");
  });

  it("clasificación unknown → gray fallback", () => {
    expect(getClassificationColor("UNKNOWN_CLASS")).toContain("gray");
  });
});

// ────────────────────────────────────────────────
// SECURITY: safeExternalUrl (XSS defense)
// ────────────────────────────────────────────────
describe("safeExternalUrl — XSS defense", () => {
  it("permite URLs http/https", () => {
    expect(safeExternalUrl("https://ryanair.com")).toBe("https://ryanair.com");
    expect(safeExternalUrl("http://example.com")).toBe("http://example.com");
  });

  it("permite relative URLs", () => {
    expect(safeExternalUrl("/deals")).toBe("/deals");
    expect(safeExternalUrl("/deals?from=MAD")).toBe("/deals?from=MAD");
    expect(safeExternalUrl("#section")).toBe("#section");
    expect(safeExternalUrl("?q=test")).toBe("?q=test");
  });

  it("bloquea javascript: scheme", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBe("#");
    expect(safeExternalUrl("JAVASCRIPT:alert(1)")).toBe("#");
    expect(safeExternalUrl("  javascript:alert(1)")).toBe("#");
  });

  it("bloquea javascript: con tabs/newlines (browser ignore)", () => {
    // Browsers ignoran control chars en el scheme — defensa
    expect(safeExternalUrl("ja\tvascript:alert(1)")).toBe("#");
    expect(safeExternalUrl("java\nscript:alert(1)")).toBe("#");
  });

  it("bloquea data: scheme", () => {
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
  });

  it("bloquea vbscript: scheme", () => {
    expect(safeExternalUrl("vbscript:msgbox(1)")).toBe("#");
  });

  it("bloquea file: scheme", () => {
    expect(safeExternalUrl("file:///etc/passwd")).toBe("#");
  });

  it("undefined/null/empty → #", () => {
    expect(safeExternalUrl(undefined)).toBe("#");
    expect(safeExternalUrl(null)).toBe("#");
    expect(safeExternalUrl("")).toBe("#");
    expect(safeExternalUrl("   ")).toBe("#");
  });

  it("ftp/gopher/etc → #", () => {
    expect(safeExternalUrl("ftp://example.com/file")).toBe("#");
    expect(safeExternalUrl("gopher://example.com")).toBe("#");
  });
});

// ────────────────────────────────────────────────
// SECURITY: safeImageUrl (image src defense)
// ────────────────────────────────────────────────
describe("safeImageUrl — image src defense", () => {
  it("permite https URLs", () => {
    expect(safeImageUrl("https://images.unsplash.com/photo-123?w=400")).toBe(
      "https://images.unsplash.com/photo-123?w=400",
    );
    expect(safeImageUrl("http://example.com/img.jpg")).toBe("http://example.com/img.jpg");
  });

  it("permite relative paths (Next.js Image)", () => {
    expect(safeImageUrl("/api/img?u=...")).toBe("/api/img?u=...");
    expect(safeImageUrl("/assets/hero.jpg")).toBe("/assets/hero.jpg");
  });

  it("permite data:image/png base64", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANS...";
    expect(safeImageUrl(dataUrl)).toBe(dataUrl);
  });

  it("permite data:image/jpeg base64", () => {
    const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgA...";
    expect(safeImageUrl(dataUrl)).toBe(dataUrl);
  });

  it("bloquea data:image/svg+xml (XSS via script)", () => {
    const malicious = "data:image/svg+xml,<svg><script>alert(1)</script></svg>";
    expect(safeImageUrl(malicious)).toBe("");
  });

  it("bloquea data:text/html (XSS)", () => {
    expect(safeImageUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("bloquea javascript: scheme", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBe("");
  });

  it("undefined/null/empty → string vacío", () => {
    expect(safeImageUrl(undefined)).toBe("");
    expect(safeImageUrl(null)).toBe("");
    expect(safeImageUrl("")).toBe("");
  });
});
