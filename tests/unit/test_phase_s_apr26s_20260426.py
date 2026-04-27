"""Tests para fase abr-2026s — admin trigger button, newsletter, search history, Bali blog."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


# =============================================================================
# S1 — ManualHuntButton component
# =============================================================================

class TestManualHuntButton:
    COMP = WEB / "src/components/ManualHuntButton.tsx"

    def test_exists(self):
        assert self.COMP.exists()

    def test_uses_admin_seed_endpoint(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert "/api/admin/seed" in c

    def test_token_input_password_type(self):
        """Token field debe ser type=password (no se ve en pantalla)."""
        c = self.COMP.read_text(encoding="utf-8")
        assert 'type="password"' in c

    def test_token_persisted_localstorage(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert "tc_admin_token" in c
        assert "localStorage" in c

    def test_includes_4_presets(self):
        c = self.COMP.read_text(encoding="utf-8")
        for preset in ("caribe", "asia-luxury", "africa-adventure", "weekend-europe"):
            assert preset in c

    def test_polls_health_endpoint(self):
        """Debe consultar /api/health para mostrar last hunt + deals count."""
        c = self.COMP.read_text(encoding="utf-8")
        assert "/api/health" in c
        assert "deals_total" in c

    def test_clears_token_on_401(self):
        """Si el token es inválido, limpiar localStorage para forzar re-input."""
        c = self.COMP.read_text(encoding="utf-8")
        assert re.search(r"401", c)
        assert "removeItem" in c

    def test_admin_page_imports_button(self):
        """/admin debe usar ManualHuntButton."""
        c = (WEB / "src/app/admin/page.tsx").read_text(encoding="utf-8")
        assert "ManualHuntButton" in c


# =============================================================================
# S2 — NewsletterSignup component + integration in home
# =============================================================================

class TestNewsletterSignup:
    COMP = WEB / "src/components/NewsletterSignup.tsx"

    def test_exists(self):
        assert self.COMP.exists()

    def test_posts_to_subscribe_endpoint(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert "/api/subscribe" in c

    def test_sends_consent_true(self):
        """Backend RGPD: requiere consent. Botón submit ES el consent explícito."""
        c = self.COMP.read_text(encoding="utf-8")
        assert "consent: true" in c

    def test_handles_already_subscribed(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert "already_subscribed" in c
        assert "duplicate" in c

    def test_has_honeypot(self):
        """Anti-bot: input oculto que solo bots llenan."""
        c = self.COMP.read_text(encoding="utf-8")
        assert "honeypot" in c.lower() or "honey" in c.lower()
        # Field oculto fuera de viewport
        assert "left: \"-9999px\"" in c or "tabIndex={-1}" in c

    def test_handles_429_rate_limit(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert "429" in c

    def test_aria_live_status(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert 'aria-live="polite"' in c

    def test_ga4_event_on_success(self):
        c = self.COMP.read_text(encoding="utf-8")
        assert "newsletter_signup" in c
        assert "gtag" in c

    def test_home_uses_newsletter(self):
        c = (WEB / "src/app/page.tsx").read_text(encoding="utf-8")
        assert "NewsletterSignup" in c

    def test_two_variants(self):
        """compact + expanded — adapta a contexto (hero vs footer vs blog)."""
        c = self.COMP.read_text(encoding="utf-8")
        assert "compact" in c and "expanded" in c


# =============================================================================
# S3 — Search history library
# =============================================================================

class TestSearchHistory:
    LIB = WEB / "src/lib/searchHistory.ts"

    def test_exists(self):
        assert self.LIB.exists()

    def test_consent_gated(self):
        """No guarda nada si el usuario no ha dado functional consent."""
        c = self.LIB.read_text(encoding="utf-8")
        assert "hasConsent" in c
        assert "functional" in c

    def test_max_5_entries(self):
        c = self.LIB.read_text(encoding="utf-8")
        assert "MAX_ENTRIES = 5" in c

    def test_dedup_by_origin_destination(self):
        """Re-buscar Madrid→Roma actualiza ts pero no añade entry duplicada."""
        c = self.LIB.read_text(encoding="utf-8")
        # Filtra antes de unshift — ese es el patrón dedup
        assert ".filter(" in c and "unshift" in c

    def test_ttl_30_days(self):
        c = self.LIB.read_text(encoding="utf-8")
        assert "TTL_DAYS = 30" in c

    def test_exports_three_functions(self):
        """API pública: getRecentSearches, pushSearch, clearSearchHistory."""
        c = self.LIB.read_text(encoding="utf-8")
        for fn in ("getRecentSearches", "pushSearch", "clearSearchHistory"):
            assert f"export function {fn}" in c

    def test_normalizes_iata_uppercase(self):
        """Origin/destination se almacenan UPPERCASE para dedup correcto."""
        c = self.LIB.read_text(encoding="utf-8")
        assert ".toUpperCase()" in c


# =============================================================================
# S4 — Bali off-peak EN blog post
# =============================================================================

class TestBaliBlogPost:
    POST = WEB / "src/content/blog/bali-off-peak-cheap-flights-november-2026.mdx"

    def test_exists(self):
        assert self.POST.exists()

    def test_frontmatter_complete(self):
        c = self.POST.read_text(encoding="utf-8")
        for k in ("title:", "description:", "slug:", "publishedAt:", "tags:"):
            assert k in c[:600]

    def test_keywords_off_peak(self):
        c = self.POST.read_text(encoding="utf-8")
        for kw in ("Bali", "DPS", "November", "Qatar", "Singapore", "monsoon", "off-peak"):
            assert kw in c

    def test_table_data_driven(self):
        c = self.POST.read_text(encoding="utf-8")
        assert "| Month |" in c
        # The November row uses **November** (bold) for emphasis
        assert "November" in c and "| **November**" in c

    def test_internal_links(self):
        c = self.POST.read_text(encoding="utf-8")
        assert "t.me/tripcazador_bot" in c
        # Internal blog cross-links
        assert "/blog/" in c or "/en/blog/" in c

    def test_word_count_substantial(self):
        c = self.POST.read_text(encoding="utf-8")
        body = c.split("---", 2)[-1]
        assert len(body.split()) >= 1000

    def test_unique_slug(self):
        slugs = []
        for p in (WEB / "src/content/blog").glob("*.mdx"):
            content = p.read_text(encoding="utf-8")
            m = re.search(r'^slug:\s*"([^"]+)"', content, re.MULTILINE)
            if m:
                slugs.append(m.group(1))
        assert len(slugs) == len(set(slugs))


# =============================================================================
# Integration: phase-s deliverables together
# =============================================================================

class TestPhaseSIntegration:
    def test_blog_count_grew(self):
        posts = list((WEB / "src/content/blog").glob("*.mdx"))
        assert len(posts) >= 16, f"After fase-s expected ≥16 blog posts, found {len(posts)}"

    def test_admin_button_does_not_break_existing_widget(self):
        """HunterHealthWidget regression — sigue presente en admin."""
        c = (WEB / "src/app/admin/page.tsx").read_text(encoding="utf-8")
        assert "HunterHealthWidget" in c

    def test_no_fetch_without_consent_in_search_history(self):
        """Search history no debe llamar al endpoint sin consent."""
        c = (WEB / "src/lib/searchHistory.ts").read_text(encoding="utf-8")
        # No fetch directly — solo localStorage
        assert "fetch(" not in c
