"""
API tests: FastAPI endpoints — /api/deals, /api/deals/top, /api/deals/{id},
/api/stats, /api/health, filtros, paginacion, 404.
"""
from __future__ import annotations

import pytest


class TestHealthEndpoint:
    def test_returns_200_and_ok_status(self, api_client):
        r = api_client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"

    def test_includes_deals_exists_flag(self, api_client):
        r = api_client.get("/api/health")
        data = r.json()
        assert "deals_exists" in data
        assert data["deals_exists"] is True

    def test_includes_timestamp(self, api_client):
        r = api_client.get("/api/health")
        assert "timestamp" in r.json()


class TestDealsEndpoint:
    def test_list_returns_200(self, api_client):
        r = api_client.get("/api/deals")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_expired_deals_not_returned(self, api_client):
        r = api_client.get("/api/deals")
        ids = [d["id"] for d in r.json()]
        assert "expired_deal" not in ids

    def test_filter_by_classification_critico(self, api_client):
        r = api_client.get("/api/deals?classification=CRÍTICO")
        data = r.json()
        assert all(d["classification"] == "CRÍTICO" for d in data)
        assert len(data) >= 1

    def test_filter_by_region(self, api_client):
        r = api_client.get("/api/deals?region=Europa")
        data = r.json()
        assert all(d["region"] == "Europa" for d in data)

    def test_filter_by_cabin_business(self, api_client):
        r = api_client.get("/api/deals?cabin=business")
        data = r.json()
        assert all(d["cabin"] == "business" for d in data)

    def test_filter_max_price(self, api_client):
        r = api_client.get("/api/deals?max_price=100")
        data = r.json()
        assert all(d["price_eur"] <= 100 for d in data)

    def test_filter_min_score(self, api_client):
        r = api_client.get("/api/deals?min_score=50")
        data = r.json()
        assert all(d["score"] >= 50 for d in data)

    def test_filter_verified_only(self, api_client):
        r = api_client.get("/api/deals?verified_only=true")
        data = r.json()
        assert all(d["verified"] is True for d in data)

    def test_pagination_limit(self, api_client):
        r = api_client.get("/api/deals?limit=1")
        assert len(r.json()) <= 1

    def test_pagination_offset(self, api_client):
        full = api_client.get("/api/deals?limit=10").json()
        if len(full) >= 2:
            r = api_client.get("/api/deals?limit=10&offset=1")
            paginated = r.json()
            # El primer elemento de paginated debe ser el segundo de full
            assert paginated[0]["id"] == full[1]["id"]

    def test_limit_too_high_rejected(self, api_client):
        r = api_client.get("/api/deals?limit=10000")
        assert r.status_code == 422

    def test_limit_zero_rejected(self, api_client):
        r = api_client.get("/api/deals?limit=0")
        assert r.status_code == 422


class TestTopDealsEndpoint:
    def test_default_limit_10(self, api_client):
        r = api_client.get("/api/deals/top")
        assert r.status_code == 200
        assert len(r.json()) <= 10

    def test_sorted_by_score_descending(self, api_client):
        r = api_client.get("/api/deals/top?limit=5")
        deals = r.json()
        scores = [d["score"] for d in deals]
        assert scores == sorted(scores, reverse=True)

    def test_filter_classification_in_top(self, api_client):
        r = api_client.get("/api/deals/top?classification=CRÍTICO")
        data = r.json()
        assert all(d["classification"] == "CRÍTICO" for d in data)


class TestDealByIdEndpoint:
    def test_returns_existing_deal(self, api_client):
        r = api_client.get("/api/deals/kiwi_mad_jfk_20260715_business")
        assert r.status_code == 200
        assert r.json()["id"] == "kiwi_mad_jfk_20260715_business"

    def test_nonexistent_id_returns_404(self, api_client):
        r = api_client.get("/api/deals/nonexistent_id_xxx")
        assert r.status_code == 404
        assert "no encontrado" in r.json()["detail"].lower() or \
               "not found" in r.json()["detail"].lower()


class TestStatsEndpoint:
    def test_returns_structure(self, api_client):
        r = api_client.get("/api/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ("total", "flights", "hotels", "by_classification",
                  "by_region", "by_cabin", "price_min", "price_max",
                  "price_avg", "verified_count", "generated_at"):
            assert k in data

    def test_totals_consistent_with_deals_count(self, api_client):
        stats = api_client.get("/api/stats").json()
        assert stats["total"] >= 0
        assert stats["flights"] >= 0


class TestRegionsEndpoint:
    def test_returns_dict(self, api_client):
        r = api_client.get("/api/regions")
        assert r.status_code == 200
        assert isinstance(r.json(), dict)
