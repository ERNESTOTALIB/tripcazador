#!/usr/bin/env python3
"""
ig_token_never_expire.py — fase SSS76 (May 2026)

Genera un IG_ACCESS_TOKEN que **NUNCA caduca** siguiendo el flujo
oficial de Meta:

  1) USER short-lived token  (1-2h, copiado de Graph Explorer)
  2) → exchange con app_secret → USER long-lived token (60 días)
  3) → GET /me/accounts → PAGE token  ← **NO EXPIRA** (permanente
     mientras la página exista y no revoques permisos)

Referencia:
  https://developers.facebook.com/docs/pages/access-tokens
  https://developers.facebook.com/docs/facebook-login/guides/access-tokens

Uso:
  export FB_APP_ID=1565584111219019
  export FB_APP_SECRET=...                 (Settings → Basic → App Secret)
  export FB_USER_SHORT_TOKEN=EAAW...       (Graph Explorer → Get User Access Token)
  python scripts/ig_token_never_expire.py
  → imprime el PAGE token never-expire para pegar en GH Secret IG_ACCESS_TOKEN

También:
  python scripts/ig_token_never_expire.py --debug   (debugea cada paso)
  python scripts/ig_token_never_expire.py --update-gh-secret
                                           (auto-update via gh CLI si está)

Nota: el USER short token tarda 5 min copiarlo manualmente de
Graph Explorer una vez, pero el PAGE token resultante NO caduca,
así que sólo lo necesitas para reset si Ernesto cambia password de FB
o revoca el app permission.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional


GRAPH = "https://graph.facebook.com/v18.0"


def get_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "TripCazador/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def step1_exchange_short_to_long(app_id: str, app_secret: str, short_token: str, debug: bool) -> str:
    """Cambia USER short-lived (~1h) por USER long-lived (~60d)."""
    qs = urllib.parse.urlencode({
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token,
    })
    url = f"{GRAPH}/oauth/access_token?{qs}"
    data = get_json(url)
    long_token = data.get("access_token")
    if not long_token:
        raise SystemExit(f"❌ Step 1 failed: {json.dumps(data, indent=2)}")
    if debug:
        print(f"✓ Step 1: USER long-lived token obtained ({len(long_token)} chars, expires_in={data.get('expires_in', 'permanent')}s)")
    return long_token


def step2_get_user_id(long_user_token: str, debug: bool) -> str:
    """Verifica que el long-lived USER token funciona y devuelve el user id."""
    url = f"{GRAPH}/me?access_token={urllib.parse.quote(long_user_token)}"
    data = get_json(url)
    uid = data.get("id")
    if not uid:
        raise SystemExit(f"❌ Step 2 failed: {json.dumps(data, indent=2)}")
    if debug:
        print(f"✓ Step 2: USER long-lived token valid (user_id={uid}, name={data.get('name')})")
    return uid


def step3_get_page_token(long_user_token: str, debug: bool) -> Dict[str, Any]:
    """
    Obtiene el PAGE token NEVER-EXPIRE para todas las páginas del usuario.
    Devuelve dict con {page_id, page_name, page_token, instagram_business_id}.

    Si hay múltiples páginas, devuelve la primera con instagram_business_account.
    """
    qs = urllib.parse.urlencode({
        "fields": "id,name,access_token,instagram_business_account",
        "access_token": long_user_token,
    })
    url = f"{GRAPH}/me/accounts?{qs}"
    data = get_json(url)
    pages = data.get("data", [])
    if not pages:
        raise SystemExit(f"❌ Step 3 failed: no pages found. {json.dumps(data, indent=2)}")
    if debug:
        for p in pages:
            ig = p.get("instagram_business_account") or {}
            print(f"  page: {p.get('name')} (id={p.get('id')}) ig_id={ig.get('id', '—')}")
    # Prefer page with IG account linked
    for p in pages:
        ig = p.get("instagram_business_account") or {}
        if ig.get("id"):
            return {
                "page_id": p["id"],
                "page_name": p["name"],
                "page_token": p["access_token"],
                "instagram_business_id": ig["id"],
            }
    # Fallback first page
    p = pages[0]
    return {
        "page_id": p["id"],
        "page_name": p["name"],
        "page_token": p["access_token"],
        "instagram_business_id": (p.get("instagram_business_account") or {}).get("id"),
    }


def step4_verify_never_expire(page_token: str, debug: bool) -> None:
    """
    Llama a /debug_token para confirmar que el PAGE token tiene expiración 0
    (= permanente).
    """
    qs = urllib.parse.urlencode({
        "input_token": page_token,
        "access_token": page_token,
    })
    url = f"{GRAPH}/debug_token?{qs}"
    data = get_json(url)
    info = data.get("data", {})
    expires_at = info.get("expires_at", -1)
    is_valid = info.get("is_valid", False)
    type_ = info.get("type")
    if debug:
        print(f"✓ Step 4: token type={type_} valid={is_valid} expires_at={expires_at}")
    if expires_at == 0:
        print("✅ PAGE token NEVER expires (expires_at=0)")
    elif expires_at > 0:
        from datetime import datetime
        exp = datetime.utcfromtimestamp(expires_at).strftime("%Y-%m-%d %H:%M UTC")
        print(f"⚠️  PAGE token has expiration: {exp} ({expires_at})")
        print("    → Probable causa: USER token era short-lived. Reintenta.")


def update_gh_secret(token: str, repo: str = "ERNESTOTALIB/tripcazador") -> None:
    """Update GH Secret IG_ACCESS_TOKEN via `gh` CLI (requires auth)."""
    try:
        result = subprocess.run(
            ["gh", "secret", "set", "IG_ACCESS_TOKEN", "--repo", repo, "--body", token],
            capture_output=True, text=True, check=True,
        )
        print(f"✅ GH Secret IG_ACCESS_TOKEN updated in {repo}")
        if result.stdout:
            print(result.stdout)
    except FileNotFoundError:
        print("❌ `gh` CLI not installed. Pega el token manualmente en:")
        print(f"   https://github.com/{repo}/settings/secrets/actions")
    except subprocess.CalledProcessError as e:
        print(f"❌ gh secret set failed: {e.stderr}")
        print(f"   Pega manualmente en: https://github.com/{repo}/settings/secrets/actions")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--debug", action="store_true")
    p.add_argument(
        "--update-gh-secret",
        action="store_true",
        help="Auto-update GH Secret IG_ACCESS_TOKEN via gh CLI",
    )
    p.add_argument("--repo", default="ERNESTOTALIB/tripcazador")
    args = p.parse_args()

    app_id = os.environ.get("FB_APP_ID", "").strip()
    app_secret = os.environ.get("FB_APP_SECRET", "").strip()
    short_token = os.environ.get("FB_USER_SHORT_TOKEN", "").strip()

    missing = []
    if not app_id: missing.append("FB_APP_ID")
    if not app_secret: missing.append("FB_APP_SECRET")
    if not short_token: missing.append("FB_USER_SHORT_TOKEN")
    if missing:
        print(f"❌ Missing env vars: {', '.join(missing)}")
        print()
        print("Obtén:")
        print("  FB_APP_ID         → developers.facebook.com/apps → tu app → ID")
        print("  FB_APP_SECRET     → developers.facebook.com/apps → Settings → Basic → App Secret (Show)")
        print("  FB_USER_SHORT_TOKEN → developers.facebook.com/tools/explorer →")
        print("    User or Page = User Token (top dropdown)")
        print("    Permissions: pages_show_list, pages_read_engagement, instagram_basic,")
        print("                 instagram_content_publish, instagram_manage_insights")
        print("    Click \"Generate Access Token\" → copia el token largo")
        return 2

    print("🔄 Step 1/4: Exchange USER short → USER long-lived (60d)...")
    long_token = step1_exchange_short_to_long(app_id, app_secret, short_token, args.debug)

    print("🔄 Step 2/4: Verify USER long-lived token...")
    user_id = step2_get_user_id(long_token, args.debug)

    print("🔄 Step 3/4: Get PAGE token (never-expire)...")
    page = step3_get_page_token(long_token, args.debug)
    print(f"  Page: {page['page_name']} (id={page['page_id']})")
    if page.get("instagram_business_id"):
        print(f"  IG Business ID: {page['instagram_business_id']}  ← úsalo como IG_USER_ID")

    print("🔄 Step 4/4: Verify expiration (debug_token)...")
    step4_verify_never_expire(page["page_token"], args.debug)

    print()
    print("════════════════════════════════════════════════════════════════")
    print("PAGE TOKEN (never-expire) — copia entero:")
    print()
    print(page["page_token"])
    print()
    print("════════════════════════════════════════════════════════════════")

    if args.update_gh_secret:
        print()
        print("🔄 Updating GH Secret IG_ACCESS_TOKEN...")
        update_gh_secret(page["page_token"], args.repo)
    else:
        print(f"📋 Pega en: https://github.com/{args.repo}/settings/secrets/actions")
        print(f"   → IG_ACCESS_TOKEN (overwrite)")
        print(f"   → IG_USER_ID = {page.get('instagram_business_id', '<verificar>')}")
        print()
        print("   O re-ejecuta con --update-gh-secret si tienes gh CLI auth.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
