-- Rollback for 0001_init.sql — drops all tables and enums in reverse dependency order.

DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS manual_overrides CASCADE;
DROP TABLE IF EXISTS ai_interpretations CASCADE;
DROP TABLE IF EXISTS prompt_templates CASCADE;
DROP TABLE IF EXISTS regime_thresholds CASCADE;
DROP TABLE IF EXISTS scoring_rules CASCADE;
DROP TABLE IF EXISTS snapshot_metrics CASCADE;
DROP TABLE IF EXISTS category_scores CASCADE;
DROP TABLE IF EXISTS metric_scores CASCADE;
DROP TABLE IF EXISTS metric_values CASCADE;
DROP TABLE IF EXISTS snapshots CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS data_sources CASCADE;

DROP TYPE IF EXISTS interpretation_type;
DROP TYPE IF EXISTS override_type;
DROP TYPE IF EXISTS snapshot_freshness;
DROP TYPE IF EXISTS snapshot_trend;
DROP TYPE IF EXISTS metric_trend;
DROP TYPE IF EXISTS data_source_type;
DROP TYPE IF EXISTS reliability;
DROP TYPE IF EXISTS confidence;
DROP TYPE IF EXISTS freshness;
DROP TYPE IF EXISTS expected_frequency;
DROP TYPE IF EXISTS automation_status;
