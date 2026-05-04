#!/usr/bin/env python3
"""
validate_blog_hero_images.py — fase SSS56g (May 2026)

Comprueba que TODOS los heroImage URLs en src/content/blog/*.mdx devuelven
HTTP 200. Si alguna devuelve 404 (foto Unsplash borrada / typo del ID),
falla el script con exit 1.

Causa root: SSS54 metí photoIds Unsplash a ojo en posts MDX y uno (sakura
1546484958-c7b1ad9d9f87) era inválido → blog renderizaba "?" placeholder.

Uso:
  python3 scripts/validate_blog_hero_images.py
  python3 scripts/validate_blog_hero_images.py --timeout 15

CI: añadir a daily-regression.yml después de pytest.
"""
from __future__ import annotations
import argparse
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "tripcazador-web" / "src" / "content" / "blog"

HERO_RX = re.compile(r'^heroImage:\s*"([^"]+)"', re.MULTILINE)


def head(url: str, timeout: float) -> tuple[int, str]:
    """Return (status_code, error_message)."""
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": "TripCazador-validator/1.0"})
        with urlopen(req, timeout=timeout) as resp:
            return resp.status, ""
    except HTTPError as e:
        return e.code, str(e)
    except URLError as e:
        return 0, f"URLError: {e.reason}"
    except Exception as e:  # noqa: BLE001
        return 0, f"{type(e).__name__}: {e}"


def find_posts() -> list[Path]:
    """Find all .mdx blog posts."""
    return sorted(BLOG_DIR.glob("*.mdx"))


def extract_hero(post: Path) -> Optional[str]:
    """Extract heroImage URL from frontmatter (returns None if absent)."""
    text = post.read_text(encoding="utf-8")
    m = HERO_RX.search(text)
    return m.group(1) if m else None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    posts = find_posts()
    if not posts:
        print(f"⚠️  No posts found in {BLOG_DIR}", file=sys.stderr)
        return 0

    print(f"Validating heroImage URLs across {len(posts)} blog posts...\n")

    work: list[tuple[str, str]] = []  # (slug, url)
    no_hero: list[str] = []

    for p in posts:
        url = extract_hero(p)
        if not url:
            no_hero.append(p.stem)
            continue
        if not url.startswith("http"):
            # Local /assets path — assume OK for now
            continue
        work.append((p.stem, url))

    if no_hero:
        print(f"📭 Posts without heroImage ({len(no_hero)}):")
        for s in no_hero:
            print(f"   · {s}")
        print()

    failures: list[tuple[str, str, int, str]] = []
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        future_to = {ex.submit(head, url, args.timeout): (slug, url) for slug, url in work}
        for fut in as_completed(future_to):
            slug, url = future_to[fut]
            status, err = fut.result()
            if status != 200:
                failures.append((slug, url, status, err))
                print(f"❌ {status}  {slug}\n      {url}\n      {err}")
            else:
                print(f"✅ {status}  {slug}")

    print()
    if failures:
        print(f"FAIL — {len(failures)}/{len(work)} hero images broken:")
        for slug, url, status, err in failures:
            print(f"   · {slug} → HTTP {status}")
            print(f"     URL: {url}")
        return 1

    print(f"OK — {len(work)}/{len(work)} hero images return 200")
    return 0


if __name__ == "__main__":
    sys.exit(main())
