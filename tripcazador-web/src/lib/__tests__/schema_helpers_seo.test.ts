import { describe, it, expect } from "vitest";
import {
  websiteSearchActionSchema,
  aggregateRatingSchema,
  speakableSchema,
  airportPlaceSchema,
  touristDestinationSchema,
} from "@/lib/schema_helpers";

describe("websiteSearchActionSchema", () => {
  it("genera SearchAction válida con urlTemplate", () => {
    const s = websiteSearchActionSchema();
    expect(s["@type"]).toBe("WebSite");
    expect((s as Record<string, unknown>).potentialAction).toMatchObject({
      "@type": "SearchAction",
      "query-input": "required name=search_term_string",
    });
    const action = (s as { potentialAction: { target: { urlTemplate: string } } })
      .potentialAction;
    expect(action.target.urlTemplate).toContain("{search_term_string}");
    expect(action.target.urlTemplate).toContain("https://");
  });

  it("incluye inLanguage es-ES", () => {
    const s = websiteSearchActionSchema();
    expect((s as Record<string, unknown>).inLanguage).toBe("es-ES");
  });
});

describe("aggregateRatingSchema", () => {
  it("genera AggregateRating con ratingValue + reviewCount", () => {
    const s = aggregateRatingSchema({
      itemName: "TripCazador",
      itemType: "Organization",
      ratingValue: 4.7,
      reviewCount: 23,
    });
    expect(s["@type"]).toBe("Organization");
    expect((s as { aggregateRating: { ratingValue: number; reviewCount: number } }).aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 23,
      bestRating: 5,
    });
  });

  it("incluye reviews array si se pasa", () => {
    const s = aggregateRatingSchema({
      itemName: "X",
      itemType: "Product",
      ratingValue: 5,
      reviewCount: 1,
      reviews: [
        { reviewBody: "Great", ratingValue: 5, authorName: "Test User" },
      ],
    });
    const reviews = (s as Record<string, unknown>).review as Array<Record<string, unknown>>;
    expect(reviews.length).toBe(1);
    expect((reviews[0].author as Record<string, unknown>).name).toBe("Test User");
  });
});

describe("speakableSchema", () => {
  it("genera SpeakableSpecification con cssSelectors", () => {
    const s = speakableSchema(["h1", ".lead"]);
    expect(s["@type"]).toBe("SpeakableSpecification");
    expect((s as Record<string, unknown>).cssSelector).toEqual(["h1", ".lead"]);
  });
});

describe("airportPlaceSchema", () => {
  it("genera Airport con GeoCoordinates + PostalAddress", () => {
    const s = airportPlaceSchema({
      iata: "MAD",
      ciudad: "Madrid",
      formalName: "Adolfo Suárez Madrid-Barajas",
      lat: 40.4983,
      lng: -3.5676,
      address: "Av. Hispanidad",
      postalCode: "28042",
      url: "https://tripcazador.com/aeropuertos/mad",
    });
    expect(s["@type"]).toBe("Airport");
    expect((s as Record<string, unknown>).iataCode).toBe("MAD");
    const geo = (s as { geo: { latitude: number; longitude: number } }).geo;
    expect(geo.latitude).toBe(40.4983);
    expect(geo.longitude).toBe(-3.5676);
    const addr = (s as { address: { addressCountry: string } }).address;
    expect(addr.addressCountry).toBe("ES");
  });
});

describe("touristDestinationSchema", () => {
  it("genera TouristDestination con campos básicos", () => {
    const s = touristDestinationSchema({
      name: "Japón",
      description: "Cultura ancestral y tecnología moderna",
      url: "https://tripcazador.com/destinos/japon",
      country: "JP",
      touristType: ["Cultural", "Urban"],
    });
    expect(s["@type"]).toBe("TouristDestination");
    expect((s as Record<string, unknown>).name).toBe("Japón");
    const addr = (s as { address: { addressCountry: string } }).address;
    expect(addr.addressCountry).toBe("JP");
  });

  it("incluye geo cuando lat+lng pasados", () => {
    const s = touristDestinationSchema({
      name: "Tokio",
      description: "Capital",
      url: "https://tripcazador.com/destinos/tokio",
      lat: 35.6762,
      lng: 139.6503,
    });
    const geo = (s as { geo?: { latitude: number; longitude: number } }).geo;
    expect(geo?.latitude).toBe(35.6762);
  });
});
