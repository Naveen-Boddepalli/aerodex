-- AeroDex schema — plan §5.3 (three tables, not one) and §5.4 (job queue).
-- PostgreSQL 16 + TimescaleDB Community.
--
-- Invariant that M6 depends on: quote_raw is APPEND-ONLY. It is never updated
-- and never deleted from. A trigger enforces this rather than trusting review.

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------------
-- 1. quote_raw — one row per observation as parsed. Immutable.
-- --------------------------------------------------------------------------

CREATE TYPE collection_slot AS ENUM ('morning', 'afternoon', 'evening');

CREATE TABLE IF NOT EXISTS quote_raw (
    id              BIGSERIAL,
    collected_at    TIMESTAMPTZ NOT NULL,      -- ACTUAL time, never the nominal slot
    slot            collection_slot NOT NULL,  -- nominal slot this belongs to
    source          TEXT NOT NULL,
    origin          CHAR(3) NOT NULL,
    destination     CHAR(3) NOT NULL,
    departure_date  DATE NOT NULL,
    horizon_days    SMALLINT NOT NULL,
    cabin           TEXT NOT NULL DEFAULT 'economy',

    -- fare, all-inclusive (taxes + surcharges), minor units (paise) to avoid float
    fare_inr_paise  BIGINT NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'INR',

    -- itinerary attributes (hedonic characteristics)
    carrier            TEXT,
    flight_number      TEXT,
    stops              SMALLINT,
    departure_time     TIME,
    arrival_time       TIME,
    duration_minutes   INTEGER,
    aircraft_type      TEXT,
    fare_brand         TEXT,
    is_refundable      BOOLEAN,
    baggage_included   BOOLEAN,
    seats_remaining    SMALLINT,

    -- M6: the payload is archived, the raw body is not redistributed (plan §7).
    payload         JSONB NOT NULL,
    raw_sha256      CHAR(64) NOT NULL,   -- hash of the raw response
    adapter_version TEXT NOT NULL,
    acquisition_tier SMALLINT NOT NULL,  -- 1=public JSON, 2=XHR, 3=render (§5.2)

    PRIMARY KEY (id, collected_at)
);

SELECT create_hypertable('quote_raw', 'collected_at',
                         chunk_time_interval => INTERVAL '7 days',
                         if_not_exists => TRUE);

-- Native compression on chunks older than 30 days: 8-15x on this shape (§5.3).
ALTER TABLE quote_raw SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'source, origin, destination',
    timescaledb.compress_orderby   = 'collected_at DESC'
);
SELECT add_compression_policy('quote_raw', INTERVAL '30 days', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS quote_raw_stratum_idx
    ON quote_raw (origin, destination, horizon_days, collected_at DESC);
CREATE INDEX IF NOT EXISTS quote_raw_source_idx
    ON quote_raw (source, collected_at DESC);

-- Never mutate quote_raw. M6 depends on it (plan §5.3).
CREATE OR REPLACE FUNCTION quote_raw_is_append_only() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'quote_raw is append-only (plan §5.3); % rejected', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quote_raw_no_mutate ON quote_raw;
CREATE TRIGGER quote_raw_no_mutate
    BEFORE UPDATE OR DELETE ON quote_raw
    FOR EACH ROW EXECUTE FUNCTION quote_raw_is_append_only();

-- TRUNCATE bypasses row-level triggers, so it needs a statement-level one.
-- Without this the append-only guarantee has a one-word hole in it.
DROP TRIGGER IF EXISTS quote_raw_no_truncate ON quote_raw;
CREATE TRIGGER quote_raw_no_truncate
    BEFORE TRUNCATE ON quote_raw
    FOR EACH STATEMENT EXECUTE FUNCTION quote_raw_is_append_only();

-- --------------------------------------------------------------------------
-- 2. quote_clean — normalised, deduplicated, attribute-tagged.
-- --------------------------------------------------------------------------

CREATE TYPE validation_status AS ENUM ('valid', 'quarantined', 'rejected');

CREATE TABLE IF NOT EXISTS quote_clean (
    id              BIGSERIAL,
    raw_id          BIGINT NOT NULL,
    collected_at    TIMESTAMPTZ NOT NULL,
    slot            collection_slot NOT NULL,
    source          TEXT NOT NULL,
    origin          CHAR(3) NOT NULL,
    destination     CHAR(3) NOT NULL,
    departure_date  DATE NOT NULL,
    horizon_days    SMALLINT NOT NULL,
    cabin           TEXT NOT NULL,

    fare_inr_paise  BIGINT NOT NULL,

    carrier                TEXT,
    carrier_type           TEXT,      -- full_service | low_cost
    stops                  SMALLINT,
    departure_time_bucket  TEXT,      -- early_morning|morning|afternoon|evening|night
    duration_minutes       INTEGER,
    is_refundable          BOOLEAN,
    baggage_included       BOOLEAN,

    -- stable identity of the itinerary, for matched-model comparison
    itinerary_key   TEXT NOT NULL,
    validation_status validation_status NOT NULL DEFAULT 'valid',
    quarantine_reason TEXT,

    PRIMARY KEY (id, collected_at),
    UNIQUE (itinerary_key, collected_at, source)
);

SELECT create_hypertable('quote_clean', 'collected_at',
                         chunk_time_interval => INTERVAL '7 days',
                         if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS quote_clean_panel_idx
    ON quote_clean (origin, destination, horizon_days, collected_at DESC)
    WHERE validation_status = 'valid';

-- --------------------------------------------------------------------------
-- 3. index_point — published values. Every row carries its provenance.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS index_point (
    id              BIGSERIAL PRIMARY KEY,
    period          DATE NOT NULL,              -- the period the value describes
    frequency       TEXT NOT NULL,              -- daily | weekly | monthly
    series          TEXT NOT NULL,              -- headline | route:DEL-BOM | horizon:7 ...
    value           NUMERIC(12,6) NOT NULL,
    value_sa        NUMERIC(12,6),              -- seasonally adjusted, if applicable

    -- M5: published, never silently absorbed.
    imputed_weight_share NUMERIC(6,5) NOT NULL,
    coverage_ratio       NUMERIC(6,5) NOT NULL,
    n_quotes             INTEGER NOT NULL,

    -- M6: these three make a number reproducible.
    config_hash     CHAR(64) NOT NULL,
    weights_vintage TEXT NOT NULL,
    panel_hash      CHAR(64) NOT NULL,

    is_provisional  BOOLEAN NOT NULL DEFAULT TRUE,
    revision_of     BIGINT REFERENCES index_point(id),
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (period, frequency, series, config_hash)
);

CREATE INDEX IF NOT EXISTS index_point_series_idx ON index_point (series, frequency, period DESC);

-- --------------------------------------------------------------------------
-- 4. job — the queue. Postgres FOR UPDATE SKIP LOCKED (plan §5.4).
-- --------------------------------------------------------------------------

CREATE TYPE job_status AS ENUM ('pending', 'running', 'done', 'failed', 'dead');

CREATE TABLE IF NOT EXISTS job (
    id              BIGSERIAL PRIMARY KEY,
    kind            TEXT NOT NULL,              -- collect | index | publish
    payload         JSONB NOT NULL,
    status          job_status NOT NULL DEFAULT 'pending',

    scheduled_for   TIMESTAMPTZ NOT NULL,       -- nominal slot time
    slot            collection_slot,
    source          TEXT,

    attempts        SMALLINT NOT NULL DEFAULT 0,
    max_attempts    SMALLINT NOT NULL DEFAULT 3,
    last_error      TEXT,
    locked_at       TIMESTAMPTZ,
    locked_by       TEXT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- one job per stratum-slot; makes enqueue idempotent
    UNIQUE (kind, scheduled_for, payload)
);

CREATE INDEX IF NOT EXISTS job_dequeue_idx
    ON job (kind, scheduled_for)
    WHERE status = 'pending';

-- --------------------------------------------------------------------------
-- 5. adapter_health — M3 instrumentation (plan §9).
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS adapter_health (
    id              BIGSERIAL PRIMARY KEY,
    source          TEXT NOT NULL,
    slot            collection_slot NOT NULL,
    observed_on     DATE NOT NULL,
    scheduled       INTEGER NOT NULL,
    succeeded       INTEGER NOT NULL,
    failed          INTEGER NOT NULL,
    tier_used       SMALLINT,
    p50_latency_ms  INTEGER,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source, slot, observed_on)
);
