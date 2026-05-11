"""
test_new_response_cache.py — May 2026
======================================
Cobertura adicional para response_cache.ResponseCache:
- escritura atómica + lectura con TTL
- purga al detectar expirado
- claves deterministas (sorted)
- dedup_by_route()
- fichero corrupto → miss + cleanup
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import pytest

from response_cache import ResponseCache, dedup_by_route  # type: ignore[import-not-found]


@pytest.fixture
def cache(tmp_path) -> ResponseCache:
    return ResponseCache("test_engine", base_dir=tmp_path)


class TestResponseCacheBasics:
    def test_set_get_roundtrip(self, cache):
        key = cache.make_key(o="MAD", d="BCN")
        cache.set(key, {"price": 50})
        out = cache.get(key, ttl_seconds=60)
        assert out == {"price": 50}

    def test_miss_returns_none(self, cache):
        out = cache.get("nonexistent", ttl_seconds=60)
        assert out is None

    def test_make_key_deterministic_order(self, cache):
        k1 = cache.make_key(a=1, b=2)
        k2 = cache.make_key(b=2, a=1)
        assert k1 == k2

    def test_make_key_different_data_yields_different_keys(self, cache):
        k1 = cache.make_key(a=1)
        k2 = cache.make_key(a=2)
        assert k1 != k2

    def test_make_key_length_32(self, cache):
        # SHA-256 truncado a 32 chars
        k = cache.make_key(o="MAD")
        assert len(k) == 32


class TestResponseCacheTTL:
    def test_get_expired_returns_none_and_purges(self, cache, tmp_path):
        key = cache.make_key(o="MAD")
        cache.set(key, [1, 2, 3])
        # Forzar TTL=0 → siempre expirado
        out = cache.get(key, ttl_seconds=0)
        assert out is None
        # El fichero debe haberse borrado
        path = cache.dir / f"{key}.json"
        assert not path.exists()

    def test_get_within_ttl(self, cache):
        key = cache.make_key(o="MAD")
        cache.set(key, "hola")
        # TTL muy alto → todavía válido
        assert cache.get(key, ttl_seconds=3600) == "hola"


class TestResponseCacheCorruption:
    def test_corrupt_file_returns_none_and_cleans(self, cache):
        key = "0" * 32
        path = cache.dir / f"{key}.json"
        path.write_text("this is not JSON{{{")
        out = cache.get(key, ttl_seconds=60)
        assert out is None
        # Cleanup tras lectura fallida
        assert not path.exists()

    def test_non_serializable_value_silently_drops(self, cache):
        key = cache.make_key(o="X")
        # set() acepta default=str — solo función/socket realmente no serializan
        class Unpicklable:
            def __repr__(self):
                raise TypeError("explode")
        cache.set(key, Unpicklable())
        # No debe revientar; fichero no existe
        path = cache.dir / f"{key}.json"
        assert not path.exists() or cache.get(key, 60) is None


class TestResponseCacheInvalidateStats:
    def test_invalidate_existing(self, cache):
        key = cache.make_key(x=1)
        cache.set(key, {"a": 1})
        assert cache.invalidate(key) is True
        assert cache.get(key, ttl_seconds=60) is None

    def test_invalidate_nonexistent(self, cache):
        assert cache.invalidate("0" * 32) is False

    def test_stats_returns_counts(self, cache):
        cache.set(cache.make_key(o="MAD"), {"a": 1})
        cache.set(cache.make_key(o="BCN"), {"a": 2})
        st = cache.stats()
        assert st["entries"] == 2
        assert st["bytes"] > 0
        assert "dir" in st


class TestDedupByRoute:
    def test_dedup_keeps_cheapest(self):
        deals = [
            {"origin": "MAD", "destination": "BCN", "date_out": "2026-06-01", "cabin": "economy", "price_eur": 60.0},
            {"origin": "MAD", "destination": "BCN", "date_out": "2026-06-01", "cabin": "economy", "price_eur": 40.0},
            {"origin": "MAD", "destination": "BCN", "date_out": "2026-06-01", "cabin": "economy", "price_eur": 55.0},
        ]
        out = dedup_by_route(deals)
        assert len(out) == 1
        assert out[0]["price_eur"] == 40.0

    def test_dedup_different_dates_kept(self):
        deals = [
            {"origin": "MAD", "destination": "BCN", "date_out": "2026-06-01", "cabin": "economy", "price_eur": 60.0},
            {"origin": "MAD", "destination": "BCN", "date_out": "2026-07-01", "cabin": "economy", "price_eur": 60.0},
        ]
        out = dedup_by_route(deals)
        assert len(out) == 2

    def test_dedup_different_cabins_kept(self):
        deals = [
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "cabin": "economy", "price_eur": 400},
            {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-01", "cabin": "business", "price_eur": 1200},
        ]
        out = dedup_by_route(deals)
        assert len(out) == 2

    def test_dedup_passthrough_when_keys_missing(self):
        deals = [
            {"foo": "bar"},  # sin claves canónicas
            {"origin": "MAD", "destination": "BCN", "date_out": "2026-06-01", "price_eur": 100.0},
        ]
        out = dedup_by_route(deals)
        # passthrough conserva el dict raro + best agrupa el válido
        assert len(out) == 2

    def test_dedup_empty_input(self):
        assert dedup_by_route([]) == []

    def test_dedup_does_not_mutate(self):
        deals = [
            {"origin": "MAD", "destination": "BCN", "date_out": "2026-06-01", "cabin": "economy", "price_eur": 60.0},
        ]
        original_id = id(deals[0])
        out = dedup_by_route(deals)
        assert id(out[0]) == original_id  # mismo objeto, no clonado
