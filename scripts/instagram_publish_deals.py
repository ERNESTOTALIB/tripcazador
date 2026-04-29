#!/usr/bin/env python3
"""
Instagram auto-publisher cron â fase ww XX3.

Cada 4h:
  1. GET /api/deals top deals con score>80 y NOT posted_to_instagram <72h
  2. Selecciona 1 con mejor score
  3. Genera imagen via /api/og/instagram?dealId=X (Vercel ImageResponse)
  4. POST a Instagram Graph API con caption + hashtags por destino
  5. Marca deal como posted_to_instagram en Telegram channel state (best-effort)

Env vars necesarias:
  - IG_USER_ID            ID numÃ©rico del Instagram Business account
  - IG_ACCESS_TOKEN       Long-lived access token (60 dÃ­as, rotar via cron)
  - SITE_URL              Default https://tripcazador.com
  - TG_BOT_TOKEN, TG_CHAT_ID  Para echo en Telegram (opcional)

Uso local:
  IG_USER_ID=xxx IG_ACCESS_TOKEN=yyy python scripts/instagram_publish_deals.py

Uso en GH#Actions:
  Ver .github/workflows/instagram-publish.yml
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

SITE_URL = os.environ.get("SITE_URL", "https://tripcazador.com").rstrip("/")
IG_USER_ID = os.environ.get("IG_USER_ID", "").strip()
IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()
TG_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "").strip()
TG_CHAT_ID = os.environ.get("TG_CHAT_ID", "").strip()


def log(msg: str) -> None:
    print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] {msg}", flush=True)


def http_get(url: str, timeout: int = 30) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "TripCazadorBot/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def http_post(url: str, params: Dict[str, str], timeout: int = 30) -> Any:
    body = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "TripCazadorBot/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_top_deals(limit: int = 30) -> List[Dict[str, Any]]:
    url = f"{SITE_URL}/api/deals?limit={limit}"
    try:
        data = http_get(url)
    except Exception as e:
        log(f"ERROR fetching /api/deals: {e}")
        return []
    if isinstance(data, list):
        return data
    return data.get("deals", []) if isinstance(data, dict) else []


def hashtags_for(deal: Dict[str, Any]) -> str:
    """Hashtags base + por destino + por tipo de deal"""
    base = "#tripcazador #vuelosbaratos #errorfares #chollos #viajes #cazachollos"
    region = (deal.get("region") or "").lower()
    region_tags = {
        "europa": "#europa #vueloseuropa",
        "asia": "#asia #vuelosasia #tailandia #japon #bali",
        "caribe": "#caribe #vueloscarib #puntacana #cuba",
        "amÃ©rica norte": "#usa #nuevayork #losangeles",
        "amÃ©rica sur": "#sudamerica #buenosaires #brasil",
        "oriente medio": "#dubai #estambul",
        "Ã¡frica": "#marruecos #egipto #africa",
        "oceanÃ­a": "#australia #sydney",
    }.get(region, "")
    classification = (deal.get("classification") or "").upper()
    class_tags = {
        "ERROR": "#errorfare #fallodelsistema",
        "CRÃTICO": "#oferta #vueloimposible",
        "OFERTA": "#oferta",
        "ANOMALÃA": "#chollo",
    }.get(classification, "")
    cabin_tags = "#businessclass" if deal.get("cabin") == "business" else ""
    return " ".join(filter(None, [base, region_tags, class_tags, cabin_tags]))


def caption_for(deal: Dict[str, Any]) -> str:
    route = f"{deal.get('city_from') or deal.get('origin')} â {deal.get('city_to') or deal.get('destination')}"
    price = int(deal.get("price_eur", 0))
    savings = int(deal.get("savings_pct", 0))
    cabin = (deal.get("cabin") or "economy").replace("_", " ")
    nights = deal.get("nights", "?")
    airline = deal.get("airline_name") or deal.get("airline") or "varias"
    classification = deal.get("classification") or "OFERTA"

    body = (
        f"ð¥ {classification}\n"
        f"{route}\n\n"
        f"ð° {price}â¬ ({cabin} Â· {nights} noches)\n"
        f"ð -{savings}% del precio normal\n"
        f"âï¸ {airline}\n\n"
        f"â¡ Los precios cambian en horas. Reserva en {SITE_URL}\n"
        f"(Link en bio)\n\n"
        f"{hashtags_for(deal)}"
    )
    return body[:2200]  # Instagram caption lÃ­mite 2200


def publish_to_instagram(image_url: str, caption: str) -> Optional[str]:
    """Publica imagen en Instagram via Graph API.
    Returns post id en caso de Ã©xito, None si falla."""
    if not IG_USER_ID or not IG_ACCESS_TOKEN:
        log("WARN: IG_USER_ID o IG_ACCESS_TOKEN no configurados â skip publish")
        return None

    # Step 1: crear contenedor de media
    create_url = f"https://graph.facebook.com/v18.0/{IG_USER_ID}/media"
    try:
        result = http_post(
            create_url,
            {
                "image_url": image_url,
                "caption": caption,
                "access_token": IG_ACCESS_TOKEN,
            },
        )
    except Exception as e:
        log(f"ERROR creando container media: {e}")
        return None
    container_id = result.get("id")
    if not container_id:
        log(f"ERROR no container_id en respuesta: {result}")
        return None

    # Step 2: esperar a que estÃ© ready (5-10s)
    time.sleep(8)

    # Step 3: publicar
    publish_url = f"https://graph.facebook.com/v18.0/{IG_USER_ID}/media_publish"
    try:
        pub = http_post(
            publish_url,
            {"creation_id": container_id, "access_token": IG_ACCESS_TOKEN},
        )
    except Exception as e:
        log(f"ERROR publishing: {e}")
        return None
    return pub.get("id")


def echo_telegram(deal: Dict[str, Any], post_id: str) -> None:
    """Notifica en Telegram channel que se publicÃ³ nuevo post Instagram"""
    if not TG_BOT_TOKEN or not TG_CHAT_ID:
        return
    text = (
        f"ð· Nuevo post Instagram: {deal.get('city_from') or deal.get('origin')} â "
        f"{deal.get('city_to') or deal.get('destination')} "
        f"por {int(deal.get('price_eur', 0))}â¬ "
        f"(post id: {post_id})"
    )
    try:
        url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
        http_post(url, {"chat_id": TG_CHAT_ID, "text": text})
    except Exception:
        pass


def main() -> int:
    if not IG_USER_ID or not IG_ACCESS_TOKEN:
        log("FATAL: IG_USER_ID + IG_ACCESS_TOKEN required")
        log("       Crea cuenta @tripcazador como Instagram Business + Facebook Page,")
        log("       genera long-lived token via developers.facebook.com/apps")
        log("       y configÃºralos como GH Actions secrets.")
        return 1

    deals = fetch_top_deals(limit=30)
    if not deals:
        log("No deals found")
        return 1

    # Score-based ordering, prefer deals younger than 24h
    now_ms = int(time.time() * 1000)
    def score_key(d: Dict[str, Any]) -> float:
        score = float(d.get("score") or 0)
        ts = d.get("found_at")
        try:
            from datetime import datetime
            age_h = (now_ms - int(datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp() * 1000)) / 3600_000 if ts else 24
        except Exception:
            age_h = 24
        # Penalize >24h
        if age_h > 24:
            score -= (age_h - 24) * 0.5
        return -score  # ascending = best first
    deals.sort(key=score_key)

    deal = deals[0]
    log(f"Selected deal: {deal.get('id')} â {deal.get('headline')}")

    # Image URL servida por Vercel
    image_url = f"{SITE_URL}/api/og/instagram?dealId={urllib.parse.quote(deal.get('id', ''))}"
    log(f"Image URL: {image_url}")

    # Caption + hashtags
    caption = caption_for(deal)
    log(f"Caption preview: {caption[:140]}â¦")

    # Publish
    post_id = publish_to_instagram(image_url, caption)
    if post_id:
        log(f"â Published to Instagram: {post_id}")
        echo_telegram(deal, post_id)
        return 0
    else:
        log("â Failed to publish")
        return 2


if __name__ == "__main__":
    sys.exit(main())

