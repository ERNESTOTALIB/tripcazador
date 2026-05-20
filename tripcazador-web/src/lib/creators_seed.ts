/**
 * creators_seed.ts — SSS364 (21 may 2026)
 *
 * Catálogo seed de creators marketplace. Cada creator tiene una landing
 * /creator/[handle] branded con sus chollos + tracking links 8% comm.
 *
 * Para escalar: convertir a backend store o CMS. Por ahora hardcoded.
 */

export interface Creator {
  handle: string; // url slug
  display_name: string;
  bio: string; // 1 párrafo
  avatar: string; // emoji o URL (placeholder hasta tener imagen real)
  social: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  /** Regions / topics preferidos para mostrar deals matched */
  topics: string[];
  /** Track code para attribuir ventas — 8% comm sobre Premium signups */
  ref_code: string;
  /** Cuántos followers totales (manual update). */
  followers_total?: number;
  active: boolean;
}

export const CREATORS: Creator[] = [
  {
    handle: "demo-creator",
    display_name: "Ejemplo Creator",
    bio: "Cazador de chollos a Asia y América Latina. Especializado en business class. Comparte sus mejores hallazgos cada semana.",
    avatar: "🎯",
    social: {
      instagram: "https://instagram.com/tripcazador",
      tiktok: "https://www.tiktok.com/@tripcazador",
    },
    topics: ["asia", "america", "business-class"],
    ref_code: "CREATOR-DEMO",
    followers_total: 12000,
    active: true,
  },
];

export function findCreator(handle: string): Creator | undefined {
  return CREATORS.find((c) => c.handle === handle && c.active);
}

export function getAllCreatorHandles(): string[] {
  return CREATORS.filter((c) => c.active).map((c) => c.handle);
}
