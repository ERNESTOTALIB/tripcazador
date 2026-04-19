#!/usr/bin/env python3
"""Generador del digest semanal de TripCazador en HTML inline-friendly para email.

Uso:
    python tools/generate_digest.py                 # lee deals.json y escribe digest.html
    python tools/generate_digest.py --out foo.html  # output custom
    python tools/generate_digest.py --limit 8       # top-N deals en el digest
    python tools/generate_digest.py --dry-run       # imprime a stdout

El output usa inline styles y tablas (compatible con Gmail/Outlook/Apple Mail).
No depende de librerías externas — solo stdlib.
"""
from __future__ import annotations

import argparse
import html
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DEALS = ROOT / "deals_api" / "deals.json"
DEFAULT_OUT = ROOT / "digest_email.html"
BASE_URL = "https://tripcazador.com"


def load_deals(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "deals" in data:
        return data["deals"]
    return []


def classify(deal: dict) -> tuple[str, str]:
    """Devuelve (etiqueta, color hex) por clasificación."""
    c = (deal.get("classification") or "").lower()
    if c in ("epic", "unicorn", "legend"):
        return ("🔥 ÉPICO", "#f59e0b")
    if c in ("great", "excellent"):
        return ("🎯 GRAN CHOLLO", "#10b981")
    if c in ("good",):
        return ("✅ BUENO", "#3b82f6")
    return ("💸 DEAL", "#6b7280")


def deal_row(deal: dict) -> str:
    label, color = classify(deal)
    headline = html.escape(deal.get("headline") or f"{deal.get('city_from', '')} → {deal.get('city_to', '')}")
    origin = html.escape(deal.get("origin", ""))
    destination = html.escape(deal.get("destination", ""))
    city_to = html.escape(deal.get("city_to", ""))
    date_out = html.escape(deal.get("date_out", ""))
    date_ret = html.escape(deal.get("date_ret", ""))
    price_eur = deal.get("price_eur", 0)
    nights = deal.get("nights", 0)
    cabin = html.escape(deal.get("cabin", "economy"))
    url = f"{BASE_URL}/deals/{html.escape(str(deal.get('id', '')))}"

    return f"""
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
            <div style="margin-bottom:6px;">
              <span style="display:inline-block;padding:2px 10px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#fff;background:{color};border-radius:9999px;">{label}</span>
              <span style="margin-left:8px;font-size:12px;color:#6b7280;">{origin} → {destination} · {cabin}</span>
            </div>
            <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;line-height:1.3;">
              <a href="{url}" style="color:#111827;text-decoration:none;">{headline}</a>
            </div>
            <div style="font-size:13px;color:#4b5563;margin-bottom:12px;">
              📅 {date_out} → {date_ret} · {nights} noches<br/>
              📍 {city_to}
            </div>
            <div style="display:inline-block;vertical-align:middle;">
              <span style="font-size:28px;font-weight:800;color:#111827;">{int(price_eur)}€</span>
              <span style="font-size:13px;color:#6b7280;margin-left:4px;">ida y vuelta</span>
            </div>
            <div style="margin-top:14px;">
              <a href="{url}" style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#000;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;">Ver chollo →</a>
            </div>
          </td>
        </tr>
    """


def render_digest(deals: list[dict], limit: int = 6) -> str:
    # Ordenar por una mezcla de score (si existe) y precio — simple: mejor score primero
    sorted_deals = sorted(
        deals,
        key=lambda d: (-(d.get("score") or 0), d.get("price_eur", 99999)),
    )[:limit]

    rows = "".join(deal_row(d) for d in sorted_deals)
    now_str = datetime.now().strftime("%d %B %Y")
    year = datetime.now().year
    count = len(sorted_deals)

    # Estructura de email compatible con la mayoría de clientes: tabla outer de 600px, todo inline.
    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TripCazador — Chollos de la semana</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <!-- Preheader (texto oculto que aparece junto al asunto en la bandeja) -->
  <div style="display:none;overflow:hidden;line-height:1;opacity:0;max-height:0;max-width:0;">
    Los {count} mejores chollos de vuelos detectados esta semana, ordenados por score.
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 24px 24px;background:linear-gradient(135deg,#111827 0%,#1f2937 100%);text-align:center;">
              <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#f59e0b;margin-bottom:8px;font-weight:700;">TripCazador · {now_str}</div>
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:800;line-height:1.2;">Los chollos de la semana</h1>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">{count} vuelos top detectados por nuestro motor</p>
            </td>
          </tr>

          <!-- Deals -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                {rows}
              </table>
            </td>
          </tr>

          <!-- CTA intermedio -->
          <tr>
            <td style="padding:24px;text-align:center;background:#fefce8;border-top:1px solid #fde68a;">
              <p style="margin:0 0 12px;color:#713f12;font-size:14px;font-weight:600;">
                ¿Quieres recibir los chollos al instante?
              </p>
              <a href="{BASE_URL}/telegram" style="display:inline-block;padding:12px 28px;background:#0088cc;color:#fff;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;">
                Únete al canal Telegram
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px;text-align:center;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
                Enviado por TripCazador · <a href="{BASE_URL}" style="color:#6b7280;text-decoration:underline;">tripcazador.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">
                Recibes este email porque te suscribiste al boletín semanal.<br/>
                <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Dar de baja</a> ·
                <a href="{BASE_URL}/legal" style="color:#9ca3af;">Aviso legal</a> ·
                © {year} TripCazador
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def render_empty_digest() -> str:
    return render_digest([], limit=0).replace(
        'Los {} mejores chollos'.format(0),
        "Esta semana no hay chollos destacados — vuelve la próxima",
    )


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--deals", type=Path, default=DEFAULT_DEALS, help="Ruta a deals.json")
    p.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Fichero HTML de salida")
    p.add_argument("--limit", type=int, default=6, help="Top-N deals a incluir")
    p.add_argument("--dry-run", action="store_true", help="No escribe fichero, imprime a stdout")
    args = p.parse_args(argv)

    deals = load_deals(args.deals)
    html_out = render_digest(deals, limit=args.limit)

    if args.dry_run:
        print(html_out)
        return 0

    args.out.write_text(html_out, encoding="utf-8")
    print(f"Digest escrito en {args.out} ({len(html_out):,} bytes, {min(len(deals), args.limit)} deals)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
