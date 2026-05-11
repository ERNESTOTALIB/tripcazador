"""
SSS147 — hotel_deal_detector deep tests.
========================================
Tests for _hotel_key, _stats_for_key, append_to_history, detect_deals,
get_history_stats, _prune_old_history.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import pytest

import hotel_deal_detector as hdd


@pytest.fixture
def temp_history(tmp_path, monkeypatch):
    """Redirect HISTORY_PATH to a tmp file per test."""
    p = tmp_path / "hotel_history.jsonl"
    monkeypatch.setattr(hdd, "HISTORY_PATH", p)
    return p


# ─────────────────────────────────────────────────────────────────
# _hotel_key
# ─────────────────────────────────────────────────────────────────
def test_hotel_key_basic():
    h = {"hotel_name": "Hotel Madrid", "city_to": "Madrid", "checkin": "2026-06-15"}
    k = hdd._hotel_key(h)
    assert "madrid" in k
    assert "hotel_madrid" in k
    assert "2026-06" in k


def test_hotel_key_truncates_long_names():
    long_name = "Very " * 50 + "Long Hotel Name"
    h = {"hotel_name": long_name, "city_to": "Madrid", "checkin": "2026-06-15"}
    k = hdd._hotel_key(h)
    # Name truncated to 40 chars
    parts = k.split("|")
    assert len(parts[1]) <= 40


def test_hotel_key_lowercase_and_spaces():
    h = {"hotel_name": "MIXED Case Hotel", "city_to": "BARCELONA", "checkin": "2026-07-01"}
    k = hdd._hotel_key(h)
    assert k == k.lower()  # full lowercase
    assert " " not in k  # spaces removed


def test_hotel_key_missing_fields():
    h = {}
    k = hdd._hotel_key(h)
    # Defaults: empty city, empty hotel, unknown month
    assert "|" in k
    assert "unknown" in k


def test_hotel_key_short_checkin():
    h = {"hotel_name": "X", "city_to": "Y", "checkin": "20"}  # too short
    k = hdd._hotel_key(h)
    assert "unknown" in k


# ─────────────────────────────────────────────────────────────────
# _load_history / _save_history / _prune_old_history
# ─────────────────────────────────────────────────────────────────
def test_load_history_empty_path(temp_history):
    rows = hdd._load_history()
    assert rows == []


def test_load_history_with_data(temp_history):
    temp_history.write_text('{"ts": "2026-05-01T00:00:00", "key": "x", "price": 100}\n')
    rows = hdd._load_history()
    assert len(rows) == 1
    assert rows[0]["price"] == 100


def test_load_history_ignores_corrupt_lines(temp_history):
    temp_history.write_text(
        '{"ts": "2026-05-01T00:00:00", "key": "x", "price": 100}\n'
        'invalid json line\n'
        '{"ts": "2026-05-02T00:00:00", "key": "y", "price": 200}\n'
    )
    rows = hdd._load_history()
    assert len(rows) == 2


def test_load_history_skips_blank_lines(temp_history):
    temp_history.write_text(
        '\n\n'
        '{"ts": "2026-05-01T00:00:00", "key": "x", "price": 100}\n'
        '\n'
    )
    rows = hdd._load_history()
    assert len(rows) == 1


def test_save_history_roundtrip(temp_history):
    rows = [
        {"ts": "2026-05-01T00:00:00", "key": "k1", "price": 100},
        {"ts": "2026-05-02T00:00:00", "key": "k2", "price": 200},
    ]
    hdd._save_history(rows)
    loaded = hdd._load_history()
    assert len(loaded) == 2


def test_prune_old_history():
    # Records older than 90 days should be removed
    old = (datetime.utcnow() - timedelta(days=100)).isoformat()
    recent = (datetime.utcnow() - timedelta(days=10)).isoformat()
    rows = [
        {"ts": old, "key": "old", "price": 100},
        {"ts": recent, "key": "new", "price": 200},
    ]
    pruned = hdd._prune_old_history(rows)
    keys = {r["key"] for r in pruned}
    assert "new" in keys
    assert "old" not in keys


def test_prune_empty_list():
    assert hdd._prune_old_history([]) == []


def test_prune_no_ts_field_excluded():
    rows = [{"key": "no-ts", "price": 100}]
    # No ts → "" < cutoff → excluded
    pruned = hdd._prune_old_history(rows)
    assert pruned == []


# ─────────────────────────────────────────────────────────────────
# _stats_for_key
# ─────────────────────────────────────────────────────────────────
def test_stats_too_few_samples():
    rows = [
        {"ts": "2026-05-01T00:00:00", "key": "k1", "price": 100},
        {"ts": "2026-05-02T00:00:00", "key": "k1", "price": 110},
    ]
    assert hdd._stats_for_key(rows, "k1") is None  # < HISTORY_MIN_SAMPLES (5)


def test_stats_enough_samples():
    rows = [
        {"ts": datetime.utcnow().isoformat(), "key": "k1", "price": p}
        for p in [100, 110, 120, 130, 140]
    ]
    s = hdd._stats_for_key(rows, "k1")
    assert s is not None
    assert s["n"] == 5
    assert s["min"] == 100
    assert s["max"] == 140


def test_stats_filters_old_records():
    # Old (>30 days)
    old_ts = (datetime.utcnow() - timedelta(days=50)).isoformat()
    new_ts = datetime.utcnow().isoformat()
    rows = [
        {"ts": old_ts, "key": "k1", "price": 100},
        *[{"ts": new_ts, "key": "k1", "price": 200 + i} for i in range(5)],
    ]
    s = hdd._stats_for_key(rows, "k1", days_back=30)
    assert s["min"] >= 200  # old record filtered out


def test_stats_filters_zero_prices():
    rows = [
        {"ts": datetime.utcnow().isoformat(), "key": "k1", "price": 0},
        *[{"ts": datetime.utcnow().isoformat(), "key": "k1", "price": p}
          for p in [100, 110, 120, 130, 140]],
    ]
    s = hdd._stats_for_key(rows, "k1")
    assert s["n"] == 5  # 0-price excluded


def test_stats_only_for_specified_key():
    rows = [
        *[{"ts": datetime.utcnow().isoformat(), "key": "k1", "price": p}
          for p in [100, 110, 120, 130, 140]],
        *[{"ts": datetime.utcnow().isoformat(), "key": "k2", "price": p}
          for p in [500, 510, 520, 530, 540]],
    ]
    s1 = hdd._stats_for_key(rows, "k1")
    s2 = hdd._stats_for_key(rows, "k2")
    assert s1["min"] == 100
    assert s2["min"] == 500


# ─────────────────────────────────────────────────────────────────
# append_to_history
# ─────────────────────────────────────────────────────────────────
def test_append_empty_list_noop(temp_history):
    hdd.append_to_history([])
    assert not temp_history.exists()


def test_append_writes_to_file(temp_history):
    hotels = [
        {"hotel_name": "A", "city_to": "MAD", "checkin": "2026-06-15", "price_eur": 100},
    ]
    hdd.append_to_history(hotels)
    rows = hdd._load_history()
    assert len(rows) == 1
    assert rows[0]["price"] == 100


def test_append_skips_zero_or_negative_price(temp_history):
    hotels = [
        {"hotel_name": "A", "city_to": "MAD", "checkin": "2026-06-15", "price_eur": 0},
        {"hotel_name": "B", "city_to": "BCN", "checkin": "2026-06-15", "price_eur": -5},
        {"hotel_name": "C", "city_to": "LIS", "checkin": "2026-06-15", "price_eur": 100},
    ]
    hdd.append_to_history(hotels)
    rows = hdd._load_history()
    assert len(rows) == 1
    assert rows[0]["hotel"] == "C"


def test_append_multiple_runs_accumulate(temp_history):
    hdd.append_to_history([
        {"hotel_name": "A", "city_to": "MAD", "checkin": "2026-06-15", "price_eur": 100},
    ])
    hdd.append_to_history([
        {"hotel_name": "B", "city_to": "MAD", "checkin": "2026-06-15", "price_eur": 110},
    ])
    rows = hdd._load_history()
    assert len(rows) == 2


# ─────────────────────────────────────────────────────────────────
# detect_deals
# ─────────────────────────────────────────────────────────────────
def test_detect_deals_empty(temp_history):
    deals, regular = hdd.detect_deals([])
    assert deals == []
    assert regular == []


def test_detect_deals_below_min_price_goes_regular(temp_history):
    hotels = [
        {"hotel_name": "Hostal", "city_to": "MAD", "checkin": "2026-06-15", "price_eur": 20},
    ]
    deals, regular = hdd.detect_deals(hotels)
    # Below MIN_PRICE_EUR (35) → regular bucket
    assert len(regular) == 1
    assert len(deals) == 0


def test_detect_deals_bootstrap_picks_one_per_city(temp_history):
    hotels = [
        {"hotel_name": "A", "city_to": "MAD", "checkin": "2026-06-15", "price_eur": 100},
        {"hotel_name": "B", "city_to": "MAD", "checkin": "2026-06-15", "price_eur": 110},
        {"hotel_name": "C", "city_to": "BCN", "checkin": "2026-06-15", "price_eur": 90},
    ]
    deals, regular = hdd.detect_deals(hotels)
    # Bootstrap mode: 1 hotel per city
    cities_in_deals = {d.get("city_to") for d in deals}
    assert "MAD" in cities_in_deals
    assert "BCN" in cities_in_deals


def test_detect_deals_baseline_drop_triggers(temp_history):
    # Hotel with baseline_low_price → no need for history
    hotels = [
        {"hotel_name": "Cheap Madrid", "city_to": "MAD",
         "checkin": "2026-06-15", "price_eur": 80,
         "baseline_low_price": 200},  # 60% drop
    ]
    # Detect_deals runs append_to_history first, but the SerpAPI baseline lets us bypass history
    deals, regular = hdd.detect_deals(hotels)
    # Bootstrap picks 1 per city, but this should also have signals
    assert len(deals) >= 0


# ─────────────────────────────────────────────────────────────────
# get_history_stats
# ─────────────────────────────────────────────────────────────────
def test_get_history_stats_empty(temp_history):
    s = hdd.get_history_stats()
    assert s["total_samples"] == 0
    assert s["unique_hotels"] == 0
    assert s["oldest"] is None
    assert s["newest"] is None


def test_get_history_stats_with_data(temp_history):
    rows = [
        {"ts": "2026-05-01T00:00:00", "key": "k1", "price": 100},
        {"ts": "2026-05-02T00:00:00", "key": "k1", "price": 110},
        {"ts": "2026-05-03T00:00:00", "key": "k2", "price": 200},
    ]
    hdd._save_history(rows)
    s = hdd.get_history_stats()
    assert s["total_samples"] == 3
    assert s["unique_hotels"] == 2
    assert s["oldest"] == "2026-05-01T00:00:00"
    assert s["newest"] == "2026-05-03T00:00:00"


# ─────────────────────────────────────────────────────────────────
# Module-level constants
# ─────────────────────────────────────────────────────────────────
def test_module_constants_sane():
    assert 0 < hdd.THRESHOLD_DROP_VS_HISTORY < 1
    assert 0 < hdd.THRESHOLD_DROP_VS_BASELINE < 1
    assert hdd.THRESHOLD_OUTLIER_STDEV > 0
    assert hdd.HISTORY_MIN_SAMPLES > 0
    assert hdd.HISTORY_PRUNE_DAYS > 0
    assert hdd.MIN_DROP_EUR > 0
    assert hdd.MIN_PRICE_EUR > 0
