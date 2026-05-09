/**
 * destinations_i18n.ts — WWW01 (May 2026)
 *
 * Catálogo compartido para destinos slug pages en /it /de /fr (mirror
 * de DESTINATIONS_EN en /en/destinos/[slug]). Reduce duplicación al
 * mantener una sola fuente de datos con campos por idioma.
 *
 * 6 destinos curados con localización ES (canonical) + EN + IT + DE + FR.
 * Limitado a 6 (vs 8 EN) porque el ROI de DACH/IT es menor que UK/US.
 */

export type Locale = "it" | "de" | "fr";

export interface DestI18nEntry {
  /** Slug usado en /it /de /fr (suele ser igual al EN/ES). */
  slug: string;
  /** Slug equivalente ES (canonical). */
  esSlug: string;
  iata: string[];
  emoji: string;
  /** Translations por idioma. */
  i18n: Record<Locale | "en", {
    name: string;
    countryLocal: string;
    description: string;
    bestMonths: string[];
    avgTemp: string;
    flightTime: string;
    tips: string[];
  }>;
  avgErrorFare?: number;
  isLongHaul: boolean;
}

export const DESTINATIONS_I18N: Record<string, DestI18nEntry> = {
  japan: {
    slug: "japan",
    esSlug: "japon",
    iata: ["NRT", "HND", "KIX"],
    emoji: "🗼",
    isLongHaul: true,
    avgErrorFare: 480,
    i18n: {
      en: {
        name: "Japan",
        countryLocal: "Japan, East Asia",
        description: "Mistake fares to Japan from Europe pop up several times a year. Best combo: error-fare ticket + cherry-blossom or autumn-foliage season.",
        bestMonths: ["March", "April", "October", "November"],
        avgTemp: "10-25°C",
        flightTime: "~12-14h",
        tips: [
          "Cherry blossoms (sakura): late March - early April",
          "Autumn (koyo): October-November (red leaves season)",
          "JR Pass: buy before flying",
        ],
      },
      it: {
        name: "Giappone",
        countryLocal: "Giappone, Asia orientale",
        description: "Errori tariffari verso il Giappone dall'Europa appaiono più volte all'anno. Combinazione migliore: biglietto error-fare + stagione dei ciliegi o foliage autunnale.",
        bestMonths: ["Marzo", "Aprile", "Ottobre", "Novembre"],
        avgTemp: "10-25°C",
        flightTime: "~12-14h",
        tips: [
          "Fioritura ciliegi (sakura): fine marzo - inizio aprile",
          "Autunno (koyo): ottobre-novembre (foglie rosse)",
          "JR Pass: comprare prima del volo",
        ],
      },
      de: {
        name: "Japan",
        countryLocal: "Japan, Ostasien",
        description: "Fehler-Tarife nach Japan aus Europa erscheinen mehrmals im Jahr. Beste Kombi: Error-Fare-Ticket + Kirschblüte oder Herbstlaub.",
        bestMonths: ["März", "April", "Oktober", "November"],
        avgTemp: "10-25°C",
        flightTime: "~12-14h",
        tips: [
          "Kirschblüte (Sakura): Ende März - Anfang April",
          "Herbst (Koyo): Oktober-November (rote Blätter)",
          "JR Pass: vor dem Flug kaufen",
        ],
      },
      fr: {
        name: "Japon",
        countryLocal: "Japon, Asie de l'Est",
        description: "Les tarifs erreur vers le Japon depuis l'Europe apparaissent plusieurs fois par an. Meilleure combinaison: billet error-fare + saison des cerisiers ou feuillage d'automne.",
        bestMonths: ["Mars", "Avril", "Octobre", "Novembre"],
        avgTemp: "10-25°C",
        flightTime: "~12-14h",
        tips: [
          "Floraison cerisiers (sakura): fin mars - début avril",
          "Automne (koyo): octobre-novembre (feuilles rouges)",
          "JR Pass: acheter avant le vol",
        ],
      },
    },
  },
  thailand: {
    slug: "thailand",
    esSlug: "tailandia",
    iata: ["BKK", "HKT", "CNX"],
    emoji: "🛕",
    isLongHaul: true,
    avgErrorFare: 410,
    i18n: {
      en: {
        name: "Thailand",
        countryLocal: "Thailand, Southeast Asia",
        description: "Cheap year-round, but November-February hits the sweet spot of dry weather and pre-Lunar-New-Year mistake fares.",
        bestMonths: ["November", "December", "January", "February"],
        avgTemp: "26-32°C",
        flightTime: "~11-13h",
        tips: [
          "Skip April (Songkran water festival)",
          "30-day visa-free for EU passports",
          "Avoid May-Oct (monsoon)",
        ],
      },
      it: {
        name: "Thailandia",
        countryLocal: "Thailandia, Sud-est asiatico",
        description: "Economica tutto l'anno, ma novembre-febbraio è il sweet spot per tempo asciutto e tariffe errore pre-Capodanno lunare.",
        bestMonths: ["Novembre", "Dicembre", "Gennaio", "Febbraio"],
        avgTemp: "26-32°C",
        flightTime: "~11-13h",
        tips: [
          "Evita aprile (festival dell'acqua Songkran)",
          "30 giorni senza visto per passaporti UE",
          "Evita maggio-ottobre (monsone)",
        ],
      },
      de: {
        name: "Thailand",
        countryLocal: "Thailand, Südostasien",
        description: "Ganzjährig günstig, aber November-Februar ist der Sweet Spot für trockenes Wetter und Pre-Lunar-Neujahr-Fehlertarife.",
        bestMonths: ["November", "Dezember", "Januar", "Februar"],
        avgTemp: "26-32°C",
        flightTime: "~11-13h",
        tips: [
          "April vermeiden (Songkran-Wasserfestival)",
          "30 Tage visumfrei für EU-Pässe",
          "Mai-Oktober vermeiden (Monsun)",
        ],
      },
      fr: {
        name: "Thaïlande",
        countryLocal: "Thaïlande, Asie du Sud-Est",
        description: "Pas chère toute l'année, mais novembre-février est le sweet spot pour temps sec et tarifs erreur pré-Nouvel An lunaire.",
        bestMonths: ["Novembre", "Décembre", "Janvier", "Février"],
        avgTemp: "26-32°C",
        flightTime: "~11-13h",
        tips: [
          "Éviter avril (festival de l'eau Songkran)",
          "30 jours sans visa pour passeports UE",
          "Éviter mai-octobre (mousson)",
        ],
      },
    },
  },
  bali: {
    slug: "bali",
    esSlug: "bali",
    iata: ["DPS"],
    emoji: "🌺",
    isLongHaul: true,
    avgErrorFare: 620,
    i18n: {
      en: {
        name: "Bali",
        countryLocal: "Indonesia, Southeast Asia",
        description: "Bali sees fewer mistake fares than Bangkok, but May-September dry season + Singapore Airlines errors via SIN are gold.",
        bestMonths: ["May", "June", "July", "August", "September"],
        avgTemp: "26-30°C",
        flightTime: "~16-18h",
        tips: [
          "Avoid Christmas (peak prices)",
          "Best stays: Ubud + Canggu + Uluwatu",
          "Visa on arrival: 35 USD for 30 days",
        ],
      },
      it: {
        name: "Bali",
        countryLocal: "Indonesia, Sud-est asiatico",
        description: "Bali ha meno tariffe errore di Bangkok, ma stagione secca maggio-settembre + errori Singapore Airlines via SIN sono oro.",
        bestMonths: ["Maggio", "Giugno", "Luglio", "Agosto", "Settembre"],
        avgTemp: "26-30°C",
        flightTime: "~16-18h",
        tips: [
          "Evita Natale (prezzi di picco)",
          "Migliori soggiorni: Ubud + Canggu + Uluwatu",
          "Visto all'arrivo: 35 USD per 30 giorni",
        ],
      },
      de: {
        name: "Bali",
        countryLocal: "Indonesien, Südostasien",
        description: "Bali hat weniger Fehlertarife als Bangkok, aber Trockenzeit Mai-September + Singapore Airlines Fehler über SIN sind Gold wert.",
        bestMonths: ["Mai", "Juni", "Juli", "August", "September"],
        avgTemp: "26-30°C",
        flightTime: "~16-18h",
        tips: [
          "Weihnachten vermeiden (Spitzenpreise)",
          "Beste Aufenthalte: Ubud + Canggu + Uluwatu",
          "Visum bei Ankunft: 35 USD für 30 Tage",
        ],
      },
      fr: {
        name: "Bali",
        countryLocal: "Indonésie, Asie du Sud-Est",
        description: "Bali a moins de tarifs erreur que Bangkok, mais la saison sèche mai-septembre + erreurs Singapore Airlines via SIN sont en or.",
        bestMonths: ["Mai", "Juin", "Juillet", "Août", "Septembre"],
        avgTemp: "26-30°C",
        flightTime: "~16-18h",
        tips: [
          "Éviter Noël (prix de pointe)",
          "Meilleurs séjours: Ubud + Canggu + Uluwatu",
          "Visa à l'arrivée: 35 USD pour 30 jours",
        ],
      },
    },
  },
  "new-york": {
    slug: "new-york",
    esSlug: "nueva-york",
    iata: ["JFK", "EWR", "LGA"],
    emoji: "🗽",
    isLongHaul: true,
    avgErrorFare: 280,
    i18n: {
      en: {
        name: "New York City",
        countryLocal: "USA, North America",
        description: "Highest density of transatlantic mistake fares from Europe. Especially Business class.",
        bestMonths: ["April", "May", "September", "October"],
        avgTemp: "0-30°C",
        flightTime: "~8h",
        tips: [
          "Best: spring (Apr-May) and fall (Sep-Oct)",
          "ESTA mandatory for EU citizens (21 USD)",
          "Avoid July-August (humid + crowded)",
        ],
      },
      it: {
        name: "New York",
        countryLocal: "USA, Nord America",
        description: "Massima densità di tariffe errore transatlantiche dall'Europa. Specialmente Business class.",
        bestMonths: ["Aprile", "Maggio", "Settembre", "Ottobre"],
        avgTemp: "0-30°C",
        flightTime: "~8h",
        tips: [
          "Migliore: primavera (Apr-Mag) e autunno (Set-Ott)",
          "ESTA obbligatorio per cittadini UE (21 USD)",
          "Evita luglio-agosto (umido + affollato)",
        ],
      },
      de: {
        name: "New York City",
        countryLocal: "USA, Nordamerika",
        description: "Höchste Dichte transatlantischer Fehlertarife aus Europa. Besonders Business Class.",
        bestMonths: ["April", "Mai", "September", "Oktober"],
        avgTemp: "0-30°C",
        flightTime: "~8h",
        tips: [
          "Beste Zeit: Frühling (Apr-Mai) und Herbst (Sep-Okt)",
          "ESTA Pflicht für EU-Bürger (21 USD)",
          "Juli-August vermeiden (schwül + voll)",
        ],
      },
      fr: {
        name: "New York",
        countryLocal: "USA, Amérique du Nord",
        description: "Plus haute densité de tarifs erreur transatlantiques depuis l'Europe. Particulièrement Business class.",
        bestMonths: ["Avril", "Mai", "Septembre", "Octobre"],
        avgTemp: "0-30°C",
        flightTime: "~8h",
        tips: [
          "Meilleure période: printemps (Avr-Mai) et automne (Sep-Oct)",
          "ESTA obligatoire pour citoyens UE (21 USD)",
          "Éviter juillet-août (humide + bondé)",
        ],
      },
    },
  },
  iceland: {
    slug: "iceland",
    esSlug: "islandia",
    iata: ["KEF"],
    emoji: "🌋",
    isLongHaul: false,
    avgErrorFare: 220,
    i18n: {
      en: {
        name: "Iceland",
        countryLocal: "Iceland, North Atlantic",
        description: "Icelandair stopover (up to 7 days free) makes Iceland an effective free layover on transatlantic itineraries.",
        bestMonths: ["June", "July", "August", "September", "March"],
        avgTemp: "-5 to 15°C",
        flightTime: "~3-4h",
        tips: [
          "Northern lights: Sept-March",
          "Stopover free up to 7 nights with Icelandair",
          "Rental car essential",
        ],
      },
      it: {
        name: "Islanda",
        countryLocal: "Islanda, Nord Atlantico",
        description: "Lo stopover Icelandair (fino a 7 giorni gratuiti) rende l'Islanda un layover efficace gratis su itinerari transatlantici.",
        bestMonths: ["Giugno", "Luglio", "Agosto", "Settembre", "Marzo"],
        avgTemp: "-5 a 15°C",
        flightTime: "~3-4h",
        tips: [
          "Aurore boreali: Set-Mar",
          "Stopover gratis fino a 7 notti con Icelandair",
          "Auto a noleggio essenziale",
        ],
      },
      de: {
        name: "Island",
        countryLocal: "Island, Nordatlantik",
        description: "Der Icelandair Stopover (bis zu 7 Tage kostenlos) macht Island zu einem effektiven kostenlosen Layover auf transatlantischen Routen.",
        bestMonths: ["Juni", "Juli", "August", "September", "März"],
        avgTemp: "-5 bis 15°C",
        flightTime: "~3-4h",
        tips: [
          "Nordlichter: Sep-März",
          "Stopover bis zu 7 Nächte mit Icelandair gratis",
          "Mietwagen unverzichtbar",
        ],
      },
      fr: {
        name: "Islande",
        countryLocal: "Islande, Atlantique Nord",
        description: "L'escale Icelandair (jusqu'à 7 jours gratuits) fait de l'Islande une escale gratuite efficace sur itinéraires transatlantiques.",
        bestMonths: ["Juin", "Juillet", "Août", "Septembre", "Mars"],
        avgTemp: "-5 à 15°C",
        flightTime: "~3-4h",
        tips: [
          "Aurores boréales: Sep-Mars",
          "Escale gratuite jusqu'à 7 nuits avec Icelandair",
          "Location voiture essentielle",
        ],
      },
    },
  },
  bangkok: {
    slug: "bangkok",
    esSlug: "bangkok",
    iata: ["BKK"],
    emoji: "🛕",
    isLongHaul: true,
    avgErrorFare: 420,
    i18n: {
      en: {
        name: "Bangkok",
        countryLocal: "Thailand, Southeast Asia",
        description: "Bangkok is the SE Asia hub. Frequent mistake fares with Qatar, Etihad, Turkish via hub.",
        bestMonths: ["November", "December", "January", "February"],
        avgTemp: "26-32°C",
        flightTime: "~11h with one stop",
        tips: [
          "Suvarnabhumi (BKK) preferred over Don Mueang (DMK)",
          "Visa-free 30 days for EU",
          "BTS Skytrain best transport",
        ],
      },
      it: {
        name: "Bangkok",
        countryLocal: "Thailandia, Sud-est asiatico",
        description: "Bangkok è l'hub del Sud-est asiatico. Tariffe errore frequenti con Qatar, Etihad, Turkish via hub.",
        bestMonths: ["Novembre", "Dicembre", "Gennaio", "Febbraio"],
        avgTemp: "26-32°C",
        flightTime: "~11h con uno scalo",
        tips: [
          "Suvarnabhumi (BKK) preferito a Don Mueang (DMK)",
          "30 giorni senza visto per UE",
          "BTS Skytrain miglior trasporto",
        ],
      },
      de: {
        name: "Bangkok",
        countryLocal: "Thailand, Südostasien",
        description: "Bangkok ist der SE-Asien-Hub. Häufige Fehlertarife mit Qatar, Etihad, Turkish via Hub.",
        bestMonths: ["November", "Dezember", "Januar", "Februar"],
        avgTemp: "26-32°C",
        flightTime: "~11h mit einem Stopp",
        tips: [
          "Suvarnabhumi (BKK) bevorzugt vor Don Mueang (DMK)",
          "30 Tage visumfrei für EU",
          "BTS Skytrain bestes Verkehrsmittel",
        ],
      },
      fr: {
        name: "Bangkok",
        countryLocal: "Thaïlande, Asie du Sud-Est",
        description: "Bangkok est le hub de l'Asie du Sud-Est. Tarifs erreur fréquents avec Qatar, Etihad, Turkish via hub.",
        bestMonths: ["Novembre", "Décembre", "Janvier", "Février"],
        avgTemp: "26-32°C",
        flightTime: "~11h avec une escale",
        tips: [
          "Suvarnabhumi (BKK) préféré à Don Mueang (DMK)",
          "30 jours sans visa pour UE",
          "BTS Skytrain meilleur transport",
        ],
      },
    },
  },
  paris: {
    slug: "paris",
    esSlug: "paris",
    iata: ["CDG", "ORY", "BVA"],
    emoji: "🗼",
    isLongHaul: false,
    avgErrorFare: 65,
    i18n: {
      en: {
        name: "Paris",
        countryLocal: "France, Western Europe",
        description: "Paris is one of the most-flown short-haul routes in Europe. Easy mistake fares with Vueling, easyJet, Air France from €30 one-way.",
        bestMonths: ["April", "May", "June", "September", "October"],
        avgTemp: "8-22°C",
        flightTime: "~2h",
        tips: [
          "CDG vs ORY vs BVA — BVA Beauvais is 1h bus from city center",
          "Museum Pass 2/4/6 days saves money",
          "Avoid August: many shops closed for vacation",
        ],
      },
      it: {
        name: "Parigi",
        countryLocal: "Francia, Europa occidentale",
        description: "Parigi è una delle rotte short-haul più volate in Europa. Errori tariffari facili con Vueling, easyJet, Air France da €30 sola andata.",
        bestMonths: ["Aprile", "Maggio", "Giugno", "Settembre", "Ottobre"],
        avgTemp: "8-22°C",
        flightTime: "~2h",
        tips: [
          "CDG vs ORY vs BVA — BVA Beauvais è a 1h di bus dal centro",
          "Museum Pass 2/4/6 giorni fa risparmiare",
          "Evitare agosto: molti negozi chiusi per ferie",
        ],
      },
      de: {
        name: "Paris",
        countryLocal: "Frankreich, Westeuropa",
        description: "Paris ist eine der meistgeflogenen Kurzstrecken in Europa. Einfache Fehlertarife mit Vueling, easyJet, Air France ab €30 one-way.",
        bestMonths: ["April", "Mai", "Juni", "September", "Oktober"],
        avgTemp: "8-22°C",
        flightTime: "~2h",
        tips: [
          "CDG vs ORY vs BVA — BVA Beauvais ist 1h Bus vom Zentrum",
          "Museum Pass 2/4/6 Tage spart Geld",
          "August meiden: viele Läden im Urlaub geschlossen",
        ],
      },
      fr: {
        name: "Paris",
        countryLocal: "France, Europe occidentale",
        description: "Paris est l'une des routes court-courrier les plus volées en Europe. Tarifs erreur faciles avec Vueling, easyJet, Air France dès 30€ aller simple.",
        bestMonths: ["Avril", "Mai", "Juin", "Septembre", "Octobre"],
        avgTemp: "8-22°C",
        flightTime: "~2h",
        tips: [
          "CDG vs ORY vs BVA — BVA Beauvais à 1h en bus du centre",
          "Pass musées 2/4/6 jours fait économiser",
          "Éviter août: beaucoup de boutiques fermées",
        ],
      },
    },
  },
  london: {
    slug: "london",
    esSlug: "londres",
    iata: ["LHR", "LGW", "STN", "LTN", "LCY"],
    emoji: "🎡",
    isLongHaul: false,
    avgErrorFare: 55,
    i18n: {
      en: {
        name: "London",
        countryLocal: "United Kingdom, Western Europe",
        description: "London has 5 airports, more low-cost options than any EU city. Ryanair STN, easyJet LGW/LTN, BA LHR. Mistake fares from €20 one-way.",
        bestMonths: ["May", "June", "July", "September"],
        avgTemp: "6-22°C",
        flightTime: "~2h 30min",
        tips: [
          "STN cheapest but 1h train to center (£15)",
          "Oyster card or contactless saves 50% on transport",
          "Brexit: ID/passport mandatory, no DNI",
        ],
      },
      it: {
        name: "Londra",
        countryLocal: "Regno Unito, Europa occidentale",
        description: "Londra ha 5 aeroporti, più opzioni low-cost di qualsiasi città UE. Ryanair STN, easyJet LGW/LTN, BA LHR. Tariffe errore da €20 sola andata.",
        bestMonths: ["Maggio", "Giugno", "Luglio", "Settembre"],
        avgTemp: "6-22°C",
        flightTime: "~2h 30min",
        tips: [
          "STN più economico ma 1h di treno per il centro (£15)",
          "Oyster card o contactless risparmia il 50% sui trasporti",
          "Brexit: passaporto obbligatorio",
        ],
      },
      de: {
        name: "London",
        countryLocal: "Vereinigtes Königreich, Westeuropa",
        description: "London hat 5 Flughäfen, mehr Low-Cost-Optionen als jede andere EU-Stadt. Ryanair STN, easyJet LGW/LTN, BA LHR. Fehlertarife ab €20 one-way.",
        bestMonths: ["Mai", "Juni", "Juli", "September"],
        avgTemp: "6-22°C",
        flightTime: "~2h 30min",
        tips: [
          "STN am günstigsten aber 1h Zug zum Zentrum (£15)",
          "Oyster Card oder kontaktlos spart 50% bei Verkehrsmitteln",
          "Brexit: Reisepass Pflicht, kein Personalausweis",
        ],
      },
      fr: {
        name: "Londres",
        countryLocal: "Royaume-Uni, Europe occidentale",
        description: "Londres a 5 aéroports, plus d'options low-cost qu'aucune ville UE. Ryanair STN, easyJet LGW/LTN, BA LHR. Tarifs erreur dès 20€ aller simple.",
        bestMonths: ["Mai", "Juin", "Juillet", "Septembre"],
        avgTemp: "6-22°C",
        flightTime: "~2h 30min",
        tips: [
          "STN moins cher mais 1h en train du centre (£15)",
          "Oyster card ou sans contact économise 50% sur les transports",
          "Brexit: passeport obligatoire, pas de CNI",
        ],
      },
    },
  },
  lisbon: {
    slug: "lisbon",
    esSlug: "lisboa",
    iata: ["LIS"],
    emoji: "🚋",
    isLongHaul: false,
    avgErrorFare: 60,
    i18n: {
      en: {
        name: "Lisbon",
        countryLocal: "Portugal, Iberian Peninsula",
        description: "Lisbon is the cheapest Western European capital. Mistake fares from Madrid/Barcelona under €30 round-trip. Best weekend escape value.",
        bestMonths: ["April", "May", "June", "September", "October"],
        avgTemp: "13-28°C",
        flightTime: "~2h 30min",
        tips: [
          "Tram 28 cheaper than tourist tram",
          "Pastéis de Belém vs Pastéis de Nata — taste difference",
          "Sintra and Cascais 30-40min by train, easy day trips",
        ],
      },
      it: {
        name: "Lisbona",
        countryLocal: "Portogallo, Penisola iberica",
        description: "Lisbona è la capitale dell'Europa occidentale più economica. Tariffe errore da Madrid/Barcellona sotto i €30 andata e ritorno. Miglior valore weekend.",
        bestMonths: ["Aprile", "Maggio", "Giugno", "Settembre", "Ottobre"],
        avgTemp: "13-28°C",
        flightTime: "~2h 30min",
        tips: [
          "Tram 28 più economico del tram turistico",
          "Pastéis de Belém vs Pastéis de Nata — differenza di gusto",
          "Sintra e Cascais a 30-40min in treno, gite facili",
        ],
      },
      de: {
        name: "Lissabon",
        countryLocal: "Portugal, Iberische Halbinsel",
        description: "Lissabon ist die günstigste westeuropäische Hauptstadt. Fehlertarife von Madrid/Barcelona unter €30 hin und zurück. Bestes Wochenend-Ziel.",
        bestMonths: ["April", "Mai", "Juni", "September", "Oktober"],
        avgTemp: "13-28°C",
        flightTime: "~2h 30min",
        tips: [
          "Tram 28 günstiger als Touristen-Tram",
          "Pastéis de Belém vs Pastéis de Nata — Geschmacksunterschied",
          "Sintra und Cascais 30-40min mit Zug, einfache Tagesausflüge",
        ],
      },
      fr: {
        name: "Lisbonne",
        countryLocal: "Portugal, Péninsule ibérique",
        description: "Lisbonne est la capitale d'Europe occidentale la moins chère. Tarifs erreur depuis Madrid/Barcelone sous 30€ aller-retour. Meilleur weekend.",
        bestMonths: ["Avril", "Mai", "Juin", "Septembre", "Octobre"],
        avgTemp: "13-28°C",
        flightTime: "~2h 30min",
        tips: [
          "Tram 28 moins cher que le tram touristique",
          "Pastéis de Belém vs Pastéis de Nata — différence de goût",
          "Sintra et Cascais à 30-40min en train, sorties faciles",
        ],
      },
    },
  },
  dubai: {
    slug: "dubai",
    esSlug: "dubai",
    iata: ["DXB", "DWC"],
    emoji: "🏙️",
    isLongHaul: true,
    avgErrorFare: 380,
    i18n: {
      en: {
        name: "Dubai",
        countryLocal: "UAE, Middle East",
        description: "Dubai is Emirates' hub — frequent mistake fares Europe-DXB. Stopover programs make it a free 2-night layover en route to Asia/Oceania.",
        bestMonths: ["November", "December", "January", "February", "March"],
        avgTemp: "20-35°C",
        flightTime: "~7h",
        tips: [
          "Avoid June-August: 40°C+ extreme heat",
          "Emirates stopover from $25/night at Dubai hotels",
          "Metro cheapest, taxis with meter mandatory",
        ],
      },
      it: {
        name: "Dubai",
        countryLocal: "EAU, Medio Oriente",
        description: "Dubai è l'hub di Emirates — tariffe errore frequenti Europa-DXB. I programmi stopover lo rendono uno scalo gratis di 2 notti verso Asia/Oceania.",
        bestMonths: ["Novembre", "Dicembre", "Gennaio", "Febbraio", "Marzo"],
        avgTemp: "20-35°C",
        flightTime: "~7h",
        tips: [
          "Evitare giugno-agosto: caldo estremo oltre 40°C",
          "Stopover Emirates da $25/notte negli hotel Dubai",
          "Metro più economica, taxi con tassametro obbligatori",
        ],
      },
      de: {
        name: "Dubai",
        countryLocal: "VAE, Naher Osten",
        description: "Dubai ist das Emirates-Drehkreuz — häufige Fehlertarife Europa-DXB. Stopover-Programme bieten 2 Gratis-Nächte Richtung Asien/Ozeanien.",
        bestMonths: ["November", "Dezember", "Januar", "Februar", "März"],
        avgTemp: "20-35°C",
        flightTime: "~7h",
        tips: [
          "Juni-August meiden: extreme Hitze über 40°C",
          "Emirates-Stopover ab $25/Nacht in Dubai-Hotels",
          "Metro am günstigsten, Taxis mit Taxameter Pflicht",
        ],
      },
      fr: {
        name: "Dubaï",
        countryLocal: "EAU, Moyen-Orient",
        description: "Dubaï est le hub d'Emirates — tarifs erreur fréquents Europe-DXB. Les programmes escale en font une halte gratuite de 2 nuits vers Asie/Océanie.",
        bestMonths: ["Novembre", "Décembre", "Janvier", "Février", "Mars"],
        avgTemp: "20-35°C",
        flightTime: "~7h",
        tips: [
          "Éviter juin-août: chaleur extrême plus de 40°C",
          "Escale Emirates dès 25$/nuit dans les hôtels Dubaï",
          "Métro moins cher, taxis avec compteur obligatoires",
        ],
      },
    },
  },
};

/** Mapping de strings UI a cada idioma. */
export const UI_STRINGS = {
  en: {
    home: "Home",
    destinations: "Destinations",
    cheapFlightsTo: "Cheap flights to",
    bestMonths: "Best months to fly",
    flightTime: "Flight time",
    avgTemp: "Average temperature",
    airports: "Airports",
    country: "Country",
    hunterTips: "Hunter tips",
    avgErrorFare: "Average mistake-fare spotted (last 90d)",
    notifyMe: "Notify me",
    notifyDescription: "Our hunter scans this route every 4 hours. Subscribe to push alerts and get a notification within 60s.",
    otherDestinations: "Other popular destinations",
    economyRt: "economy round-trip from EU",
  },
  it: {
    home: "Home",
    destinations: "Destinazioni",
    cheapFlightsTo: "Voli economici per",
    bestMonths: "Mesi migliori per volare",
    flightTime: "Durata volo",
    avgTemp: "Temperatura media",
    airports: "Aeroporti",
    country: "Paese",
    hunterTips: "Consigli del cacciatore",
    avgErrorFare: "Tariffa errore media (ultimi 90 giorni)",
    notifyMe: "Avvisami",
    notifyDescription: "Il nostro motore scansiona questa rotta ogni 4 ore. Iscriviti agli avvisi push e ricevi una notifica in 60 secondi.",
    otherDestinations: "Altre destinazioni popolari",
    economyRt: "economy andata e ritorno dall'UE",
  },
  de: {
    home: "Startseite",
    destinations: "Reiseziele",
    cheapFlightsTo: "Günstige Flüge nach",
    bestMonths: "Beste Reisemonate",
    flightTime: "Flugzeit",
    avgTemp: "Durchschnittstemperatur",
    airports: "Flughäfen",
    country: "Land",
    hunterTips: "Hunter-Tipps",
    avgErrorFare: "Durchschnittlicher Fehlertarif (letzte 90 Tage)",
    notifyMe: "Benachrichtigen",
    notifyDescription: "Unser Hunter scannt diese Route alle 4 Stunden. Abonniere Push-Alerts und erhalte eine Benachrichtigung in 60 Sekunden.",
    otherDestinations: "Andere beliebte Reiseziele",
    economyRt: "Economy hin und zurück aus EU",
  },
  fr: {
    home: "Accueil",
    destinations: "Destinations",
    cheapFlightsTo: "Vols pas chers pour",
    bestMonths: "Meilleurs mois pour voler",
    flightTime: "Durée du vol",
    avgTemp: "Température moyenne",
    airports: "Aéroports",
    country: "Pays",
    hunterTips: "Conseils du chasseur",
    avgErrorFare: "Tarif erreur moyen (90 derniers jours)",
    notifyMe: "Me notifier",
    notifyDescription: "Notre moteur analyse cette route toutes les 4 heures. Abonnez-vous aux alertes push et recevez une notification en 60 secondes.",
    otherDestinations: "Autres destinations populaires",
    economyRt: "économique aller-retour depuis UE",
  },
} as const;

export const I18N_LOCALES: Locale[] = ["it", "de", "fr"];
