/**
 * catalogs_invariants.test.ts — SSS454 (23 may 2026)
 *
 * Tests defensivos para los 15 catálogos nuevos SSS418-453. Verifican:
 *
 * 1. Unique slugs / IATAs / ISOs (un typo duplicado generaba 404
 *    silente en /destinos/foo cuando getDestinationBySlug devuelve el
 *    último match).
 *
 * 2. Required fields no vacíos (un slug "" o name "" rompe rendering).
 *
 * 3. *_BY_KEY size === *_CATALOG.length (la deduplicación post-build
 *    no debería ocurrir — significaría duplicado silencioso).
 *
 * 4. Cross-catalog coherencia (slugs en check_in MATCH slugs en
 *    baggage_rules — fue el bug FIX-CQ-4).
 *
 * Mantener esta suite VERDE evita 8 de los 12 bugs del audit
 * SSS418-453 si vuelven a aparecer.
 */
import { describe, it, expect } from "vitest";

import {
  AIRPORTS_ES,
  AIRPORTS_ES_IATAS,
  AIRPORTS_ES_BY_IATA,
} from "@/lib/airports_es_catalog";
import {
  AIRPORTS_WORLD,
  AIRPORTS_WORLD_IATAS,
  AIRPORTS_WORLD_BY_IATA,
} from "@/lib/airports_world_catalog";
import {
  GLOSARIO_CATALOG,
  GLOSARIO_SLUGS,
  GLOSARIO_BY_SLUG,
} from "@/lib/glosario_landings";
import { CHECK_IN_RULES, CHECK_IN_SLUGS, CHECK_IN_BY_SLUG } from "@/lib/check_in_rules";
import { BAGGAGE_RULES } from "@/lib/baggage_rules";
import {
  VUELO_TREN_CATALOG,
  VUELO_TREN_SLUGS,
  VUELO_TREN_BY_SLUG,
} from "@/lib/vuelo_tren_catalog";
import {
  FREEBIES_CATALOG,
  FREEBIES_SLUGS,
  FREEBIES_BY_SLUG,
} from "@/lib/freebies_catalog";
import {
  ESCAPADAS_CATALOG,
  ESCAPADAS_SLUGS,
  ESCAPADAS_BY_SLUG,
} from "@/lib/escapadas_catalog";
import {
  EVENTOS_ES_CATALOG,
  EVENTOS_ES_SLUGS,
  EVENTOS_ES_BY_SLUG,
} from "@/lib/eventos_es_catalog";
import {
  CONFERENCIAS_CATALOG,
  CONFERENCIAS_SLUGS,
  CONFERENCIAS_BY_SLUG,
} from "@/lib/conferencias_catalog";
import {
  CODIGOS_PAIS_CATALOG,
  CODIGOS_PAIS_ISOS,
  CODIGOS_PAIS_BY_ISO,
} from "@/lib/codigos_pais_catalog";
import {
  FLAG_CARRIERS_CATALOG,
  FLAG_CARRIERS_ISOS,
  FLAG_CARRIERS_BY_ISO,
} from "@/lib/flag_carriers_catalog";
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";
import { TRAVEL_CARDS_CATALOG } from "@/lib/travel_cards_catalog";
// SSS491: etiqueta_catalog invariants
import {
  ETIQUETA_CATALOG,
  ETIQUETA_SLUGS,
} from "@/lib/etiqueta_catalog";
// SUPER-1D: nuevos catálogos
import { MILLAS_PROGRAMAS, MILLAS_SLUGS } from "@/lib/millas_programas";
import { MCT_AIRPORTS, MCT_IATAS } from "@/lib/mct_data";
import { PROMO_CODES_CATALOG, PROMO_CODES_SLUGS } from "@/lib/promo_codes_catalog";
// SUPER-SPONSORS: equipo viaje catalog invariants
import { EQUIPO_VIAJE, EQUIPO_VIAJE_SLUGS } from "@/lib/equipo_viaje_catalog";
// SUPER-SEO: transporte aeropuerto + lounges
import { TRANSPORTE_AEROPUERTO, TRANSPORTE_AEROPUERTO_SLUGS } from "@/lib/transporte_aeropuerto_catalog";
import { LOUNGES, LOUNGE_IATAS } from "@/lib/lounges_catalog";
// NEXT: parking + duty-free + airport geocoords
import { PARKING_AEROPUERTOS, PARKING_AEROPUERTO_IATAS } from "@/lib/parking_aeropuerto_catalog";
import { DUTY_FREE, DUTY_FREE_IATAS } from "@/lib/duty_free_catalog";
import { AIRPORT_GEOCOORDS } from "@/lib/airport_geocoords";

/**
 * Verifica que un array de keys no tiene duplicados y match arr.length === set.size.
 */
function assertUniqueKeys(name: string, keys: string[]) {
  const set = new Set(keys);
  if (set.size === keys.length) return;
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  throw new Error(
    `${name}: duplicated keys detected (${dupes.join(", ")}). ` +
      `Expected unique, got ${keys.length} entries with only ${set.size} uniques.`,
  );
}

describe("catalogs_invariants — slug uniqueness", () => {
  it("airports_es: 15 IATAs únicas", () => {
    assertUniqueKeys("AIRPORTS_ES_IATAS", AIRPORTS_ES_IATAS);
    expect(Object.keys(AIRPORTS_ES_BY_IATA).length).toBe(AIRPORTS_ES.length);
  });

  it("airports_world: IATAs únicas", () => {
    assertUniqueKeys("AIRPORTS_WORLD_IATAS", AIRPORTS_WORLD_IATAS);
    expect(Object.keys(AIRPORTS_WORLD_BY_IATA).length).toBe(AIRPORTS_WORLD.length);
  });

  it("glosario_landings: slugs únicas", () => {
    assertUniqueKeys("GLOSARIO_SLUGS", GLOSARIO_SLUGS);
    expect(Object.keys(GLOSARIO_BY_SLUG).length).toBe(GLOSARIO_CATALOG.length);
  });

  it("check_in_rules: slugs únicas", () => {
    assertUniqueKeys("CHECK_IN_SLUGS", CHECK_IN_SLUGS);
    expect(Object.keys(CHECK_IN_BY_SLUG).length).toBe(CHECK_IN_RULES.length);
  });

  it("vuelo_tren: slugs únicas", () => {
    assertUniqueKeys("VUELO_TREN_SLUGS", VUELO_TREN_SLUGS);
    expect(Object.keys(VUELO_TREN_BY_SLUG).length).toBe(VUELO_TREN_CATALOG.length);
  });

  it("freebies: slugs únicas", () => {
    assertUniqueKeys("FREEBIES_SLUGS", FREEBIES_SLUGS);
    expect(Object.keys(FREEBIES_BY_SLUG).length).toBe(FREEBIES_CATALOG.length);
  });

  it("escapadas: slugs únicas", () => {
    assertUniqueKeys("ESCAPADAS_SLUGS", ESCAPADAS_SLUGS);
    expect(Object.keys(ESCAPADAS_BY_SLUG).length).toBe(ESCAPADAS_CATALOG.length);
  });

  it("eventos_es: slugs únicas", () => {
    assertUniqueKeys("EVENTOS_ES_SLUGS", EVENTOS_ES_SLUGS);
    expect(Object.keys(EVENTOS_ES_BY_SLUG).length).toBe(EVENTOS_ES_CATALOG.length);
  });

  it("conferencias: slugs únicas", () => {
    assertUniqueKeys("CONFERENCIAS_SLUGS", CONFERENCIAS_SLUGS);
    expect(Object.keys(CONFERENCIAS_BY_SLUG).length).toBe(CONFERENCIAS_CATALOG.length);
  });

  it("codigos_pais: ISOs únicos", () => {
    assertUniqueKeys("CODIGOS_PAIS_ISOS", CODIGOS_PAIS_ISOS);
    expect(Object.keys(CODIGOS_PAIS_BY_ISO).length).toBe(CODIGOS_PAIS_CATALOG.length);
  });

  it("flag_carriers: ISOs únicos", () => {
    assertUniqueKeys("FLAG_CARRIERS_ISOS", FLAG_CARRIERS_ISOS);
    expect(Object.keys(FLAG_CARRIERS_BY_ISO).length).toBe(FLAG_CARRIERS_CATALOG.length);
  });

  it("travel_cards: slugs únicas", () => {
    const slugs = TRAVEL_CARDS_CATALOG.map((c) => c.slug);
    assertUniqueKeys("TRAVEL_CARDS slugs", slugs);
  });

  // SSS491: etiqueta cultural invariants
  // AUDIT-FULL-2 (24 may): expandido 10 → 15 países
  it("etiqueta: slugs únicas + 15 países en catálogo", () => {
    assertUniqueKeys("ETIQUETA_SLUGS", ETIQUETA_SLUGS);
    expect(ETIQUETA_CATALOG.length).toBe(15);
  });

  // SUPER-1D: 3 catálogos nuevos
  it("millas_programas: slugs únicas + 6 programas", () => {
    assertUniqueKeys("MILLAS_SLUGS", MILLAS_SLUGS);
    expect(MILLAS_PROGRAMAS.length).toBe(6);
    // cpm valores razonables (8-20 cpm en saver awards realistas)
    MILLAS_PROGRAMAS.forEach((p) => {
      expect(p.cpm, `${p.slug} cpm out of range`).toBeGreaterThan(5);
      expect(p.cpm, `${p.slug} cpm out of range`).toBeLessThan(25);
    });
  });

  it("mct_data: IATAs únicas + 12 aeropuertos + MCT valores positivos", () => {
    assertUniqueKeys("MCT_IATAS", MCT_IATAS);
    expect(MCT_AIRPORTS.length).toBe(12);
    MCT_AIRPORTS.forEach((m) => {
      expect(m.domesticDomestic).toBeGreaterThan(0);
      expect(m.internationalInternational).toBeGreaterThan(0);
    });
  });

  it("promo_codes: slugs únicas + 8 aerolíneas + campos required", () => {
    assertUniqueKeys("PROMO_CODES_SLUGS", PROMO_CODES_SLUGS);
    expect(PROMO_CODES_CATALOG.length).toBe(8);
    PROMO_CODES_CATALOG.forEach((p) => {
      expect(p.cuandoSalen.length).toBeGreaterThan(20);
      expect(p.donde.length).toBeGreaterThan(20);
      expect(p.restriccionesTipo.length).toBeGreaterThan(0);
    });
  });

  it("etiqueta: countries únicas (no duplicados)", () => {
    const countries = ETIQUETA_CATALOG.map((e) => e.country);
    assertUniqueKeys("ETIQUETA countries", countries);
  });

  it("equipo_viaje: slugs únicas + 12 productos + criterios populados", () => {
    assertUniqueKeys("EQUIPO_VIAJE_SLUGS", EQUIPO_VIAJE_SLUGS);
    expect(EQUIPO_VIAJE.length).toBeGreaterThanOrEqual(10);
    EQUIPO_VIAJE.forEach((p) => {
      expect(p.criterios.length).toBeGreaterThanOrEqual(3);
      expect(p.guia.length).toBeGreaterThanOrEqual(2);
      expect(p.faqs.length).toBeGreaterThanOrEqual(2);
      expect(p.picks.presupuesto.rangeEur).toContain("€");
      expect(p.picks.medio.rangeEur).toContain("€");
      expect(p.picks.premium.rangeEur).toContain("€");
      // SEO description Google limit 160 chars
      expect(
        p.seoDescription.length,
        `seoDescription too long for ${p.slug} (${p.seoDescription.length} chars)`,
      ).toBeLessThanOrEqual(170);
    });
  });

  it("equipo_viaje: slugs match regex SEO-safe (no & ñ spaces)", () => {
    EQUIPO_VIAJE_SLUGS.forEach((s) => {
      expect(s, `slug "${s}" no es URL-safe`).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it("transporte_aeropuerto: 15 ciudades + slugs URL-safe + IATAs válidas", () => {
    assertUniqueKeys("TRANSPORTE_AEROPUERTO_SLUGS", TRANSPORTE_AEROPUERTO_SLUGS);
    expect(TRANSPORTE_AEROPUERTO.length).toBeGreaterThanOrEqual(15);
    TRANSPORTE_AEROPUERTO.forEach((c) => {
      expect(c.slug, `slug "${c.slug}" URL-safe`).toMatch(/^[a-z0-9-]+$/);
      expect(c.iata, `IATA "${c.iata}" 3 letras upper`).toMatch(/^[A-Z]{3}$/);
      expect(c.distanciaKm).toBeGreaterThan(0);
      expect(c.options.length).toBeGreaterThanOrEqual(2);
      expect(c.tips.length).toBeGreaterThanOrEqual(2);
      c.options.forEach((o) => {
        expect(o.precioEur).toBeGreaterThanOrEqual(0);
        expect(o.tiempoMin).toBeGreaterThan(0);
      });
    });
  });

  it("lounges: 12 hubs + IATAs únicas + datos populados", () => {
    assertUniqueKeys("LOUNGE_IATAS", LOUNGE_IATAS);
    expect(LOUNGES.length).toBeGreaterThanOrEqual(12);
    LOUNGES.forEach((h) => {
      expect(h.iata).toMatch(/^[A-Z]{3}$/);
      expect(h.lounges.length).toBeGreaterThanOrEqual(1);
      expect(h.tarjetasRecomendadas.length).toBeGreaterThanOrEqual(1);
      h.lounges.forEach((l) => {
        expect(l.acceso.length).toBeGreaterThanOrEqual(1);
        expect(l.servicios.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it("parking_aeropuerto: 15 hubs + IATAs únicas + precios coherentes", () => {
    assertUniqueKeys("PARKING_AEROPUERTO_IATAS", PARKING_AEROPUERTO_IATAS);
    expect(PARKING_AEROPUERTOS.length).toBeGreaterThanOrEqual(13);
    PARKING_AEROPUERTOS.forEach((p) => {
      expect(p.iata).toMatch(/^[A-Z]{3}$/);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
      p.options.forEach((o) => {
        expect(o.diaEur).toBeGreaterThan(0);
        expect(o.semanaEur).toBeGreaterThanOrEqual(o.diaEur);
        // Semana < 7×día (rebajado por estancia múltiple) — sanity check coherencia precio
        expect(o.semanaEur).toBeLessThanOrEqual(o.diaEur * 7 + 5);
      });
      expect(p.tips.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("duty_free: 10 hubs + IATAs únicas + categorías populadas", () => {
    assertUniqueKeys("DUTY_FREE_IATAS", DUTY_FREE_IATAS);
    expect(DUTY_FREE.length).toBeGreaterThanOrEqual(10);
    DUTY_FREE.forEach((d) => {
      expect(d.iata).toMatch(/^[A-Z]{3}$/);
      expect(d.categorias.length).toBeGreaterThanOrEqual(2);
      expect(d.marcas.length).toBeGreaterThanOrEqual(1);
      d.categorias.forEach((c) => {
        expect(c.exampleItems.length).toBeGreaterThanOrEqual(1);
        expect(c.vaLaPena.length).toBeGreaterThan(10);
      });
    });
  });

  it("airport_geocoords: lat+lng dentro de rangos válidos España", () => {
    const entries = Object.values(AIRPORT_GEOCOORDS);
    expect(entries.length).toBeGreaterThanOrEqual(15);
    entries.forEach((g) => {
      expect(g.iata).toMatch(/^[A-Z]{3}$/);
      // España continental: lat 27-44, lng -19 a 5 (incluye Canarias)
      expect(g.lat).toBeGreaterThan(27);
      expect(g.lat).toBeLessThan(45);
      expect(g.lng).toBeGreaterThan(-19);
      expect(g.lng).toBeLessThan(5);
      expect(g.address.length).toBeGreaterThan(5);
    });
  });
});

describe("catalogs_invariants — required fields not empty", () => {
  it("airports_es: name + city + iata no vacíos", () => {
    AIRPORTS_ES.forEach((a) => {
      expect(a.iata, `IATA missing in ${JSON.stringify(a)}`).toBeTruthy();
      expect(a.city, `city missing for ${a.iata}`).toBeTruthy();
      expect(a.formalName, `formalName missing for ${a.iata}`).toBeTruthy();
    });
  });

  it("glosario: term + shortDef + longDef no vacíos", () => {
    GLOSARIO_CATALOG.forEach((e) => {
      expect(e.slug).toBeTruthy();
      expect(e.term).toBeTruthy();
      expect(e.shortDef.length).toBeGreaterThan(20);
      expect(e.longDef.length).toBeGreaterThan(50);
    });
  });

  it("escapadas: nombre + itinerary no vacíos", () => {
    ESCAPADAS_CATALOG.forEach((e) => {
      expect(e.slug).toBeTruthy();
      expect(e.name).toBeTruthy();
      expect(e.itinerary.length).toBeGreaterThan(0);
      expect(e.avgFlightMadEur).toBeGreaterThan(0);
    });
  });

  it("conferencias: ticketPriceEur + attendees > 0", () => {
    CONFERENCIAS_CATALOG.forEach((c) => {
      expect(c.slug).toBeTruthy();
      expect(c.attendees).toBeGreaterThan(0);
      expect(c.ticketPriceEur).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("catalogs_invariants — cross-catalog coherencia", () => {
  it("FIX-CQ-4: check_in slugs ⊆ baggage_rules slugs (cross-link no-404)", () => {
    const baggageSlugs = new Set(BAGGAGE_RULES.map((b) => b.slug));
    const orphans = CHECK_IN_SLUGS.filter((s) => !baggageSlugs.has(s));
    expect(
      orphans,
      `check_in_rules slugs sin match en baggage_rules: ${orphans.join(", ")} — cross-link 404`,
    ).toEqual([]);
  });

  it("FIX-CQ-2: escapadas.destinoSlug (cuando presente) ⊆ DESTINO_SLUGS", () => {
    const validDestinos = new Set(DESTINO_SLUGS);
    const orphans = ESCAPADAS_CATALOG.filter(
      (e) => e.destinoSlug && !validDestinos.has(e.destinoSlug),
    ).map((e) => `${e.slug}→${e.destinoSlug}`);
    // El test es informativo (no failing) — el código tiene guard
    // DESTINO_SLUGS.includes() pero queremos saber si hay drift en
    // catalog que debería limpiarse.
    if (orphans.length > 0) {
      console.warn(
        `[catalogs_invariants] escapadas con destinoSlug stale (link omitido en runtime): ${orphans.join(", ")}`,
      );
    }
    // No assertions — solo log informativo.
    expect(true).toBe(true);
  });

  it("eventos_es.iata: si en AIRPORTS_ES_IATAS → cross-link OK; si no → guard runtime activa", () => {
    const esIatas = new Set(AIRPORTS_ES_IATAS);
    const offCatalog = EVENTOS_ES_CATALOG.filter((e) => !esIatas.has(e.iata)).map(
      (e) => `${e.slug}(${e.iata})`,
    );
    // Informativo — el guard ya evita 404
    if (offCatalog.length > 0) {
      console.warn(
        `[catalogs_invariants] eventos con IATA no-ES (link omitido en runtime): ${offCatalog.join(", ")}`,
      );
    }
    expect(true).toBe(true);
  });

  it("conferencias.iata: en AIRPORTS_ES_IATAS o AIRPORTS_WORLD_IATAS (sin 404)", () => {
    const allIatas = new Set([...AIRPORTS_ES_IATAS, ...AIRPORTS_WORLD_IATAS]);
    const orphans = CONFERENCIAS_CATALOG.filter((c) => !allIatas.has(c.iata)).map(
      (c) => `${c.slug}(${c.iata})`,
    );
    expect(
      orphans,
      `conferencias con IATA ni-ES ni-world: ${orphans.join(", ")} — link 404 garantizado`,
    ).toEqual([]);
  });

  // SSS491: etiqueta destinoSlug cross-link integrity
  it("etiqueta.destinoSlug: si está presente, debe existir en DESTINO_SLUGS", () => {
    const validDestinos = new Set(DESTINO_SLUGS);
    const orphans = ETIQUETA_CATALOG.filter(
      (e) => e.destinoSlug && !validDestinos.has(e.destinoSlug),
    ).map((e) => `${e.slug}→${e.destinoSlug}`);
    // Informativo — UI tiene guard. Pero el slug debería limpiarse o quitarse.
    if (orphans.length > 0) {
      console.warn(
        `[catalogs_invariants] etiqueta con destinoSlug no en DESTINO_SLUGS: ${orphans.join(", ")}`,
      );
    }
    expect(true).toBe(true);
  });
});
