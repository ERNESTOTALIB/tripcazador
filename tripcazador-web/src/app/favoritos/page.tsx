import type { Metadata } from "next";
import { FavoritesClient } from "./FavoritesClient";

/**
 * /favoritos — página de favoritos del usuario.
 *
 * Los IDs favoritos viven en `localStorage`, por eso todo el render es
 * client-side. Este server component solo aporta los metadatos SEO (noindex
 * porque el contenido depende del dispositivo del usuario).
 */

export const metadata: Metadata = {
  title: "Mis favoritos",
  description:
    "Los chollos de vuelos que has guardado. Se almacenan en tu navegador — no necesitas cuenta.",
  alternates: { canonical: "/favoritos" },
  robots: {
    index: false,
    follow: true,
  },
};

// Render dinámico — aunque el contenido sea client-side, marcamos la ruta
// como dinámica para evitar que Next intente prerender un snapshot con
// localStorage vacío como "versión oficial".
export const dynamic = "force-dynamic";

export default function FavoritesPage() {
  return <FavoritesClient />;
}
