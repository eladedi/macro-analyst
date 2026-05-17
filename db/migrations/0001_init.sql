-- Macro Market Regime Monitor — initial schema
-- Spec ref: MVP Technical Spec v0.1 §8 (full data model)
-- 14 tables + enums + foreign keys + unique(metric_id, timestamp, source_id)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE automation_status AS ENUM ('automatic', 'semi', 'manual');
CREATE TYPE expected_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE freshness AS ENUM ('fresh', 'delayed', 'stale', 'manual');
CREATE TYPE confidence AS ENUM ('high', 'medium', 'low');
CREATE TYPE reliability AS ENUM ('high', 'medium', 'low');
CREATE TYPE data_source_type AS ENUM ('api', 'scrape', 'manual', 'embed');
CREATE TYPE metric_trend AS ENUM ('up', 'down', 'flat', 'unknown');
CREATE TYPE snapshot_trend AS ENUM ('improving', 'stable', 'deteriorating', 'unknown');
CREATE TYPE snapshot_freshness AS ENUM ('good', 'mixed', 'stale');
CREATE TYPE override_type AS ENUM ('value', 'score', 'weight', 'note');
CREATE TYPE interpretation_type AS ENUM ('daily', 'weekly', 'metric', 'crisis', 'comparison');

-- ---------------------------------------------------------------------------
-- §8.4 data_sources
-- ---------------------------------------------------------------------------
CREATE TABLE data_sources (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  type             data_source_type NOT NULL,
  base_url         text,
  requires_api_key boolean NOT NULL DEFAULT false,
  reliability      reliability NOT NULL DEFAULT 'medium',
  notes            text,
  enabled          boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.2 categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  weight        numeric NOT NULL DEFAULT 0,
  is_core       boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.3 metrics
-- ---------------------------------------------------------------------------
CREATE TABLE metrics (
  id                     text PRIMARY KEY,
  category_id            text NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name                   text NOT NULL,
  slug                   text NOT NULL UNIQUE,
  description            text,
  unit                   text,
  source_primary_id      text REFERENCES data_sources(id) ON DELETE SET NULL,
  source_fallback_id     text REFERENCES data_sources(id) ON DELETE SET NULL,
  source_symbol          text,
  metric_weight          numeric NOT NULL DEFAULT 0,
  automation_status      automation_status NOT NULL DEFAULT 'automatic',
  expected_frequency     expected_frequency NOT NULL DEFAULT 'daily',
  freshness_window_hours integer NOT NULL DEFAULT 48,
  confidence_default     confidence NOT NULL DEFAULT 'medium',
  chart_type             text NOT NULL DEFAULT 'line',
  enabled                boolean NOT NULL DEFAULT true,
  display_order          integer NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.7 snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE snapshots (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  market_score         numeric NOT NULL,
  oscillator_value     numeric NOT NULL,
  regime_label         text NOT NULL,
  investor_posture     text,
  trend                snapshot_trend NOT NULL DEFAULT 'unknown',
  confidence           confidence NOT NULL DEFAULT 'medium',
  data_freshness       snapshot_freshness NOT NULL DEFAULT 'mixed',
  top_positive_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_negative_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes                text,
  created_by           text
);

-- ---------------------------------------------------------------------------
-- §8.5 metric_values
-- ---------------------------------------------------------------------------
CREATE TABLE metric_values (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id   text NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  value       numeric,
  value_text  text,
  "timestamp" date NOT NULL,
  source_id   text NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  freshness   freshness NOT NULL DEFAULT 'fresh',
  confidence  confidence NOT NULL DEFAULT 'medium',
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT metric_values_unique UNIQUE (metric_id, "timestamp", source_id)
);

-- ---------------------------------------------------------------------------
-- §8.6 metric_scores
-- ---------------------------------------------------------------------------
CREATE TABLE metric_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id             text NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  snapshot_id           uuid NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  raw_score             numeric NOT NULL,
  trend                 metric_trend NOT NULL DEFAULT 'unknown',
  change_1d             numeric,
  change_1w             numeric,
  change_1m             numeric,
  change_3m             numeric,
  score_reason          text,
  weighted_contribution numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.9 category_scores
-- ---------------------------------------------------------------------------
CREATE TABLE category_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id           uuid NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  category_id           text NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  raw_category_score    numeric NOT NULL,
  category_weight       numeric NOT NULL,
  weighted_contribution numeric NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.8 snapshot_metrics
-- ---------------------------------------------------------------------------
CREATE TABLE snapshot_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id     uuid NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  metric_id       text NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  metric_value_id uuid REFERENCES metric_values(id) ON DELETE SET NULL,
  metric_score_id uuid REFERENCES metric_scores(id) ON DELETE SET NULL,
  category_id     text NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.10 scoring_rules
-- ---------------------------------------------------------------------------
CREATE TABLE scoring_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id   text NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  rule_name   text NOT NULL,
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled     boolean NOT NULL DEFAULT true,
  version     text NOT NULL DEFAULT 'v0.1',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.11 regime_thresholds
-- ---------------------------------------------------------------------------
CREATE TABLE regime_thresholds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_score     numeric NOT NULL,
  max_score     numeric NOT NULL,
  regime_label  text NOT NULL,
  posture       text,
  description   text,
  display_order integer NOT NULL DEFAULT 0,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.12 prompt_templates
-- ---------------------------------------------------------------------------
CREATE TABLE prompt_templates (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  prompt_text   text NOT NULL,
  variables     jsonb NOT NULL DEFAULT '[]'::jsonb,
  output_format text,
  enabled       boolean NOT NULL DEFAULT true,
  version       text NOT NULL DEFAULT 'v0.1',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.13 ai_interpretations
-- ---------------------------------------------------------------------------
CREATE TABLE ai_interpretations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id         uuid REFERENCES snapshots(id) ON DELETE CASCADE,
  prompt_template_id  text REFERENCES prompt_templates(id) ON DELETE SET NULL,
  interpretation_type interpretation_type NOT NULL,
  input_payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_text         text NOT NULL,
  model               text,
  token_usage         jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.14 manual_overrides
-- ---------------------------------------------------------------------------
CREATE TABLE manual_overrides (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id      text NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  snapshot_id    uuid REFERENCES snapshots(id) ON DELETE CASCADE,
  override_type  override_type NOT NULL,
  original_value jsonb,
  override_value jsonb,
  reason         text,
  enabled        boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- §8.1 app_settings — key/value config (AI usage, freshness windows, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE app_settings (
  id          text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes for common access paths
-- ---------------------------------------------------------------------------
CREATE INDEX idx_metrics_category       ON metrics(category_id);
CREATE INDEX idx_metric_values_metric   ON metric_values(metric_id, "timestamp" DESC);
CREATE INDEX idx_metric_scores_snapshot ON metric_scores(snapshot_id);
CREATE INDEX idx_metric_scores_metric   ON metric_scores(metric_id);
CREATE INDEX idx_category_scores_snap   ON category_scores(snapshot_id);
CREATE INDEX idx_snapshot_metrics_snap  ON snapshot_metrics(snapshot_id);
CREATE INDEX idx_snapshots_created      ON snapshots(created_at DESC);
CREATE INDEX idx_ai_interp_snapshot     ON ai_interpretations(snapshot_id);
