import { describe, it, expect } from "vitest";
import { buildIcs, type IcsEvent } from "../ics_builder";

describe("buildIcs (SSS419)", () => {
  const baseEvent: IcsEvent = {
    uid: "ryanair_mad_lis_20260902_economy-out",
    summary: "✈️ Madrid → Lisboa · 16€",
    description: "Chollo detectado por TripCazador.\nPrecio 16€.",
    date: "2026-09-02",
    location: "Madrid",
    url: "https://tripcazador.com/deals/ryanair_mad_lis_20260902_economy",
  };

  it("genera VCALENDAR válido RFC 5545 con BEGIN/END correctos", () => {
    const ics = buildIcs([baseEvent]);
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics).toMatch(/\r\nEND:VCALENDAR\r\n$/);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//TripCazador//Deal Save//ES");
  });

  it("genera VEVENT con DTSTART y DTEND (siguiente día) en formato all-day", () => {
    const ics = buildIcs([baseEvent]);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260902");
    // DTEND debe ser día siguiente para all-day events
    expect(ics).toContain("DTEND;VALUE=DATE:20260903");
  });

  it("incluye UID con dominio tripcazador.com", () => {
    const ics = buildIcs([baseEvent]);
    expect(ics).toContain(
      "UID:ryanair_mad_lis_20260902_economy-out@tripcazador.com",
    );
  });

  it("escapa caracteres especiales en SUMMARY y DESCRIPTION", () => {
    const ics = buildIcs([
      {
        ...baseEvent,
        summary: "Madrid; Lisboa, weekend",
        description: "Línea 1\nLínea 2; con coma, también",
      },
    ]);
    // RFC 5545: ; , \n se escapan con \
    expect(ics).toContain("SUMMARY:Madrid\\; Lisboa\\, weekend");
    expect(ics).toContain("DESCRIPTION:Línea 1\\nLínea 2\\; con coma\\, también");
  });

  it("soporta múltiples eventos (outbound + return)", () => {
    const out: IcsEvent = { ...baseEvent };
    const back: IcsEvent = {
      ...baseEvent,
      uid: "ryanair_mad_lis_20260902_economy-back",
      summary: "✈️ Lisboa → Madrid (vuelta)",
      date: "2026-09-09",
      location: "Lisboa",
    };
    const ics = buildIcs([out, back]);

    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(2);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260902");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260909");
  });

  it("genera DTSTAMP con timestamp UTC válido", () => {
    const ics = buildIcs([baseEvent]);
    const m = ics.match(/DTSTAMP:(\d{8}T\d{6}Z)/);
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/^\d{8}T\d{6}Z$/);
  });

  it("incluye TRANSP:TRANSPARENT (no bloquea calendario)", () => {
    const ics = buildIcs([baseEvent]);
    expect(ics).toContain("TRANSP:TRANSPARENT");
  });

  it("foldea líneas largas a 73 chars + CRLF + space (RFC 5545)", () => {
    const longSummary = "Este es un summary muy largo que ".repeat(5);
    const ics = buildIcs([{ ...baseEvent, summary: longSummary }]);
    // Tras foldear, ninguna línea de la output debería tener > 75 caracteres
    const lines = ics.split("\r\n");
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it("usa CRLF (no LF) entre líneas — requerido por RFC 5545", () => {
    const ics = buildIcs([baseEvent]);
    expect(ics).toContain("\r\n");
    // No debe haber LF sin CR antes
    expect(ics.split(/(?<!\r)\n/).length).toBe(1);
  });

  it("URL property emitida cuando se proporciona", () => {
    const ics = buildIcs([baseEvent]);
    expect(ics).toContain("URL:https://tripcazador.com/deals/");
  });

  it("URL property omitida si no se proporciona", () => {
    const noUrl = { ...baseEvent, url: undefined };
    const ics = buildIcs([noUrl]);
    expect(ics).not.toContain("URL:");
  });
});
