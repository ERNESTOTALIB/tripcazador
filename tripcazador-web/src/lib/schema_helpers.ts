/**
 * schema_helpers.ts — SSS338 (20 may 2026)
 *
 * Helpers para generar JSON-LD structured data:
 *  - FAQPage
 *  - BreadcrumbList
 *  - FlightReservation (deal detail)
 *  - Product (Premium pricing)
 *  - Organization
 *  - WebPage
 *  - Article (blog)
 *
 * Todo el output es plain object listo para `<JsonLd data={...} />`.
 * No incluye escape ni sanitization — eso lo gestiona `JsonLd` componente.
 */

const BASE_URL = "https://tripcazador.com";

export interface FAQItem {
  q: string;
  a: string;
}

export function faqPageSchema(items: FAQItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string; // path absoluto SIN dominio o URL completa
}

export function breadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url.startsWith("http") ? b.url : `${BASE_URL}${b.url}`,
    })),
  };
}

export interface FlightOffer {
  origin: string; // IATA o nombre
  destination: string;
  cityFrom?: string;
  cityTo?: string;
  airline?: string;
  airlineCode?: string;
  priceEur: number;
  dateOut?: string; // ISO date
  dateRet?: string;
  bookingUrl: string;
}

/**
 * FlightReservation / Offer schema para deal detail.
 * Google usa esto para ricos resultados de "vuelos" en SERP.
 */
export function flightOfferSchema(o: FlightOffer): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Flight",
    flightNumber: undefined,
    airline: o.airline
      ? {
          "@type": "Airline",
          name: o.airline,
          iataCode: o.airlineCode,
        }
      : undefined,
    departureAirport: {
      "@type": "Airport",
      iataCode: o.origin,
      name: o.cityFrom || o.origin,
    },
    arrivalAirport: {
      "@type": "Airport",
      iataCode: o.destination,
      name: o.cityTo || o.destination,
    },
    departureTime: o.dateOut,
    arrivalTime: o.dateRet,
    offers: {
      "@type": "Offer",
      price: o.priceEur,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: o.bookingUrl,
      validFrom: new Date().toISOString(),
    },
  };
}

/**
 * Schema Product para landing Premium — Google muestra precio + rating.
 */
export function premiumProductSchema(opts: {
  name: string;
  description: string;
  priceEur: number;
  url: string;
  ratingValue?: number;
  reviewCount?: number;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    brand: { "@type": "Brand", name: "TripCazador" },
    offers: {
      "@type": "Offer",
      price: opts.priceEur,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: opts.url,
    },
    aggregateRating:
      opts.ratingValue && opts.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: opts.ratingValue,
            reviewCount: opts.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}

/**
 * Organization schema — global, se renderiza en layout root.
 */
export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TripCazador",
    url: BASE_URL,
    logo: `${BASE_URL}/icon-512.png`,
    description:
      "Cazadores de chollos de vuelos. Encontramos errores de precio reales y te avisamos antes que nadie.",
    sameAs: [
      "https://twitter.com/tripcazador",
      "https://instagram.com/tripcazador",
      "https://www.tiktok.com/@tripcazador",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "soporte@tripcazador.com",
      areaServed: "ES",
      availableLanguage: ["Spanish", "English"],
    },
  };
}

/**
 * WebPage schema genérico para landings programmatic SEO.
 */
export function webPageSchema(opts: {
  url: string;
  name: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbItems?: BreadcrumbItem[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": opts.url.startsWith("http") ? opts.url : `${BASE_URL}${opts.url}`,
    url: opts.url.startsWith("http") ? opts.url : `${BASE_URL}${opts.url}`,
    name: opts.name,
    description: opts.description,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    breadcrumb: opts.breadcrumbItems
      ? breadcrumbSchema(opts.breadcrumbItems)
      : undefined,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "TripCazador",
      url: BASE_URL,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// SSS398 — HowTo schema (Google rich result eligible)

export interface HowToStep {
  name: string;
  text: string;
  /** Posición 1-based (Google requirement) */
  position?: number;
  /** Tiempo estimado paso (ISO 8601 duration, ej. "PT5M") */
  totalTime?: string;
}

export interface HowToSchemaInput {
  name: string;
  description: string;
  /** Tiempo total ISO 8601 (ej. "PT15M") */
  totalTime?: string;
  /** Coste estimado, opcional */
  estimatedCost?: { currency: string; value: number };
  steps: HowToStep[];
}

export function howToSchema(input: HowToSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    totalTime: input.totalTime,
    estimatedCost: input.estimatedCost
      ? {
          "@type": "MonetaryAmount",
          currency: input.estimatedCost.currency,
          value: input.estimatedCost.value,
        }
      : undefined,
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: s.position ?? i + 1,
      name: s.name,
      text: s.text,
      totalTime: s.totalTime,
    })),
  };
}

// ──────────────────────────────────────────────────────────────
// SSS398 — Article schema (para blog posts)

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  url: string;
  datePublished: string; // ISO 8601
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
  /** Section name (e.g. "Travel Tips") */
  articleSection?: string;
  wordCount?: number;
}

export function articleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline.slice(0, 110), // Google limit 110 chars
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      "@type": "Organization",
      name: input.authorName || "TripCazador",
      url: "https://tripcazador.com",
    },
    publisher: {
      "@type": "Organization",
      name: "TripCazador",
      logo: {
        "@type": "ImageObject",
        url: "https://tripcazador.com/brand/logo.png",
      },
    },
    image: input.imageUrl,
    articleSection: input.articleSection,
    wordCount: input.wordCount,
    inLanguage: "es-ES",
  };
}

// ──────────────────────────────────────────────────────────────
// NEXT (26 may 2026) — Place schema con GeoCoordinates + TouristDestination

/**
 * Airport schema (extends Place with GeoCoordinates) — habilita Google
 * Maps rich result en SERP cuando alguien busca "aeropuerto X".
 */
export interface AirportPlaceInput {
  iata: string;
  ciudad: string;
  formalName: string;
  lat: number;
  lng: number;
  address: string;
  postalCode?: string;
  url: string;
  /** Sameas Wikipedia/Wikidata (opcional) */
  sameAs?: string[];
}

export function airportPlaceSchema(input: AirportPlaceInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Airport",
    name: input.formalName,
    iataCode: input.iata,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address,
      addressLocality: input.ciudad,
      postalCode: input.postalCode,
      addressCountry: "ES",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.lat,
      longitude: input.lng,
    },
    url: input.url,
    sameAs: input.sameAs,
  };
}

/**
 * TouristDestination schema — destino turístico para /destinos/[slug].
 * Google muestra rich cards con imagen + descripción en SERP "qué visitar X".
 */
export interface TouristDestinationInput {
  name: string;
  description: string;
  url: string;
  /** Country ISO o "Multiple" */
  country?: string;
  imageUrl?: string;
  /** Touristic types (Beach, Mountain, City, Cultural, etc.) */
  touristType?: string[];
  /** Lat/Lng opcional para Maps rich result */
  lat?: number;
  lng?: number;
}

export function touristDestinationSchema(input: TouristDestinationInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.imageUrl,
    touristType: input.touristType,
    geo:
      input.lat && input.lng
        ? {
            "@type": "GeoCoordinates",
            latitude: input.lat,
            longitude: input.lng,
          }
        : undefined,
    address: input.country
      ? {
          "@type": "PostalAddress",
          addressCountry: input.country,
        }
      : undefined,
  };
}

// ──────────────────────────────────────────────────────────────
// SUPER-SEO (25 may 2026) — WebSite SearchAction + Speakable + Review

/**
 * WebSite con SearchAction — habilita Google "sitelinks search box"
 * cuando aparece TripCazador en SERP. Critical para branded search.
 */
export function websiteSearchActionSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "TripCazador",
    url: BASE_URL,
    description: "Cazadores de chollos de vuelos hispanohablantes",
    publisher: {
      "@type": "Organization",
      name: "TripCazador",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "es-ES",
  };
}

export interface ReviewSchemaInput {
  reviewBody: string;
  ratingValue: number;
  authorName: string;
  datePublished?: string;
}

/**
 * AggregateRating Review — para landings con testimonios reales.
 * Critical para mostrar estrellas en SERP.
 */
export function aggregateRatingSchema(opts: {
  itemName: string;
  itemType: "Organization" | "Product" | "Service";
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  reviews?: ReviewSchemaInput[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": opts.itemType,
    name: opts.itemName,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: opts.ratingValue,
      reviewCount: opts.reviewCount,
      bestRating: opts.bestRating ?? 5,
      worstRating: 1,
    },
    review: opts.reviews?.map((r) => ({
      "@type": "Review",
      reviewBody: r.reviewBody,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.ratingValue,
        bestRating: 5,
      },
      author: { "@type": "Person", name: r.authorName },
      datePublished: r.datePublished,
    })),
  };
}

/**
 * SpeakableSpecification — marca contenido apto para voice assistants
 * (Google Assistant lo lee en respuesta voz). Mejora "Hey Google, ¿X?".
 */
export function speakableSchema(cssSelectors: string[]): Record<string, unknown> {
  return {
    "@type": "SpeakableSpecification",
    cssSelector: cssSelectors,
  };
}

/**
 * Limpieza: drops undefined keys recursivamente — Google a veces se queja
 * de "missing required field" si hay nulls.
 */
export function cleanSchema<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj
      .map((v) => cleanSchema(v))
      .filter((v) => v !== undefined && v !== null) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      const cleaned = cleanSchema(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out as T;
  }
  return obj;
}
