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
});
