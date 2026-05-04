"""
Tests para fase SSS53 — UX cleanup + IG layout v2 (May 2026):
  - ExpiryCountdown: cap a 72h (no más "Expira en 89d 23h")
  - DealCard: filtra tags internas (seed, engine:*, fallback, etc.)
  - /api/og/social/post-v2: nuevo layout Hopper-inspired mega-precio
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# ExpiryCountdown 72h cap
# ════════════════════════════════════════════════

class TestExpiryCountdown72hCap:
    COMP = WEB / "src/components/ExpiryCountdown.tsx"

    def test_component_exists(self):
        assert self.COMP.exists()

    def test_caps_at_72h(self):
        c = _read(self.COMP)
        # SSS53: si remainingH > 72, no contador (mostramos chip frescura)
        assert "remainingH > 72" in c, "Necesita cap explícito a 72h"

    def test_fallback_to_freshness_chip(self):
        c = _read(self.COMP)
        # Cuando expiry > 72h pero hay foundAt, mostramos "Visto hace X"
        assert "Visto" in c

    def test_returns_null_if_far_expiry_no_foundat(self):
        c = _read(self.COMP)
        # Sin foundAt + expiry lejana → null (no chip)
        assert "return null" in c


# ════════════════════════════════════════════════
# DealCard internal tag filter
# ════════════════════════════════════════════════

class TestDealCardInternalTagFilter:
    COMP = WEB / "src/components/DealCard.tsx"

    def test_filters_seed_tag(self):
        c = _read(self.COMP)
        # SSS53: "seed" no debe ser visible al usuario público
        assert "INTERNAL_TAG_EXACT" in c
        assert '"seed"' in c

    def test_filters_engine_prefix(self):
        c = _read(self.COMP)
        assert "INTERNAL_TAG_PREFIXES" in c
        assert '"engine:"' in c
        assert '"real_engine:"' in c

    def test_uses_publictags_filtered(self):
        c = _read(self.COMP)
        assert "publicTags" in c
        # Solo renderizamos si publicTags.length > 0
        assert "publicTags.length === 0" in c

    def test_filter_is_lowercase_safe(self):
        c = _read(self.COMP)
        # Filtro debe ser case-insensitive (toLowerCase)
        assert "toLowerCase()" in c


# ════════════════════════════════════════════════
# IG layout v2 (post-v2 endpoint)
# ════════════════════════════════════════════════

class TestIGLayoutV2:
    EP = WEB / "src/app/api/og/social/post-v2/route.tsx"

    def test_endpoint_exists(self):
        assert self.EP.exists()

    def test_runtime_edge(self):
        c = _read(self.EP)
        assert 'export const runtime = "edge"' in c

    def test_dimensions_1080(self):
        c = _read(self.EP)
        assert "width: 1080" in c
        assert "height: 1080" in c

    def test_mega_price_hero(self):
        c = _read(self.EP)
        # Hopper-inspired: precio gigante 320px
        assert "320px" in c

    def test_brand_palette(self):
        c = _read(self.EP)
        # Navy + ámbar consistente
        assert "#0a1530" in c
        assert "#fbbf24" in c

    def test_aggressive_cache_headers(self):
        c = _read(self.EP)
        # Hereda política SSS51
        assert "s-maxage=86400" in c
        assert "stale-while-revalidate=604800" in c

    def test_supports_dealid(self):
        c = _read(self.EP)
        assert "dealId" in c
        assert "getDeals" in c

    def test_savings_badge(self):
        c = _read(self.EP)
        # Badge -X% verde para destacar ahorro
        assert "savingsPct" in c
        assert "#10B981" in c  # emerald-500

    def test_cta_present(self):
        c = _read(self.EP)
        assert "CAZAR ESTE" in c
        assert "TripCazador" in c or "logo-horizontal" in c  # SSS58 logo
