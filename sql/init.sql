-- ============================================================
-- TripCazador — PostgreSQL Schema
-- ============================================================
-- Ejecutar al inicializar el contenedor:
--   docker-compose exec db psql -U tripcazador -d tripcazador -f /docker-entrypoint-initdb.d/init.sql
-- O automáticamente si se monta en /docker-entrypoint-initdb.d/
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- para gen_random_uuid()

-- ============================================================
-- TABLA: flights
-- Registro completo de cada vuelo encontrado por el motor
-- ============================================================
CREATE TABLE IF NOT EXISTS flights (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    origin          CHAR(3)     NOT NULL,
    destination     CHAR(3)     NOT NULL,
    airline         VARCHAR(10),
    airline_name    VARCHAR(100),
    price_eur       NUMERIC(10,2) NOT NULL,
    cabin           VARCHAR(20)  DEFAULT 'economy',
    date_out        DATE         NOT NULL,
    date_back       DATE,
    nights          SMALLINT     DEFAULT 0,
    duration_min    SMALLINT     DEFAULT 0,
    booking_url     TEXT,
    source_engine   VARCHAR(30),  -- kiwi, ryanair, travelpayouts, serpapi, rapidapi, vueling
    found_at        TIMESTAMPTZ  DEFAULT NOW(),
    distance_cat    VARCHAR(20),  -- corto, medio, largo, ultra_largo
    region          VARCHAR(50),
    image_url       TEXT,
    lat             NUMERIC(8,4),
    lon             NUMERIC(8,4)
);

CREATE INDEX IF NOT EXISTS idx_flights_route    ON flights(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flights_date     ON flights(date_out);
CREATE INDEX IF NOT EXISTS idx_flights_price    ON flights(price_eur);
CREATE INDEX IF NOT EXISTS idx_flights_found_at ON flights(found_at DESC);
CREATE INDEX IF NOT EXISTS idx_flights_source   ON flights(source_engine);

-- ============================================================
-- TABLA: anomalies
-- Cada vuelo analizado con su clasificación y score
-- ============================================================
CREATE TABLE IF NOT EXISTS anomalies (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id       UUID        REFERENCES flights(id) ON DELETE CASCADE,
    classification  VARCHAR(20) NOT NULL,  -- CRÍTICO, ERROR, ANOMALÍA, OFERTA, NORMAL
    score           NUMERIC(6,2),
    techniques      SMALLINT    DEFAULT 0,
    ratio_be        NUMERIC(6,2),          -- ratio Business/Economy
    pct_below_med   NUMERIC(6,2),          -- % por debajo de la mediana histórica
    is_lowcost      BOOLEAN     DEFAULT FALSE,
    headline        TEXT,
    tags            TEXT[],                -- array de etiquetas
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_flight       ON anomalies(flight_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_class        ON anomalies(classification);
CREATE INDEX IF NOT EXISTS idx_anomalies_score        ON anomalies(score DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_created      ON anomalies(created_at DESC);

-- ============================================================
-- TABLA: price_history
-- Historial de precios por ruta — base para comparar y detectar anomalías
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
    id              BIGSERIAL   PRIMARY KEY,
    origin          CHAR(3)     NOT NULL,
    destination     CHAR(3)     NOT NULL,
    cabin           VARCHAR(20) DEFAULT 'economy',
    date_out        DATE        NOT NULL,
    price_eur       NUMERIC(10,2) NOT NULL,
    source          VARCHAR(30),
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ph_route     ON price_history(origin, destination, cabin);
CREATE INDEX IF NOT EXISTS idx_ph_date_out  ON price_history(date_out);
CREATE INDEX IF NOT EXISTS idx_ph_recorded  ON price_history(recorded_at DESC);

-- ============================================================
-- TABLA: deals
-- Deals unificados y deduplicados listos para servir en la API
-- (equivalente a deals.json pero persistido en DB)
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_type       VARCHAR(10) DEFAULT 'flight',  -- flight | hotel
    origin          CHAR(3),
    destination     CHAR(3)     NOT NULL,
    airline         VARCHAR(10),
    price_eur       NUMERIC(10,2) NOT NULL,
    cabin           VARCHAR(20) DEFAULT 'economy',
    date_out        DATE,
    date_back       DATE,
    nights          SMALLINT    DEFAULT 0,
    duration_min    SMALLINT    DEFAULT 0,
    classification  VARCHAR(20),
    score           NUMERIC(6,2),
    headline        TEXT,
    tags            TEXT[],
    image_url       TEXT,
    lat             NUMERIC(8,4),
    lon             NUMERIC(8,4),
    booking_url     TEXT,
    verified        BOOLEAN     DEFAULT FALSE,   -- 2+ fuentes confirman precio ±10%
    price_per_night NUMERIC(10,2),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_dest        ON deals(destination);
CREATE INDEX IF NOT EXISTS idx_deals_class       ON deals(classification);
CREATE INDEX IF NOT EXISTS idx_deals_score       ON deals(score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_price       ON deals(price_eur);
CREATE INDEX IF NOT EXISTS idx_deals_created     ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_expires     ON deals(expires_at);
CREATE INDEX IF NOT EXISTS idx_deals_verified    ON deals(verified);

-- ============================================================
-- TABLA: hotels
-- Hoteles encontrados por hotel_hunter (Booking.com scraper)
-- ============================================================
CREATE TABLE IF NOT EXISTS hotels (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_name      VARCHAR(200) NOT NULL,
    destination     CHAR(3),
    city            VARCHAR(100),
    country         VARCHAR(100),
    stars           SMALLINT,
    review_score    NUMERIC(3,1),
    review_count    INTEGER,
    price_eur       NUMERIC(10,2),
    price_original  NUMERIC(10,2),   -- precio sin descuento
    discount_pct    NUMERIC(5,1),    -- % de descuento
    check_in        DATE,
    check_out       DATE,
    nights          SMALLINT,
    image_url       TEXT,
    booking_url     TEXT,            -- link afiliado Booking.com
    classification  VARCHAR(20),     -- CRÍTICO, ERROR, ANOMALÍA, OFERTA
    score           NUMERIC(6,2),
    is_beachfront   BOOLEAN     DEFAULT FALSE,
    is_all_inclusive BOOLEAN    DEFAULT FALSE,
    amenities       TEXT[],
    found_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_dest      ON hotels(destination);
CREATE INDEX IF NOT EXISTS idx_hotels_price     ON hotels(price_eur);
CREATE INDEX IF NOT EXISTS idx_hotels_class     ON hotels(classification);
CREATE INDEX IF NOT EXISTS idx_hotels_score     ON hotels(score DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_found_at  ON hotels(found_at DESC);

-- ============================================================
-- TABLA: user_alerts
-- Alertas configuradas por usuarios (precio máximo por ruta)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_alerts (
    id              BIGSERIAL   PRIMARY KEY,
    email           VARCHAR(200),
    telegram_chat   VARCHAR(100),    -- chat_id de Telegram del usuario
    origin          CHAR(3),
    destination     CHAR(3),
    max_price       NUMERIC(10,2),
    cabin           VARCHAR(20)  DEFAULT 'economy',
    alert_type      VARCHAR(20)  DEFAULT 'flight',  -- flight | hotel | both
    active          BOOLEAN     DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_notified   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_email     ON user_alerts(email);
CREATE INDEX IF NOT EXISTS idx_alerts_route     ON user_alerts(origin, destination);
CREATE INDEX IF NOT EXISTS idx_alerts_active    ON user_alerts(active);

-- ============================================================
-- TABLA: notification_log
-- Log de cada alerta enviada (evitar duplicados + métricas)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_log (
    id              BIGSERIAL   PRIMARY KEY,
    alert_id        BIGINT      REFERENCES user_alerts(id) ON DELETE SET NULL,
    deal_id         UUID,
    channel         VARCHAR(20),     -- telegram | email
    sent_at         TIMESTAMPTZ DEFAULT NOW(),
    price_eur       NUMERIC(10,2),
    origin          CHAR(3),
    destination     CHAR(3)
);

CREATE INDEX IF NOT EXISTS idx_notif_alert   ON notification_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_notif_sent_at ON notification_log(sent_at DESC);

-- ============================================================
-- TABLA: api_calls_log
-- Audit log de cada llamada a APIs externas
-- ============================================================
CREATE TABLE IF NOT EXISTS api_calls_log (
    id              BIGSERIAL   PRIMARY KEY,
    engine          VARCHAR(30) NOT NULL,   -- kiwi, ryanair, serpapi, etc.
    origin          CHAR(3),
    destination     CHAR(3),
    status_code     SMALLINT,
    results_count   SMALLINT    DEFAULT 0,
    duration_ms     INTEGER,
    error_msg       TEXT,
    called_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apicalls_engine  ON api_calls_log(engine);
CREATE INDEX IF NOT EXISTS idx_apicalls_called  ON api_calls_log(called_at DESC);

-- ============================================================
-- VISTA: top_deals_today
-- Top 20 deals activos del día ordenados por score
-- ============================================================
CREATE OR REPLACE VIEW top_deals_today AS
SELECT
    d.id,
    d.deal_type,
    d.origin,
    d.destination,
    d.airline,
    d.price_eur,
    d.cabin,
    d.date_out,
    d.nights,
    d.classification,
    d.score,
    d.headline,
    d.tags,
    d.image_url,
    d.booking_url,
    d.verified,
    d.expires_at
FROM deals d
WHERE
    d.expires_at > NOW()
    AND d.price_eur > 0
    AND d.classification IN ('CRÍTICO', 'ERROR', 'ANOMALÍA', 'OFERTA')
ORDER BY d.score DESC, d.price_eur ASC
LIMIT 20;

-- ============================================================
-- VISTA: price_stats_by_route
-- Estadísticas de precio por ruta (para el detector de anomalías)
-- ============================================================
CREATE OR REPLACE VIEW price_stats_by_route AS
SELECT
    origin,
    destination,
    cabin,
    COUNT(*)                        AS sample_size,
    MIN(price_eur)                  AS price_min,
    MAX(price_eur)                  AS price_max,
    ROUND(AVG(price_eur), 2)        AS price_avg,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_eur)::NUMERIC, 2) AS price_median,
    ROUND(STDDEV(price_eur)::NUMERIC, 2) AS price_stddev,
    MAX(recorded_at)                AS last_seen
FROM price_history
WHERE recorded_at > NOW() - INTERVAL '90 days'
GROUP BY origin, destination, cabin
HAVING COUNT(*) >= 5;

-- ============================================================
-- Datos iniciales: aerolíneas conocidas (para joins)
-- ============================================================
CREATE TABLE IF NOT EXISTS airlines (
    iata_code   CHAR(2)     PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    is_lowcost  BOOLEAN     DEFAULT FALSE,
    logo_url    TEXT,
    website     TEXT
);

INSERT INTO airlines (iata_code, name, is_lowcost) VALUES
    ('FR', 'Ryanair',       TRUE),
    ('U2', 'easyJet',       TRUE),
    ('W6', 'Wizz Air',      TRUE),
    ('VY', 'Vueling',       TRUE),
    ('V7', 'Volotea',       TRUE),
    ('EW', 'Eurowings',     FALSE),
    ('LH', 'Lufthansa',     FALSE),
    ('LX', 'Swiss',         FALSE),
    ('OS', 'Austrian',      FALSE),
    ('BA', 'British Airways',FALSE),
    ('AF', 'Air France',    FALSE),
    ('KL', 'KLM',           FALSE),
    ('IB', 'Iberia',        FALSE),
    ('ET', 'Ethiopian Airlines', FALSE),
    ('KQ', 'Kenya Airways', FALSE),
    ('TK', 'Turkish Airlines', FALSE),
    ('EK', 'Emirates',      FALSE),
    ('QR', 'Qatar Airways', FALSE),
    ('EY', 'Etihad',        FALSE),
    ('SQ', 'Singapore Airlines', FALSE)
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================================
-- Función: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLA: subscribers (newsletter)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscribers (
    id              BIGSERIAL    PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    source          VARCHAR(40)  DEFAULT 'web',
    subscribed_at   TIMESTAMPTZ  DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    confirmed       BOOLEAN      DEFAULT FALSE,
    confirm_token   VARCHAR(64),
    ip_hash         BIGINT
);
CREATE INDEX IF NOT EXISTS idx_subs_email       ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subs_confirmed   ON subscribers(confirmed) WHERE unsubscribed_at IS NULL;

-- ============================================================
-- Mensaje de confirmación
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '✅ TripCazador schema inicializado correctamente';
    RAISE NOTICE '   Tablas: flights, anomalies, price_history, deals, hotels, user_alerts, notification_log, api_calls_log, airlines, subscribers';
    RAISE NOTICE '   Vistas: top_deals_today, price_stats_by_route';
END $$;
