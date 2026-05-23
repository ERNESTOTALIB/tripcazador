/**
 * changelog_entries.ts — SSS447 (23 may 2026)
 *
 * Release notes públicas. Traducción de SSS internas a lenguaje de
 * usuario (no detalles técnicos low-level).
 *
 * Cada entrada: fecha, título, descripción corta, tipo
 * (feature/improvement/fix/security).
 *
 * Ordena por fecha desc. Manual update — añadir entrada al merge a main.
 */

export type ChangelogType = "feature" | "improvement" | "fix" | "security";

export interface ChangelogEntry {
  /** ISO date YYYY-MM-DD */
  date: string;
  title: string;
  description: string;
  type: ChangelogType;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  // 23 may 2026 — múltiples batches en pre (recently shipped o pending)
  {
    date: "2026-05-23",
    title: "200+ guías nuevas y herramientas para viajeros",
    description:
      "Aeropuertos ES (15), guías de check-in por aerolínea (15), comparador AVE vs avión (8 rutas), escapadas fin de semana (12), códigos por país (15), aeropuertos del mundo (20), conferencias tech (8), eventos top España (8), guías ampliadas glosario (15), seguro/eSIM/visados por destino (94) y mucho más.",
    type: "feature",
  },
  {
    date: "2026-05-23",
    title: "Calendar export .ics para tus chollos",
    description:
      "En cada deal puedes descargar un archivo .ics para añadir las fechas del vuelo a Apple Calendar, Google Calendar o Outlook con un clic.",
    type: "feature",
  },
  {
    date: "2026-05-23",
    title: "Recuperación de pedidos Concierge incompletos",
    description:
      "Si abres el formulario Concierge pero no completas la compra, un banner discreto te ofrece un cupón -10% para volver dentro de 24h.",
    type: "feature",
  },
  {
    date: "2026-05-23",
    title: "Selector de moneda en /deals",
    description:
      "Ahora puedes cambiar EUR/USD/CHF/GBP desde la barra de filtros en /deals — afecta a todas las cards visibles.",
    type: "improvement",
  },
  {
    date: "2026-05-23",
    title: "JSON Feed 1.1 y widget público partners",
    description:
      "Aggregators modernos (NetNewsWire, Inoreader) ahora encuentran /feed.json automático. Además partners pueden embeber JSON CORS-enabled en /api/widgets/deals + iframe single-deal en /embed/deal-card/[id].",
    type: "feature",
  },
  // 21-22 may 2026
  {
    date: "2026-05-21",
    title: "Persistencia KV — scoring v3 con outcomes reales",
    description:
      "Migramos scoring v3 + savings_log + event_store a Upstash KV. Esto desbloquea el feedback loop ML sin intervención manual.",
    type: "improvement",
  },
  {
    date: "2026-05-21",
    title: "Stripe Connect agency tier + revshare 70/30",
    description:
      "Las agencias parte del programa /partners/agencia ahora reciben automáticamente 70% revenue de los clientes que refieren via Stripe Connect Express.",
    type: "feature",
  },
  // 20 may 2026
  {
    date: "2026-05-20",
    title: "Trial 14 días gratis Premium + plan anual €99",
    description:
      "Nueva opción de pago anual (€99/año vs €120 mensual) + trial 14 días sin tarjeta. Premium Gift card €9.99 lanzado.",
    type: "feature",
  },
  {
    date: "2026-05-20",
    title: "864 nuevas landings SEO programmatic",
    description:
      "Landings 'comprar-vuelo/[ruta]', 'cuando-volar/[mes]/[ciudad]', 'aerolinea-vs-aerolinea/[a]/[b]' generadas automáticamente desde catálogos.",
    type: "feature",
  },
  // 19 may 2026
  {
    date: "2026-05-19",
    title: "ROI 'Has ahorrado X€' + Trip Planner Premium",
    description:
      "Nuevo widget en /panel/premium que calcula cuánto te ha ahorrado TripCazador acumulado. Trip Planner combina vuelo + hotel automatic.",
    type: "feature",
  },
  // 18 may 2026
  {
    date: "2026-05-18",
    title: "Premium UX — filtros pro, alertas tiempo real, secret deals",
    description:
      "Suscriptores Premium ahora tienen acceso a 4 filtros pro server-side (aerolínea/clase/escalas/horario), alertas en tiempo real para sus rutas favoritas, y deals secret 24h antes que el público.",
    type: "feature",
  },
  // 17 may 2026
  {
    date: "2026-05-17",
    title: "Programa de referidos — 1 mes gratis Premium por cada amigo",
    description:
      "Genera tu código TC-XXXXXXXX y por cada amigo que se suscribe a Premium, ambos os lleváis un mes gratis. Stripe coupon auto-aplica al checkout.",
    type: "feature",
  },
  {
    date: "2026-05-17",
    title: "Seguridad — admin endpoint sin auth fix",
    description:
      "Hemos cerrado un endpoint admin que respondía sin verificación. Sin impacto en datos de usuarios (solo metadata interna). Hardening de cookie auth en todos los /api/admin/*.",
    type: "security",
  },
  // 16 may 2026
  {
    date: "2026-05-16",
    title: "Soporte 8 idiomas: ES/EN/DE/FR/IT/PT/NL/PL",
    description:
      "Las landings de precio por ruta + email weekly digest ahora se localizan automáticamente al idioma del navegador del usuario.",
    type: "feature",
  },
];

export const CHANGELOG_BY_DATE: Record<string, ChangelogEntry[]> = CHANGELOG_ENTRIES.reduce(
  (acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  },
  {} as Record<string, ChangelogEntry[]>,
);

/** Fechas únicas ordenadas desc. */
export const CHANGELOG_DATES = Object.keys(CHANGELOG_BY_DATE).sort((a, b) => b.localeCompare(a));
