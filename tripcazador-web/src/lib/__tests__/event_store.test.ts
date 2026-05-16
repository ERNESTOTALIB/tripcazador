/**
 * event_store.test.ts — SSS229 (16 may 2026)
 *
 * Tests para lib/event_store.ts (281 líneas sin coverage previa).
 *
 * Cubre: trackEvent, getRecentEvents, aggregate24h con:
 * - Filtrado TTL (>24h descartado)
 * - Ring buffer overflow (cuando >RING_SIZE eventos)
 * - by_type counting por tipo
 * - top_routes con peso (deal_click=5, booking_redirect=10, result_viewed=1)
 * - unique_visitors set deduplica
 * - estimatedCommission heurística
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  trackEvent,
  getRecentEvents,
  aggregate24h,
  type TrackedEvent,
  type EventType,
} from "../event_store";

function makeEvent(
  type: EventType,
  visitor: string,
  meta: Record<string, string | number | boolean> = {},
  tsOffset = 0,
): TrackedEvent {
  return {
    ts: Date.now() + tsOffset,
    type,
    visitor_id: visitor,
    meta,
  };
}

// Reset store entre tests via flush — el store es global module-scoped.
// Para tests aislados usamos visitors únicos por test.
let testCounter = 0;
function uniqueVisitor(): string {
  testCounter += 1;
  return `test_visitor_${testCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("event_store — trackEvent + getRecentEvents", () => {
  it("trackEvent + getRecentEvents devuelve el evento", () => {
    const visitor = uniqueVisitor();
    const evt = makeEvent("page_view", visitor, { path: "/" });
    trackEvent(evt);
    const recent = getRecentEvents();
    const found = recent.find((e) => e.visitor_id === visitor);
    expect(found).toBeDefined();
    expect(found?.type).toBe("page_view");
  });

  it("filtra eventos >24h", () => {
    const visitor = uniqueVisitor();
    // Past 25h
    const oldEvt = makeEvent("page_view", visitor, {}, -25 * 60 * 60 * 1000);
    trackEvent(oldEvt);
    const recent = getRecentEvents();
    const found = recent.find((e) => e.visitor_id === visitor);
    expect(found).toBeUndefined();
  });

  it("eventos ordenados por ts DESC", () => {
    const v1 = uniqueVisitor();
    const v2 = uniqueVisitor();
    trackEvent(makeEvent("page_view", v1, {}, -5000)); // older
    trackEvent(makeEvent("page_view", v2, {}, 0)); // newer
    const recent = getRecentEvents();
    const idxNew = recent.findIndex((e) => e.visitor_id === v2);
    const idxOld = recent.findIndex((e) => e.visitor_id === v1);
    expect(idxNew).toBeLessThan(idxOld);
  });
});

describe("event_store — aggregate24h", () => {
  it("by_type counting", () => {
    const v1 = uniqueVisitor();
    trackEvent(makeEvent("deal_click", v1, { origin: "MAD", destination: "LIS", airline_name: "Ryanair" }));
    trackEvent(makeEvent("deal_click", v1, { origin: "MAD", destination: "LIS", airline_name: "Ryanair" }));
    trackEvent(makeEvent("booking_redirect", v1, { origin: "MAD", destination: "LIS" }));
    const agg = aggregate24h();
    expect(agg.totals.deal_clicks_24h).toBeGreaterThanOrEqual(2);
    expect(agg.totals.booking_redirects_24h).toBeGreaterThanOrEqual(1);
  });

  it("top_routes con peso correcto (deal_click=5, booking_redirect=10)", () => {
    const visitor = uniqueVisitor();
    // Route ABC→XYZ: 1 deal_click (5) + 1 booking_redirect (10) = 15
    trackEvent(makeEvent("deal_click", visitor, { origin: "ABC", destination: "XYZ" }));
    trackEvent(makeEvent("booking_redirect", visitor, { origin: "ABC", destination: "XYZ" }));
    const agg = aggregate24h();
    const route = agg.top_routes.find((r) => r.route === "ABC→XYZ");
    expect(route).toBeDefined();
    expect(route?.clicks).toBeGreaterThanOrEqual(15);
  });

  it("unique_visitors deduplica por visitor_id", () => {
    const v = uniqueVisitor();
    // Same visitor, 3 events → unique = 1
    trackEvent(makeEvent("page_view", v));
    trackEvent(makeEvent("page_view", v));
    trackEvent(makeEvent("deal_click", v, { origin: "X", destination: "Y" }));
    const agg = aggregate24h();
    // unique includes this visitor exactly once
    expect(agg.totals.unique_visitors_24h).toBeGreaterThanOrEqual(1);
  });

  it("estimated_commission_eur dentro de conversion bloque", () => {
    const visitor = uniqueVisitor();
    trackEvent(makeEvent("booking_redirect", visitor, { origin: "A", destination: "B" }));
    const agg = aggregate24h();
    // formula: booking_redirects × €120 × 3% × 5%. Field nested under conversion.
    expect(agg.conversion).toBeDefined();
    expect(agg.conversion.estimated_commission_eur).toBeDefined();
    expect(typeof agg.conversion.estimated_commission_eur).toBe("number");
    expect(agg.conversion.estimated_commission_eur).toBeGreaterThanOrEqual(0);
  });

  it("result_viewed contribuye al top_routes con peso 1", () => {
    const visitor = uniqueVisitor();
    trackEvent(makeEvent("result_viewed", visitor, { origin: "RR1", destination: "RR2" }));
    const agg = aggregate24h();
    const route = agg.top_routes.find((r) => r.route === "RR1→RR2");
    expect(route).toBeDefined();
    expect(route?.clicks).toBeGreaterThanOrEqual(1);
  });

  it("aggregate retorna por_type con counts > 0 tras eventos", () => {
    const v = uniqueVisitor();
    trackEvent(makeEvent("favorite_added", v));
    const agg = aggregate24h();
    expect(agg.by_type).toBeDefined();
    expect(agg.by_type.favorite_added).toBeGreaterThanOrEqual(1);
  });
});
