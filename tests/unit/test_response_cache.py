"""
Tests para flight_hunter_v4/response_cache.py

Cubrimos los invariantes que sostienen la integración en rapidapi_engine y
travelpayouts_engine:

  1. make_key es determinista y agnóstico al orden de kwargs (si esto falla,
     obtenemos 0% hit-rate aunque el cache funcione).
  2. set→get roundtrip devuelve el valor exacto.
  3. Respeta el TTL: mtime-based, un file "viejo" se purga al leer.
  4. Atomic write: ningún .tmp queda huérfano tras una escritura exitosa.
  5. Corrupt-file recovery: un JSON roto se trata como miss y se borra.
  6. dedup_by_route se queda con el deal de menor precio por ruta.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

import pytest

from response_cache import ResponseCache, dedup_by_route


@pytest.fixture
def cache(tmp_path: Path) -> ResponseCache:
    """Cache aislado por test (tmp_path se limpia automáticamente)."""
    return ResponseCache("test_engine", base_dir=tmp_path)


class TestMakeKey:
    def test_key_is_deterministic(self, cache: ResponseCache) -> None:
        k1 = cache.make_key(origin="MAD", dest="JFK", date="2026-06-01")
        k2 = cache.make_key(origin="MAD", dest="JFK", date="2026-06-01")
        assert k1 == k2

    def test_key_is_order_independent(self, cache: ResponseCache) -> None:
        # Sin esto, hits dependerían del orden en que el caller pasa kwargs —
        # tendríamos ~0% hit-rate por detalles de implementación.
        k1 = cache.make_key(origin="MAD", dest="JFK", date="2026-06-01")
        k2 = cache.make_key(date="2026-06-01", dest="JFK", origin="MAD")
        assert k1 == k2

    def test_different_args_yield_different_keys(self, cache: ResponseCache) -> None:
        k1 = cache.make_key(origin="MAD", dest="JFK")
        k2 = cache.make_key(origin="MAD", dest="LAX")
        assert k1 != k2

    def test_key_length_is_stable(self, cache: ResponseCache) -> None:
        # 32 chars → nombres de archivo cortos en el FS
        k = cache.make_key(a=1)
        assert len(k) == 32


class TestGetSet:
    def test_roundtrip_returns_original_value(self, cache: ResponseCache) -> None:
        key = cache.make_key(q="test")
        cache.set(key, {"deals": [{"price": 350}], "count": 1})
        assert cache.get(key, ttl_seconds=60) == {"deals": [{"price": 350}], "count": 1}

    def test_miss_returns_none(self, cache: ResponseCache) -> None:
        assert cache.get("nonexistent_key", ttl_seconds=60) is None

    def test_expired_entry_is_purged(self, cache: ResponseCache, tmp_path: Path) -> None:
        key = cache.make_key(q="expiring")
        cache.set(key, {"data": 1})
        # Forzamos mtime al pasado (2h atrás) — simula un entry viejo
        path = cache.dir / f"{key}.json"
        old_mtime = time.time() - 7200
        os.utime(path, (old_mtime, old_mtime))
        assert cache.get(key, ttl_seconds=60) is None
        # La purga es best-effort: el file se elimina
        assert not path.exists()

    def test_within_ttl_returns_value(self, cache: ResponseCache) -> None:
        key = cache.make_key(q="fresh")
        cache.set(key, {"data": "still-valid"})
        # Un TTL razonablemente amplio para cubrir la latencia del test
        assert cache.get(key, ttl_seconds=3600) == {"data": "still-valid"}


class TestAtomicWrite:
    def test_no_tmp_files_after_successful_write(self, cache: ResponseCache) -> None:
        # Si dejamos .tmp tras un set exitoso, se acumulan indefinidamente
        # en el directorio y rompen stats(). Garantizamos cleanup.
        for i in range(5):
            cache.set(cache.make_key(q=f"q{i}"), {"i": i})
        leftover_tmp = list(cache.dir.glob("*.tmp"))
        assert leftover_tmp == []

    def test_unserializable_value_is_silently_skipped(self, cache: ResponseCache) -> None:
        """Un valor no serializable (referencia circular) NO debe romper al caller.

        Nota: response_cache usa `default=str` al dumpear, así que objetos
        exóticos (lambdas, datetimes…) se convierten a string — eso SÍ se
        cachea. Para forzar un fallo usamos una estructura recursiva, que
        `default` no puede salvar.
        """
        key = cache.make_key(q="circular")
        a: list = []
        a.append(a)  # lista que se contiene a sí misma → ValueError al dumpear
        cache.set(key, a)
        # Debe devolver None (no cacheado, no explotó)
        assert cache.get(key, ttl_seconds=60) is None
        # No quedan ficheros huérfanos en el dir
        assert list(cache.dir.glob("*.tmp")) == []


class TestCorruptRecovery:
    def test_corrupt_json_is_treated_as_miss_and_deleted(self, cache: ResponseCache) -> None:
        key = cache.make_key(q="corrupt")
        # Escribimos JSON inválido directamente al path
        path = cache.dir / f"{key}.json"
        path.write_text("{not valid json")
        assert cache.get(key, ttl_seconds=60) is None
        # El fichero corrupto debe haberse borrado para que el próximo set
        # tenga el slot limpio
        assert not path.exists()


class TestInvalidate:
    def test_invalidate_returns_true_when_existed(self, cache: ResponseCache) -> None:
        key = cache.make_key(q="a")
        cache.set(key, {"v": 1})
        assert cache.invalidate(key) is True
        assert cache.get(key, ttl_seconds=60) is None

    def test_invalidate_returns_false_when_missing(self, cache: ResponseCache) -> None:
        assert cache.invalidate("doesnt_exist") is False


class TestStats:
    def test_stats_counts_entries_and_bytes(self, cache: ResponseCache) -> None:
        cache.set(cache.make_key(q="a"), {"hello": "world"})
        cache.set(cache.make_key(q="b"), {"foo": "bar"})
        stats = cache.stats()
        assert stats["entries"] == 2
        assert stats["bytes"] > 0
        assert str(cache.dir) == stats["dir"]


class TestDedupByRoute:
    def test_keeps_cheapest_per_route(self) -> None:
        deals = [
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "price_eur": 400},
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "price_eur": 350},
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "price_eur": 500},
        ]
        out = dedup_by_route(deals)
        assert len(out) == 1
        assert out[0]["price_eur"] == 350

    def test_preserves_different_routes(self) -> None:
        deals = [
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "price_eur": 400},
            {"origin": "MAD", "destination": "LAX", "date_out": "2026-06-01", "price_eur": 450},
            {"origin": "BCN", "destination": "JFK", "date_out": "2026-06-01", "price_eur": 390},
        ]
        assert len(dedup_by_route(deals)) == 3

    def test_passthrough_for_incomplete_deals(self) -> None:
        """Deals sin las claves imprescindibles se pasan tal cual — no se
        filtran silenciosamente (que sería un bug de silenciamiento)."""
        deals = [
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "price_eur": 400},
            {"oops": "incomplete"},  # sin origin/destination
        ]
        out = dedup_by_route(deals)
        assert len(out) == 2

    def test_default_cabin_groups_explicit_with_default(self) -> None:
        # Un deal sin `cabin` comparte ruta con uno cuya cabin es explícitamente "economy"
        deals = [
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "price_eur": 400},
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "cabin": "economy", "price_eur": 350},
        ]
        out = dedup_by_route(deals)
        assert len(out) == 1
        assert out[0]["price_eur"] == 350
