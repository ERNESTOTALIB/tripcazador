import { describe, it, expect } from "vitest";
import {
  kayakUrl,
  ryanairUrl,
  easyjetUrl,
  wizzairUrl,
  travelpayoutsUrl,
  getBookingUrl,
  enhanceDealBookingUrl,
} from "../airline_links";

describe("airline_links — direct booking URLs", () => {
  describe("kayakUrl", () => {
    it("genera URL one-way con sort=price_a", () => {
      const u = kayakUrl("ZRH", "MAD", "2026-06-01");
      expect(u).toBe("https://www.kayak.es/flights/ZRH-MAD/2026-06-01?sort=price_a");
    });
    it("incluye date_ret cuando ida+vuelta", () => {
      const u = kayakUrl("ZRH", "MAD", "2026-06-01", "2026-06-08");
      expect(u).toContain("/2026-06-01/2026-06-08");
    });
    it("sanitiza IATA inválido a fallback", () => {
      const u = kayakUrl("zrh1", "MAD", "2026-06-01");
      // "zrh1" no es 3 letras válidas → sanitiza a vacío → fallback
      expect(u).toBe("https://www.kayak.es/flights");
    });
    it("rechaza fecha malformada", () => {
      const u = kayakUrl("ZRH", "MAD", "2026/06/01");
      expect(u).toBe("https://www.kayak.es/flights/ZRH-MAD");
    });
  });

  describe("ryanairUrl", () => {
    it("genera deeplink con originIata/destinationIata", () => {
      const u = ryanairUrl("STN", "BCN", "2026-06-01");
      expect(u).toContain("ryanair.com/es/es/trip/flights/select");
      expect(u).toContain("originIata=STN");
      expect(u).toContain("destinationIata=BCN");
      expect(u).toContain("dateOut=2026-06-01");
      expect(u).toContain("isReturn=false");
    });
    it("marca isReturn=true cuando hay dateRet", () => {
      const u = ryanairUrl("STN", "BCN", "2026-06-01", "2026-06-08");
      expect(u).toContain("isReturn=true");
      expect(u).toContain("dateIn=2026-06-08");
    });
    it("fallback a Kayak si fecha inválida", () => {
      const u = ryanairUrl("STN", "BCN", "");
      expect(u).toContain("kayak.es");
    });
  });

  describe("easyjetUrl", () => {
    it("usa lowercase IATA en path", () => {
      const u = easyjetUrl("LGW", "PMI", "2026-06-01");
      expect(u).toContain("/lgw/pmi");
      expect(u).toContain("departDate=2026-06-01");
    });
  });

  describe("wizzairUrl", () => {
    it("isRoundTrip=false sin date_ret", () => {
      const u = wizzairUrl("LTN", "WAW", "2026-06-01");
      expect(u).toContain("isRoundTrip=false");
      expect(u).toContain("departureIata=LTN");
      expect(u).toContain("arrivalIata=WAW");
    });
  });

  describe("travelpayoutsUrl", () => {
    it("sin marker → kayak", () => {
      const u = travelpayoutsUrl("ZRH", "MAD", "2026-06-01");
      expect(u).toContain("kayak.es");
    });
  });

  describe("getBookingUrl — routing por aerolínea", () => {
    it("Ryanair (FR) → ryanair.com", () => {
      const u = getBookingUrl({
        airlineCode: "FR",
        airlineName: "Ryanair",
        origin: "STN",
        destination: "BCN",
        dateOut: "2026-06-01",
      });
      expect(u).toContain("ryanair.com");
    });
    it("easyJet (U2) → easyjet.com", () => {
      const u = getBookingUrl({
        airlineCode: "U2",
        airlineName: "easyJet",
        origin: "LGW",
        destination: "PMI",
        dateOut: "2026-06-01",
      });
      expect(u).toContain("easyjet.com");
    });
    it("Wizz (W6) → wizzair.com", () => {
      const u = getBookingUrl({
        airlineCode: "W6",
        airlineName: "Wizz Air",
        origin: "LTN",
        destination: "WAW",
        dateOut: "2026-06-01",
      });
      expect(u).toContain("wizzair.com");
    });
    it("Iberia (IB) sin builder → Kayak fallback", () => {
      const u = getBookingUrl({
        airlineCode: "IB",
        airlineName: "Iberia",
        origin: "MAD",
        destination: "EZE",
        dateOut: "2026-06-01",
      });
      expect(u).toContain("kayak.es");
      expect(u).not.toContain("google.com");
    });
    it("solo nombre (sin code) — match Ryanair por substring", () => {
      const u = getBookingUrl({
        airlineCode: "",
        airlineName: "Ryanair Holdings",
        origin: "STN",
        destination: "BCN",
        dateOut: "2026-06-01",
      });
      expect(u).toContain("ryanair.com");
    });
  });

  describe("enhanceDealBookingUrl", () => {
    it("reescribe Google Flights → Kayak (Iberia)", () => {
      const deal = {
        booking_url: "https://www.google.com/travel/flights?q=ZRH+to+MAD",
        airline_code: "IB",
        airline_name: "Iberia",
        origin: "ZRH",
        destination: "MAD",
        date_out: "2026-06-01",
      };
      const out = enhanceDealBookingUrl(deal);
      expect(out.booking_url).not.toContain("google.com");
      expect(out.booking_url).toContain("kayak.es");
    });
    it("reescribe Google Flights → ryanair.com (Ryanair)", () => {
      const deal = {
        booking_url: "https://www.google.com/travel/flights?q=STN+to+BCN",
        airline_code: "FR",
        airline_name: "Ryanair",
        origin: "STN",
        destination: "BCN",
        date_out: "2026-06-01",
      };
      const out = enhanceDealBookingUrl(deal);
      expect(out.booking_url).toContain("ryanair.com");
    });
    it("respeta booking_url propio (no Google)", () => {
      const original = "https://www.ryanair.com/some-real-deeplink";
      const deal = {
        booking_url: original,
        airline_code: "FR",
        origin: "STN",
        destination: "BCN",
        date_out: "2026-06-01",
      };
      const out = enhanceDealBookingUrl(deal);
      expect(out.booking_url).toBe(original);
    });
    it("rellena cuando booking_url está vacío", () => {
      const deal = {
        booking_url: "",
        airline_code: "U2",
        airline_name: "easyJet",
        origin: "LGW",
        destination: "PMI",
        date_out: "2026-06-01",
      };
      const out = enhanceDealBookingUrl(deal);
      expect(out.booking_url).toContain("easyjet.com");
    });
  });
});
