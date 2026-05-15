#!/usr/bin/env python3
"""
TripCazador — Telegram inverse search bot (SSS83 May 2026)

Comando: /buscar <destino> <mes> [<precio_max>]
Ejemplos:
  /buscar Tokio septiembre
  /buscar Tailandia 2026-08 600
  /buscar Tirana junio 100

El bot busca matches en deals-latest.json del repo (1271+ deals reales del
hunter), responde con top 5 ordenados por score, y guarda la query en
data/inverse_search_subscriptions.json para notificar cuando aparezca uno
nuevo.

Modo polling (long-poll Telegram getUpdates). Diseñado para correr cada 5min
en GH Actions o systemd timer. El offset se persiste para no procesar el
mismo update dos veces.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
DEALS_FILE = REPO_ROOT / "tripcazador-web" / "public" / "deals-latest.json"
SUBS_FILE = REPO_ROOT / "data" / "inverse_search_subscriptions.json"
OFFSET_FILE = REPO_ROOT / "data" / ".telegram_inverse_offset"

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
SITE_URL = os.environ.get("SITE_URL", "https://tripcazador.com").rstrip("/")
MONTHS_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12, "ene": 1, "feb": 2, "mar": 3, "abr": 4,
    "may": 5, "jun": 6, "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12,
}


def log(msg: str) -> None:
    print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] {msg}", flush=True)


def normalize(s: str) -> str:
    """Lowercase + strip accents, for fuzzy match."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower().strip()


def tg_api(method: str, params: Optional[Dict[str, Any]] = None, timeout: int = 35) -> Any:
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN missing")
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    data = urllib.parse.urlencode(params or {}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "TripCazador-InverseBot/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        resp = json.loads(r.read().decode("utf-8"))
    # SSS204 (15 may 2026): mismo patrón SSS192 — Telegram puede devolver HTTP
    # 200 con `{"ok": false, "error_code": 401/403/429}` cuando bot revocado,
    # kicked, o flood control. Si no validamos `ok`, llamamos `resp["result"]`
    # más tarde y crashea con KeyError opaco. Mejor failing fast con log.
    if isinstance(resp, dict) and not resp.get("ok", True):
        code = resp.get("error_code", "?")
        desc = resp.get("description", "<no description>")
        log(f"❌ Telegram API {method} error_code={code}: {desc}")
        raise RuntimeError(f"Telegram API error {code}: {desc}")
    return resp


def tg_send(chat_id: int, text: str) -> None:
    try:
        tg_api("sendMessage", {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": "true",
        })
    except Exception as e:
        log(f"send failed: {e}")


def load_deals() -> List[Dict[str, Any]]:
    if not DEALS_FILE.exists():
        return []
    try:
        d = json.loads(DEALS_FILE.read_text("utf-8"))
        deals = d.get("deals", []) if isinstance(d, dict) else d
        # Filter out seeds
        return [x for x in deals if isinstance(x, dict) and not (
            str(x.get("id", "")).startswith("seed-")
            or "seed" in (x.get("sources") or [])
            or "seed" in (x.get("tags") or [])
        )]
    except Exception as e:
        log(f"deals load failed: {e}")
        return []


def parse_query(text: str) -> Optional[Dict[str, Any]]:
    """Parse '/buscar <destino> <mes> [<precio>]'."""
    m = re.match(r"/buscar(?:@\w+)?\s+(.+)", text.strip(), re.I)
    if not m:
        return None
    parts = m.group(1).split()
    if not parts:
        return None

    # Last token may be price (digits) or month
    price_max: Optional[int] = None
    if parts and parts[-1].isdigit():
        price_max = int(parts[-1])
        parts = parts[:-1]

    # Month: last token if it matches MONTHS_ES or YYYY-MM format
    month: Optional[int] = None
    year: Optional[int] = None
    if parts:
        last = normalize(parts[-1])
        if last in MONTHS_ES:
            month = MONTHS_ES[last]
            parts = parts[:-1]
        elif re.match(r"^\d{4}-\d{2}$", last):
            year, month = int(last[:4]), int(last[5:7])
            parts = parts[:-1]
        elif re.match(r"^\d{2}-\d{4}$", last):
            month, year = int(last[:2]), int(last[3:7])
            parts = parts[:-1]

    if not parts:
        return None

    destination = " ".join(parts)
    return {"destination": destination, "month": month, "year": year, "price_max": price_max}


def search_deals(deals: List[Dict[str, Any]], q: Dict[str, Any]) -> List[Dict[str, Any]]:
    dest_norm = normalize(q["destination"])
    matches: List[Dict[str, Any]] = []
    for d in deals:
        city_to = normalize(str(d.get("city_to", "")))
        country = normalize(str(d.get("country_to", "")))
        iata = str(d.get("destination", "")).upper()
        # Match destination by partial city/country/IATA
        if not (
            dest_norm in city_to
            or dest_norm in country
            or city_to.startswith(dest_norm)
            or (len(dest_norm) == 3 and dest_norm.upper() == iata)
        ):
            continue
        # Match month if specified
        date_out = str(d.get("date_out", ""))
        if q.get("month"):
            if not date_out:
                continue
            try:
                dy = int(date_out[:4])
                dm = int(date_out[5:7])
                if dm != q["month"]:
                    continue
                if q.get("year") and dy != q["year"]:
                    continue
            except Exception:
                continue
        # Match price
        if q.get("price_max"):
            price = d.get("price_eur") or 0
            if price > q["price_max"]:
                continue
        matches.append(d)
    matches.sort(key=lambda d: (-(d.get("score") or 0), d.get("price_eur") or 9e9))
    return matches[:5]


def format_response(q: Dict[str, Any], matches: List[Dict[str, Any]]) -> str:
    if not matches:
        ms_label = ""
        if q.get("month"):
            from calendar import month_name
            ms_label = f" en {month_name[q['month']]}"
        pm = f" bajo €{q['price_max']}" if q.get("price_max") else ""
        return (
            f"😔 Sin chollos a {q['destination'].title()}{ms_label}{pm} ahora mismo.\n\n"
            f"💡 Te avisaré cuando aparezca uno. Mientras, mira <a href='{SITE_URL}/deals'>todos los chollos</a>."
        )
    lines = [f"✅ <b>{len(matches)} chollos para {q['destination'].title()}</b>:\n"]
    for d in matches:
        cls = d.get("classification", "OFERTA")
        emoji = {"CRÍTICO": "🔥", "ERROR": "⚡", "ANOMALÍA": "💎"}.get(cls, "✨")
        url = f"{SITE_URL}/deals/{d.get('id', '')}"
        lines.append(
            f"{emoji} <a href='{url}'>{d.get('city_from','?')} → {d.get('city_to','?')}</a> "
            f"<b>€{d.get('price_eur','?')}</b> · {d.get('date_out','')[:10]} · {d.get('airline_name','?')}"
        )
    lines.append(f"\n🔔 ¿Quieres alerta de nuevos? Activa /alerta {q['destination']}")
    return "\n".join(lines)


def save_subscription(chat_id: int, q: Dict[str, Any]) -> None:
    SUBS_FILE.parent.mkdir(parents=True, exist_ok=True)
    subs: List[Dict[str, Any]] = []
    if SUBS_FILE.exists():
        try:
            subs = json.loads(SUBS_FILE.read_text("utf-8"))
        except Exception as exc:  # noqa: BLE001
            # SSS204: antes silent — corruption del JSON descartaba TODAS las
            # subscripciones de users sin diagnóstico → users nunca recibían
            # alertas. Ahora log explícito + creamos backup del archivo
            # corrupto para inspeccionar después.
            log(
                f"⚠️  inverse_search_subscriptions.json corrupted: "
                f"{type(exc).__name__}: {exc}. Backing up and resetting."
            )
            try:
                backup_path = SUBS_FILE.with_suffix(f".corrupt.{int(time.time())}.json")
                SUBS_FILE.rename(backup_path)
                log(f"   backed up to {backup_path}")
            except Exception:  # noqa: BLE001
                pass
            subs = []
    sub = {
        "chat_id": chat_id,
        "destination": q["destination"],
        "month": q.get("month"),
        "year": q.get("year"),
        "price_max": q.get("price_max"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # dedup by chat_id+destination+month
    subs = [s for s in subs if not (
        s.get("chat_id") == chat_id
        and s.get("destination") == q["destination"]
        and s.get("month") == q.get("month")
    )]
    subs.append(sub)
    SUBS_FILE.write_text(json.dumps(subs, ensure_ascii=False, indent=2), encoding="utf-8")


def handle_update(update: Dict[str, Any], deals: List[Dict[str, Any]]) -> None:
    msg = update.get("message") or update.get("edited_message") or {}
    text = (msg.get("text") or "").strip()
    chat_id = (msg.get("chat") or {}).get("id")
    if not text or not chat_id:
        return
    log(f"chat={chat_id} text={text[:80]}")

    if text.startswith("/start") or text.startswith("/help"):
        tg_send(chat_id,
            "👋 <b>TripCazador Bot</b>\n\n"
            "Encuentro chollos de vuelo:\n"
            "• <code>/buscar Tokio septiembre</code>\n"
            "• <code>/buscar Tailandia 2026-08 600</code>\n"
            "• <code>/buscar Tirana junio 100</code>\n\n"
            "Cuando me pides un destino te aviso cuando aparezca uno bueno. "
            "Más chollos en " + SITE_URL
        )
        return

    if text.startswith("/buscar") or text.startswith("/search"):
        q = parse_query(text)
        if not q:
            tg_send(chat_id, "❌ Formato: <code>/buscar &lt;destino&gt; [mes] [precio_max]</code>")
            return
        save_subscription(chat_id, q)
        matches = search_deals(deals, q)
        tg_send(chat_id, format_response(q, matches))
        return

    if text.startswith("/alerta"):
        # Toggle alerta — alias para /buscar (ya guardamos sub al buscar)
        q = parse_query(text.replace("/alerta", "/buscar", 1))
        if q:
            save_subscription(chat_id, q)
            tg_send(chat_id, f"🔔 Alerta activa para <b>{q['destination'].title()}</b>. Te avisaré.")
        return


def get_offset() -> int:
    if OFFSET_FILE.exists():
        try:
            return int(OFFSET_FILE.read_text().strip())
        except Exception:
            pass
    return 0


def save_offset(offset: int) -> None:
    OFFSET_FILE.parent.mkdir(parents=True, exist_ok=True)
    OFFSET_FILE.write_text(str(offset))


def main() -> int:
    if not BOT_TOKEN:
        log("ERROR: TELEGRAM_BOT_TOKEN required")
        return 1
    deals = load_deals()
    log(f"loaded {len(deals)} real deals")
    offset = get_offset()
    try:
        resp = tg_api("getUpdates", {"offset": offset, "timeout": 25, "limit": 50})
    except Exception as e:
        log(f"getUpdates failed: {e}")
        return 1
    updates = resp.get("result", []) if isinstance(resp, dict) else []
    log(f"{len(updates)} new updates")
    for u in updates:
        handle_update(u, deals)
        offset = max(offset, int(u.get("update_id", 0)) + 1)
    save_offset(offset)
    return 0


if __name__ == "__main__":
    sys.exit(main())
