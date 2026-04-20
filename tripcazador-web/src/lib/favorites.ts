/**
 * favorites.ts — helpers puros para gestión de deals favoritos.
 *
 * Los favoritos viven en `localStorage` bajo la clave `tc_favs_v1` con formato:
 *   { ids: string[], updatedAt: number }
 *
 * Separamos los helpers de puro manejo de lista del hook de React (`useFavorites`)
 * en `useFavorites.ts` para poder testear la lógica con `vitest environment:node`
 * sin necesidad de jsdom.
 */

export const FAVORITES_KEY = "tc_favs_v1";
export const MAX_FAVORITES = 200;

export interface FavoritesStore {
  ids: string[];
  updatedAt: number;
}

/** Parsea el string bruto de localStorage a FavoritesStore con validación. */
export function parseFavorites(raw: string | null): FavoritesStore {
  if (!raw) return { ids: [], updatedAt: 0 };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ids: [], updatedAt: 0 };
    const ids = Array.isArray(parsed.ids)
      ? parsed.ids.filter((x: unknown): x is string => typeof x === "string")
      : [];
    const updatedAt =
      typeof parsed.updatedAt === "number" && parsed.updatedAt > 0
        ? parsed.updatedAt
        : 0;
    return { ids, updatedAt };
  } catch {
    return { ids: [], updatedAt: 0 };
  }
}

/** Devuelve el store serializado listo para escribir a localStorage. */
export function serializeFavorites(store: FavoritesStore): string {
  return JSON.stringify(store);
}

/** Añade un id al store. No-op si ya existe. Respeta el cap MAX_FAVORITES. */
export function addFavorite(store: FavoritesStore, id: string): FavoritesStore {
  if (!id) return store;
  if (store.ids.includes(id)) return store;
  // FIFO drop si llegamos al tope — mejor silente que error al usuario.
  const nextIds = [id, ...store.ids].slice(0, MAX_FAVORITES);
  return { ids: nextIds, updatedAt: Date.now() };
}

/** Elimina un id del store. No-op si no existe. */
export function removeFavorite(
  store: FavoritesStore,
  id: string,
): FavoritesStore {
  if (!store.ids.includes(id)) return store;
  return {
    ids: store.ids.filter((x) => x !== id),
    updatedAt: Date.now(),
  };
}

/** Toggle: añade si no está, elimina si está. */
export function toggleFavorite(
  store: FavoritesStore,
  id: string,
): FavoritesStore {
  return store.ids.includes(id)
    ? removeFavorite(store, id)
    : addFavorite(store, id);
}

export function isFavorite(store: FavoritesStore, id: string): boolean {
  return store.ids.includes(id);
}
