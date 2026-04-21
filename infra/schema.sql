-- =========================================================================
-- DeepTrace — Core Schema
-- This is the reference schema. SQLAlchemy models mirror this exactly.
-- For PostgreSQL (Render) / Cloud Spanner migration, adapt types as needed.
-- =========================================================================

-- Assets: every piece of protected media
CREATE TABLE IF NOT EXISTS assets (
    asset_id        VARCHAR(36) PRIMARY KEY,
    owner_id        VARCHAR(128) NOT NULL,
    fingerprint_hash VARCHAR(256) NOT NULL,
    embedding_metadata JSON,
    license_rules   JSON,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_assets_owner ON assets(owner_id);
CREATE INDEX IF NOT EXISTS ix_assets_fingerprint ON assets(fingerprint_hash);

-- Detections: every time a watermarked asset is found in the wild
CREATE TABLE IF NOT EXISTS detections (
    detection_id      VARCHAR(36) PRIMARY KEY,
    asset_id          VARCHAR(36) NOT NULL REFERENCES assets(asset_id),
    platform          VARCHAR(64) NOT NULL,
    url               TEXT NOT NULL,
    confidence_score  REAL NOT NULL,
    detected_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    enforcement_status VARCHAR(32) NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS ix_detections_asset ON detections(asset_id);
CREATE INDEX IF NOT EXISTS ix_detections_platform_status
    ON detections(platform, enforcement_status);

-- Licenses: licensee-specific fingerprint variants
CREATE TABLE IF NOT EXISTS licenses (
    license_id            VARCHAR(36) PRIMARY KEY,
    licensee_identity     VARCHAR(256) NOT NULL,
    asset_id              VARCHAR(36) NOT NULL REFERENCES assets(asset_id),
    fingerprint_variant   VARCHAR(48) NOT NULL UNIQUE,
    territory_restrictions JSON,
    expiry_date           TIMESTAMP,
    mutated_watermark_hash VARCHAR(256)
);

CREATE INDEX IF NOT EXISTS ix_licenses_asset ON licenses(asset_id);
CREATE INDEX IF NOT EXISTS ix_licenses_fingerprint ON licenses(fingerprint_variant);
