"""
TripCazador Watchdog — healthchecks con alertas deduplicadas a Telegram.

Verifica:
  1. API pública:  https://api.tripcazador.com/api/health   -> status 200 + "ok"
  2. Frontend:     https://tripcazador.com                   -> status 200
  3. deals.json:   freshness < 12h                         -> valor "generated_at"
  4. PostgreSQL:   ping via psycopg2 (opcional)
  5. Disco:        < 85% usado

Alertas Telegram deduplicadas (no repite misma alerta <1h).
Se invoca desde GitHub Actions (cron cada 30 min) o desde cron del VPS.

Variables de entorno requeridas:
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
  DEALS_URL           (default https://api.tripcazador.com/api/deals)
  WEB_URL             (default https://tripcazador.com)
  HEALTH_URL          (default https://api.tripcazador.com/api/health)
  DEALS_JSON_PATH     (default /opt/tripcazador/data/deals.json)
  DATABASE_URL        (opcional para chequear Postgres)
  WATCHDOG_STATE_FILE (default /tmp/tripcazador_watchdog_state.json)
"""
from __future__ import annotations

import json
import os
import shutil
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("[watchdog] falta 'requests'; pip install requests", file=sys.stderr)
    sys.exit(2)


HEALTH_URL = os.getenv("HEALTH_URL", "https://api.tripcazador.com/api/health")
WEB_URL = os.getenv("WEB_URL", "https://tripcazador.com")
DEALS_URL = os.getenv("DEALS_URL", "https://api.tripcazador.com/api/deals")
DEALS_JSON_PATH = os.getenv("DEALS_JSON_PATH", "/opt/tripcazador/data/deals.json")
STATE_FILE = Path(os.getenv("WATCHDOG_STATE_FILE", "/tmp/tripcazador_watchdog_state.json"))
DEDUP_WINDOW = timedelta(hours=1)
FRESHNESS_MAX_HOURS = 12
DISK_THRESHOLD_PCT = 85

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _load_state() -> dict[str, str]:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_state(state: dict[str, str]) -> None:
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state), encoding="utf-8")
    except Exception as e:
        print(f"[watchdog] no pude guardar state: {e}", file=sys.stderr)


def _should_alert(key: str, state: dict[str, str]) -> bool:
    """Devuelve True si la alerta `key` no se envio en la ultima hora."""
    last = state.get(key)
    if not last:
        return True
    try:
        last_dt = datetime.fromisoformat(last)
        return _now_utc() - last_dt > DEDUP_WINDOW
    except Exception:
        return True


def _mark_alerted(key: str, state: dict[str, str]) -> None:
    state[key] = _now_utc().isoformat()


def send_telegram(text: str) -> bool:
    """Envia un mensaje a Telegram. Retorna True si OK."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print(f"[watchdog][ALERT-noop] {text}")
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        return r.status_code == 200
    except Exception as e:
        print(f"[watchdog] telegram error: {e}", file=sys.stderr)
        return False


def check_api_health() -> tuple[bool, str]:
    try:
        r = requests.get(HEALTH_URL, timeout=8)
        if r.status_code != 200:
            return False, f"API /health devolvio {r.status_code}"
        data = r.json()
        if data.get("status") != "ok":
            return False, f"API /health status={data.get('status')!r}"
        return True, "API OK"
    except Exception as e:
        return False, f"API inaccesible: {e}"


def check_web() -> tuple[bool, str]:
    try:
        r = requests.get(WEB_URL, timeout=10, allow_redirects=True)
        if r.status_code >= 500:
            return False, f"Web devolvio {r.status_code}"
        if r.status_code >= 400:
            return False, f"Web devolvio {r.status_code}"
        return True, "Web OK"
    except Exception as e:
        return False, f"Web inaccesible: {e}"


def check_deals_freshness() -> tuple[bool, str]:
    """Prefiere fichero local; si no, consulta la API."""
    path = Path(DEALS_JSON_PATH)
    generated_at: str | None = None

    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            generated_at = data.get("generated_at")
        except Exception as e:
            return False, f"deals.json corrupto: {e}"
    else:
        try:
            r = requests.get(
                HEALTH_URL.replace("/health", "/stats"),
                timeout=8,
            )
            if r.status_code == 200:
                generated_at = r.json().get("generated_at")
        except Exception:
            pass

    if not generated_at:
        return False, "deals.json: sin campo generated_at"

    try:
        gen_dt = datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
        if gen_dt.tzinfo is None:
            gen_dt = gen_dt.replace(tzinfo=timezone.utc)
    except Exception as e:
        return False, f"generated_at inparseable: {generated_at!r} ({e})"

    age_h = (_now_utc() - gen_dt).total_seconds() / 3600.0
    if age_h > FRESHNESS_MAX_HOURS:
        return False, f"deals.json stale: {age_h:.1f}h sin actualizar"
    return True, f"deals.json OK ({age_h:.1f}h)"


def check_postgres() -> tuple[bool, str]:
    url = os.getenv("DATABASE_URL", "")
    if not url:
        return True, "Postgres: no configurado (skip)"
    try:
        import psycopg2  # type: ignore

        conn = psycopg2.connect(url, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        conn.close()
        return True, "Postgres OK"
    except ImportError:
        return True, "Postgres: psycopg2 no instalado (skip)"
    except Exception as e:
        return False, f"Postgres inaccesible: {e}"


def check_disk() -> tuple[bool, str]:
    try:
        total, used, free = shutil.disk_usage("/")
        pct = used / total * 100.0
        if pct > DISK_THRESHOLD_PCT:
            return False, f"Disco al {pct:.1f}% (umbral {DISK_THRESHOLD_PCT}%)"
        return True, f"Disco OK ({pct:.1f}%)"
    except Exception as e:
        return True, f"Disco: no pude verificar ({e})"


def run() -> int:
    state = _load_state()
    checks = [
        ("api_health", check_api_health, "🚨 API caida"),
        ("web", check_web, "⚠️ Web caida"),
        ("deals_freshness", check_deals_freshness, "⚠️ Deals stale"),
        ("postgres", check_postgres, "🚨 Postgres caido"),
        ("disk", check_disk, "⚠️ Disco lleno"),
    ]

    failures = 0
    report_lines: list[str] = []

    for key, fn, alert_prefix in checks:
        ok, msg = fn()
        status_emoji = "✅" if ok else "❌"
        report_lines.append(f"{status_emoji} [{key}] {msg}")
        if not ok:
            failures += 1
            if _should_alert(key, state):
                text = (
                    f"<b>{alert_prefix}</b>\n"
                    f"<code>{key}</code>: {msg}\n"
                    f"<i>{_now_utc().strftime('%Y-%m-%d %H:%M UTC')}</i>"
                )
                if send_telegram(text):
                    _mark_alerted(key, state)
        else:
            # Si estaba alertado y ahora OK, enviar recovery
            if state.get(key):
                send_telegram(
                    f"✅ <b>RECUPERADO</b>\n<code>{key}</code>: {msg}"
                )
                state.pop(key, None)

    _save_state(state)

    for line in report_lines:
        print(line)

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(run())
