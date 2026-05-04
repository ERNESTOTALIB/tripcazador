#!/usr/bin/env python3
"""
Instagram auto-publisher cron → fase ww XX3.

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

Uso en GH Actions:
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
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # Log the response body so we can see Meta's actual error
        try:
            err_body = e.read().decode("utf-8")
        except Exception:
            err_body = "<no body>"
        log(f"HTTP {e.code} body: {err_body[:500]}")
        raise


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
    """SSS59: hashtags ricos — base + destino-específico + región + tipo deal.
    Target ~25-30 hashtags para max alcance IG sin parecer spam."""
    base = (
        "#tripcazador #vuelosbaratos #errorfares #chollos #viajes "
        "#cazachollos #travelhacks #vacacionesbaratas #escapadas #ofertasvuelos"
    )
    dest = (deal.get("destination") or "").upper()
    dest_specific = {
        "MAD": "#madrid #vuelosamadrid #viajeresmadrid",
        "BCN": "#barcelona #bcn #sagradafamilia",
        "LIS": "#lisboa #portugal #fado #pasteldenata",
        "PMI": "#mallorca #palmademallorca #baleares",
        "AGP": "#malaga #costadelsol",
        "VLC": "#valencia #ciudaddelasartes",
        "DPS": "#bali #ubud #balitemple",
        "BKK": "#bangkok #tailandia #streetfood",
        "NRT": "#tokio #japon #sakura",
        "ICN": "#seul #corea #kpop",
        "JFK": "#nyc #nuevayork #bigapple",
        "LAX": "#losangeles #california #hollywood",
        "MIA": "#miami #southbeach",
        "CUN": "#cancun #mexico #caribe #playadelcarmen #tulum",
        "EZE": "#buenosaires #argentina #tango",
        "GIG": "#rio #brasil #copacabana",
        "FCO": "#roma #italia #coliseo",
        "CDG": "#paris #francia #torreeiffel",
        "LHR": "#londres #london #bigben",
        "AMS": "#amsterdam #holanda #canales",
        "PRG": "#praga #chequia",
        "IST": "#estambul #turquia #bosforo",
        "RAK": "#marrakech #marruecos #medina",
        "CAI": "#cairo #egipto #piramides",
    }.get(dest, "")
    region = (deal.get("region") or "").lower()
    region_tags = {
        "europa": "#europa #vueloseuropa",
        "asia": "#asia #vuelosasia",
        "caribe": "#caribe #vueloscarib",
        "américa norte": "#usa #norteamerica",
        "america norte": "#usa #norteamerica",
        "américa sur": "#sudamerica #latam",
        "america sur": "#sudamerica #latam",
        "oriente medio": "#orientemedio",
        "áfrica": "#africa",
        "africa": "#africa",
        "oceanía": "#australia #oceania",
        "oceania": "#australia #oceania",
    }.get(region, "")
    classification = (deal.get("classification") or "").upper()
    class_tags = {
        "ERROR": "#errorfare #fallodelsistema #vuelobarato24h",
        "CRÍTICO": "#oferta24h #vueloimposible #ultimasplazas",
        "OFERTA": "#ofertaviaje",
        "ANOMALÍA": "#chollovuelo",
    }.get(classification, "")
    cabin_tags = "#businessclass #premiumeconomy" if deal.get("cabin") == "business" else ""
    return " ".join(filter(None, [base, dest_specific, region_tags, class_tags, cabin_tags]))


def caption_for(deal: Dict[str, Any]) -> str:
    """SSS59: caption rica con hooks para carousel + más urgencia + CTA."""
    route_from = deal.get("city_from") or deal.get("origin") or "?"
    route_to = deal.get("city_to") or deal.get("destination") or "?"
    price = int(deal.get("price_eur", 0))
    savings_pct = int(deal.get("savings_pct", 0))
    savings_eur = int(deal.get("savings_eur", 0))
    cabin = (deal.get("cabin") or "economy").replace("_", " ")
    nights = deal.get("nights", "?")
    airline = deal.get("airline_name") or deal.get("airline") or "varias"
    classification = (deal.get("classification") or "OFERTA").upper()

    badge = {
        "ERROR": "🚨 ERROR FARE — 24-48H",
        "CRÍTICO": "🔥 CHOLLO CRÍTICO 24H",
        "OFERTA": "✨ OFERTA DEL DÍA",
        "ANOMALÍA": "🎯 ANOMALÍA DETECTADA",
    }.get(classification, "✨ OFERTA DEL DÍA")

    is_carousel = os.environ.get("IG_CAROUSEL_MODE") == "1"
    swipe_hook = "→ Desliza para ver QUÉ VER, QUÉ COMER y los TIPS 📍" if is_carousel else ""

    parts = [
        f"{badge}",
        f"📍 {route_from} → {route_to}",
        "",
        f"💰 {price}€ ({cabin} · {nights} noches)",
        f"📉 -{savings_pct}% del precio normal (ahorras {savings_eur}€)",
        f"✈️ {airline}",
        "",
        swipe_hook,
        f"⚡ Los precios cambian en horas. Reserva ya en {SITE_URL}",
        "🔗 Link en bio",
        "",
        "🧭 Cazado por TripCazador — motor anti-error fare 24/7",
        "",
        hashtags_for(deal),
    ]
    body = "\n".join(p for p in parts if p)
    return body[:2200]


def publish_to_instagram(image_url: str, caption: str) -> Optional[str]:
    """Publica imagen en Instagram via Graph API.
    Returns post id en caso de éxito, None si falla."""
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


def publish_carousel_to_instagram(image_urls: list, caption: str) -> Optional[str]:
    """SSS57: Publica carrusel multi-slide en Instagram.

    Flow Graph API carousel:
      1) Crear N media containers con is_carousel_item=true
      2) Crear parent container con media_type=CAROUSEL + children=[ids]
      3) Publicar parent
    Limit IG: 2-10 slides.
    """
    if not IG_USER_ID or not IG_ACCESS_TOKEN:
        log("WARN: IG creds missing - skip carousel publish")
        return None
    if len(image_urls) < 2 or len(image_urls) > 10:
        log(f"WARN: carousel needs 2-10 slides, got {len(image_urls)}")
        return None

    child_ids = []
    for idx, url in enumerate(image_urls):
        try:
            result = http_post(
                f"https://graph.facebook.com/v18.0/{IG_USER_ID}/media",
                {
                    "image_url": url,
                    "is_carousel_item": "true",
                    "access_token": IG_ACCESS_TOKEN,
                },
            )
        except Exception as e:
            log(f"ERROR child container [{idx}]: {e}")
            return None
        cid = result.get("id")
        if not cid:
            log(f"ERROR no id child [{idx}]: {result}")
            return None
        child_ids.append(cid)
        log(f"  child {idx+1}/{len(image_urls)}: {cid}")

    try:
        parent = http_post(
            f"https://graph.facebook.com/v18.0/{IG_USER_ID}/media",
            {
                "media_type": "CAROUSEL",
                "children": ",".join(child_ids),
                "caption": caption,
                "access_token": IG_ACCESS_TOKEN,
            },
        )
    except Exception as e:
        log(f"ERROR parent container: {e}")
        return None
    parent_id = parent.get("id")
    if not parent_id:
        log(f"ERROR no parent id: {parent}")
        return None

    time.sleep(12)
    try:
        pub = http_post(
            f"https://graph.facebook.com/v18.0/{IG_USER_ID}/media_publish",
            {"creation_id": parent_id, "access_token": IG_ACCESS_TOKEN},
        )
    except Exception as e:
        log(f"ERROR publishing carousel: {e}")
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

    # SSS40: usar el endpoint premium nuevo si IG_OG_VERSION=v2 (default v2 = nuevo)
    # Fallback a /api/og/instagram (legacy 1080×1350) si v1.
    og_version = os.environ.get("IG_OG_VERSION", "v2")
    if og_version == "v2":
        image_url = f"{SITE_URL}/api/og/social/post?dealId={urllib.parse.quote(deal.get('id', ''))}"
    else:
        image_url = f"{SITE_URL}/api/og/instagram?dealId={urllib.parse.quote(deal.get('id', ''))}"
    log(f"Image URL ({og_version}): {image_url}")

    # Caption + hashtags
    caption = caption_for(deal)
    log(f"Caption preview: {caption[:140]}...")

    # SSS57: si IG_CAROUSEL_MODE=1, publicar 5 slides:
    #   1) deal principal (post-v2)
    #   2) lugares que ver  (carousel?slide=places)
    #   3) que comer        (carousel?slide=food)
    #   4) tips locales     (carousel?slide=tips)
    #   5) blog completo    (carousel?slide=blog)
    if os.environ.get("IG_CAROUSEL_MODE") == "1":
        deal_qid = urllib.parse.quote(deal.get("id", ""))
        slide1 = f"{SITE_URL}/api/og/social/post-v2?dealId={deal_qid}"
        slide2 = f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=places"
        slide3 = f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=food"
        slide4 = f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=tips"
        slide5 = f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=blog"
        slides = [slide1, slide2, slide3, slide4, slide5]
        log(f"CAROUSEL MODE: {len(slides)} slides")
        post_id = publish_carousel_to_instagram(slides, caption)
    else:
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

