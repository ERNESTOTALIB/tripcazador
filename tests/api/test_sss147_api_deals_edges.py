"""
SSS147 — /api/deals + /api/deals/{id} + /api/deals/top edge cases.
==================================================================
Comprehensive edge cases for filters, pagination, validation, 404s.
"""
from __future__ import annotations

import pytest


# ─────────────────────────────────────────────────────────────────
# /api/deals — basic shape
# ─────────────────────────────────────────────────────────────────
def test_deals_returns_200(api_client):
    res = api_client.get("/api/deals")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_deals_returns_non_expired_only(api_client):
    res = api_client.get("/api/deals")
    body = res.json()
    # Synthetic fixture has 1 expired ("expired_deal") that should be filtered
    ids = {d["id"] for d in body}
    assert "expired_deal" not in ids


def test_deals_filter_by_classification_critico(api_client):
    res = api_client.get("/api/deals?classification=CRÍTICO")
    assert res.status_code == 200
    for d in res.json():
        assert d["classification"] == "CRÍTICO"


def test_deals_filter_by_classification_oferta(api_client):
    res = api_client.get("/api/deals?classification=OFERTA")
    assert res.status_code == 200
    for d in res.json():
        assert d["classification"] == "OFERTA"


def test_deals_filter_unknown_classification_returns_empty(api_client):
    res = api_client.get("/api/deals?classification=NONEXISTENT")
    assert res.status_code == 200
    assert res.json() == []


# ─────────────────────────────────────────────────────────────────
# /api/deals — region, cabin filters
# ─────────────────────────────────────────────────────────────────
def test_deals_filter_by_region(api_client):
    res = api_client.get("/api/deals?region=Europa")
    for d in res.json():
        assert d["region"] == "Europa"


def test_deals_filter_by_region_america(api_client):
    res = api_client.get("/api/deals?region=América Norte")
    for d in res.json():
        assert d["region"] == "América Norte"


@pytest.mark.parametrize("cabin", ["economy", "business", "first", "premium_economy"])
def test_deals_filter_by_cabin(api_client, cabin):
    res = api_client.get(f"/api/deals?cabin={cabin}")
    assert res.status_code == 200
    for d in res.json():
        assert d["cabin"] == cabin


def test_deals_filter_combined(api_client):
    res = api_client.get("/api/deals?cabin=business&region=América Norte")
    assert res.status_code == 200
    for d in res.json():
        assert d["cabin"] == "business"
        assert d["region"] == "América Norte"


# ─────────────────────────────────────────────────────────────────
# /api/deals — max_price, min_score
# ─────────────────────────────────────────────────────────────────
def test_deals_max_price_filters(api_client):
    res = api_client.get("/api/deals?max_price=100")
    for d in res.json():
        assert d["price_eur"] <= 100


def test_deals_max_price_zero_means_no_filter(api_client):
    # SSS146 fix: max_price=0 should be treated as wildcard
    res_zero = api_client.get("/api/deals?max_price=0")
    res_none = api_client.get("/api/deals")
    assert res_zero.status_code == 200
    # Both should return same set of non-expired deals
    assert len(res_zero.json()) == len(res_none.json())


def test_deals_min_score(api_client):
    res = api_client.get("/api/deals?min_score=90")
    for d in res.json():
        assert d.get("score", 0) >= 90


def test_deals_min_score_negative(api_client):
    res = api_client.get("/api/deals?min_score=-100")
    # Should accept any deals
    assert res.status_code == 200


def test_deals_max_price_very_high(api_client):
    res = api_client.get("/api/deals?max_price=999999")
    # Should accept everything (non-expired)
    assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────
# /api/deals — origin / destination
# ─────────────────────────────────────────────────────────────────
def test_deals_filter_origin_iata(api_client):
    res = api_client.get("/api/deals?origin=MAD")
    assert res.status_code == 200
    for d in res.json():
        assert d["origin"] == "MAD"


def test_deals_filter_destination_iata(api_client):
    res = api_client.get("/api/deals?destination=JFK")
    assert res.status_code == 200
    for d in res.json():
        assert d["destination"] == "JFK"


def test_deals_filter_origin_lowercase_normalized(api_client):
    res = api_client.get("/api/deals?origin=mad")
    assert res.status_code == 200
    for d in res.json():
        assert d["origin"] == "MAD"


def test_deals_filter_origin_too_short_422(api_client):
    res = api_client.get("/api/deals?origin=MA")
    assert res.status_code == 422  # min_length=3


def test_deals_filter_destination_too_long_422(api_client):
    res = api_client.get("/api/deals?destination=MADRID")
    assert res.status_code == 422  # max_length=3


# ─────────────────────────────────────────────────────────────────
# /api/deals — pagination
# ─────────────────────────────────────────────────────────────────
def test_deals_limit_one(api_client):
    res = api_client.get("/api/deals?limit=1")
    assert res.status_code == 200
    assert len(res.json()) <= 1


@pytest.mark.parametrize("limit", [1, 5, 10, 50, 100])
def test_deals_limit_various(api_client, limit):
    res = api_client.get(f"/api/deals?limit={limit}")
    assert res.status_code == 200
    assert len(res.json()) <= limit


def test_deals_limit_zero_invalid(api_client):
    res = api_client.get("/api/deals?limit=0")
    assert res.status_code == 422  # ge=1


def test_deals_limit_negative_invalid(api_client):
    res = api_client.get("/api/deals?limit=-1")
    assert res.status_code == 422


def test_deals_limit_above_max(api_client):
    res = api_client.get("/api/deals?limit=10000")
    assert res.status_code == 422  # le=500


def test_deals_offset_negative_invalid(api_client):
    res = api_client.get("/api/deals?offset=-1")
    assert res.status_code == 422


@pytest.mark.parametrize("offset", [0, 1, 5, 100])
def test_deals_offset_various(api_client, offset):
    res = api_client.get(f"/api/deals?offset={offset}")
    assert res.status_code == 200


def test_deals_pagination_returns_remaining(api_client):
    page_a = api_client.get("/api/deals?limit=1&offset=0").json()
    page_b = api_client.get("/api/deals?limit=1&offset=1").json()
    if len(page_a) and len(page_b):
        # Should be different deals
        assert page_a[0]["id"] != page_b[0]["id"]


# ─────────────────────────────────────────────────────────────────
# /api/deals — verified_only
# ─────────────────────────────────────────────────────────────────
def test_deals_verified_only_true(api_client):
    res = api_client.get("/api/deals?verified_only=true")
    assert res.status_code == 200
    for d in res.json():
        assert d.get("verified") is True


def test_deals_verified_only_false_returns_all(api_client):
    res = api_client.get("/api/deals?verified_only=false")
    assert res.status_code == 200


# ─────────────────────────────────────────────────────────────────
# /api/deals/{id}
# ─────────────────────────────────────────────────────────────────
def test_deal_by_id_existing(api_client):
    res = api_client.get("/api/deals/kiwi_mad_jfk_20260715_business")
    assert res.status_code == 200
    assert res.json()["id"] == "kiwi_mad_jfk_20260715_business"


def test_deal_by_id_unknown_404(api_client):
    res = api_client.get("/api/deals/nonexistent-id-xyz")
    assert res.status_code == 404


def test_deal_by_id_too_long_404(api_client):
    # > 64 chars → defensive 404
    res = api_client.get("/api/deals/" + "a" * 100)
    assert res.status_code == 404


def test_deal_by_id_with_whitespace(api_client):
    # Path with %20 will be decoded → whitespace → 404
    res = api_client.get("/api/deals/abc%20def")
    assert res.status_code == 404


def test_deal_by_id_special_chars(api_client):
    res = api_client.get("/api/deals/abc!@#")
    # Should not be 500 — either 404 or similar
    assert res.status_code in (404, 422)


# ─────────────────────────────────────────────────────────────────
# /api/deals/top
# ─────────────────────────────────────────────────────────────────
def test_top_deals_default(api_client):
    res = api_client.get("/api/deals/top")
    assert res.status_code == 200


def test_top_deals_with_limit(api_client):
    res = api_client.get("/api/deals/top?limit=5")
    assert res.status_code == 200
    assert len(res.json()) <= 5


@pytest.mark.parametrize("limit", [1, 5, 10, 50])
def test_top_deals_various_limits(api_client, limit):
    res = api_client.get(f"/api/deals/top?limit={limit}")
    assert res.status_code == 200
    assert len(res.json()) <= limit


def test_top_deals_zero_limit_invalid(api_client):
    res = api_client.get("/api/deals/top?limit=0")
    assert res.status_code == 422


def test_top_deals_limit_above_50_invalid(api_client):
    res = api_client.get("/api/deals/top?limit=51")
    assert res.status_code == 422


def test_top_deals_with_classification(api_client):
    res = api_client.get("/api/deals/top?classification=CRÍTICO")
    assert res.status_code == 200
    for d in res.json():
        assert d["classification"] == "CRÍTICO"


def test_top_deals_no_expired(api_client):
    res = api_client.get("/api/deals/top?limit=50")
    ids = {d["id"] for d in res.json()}
    assert "expired_deal" not in ids
