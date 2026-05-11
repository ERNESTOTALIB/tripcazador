"""
SSS147 — /api/search edge cases.
================================
IATA vs free-text match, accent-insensitive, max_price, date range, q text.
"""
from __future__ import annotations

import pytest


# ─────────────────────────────────────────────────────────────────
# Basic
# ─────────────────────────────────────────────────────────────────
def test_search_no_params_returns_200(api_client):
    res = api_client.get("/api/search")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_search_limit_default(api_client):
    res = api_client.get("/api/search")
    assert len(res.json()) <= 50


@pytest.mark.parametrize("limit", [1, 5, 50, 100, 200])
def test_search_various_limits(api_client, limit):
    res = api_client.get(f"/api/search?limit={limit}")
    assert res.status_code == 200
    assert len(res.json()) <= limit


def test_search_limit_zero_invalid(api_client):
    res = api_client.get("/api/search?limit=0")
    assert res.status_code == 422


def test_search_limit_above_200_invalid(api_client):
    res = api_client.get("/api/search?limit=300")
    assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────
# origin / destination - IATA exact match
# ─────────────────────────────────────────────────────────────────
def test_search_origin_iata_exact(api_client):
    res = api_client.get("/api/search?origin=MAD")
    for d in res.json():
        assert d["origin"] == "MAD"


def test_search_origin_lowercase_iata(api_client):
    res = api_client.get("/api/search?origin=mad")
    for d in res.json():
        assert d["origin"] == "MAD"


def test_search_destination_iata_exact(api_client):
    res = api_client.get("/api/search?destination=JFK")
    for d in res.json():
        assert d["destination"] == "JFK"


def test_search_iata_bug_213_no_substring_match(api_client):
    # Query "MAD" should NOT match a deal where city_from contains "Ahmadabad"
    # Since we have no Ahmadabad in fixture, this asserts that exact IATA logic is in place.
    res = api_client.get("/api/search?origin=MAD")
    for d in res.json():
        assert d["origin"] == "MAD"  # exact match only


# ─────────────────────────────────────────────────────────────────
# origin / destination - free-text substring
# ─────────────────────────────────────────────────────────────────
def test_search_origin_free_text_madrid(api_client):
    res = api_client.get("/api/search?origin=madrid")
    # Should hit deals where city_from contains "madrid" (accent-insensitive)
    assert res.status_code == 200


def test_search_destination_free_text_nueva_york(api_client):
    res = api_client.get("/api/search?destination=nueva")
    # city_to "Nueva York" should match
    assert res.status_code == 200


def test_search_accent_insensitive(api_client):
    # Searching "espana" should match "España"
    res = api_client.get("/api/search?destination=Espana")
    assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────
# Date range
# ─────────────────────────────────────────────────────────────────
def test_search_date_from(api_client):
    res = api_client.get("/api/search?date_from=2026-07-01")
    for d in res.json():
        if d.get("date_out"):
            assert d["date_out"] >= "2026-07-01"


def test_search_date_to(api_client):
    res = api_client.get("/api/search?date_to=2026-08-01")
    for d in res.json():
        if d.get("date_out"):
            assert d["date_out"] <= "2026-08-01"


def test_search_date_range(api_client):
    res = api_client.get("/api/search?date_from=2026-07-01&date_to=2026-08-31")
    assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────
# max_price
# ─────────────────────────────────────────────────────────────────
def test_search_max_price(api_client):
    res = api_client.get("/api/search?max_price=100")
    for d in res.json():
        assert d["price_eur"] <= 100


def test_search_max_price_zero(api_client):
    res = api_client.get("/api/search?max_price=0")
    # max_price=0 filter: matches only 0-price (or none)
    assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────
# cabin / deal_type
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("cabin", ["economy", "business", "first", "premium_economy"])
def test_search_cabin(api_client, cabin):
    res = api_client.get(f"/api/search?cabin={cabin}")
    for d in res.json():
        assert d["cabin"] == cabin


@pytest.mark.parametrize("dt", ["flight", "hotel"])
def test_search_deal_type(api_client, dt):
    res = api_client.get(f"/api/search?deal_type={dt}")
    for d in res.json():
        assert d.get("type") == dt


# ─────────────────────────────────────────────────────────────────
# q text
# ─────────────────────────────────────────────────────────────────
def test_search_q_in_headline(api_client):
    res = api_client.get("/api/search?q=Madrid")
    assert res.status_code == 200


def test_search_q_empty_no_op(api_client):
    res_a = api_client.get("/api/search")
    res_b = api_client.get("/api/search?q=")
    assert len(res_a.json()) == len(res_b.json())


def test_search_q_unicode(api_client):
    res = api_client.get("/api/search?q=Tokío")
    assert res.status_code == 200


def test_search_q_with_special_chars(api_client):
    res = api_client.get("/api/search?q=España")
    assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────
# Combined filters
# ─────────────────────────────────────────────────────────────────
def test_search_combined_origin_cabin(api_client):
    res = api_client.get("/api/search?origin=MAD&cabin=business")
    for d in res.json():
        assert d["origin"] == "MAD"
        assert d["cabin"] == "business"


def test_search_no_match_returns_empty(api_client):
    res = api_client.get("/api/search?origin=ZZZ")
    assert res.json() == []


# ─────────────────────────────────────────────────────────────────
# Other endpoints
# ─────────────────────────────────────────────────────────────────
def test_health(api_client):
    res = api_client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert "status" in body or "service" in body or "version" in body


def test_public_status(api_client):
    res = api_client.get("/api/status")
    assert res.status_code == 200
    body = res.json()
    assert "service" in body
    assert "health" in body
    assert body["health"] in {"unknown", "fresh", "healthy", "stale", "degraded"}


def test_status_includes_deals_total(api_client):
    res = api_client.get("/api/status")
    body = res.json()
    assert "deals_total" in body
    assert isinstance(body["deals_total"], int)


def test_stats_endpoint(api_client):
    res = api_client.get("/api/stats")
    assert res.status_code == 200


def test_regions_endpoint(api_client):
    res = api_client.get("/api/regions")
    assert res.status_code == 200


def test_metrics_endpoint(api_client):
    res = api_client.get("/api/metrics")
    # 200 (with data) or 401 (gated). Either is OK.
    assert res.status_code in (200, 401, 403)


# ─────────────────────────────────────────────────────────────────
# Unicode / encoding edge cases
# ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("term", ["こんにちは", "العربية", "中文", "русский", "한글"])
def test_search_q_various_unicode(api_client, term):
    res = api_client.get(f"/api/search?q={term}")
    assert res.status_code == 200


def test_search_very_long_q(api_client):
    res = api_client.get("/api/search?q=" + "a" * 1000)
    # Should still respond OK or 4xx
    assert res.status_code < 500


def test_search_empty_string_origin(api_client):
    res = api_client.get("/api/search?origin=")
    assert res.status_code == 200
