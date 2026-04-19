"""
Unit tests: deals_exporter.py — dedup cross-source, filter_quality, schema output
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import pytest

import deals_exporter
from deals_exporter import (
    DEALS_SCHEMA_VERSION,
    MIN_EXPORT_SCORE,
    build_unified_deals,
    dedup_flights,
    export_deals_json,
    filter_quality,
    find_new_deals,
    load_previous_deals,
)


# ---------------------------------------------------------------------------
# dedup_flights
# ---------------------------------------------------------------------------
class TestDedupFlights:
    def test_two_sources_same_route_keeps_cheapest_and_verifies(self, flights_multi_source):
        deduped = dedup_flights(flights_multi_source)
        assert len(deduped) == 1
        best = deduped[0]
        assert best["price_eur"] == 395.0  # precio minimo
        assert best["verified"] is True
        assert set(best["sources"]) == {"kiwi", "serpapi", "rapidapi"}
        assert best["source_count"] == 3

    def test_single_source_not_verified(self):
        flights = [{
            "source": "kiwi", "origin": "MAD", "destination": "JFK",
            "date_out": "2026-07-15", "cabin": "economy",
            "price_eur": 400, "final_score": 30,
        }]
        deduped = dedup_flights(flights)
        assert deduped[0]["verified"] is False
        assert deduped[0]["source_count"] == 1

    def test_different_routes_not_merged(self):
        flights = [
            {"source": "kiwi", "origin": "MAD", "destination": "JFK",
             "date_out": "2026-07-15", "cabin": "economy", "price_eur": 400},
            {"source": "kiwi", "origin": "MAD", "destination": "LAX",
             "date_out": "2026-07-15", "cabin": "economy", "price_eur": 450},
        ]
        deduped = dedup_flights(flights)
        assert len(deduped) == 2

    def test_price_spread_too_wide_not_verified(self):
        # 2 fuentes pero precios muy distintos (>10%) -> NO verified
        flights = [
            {"source": "kiwi", "origin": "MAD", "destination": "JFK",
             "date_out": "2026-07-15", "cabin": "economy",
             "price_eur": 300, "final_score": 50},
            {"source": "serpapi", "origin": "MAD", "destination": "JFK",
             "date_out": "2026-07-15", "cabin": "economy",
             "price_eur": 500, "final_score": 40},
        ]
        deduped = dedup_flights(flights)
        assert deduped[0]["verified"] is False
        assert deduped[0]["price_eur"] == 300


# ---------------------------------------------------------------------------
# filter_quality
# ---------------------------------------------------------------------------
class TestFilterQuality:
    def test_zero_price_filtered(self):
        deals = [{"price_eur": 0, "destination": "JFK", "date_out": "2026-07-15",
                  "final_score": 50}]
        assert filter_quality(deals) == []

    def test_missing_destination_filtered(self):
        deals = [{"price_eur": 100, "destination": "", "date_out": "2026-07-15",
                  "final_score": 50}]
        assert filter_quality(deals) == []

    def test_low_score_filtered(self):
        deals = [{"price_eur": 100, "destination": "JFK", "date_out": "2026-07-15",
                  "final_score": MIN_EXPORT_SCORE - 1}]
        assert filter_quality(deals) == []

    def test_expired_deal_filtered(self):
        past = (datetime.now() - timedelta(days=1)).isoformat()
        deals = [{"price_eur": 100, "destination": "JFK", "date_out": "2026-07-15",
                  "final_score": 50, "expires_at": past}]
        assert filter_quality(deals) == []

    def test_valid_deal_passes(self):
        future = (datetime.now() + timedelta(days=5)).isoformat()
        deals = [{"price_eur": 100, "destination": "JFK", "date_out": "2026-07-15",
                  "final_score": 50, "expires_at": future}]
        assert len(filter_quality(deals)) == 1

    def test_custom_min_score_threshold(self):
        deals = [{"price_eur": 100, "destination": "JFK", "date_out": "2026-07-15",
                  "final_score": 20}]
        assert filter_quality(deals, min_score=50) == []
        assert len(filter_quality(deals, min_score=15)) == 1


# ---------------------------------------------------------------------------
# build_unified_deals — schema output
# ---------------------------------------------------------------------------
class TestBuildUnifiedDeals:
    def test_schema_version_matches(self, analyzed_deal_critico):
        obj = build_unified_deals([analyzed_deal_critico])
        assert obj["schema_version"] == DEALS_SCHEMA_VERSION

    def test_includes_required_top_level_keys(self, analyzed_deal_critico):
        obj = build_unified_deals([analyzed_deal_critico])
        for k in ("schema_version", "generated_at", "total_deals", "stats", "deals"):
            assert k in obj

    def test_deal_has_required_fields(self, analyzed_deal_critico):
        obj = build_unified_deals([analyzed_deal_critico])
        deal = obj["deals"][0]
        required = {
            "id", "type", "origin", "destination", "price_eur",
            "classification", "score", "cabin", "sources", "verified",
        }
        missing = required - set(deal.keys())
        assert not missing, f"Faltan campos: {missing}"

    def test_id_format_is_source_origin_dest_date_cabin(self, analyzed_deal_critico):
        obj = build_unified_deals([analyzed_deal_critico])
        deal = obj["deals"][0]
        # Formato esperado: source_origin_dest_YYYYMMDD_cabin (todo lowercase)
        assert deal["id"].startswith("kiwi_mad_nrt_")
        assert deal["id"].endswith("_business")

    def test_stats_counts_by_classification(self, analyzed_deal_critico):
        obj = build_unified_deals([analyzed_deal_critico])
        stats = obj["stats"]
        assert stats["total"] == 1
        assert stats["by_classification"].get("CRÍTICO") == 1

    def test_sorted_by_score_desc(self):
        deal_low = {
            "origin": "MAD", "destination": "FCO", "date_out": "2026-06-01",
            "cabin": "economy", "final_score": 20, "classification": "OFERTA",
            "price_eur": 50, "source": "vueling",
        }
        deal_high = {
            "origin": "MAD", "destination": "NRT", "date_out": "2026-07-15",
            "cabin": "business", "final_score": 90, "classification": "CRÍTICO",
            "price_eur": 200, "source": "kiwi",
        }
        obj = build_unified_deals([deal_low, deal_high])
        scores = [d["score"] for d in obj["deals"]]
        assert scores == sorted(scores, reverse=True)

    def test_empty_input(self):
        obj = build_unified_deals([])
        assert obj["total_deals"] == 0
        assert obj["deals"] == []


# ---------------------------------------------------------------------------
# export_deals_json
# ---------------------------------------------------------------------------
class TestExportDealsJson:
    def test_writes_main_file(self, tmp_path, analyzed_deal_critico):
        obj = build_unified_deals([analyzed_deal_critico])
        path = export_deals_json(obj, str(tmp_path))
        assert Path(path).exists()
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        assert data["schema_version"] == DEALS_SCHEMA_VERSION

    def test_also_writes_history_snapshot(self, tmp_path, analyzed_deal_critico):
        obj = build_unified_deals([analyzed_deal_critico])
        export_deals_json(obj, str(tmp_path))
        history_dir = tmp_path / "history"
        assert history_dir.exists()
        snapshots = list(history_dir.glob("deals_*.json"))
        assert len(snapshots) >= 1


# ---------------------------------------------------------------------------
# find_new_deals
# ---------------------------------------------------------------------------
class TestFindNewDeals:
    def test_new_critico_is_reported(self):
        current = [{
            "id": "deal_1", "classification": "CRÍTICO", "price_eur": 200,
        }]
        previous = {}
        new = find_new_deals(current, previous)
        assert len(new) == 1
        assert new[0]["id"] == "deal_1"

    def test_price_drop_on_existing_deal_is_reported(self):
        current = [{"id": "deal_1", "classification": "ERROR", "price_eur": 200}]
        previous = {"deal_1": {"id": "deal_1", "price_eur": 400}}
        new = find_new_deals(current, previous)
        assert len(new) == 1
        assert new[0].get("price_drop_from") == 400

    def test_no_change_not_reported(self):
        current = [{"id": "deal_1", "classification": "ERROR", "price_eur": 400}]
        previous = {"deal_1": {"id": "deal_1", "price_eur": 410}}
        new = find_new_deals(current, previous)
        assert new == []

    def test_normal_classification_ignored(self):
        # Solo CRITICO/ERROR disparan alerta
        current = [{"id": "deal_1", "classification": "OFERTA", "price_eur": 200}]
        new = find_new_deals(current, {})
        assert new == []


# ---------------------------------------------------------------------------
# load_previous_deals
# ---------------------------------------------------------------------------
class TestLoadPreviousDeals:
    def test_missing_file_returns_empty(self, tmp_path):
        assert load_previous_deals(str(tmp_path)) == {}

    def test_reads_existing_file(self, tmp_path):
        deals_obj = {
            "deals": [
                {"id": "abc", "price_eur": 100},
                {"id": "def", "price_eur": 200},
            ]
        }
        (tmp_path / "deals.json").write_text(json.dumps(deals_obj))
        loaded = load_previous_deals(str(tmp_path))
        assert set(loaded.keys()) == {"abc", "def"}
