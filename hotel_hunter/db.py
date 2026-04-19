"""
Hotel Deal Hunter — SQLite Price History (Improvement 5)
=========================================================
Stores all scraped prices in a local database for:
- Flash detection: compare current prices vs historical
- Trend analysis: track price movements over time
- Dedup: avoid re-alerting on same deals
"""

import sqlite3
import json
from datetime import datetime
from config import PRICE_DB_PATH


def get_connection():
    """Get SQLite connection with WAL mode for performance"""
    conn = sqlite3.connect(PRICE_DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist"""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_name TEXT NOT NULL,
            destination TEXT NOT NULL,
            checkin TEXT NOT NULL,
            checkout TEXT NOT NULL,
            nights INTEGER,
            price_total REAL NOT NULL,
            price_per_night REAL,
            stars INTEGER,
            score REAL,
            adults INTEGER DEFAULT 2,
            no_rooms INTEGER DEFAULT 1,
            currency TEXT DEFAULT 'EUR',
            link TEXT,
            scraped_at TEXT NOT NULL,
            search_run_id TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_hotel_dest
            ON price_history(hotel_name, destination);
        CREATE INDEX IF NOT EXISTS idx_hotel_dest_checkin
            ON price_history(hotel_name, destination, checkin);
        CREATE INDEX IF NOT EXISTS idx_checkin
            ON price_history(checkin);
        CREATE INDEX IF NOT EXISTS idx_scraped
            ON price_history(scraped_at);
        CREATE INDEX IF NOT EXISTS idx_run
            ON price_history(search_run_id);

        CREATE TABLE IF NOT EXISTS search_runs (
            run_id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            destinations TEXT,
            checkin TEXT,
            nights INTEGER,
            techniques TEXT,
            total_hotels INTEGER,
            anomalies_found INTEGER
        );

        CREATE TABLE IF NOT EXISTS flash_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_name TEXT NOT NULL,
            destination TEXT NOT NULL,
            checkin TEXT NOT NULL,
            current_price REAL NOT NULL,
            previous_price REAL NOT NULL,
            drop_pct REAL NOT NULL,
            detected_at TEXT NOT NULL,
            acknowledged INTEGER DEFAULT 0
        );
    """)
    conn.commit()
    conn.close()


def save_hotels(hotels, run_id=None):
    """Save a batch of hotel prices to the database"""
    if not hotels:
        return 0

    conn = get_connection()
    saved = 0
    for h in hotels:
        try:
            nights = 7
            if h.get("checkin") and h.get("checkout"):
                from datetime import datetime as dt
                ci = dt.strptime(h["checkin"], "%Y-%m-%d")
                co = dt.strptime(h["checkout"], "%Y-%m-%d")
                nights = (co - ci).days

            conn.execute("""
                INSERT INTO price_history
                (hotel_name, destination, checkin, checkout, nights, price_total,
                 price_per_night, stars, score, adults, no_rooms, currency, link,
                 scraped_at, search_run_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                h["name"], h["destination"], h.get("checkin", ""),
                h.get("checkout", ""), nights, h["price_total"],
                round(h["price_total"] / max(1, nights), 2),
                h.get("stars", 0), h.get("score", 0),
                h.get("adults", 2), h.get("no_rooms", 1),
                h.get("currency", "EUR"), h.get("link", ""),
                h.get("scraped_at", datetime.now().isoformat()),
                run_id
            ))
            saved += 1
        except Exception as e:
            print(f"      ⚠️ Detection error: {str(e)[:60]}", flush=True)

    conn.commit()
    conn.close()
    return saved


def start_run(destinations, checkin, nights, techniques):
    """Register a new search run"""
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    conn = get_connection()
    conn.execute("""
        INSERT INTO search_runs (run_id, started_at, destinations, checkin, nights, techniques)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (run_id, datetime.now().isoformat(),
          json.dumps(destinations), checkin, nights,
          json.dumps(techniques)))
    conn.commit()
    conn.close()
    return run_id


def finish_run(run_id, total_hotels, anomalies_found):
    """Update run with final stats"""
    conn = get_connection()
    conn.execute("""
        UPDATE search_runs SET finished_at=?, total_hotels=?, anomalies_found=?
        WHERE run_id=?
    """, (datetime.now().isoformat(), total_hotels, anomalies_found, run_id))
    conn.commit()
    conn.close()


def detect_flash_drops(current_hotels, min_drop_pct=25):
    """
    Compare current prices against historical prices.
    If a hotel's price dropped 25%+ since last seen → flash deal.
    Returns list of flash alerts.
    """
    if not current_hotels:
        return []

    conn = get_connection()
    alerts = []

    for h in current_hotels:
        try:
            # Get the most recent previous price for this hotel+destination+dates
            row = conn.execute("""
                SELECT price_total, scraped_at
                FROM price_history
                WHERE hotel_name = ? AND destination = ? AND checkin = ?
                AND scraped_at < ?
                ORDER BY scraped_at DESC
                LIMIT 1
            """, (h["name"], h["destination"], h.get("checkin", ""),
                  h.get("scraped_at", datetime.now().isoformat()))).fetchone()

            if not row:
                continue

            prev_price = row["price_total"]
            curr_price = h["price_total"]

            if prev_price <= 0 or curr_price <= 0:
                continue

            drop_pct = ((prev_price - curr_price) / prev_price) * 100

            if drop_pct >= min_drop_pct:
                nights = 7
                if h.get("checkin") and h.get("checkout"):
                    from datetime import datetime as dt
                    ci = dt.strptime(h["checkin"], "%Y-%m-%d")
                    co = dt.strptime(h["checkout"], "%Y-%m-%d")
                    nights = (co - ci).days

                alert = {
                    "hotel": h["name"],
                    "destination": h["destination"],
                    "stars": h.get("stars", 0),
                    "score": h.get("score", 0),
                    "price_total": curr_price,
                    "price_per_night": round(curr_price / max(1, nights), 1),
                    "previous_price": prev_price,
                    "drop_pct": round(drop_pct, 1),
                    "previous_date": row["scraped_at"],
                    "nights": nights,
                    "link": h.get("link", ""),
                    "sea": h.get("sea", False),
                    "checkin": h.get("checkin", ""),
                    "checkout": h.get("checkout", ""),
                    "type": "FLASH_DROP",
                    "classification": "ERROR" if drop_pct >= 50 else ("ANOMALY" if drop_pct >= 35 else "DEAL"),
                    "reason": (
                        f"📉 CAÍDA DE PRECIO: {curr_price}€ vs {prev_price}€ anterior → "
                        f"{drop_pct:.0f}% de bajada desde {row['scraped_at'][:10]}"
                    ),
                }
                alerts.append(alert)

                # Save alert
                conn.execute("""
                    INSERT INTO flash_alerts
                    (hotel_name, destination, checkin, current_price, previous_price, drop_pct, detected_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (h["name"], h["destination"], h.get("checkin", ""),
                      curr_price, prev_price, drop_pct,
                      datetime.now().isoformat()))

        except Exception as e:
            print(f"      ⚠️ Detection error: {str(e)[:60]}", flush=True)

    conn.commit()
    conn.close()
    return alerts


def get_price_history(hotel_name, destination, limit=20):
    """Get price history for a specific hotel"""
    conn = get_connection()
    rows = conn.execute("""
        SELECT price_total, checkin, scraped_at, nights, currency
        FROM price_history
        WHERE hotel_name = ? AND destination = ?
        ORDER BY scraped_at DESC
        LIMIT ?
    """, (hotel_name, destination, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_stats():
    """Get database statistics"""
    conn = get_connection()
    stats = {}
    stats["total_prices"] = conn.execute("SELECT COUNT(*) FROM price_history").fetchone()[0]
    stats["total_runs"] = conn.execute("SELECT COUNT(*) FROM search_runs").fetchone()[0]
    stats["total_alerts"] = conn.execute("SELECT COUNT(*) FROM flash_alerts").fetchone()[0]
    stats["unique_hotels"] = conn.execute(
        "SELECT COUNT(DISTINCT hotel_name || destination) FROM price_history"
    ).fetchone()[0]
    latest = conn.execute(
        "SELECT MAX(scraped_at) FROM price_history"
    ).fetchone()[0]
    stats["latest_scrape"] = latest
    conn.close()
    return stats
