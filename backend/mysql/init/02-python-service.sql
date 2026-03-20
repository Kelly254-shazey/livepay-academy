USE livegate_python;

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    snapshot_type VARCHAR(64) NOT NULL,
    payload JSON NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analytics_snapshots_type_generated (snapshot_type, generated_at)
);

CREATE TABLE IF NOT EXISTS recommendation_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id VARCHAR(191) NOT NULL,
    recommendation_scope VARCHAR(64) NOT NULL,
    payload JSON NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recommendation_snapshots_scope_generated (recommendation_scope, generated_at),
    INDEX idx_recommendation_snapshots_subject_scope_generated (subject_id, recommendation_scope, generated_at)
);

CREATE TABLE IF NOT EXISTS ranking_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ranking_scope VARCHAR(64) NOT NULL,
    subject_id VARCHAR(191) NULL,
    payload JSON NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ranking_snapshots_scope_generated (ranking_scope, generated_at),
    INDEX idx_ranking_snapshots_subject_generated (subject_id, generated_at)
);

CREATE TABLE IF NOT EXISTS trend_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trend_scope VARCHAR(64) NOT NULL,
    period_key VARCHAR(64) NOT NULL,
    payload JSON NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trend_snapshots_scope_period_generated (trend_scope, period_key, generated_at)
);

CREATE TABLE IF NOT EXISTS creator_insight_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    creator_id VARCHAR(191) NOT NULL,
    insight_type VARCHAR(64) NOT NULL,
    payload JSON NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_creator_insight_creator_type_generated (creator_id, insight_type, generated_at)
);

CREATE TABLE IF NOT EXISTS fraud_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    payload JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fraud_events_type_created (event_type, created_at)
);

CREATE TABLE IF NOT EXISTS moderation_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(64) NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    payload JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moderation_events_type_created (content_type, created_at)
);

CREATE TABLE IF NOT EXISTS job_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    details JSON NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL,
    INDEX idx_job_runs_name_started (job_name, started_at)
);
