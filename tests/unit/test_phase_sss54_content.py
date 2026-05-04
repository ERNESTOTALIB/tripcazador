"""
Tests para fase SSS54 — Content expansion (May 2026):
  - +5 comparativas (84 total)
  - +3 blog posts ES (88 total)
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "tripcazador-web"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# ════════════════════════════════════════════════
# Comparativas SSS54
# ════════════════════════════════════════════════

class TestSSS54Comparativas:
    LIB = WEB / "src/lib/comparisons.ts"

    def test_lib_exists(self):
        assert self.LIB.exists()

    def test_count_84_or_more(self):
        c = _read(self.LIB)
        # Cuento slugs como proxy del total
        slugs = re.findall(r'slug:\s*"([^"]+)"', c)
        assert len(slugs) >= 84, f"Esperaba ≥84 comparativas, hay {len(slugs)}"

    def test_new_5_comparativas_present(self):
        c = _read(self.LIB)
        for slug in (
            "skyscanner-vs-kayak-2026",
            "ryanair-vs-easyjet-equipaje",
            "japon-primavera-vs-otono-2026",
            "telegram-canal-vs-newsletter-vuelos",
            "aerolineas-asiaticas-vs-europeas-larga-distancia",
        ):
            assert f'"{slug}"' in c, f"Falta slug {slug}"

    def test_new_comparativas_have_verdict(self):
        c = _read(self.LIB)
        # Para cada slug, busco el bloque y verifico verdict no vacío y largo
        slugs = [
            "skyscanner-vs-kayak-2026",
            "ryanair-vs-easyjet-equipaje",
            "japon-primavera-vs-otono-2026",
            "telegram-canal-vs-newsletter-vuelos",
            "aerolineas-asiaticas-vs-europeas-larga-distancia",
        ]
        for slug in slugs:
            idx = c.find(f'"{slug}"')
            assert idx >= 0
            block = c[idx:idx + 8000]
            m = re.search(r'verdict:\s*"([^"]+)"', block)
            assert m is not None, f"{slug}: verdict no encontrado"
            assert len(m.group(1)) >= 200, f"{slug}: verdict solo {len(m.group(1))} chars"

    def test_new_comparativas_have_picka_pickb(self):
        c = _read(self.LIB)
        # Sanity check: cada nueva debe tener pickA y pickB con ≥3 items
        for slug in (
            "skyscanner-vs-kayak-2026",
            "ryanair-vs-easyjet-equipaje",
            "japon-primavera-vs-otono-2026",
            "telegram-canal-vs-newsletter-vuelos",
            "aerolineas-asiaticas-vs-europeas-larga-distancia",
        ):
            # busca el bloque de la comparativa (hasta el siguiente `};` o `},`)
            idx = c.find(f'"{slug}"')
            assert idx >= 0
            block = c[idx:idx + 5000]
            assert "pickA:" in block
            assert "pickB:" in block


# ════════════════════════════════════════════════
# Blog posts SSS54
# ════════════════════════════════════════════════

class TestSSS54BlogPosts:
    BLOG_DIR = WEB / "src/content/blog"

    NEW_POSTS = [
        "sakura-vs-koyo-japon-cuando-2026.mdx",
        "skyscanner-vs-kayak-cual-usar-2026.mdx",
        "equipaje-cabina-permitido-aerolineas-2026.mdx",
    ]

    def test_blog_dir_exists(self):
        assert self.BLOG_DIR.exists()

    def test_count_88_or_more(self):
        files = list(self.BLOG_DIR.glob("*.mdx"))
        assert len(files) >= 88, f"Esperaba ≥88 blog posts, hay {len(files)}"

    def test_3_new_posts_present(self):
        for fname in self.NEW_POSTS:
            assert (self.BLOG_DIR / fname).exists(), f"Falta blog post {fname}"

    def test_new_posts_have_frontmatter(self):
        for fname in self.NEW_POSTS:
            content = _read(self.BLOG_DIR / fname)
            assert content.startswith("---\n")
            assert 'title: "' in content
            assert 'description: "' in content
            assert 'slug: "' in content
            assert 'publishedAt: "2026-05-04"' in content
            assert 'lang: "es"' in content
            assert "tags:" in content

    def test_new_posts_have_min_content(self):
        for fname in self.NEW_POSTS:
            content = _read(self.BLOG_DIR / fname)
            # Quitamos frontmatter
            after_fm = content.split("---\n", 2)[-1]
            words = len(after_fm.split())
            assert words >= 700, f"{fname} solo tiene {words} palabras (target ≥700)"

    def test_new_posts_have_internal_links(self):
        for fname in self.NEW_POSTS:
            content = _read(self.BLOG_DIR / fname)
            # Internal links — al menos 1 link a path interno (/buscar, /deals, /comparar, etc.)
            assert re.search(r"\]\(/[a-z]+", content), f"{fname} sin links internos"

    def test_japon_post_mentions_sakura_and_koyo(self):
        content = _read(self.BLOG_DIR / "sakura-vs-koyo-japon-cuando-2026.mdx")
        assert "sakura" in content.lower()
        assert "koyo" in content.lower()

    def test_skyscanner_post_mentions_both_engines(self):
        content = _read(self.BLOG_DIR / "skyscanner-vs-kayak-cual-usar-2026.mdx")
        assert "Skyscanner" in content
        assert "Kayak" in content

    def test_equipaje_post_covers_main_airlines(self):
        content = _read(self.BLOG_DIR / "equipaje-cabina-permitido-aerolineas-2026.mdx")
        # Sanity: cubre al menos las 3 grandes low-cost ES
        for airline in ("Ryanair", "easyJet", "Vueling", "Iberia"):
            assert airline in content, f"Falta {airline} en post equipaje"
