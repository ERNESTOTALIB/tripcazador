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
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

SITE_URL = os.environ.get("SITE_URL", "https://tripcazador.com").rstrip("/")
IG_USER_ID = os.environ.get("IG_USER_ID", "").strip()
IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()
TG_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "").strip()
TG_CHAT_ID = os.environ.get("TG_CHAT_ID", "").strip()
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY", "ERNESTOTALIB/tripcazador").strip()
GITHUB_REF = os.environ.get("GITHUB_REF_NAME", "main").strip() or "main"


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


def _slugify(s: str) -> str:
    """Convierte texto a slug seguro para git/path. Quita acentos + lower."""
    if not s:
        return "x"
    s = s.lower().strip()
    repl = {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n", "ü": "u"}
    for k, v in repl.items():
        s = s.replace(k, v)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "x"


def _fmt_short_date(d: str) -> str:
    """ISO date → 'DD MMM' (ej '2026-06-08' → '08 jun')."""
    if not d:
        return ""
    try:
        dt = datetime.fromisoformat(d[:10])
    except Exception:
        return d
    months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
    return f"{dt.day:02d} {months[dt.month - 1]}"


def _fmt_duration(min_total: Optional[int]) -> str:
    if not min_total or min_total <= 0:
        return ""
    h = min_total // 60
    m = min_total % 60
    return f"{h} h {m} m" if m else f"{h} h"


def _fmt_coord(lat: Optional[float], lon: Optional[float]) -> str:
    if lat is None or lon is None:
        return ""
    def to_deg_min(v: float, pos: str, neg: str) -> str:
        a = abs(v)
        d = int(a)
        mi = round((a - d) * 60)
        return f"{d}°{mi:02d}′ {pos if v >= 0 else neg}"
    return f"{to_deg_min(lat, 'N', 'S')} · {to_deg_min(lon, 'E', 'W')}"


def generate_and_upload_carousel(deal: Dict[str, Any]) -> Optional[List[str]]:
    """SSS75/76: Genera 5 PNGs Canva-style + commit a tripcazador-web/public/ig-assets/.

    SSS76: PNGs van bajo tripcazador-web/public/ig-assets/{slug}/ para que
    Vercel los sirva públicamente en https://tripcazador.com/ig-assets/{slug}/N.png
    (el repo es privado y raw.githubusercontent.com devuelve 404 a IG).
    Devuelve lista de 5 URLs públicas. Si algo falla devuelve None.
    """
    deal_id = str(deal.get("id") or "x")
    # SSS76j: usar city_to PRIMERO (nombre ciudad como "Barcelona") en vez
    # de destination (código IATA "BCN"). El catalog LANDMARKS está
    # indexado por slug de ciudad. Antes tomaba IATA, slugify daba "bcn"
    # que NO existe en catalog → caía en fallback_landmarks() con URL rota.
    dest_key = (deal.get("city_to") or deal.get("destination") or "").strip()
    if not dest_key:
        log("WARN: deal sin destination — no se puede generar carrusel")
        return None

    # Build slug for path: dealId-shortened (dealIds pueden tener / ó .)
    safe_id = re.sub(r"[^a-zA-Z0-9_-]+", "-", deal_id)[:48]
    out_dir = Path(f"/tmp/canva_{safe_id}")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Resolve coord (deal.lat/lon → DD°MM' format) — opcional
    coord = _fmt_coord(deal.get("lat"), deal.get("lon"))

    # Fallback photo URL — usar deal.image_url o landmark genérico
    # SSS76j: la antigua URL Wikimedia (Aerial_view_of_Barcelona_from_helicopter)
    # devuelve 404 → reemplazo por og-default que vive en nuestro propio repo
    # bajo tripcazador-web/public/og-default.png (siempre disponible).
    fallback_photo = (
        deal.get("image_url")
        or "https://tripcazador.com/og-default.png"
    )

    # Args para el generator
    args = [
        sys.executable,
        str(Path(__file__).parent / "canva_carousel_generator.py"),
        "--out-dir", str(out_dir),
        "--dest-key", _slugify(dest_key),
        "--route-from", str(deal.get("city_from") or deal.get("origin") or "Madrid"),
        "--route-to", str(deal.get("city_to") or dest_key or "Destino"),
        "--price", str(int(round(deal.get("price_eur") or 0))),
        "--old-price", str(int(round((deal.get("price_eur") or 0) + (deal.get("savings_eur") or 0)))),
        "--savings-pct", str(int(round(deal.get("savings_pct") or 0))),
        "--date-out", _fmt_short_date(deal.get("date_out") or ""),
        "--date-ret", _fmt_short_date(deal.get("date_ret") or ""),
        "--nights", str(int(deal.get("nights") or 0)),
        "--airline", str(deal.get("airline_name") or deal.get("airline") or ""),
        "--duration-str", _fmt_duration(deal.get("duration_min")),
        "--stops", str(int(deal.get("stops") or 0)),
        "--coord", coord,
        "--fallback-photo", fallback_photo,
    ]

    # Logo path relativo al cwd del runner (root del repo)
    logo_path = Path("tripcazador-web/public/logo-a1-primary.svg")
    if logo_path.exists():
        args.extend(["--logo-svg", str(logo_path)])

    log(f"Generating carousel via {args[1]} ...")
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=180)
    except subprocess.TimeoutExpired:
        log("ERROR: generator timeout > 180s")
        return None
    if result.returncode != 0:
        log(f"ERROR generator exit {result.returncode}")
        log(f"  stdout: {result.stdout[-500:]}")
        log(f"  stderr: {result.stderr[-500:]}")
        return None
    log(result.stdout[-500:])

    # Verificar 5 PNGs
    pngs = [out_dir / f"{i}.png" for i in range(1, 6)]
    for p in pngs:
        if not p.exists() or p.stat().st_size < 10000:
            log(f"ERROR: {p} missing or too small")
            return None

    # SSS76: PNGs van bajo tripcazador-web/public/ig-assets/ para que Vercel
    # los sirva en https://tripcazador.com/ig-assets/... (repo es PRIVADO,
    # raw.githubusercontent.com devuelve 404 sin auth, IG no puede leer).
    date_str = datetime.utcnow().strftime("%Y%m%d-%H%M")
    asset_slug = f"{date_str}-{safe_id}"
    asset_dir = Path(f"tripcazador-web/public/ig-assets/{asset_slug}")
    asset_dir.mkdir(parents=True, exist_ok=True)
    for i, p in enumerate(pngs, start=1):
        target = asset_dir / f"{i}.png"
        target.write_bytes(p.read_bytes())
        log(f"  → {target} ({target.stat().st_size:,} bytes)")

    # Git commit + push
    try:
        subprocess.run(["git", "config", "user.email", "ig-publisher@tripcazador.com"], check=True)
        subprocess.run(["git", "config", "user.name", "TripCazador IG Bot"], check=True)
        subprocess.run(["git", "add", str(asset_dir)], check=True)
        # Skip if no diff (re-run idempotency)
        diff_result = subprocess.run(
            ["git", "diff", "--staged", "--quiet"], capture_output=True
        )
        if diff_result.returncode == 0:
            log("INFO: no hay cambios staged (idempotente?)")
        else:
            subprocess.run(
                ["git", "commit", "-m", f"chore(ig): carousel {asset_slug} [skip ci]"],
                check=True,
            )
            for attempt in range(3):
                pull = subprocess.run(["git", "pull", "--rebase", "origin", GITHUB_REF])
                push = subprocess.run(["git", "push", "origin", f"HEAD:{GITHUB_REF}"])
                if push.returncode == 0:
                    log(f"✅ pushed {asset_slug} (attempt {attempt+1})")
                    break
                log(f"⚠️ push failed attempt {attempt+1}, retrying...")
                time.sleep(3)
            else:
                log("ERROR: push failed 3 attempts")
                return None
            # SSS76c: trigger vercel-deploy.yml explícitamente vía API porque
            # nuestro commit lleva [skip ci] (necesario para no re-triggear
            # este mismo workflow IG en bucle infinito), lo cual también
            # bloquea vercel-deploy.yml. Sin este dispatch los PNGs nunca
            # se sirven en tripcazador.com.
            gh_token = os.environ.get("GITHUB_TOKEN") or ""
            if gh_token and GITHUB_REPO:
                try:
                    req = urllib.request.Request(
                        f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/vercel-deploy.yml/dispatches",
                        method="POST",
                        headers={
                            "Authorization": f"Bearer {gh_token}",
                            "Accept": "application/vnd.github+json",
                            "X-GitHub-Api-Version": "2022-11-28",
                        },
                        data=json.dumps({"ref": GITHUB_REF}).encode("utf-8"),
                    )
                    with urllib.request.urlopen(req, timeout=15) as r:
                        if r.status in (204, 200):
                            log("✅ vercel-deploy.yml triggered via API")
                except Exception as e:
                    log(f"WARN dispatch vercel-deploy: {e}")
    except subprocess.CalledProcessError as e:
        log(f"ERROR git: {e}")
        return None

    # SSS76: serve via Vercel public folder (repo es privado, raw GH = 404)
    # tripcazador-web/public/ig-assets/ → https://tripcazador.com/ig-assets/
    base = f"https://tripcazador.com/ig-assets/{asset_slug}"
    urls = [f"{base}/{i}.png" for i in range(1, 6)]
    log(f"✅ 5 URLs ready under {base} (waiting Vercel deploy...)")

    # SSS76b: Vercel auto-deploys on push to tripcazador-web/** but takes
    # ~2-4 min. Poll URL #1 hasta 200 OK con max-wait 6min antes de devolver
    # para que IG pueda fetcharlo. Sin esto IG falla con HTTP 400 (race).
    import time as _t
    test_url = urls[0]
    poll_start = _t.time()
    max_wait = 720  # 12 minutos (Vercel a veces queue >5min cuando concurrente)
    delay = 20
    while _t.time() - poll_start < max_wait:
        try:
            req = urllib.request.Request(test_url, method="HEAD")
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    elapsed = int(_t.time() - poll_start)
                    log(f"✅ Vercel deploy ready ({elapsed}s) — URLs públicas OK")
                    return urls
        except urllib.error.HTTPError as e:
            if e.code != 404:
                log(f"WARN poll {test_url}: HTTP {e.code}")
        except Exception as e:
            log(f"WARN poll {test_url}: {e}")
        _t.sleep(delay)
    log(f"WARN: Vercel deploy timeout ({max_wait}s) — intentando IG publish anyway")
    return urls


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

    # SSS72: opcional, filtrar por tipo y precio máximo via env vars.
    # Útil para forzar primer post a vuelo barato (ej. IG_FILTER_TYPE=flight + IG_MAX_PRICE=100).
    filter_type = os.environ.get("IG_FILTER_TYPE", "").strip().lower()
    max_price_str = os.environ.get("IG_MAX_PRICE", "").strip()
    try:
        max_price = float(max_price_str) if max_price_str else None
    except ValueError:
        max_price = None
    if filter_type or max_price is not None:
        before = len(deals)
        if filter_type:
            deals = [d for d in deals if (d.get("type") or "").lower() == filter_type]
        if max_price is not None:
            deals = [d for d in deals if (d.get("price_eur") or 0) <= max_price]
        log(f"Filtros aplicados (type={filter_type or 'any'}, max_price={max_price or 'none'}): {before} -> {len(deals)} deals")
        if not deals:
            log("Sin deals tras filtros — abort")
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

    # SSS65: dedup origen+destino vs últimos N posts publicados.
    # Si el cron anterior publicó MUC→NRT, el siguiente no puede tener
    # MUC ni NRT como origen ni destino. Tras N=2 posts puede repetirse.
    DEDUP_WINDOW = int(os.environ.get("IG_DEDUP_WINDOW", "2"))
    HISTORY_FILE = ".instagram_post_history.json"
    recent_airports = set()
    history: List[Dict[str, Any]] = []
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f) or []
            for entry in history[-DEDUP_WINDOW:]:
                o = (entry.get("origin") or "").upper()
                d_ = (entry.get("destination") or "").upper()
                if o: recent_airports.add(o)
                if d_: recent_airports.add(d_)
    except Exception as e:
        log(f"WARN reading {HISTORY_FILE}: {e}")

    if recent_airports:
        log(f"Antirepeticion: bloqueados {sorted(recent_airports)} (ventana {DEDUP_WINDOW})")
        filtered = [
            d for d in deals
            if (d.get("origin") or "").upper() not in recent_airports
            and (d.get("destination") or "").upper() not in recent_airports
        ]
        if filtered:
            deals = filtered
        else:
            log("WARN: nada tras dedup; uso lista completa")

    deal = deals[0]
    log(f"Selected deal: {deal.get('id')} â {deal.get('headline')}")

    # SSS65: registrar post en historial para futuros dedups
    try:
        history.append({
            "timestamp": time.time(),
            "deal_id": deal.get("id", ""),
            "origin": (deal.get("origin") or "").upper(),
            "destination": (deal.get("destination") or "").upper(),
            "city_from": deal.get("city_from", ""),
            "city_to": deal.get("city_to", ""),
            "price_eur": deal.get("price_eur"),
        })
        history = history[-20:]
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, default=str)
        log(f"Historial: {len(history)} entradas en {HISTORY_FILE}")
    except Exception as e:
        log(f"WARN history write: {e}")

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

    # SSS75 (May 2026): carrusel Barcelona magazine generado por Python
    # con PIL+cairosvg (canva_carousel_generator.py + canva_landmarks.py).
    # SSS76: 5 PNGs commiteados a tripcazador-web/public/ig-assets/{slug}/{1..5}.png
    # y servidos públicamente vía https://tripcazador.com/ig-assets/... (Vercel).
    if os.environ.get("IG_CAROUSEL_MODE") == "1":
        try:
            slides = generate_and_upload_carousel(deal)
            if slides and len(slides) == 5:
                log(f"CAROUSEL MODE: {len(slides)} slides Canva-rendered")
                post_id = publish_carousel_to_instagram(slides, caption)
            else:
                log(f"WARN: generator returned {len(slides) if slides else 0} slides — fallback Vercel endpoint")
                deal_qid = urllib.parse.quote(deal.get("id", ""))
                slides = [
                    f"{SITE_URL}/api/og/social/post?dealId={deal_qid}",
                    f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=places",
                    f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=food",
                    f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=tips",
                    f"{SITE_URL}/api/og/social/carousel?dealId={deal_qid}&slide=cta",
                ]
                post_id = publish_carousel_to_instagram(slides, caption)
        except Exception as e:
            log(f"ERROR generating carousel via Python: {e}")
            return 1
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

