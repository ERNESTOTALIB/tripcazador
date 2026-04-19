"""
Reprocess existing flight data from the SQLite database.
Useful when detection algorithms are improved — no API calls needed.
"""

import sqlite3
import json
from datetime import datetime
from collections import defaultdict
from config import PRICE_DB_PATH, REPORT_DIR
from detector import analyze_all, generate_report, rank_by_value, rank_cheapest
from db import get_stats, detect_flash_drops
import os


def load_flights_from_db(cabin_filter=None, days=30):
    """Load all flights from DB"""
    conn = sqlite3.connect(PRICE_DB_PATH)
    conn.row_factory = sqlite3.Row

    query = "SELECT * FROM flights"
    params = []

    if cabin_filter:
        query += " WHERE LOWER(cabin) = ?"
        params.append(cabin_filter.lower())

    rows = conn.execute(query, params).fetchall()
    conn.close()

    flights = []
    for r in rows:
        flights.append({
            "origin": r["origin"],
            "destination": r["destination"],
            "date_out": r["date_out"],
            "date_ret": r["date_ret"],
            "price_eur": r["price_eur"],
            "airline": r["airline"],
            "stops": r["stops"],
            "cabin": r["cabin"] or "Economy",
            "duration_minutes": r["duration_minutes"] or 0,
            "source": r["source"] or "serpapi_google_flights",
            "scraped_at": r["scraped_at"],
        })

    return flights


def main():
    print("\n" + "=" * 70)
    print("🔄 FLIGHT HUNTER V2 — Reprocess Existing Data")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"📁 DB: {PRICE_DB_PATH}")
    print()

    # Load all flights
    all_flights = load_flights_from_db()
    print(f"📊 {len(all_flights)} vuelos cargados de la base de datos")

    if not all_flights:
        print("❌ No hay datos en la base de datos. Ejecuta main.py primero.")
        return

    # Extract unique routes, origins, destinations, dates
    origins = sorted(set(f["origin"] for f in all_flights))
    destinations = sorted(set(f["destination"] for f in all_flights))
    dates_set = sorted(set(f["date_out"] for f in all_flights if f["date_out"]))

    print(f"   Orígenes: {', '.join(origins)}")
    print(f"   Destinos: {', '.join(destinations)}")
    print(f"   Fechas: {len(dates_set)} únicas")
    print()

    # Build flights_by_date for T1 detection
    flights_by_date = defaultdict(list)
    for f in all_flights:
        flights_by_date[f.get("date_out", "unknown")].append(f)

    # Build date_ranges
    date_ranges = [(d, None) for d in dates_set]

    # Run detection
    print("━" * 70)
    print("🧠 Anomaly Detection (6 técnicas)")
    print("━" * 70)

    # Flash detection
    flash_alerts = detect_flash_drops(all_flights, min_drop_pct=20)
    print(f"   Flash alerts: {len(flash_alerts)}")

    # Full analysis with cross-date data
    anomalies = analyze_all(
        all_flights,
        flights_by_date=dict(flights_by_date),
        date_ranges=date_ranges,
        cabin="economy",
    )

    errors = [a for a in anomalies if a["classification"] == "ERROR"]
    anomaly_list = [a for a in anomalies if a["classification"] == "ANOMALY"]
    deals = [a for a in anomalies if a["classification"] == "DEAL"]

    print(f"   🚨 ERRORES:     {len(errors)}")
    print(f"   ⚠️  ANOMALÍAS:   {len(anomaly_list)}")
    print(f"   💰 CHOLLOS:     {len(deals)}")
    print()

    # Rankings
    print("━" * 70)
    print("🎯 Rankings")
    print("━" * 70)

    top_value = rank_by_value(all_flights, top_n=30)
    top_cheap = rank_cheapest(all_flights, top_n=30)

    print(f"   ⭐ Top 30 por valor: {len(top_value)}")
    print(f"   💰 Top 30 más baratos: {len(top_cheap)}")

    # Print top 10 cheapest
    print()
    print("━" * 70)
    print("💵 TOP 10 MÁS BARATOS")
    print("━" * 70)
    for i, f in enumerate(top_cheap[:10], 1):
        stops_str = "directo" if f["stops"] == 0 else f"{f['stops']}esc"
        dur_h = f.get("duration_minutes", 0) // 60
        dur_m = f.get("duration_minutes", 0) % 60
        print(f"   {i:2d}. {f['origin']}→{f['destination']} {f['date_out']} | "
              f"{f['price_eur']:.0f}€ | {f['airline']} | {stops_str} | {dur_h}h{dur_m:02d}m")

    # Print anomalies
    if anomalies:
        print()
        print("━" * 70)
        print("🔍 ANOMALÍAS DETECTADAS")
        print("━" * 70)
        for a in anomalies[:15]:
            icon = {"ERROR": "🚨", "ANOMALY": "⚠️", "DEAL": "💰"}.get(a["classification"], "•")
            print(f"   {icon} [{a.get('type','?')}] {a.get('origin','?')}→{a.get('destination','?')} "
                  f"{a.get('date_out','?')} | {a.get('price_eur', 0):.0f}€ | {a.get('reason','')[:70]}")

    # Generate report
    print()
    print("━" * 70)
    print("📋 Report Generation")
    print("━" * 70)

    db_stats = get_stats()
    search_params = {
        "origins": origins,
        "destinations": destinations,
        "cabin": "Economy",
        "date_from": dates_set[0] if dates_set else "N/A",
        "date_to": dates_set[-1] if dates_set else "N/A",
    }

    report = generate_report(
        anomalies=anomalies,
        all_flights=all_flights,
        search_params=search_params,
        flash_alerts=flash_alerts,
        db_stats=db_stats,
        top_value=top_value,
        top_cheap=top_cheap,
    )

    report_path = os.path.join(REPORT_DIR, "FLIGHT_ERRORES_PRECIO.md")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"   ✅ Reporte guardado: {report_path}")

    # Summary
    print()
    print("=" * 70)
    print("📊 RESUMEN")
    print("=" * 70)
    print(f"   Total vuelos analizados: {len(all_flights)}")
    print(f"   Anomalías: {len(anomalies)} ({len(errors)} errores, {len(anomaly_list)} anomalías, {len(deals)} chollos)")
    print(f"   Flash alerts: {len(flash_alerts)}")
    if top_cheap:
        print(f"   Precio más bajo: {top_cheap[0]['origin']}→{top_cheap[0]['destination']} {top_cheap[0]['price_eur']:.0f}€")
    print()


if __name__ == "__main__":
    main()
