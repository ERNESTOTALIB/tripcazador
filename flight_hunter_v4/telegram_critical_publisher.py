"""
Telegram Critical Publisher — fase SSS34 (May 2026)
====================================================
Cron de baja frecuencia (cada 30min) que mira deals-latest.json y manda al
canal Telegram solo los 1-2 chollos REALMENTE críticos sin enviarlos antes.

Diferencia vs notifier.py:
  - notifier.py: corre dentro del worker, alerta tras CADA hunt (cada 4h),
    cap=10 alertas — demasiado spam para un canal público.
  - este script: corre como GH Actions cron */30min, mira el commit de
    deals-latest.json, filtra TOP 2 críticos NUEVOS y los publica.

Filtro de "crítico":
  - classification ∈ {CRÍTICO, ERROR}     (drop ≥35% según deal_enricher)
  - score ≥ 75
  - price_eur ≤ 300                       (chollos baratos, no business class)
  - found_at < 6h                         (precio fresco, no 3 días viejo)

Dedup persistente:
  - flight_hunter_v4/.telegram_critical_sent.json (committed al repo cada vez)
  - hash MD5 origen+dest+airline+price → no se reenvía nunca

Política anti-spam:
  - Máximo 2 alertas por ejecución
  - Si no hay nada nuevo: silencio total (cero ruido)
  - Throttle: si en últimas 2h ya envió ≥3 alertas, parar (dedup secundario)
"""
import hashlib
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Configuración
HERE = Path(__file__).parent
DEDUP_FILE = HERE / ".telegram_critical_sent.json"
DEALS_FILE = HERE.parent / "tripcazador-web" / "public" / "deals-latest.json"

# Filtros
ALLOWED_CLASSES = {"CRÍTICO", "ERROR"}
MIN_SCORE = 75
MAX_PRICE_EUR = 300
MAX_AGE_HOURS = 6
MAX_ALERTS_PER_RUN = 2
RECENT_WINDOW_HOURS = 2     # Para throttle secundario
RECENT_MAX_ALERTS = 3       # Si en últimas 2h se enviaron 3, parar

# Telegram
TG_API = "https://api.telegram.org/bot{token}/sendMessage"


def _deal_hash(deal: Dict) -> str:
    """Hash único del deal — incluye precio para que cambios reactiven alerta."""
    parts = [
        str(deal.get("origin", "")),
        str(deal.get("destination", "")),
        str(deal.get("airline", "")),
        str(int(deal.get("price_eur") or 0)),
        str(deal.get("date_out", "")),
    ]
    key = "|".join(parts)
    return hashlib.md5(key.encode("utf-8")).hexdigest()[:12]


def _load_dedup() -> Dict:
    """Lee el JSON de hashes ya enviados."""
    if not DEDUP_FILE.exists():
        return {"sent": []}
    try:
        with open(DEDUP_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "sent" not in data:
                data["sent"] = []
            return data
    except (OSError, json.JSONDecodeError):
        return {"sent": []}


def _save_dedup(data: Dict) -> None:
    """Persiste dedup. Mantenemos solo los últimos 500 hashes para no crecer."""
    sent = data.get("sent", [])
    if len(sent) > 500:
        sent = sent[-500:]
    data["sent"] = sent
    DEDUP_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DEDUP_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _is_fresh(deal: Dict, max_age_hours: int = MAX_AGE_HOURS) -> bool:
    """Comprueba que found_at sea reciente (precio no caducado)."""
    found_at = deal.get("found_at") or deal.get("ts")
    if not found_at:
        return True  # Sin timestamp asumimos fresco
    try:
        # Acepta tanto "2026-05-03T19:00:00Z" como con offset
        ts_str = found_at.replace("Z", "+00:00")
        ts = datetime.fromisoformat(ts_str)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - ts
        return age <= timedelta(hours=max_age_hours)
    except (ValueError, TypeError):
        return True  # Si no se parsea, no descartar


def filter_critical(deals: List[Dict]) -> List[Dict]:
    """Aplica todos los filtros y devuelve sorted candidates."""
    candidates = []
    for d in deals:
        # Type: solo flight_deal o flight (excluye hotel_deal)
        dtype = (d.get("type") or "").lower()
        if "hotel" in dtype:
            continue
        # Classification CRÍTICO o ERROR
        cls = d.get("classification", "")
        if cls not in ALLOWED_CLASSES:
            continue
        # Score ≥ 75
        score = float(d.get("final_score") or d.get("score") or 0)
        if score < MIN_SCORE:
            continue
        # Precio razonable (excluir business 1500€)
        price = float(d.get("price_eur") or 0)
        if price <= 0 or price > MAX_PRICE_EUR:
            continue
        # Frescura
        if not _is_fresh(d):
            continue
        candidates.append(d)

    # Sort: drop% DESC (savings_pct o drop_pct), luego price ASC
    def _sort_key(d: Dict) -> Tuple[float, float]:
        drop = float(d.get("savings_pct") or d.get("drop_pct") or 0)
        price = float(d.get("price_eur") or 99999)
        return (-drop, price)

    candidates.sort(key=_sort_key)
    return candidates


def filter_unsent(candidates: List[Dict], dedup: Dict) -> List[Dict]:
    """Quita los que ya están en el dedup."""
    sent_hashes = {entry["hash"] for entry in dedup.get("sent", [])}
    return [d for d in candidates if _deal_hash(d) not in sent_hashes]


def check_throttle(dedup: Dict) -> bool:
    """True si NO se debe publicar (excedido throttle 3 alertas en 2h)."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=RECENT_WINDOW_HOURS)
    recent = 0
    for entry in dedup.get("sent", []):
        try:
            ts = datetime.fromisoformat(entry.get("ts", "").replace("Z", "+00:00"))
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            if ts >= cutoff:
                recent += 1
        except (ValueError, TypeError):
            continue
    return recent >= RECENT_MAX_ALERTS


def format_message(deal: Dict) -> str:
    """Formato HTML compacto para Telegram."""
    cls = deal.get("classification", "OFERTA")
    icon = {"CRÍTICO": "🚨", "ERROR": "❌", "ANOMALÍA": "⚠️"}.get(cls, "💰")
    price = int(float(deal.get("price_eur") or 0))
    origin = deal.get("origin", "?")
    dest = deal.get("destination", "?")
    city = deal.get("city_to") or dest
    airline = deal.get("airline") or "?"
    cabin = deal.get("cabin", "Economy")
    date_out = deal.get("date_out") or "?"
    date_ret = deal.get("date_ret") or ""
    drop_pct = int(float(deal.get("savings_pct") or deal.get("drop_pct") or 0))
    booking = deal.get("booking_url", "")

    # HTML escape rudimentario (los valores son alfanuméricos en general)
    def _esc(s: str) -> str:
        return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    lines = [
        f"{icon} <b>{_esc(cls)}</b> — {price}€",
        "",
        f"✈️ <b>{_esc(origin)} → {_esc(city)}</b> ({_esc(dest)})",
        f"💺 {_esc(cabin)} con {_esc(airline)}",
        f"📅 {_esc(date_out)}" + (f" → {_esc(date_ret)}" if date_ret else ""),
    ]
    if drop_pct >= 20:
        lines.append(f"💵 <b>-{drop_pct}%</b> vs precio habitual")
    if booking:
        lines.append("")
        lines.append(f'<a href="{_esc(booking)}">🔖 RESERVAR AHORA</a>')

    return "\n".join(lines)


def send_telegram(token: str, chat_id: str, text: str) -> bool:
    """Envía un mensaje a Telegram con HTML parse mode."""
    url = TG_API.format(token=token)
    payload = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
    }).encode("utf-8")
    try:
        req = urllib.request.Request(url, data=payload, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"   ⚠️  Telegram send failed: {e}", file=sys.stderr)
        return False


def main() -> int:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("⚠️  TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID no configurado — skip")
        return 0

    if not DEALS_FILE.exists():
        print(f"⚠️  deals-latest.json no encontrado en {DEALS_FILE} — skip")
        return 0

    try:
        with open(DEALS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"❌ deals-latest.json no parseable: {e}", file=sys.stderr)
        return 1

    deals = data.get("deals", []) if isinstance(data, dict) else data
    print(f"📂 Cargados {len(deals)} deals desde {DEALS_FILE.name}")

    candidates = filter_critical(deals)
    print(f"🎯 {len(candidates)} candidatos cumplen filtros (CRÍTICO/ERROR + score≥{MIN_SCORE} + precio≤{MAX_PRICE_EUR}€ + <{MAX_AGE_HOURS}h)")

    dedup = _load_dedup()

    if check_throttle(dedup):
        print(f"🛑 Throttle: ya se enviaron ≥{RECENT_MAX_ALERTS} alertas en últimas {RECENT_WINDOW_HOURS}h — skip")
        return 0

    new_ones = filter_unsent(candidates, dedup)
    print(f"🆕 {len(new_ones)} no enviados antes")

    if not new_ones:
        print("✅ Sin chollos críticos nuevos — silencio (sin spam)")
        return 0

    to_send = new_ones[:MAX_ALERTS_PER_RUN]
    sent_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for deal in to_send:
        msg = format_message(deal)
        if send_telegram(token, chat_id, msg):
            sent_count += 1
            dedup.setdefault("sent", []).append({
                "hash": _deal_hash(deal),
                "ts": now_iso,
                "origin": deal.get("origin"),
                "destination": deal.get("destination"),
                "price_eur": deal.get("price_eur"),
                "classification": deal.get("classification"),
            })
            print(f"   ✅ Enviado: {deal.get('origin')}→{deal.get('destination')} {int(float(deal.get('price_eur') or 0))}€")
        else:
            print(f"   ⚠️  Falló envío: {deal.get('origin')}→{deal.get('destination')}")

    if sent_count > 0:
        _save_dedup(dedup)
        print(f"💾 Dedup actualizado con {sent_count} entradas nuevas (total: {len(dedup['sent'])})")

    print(f"📊 Resumen: {sent_count}/{len(to_send)} enviados")
    return 0


if __name__ == "__main__":
    sys.exit(main())
