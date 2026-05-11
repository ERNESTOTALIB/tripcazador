"""
SSS147 — ResponseCache deep tests.
==================================
Targets: get/set/invalidate/stats, make_key determinism, dedup_by_route.
"""
from __future__ import annotations

import time
from pathlib import Path

import pytest

from response_cache import ResponseCache, dedup_by_route


@pytest.fixture
def cache(tmp_path):
    return ResponseCache("test-engine", base_dir=tmp_path)


# ─────────────────────────────────────────────────────────────────
# make_key
# ─────────────────────────────────────────────────────────────────
def test_make_key_is_deterministic(cache):
    k1 = cache.make_key(origin="MAD", dest="JFK")
    k2 = cache.make_key(origin="MAD", dest="JFK")
    assert k1 == k2


def test_make_key_order_independent(cache):
    k1 = cache.make_key(a=1, b=2)
    k2 = cache.make_key(b=2, a=1)
    assert k1 == k2


def test_make_key_different_inputs_different_keys(cache):
    k1 = cache.make_key(origin="MAD")
    k2 = cache.make_key(origin="BCN")
    assert k1 != k2


def test_make_key_is_32_chars(cache):
    k = cache.make_key(x=1)
    assert len(k) == 32


def test_make_key_handles_non_string_values(cache):
    # default=str — datetime, int, float should all serialize
    k = cache.make_key(num=42, flag=True, lst=[1, 2, 3])
    assert isinstance(k, str)
    assert len(k) == 32


def test_make_key_empty_kwargs(cache):
    k = cache.make_key()
    assert isinstance(k, str)
    assert len(k) == 32


# ─────────────────────────────────────────────────────────────────
# get / set
# ─────────────────────────────────────────────────────────────────
def test_get_miss_returns_none(cache):
    assert cache.get("nonexistent-key", ttl_seconds=60) is None


def test_set_and_get_roundtrip(cache):
    cache.set("k1", {"data": "value", "n": 42})
    assert cache.get("k1", ttl_seconds=60) == {"data": "value", "n": 42}


def test_set_overwrite(cache):
    cache.set("k1", "v1")
    cache.set("k1", "v2")
    assert cache.get("k1", ttl_seconds=60) == "v2"


def test_set_unicode(cache):
    cache.set("k1", {"city": "Tókio", "msg": "¡€80!"})
    assert cache.get("k1", ttl_seconds=60) == {"city": "Tókio", "msg": "¡€80!"}


def test_set_unserializable_silently_skipped(cache):
    # An object that can't be serialized → silently no-op
    class Unserializable:
        pass
    cache.set("k1", Unserializable())  # Should not raise
    # It's saved using default=str, so this might actually work, but lambdas don't.
    cache.set("k2", lambda x: x)  # Should not raise


@pytest.mark.parametrize("data", [
    None, [], {}, "", "hello", 42, 3.14, True, False,
    ["a", "b", "c"], {"nested": {"x": 1}}, [1, 2, [3, 4]],
])
def test_set_various_types_roundtrip(cache, data):
    cache.set(f"key", data)
    assert cache.get(f"key", ttl_seconds=60) == data


def test_get_expired_returns_none(cache):
    cache.set("k1", "old-value")
    # Set mtime in the past
    p = cache._path("k1")
    old_time = time.time() - 1000
    import os
    os.utime(p, (old_time, old_time))
    assert cache.get("k1", ttl_seconds=60) is None
    # File should be cleaned up
    assert not p.exists()


def test_get_fresh_returns_value(cache):
    cache.set("k1", "fresh")
    assert cache.get("k1", ttl_seconds=3600) == "fresh"


def test_get_corrupt_file_returns_none(cache, tmp_path):
    p = cache._path("k1")
    p.write_text("not valid json{")
    assert cache.get("k1", ttl_seconds=60) is None
    # Should clean up
    assert not p.exists()


def test_invalidate_existing(cache):
    cache.set("k1", "v")
    assert cache.invalidate("k1") is True


def test_invalidate_missing_returns_false(cache):
    assert cache.invalidate("never-was-here") is False


def test_invalidate_after_double_set(cache):
    cache.set("k1", "v")
    cache.invalidate("k1")
    assert cache.get("k1", ttl_seconds=60) is None


# ─────────────────────────────────────────────────────────────────
# stats
# ─────────────────────────────────────────────────────────────────
def test_stats_empty(cache):
    s = cache.stats()
    assert s["entries"] == 0
    assert s["bytes"] == 0


def test_stats_after_set(cache):
    cache.set("k1", "value1")
    cache.set("k2", "value2")
    cache.set("k3", "value3")
    s = cache.stats()
    assert s["entries"] == 3
    assert s["bytes"] > 0


def test_stats_dir_key_present(cache):
    s = cache.stats()
    assert "dir" in s
    assert isinstance(s["dir"], str)


# ─────────────────────────────────────────────────────────────────
# dedup_by_route
# ─────────────────────────────────────────────────────────────────
def test_dedup_empty():
    assert dedup_by_route([]) == []


def test_dedup_no_duplicates_unchanged():
    deals = [
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15", "price_eur": 200},
        {"origin": "BCN", "destination": "FCO", "date_out": "2026-07-01", "price_eur": 80},
    ]
    res = dedup_by_route(deals)
    assert len(res) == 2


def test_dedup_picks_cheapest_per_route():
    deals = [
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15",
         "cabin": "economy", "price_eur": 500},
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15",
         "cabin": "economy", "price_eur": 300},  # cheapest
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15",
         "cabin": "economy", "price_eur": 400},
    ]
    res = dedup_by_route(deals)
    assert len(res) == 1
    assert res[0]["price_eur"] == 300


def test_dedup_separates_by_cabin():
    deals = [
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15",
         "cabin": "economy", "price_eur": 200},
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15",
         "cabin": "business", "price_eur": 800},
    ]
    res = dedup_by_route(deals)
    assert len(res) == 2


def test_dedup_default_cabin_is_economy():
    deals = [
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15", "price_eur": 200},
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15",
         "cabin": "economy", "price_eur": 100},
    ]
    res = dedup_by_route(deals)
    assert len(res) == 1
    assert res[0]["price_eur"] == 100


def test_dedup_missing_key_passes_through():
    deals = [
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15", "price_eur": 200},
        {"origin": "MAD"},  # missing keys
    ]
    res = dedup_by_route(deals)
    # The deal with missing keys goes to passthrough
    assert len(res) == 2


def test_dedup_no_price_uses_infinity():
    deals = [
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15"},
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15", "price_eur": 100},
    ]
    res = dedup_by_route(deals)
    assert len(res) == 1
    assert res[0]["price_eur"] == 100


def test_dedup_does_not_mutate_input():
    deals = [
        {"origin": "MAD", "destination": "JFK", "date_out": "2026-06-15", "price_eur": 200},
    ]
    original_len = len(deals)
    res = dedup_by_route(deals)
    assert len(deals) == original_len
    # res may be the same list of dicts (objects shared) but list is new
    assert res is not deals


# ─────────────────────────────────────────────────────────────────
# Atomicity / cleanup
# ─────────────────────────────────────────────────────────────────
def test_dir_is_created(tmp_path):
    target = tmp_path / "subdir"
    cache = ResponseCache("e", base_dir=target)
    assert (target / "e").exists()


def test_two_caches_different_engines_isolated(tmp_path):
    a = ResponseCache("engineA", base_dir=tmp_path)
    b = ResponseCache("engineB", base_dir=tmp_path)
    a.set("k1", "valueA")
    b.set("k1", "valueB")
    assert a.get("k1", ttl_seconds=60) == "valueA"
    assert b.get("k1", ttl_seconds=60) == "valueB"
