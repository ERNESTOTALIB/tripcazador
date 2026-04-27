"""
Prod smoke tests — abr-2026ee.

Hits LIVE tripcazador.com to validate the full stack works end-to-end.
These tests are SKIPPED if the env var TRIPCAZADOR_PROD_SMOKE is not set
to "1" (so they never run by accident in CI without explicit opt-in).

Why these exist
---------------
The unit tests verify code structure (file presence, JSON-LD shape, blog
content, tests, sitemap entries). They DO NOT verify that the deployed
prod instance actually serves data. We discovered the 2026-04-27 outage
of `/api/deals` (returning []) only because the user opened the site —
the unit tests stayed green throughout.

These tests close that gap: they hit production and assert that:
  - core API endpoints respond 200 and return non-empty payloads
  - HTML pages render without 5xx
  - sitemap.xml + robots.txt are present and well-formed
  - hreflang and canonical metadata are emitted
  - image/static assets resolve

Run locally:
    TRIPCAZADOR_PROD_SMOKE=1 pytest tests/integration/test_prod_smoke_apr26ee_20260427.py -v
"""
from __future__ import annotations

import os
import re
import urllib.request
import urllib.error
import json

import pytest

BASE = "https://tripcazador.com"
TIMEOUT = 15

ENABLED = os.environ.get("TRIPCAZADOR_PROD_SMOKE") == "1"

pytestmark = pytest.mark.skipif(
    not ENABLED,
    reason="TRIPCAZADOR_PROD_SMOKE=1 not set — opt-in only",
)


def _fetch(path: str, *, decode: bool = True):
    """GET path off BASE. Returns (status, body, headers)."""
    url = f"{BASE}{path}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "TripCazador-prod-smoke/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read()
            body = raw.decode("utf-8", errors="replace") if decode else raw
            return resp.status, body, dict(resp.headers)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if decode else e.read()
        return e.code, body, dict(e.headers)


# =============================================================================
# API endpoints
# =============================================================================


class TestApiHealth:
    def test_status_200(self):
        code, body, _ = _fetch("/api/health")
        assert code == 200, f"Expected 200, got {code}: {body[:200]}"

    def test_payload_shape(self):
        _, body, _ = _fetch("/api/health")
        data = json.loads(body)
        assert "status" in data
        assert data["status"] == "ok"
        assert "uptime_seconds" in data


class TestApiStatus:
    def test_status_200(self):
        code, _, _ = _fetch("/api/status")
        assert code == 200

    def test_deals_total_positive(self):
        """The whole point: prod must always have ≥1 deal."""
        _, body, _ = _fetch("/api/status")
        data = json.loads(body)
        assert data.get("deals_total", 0) > 0, (
            f"deals_total is {data.get('deals_total')} — prod has no deals "
            "(seed fallback also failing). Run seed_deals on the VPS."
        )

    def test_price_min_positive(self):
        _, body, _ = _fetch("/api/status")
        data = json.loads(body)
        assert data.get("price_min", 0) > 0


class TestApiDeals:
    def test_returns_list(self):
        code, body, _ = _fetch("/api/deals?limit=5")
        assert code == 200
        data = json.loads(body)
        assert isinstance(data, list)

    def test_at_least_one_deal(self):
        _, body, _ = _fetch("/api/deals?limit=5")
        data = json.loads(body)
        assert len(data) >= 1, "Empty deals list — seed fallback broken"

    def test_each_deal_has_required_fields(self):
        _, body, _ = _fetch("/api/deals?limit=10")
        data = json.loads(body)
        for d in data:
            for f in ("id", "headline", "origin", "destination", "price_eur"):
                assert f in d, f"Deal missing field: {f}"
            assert d["price_eur"] > 0


# =============================================================================
# HTML pages — render check (status + has expected markers)
# =============================================================================


class TestHomeRendering:
    def test_home_200(self):
        code, body, _ = _fetch("/")
        assert code == 200
        assert "TripCazador" in body

    def test_home_has_canonical(self):
        _, body, _ = _fetch("/")
        assert 'rel="canonical"' in body

    def test_home_has_hreflang(self):
        _, body, _ = _fetch("/")
        assert "hreflang" in body
        assert 'hreflang="es-ES"' in body or 'hreflang="es"' in body


class TestDealsPageRendering:
    def test_deals_200(self):
        code, body, _ = _fetch("/deals")
        assert code == 200

    def test_deals_has_jsonld(self):
        _, body, _ = _fetch("/deals")
        assert 'application/ld+json' in body


class TestBlogIndexRendering:
    def test_blog_200(self):
        code, body, _ = _fetch("/blog")
        assert code == 200
        # Has at least one blog post link
        assert "/blog/" in body


class TestDestinosRendering:
    def test_destinos_200(self):
        code, body, _ = _fetch("/destinos")
        assert code == 200


class TestEnHomeRendering:
    def test_en_200(self):
        code, body, _ = _fetch("/en")
        assert code == 200
        assert "TripCazador" in body


# =============================================================================
# SEO infrastructure
# =============================================================================


class TestSitemap:
    def test_sitemap_200(self):
        code, body, _ = _fetch("/sitemap.xml")
        assert code == 200

    def test_sitemap_has_urls(self):
        _, body, _ = _fetch("/sitemap.xml")
        # Be tolerant: sitemap may be served as index pointing to sub-sitemaps
        assert "<loc>" in body or "sitemap" in body.lower()

    def test_sitemap_includes_home(self):
        _, body, _ = _fetch("/sitemap.xml")
        assert "tripcazador.com" in body

    def test_sitemap_has_blog_routes(self):
        _, body, _ = _fetch("/sitemap.xml")
        assert "/blog" in body


class TestRobotsTxt:
    def test_robots_200(self):
        code, body, _ = _fetch("/robots.txt")
        assert code == 200
        assert "Sitemap" in body or "sitemap" in body

    def test_robots_user_agent(self):
        _, body, _ = _fetch("/robots.txt")
        assert "User-agent" in body


class TestRssFeed:
    def test_rss_200(self):
        code, body, _ = _fetch("/rss.xml")
        # RSS may 200 or 404 depending on feed presence; require 200 since we promised it
        assert code == 200, f"RSS expected 200 got {code}"

    def test_rss_xml(self):
        _, body, _ = _fetch("/rss.xml")
        assert "<rss" in body or "<feed" in body


# =============================================================================
# Specific routes that must work
# =============================================================================


class TestCalculadoras:
    @pytest.mark.parametrize("path", [
        "/calculadora",
        "/calculadora-co2",
        "/calculadora-millas",
        "/calculadora-cancelacion",
        "/calculadora-upgrade",
    ])
    def test_each_calc_200(self, path):
        code, _, _ = _fetch(path)
        assert code == 200, f"{path} returned {code}"


class TestNewMonthlyHubs:
    @pytest.mark.parametrize("month", [
        "enero", "abril", "julio", "diciembre",
    ])
    def test_each_month_200(self, month):
        code, body, _ = _fetch(f"/vuelos-baratos-{month}")
        assert code == 200, f"month {month} returned {code}"


class TestRegionesHubs:
    @pytest.mark.parametrize("region", [
        "caribe", "europa-este", "sudeste-asiatico", "norte-africa",
    ])
    def test_each_region_200(self, region):
        code, _, _ = _fetch(f"/regiones/{region}")
        assert code == 200, f"region {region} returned {code}"


# =============================================================================
# Security headers
# =============================================================================


class TestSecurityHeaders:
    def test_csp_present_on_home(self):
        _, _, h = _fetch("/")
        # CSP is delivered via Report-Only or full CSP header
        has_csp = (
            "content-security-policy" in {k.lower() for k in h}
            or "content-security-policy-report-only" in {k.lower() for k in h}
        )
        assert has_csp, f"No CSP header present: {list(h.keys())}"

    def test_x_content_type_options(self):
        _, _, h = _fetch("/")
        # Header keys are case-insensitive
        keys = {k.lower(): v for k, v in h.items()}
        assert keys.get("x-content-type-options", "").lower() == "nosniff"

    def test_strict_transport_security(self):
        _, _, h = _fetch("/")
        keys = {k.lower(): v for k, v in h.items()}
        assert "strict-transport-security" in keys


# =============================================================================
# Performance sanity (these are loose; just reject pathological responses)
# =============================================================================


class TestPerformance:
    def test_home_response_size_reasonable(self):
        _, body, _ = _fetch("/")
        # Under 500KB suggests not pathological (code-splitting, lazy load works)
        assert len(body) < 500_000, f"Home is {len(body)} bytes — too heavy"

    def test_api_deals_response_size(self):
        _, body, _ = _fetch("/api/deals?limit=20")
        # 20 deals should be well under 200KB
        assert len(body) < 200_000


# =============================================================================
# i18n integrity
# =============================================================================


class TestI18nStubs:
    @pytest.mark.parametrize("path", ["/en", "/de", "/fr", "/it"])
    def test_each_lang_200(self, path):
        code, _, _ = _fetch(path)
        assert code == 200, f"{path} returned {code}"

    @pytest.mark.parametrize("path", ["/en/blog", "/en/destinos"])
    def test_en_subpages_200(self, path):
        code, _, _ = _fetch(path)
        assert code == 200


# =============================================================================
# Comparative routes
# =============================================================================


class TestComparativeRoutes:
    @pytest.mark.parametrize("slug", [
        "madrid-vs-lisboa-fin-de-semana",
        "bali-vs-tailandia-vacaciones",
    ])
    def test_each_comparison_200(self, slug):
        code, _, _ = _fetch(f"/comparar/{slug}")
        assert code == 200, f"{slug} returned {code}"
