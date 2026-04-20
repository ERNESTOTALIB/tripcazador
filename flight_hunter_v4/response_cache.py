"""
response_cache.py
─────────────────
Cache local de respuestas HTTP para los engines (RapidAPI, Travelpayouts,
Amadeus, Ryanair…). Opt-in: el engine decide cuándo usarlo.

Objetivo
─────────
- Reducir llamadas duplicadas entre invocaciones del hunter cuando se
  ejecuta en batch (p. ej. el cron que cada 6h itera 65 orígenes × 40 destinos).
- Respetar el TTL por ruta (precio aéreo es volátil, 15-30 min suele ser
  el sweet spot) sin saturar las cuotas de RapidAPI (100 req/mes en plan free).

Diseño
──────
- Backend: ficheros JSON en `~/.flight_hunter/cache/` — simple y portable.
- Clave: `{engine}:{SHA-256 de payload normalizado}.json`.
- Atomicidad: escritura a .tmp + rename (evita reads corruptos si el
  proceso muere a la mitad).
- Purga: best-effort al leer — si el fichero está caducado se borra.

Uso
───
    from response_cache import ResponseCache
    cache = ResponseCache("rapidapi")
    key = cache.make_key(origin="MAD", dest="JFK", date="2026-06-01", cabin="economy")
    hit = cache.get(key, ttl_seconds=1800)   # 30 min
    if hit is not None:
        return hit
    data = external_api_call(...)
    cache.set(key, data)
    return data

Notas
─────
- No es un cache distribuido. Si corres múltiples workers en paralelo, dos
  workers pueden llamar la misma API casi-simultáneamente. Asumimos que
  el usuario corre un único worker (caso típico del cron).
- No intenta validar la forma del payload. Si la API externa cambia su
  schema, el cache sólo devolverá lo que guardó la última vez.
"""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any, Optional


_DEFAULT_CACHE_DIR = Path.home() / ".flight_hunter" / "cache"


class ResponseCache:
    """File-backed response cache per engine."""

    def __init__(self, engine_name: str, base_dir: Optional[Path] = None) -> None:
        # Si el caller quiere forzar un directorio (útil en tests o en
        # entornos sin HOME como un lambda), lo respetamos.
        base = Path(base_dir) if base_dir else _DEFAULT_CACHE_DIR
        self.dir = base / engine_name
        self.dir.mkdir(parents=True, exist_ok=True)

    def make_key(self, **kwargs: Any) -> str:
        """Genera una clave determinista a partir de los kwargs.

        Ordenamos las claves antes de serializar para que {a:1, b:2} y
        {b:2, a:1} produzcan el mismo hash.
        """
        payload = json.dumps(kwargs, sort_keys=True, default=str)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]

    def _path(self, key: str) -> Path:
        return self.dir / f"{key}.json"

    def get(self, key: str, ttl_seconds: int) -> Optional[Any]:
        """Devuelve el valor si existe y no ha caducado, o None."""
        p = self._path(key)
        if not p.exists():
            return None
        # Comprobar TTL por mtime — más rápido que abrir+parsear.
        age = time.time() - p.stat().st_mtime
        if age > ttl_seconds:
            # Best-effort purge: si falla el unlink (p. ej. carrera),
            # ignoramos y devolvemos None igualmente.
            try:
                p.unlink()
            except OSError:
                pass
            return None
        try:
            with p.open("r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            # Fichero corrupto → tratamos como miss y lo borramos.
            try:
                p.unlink()
            except OSError:
                pass
            return None

    def set(self, key: str, value: Any) -> None:
        """Guarda el valor. Escritura atómica via rename."""
        p = self._path(key)
        # Serializamos antes de crear el fichero temp — si falla, no dejamos
        # basura en disco.
        try:
            payload = json.dumps(value, default=str)
        except (TypeError, ValueError):
            # Valor no serializable → silenciosamente no cacheamos.
            return

        # tempfile en el mismo directorio para que el rename sea atómico
        # en el mismo filesystem.
        fd, tmp_name = tempfile.mkstemp(dir=self.dir, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(payload)
            os.replace(tmp_name, p)
        except OSError:
            # Si algo falla, intentamos limpiar el temp sin explotar.
            try:
                os.unlink(tmp_name)
            except OSError:
                pass

    def invalidate(self, key: str) -> bool:
        """Elimina una entrada concreta del cache. Devuelve True si existía."""
        p = self._path(key)
        try:
            p.unlink()
            return True
        except FileNotFoundError:
            return False

    def stats(self) -> dict:
        """Devuelve (total_entries, bytes_on_disk) — útil para debug."""
        total = 0
        size = 0
        for f in self.dir.glob("*.json"):
            total += 1
            try:
                size += f.stat().st_size
            except OSError:
                continue
        return {"entries": total, "bytes": size, "dir": str(self.dir)}


def dedup_by_route(deals: list[dict]) -> list[dict]:
    """Dedup de deals por (origin, destination, date_out, cabin).

    Cuando un deal aparece en múltiples engines (p. ej. mismo vuelo MAD-BKK
    devuelto por Amadeus y RapidAPI), nos quedamos con el de menor precio.
    Útil en el pipeline de merge antes de puntuar y notificar.

    No muta la lista original. No asume claves opcionales más allá de las
    imprescindibles — si una falta, ese deal se pasa tal cual.
    """
    best: dict[tuple, dict] = {}
    passthrough: list[dict] = []
    for d in deals:
        try:
            key = (d["origin"], d["destination"], d["date_out"], d.get("cabin", "economy"))
        except KeyError:
            passthrough.append(d)
            continue
        existing = best.get(key)
        if existing is None or d.get("price_eur", float("inf")) < existing.get("price_eur", float("inf")):
            best[key] = d
    return list(best.values()) + passthrough
