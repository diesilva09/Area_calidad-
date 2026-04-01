CREATE SCHEMA IF NOT EXISTS verificacion_bpm;

CREATE TABLE IF NOT EXISTS verificacion_bpm.notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    dedupe_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON verificacion_bpm.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON verificacion_bpm.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON verificacion_bpm.notifications(entity_type, entity_id);
