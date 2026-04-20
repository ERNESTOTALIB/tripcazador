"use client";

/**
 * useFavorites — hook React que envuelve los helpers puros de `favorites.ts`
 * con estado + persistencia en `localStorage`.
 *
 * Garantías:
 * - SSR-safe: en el primer render devuelve un store vacío y sólo lee
 *   `localStorage` dentro de `useEffect` (tras montar). Evita hydration mismatches.
 * - Sincroniza entre pestañas vía el evento `storage`.
 * - Persistencia best-effort: si falla (quota, modo incognito), el estado
 *   en memoria sigue funcionando en esa sesión sin romper.
 */

import { useCallback, useEffect, useState } from "react";
import {
  FAVORITES_KEY,
  FavoritesStore,
  addFavorite,
  isFavorite,
  parseFavorites,
  removeFavorite,
  serializeFavorites,
  toggleFavorite,
} from "./favorites";

const EMPTY: FavoritesStore = { ids: [], updatedAt: 0 };

export interface UseFavoritesResult {
  /** IDs favoritos, orden FIFO (más recientes primero). */
  ids: string[];
  /** `true` cuando ya se ha leído de localStorage (post-mount). */
  ready: boolean;
  /** ¿Está este id en favoritos? */
  has: (id: string) => boolean;
  /** Añade si no está. No-op si ya existe o cap MAX_FAVORITES alcanzado. */
  add: (id: string) => void;
  /** Elimina si está. No-op si no existe. */
  remove: (id: string) => void;
  /** Toggle atómico. */
  toggle: (id: string) => void;
  /** Vacía todos los favoritos. */
  clear: () => void;
}

function readFromStorage(): FavoritesStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    return parseFavorites(window.localStorage.getItem(FAVORITES_KEY));
  } catch {
    return EMPTY;
  }
}

function writeToStorage(store: FavoritesStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, serializeFavorites(store));
  } catch {
    // quota exceeded / modo privado: seguimos con el estado en memoria.
  }
}

export function useFavorites(): UseFavoritesResult {
  // Primer render: SIEMPRE vacío para que server y client coincidan.
  const [store, setStore] = useState<FavoritesStore>(EMPTY);
  const [ready, setReady] = useState(false);

  // Lectura inicial tras montar.
  useEffect(() => {
    setStore(readFromStorage());
    setReady(true);
  }, []);

  // Sync entre pestañas.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FAVORITES_KEY) return;
      setStore(parseFavorites(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback((id: string) => isFavorite(store, id), [store]);

  const add = useCallback((id: string) => {
    setStore((prev) => {
      const next = addFavorite(prev, id);
      if (next !== prev) writeToStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setStore((prev) => {
      const next = removeFavorite(prev, id);
      if (next !== prev) writeToStorage(next);
      return next;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setStore((prev) => {
      const next = toggleFavorite(prev, id);
      if (next !== prev) writeToStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    const empty: FavoritesStore = { ids: [], updatedAt: Date.now() };
    setStore(empty);
    writeToStorage(empty);
  }, []);

  return { ids: store.ids, ready, has, add, remove, toggle, clear };
}
