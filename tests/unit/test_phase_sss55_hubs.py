"""
Tests para fase SSS55 — Hubs + IG story redesign + Premium v2 (May 2026):
  - +3 hubs ALC, TFS, LPA (10 total)
  - IG story redesign — más visual, menos vacío
  - Premium Deep Search — flag `live` para futuro on-demand hunter
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# Hubs SSS55
# ════════════════════════════════════════════════

class TestSSS55Hubs:
    LIB = WEB / "src/lib/hubs.ts"

    def test_lib_exists(self):
        assert self.LIB.exists()

    def test_3_new_hubs_present(self):
        c = _read(self.LIB)
        for code in ("ALC", "TFS", "LPA"):
            assert f'code: "{code}"' in c, f"Falta hub {code}"

    def test_alc_data_complete(self):
        c = _read(self.LIB)
        # ALC: Alicante-Elche, Costa Blanca audience UK
        idx = c.find('code: "ALC"')
        assert idx >= 0
        block = c[idx:idx + 3000]
        assert "Alicante" in block
        assert "Costa Blanca" in block
        assert "LGW" in block  # London Gatwick should be top destination
        assert "STN" in block  # Stansted

    def test_tfs_data_complete(self):
        c = _read(self.LIB)
        idx = c.find('code: "TFS"')
        assert idx >= 0
        block = c[idx:idx + 3000]
        assert "Tenerife" in block
        assert "Costa Adeje" in block or "Los Cristianos" in block

    def test_lpa_data_complete(self):
        c = _read(self.LIB)
        idx = c.find('code: "LPA"')
        assert idx >= 0
        block = c[idx:idx + 3000]
        assert "Gran Canaria" in block
        assert "Las Palmas" in block

    def test_count_at_least_10_hubs(self):
        c = _read(self.LIB)
        # Cuento `code: "XXX"` patrones
        import re
        codes = re.findall(r'code:\s*"([A-Z]{3})"', c)
        assert len(codes) >= 10, f"Esperaba ≥10 hubs, hay {len(codes)}"


# ════════════════════════════════════════════════
# IG story redesign
# ════════════════════════════════════════════════

class TestSSS55StoryRedesign:
    EP = WEB / "src/app/api/og/social/story/route.tsx"

    def test_endpoint_exists(self):
        assert self.EP.exists()

    def test_emoji_size_increased(self):
        c = _read(self.EP)
        # 480px ahora vs 320px antes — emoji domina más el espacio
        assert "480px" in c

    def test_price_floating_in_sky_area(self):
        c = _read(self.EP)
        # Antes el precio solo aparecía en panel inferior. Ahora también
        # flota dentro del sky con un wrapper navy + ámbar border.
        assert "Price preview flotante" in c or "rgba(10,21,48,0.92)" in c

    def test_bottom_label_in_sky(self):
        c = _read(self.EP)
        # Nuevo: gradient label inferior en sky con savings_eur
        assert "ahorra" in c

    def test_brand_badge_pill_replaces_circle(self):
        c = _read(self.EP)
        # Antes: círculo 60×60 con ✈. Ahora: pill rectangular con "✈ TC"
        assert "✈ TC" in c


# ════════════════════════════════════════════════
# Premium Deep Search v2 — live flag
# ════════════════════════════════════════════════

class TestSSS55PremiumLiveFlag:
    EP = WEB / "src/app/api/premium/deep-search/route.ts"

    def test_endpoint_exists(self):
        assert self.EP.exists()

    def test_input_has_live_field(self):
        c = _read(self.EP)
        assert "live?: boolean" in c

    def test_response_has_mode_indicator(self):
        c = _read(self.EP)
        assert "live_mode:" in c
        assert "mode:" in c

    def test_documents_premium_gating(self):
        c = _read(self.EP)
        # Comentario debe explicar que requiere premium_token
        assert "premium_token" in c.lower()
