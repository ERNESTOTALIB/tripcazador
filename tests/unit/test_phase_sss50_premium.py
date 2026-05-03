"""
Tests para fase SSS50 — Premium Deep Search (May 2026):
  - Lib airport_clusters.ts (resolveCluster, expandCluster, generatePairs)
  - Endpoint /api/premium/deep-search
  - Página /premium/search
  - Componente DeepSearchClient
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# Lib airport_clusters
# ════════════════════════════════════════════════

class TestAirportClusters:
    LIB = WEB / "src/lib/airport_clusters.ts"

    def test_lib_exists(self):
        assert self.LIB.exists()

    def test_has_madrid_cluster(self):
        c = _read(self.LIB)
        assert "madrid" in c
        assert "primary: \"MAD\"" in c
        assert "TOJ" in c

    def test_has_bali_cluster(self):
        c = _read(self.LIB)
        assert "bali" in c
        assert "primary: \"DPS\"" in c

    def test_has_london_with_5_secondary(self):
        c = _read(self.LIB)
        # LHR + LGW + STN + LTN + LCY
        for code in ("LHR", "LGW", "STN", "LTN", "LCY"):
            assert code in c

    def test_has_30plus_clusters(self):
        c = _read(self.LIB)
        # Cuento líneas que tienen "primary:" — proxy de cantidad de clusters
        assert c.count("primary:") >= 30

    def test_resolve_cluster_function(self):
        c = _read(self.LIB)
        assert "export function resolveCluster" in c
        assert "primary === iata" in c or "primary == iata" in c

    def test_expand_cluster_function(self):
        c = _read(self.LIB)
        assert "export function expandCluster" in c

    def test_generate_pairs_function(self):
        c = _read(self.LIB)
        assert "export function generatePairs" in c
        assert "from: f, to: t" in c

    def test_has_ny_with_3_airports(self):
        c = _read(self.LIB)
        # JFK + LGA + EWR
        for code in ("JFK", "LGA", "EWR"):
            assert code in c


# ════════════════════════════════════════════════
# Endpoint /api/premium/deep-search
# ════════════════════════════════════════════════

class TestDeepSearchEndpoint:
    EP = WEB / "src/app/api/premium/deep-search/route.ts"

    def test_endpoint_exists(self):
        assert self.EP.exists()

    def test_runtime_nodejs(self):
        c = _read(self.EP)
        assert 'export const runtime = "nodejs"' in c

    def test_post_method(self):
        c = _read(self.EP)
        assert "export async function POST" in c

    def test_imports_clusters(self):
        c = _read(self.EP)
        assert "airport_clusters" in c
        assert "resolveCluster" in c
        assert "generatePairs" in c

    def test_typical_prices_per_region(self):
        c = _read(self.EP)
        assert "TYPICAL_PRICES_BY_REGION" in c
        for region in ("Europa", "Asia", "Sudamérica"):
            assert region in c

    def test_input_validation(self):
        c = _read(self.EP)
        assert "origin_not_found" in c
        assert "destination_not_found" in c
        assert "dates_required" in c

    def test_flex_days_clamped(self):
        c = _read(self.EP)
        # Math.min(7, Math.max(0, ... ?? 3))
        assert "Math.min(7" in c

    def test_explain_function(self):
        c = _read(self.EP)
        assert "explainOption" in c

    def test_returns_top_10(self):
        c = _read(self.EP)
        assert ".slice(0, 10)" in c

    def test_sorts_by_savings(self):
        c = _read(self.EP)
        assert "savings_eur" in c
        assert ".sort(" in c

    def test_dynamic_force(self):
        c = _read(self.EP)
        assert 'export const dynamic = "force-dynamic"' in c


# ════════════════════════════════════════════════
# Página /premium/search
# ════════════════════════════════════════════════

class TestPremiumSearchPage:
    PAGE = WEB / "src/app/premium/search/page.tsx"

    def test_page_exists(self):
        assert self.PAGE.exists()

    def test_has_metadata(self):
        c = _read(self.PAGE)
        assert "export const metadata" in c
        assert "Deep Search" in c
        assert 'canonical: "/premium/search"' in c

    def test_includes_deep_search_client(self):
        c = _read(self.PAGE)
        assert "DeepSearchClient" in c

    def test_has_jsonld_service(self):
        c = _read(self.PAGE)
        assert '"@type": "Service"' in c
        assert "Deep Search" in c

    def test_has_offer_premium_price(self):
        c = _read(self.PAGE)
        assert "2.99" in c
        assert "EUR" in c

    def test_has_how_it_works_4_steps(self):
        c = _read(self.PAGE)
        for step in ("origen + destino + fechas", "Expandimos a clusters", "Rastreamos", "top 10 opciones"):
            assert step in c


# ════════════════════════════════════════════════
# Componente DeepSearchClient
# ════════════════════════════════════════════════

class TestDeepSearchClient:
    COMP = WEB / "src/components/DeepSearchClient.tsx"

    def test_component_exists(self):
        assert self.COMP.exists()

    def test_use_client(self):
        c = _read(self.COMP)
        assert '"use client"' in c

    def test_uses_useState(self):
        c = _read(self.COMP)
        assert "useState" in c

    def test_calls_endpoint(self):
        c = _read(self.COMP)
        assert "/api/premium/deep-search" in c
        assert 'method: "POST"' in c

    def test_has_popular_pairs(self):
        c = _read(self.COMP)
        assert "POPULAR_PAIRS" in c
        for label in ("Madrid → Bali", "Madrid → Nueva York", "Madrid → Maldivas"):
            assert label in c

    def test_has_flex_days_selector(self):
        c = _read(self.COMP)
        assert "Sin flex" in c
        assert "±3 días" in c
        assert "±7 días" in c

    def test_renders_options_with_savings(self):
        c = _read(self.COMP)
        assert "savings_pct" in c
        assert "savings_eur" in c
        assert "ahorras" in c

    def test_ga4_tracking(self):
        c = _read(self.COMP)
        assert "deep_search_run" in c

    def test_displays_cluster_expansion(self):
        c = _read(self.COMP)
        assert "cluster_expansion" in c
