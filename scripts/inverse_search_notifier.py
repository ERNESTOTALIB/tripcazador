#!/usr/bin/env python3
"""
TripCazador — Inverse Search Notifier (SSS211, May 2026)
=========================================================

Cron sister-script de telegram_inverse_search_bot.py.

WORKFLOW:
1. Lee suscripciones persistidas en data/inverse_search_subscriptions.json
   (creadas por el bot cuando un user hace `/buscar Tokio septiembre` y
   no hay match en ese momento — registramos la query para futuro).
2. Carga deals-latest.json del worker (1000+ deals reales).
3. Por cada sub, busca matches usando misma lógica que el bot
   (filter: destination fuzzy match + month + price_max).
4. Si hay match nuevo (no notificado antes), envía Telegram al chat_id
   personal del user (no al canal público).
5. Marca el (sub, deal_id) como notified en .inverse_notified.json para
   no duplicar alertas.

DESIGN ANTI-SPAM:
- Por (sub, deal_id) solo 1 notif total.
- Max 3 notificaciones por user por run (anti-spam si 20+ matches).
- Cron 6h (4 runs/day) → max 12 notif/user/day (raro).
- Si no hay match: silencio (no "todavía nada nuevo" spam).

Env vars (todas opcionales — sin ellas el script termina sin notif):
- TELEGRAM_BOT_TOKEN
- DEALS_FILE_PATH (default: tripcazador-web/public/deals-latest.json)
- SUBS_FILE_PATH (default: data/inverse_search_subscriptions.json)
"""
from __future__ import annotations

import json
import os
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
DEALS_FILE = Path(os.environ.get("DEALS_FILE_PATH",
                                  REPO_ROOT / "tripcazador-web" / "public" / "deals-latest.json"))
SUBS_FILE = Path(os.environ.get("SUBS_FILE_PATH",
                                 REPO_ROOT / "data" / "inverse_search_subscriptions.json"))
NOTIFIED_FILE = REPO_ROOT / "data" / ".inverse_notified.json"
SITE_URL = os.environ.get("SITE_URL", "https://tripcazador.com").rstrip("/")

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()

MAX_NOTIFS_PER_USER_PER_RUN = 3
NOTIFIED_FILE_KEEP = 5000  # max entries antes de purge FIFO


def log(msg: str) -> None:
    print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] {msg}", flush=True)


def normalize(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower().strip()


def load_subs() -> List[Dict[str, Any]]:
    if not SUBS_FILE.exists():
        log(f"No subs file at {SUBS_FILE}")
        return []
    try:
        return json.loads(SUBS_FILE.read_text("utf-8"))
    except Exception as exc:  # noqa: BLE001
        log(f"⚠️  subs file corrupted: {type(exc).__name__}: {exc}")
        return []


def load_deals() -> List[Dict[str, Any]]:
    if not DEALS_FILE.exists():
        log(f"No deals file at {DEALS_FILE}")
        return []
    try:
        data = json.loads(DEALS_FILE.read_text("utf-8"))
        if isinstance(data, dict):
            return data.get("deals", [])
        return data if isinstance(data, list) else []
    except Exception as exc:  # noqa: BLE001
        log(f"⚠️  deals file corrupted: {type(exc).__name__}: {exc}")
        return []


def load_notified() -> Dict[str, Any]:
    if not NOTIFIED_FILE.exists():
        return {"entries": []}
    try:
        return json.loads(NOTIFIED_FILE.read_text("utf-8"))
    except Exception:  # noqa: BLE001
        return {"entries": []}


def save_notified(data: Dict[str, Any]) -> None:
    NOTIFIED_FILE.parent.mkdir(parents=True, exist_ok=True)
    # Mantenemos solo los últimos N para que no crezca infinitamente
    entries = data.get("entries", [])[-NOTIFIED_FILE_KEEP:]
    NOTIFIED_FILE.write_text(
        json.dumps({"entries": entries}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def notif_key(chat_id: int, deal_id: str) -> str:
    return f"{chat_id}::{deal_id}"


def match_deal(deal: Dict[str, Any], sub: Dict[str, Any]) -> bool:
    """True si `deal` matchea la query del sub. Mismo algoritmo que el bot."""
    # destination fuzzy
    dest_norm = normalize(sub.get("destination", ""))
    if not dest_norm:
        return False
    haystack = " ".join(
        normalize(str(deal.get(k, "")))
        for k in ("city_to", "destination", "country_to", "headline")
    )
    if dest_norm not in haystack:
        return False
    # month + year filter
    date_out = deal.get("date_out", "")
    if sub.get("month"):
        if len(date_out) < 7:
            return False
        try:
            dy = int(date_out[:4])
            dm = int(date_out[5:7])
            if dm != sub["month"]:
                return False
            if sub.get("year") and dy != sub["year"]:
                return False
        except Exception:  # noqa: BLE001
            return False
    # price_max filter
    if sub.get("price_max"):
        price = deal.get("price_eur") or 0
        if price > sub["price_max"]:
            return False
    return True


def format_notif(deal: Dict[str, Any], sub: Dict[str, Any]) -> str:
    """Mensaje Telegram personal para el user que tenía esta alerta activa."""
    origin = deal.get("origin", "?")
    dest_city = deal.get("city_to") or deal.get("destination", "?")
    price = int(float(deal.get("price_eur") or 0))
    date_out = deal.get("date_out", "?")
    airline = deal.get("airline_name") or deal.get("airline") or "?"
    booking = deal.get("booking_url", "")
    cls = deal.get("classification", "OFERTA")
    cls_emoji = {"CRÍTICO": "🚨", "ERROR": "❌", "ANOMALÍA": "⚠️"}.get(cls, "💰")

    def esc(s: str) -> str:
        return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    lines = [
        f"{cls_emoji} <b>Match para tu alerta {esc(sub['destination'])}</b>",
        "",
        f"✈️ <b>{esc(origin)} → {esc(dest_city)}</b>",
        f"💰 <b>{price}€</b> · 📅 {esc(date_out)} · {esc(airline)}",
    ]
    if booking:
        lines.append("")
        lines.append(f'<a href="{esc(booking)}">🔖 RESERVAR AHORA</a>')
    lines.append("")
    lines.append("─")
    lines.append(
        f"<i>Recibes esto porque te suscribiste con /buscar. "
        f"Para parar, envía /stop al bot.</i>"
    )
    return "\n".join(lines)


def tg_send(chat_id: int, text: str) -> bool:
    """Envía mensaje personal al user. Valida ok del JSON response."""
    if not BOT_TOKEN:
        log(f"   (no BOT_TOKEN — skip send chat_id={chat_id})")
        return False
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
    }).encode("utf-8")
    try:
        req = urllib.request.Request(url, data=payload, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status != 200:
                log(f"   ❌ tg_send HTTP {resp.status} chat={chat_id}")
                return False
            try:
                data = json.loads(resp.read().decode("utf-8"))
            except Exception:  # noqa: BLE001
                return False
            if not data.get("ok"):
                code = data.get("error_code", "?")
                desc = data.get("description", "")
                log(f"   ❌ tg_send error_code={code} chat={chat_id}: {desc}")
                # Si chat blocked (403), el user bloqueó al bot — log y skip.
                # No queremos retry constante.
                return False
            return True
    except Exception as exc:  # noqa: BLE001
        log(f"   ❌ tg_send exception chat={chat_id}: {type(exc).__name__}: {exc}")
        return False


def main() -> int:
    if not BOT_TOKEN:
        log("ERROR: TELEGRAM_BOT_TOKEN required. Set the secret in repo Settings.")
        return 1

    subs = load_subs()
    if not subs:
        log("No subscriptions — exit 0")
        return 0
    deals = load_deals()
    if not deals:
        log("No deals to match — exit 0")
        return 0

    log(f"Subs: {len(subs)}, deals: {len(deals)}")

    notified = load_notified()
    seen_keys = {e.get("key") for e in notified.get("entries", []) if e.get("key")}
    new_entries: List[Dict[str, Any]] = []

    sent_by_user: Dict[int, int] = {}
    total_sent = 0
    total_skipped_anti_spam = 0

    for sub in subs:
        chat_id = sub.get("chat_id")
        if not isinstance(chat_id, int):
            continue
        # Si el sub fue marcado como unsubscribed (futuro: /stop command), skip
        if sub.get("unsubscribed_at"):
            continue

        # Anti-spam: ya envió MAX a este user en este run
        if sent_by_user.get(chat_id, 0) >= MAX_NOTIFS_PER_USER_PER_RUN:
            total_skipped_anti_spam += 1
            continue

        # Encuentra matches no notificados antes
        matches = []
        for deal in deals:
            deal_id = str(deal.get("id") or "")
            if not deal_id:
                continue
            key = notif_key(chat_id, deal_id)
            if key in seen_keys:
                continue
            if match_deal(deal, sub):
                matches.append((deal, key))

        # Sort matches: classification CRÍTICO/ERROR primero, luego price ASC
        cls_rank = {"CRÍTICO": 0, "ERROR": 1, "ANOMALÍA": 2, "OFERTA": 3}
        matches.sort(key=lambda x: (
            cls_rank.get(x[0].get("classification"), 9),
            x[0].get("price_eur") or 9e9,
        ))

        # Envía hasta MAX_NOTIFS_PER_USER_PER_RUN del top
        for deal, key in matches[:MAX_NOTIFS_PER_USER_PER_RUN - sent_by_user.get(chat_id, 0)]:
            text = format_notif(deal, sub)
            if tg_send(chat_id, text):
                total_sent += 1
                sent_by_user[chat_id] = sent_by_user.get(chat_id, 0) + 1
                new_entries.append({
                    "key": key,
                    "chat_id": chat_id,
                    "deal_id": str(deal.get("id")),
                    "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                })
                seen_keys.add(key)

    if new_entries:
        notified["entries"] = notified.get("entries", []) + new_entries
        save_notified(notified)

    log(f"Sent: {total_sent}, skipped_anti_spam: {total_skipped_anti_spam}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
