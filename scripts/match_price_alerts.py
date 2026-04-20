#!/usr/bin/env python3
"""
match_price_alerts.py
─────────────────────
Cruza alertas activas vs deals.json y envía notificaciones por email
cuando se cumple el target_price del usuario.

Diseño:
  1) Carga `price_alerts.json` (escrito por FastAPI vía POST /api/price-alerts).
  2) Carga `deals.json` (escrito por el worker cada run).
  3) Para cada alerta activa, encuentra deals que cumplen:
       - Si hay origin → deal.origin == origin
       - Si hay destination → deal.destination == destination
       - Si hay deal_id → deal.id == deal_id
       - Si hay target_price → deal.price_eur <= target_price
       (ejes en AND — solo match si cumple TODOS los presentes)
  4) Dedupe por (alert_id, deal_id) usando `.sent_matches.json` para no
     spamear con el mismo match día tras día.
  5) Envía email SMTP si hay credenciales; si no, imprime el resumen
     (útil para CI o dry-run).

Variables de entorno relevantes:
  PRICE_ALERTS_PATH    Ruta al JSON de alertas                (default /data/price_alerts.json)
  DEALS_DIR            Directorio con deals.json              (default ./Viajes)
  PRICE_ALERT_SECRET   Misma secret que FastAPI (para firmar  (default tripcazador-dev-only)
                       tokens de cancelación del link)
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM   (opcional — si no, dry-run)
  SITE_URL             Para construir el link de cancelación  (default https://tripcazador.com)

Uso:
  python scripts/match_price_alerts.py                 # envío real si SMTP está configurado
  python scripts/match_price_alerts.py --dry-run       # solo imprime

Ejecutado por el workflow del worker (GitHub Actions) después de
refrescar deals.json, cada 6h.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import smtplib
import sys
import time
from email.message import EmailMessage
from pathlib import Path
from typing import Any


# ────────────────────────────────────────────────
# IO helpers
# ────────────────────────────────────────────────

def _load_json(path: Path, default: Any) -> Any:
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"⚠ no se pudo leer {path}: {e}", file=sys.stderr)
    return default


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


# ────────────────────────────────────────────────
# Core matching
# ────────────────────────────────────────────────

def deal_matches_alert(deal: dict, alert: dict) -> bool:
    """True si `deal` satisface todos los criterios presentes en `alert`."""
    if alert.get("deal_id") and deal.get("id") != alert["deal_id"]:
        return False
    if alert.get("origin") and deal.get("origin", "").upper() != alert["origin"]:
        return False
    if alert.get("destination") and deal.get("destination", "").upper() != alert["destination"]:
        return False
    target = alert.get("target_price")
    if target is not None and deal.get("price_eur", 1e12) > float(target):
        return False
    return True


def find_matches(alerts: list[dict], deals: list[dict]) -> list[tuple[dict, dict]]:
    """Devuelve pares (alert, deal) para todas las alertas activas que hacen match.

    Una alerta puede matchear varios deals — devolvemos todos los pares
    y el dedupe se hace en el emisor (para no mandar dos emails por el
    mismo deal si la alerta es muy abierta).
    """
    pairs: list[tuple[dict, dict]] = []
    for alert in alerts:
        if alert.get("status") != "active":
            continue
        for deal in deals:
            if deal_matches_alert(deal, alert):
                pairs.append((alert, deal))
    return pairs


# ────────────────────────────────────────────────
# Token (mismo HMAC que FastAPI)
# ────────────────────────────────────────────────

def cancel_token(alert_id: str) -> str:
    secret = os.getenv("PRICE_ALERT_SECRET", "tripcazador-dev-only").encode()
    return hmac.new(secret, alert_id.encode(), hashlib.sha256).hexdigest()[:32]


# ────────────────────────────────────────────────
# Email
# ────────────────────────────────────────────────

def build_email_body(alert: dict, deal: dict, site_url: str) -> tuple[str, str]:
    """Devuelve (subject, html_body) para el email de alerta."""
    origin = deal.get("origin", "?")
    dest = deal.get("destination", "?")
    price = deal.get("price_eur", "?")
    city_to = deal.get("city_to") or dest
    country_to = deal.get("country_to", "")
    airline = deal.get("airline_name") or deal.get("airline", "?")
    date_out = deal.get("date_out", "")
    deal_url = f"{site_url}/deals/{deal.get('id', '')}"
    cancel_url = f"{site_url}/api/price-alerts/cancel?id={alert['id']}&token={cancel_token(alert['id'])}"

    subject = f"✈ {origin} → {city_to} por {price} € — TripCazador"
    html = f"""
    <div style="font-family:system-ui,sans-serif;background:#0b1220;color:#e5e7eb;padding:24px;">
      <h2 style="color:#fbbf24;margin:0 0 12px">¡Hay una oferta que cumple tu alerta!</h2>
      <p>Detectamos un vuelo que cumple el criterio que pediste:</p>
      <div style="background:#111827;border:1px solid #374151;border-radius:12px;padding:16px;margin:16px 0">
        <div style="font-size:20px;font-weight:700">{origin} → {city_to} <span style="color:#fbbf24">{price} €</span></div>
        <div style="color:#9ca3af;margin-top:6px">{airline} · {date_out or 'fecha variable'} · {country_to}</div>
      </div>
      <p>
        <a href="{deal_url}" style="display:inline-block;padding:12px 20px;background:#f59e0b;color:#000;border-radius:10px;font-weight:600;text-decoration:none">
          Ver el chollo
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #374151;margin:24px 0">
      <p style="color:#9ca3af;font-size:13px">
        Si ya no te interesa esta alerta, puedes
        <a href="{cancel_url}" style="color:#fbbf24">cancelarla aquí</a> (un solo click, sin login).
      </p>
      <p style="color:#6b7280;font-size:11px">
        TripCazador · Si no reconoces esta alerta, ignora el email — el enlace de cancelación es válido sin más pasos.
      </p>
    </div>
    """
    return subject, html


def send_email(to_addr: str, subject: str, html_body: str) -> bool:
    """Envía un email vía SMTP. Devuelve True si lo hizo, False si no hay config."""
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASS", "").strip()
    sender = os.getenv("SMTP_FROM", user).strip()

    if not (host and sender):
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_addr
    msg.set_content("Tu cliente de email no soporta HTML. Abre el email en otra aplicación para ver el chollo.")
    msg.add_alternative(html_body, subtype="html")

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=15) as s:
                if user:
                    s.login(user, password)
                s.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=15) as s:
                s.ehlo()
                s.starttls()
                if user:
                    s.login(user, password)
                s.send_message(msg)
        return True
    except Exception as e:
        print(f"⚠ SMTP error enviando a {to_addr}: {e}", file=sys.stderr)
        return False


# ────────────────────────────────────────────────
# Entry point
# ────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Match price alerts against deals.json")
    parser.add_argument("--dry-run", action="store_true", help="No enviar email; solo imprimir matches")
    parser.add_argument("--alerts-path", default=os.getenv("PRICE_ALERTS_PATH", "/data/price_alerts.json"))
    parser.add_argument("--deals-dir", default=os.getenv("DEALS_DIR", "Viajes"))
    parser.add_argument("--sent-file", default=os.getenv("SENT_MATCHES_PATH", "/data/.sent_matches.json"))
    parser.add_argument("--site-url", default=os.getenv("SITE_URL", "https://tripcazador.com"))
    args = parser.parse_args()

    alerts_path = Path(args.alerts_path)
    deals_path = Path(args.deals_dir) / "deals.json"
    sent_path = Path(args.sent_file)

    alerts = _load_json(alerts_path, [])
    deals_obj = _load_json(deals_path, {})
    deals = deals_obj.get("deals", []) if isinstance(deals_obj, dict) else []

    if not alerts:
        print("(no hay alertas activas)")
        return 0
    if not deals:
        print("(no hay deals en deals.json — saltando)")
        return 0

    pairs = find_matches(alerts, deals)
    if not pairs:
        print(f"0 matches sobre {len(alerts)} alertas × {len(deals)} deals")
        return 0

    sent = _load_json(sent_path, {"hashes": []})
    sent_set: set[str] = set(sent.get("hashes", []))

    sent_now = 0
    dry_run_count = 0
    for alert, deal in pairs:
        key = f"{alert['id']}|{deal.get('id', '')}"
        if key in sent_set:
            continue

        subject, html = build_email_body(alert, deal, args.site_url)

        if args.dry_run:
            print(f"[DRY] → {alert['email']}: {subject}")
            dry_run_count += 1
            continue

        ok = send_email(alert["email"], subject, html)
        if ok:
            sent_now += 1
            sent_set.add(key)
            alert["last_notified_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        else:
            print(f"[WARN] SMTP no configurado o falló — no se envió a {alert['email']}")

    # Persistimos dedupe y alerts actualizadas (para last_notified_at)
    if not args.dry_run and sent_now > 0:
        _save_json(sent_path, {"hashes": sorted(sent_set)[-5000:]})  # cap para no crecer sin fin
        _save_json(alerts_path, alerts)

    msg = f"{len(pairs)} matches encontrados; {sent_now} emails enviados"
    if args.dry_run:
        msg += f" ({dry_run_count} dry-run)"
    print(msg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
