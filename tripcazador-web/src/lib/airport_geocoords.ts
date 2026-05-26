/**
 * airport_geocoords.ts — NEXT batch (26 may 2026)
 *
 * Latitud/longitud de los aeropuertos ES + algunos internacionales.
 * Coordenadas verificadas Google Maps. Usado para Place schema
 * (GeoCoordinates) en /aeropuertos/[iata].
 */

export interface AirportGeo {
  iata: string;
  lat: number;
  lng: number;
  /** Address oficial (Place schema) */
  address: string;
  postalCode?: string;
}

export const AIRPORT_GEOCOORDS: Record<string, AirportGeo> = {
  MAD: { iata: "MAD", lat: 40.4983, lng: -3.5676, address: "Av. de la Hispanidad, s/n, 28042 Madrid", postalCode: "28042" },
  BCN: { iata: "BCN", lat: 41.2974, lng: 2.0833, address: "08820 El Prat de Llobregat, Barcelona", postalCode: "08820" },
  AGP: { iata: "AGP", lat: 36.6749, lng: -4.4991, address: "Av. del Comandante García Morato, s/n, 29004 Málaga", postalCode: "29004" },
  PMI: { iata: "PMI", lat: 39.5517, lng: 2.7388, address: "Carretera de l'Aeroport, s/n, 07611 Palma", postalCode: "07611" },
  ALC: { iata: "ALC", lat: 38.2822, lng: -0.5582, address: "Ctra. N-338, s/n, 03195 Elche", postalCode: "03195" },
  VLC: { iata: "VLC", lat: 39.4893, lng: -0.4816, address: "Carretera de l'Aeroport, s/n, 46940 Manises", postalCode: "46940" },
  SVQ: { iata: "SVQ", lat: 37.4180, lng: -5.8931, address: "N-IV km 532, 41020 Sevilla", postalCode: "41020" },
  BIO: { iata: "BIO", lat: 43.3011, lng: -2.9106, address: "48180 Loiu, Bizkaia", postalCode: "48180" },
  LPA: { iata: "LPA", lat: 27.9319, lng: -15.3866, address: "Autopista Sur LP-2, 35230 Telde", postalCode: "35230" },
  TFS: { iata: "TFS", lat: 28.0445, lng: -16.5725, address: "Autopista del Sur TF-1, 38610 Granadilla de Abona", postalCode: "38610" },
  TFN: { iata: "TFN", lat: 28.4824, lng: -16.3414, address: "38297 La Laguna, Santa Cruz de Tenerife", postalCode: "38297" },
  IBZ: { iata: "IBZ", lat: 38.8729, lng: 1.3731, address: "Carretera Aeroport, 07817 Sant Josep de sa Talaia", postalCode: "07817" },
  GRX: { iata: "GRX", lat: 37.1887, lng: -3.7775, address: "Ctra. de Málaga, s/n, 18329 Chauchina", postalCode: "18329" },
  SCQ: { iata: "SCQ", lat: 42.8964, lng: -8.4151, address: "15820 Santiago de Compostela", postalCode: "15820" },
  OVD: { iata: "OVD", lat: 43.5636, lng: -6.0346, address: "33459 Castrillón, Asturias", postalCode: "33459" },
  FUE: { iata: "FUE", lat: 28.4527, lng: -13.8638, address: "35610 Antigua, Fuerteventura", postalCode: "35610" },
  ACE: { iata: "ACE", lat: 28.9455, lng: -13.6052, address: "Carretera Arrecife-Yaiza, 35500 Lanzarote", postalCode: "35500" },
  MAH: { iata: "MAH", lat: 39.8626, lng: 4.2186, address: "07712 Maó-Mahón, Menorca", postalCode: "07712" },
  XRY: { iata: "XRY", lat: 36.7445, lng: -6.0601, address: "Ctra. N-IV km 9, 11401 Jerez", postalCode: "11401" },
  PNA: { iata: "PNA", lat: 42.7700, lng: -1.6463, address: "Ctra. del Aeropuerto, s/n, 31110 Noáin", postalCode: "31110" },
};

export function getAirportGeo(iata: string): AirportGeo | undefined {
  return AIRPORT_GEOCOORDS[iata.toUpperCase()];
}
