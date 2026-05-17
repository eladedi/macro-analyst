// TypeScript row types mirroring db/migrations/0001_init.sql (Spec §8).

export type AutomationStatus = 'automatic' | 'semi' | 'manual'
export type ExpectedFrequency = 'daily' | 'weekly' | 'monthly'
export type Freshness = 'fresh' | 'delayed' | 'stale' | 'manual'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type Reliability = 'high' | 'medium' | 'low'
export type DataSourceType = 'api' | 'scrape' | 'manual' | 'embed'
export type MetricTrend = 'up' | 'down' | 'flat' | 'unknown'
export type SnapshotTrend = 'improving' | 'stable' | 'deteriorating' | 'unknown'
export type SnapshotFreshness = 'good' | 'mixed' | 'stale'
export type OverrideType = 'value' | 'score' | 'weight' | 'note'
export type InterpretationType = 'daily' | 'weekly' | 'metric' | 'crisis' | 'comparison'

export interface DataSource {
  id: string
  name: string
  type: DataSourceType
  base_url: string | null
  requires_api_key: boolean
  reliability: Reliability
  notes: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  weight: number
  is_core: boolean
  display_order: number
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface Metric {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  unit: string | null
  source_primary_id: string | null
  source_fallback_id: string | null
  source_symbol: string | null
  metric_weight: number
  automation_status: AutomationStatus
  expected_frequency: ExpectedFrequency
  freshness_window_hours: number
  confidence_default: ConfidenceLevel
  chart_type: string
  enabled: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Snapshot {
  id: string
  created_at: string
  market_score: number
  oscillator_value: number
  regime_label: string
  investor_posture: string | null
  trend: SnapshotTrend
  confidence: ConfidenceLevel
  data_freshness: SnapshotFreshness
  top_positive_signals: string[]
  top_negative_signals: string[]
  notes: string | null
  created_by: string | null
}

export interface MetricValue {
  id: string
  metric_id: string
  value: number | null
  value_text: string | null
  timestamp: string
  source_id: string
  freshness: Freshness
  confidence: ConfidenceLevel
  metadata: Record<string, unknown>
  created_at: string
}

export interface MetricScore {
  id: string
  metric_id: string
  snapshot_id: string
  raw_score: number
  trend: MetricTrend
  change_1d: number | null
  change_1w: number | null
  change_1m: number | null
  change_3m: number | null
  score_reason: string | null
  weighted_contribution: number
  created_at: string
}

export interface CategoryScore {
  id: string
  snapshot_id: string
  category_id: string
  raw_category_score: number
  category_weight: number
  weighted_contribution: number
  created_at: string
}

export interface SnapshotMetric {
  id: string
  snapshot_id: string
  metric_id: string
  metric_value_id: string | null
  metric_score_id: string | null
  category_id: string
  created_at: string
}

export interface ScoringRule {
  id: string
  metric_id: string
  rule_name: string
  rule_config: Record<string, unknown>
  enabled: boolean
  version: string
  created_at: string
  updated_at: string
}

export interface RegimeThreshold {
  id: string
  min_score: number
  max_score: number
  regime_label: string
  posture: string | null
  description: string | null
  display_order: number
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface PromptTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  prompt_text: string
  variables: string[]
  output_format: string | null
  enabled: boolean
  version: string
  created_at: string
  updated_at: string
}

export interface AiInterpretation {
  id: string
  snapshot_id: string | null
  prompt_template_id: string | null
  interpretation_type: InterpretationType
  input_payload: Record<string, unknown>
  output_text: string
  model: string | null
  token_usage: Record<string, unknown> | null
  created_at: string
}

export interface ManualOverride {
  id: string
  metric_id: string
  snapshot_id: string | null
  override_type: OverrideType
  original_value: unknown
  override_value: unknown
  reason: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface AppSetting {
  id: string
  value: Record<string, unknown>
  description: string | null
  created_at: string
  updated_at: string
}
