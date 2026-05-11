/**
 * api_helpers.test.ts — Pure helpers exportados desde api.ts:
 *  - formatDate
 *  - formatDuration
 *  - getCabinLabel
 *  - getClassificationColor
 *  - safeExternalUrl
 *  - safeImageUrl
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
  it("2026-06-01 → '01 Jun 2026'", () => {
    expect(formatDate("2026-06-01")).toBe("01 Jun 2026");
  });

  it("2026-01-15 → '15 Ene 2026'", () => {
    expect(formatDate("2026-01-15")).toBe("15 Ene 2026");
  });

  it("string vacía → ''", () => {
    expect(formatDate("")).toBe("");
  });

  it("string inválida → devuelve la string (no crashea)", () => {
    expect(typeof formatDate("not-a-date")).toBe("string");
  });

  it("2026-12-31 → '31 Dic 2026'", () => {
    expect(formatDate("2026-12-31")).toBe("31 Dic 2026");
  });
});

describe("formatDuration", () => {
  it("60 min → '1h'", () => {
    expect(formatDuration(60)).toBe("1h");
  });

  it("90 min → '1h 30m'", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("0 min → ''", () => {
    expect(formatDuration(0)).toBe("");
  });

  it("125 min → '2h 5m'", () => {
    expect(formatDuration(125)).toBe("2h 5m");
  });

  it("180 min → '3h'", () => {
    expect(formatDuration(180)).toBe("3h");
  });
});

describe("getCabinLabel", () => {
  it("economy → 'Economy'", () => {
    expect(getCabinLabel("economy")).toBe("Economy");
  });

  it("premium_economy → 'Premium Eco'", () => {
    expect(getCabinLabel("premium_economy")).toBe("Premium Eco");
  });

  it("business → 'Business'", () => {
    expect(getCabinLabel("business")).toBe("Business");
  });

  it("first → 'First'", () => {
    expect(getCabinLabel("first")).toBe("First");
  });

  it("desconocido → fallback echo", () => {
    expect(getCabinLabel("foo")).toBe("foo");
  });
});

describe("getClassificationColor", () => {
  it("CRÍTICO → texto rojo", () => {
    expect(getClassificationColor("CRÍTICO")).toContain("red");
  });

  it("ERROR → texto naranja", () => {
    expect(getClassificationColor("ERROR")).toContain("orange");
  });

  it("ANOMALÍA → texto amarillo", () => {
    expect(getClassificationColor("ANOMALÍA")).toContain("yellow");
  });

  it("OFERTA → texto ámbar", () => {
    expect(getClassificationColor("OFERTA")).toContain("amber");
  });

  it("desconocido → texto gris fallback", () => {
    expect(getClassificationColor("XYZ")).toContain("gray");
  });
});

describe("safeExternalUrl", () => {
  it("https URL pasa", () => {
    expect(safeExternalUrl("https://example.com")).toBe("https://example.com");
  });

  it("http URL pasa", () => {
    expect(safeExternalUrl("http://example.com")).toBe("http://example.com");
  });

  it("null → '#'", () => {
    expect(safeExternalUrl(null)).toBe("#");
  });

  it("undefined → '#'", () => {
    expect(safeExternalUrl(undefined)).toBe("#");
  });

  it("string vacía → '#'", () => {
    expect(safeExternalUrl("")).toBe("#");
  });

  it("relativa /foo → preservada", () => {
    expect(safeExternalUrl("/path")).toBe("/path");
  });

  it("hash #anchor → preservada", () => {
    expect(safeExternalUrl("#anchor")).toBe("#anchor");
  });

  it("query string ?foo → preservada", () => {
    expect(safeExternalUrl("?q=1")).toBe("?q=1");
  });

  it("javascript: → bloqueado a '#'", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBe("#");
  });

  it("JAVASCRIPT: case-insensitive → bloqueado", () => {
    expect(safeExternalUrl("JAVASCRIPT:alert(1)")).toBe("#");
  });

  it("vbscript: → bloqueado", () => {
    expect(safeExternalUrl("vbscript:msg")).toBe("#");
  });

  it("file: → bloqueado", () => {
    expect(safeExternalUrl("file:///etc/passwd")).toBe("#");
  });

  it("data: → bloqueado", () => {
    expect(safeExternalUrl("data:text/html,<script>")).toBe("#");
  });

  it("javascript con whitespace (   javascript:) → bloqueado", () => {
    expect(safeExternalUrl("   javascript:alert(1)")).toBe("#");
  });

  it("FTP → no permitido (sólo http/https para external)", () => {
    expect(safeExternalUrl("ftp://server")).toBe("#");
  });
});

describe("safeImageUrl", () => {
  it("https URL pasa", () => {
    expect(safeImageUrl("https://images.unsplash.com/x.jpg")).toBe(
      "https://images.unsplash.com/x.jpg",
    );
  });

  it("relativa /api/img → preservada", () => {
    expect(safeImageUrl("/api/img?u=x")).toBe("/api/img?u=x");
  });

  it("null → ''", () => {
    expect(safeImageUrl(null)).toBe("");
  });

  it("undefined → ''", () => {
    expect(safeImageUrl(undefined)).toBe("");
  });

  it("string vacía → ''", () => {
    expect(safeImageUrl("")).toBe("");
  });

  it("data:image/png base64 → permitido (raster)", () => {
    expect(safeImageUrl("data:image/png;base64,iVBO")).toBe(
      "data:image/png;base64,iVBO",
    );
  });

  it("data:image/jpeg → permitido", () => {
    expect(safeImageUrl("data:image/jpeg;base64,a")).toBe(
      "data:image/jpeg;base64,a",
    );
  });

  it("data:image/svg+xml → bloqueado (puede ejecutar JS)", () => {
    expect(safeImageUrl("data:image/svg+xml,<script>")).toBe("");
  });

  it("javascript: → bloqueado", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBe("");
  });

  it("ftp:// → bloqueado", () => {
    expect(safeImageUrl("ftp://server/img.jpg")).toBe("");
  });
});
