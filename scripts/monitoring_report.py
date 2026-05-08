#!/usr/bin/env python3
"""
monitoring_report.py — SSS90 (May 2026)

Reporte unificado de monitoreo TripCazador.
Recopila en una sola corrida:
  1. Visitantes Cloudflare (24h, 7d, 30d) vía CF GraphQL Analytics API
  2. Eventos del tracker (clicks por tipo) vía /api/admin/events/aggregate
  3. Top deals clicados, top destinos, top rutas
  4. Suscriptores newsletter vía /api/admin/subscribers
  5. Suscriptores Telegram vía Bot API getChatMembersCount
  6. Seguidores Instagram vía Graph API
  7. IG history (posts publicados últimas 24h/7d)
  8. Push notification subscribers count

Env vars necesarios (todos opcionales — sólo skipea las secciones sin token):
  - SITE_URL              default https://tripcazador.com
  - ADMIN_TOKEN           para /api/admin/*
  - CF_API_TOKEN, CF_ZONE_ID  para Cloudflare
  - TG_BOT_TOKEN, TG_CHAT_ID  para Telegram
  - IG_USER_ID, IG_ACCESS_TOKEN  para Instagram

Uso local:
  TG_BOT_TOKEN=xxx ADMIN_TOKEN=yyy python scripts/monitoring_report.py

Uso GH Actions:
  Ver .github/workflows/monitoring-report.yml (workflow_dispatch).
  El output va al step summary (markdown) — usuario lo ve en la UI.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

SITE_URL = os.environ.get("SITE_URL", "https://tripcazador.com").rstrip("/")
# Backend VPS — los endpoints /api/admin/events/* usan ?token=... auth.
# (Los endpoints Vercel /api/admin/analytics requieren cookie de sesión
# de /panel login, que un script headless no tiene.)
API_BASE = os.environ.get("API_BASE", "https://api.tripcazador.com").rstrip("/")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "").strip()
CF_API_TOKEN = os.environ.get("CF_API_TOKEN", "").strip()
CF_ZONE_ID = os.environ.get("CF_ZONE_ID", "").strip()
TG_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "").strip()
TG_CHAT_ID = os.environ.get("TG_CHAT_ID", "@tripcazador").strip()
IG_USER_ID = os.environ.get("IG_USER_ID", "").strip()
IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()

UA = "TripCazador-Monitoring/1.0"


def http_get(url: str, headers: Dict[str, str] | None = None, timeout: int = 15) -> Any:
    h = {"User-Agent": UA}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def http_post(url: str, body: Dict[str, Any], headers: Dict[str, str] | None = None, timeout: int = 15) -> Any:
    h = {"User-Agent": UA, "Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


# ─────────── Cloudflare ───────────


def cf_visitors(hours: int) -> Optional[Dict[str, int]]:
    """Devuelve {requests, uniques, bytes} agregado en las últimas `hours`."""
    if not CF_API_TOKEN or not CF_ZONE_ID:
        return None
    since = (datetime.now(timezone.utc).timestamp() - hours * 3600)
    since_iso = datetime.fromtimestamp(since, tz=timezone.utc).isoformat()
    until_iso = datetime.now(timezone.utc).isoformat()
    query = """
    query ($zoneTag: String!, $since: Time!, $until: Time!) {
      viewer {
        zones(filter: {zoneTag: $zoneTag}) {
          httpRequests1dGroups(limit: 31, filter: {date_geq: "%s", date_leq: "%s"}) {
            sum { requests bytes }
            uniq { uniques }
          }
        }
      }
    }
    """ % (since_iso[:10], until_iso[:10])
    try:
        result = http_post(
            "https://api.cloudflare.com/client/v4/graphql",
            {"query": query, "variables": {"zoneTag": CF_ZONE_ID,
                                           "since": since_iso, "until": until_iso}},
            headers={"Authorization": f"Bearer {CF_API_TOKEN}"},
            timeout=20,
        )
        zones = result.get("data", {}).get("viewer", {}).get("zones", [])
        if not zones:
            return None
        groups = zones[0].get("httpRequests1dGroups", [])
        if not groups:
            return None
        total_req = sum(g.get("sum", {}).get("requests", 0) for g in groups)
        total_uniq = sum(g.get("uniq", {}).get("uniques", 0) for g in groups)
        total_bytes = sum(g.get("sum", {}).get("bytes", 0) for g in groups)
        return {
            "requests": total_req,
            "uniques": total_uniq,
            "bytes_gb": round(total_bytes / 1e9, 2),
        }
    except Exception as e:
        return {"error": str(e)[:120]}


# ─────────── Tracker / clicks ───────────


def admin_events(hours: int = 168) -> Optional[Dict[str, Any]]:
    """Eventos agregados desde backend VPS — endpoint usa ?token=auth."""
    if not ADMIN_TOKEN:
        return None
    try:
        # Llamar VPS DIRECTAMENTE — el proxy Vercel requiere cookie sesión.
        url = (
            f"{API_BASE}/api/admin/events/aggregate?"
            f"hours={hours}&token={urllib.parse.quote(ADMIN_TOKEN)}"
        )
        return http_get(url, timeout=20)
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code} {e.reason}"}
    except Exception as e:
        return {"error": str(e)[:120]}


def admin_subscribers() -> Optional[Dict[str, Any]]:
    if not ADMIN_TOKEN:
        return None
    try:
        # VPS endpoint directo
        url = f"{API_BASE}/api/admin/subscribers?token={urllib.parse.quote(ADMIN_TOKEN)}"
        return http_get(url, timeout=15)
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}"}
    except Exception as e:
        return {"error": str(e)[:120]}


# ─────────── Telegram ───────────


def telegram_subscribers() -> Optional[Dict[str, Any]]:
    """getChatMembersCount del canal vía Bot API."""
    if not TG_BOT_TOKEN:
        return None
    chat_id = TG_CHAT_ID if TG_CHAT_ID.startswith("@") or TG_CHAT_ID.startswith("-") else f"@{TG_CHAT_ID}"
    try:
        url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/getChatMembersCount?chat_id={urllib.parse.quote(chat_id)}"
        data = http_get(url, timeout=10)
        if data.get("ok"):
            return {"members": data.get("result", 0), "chat_id": chat_id}
        return {"error": data.get("description", "?")}
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}"}
    except Exception as e:
        return {"error": str(e)[:120]}


# ─────────── Instagram ───────────


def instagram_followers() -> Optional[Dict[str, Any]]:
    """Followers count vía Graph API IG Business account."""
    if not IG_USER_ID or not IG_ACCESS_TOKEN:
        return None
    try:
        url = (
            f"https://graph.facebook.com/v18.0/{IG_USER_ID}?"
            f"fields=username,followers_count,media_count&"
            f"access_token={urllib.parse.quote(IG_ACCESS_TOKEN)}"
        )
        data = http_get(url, timeout=10)
        return {
            "username": data.get("username", ""),
            "followers": data.get("followers_count", 0),
            "media_count": data.get("media_count", 0),
        }
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}"}
    except Exception as e:
        return {"error": str(e)[:120]}


# ─────────── Repo data (always available) ───────────


def repo_ig_history() -> Dict[str, Any]:
    p = Path("data/instagram_post_history.json")
    if not p.exists():
        return {"total": 0, "last_24h": 0, "last_7d": 0}
    try:
        with p.open() as f:
            h = json.load(f) or []
        now = time.time()
        last_24h = sum(1 for e in h if (now - float(e.get("timestamp", 0))) < 86400)
        last_7d = sum(1 for e in h if (now - float(e.get("timestamp", 0))) < 7 * 86400)
        unique_dests = len({(e.get("city_to") or "").lower() for e in h if e.get("city_to")})
        return {
            "total": len(h),
            "last_24h": last_24h,
            "last_7d": last_7d,
            "unique_destinations": unique_dests,
            "recent": [
                f"{datetime.fromtimestamp(float(e.get('timestamp', 0))).strftime('%Y-%m-%d %H:%M')} · "
                f"{e.get('city_from', '?')} → {e.get('city_to', '?')} · {e.get('price_eur', '?')}€"
                for e in h[-10:]
            ],
        }
    except Exception as e:
        return {"error": str(e)[:80]}


def repo_deals_summary() -> Dict[str, Any]:
    candidates = [
        Path("tripcazador-web/public/deals-latest.json"),
        Path("data/deals-latest.json"),
    ]
    deals = []
    for p in candidates:
        if p.exists():
            try:
                with p.open() as f:
                    d = json.load(f)
                deals = d if isinstance(d, list) else d.get("deals", [])
                break
            except Exception:
                continue
    if not deals:
        return {"total": 0}
    cabins: Dict[str, int] = {}
    dests: Dict[str, int] = {}
    avg_price = 0.0
    for x in deals:
        c = x.get("cabin", "unknown") or "unknown"
        cabins[c] = cabins.get(c, 0) + 1
        d = x.get("city_to") or x.get("destination") or "?"
        dests[d] = dests.get(d, 0) + 1
        avg_price += float(x.get("price_eur", 0) or 0)
    avg_price = round(avg_price / max(1, len(deals)), 2)
    top_dests = sorted(dests.items(), key=lambda kv: -kv[1])[:10]
    return {
        "total": len(deals),
        "avg_price_eur": avg_price,
        "by_cabin": dict(sorted(cabins.items(), key=lambda kv: -kv[1])),
        "top_destinations": top_dests,
    }


# ─────────── MAIN: report ───────────


def main() -> int:
    sections: List[str] = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sections.append(f"# 📊 Monitoreo TripCazador — {now}\n")

    # 1. Cloudflare
    sections.append("## 🌐 Tráfico web (Cloudflare)")
    if not CF_API_TOKEN:
        sections.append("_Sin CF_API_TOKEN — skip_\n")
    else:
        for label, hours in [("24h", 24), ("7 días", 168), ("30 días", 720)]:
            d = cf_visitors(hours)
            if d is None:
                sections.append(f"- **{label}**: sin datos\n")
            elif "error" in d:
                sections.append(f"- **{label}**: ⚠️ {d['error']}\n")
            else:
                sections.append(
                    f"- **{label}**: {d['requests']:,} requests · "
                    f"{d['uniques']:,} visitantes únicos · {d['bytes_gb']} GB\n"
                )

    # 2. Clicks
    sections.append("\n## 👆 Clicks + Eventos (backend VPS)")
    if not ADMIN_TOKEN:
        sections.append("_Sin ADMIN_TOKEN — skip_\n")
    else:
        ev = admin_events(hours=168)
        if ev and "error" not in ev:
            # Backend VPS shape: totals.{page_views,deal_clicks,searches,booking_redirects}
            totals = ev.get("totals", {})
            uniq = ev.get("unique_visitors", 0)
            sections.append(f"- **Visitantes únicos 7d**: {uniq:,}")
            if totals:
                sections.append(f"- **Page views**: {totals.get('page_views', 0):,}")
                sections.append(f"- **Deal clicks**: {totals.get('deal_clicks', 0):,}")
                sections.append(f"- **Búsquedas**: {totals.get('searches', 0):,}")
                sections.append(f"- **Booking redirects (→ partners)**: {totals.get('booking_redirects', 0):,}")
            sections.append("")
            top_routes = ev.get("top_routes", [])[:10]
            if top_routes:
                sections.append("- **Top 10 rutas más clicadas**:")
                for r in top_routes:
                    sections.append(f"  - `{r.get('route', '?')}`: {r.get('count', r.get('clicks', 0)):,} clicks")
                sections.append("")
            top_airlines = ev.get("top_airlines", [])[:5]
            if top_airlines:
                sections.append("- **Top 5 aerolíneas**:")
                for a in top_airlines:
                    sections.append(f"  - {a.get('airline', '?')}: {a.get('count', 0):,}")
                sections.append("")
            top_paths = ev.get("top_paths", [])[:10]
            if top_paths:
                sections.append("- **Top 10 páginas visitadas**:")
                for p in top_paths:
                    sections.append(f"  - `{p.get('path', '?')}`: {p.get('count', 0):,} views")
                sections.append("")
            top_calcs = ev.get("top_calcs", [])[:5]
            if top_calcs:
                sections.append("- **Top 5 calculadoras usadas**:")
                for c in top_calcs:
                    sections.append(f"  - {c.get('calc', '?')}: {c.get('count', 0):,}")
                sections.append("")
        else:
            sections.append(f"- ⚠️ {(ev or {}).get('error', 'sin respuesta')}\n")

    # 3. Suscriptores Newsletter
    sections.append("\n## ✉️ Newsletter")
    if not ADMIN_TOKEN:
        sections.append("_Sin ADMIN_TOKEN — skip_\n")
    else:
        s = admin_subscribers()
        if s and "error" not in s:
            sections.append(f"- **Activos**: {s.get('active_count', 0):,}")
            sections.append(f"- **Total históricos**: {s.get('total_count', 0):,}")
            sections.append(f"- **Bajas**: {s.get('unsubscribed_count', 0):,}")
            last = s.get('last_subscribed_at')
            if last:
                sections.append(f"- **Último alta**: {last}")
            sections.append("")
        else:
            sections.append(f"- ⚠️ {(s or {}).get('error', 'sin respuesta')}\n")

    # 4. Telegram
    sections.append("\n## 📨 Telegram")
    tg = telegram_subscribers()
    if tg is None:
        sections.append("_Sin TG_BOT_TOKEN — skip_\n")
    elif "error" in tg:
        sections.append(f"- ⚠️ {tg['error']}\n")
    else:
        sections.append(f"- **Canal**: {tg.get('chat_id', '?')}")
        sections.append(f"- **Suscriptores**: {tg.get('members', 0):,}\n")

    # 5. Instagram
    sections.append("\n## 📸 Instagram")
    ig = instagram_followers()
    if ig is None:
        sections.append("_Sin IG_USER_ID/IG_ACCESS_TOKEN — skip_\n")
    elif "error" in ig:
        sections.append(f"- ⚠️ {ig['error']}\n")
    else:
        sections.append(f"- **@{ig.get('username', 'tripcazador')}**")
        sections.append(f"- **Seguidores**: {ig.get('followers', 0):,}")
        sections.append(f"- **Posts publicados (lifetime)**: {ig.get('media_count', 0):,}\n")

    # 6. IG history (siempre disponible — del repo)
    sections.append("\n## 📅 Actividad IG (histórico repo)")
    h = repo_ig_history()
    sections.append(f"- **Total posts en historial**: {h.get('total', 0)}")
    sections.append(f"- **Últimas 24h**: {h.get('last_24h', 0)}")
    sections.append(f"- **Últimos 7 días**: {h.get('last_7d', 0)}")
    sections.append(f"- **Destinos únicos publicados**: {h.get('unique_destinations', 0)}")
    if h.get("recent"):
        sections.append("- **Últimos 10 posts**:")
        for r in h["recent"]:
            sections.append(f"  - {r}")
        sections.append("")

    # 7. Deals
    sections.append("\n## 💰 Catálogo de deals")
    d = repo_deals_summary()
    sections.append(f"- **Total deals frescos**: {d.get('total', 0):,}")
    if d.get("avg_price_eur"):
        sections.append(f"- **Precio medio**: {d['avg_price_eur']}€")
    if d.get("by_cabin"):
        cabins = ", ".join(f"{k}: {v}" for k, v in d["by_cabin"].items())
        sections.append(f"- **Por cabina**: {cabins}")
    if d.get("top_destinations"):
        sections.append("- **Top 10 destinos** (catálogo):")
        for dest, n in d["top_destinations"]:
            sections.append(f"  - {dest}: {n} deals")
        sections.append("")

    report = "\n".join(sections)
    print(report)

    # Si estamos en GH Actions, escribir al step summary
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        try:
            with open(summary_path, "a", encoding="utf-8") as f:
                f.write(report)
        except Exception as e:
            print(f"WARN: step summary write failed: {e}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
