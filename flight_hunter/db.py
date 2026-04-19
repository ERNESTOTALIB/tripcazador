"""
Flight Hunter V2 — SQLite Price History Database
==================================================
Stores all scraped flight prices for:
- Flash detection: compare current prices vs historical
- Trend analysis: track price movements over time
- Error detection: identify anomalies and error fares
- Deal tracking: maintain price history by route, airline, cabin
"""

import sqlite3
import json
from datetime import datetime, timedelta
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
        CREATE TABLE IF NOT EXISTS flights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            date_out TEXT NOT NULL,
            date_ret TEXT,
            price_eur REAL NOT NULL,
            airline TEXT NOT NULL,
            stops INTEGER DEFAULT 0,
            cabin TEXT DEFAULT 'economy',
            duration_minutes INTEGER,
            source TEXT,
            layovers TEXT,
            scraped_at TEXT NOT NULL,
            run_id TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_route_cabin
            ON flights(origin, destination, date_out, cabin);
        CREATE INDEX IF NOT EXISTS idx_airline_route
            ON flights(airline, origin, destination);
        CREATE INDEX IF NOT EXISTS idx_scraped
            ON flights(scraped_at);
        CREATE INDEX IF NOT EXISTS idx_run
            ON flights(run_id);
        CREATE INDEX IF NOT EXISTS idx_route_cabin_time ON flights(origin, destination, cabin, scraped_at);
        CREATE INDEX IF NOT EXISTS idx_price ON flights(price_eur);

        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            origins_searched TEXT,
            destinations_searched TEXT,
            cabins TEXT,
            techniques TEXT,
            total_flights INTEGER,
            anomalies_found INTEGER
        );

        CREATE TABLE IF NOT EXISTS flash_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            airline TEXT NOT NULL,
            price_current REAL NOT NULL,
            price_previous REAL NOT NULL,
            drop_pct REAL NOT NULL,
            detected_at TEXT NOT NULL,
            run_id TEXT
        );
    """)
    conn.commit()
    conn.close()


def save_flights(flights, run_id=None):
    """
    Save a batch of flight prices to the database.
    Deduplicates by (origin, destination, date_out, date_ret, airline, cabin, source).
    Returns count of saved records.
    """
    if not flights:
        return 0

    conn = get_connection()
    saved = 0

    for f in flights:
        try:
            # Check if this flight already exists (dedup)
            existing = conn.execute("""
                SELECT id FROM flights
                WHERE origin = ? AND destination = ? AND date_out = ?
                AND (date_ret = ? OR (date_ret IS NULL AND ? IS NULL))
                AND airline = ? AND cabin = ? AND source = ?
                ORDER BY scraped_at DESC LIMIT 1
            """, (
                f.get("origin"), f.get("destination"), f.get("date_out"),
                f.get("date_ret"), f.get("date_ret"),
                f.get("airline"), f.get("cabin", "economy"), f.get("source")
            )).fetchone()

            if existing:
                continue  # Skip duplicates

            conn.execute("""
                INSERT INTO flights
                (origin, destination, date_out, date_ret, price_eur, airline,
                 stops, cabin, duration_minutes, source, layovers, scraped_at, run_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f.get("origin"), f.get("destination"), f.get("date_out"),
                f.get("date_ret"), f.get("price_eur"), f.get("airline"),
                f.get("stops", 0), f.get("cabin", "economy"),
                f.get("duration_minutes"), f.get("source"),
                f.get("layovers"), f.get("scraped_at", datetime.now().isoformat()),
                run_id
            ))
            saved += 1
        except Exception as e:
            print(f"      ⚠️ DB error: {str(e)[:60]}", flush=True)

    conn.commit()
    conn.close()
    return saved


def start_run(origins, destinations, cabins, techniques):
    """
    Register a new search run.
    Returns run_id.
    """
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    conn = get_connection()
    conn.execute("""
        INSERT INTO runs (id, started_at, origins_searched, destinations_searched, cabins, techniques)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        datetime.now().isoformat(),
        json.dumps(origins) if isinstance(origins, list) else origins,
        json.dumps(destinations) if isinstance(destinations, list) else destinations,
        json.dumps(cabins) if isinstance(cabins, list) else cabins,
        json.dumps(techniques) if isinstance(techniques, list) else techniques
    ))
    conn.commit()
    conn.close()
    return run_id


def finish_run(run_id, total_flights, anomalies_found):
    """Mark run as complete with final statistics"""
    conn = get_connection()
    conn.execute("""
        UPDATE runs SET finished_at=?, total_flights=?, anomalies_found=?
        WHERE id=?
    """, (datetime.now().isoformat(), total_flights, anomalies_found, run_id))
    conn.commit()
    conn.close()


def get_historical_prices(origin, dest, cabin, days=30):
    """
    Get price history for a route.
    Returns list of price records from the last N days.
    """
    cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
    conn = get_connection()
    rows = conn.execute("""
        SELECT price_eur, scraped_at, airline, stops, duration_minutes
        FROM flights
        WHERE origin = ? AND destination = ? AND cabin = ?
        AND scraped_at > ?
        ORDER BY scraped_at DESC
    """, (origin, dest, cabin, cutoff_date)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_route_median(origin, dest, cabin, days=30):
    """
    Get median price for a route in the last N days.
    Returns median price or None if no data.
    """
    prices = [r["price_eur"] for r in get_historical_prices(origin, dest, cabin, days)]
    if not prices:
        return None
    prices.sort()
    n = len(prices)
    if n % 2 == 0:
        return (prices[n//2 - 1] + prices[n//2]) / 2
    else:
        return prices[n//2]


def detect_flash_drops(current_flights, min_drop_pct=20):
    """
    Compare current prices against historical prices (last 30 days).
    For each flight, find the median price for same route+cabin.
    If current price is min_drop_pct% below median → flash alert.

    Returns list of flash alert dicts with:
    - origin, destination, airline, price_current, price_previous, drop_pct
    - reason, classification (ERROR if >50%, ANOMALY if >35%, DEAL if >20%)
    """
    if not current_flights:
        return []

    conn = get_connection()
    alerts = []

    for flight in current_flights:
        try:
            origin = flight.get("origin")
            dest = flight.get("destination")
            cabin = flight.get("cabin", "economy")
            curr_price = flight.get("price_eur")
            airline = flight.get("airline")

            if not origin or not dest or not curr_price:
                continue

            # Get median price for this route+cabin in last 30 days
            median_price = get_route_median(origin, dest, cabin, days=30)

            if not median_price or median_price <= 0 or curr_price <= 0:
                continue

            # Calculate drop percentage
            drop_pct = ((median_price - curr_price) / median_price) * 100

            if drop_pct >= min_drop_pct:
                # Classify based on drop percentage
                if drop_pct >= 50:
                    classification = "ERROR"
                elif drop_pct >= 35:
                    classification = "ANOMALY"
                else:
                    classification = "DEAL"

                alert = {
                    "origin": origin,
                    "destination": dest,
                    "airline": airline,
                    "price_current": round(curr_price, 2),
                    "price_previous": round(median_price, 2),
                    "drop_pct": round(drop_pct, 1),
                    "reason": (
                        f"Price drop: {curr_price}€ vs {median_price:.0f}€ median → "
                        f"{drop_pct:.0f}% reduction"
                    ),
                    "classification": classification,
                    "detected_at": datetime.now().isoformat()
                }
                alerts.append(alert)

                # Save alert to database
                conn.execute("""
                    INSERT INTO flash_alerts
                    (origin, destination, airline, price_current, price_previous, drop_pct, detected_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    origin, dest, airline, curr_price, median_price, drop_pct,
                    datetime.now().isoformat()
                ))

        except Exception as e:
            print(f"      ⚠️ DB error: {str(e)[:60]}", flush=True)

    conn.commit()
    conn.close()
    return alerts


def get_cheapest_ever(origin, dest, cabin):
    """
    Get the cheapest price ever recorded for a specific route and cabin.
    Returns dict with price_eur, date_out, date_ret, airline, stops or None.
    """
    conn = get_connection()
    row = conn.execute("""
        SELECT price_eur, date_out, date_ret, airline, stops, scraped_at
        FROM flights
        WHERE origin = ? AND destination = ? AND cabin = ?
        ORDER BY price_eur ASC
        LIMIT 1
    """, (origin, dest, cabin)).fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def get_stats():
    """
    Return dict with database statistics:
    - total_prices: total flight records
    - unique_routes: unique (origin, destination) pairs
    - total_runs: total search runs
    - unique_airlines: number of distinct airlines
    """
    conn = get_connection()
    stats = {}

    stats["total_prices"] = conn.execute(
        "SELECT COUNT(*) FROM flights"
    ).fetchone()[0]

    stats["unique_routes"] = conn.execute(
        "SELECT COUNT(DISTINCT origin || destination) FROM flights"
    ).fetchone()[0]

    stats["total_runs"] = conn.execute(
        "SELECT COUNT(*) FROM runs"
    ).fetchone()[0]

    stats["unique_airlines"] = conn.execute(
        "SELECT COUNT(DISTINCT airline) FROM flights"
    ).fetchone()[0]

    stats["min_price"] = conn.execute("SELECT MIN(price_eur) FROM flights").fetchone()[0]
    stats["avg_price"] = conn.execute("SELECT AVG(price_eur) FROM flights").fetchone()[0]

    latest = conn.execute(
        "SELECT MAX(scraped_at) FROM flights"
    ).fetchone()[0]
    stats["latest_scrape"] = latest

    conn.close()
    return stats


def deduplicate_flights(flights):
    """Remove duplicate flights from different sources (same route+date+airline+price range)"""
    seen = {}
    unique = []
    for f in flights:
        key = (f.get("origin"), f.get("destination"), f.get("date_out"),
               f.get("date_ret"), f.get("airline"), f.get("cabin", "economy"))
        price = f.get("price_eur", 0)
        if key in seen:
            # Keep the one with more info or lower price
            if price < seen[key]["price_eur"]:
                seen[key] = f
        else:
            seen[key] = f
    return list(seen.values())
