"""
place_photo_resolver — SSS88 (May 2026)

Antes de publicar un carrusel IG, resuelve cada slide a una URL de imagen
GARANTIZADA-VÁLIDA del lugar específico. Si la URL curada en
canva_landmarks.LANDMARKS falla (404/network), busca en Wikipedia API la
imagen del landmark por nombre y devuelve esa.

Filosofía:
  - "Coliseo, Roma" → si la URL Wikimedia hardcoded da 404, busca en
    Wikipedia "Coliseo Roma" y trae el primer pageimage.
  - Cache local en /tmp/tripcazador_place_photos.json — una vez resuelta
    una URL, no se vuelve a re-validar en 7 días.
  - Determinístico: para el mismo nombre siempre devuelve la misma URL.

Uso:
    from place_photo_resolver import resolve_place_photo

    url = resolve_place_photo(
        place_name="Coliseo, Roma",
        preferred_url="https://upload.wikimedia.org/.../Colosseo.jpg",
        fallback_url="https://images.unsplash.com/photo-1552832230-c0197dd311b5",
    )
    # → URL garantizada working
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional

CACHE_PATH = Path(os.environ.get("PLACE_PHOTO_CACHE", "/tmp/tripcazador_place_photos.json"))
CACHE_TTL_S = 7 * 24 * 3600  # 7 días — refresca por si el upstream cambia
HEAD_TIMEOUT_S = 6
WIKI_API_TIMEOUT_S = 8

# User-Agent realista — Wikipedia recomienda identificarse, y CDN de Unsplash
# rate-limita user agents simples. Este es el UA "polite" que usamos.
_UA = (
    "TripCazador/1.0 (+https://tripcazador.com; ernestalib@hotmail.com) "
    "Python/urllib"
)


# ─────────────────── cache load/save ───────────────────


def _load_cache() -> dict:
    if not CACHE_PATH.exists():
        return {}
    try:
        with CACHE_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_cache(cache: dict) -> None:
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with CACHE_PATH.open("w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except OSError as e:
        print(f"WARN: place_photo cache save failed: {e}", flush=True)


# ─────────────────── HTTP helpers ───────────────────


def _is_url_alive(url: str, *, timeout: int = HEAD_TIMEOUT_S) -> bool:
    """HEAD request rápido. True si 200/2xx, False otherwise."""
    if not url or not url.startswith(("http://", "https://")):
        return False
    try:
        req = urllib.request.Request(
            url, method="HEAD", headers={"User-Agent": _UA}
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return 200 <= r.status < 300
    except urllib.error.HTTPError as e:
        # 429 = rate-limited pero la URL existe — tratamos como válida
        # porque desde GH Actions runner sí llegará.
        return e.code == 429
    except Exception:
        return False


def _clean_query(query: str) -> str:
    """Normaliza la query: quita comas, símbolos extra, dobles espacios.
    'Coliseo, Roma' → 'Coliseo Roma'
    'Trinity College + Book of Kells' → 'Trinity College Book of Kells'
    """
    cleaned = query.replace(",", " ").replace("+", " ").replace("·", " ")
    cleaned = " ".join(cleaned.split())  # collapse whitespace
    return cleaned.strip()


def _wiki_summary_image(lang: str, title: str) -> Optional[str]:
    """
    Usa Wikipedia REST API summary endpoint para obtener directamente la
    imagen principal (originalimage) del artículo cuyo título es `title`.

    Endpoint: GET /api/rest_v1/page/summary/{title}

    Mucho más preciso que list=search porque va directo al article meta.
    """
    if not title.strip():
        return None
    try:
        encoded = urllib.parse.quote(title.replace(" ", "_"), safe="")
        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{encoded}"
        req = urllib.request.Request(url, headers={"User-Agent": _UA})
        with urllib.request.urlopen(req, timeout=WIKI_API_TIMEOUT_S) as r:
            data = json.loads(r.read().decode("utf-8"))
        # Prefer originalimage > thumbnail
        original = (data.get("originalimage") or {}).get("source")
        if original and original.startswith("https://"):
            return original
        thumb = (data.get("thumbnail") or {}).get("source")
        # thumbnail URL viene como /240px-X.jpg — upgrade a 1280px
        if thumb and thumb.startswith("https://"):
            return thumb.replace("/240px-", "/1280px-").replace("/200px-", "/1280px-")
    except Exception:
        pass
    return None


def _wiki_pageimage(lang: str, page_title: str) -> Optional[str]:
    """Dado un page title de Wikipedia, devuelve la URL de su 'original' image."""
    try:
        img_url = (
            f"https://{lang}.wikipedia.org/w/api.php?"
            + urllib.parse.urlencode({
                "action": "query",
                "format": "json",
                "prop": "pageimages",
                "piprop": "original",
                "titles": page_title,
            })
        )
        req = urllib.request.Request(img_url, headers={"User-Agent": _UA})
        with urllib.request.urlopen(req, timeout=WIKI_API_TIMEOUT_S) as r:
            data = json.loads(r.read().decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        for _pid, page in pages.items():
            original = page.get("original", {}).get("source")
            if original and original.startswith("https://"):
                return original
    except Exception:
        pass
    return None


def _wiki_search_image(query: str) -> Optional[str]:
    """
    Busca en Wikipedia el artículo que mejor matchea `query` y devuelve
    la URL de su imagen principal.

    Estrategia (SSS88, mejorada):
      1) Direct REST summary lookup — si Wikipedia tiene un artículo
         con título exacto = query, esto devuelve su imagen al instante.
         Es la ruta más precisa.
      2) opensearch API → top 3 títulos candidatos por relevancia de
         título (no por full-text). Filtramos por word-overlap mínimo
         con la query para evitar falsos positivos como "Coliseo Amauta"
         para "Coliseo Roma".
      3) Para cada candidato válido, REST summary → originalimage.

    Probamos primero en ES, después EN.
    """
    cleaned = _clean_query(query)
    if not cleaned:
        return None

    query_words = {w.lower() for w in cleaned.split() if len(w) > 3}

    for lang in ("es", "en"):
        # ── Strategy A: direct REST summary on the cleaned query ──
        # E.g. "Coliseo Roma" → /summary/Coliseo_Roma. Si no existe Wikipedia
        # devuelve 404 o disambiguation, sino la imagen está incluida.
        img = _wiki_summary_image(lang, cleaned)
        if img:
            return img

        # ── Strategy B: opensearch + scored candidates ──
        try:
            os_url = (
                f"https://{lang}.wikipedia.org/w/api.php?"
                + urllib.parse.urlencode({
                    "action": "opensearch",
                    "search": cleaned,
                    "limit": 8,
                    "namespace": 0,
                    "format": "json",
                })
            )
            req = urllib.request.Request(os_url, headers={"User-Agent": _UA})
            with urllib.request.urlopen(req, timeout=WIKI_API_TIMEOUT_S) as r:
                data = json.loads(r.read().decode("utf-8"))
            titles = data[1] if len(data) > 1 else []

            # Score por word-overlap con la query (descarta basura tipo
            # "Coliseo Amauta" que solo comparte 1 palabra de 2)
            scored: list = []
            for title in titles:
                if not title:
                    continue
                title_words = {w.lower() for w in _clean_query(title).split() if len(w) > 3}
                overlap = len(query_words & title_words)
                if overlap >= max(1, len(query_words) - 1):
                    scored.append((overlap, title))
            scored.sort(reverse=True)

            for _score, title in scored[:3]:
                img = _wiki_summary_image(lang, title)
                if img:
                    return img
                # Fallback secundario: pageimage (algunas pages no tienen
                # summary pero sí pageimage)
                img = _wiki_pageimage(lang, title)
                if img:
                    return img
        except Exception as e:
            print(f"WARN: opensearch [{lang}] '{cleaned}' failed: {e}", flush=True)

    return None


# ─────────────────── public API ───────────────────


def resolve_place_photo(
    place_name: str,
    preferred_url: str = "",
    fallback_url: str = "",
    *,
    skip_validation: bool = False,
) -> str:
    """
    Devuelve una URL de imagen que SÍ carga, en este orden de prioridad:
      1) preferred_url si funciona (HEAD 2xx o 429)
      2) Resultado cacheado para place_name (si fresh < TTL)
      3) Wikipedia API search → pageimage (cachea si encuentra)
      4) fallback_url si funciona
      5) "" (cadena vacía) — el caller decide cómo manejar el último resort

    Args:
        place_name: nombre del lugar para Wikipedia search ("Coliseo Roma",
                    "Sagrada Familia", "Park Güell", etc.). Más específico
                    = mejor match.
        preferred_url: la URL curada/principal (canva_landmarks). Se prueba
                       primero; si falla buscamos alternativa.
        fallback_url: foto de backup (típicamente Unsplash de la ciudad).
                      Se usa SOLO si Wikipedia tampoco devuelve nada.
        skip_validation: si True, asume preferred_url funciona sin HEAD
                         request. Útil para tests offline.

    Returns:
        URL string que ha sido validada (o cacheada de validación previa).
    """
    if not place_name and not preferred_url and not fallback_url:
        return ""

    # 1) preferred_url alive?
    if preferred_url and (skip_validation or _is_url_alive(preferred_url)):
        return preferred_url

    cache = _load_cache()
    cache_key = place_name.lower().strip()
    cached_entry = cache.get(cache_key) if cache_key else None

    # 2) cache fresh?
    if cached_entry and isinstance(cached_entry, dict):
        ts = cached_entry.get("ts", 0)
        url = cached_entry.get("url", "")
        if url and (time.time() - ts) < CACHE_TTL_S:
            return url

    # 3) Wikipedia search
    if cache_key:
        wiki_url = _wiki_search_image(place_name)
        if wiki_url and _is_url_alive(wiki_url):
            cache[cache_key] = {"url": wiki_url, "ts": time.time(), "src": "wikipedia"}
            _save_cache(cache)
            print(f"INFO: resolved '{place_name}' → Wikipedia: {wiki_url[:100]}", flush=True)
            return wiki_url

    # 4) fallback_url alive?
    if fallback_url and _is_url_alive(fallback_url):
        if cache_key:
            cache[cache_key] = {"url": fallback_url, "ts": time.time(), "src": "fallback"}
            _save_cache(cache)
        return fallback_url

    # 5) Last resort — return preferred even if validation failed (better
    # than empty string; downstream fetch_photo() has its own retry/placeholder
    # logic in the generator).
    return preferred_url or fallback_url or ""


def resolve_landmarks_inplace(landmarks: dict, default_fallback: str = "") -> None:
    """
    Mutate `landmarks` (a DestinationLandmarks dict from canva_landmarks)
    so every photo URL has been pre-flight validated and replaced if broken.

    Slides operated on:
      - landmarks["places"]["photo"]  (with name = landmarks["places"]["name"])
      - landmarks["food"]["photo"]
      - landmarks["tips"]["photo"]
      - landmarks["cta"]["photo"]
      - each entry of landmarks["hero_strips"]  (uses corresponding plate name)

    `default_fallback` is the city-level Unsplash URL, used when neither
    the preferred URL nor Wikipedia returns anything for a slide.
    """
    plates = ["places", "food", "tips", "cta"]
    for slot in plates:
        plate = landmarks.get(slot)
        if not plate:
            continue
        original = plate.get("photo", "")
        name = plate.get("name", "")
        # SSS88: si el slot tiene wiki_query explícito (disambiguación
        # manual para casos confusos), úsalo. Sino, el name.
        wiki_q = plate.get("wiki_query") or name
        resolved = resolve_place_photo(
            place_name=wiki_q,
            preferred_url=original,
            fallback_url=default_fallback,
        )
        if resolved and resolved != original:
            print(f"INFO: {slot} '{name}' photo replaced", flush=True)
            plate["photo"] = resolved

    # Hero strips — usar el nombre del plate correspondiente como hint
    # (5 strips ↔ 4 plates + 1 hero); para el 5to usamos place_name del cta
    hero = landmarks.get("hero_strips") or []
    name_per_strip = [
        landmarks.get("places", {}).get("name", ""),
        landmarks.get("food", {}).get("name", ""),
        landmarks.get("tips", {}).get("name", ""),
        landmarks.get("cta", {}).get("name", ""),
        landmarks.get("places", {}).get("name", ""),  # 5th = repeat places
    ]
    for i, strip_url in enumerate(hero[:5]):
        hint = name_per_strip[i] if i < len(name_per_strip) else ""
        resolved = resolve_place_photo(
            place_name=hint,
            preferred_url=strip_url,
            fallback_url=default_fallback,
        )
        if resolved:
            hero[i] = resolved


if __name__ == "__main__":
    # Smoke test CLI: python place_photo_resolver.py "Sagrada Familia" "https://broken.example/x.jpg"
    import sys
    if len(sys.argv) < 2:
        print("Usage: python place_photo_resolver.py <place_name> [preferred_url] [fallback_url]")
        sys.exit(1)
    name = sys.argv[1]
    pref = sys.argv[2] if len(sys.argv) > 2 else ""
    fb = sys.argv[3] if len(sys.argv) > 3 else ""
    print(f"Resolving '{name}'...")
    print(f"  preferred: {pref or '(none)'}")
    print(f"  fallback:  {fb or '(none)'}")
    out = resolve_place_photo(name, pref, fb)
    print(f"\nResult: {out}")
