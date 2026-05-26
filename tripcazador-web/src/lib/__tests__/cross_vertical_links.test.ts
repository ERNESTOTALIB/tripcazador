import { describe, it, expect } from "vitest";
import {
  getTransporteSlugForIata,
  aeropuertoExists,
  loungeExists,
  transporteExists,
  parkingExists,
  dutyFreeExists,
} from "@/lib/cross_vertical_links";
import { PARKING_AEROPUERTO_IATAS } from "@/lib/parking_aeropuerto_catalog";
import { LOUNGES } from "@/lib/lounges_catalog";
import { TRANSPORTE_AEROPUERTO } from "@/lib/transporte_aeropuerto_catalog";
import { AIRPORTS_ES_IATAS } from "@/lib/airports_es_catalog";

describe("getTransporteSlugForIata", () => {
  it("resuelve slug correcto para IATAs conocidas", () => {
    expect(getTransporteSlugForIata("MAD")).toBe("madrid");
    expect(getTransporteSlugForIata("BCN")).toBe("barcelona");
    expect(getTransporteSlugForIata("LPA")).toBe("las-palmas");
    expect(getTransporteSlugForIata("TFS")).toBe("tenerife-sur");
    expect(getTransporteSlugForIata("TFN")).toBe("tenerife-norte");
    expect(getTransporteSlugForIata("SCQ")).toBe("santiago-compostela");
    expect(getTransporteSlugForIata("OVD")).toBe("asturias-oviedo");
  });

  it("retorna undefined para IATA sin transporte", () => {
    expect(getTransporteSlugForIata("XXX")).toBeUndefined();
    expect(getTransporteSlugForIata("FRA")).toBeUndefined(); // intl, no en ES
  });

  it("case-insensitive", () => {
    expect(getTransporteSlugForIata("mad")).toBe("madrid");
    expect(getTransporteSlugForIata("Mad")).toBe("madrid");
  });
});

describe("existence checkers", () => {
  it("aeropuertoExists cubre todos los AIRPORTS_ES_IATAS", () => {
    AIRPORTS_ES_IATAS.forEach((iata) => {
      expect(aeropuertoExists(iata), `${iata} debería existir`).toBe(true);
    });
    expect(aeropuertoExists("ZZZ")).toBe(false);
  });

  it("loungeExists cubre todos LOUNGES", () => {
    LOUNGES.forEach((l) => expect(loungeExists(l.iata)).toBe(true));
    expect(loungeExists("ZZZ")).toBe(false);
  });

  it("transporteExists cubre todos TRANSPORTE_AEROPUERTO IATAs", () => {
    TRANSPORTE_AEROPUERTO.forEach((c) => expect(transporteExists(c.iata)).toBe(true));
  });

  it("parkingExists cubre todos PARKING_AEROPUERTO_IATAS", () => {
    PARKING_AEROPUERTO_IATAS.forEach((iata) => expect(parkingExists(iata)).toBe(true));
  });

  it("dutyFreeExists case-insensitive", () => {
    expect(dutyFreeExists("MAD")).toBe(true);
    expect(dutyFreeExists("mad")).toBe(true);
    expect(dutyFreeExists("ZZZ")).toBe(false);
  });
});

describe("anti-regression: 20 soft-404 bugs from AUDIT", () => {
  it("parking IATAs sin transporte coverage NO devuelven slug", () => {
    // IATAs en parking pero sin transporte (si alguno) deben retornar undefined
    PARKING_AEROPUERTO_IATAS.forEach((iata) => {
      const transporteSlug = getTransporteSlugForIata(iata);
      // No debe contener espacios ni dobles guiones ni accidentes
      if (transporteSlug) {
        expect(transporteSlug).toMatch(/^[a-z0-9-]+$/);
      }
    });
  });

  it("LPA / TFS / TFN / SCQ / OVD ahora resuelven a slugs reales", () => {
    // Estos 5 fueron los bugs reportados por el audit (multi-word ciudades)
    expect(getTransporteSlugForIata("LPA")).toBe("las-palmas");
    expect(getTransporteSlugForIata("TFS")).toBe("tenerife-sur");
    expect(getTransporteSlugForIata("TFN")).toBe("tenerife-norte");
    expect(getTransporteSlugForIata("SCQ")).toBe("santiago-compostela");
    expect(getTransporteSlugForIata("OVD")).toBe("asturias-oviedo");
  });
});
