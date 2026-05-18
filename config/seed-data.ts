/**
 * Canonical seed configuration — the single source of truth for the default,
 * editable system config. Consumed by:
 *   - db/seed.ts        (writes it into Supabase, idempotently)
 *   - app/metrics/page.tsx and the MetricInfo "i" button (descriptions + sources)
 *
 * Spec refs: §9.1 (metrics), §10.6 (category weights), §11 (regime thresholds),
 * §8.10 (scoring-rule shape), §17 (prompt templates), §13/§14 (settings).
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface SeedDataSource {
  id: string
  name: string
  type: 'api' | 'scrape' | 'manual' | 'embed'
  base_url: string | null
  requires_api_key: boolean
  reliability: 'high' | 'medium' | 'low'
  notes: string | null
  enabled: boolean
}

export interface SeedCategory {
  id: string
  name: string
  slug: string
  description: string
  weight: number // fraction of final score; all categories sum to 1.0
  is_core: boolean
  display_order: number
}

export interface SeedMetric {
  id: string
  category_id: string
  name: string
  slug: string
  description: string // plain-language "what it measures" — shown in the "i" popover
  unit: string
  source_primary_id: string
  source_fallback_id: string | null
  source_symbol: string
  metric_weight: number // weight inside its category
  automation_status: 'automatic' | 'semi' | 'manual'
  expected_frequency: 'daily' | 'weekly' | 'monthly'
  freshness_window_hours: number
  confidence_default: 'high' | 'medium' | 'low'
  chart_type: string
  display_order: number
}

/**
 * rule_config contract (evaluated by the Phase 5 scoring engine):
 *   { score_range: [min,max], input: <field>, rules: [{operator,value,score,label}], fallback_score }
 * Rules are evaluated in order; first match wins, else fallback_score.
 * `input` is one of: change_1w_percent | change_1m_percent | change_1w | change_1m | value
 */
export interface SeedScoringRule {
  metric_id: string
  rule_name: string
  rule_config: {
    score_range: [number, number]
    input: string
    rules: Array<{ operator: '<=' | '<' | '>=' | '>' | '=='; value: number; score: number; label: string }>
    fallback_score: number
  }
}

export interface SeedRegimeThreshold {
  min_score: number
  max_score: number
  regime_label: string
  posture: string
  description: string
  display_order: number
}

export interface SeedPromptTemplate {
  id: string
  name: string
  slug: string
  description: string
  prompt_text: string
  variables: string[]
  output_format: string
}

export interface SeedAppSetting {
  id: string
  value: Record<string, Json>
  description: string
}

// ---------------------------------------------------------------------------
// Data sources
// ---------------------------------------------------------------------------
export const dataSources: SeedDataSource[] = [
  {
    id: 'fred',
    name: 'FRED (Federal Reserve Economic Data)',
    type: 'api',
    base_url: 'https://api.stlouisfed.org/fred',
    requires_api_key: true,
    reliability: 'high',
    notes: 'St. Louis Fed. Official series. Free API key required.',
    enabled: true,
  },
  {
    id: 'twelve_data',
    name: 'Twelve Data',
    type: 'api',
    base_url: 'https://api.twelvedata.com',
    requires_api_key: true,
    reliability: 'high',
    notes:
      'D4: single provider for all non-FRED metrics — DXY, equity indices, gold, silver, BTC, ETH. Free tier 800 req/day, 8 req/min.',
    enabled: true,
  },
]

// ---------------------------------------------------------------------------
// Categories — weights from Spec §10.6, must sum to 1.0
// ---------------------------------------------------------------------------
export const categories: SeedCategory[] = [
  { id: 'liquidity', name: 'Liquidity', slug: 'liquidity', description: 'Whether more or less money is available in the system.', weight: 0.16, is_core: true, display_order: 1 },
  { id: 'credit', name: 'Credit', slug: 'credit', description: 'Stress or calm in credit markets.', weight: 0.14, is_core: true, display_order: 2 },
  { id: 'rates', name: 'Rates', slug: 'rates', description: 'Cost of money and policy direction.', weight: 0.12, is_core: true, display_order: 3 },
  { id: 'dollar', name: 'Dollar', slug: 'dollar', description: 'Global dollar pressure.', weight: 0.1, is_core: true, display_order: 4 },
  { id: 'bonds', name: 'Bonds / Yields', slug: 'bonds', description: 'Treasury yield pressure or support.', weight: 0.1, is_core: true, display_order: 5 },
  { id: 'equities', name: 'Equities', slug: 'equities', description: 'Broad equity-market health.', weight: 0.08, is_core: true, display_order: 6 },
  { id: 'breadth', name: 'Market Breadth', slug: 'breadth', description: 'Whether market participation is broad or narrow.', weight: 0.08, is_core: true, display_order: 7 },
  { id: 'volatility', name: 'Volatility', slug: 'volatility', description: 'Fear and uncertainty.', weight: 0.08, is_core: true, display_order: 8 },
  { id: 'yield_curve', name: 'Yield Curve', slug: 'yield_curve', description: 'Recession / recovery expectations.', weight: 0.08, is_core: true, display_order: 9 },
  { id: 'commodities', name: 'Commodities', slug: 'commodities', description: 'Inflation, growth, fear, and dollar sensitivity.', weight: 0.03, is_core: false, display_order: 10 },
  { id: 'crypto', name: 'Crypto', slug: 'crypto', description: 'Speculative risk appetite and crypto liquidity.', weight: 0.02, is_core: false, display_order: 11 },
  { id: 'sentiment', name: 'Sentiment', slug: 'sentiment', description: 'Investor psychology and possible crowding.', weight: 0.01, is_core: false, display_order: 12 },
]

// ---------------------------------------------------------------------------
// MVP metrics — Spec §9.1
// ---------------------------------------------------------------------------
export const metrics: SeedMetric[] = [
  {
    id: 'm2', category_id: 'liquidity', name: 'M2 Money Supply', slug: 'm2',
    description:
      'Broad US money supply (cash, deposits, savings, money-market funds). Rising M2 means more liquidity in the system, which is generally supportive of risk assets; contraction is a drag.',
    unit: '$B', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'M2SL',
    metric_weight: 0.4, automation_status: 'automatic', expected_frequency: 'monthly',
    freshness_window_hours: 1080, confidence_default: 'high', chart_type: 'line', display_order: 1,
  },
  {
    id: 'weekly_m2', category_id: 'liquidity', name: 'Weekly M2', slug: 'weekly_m2',
    description:
      'Weekly, not-seasonally-adjusted M2. A higher-frequency read on the money-supply trend than monthly M2 — useful for spotting turns earlier.',
    unit: '$B', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'WM2NS',
    metric_weight: 0.25, automation_status: 'automatic', expected_frequency: 'weekly',
    freshness_window_hours: 240, confidence_default: 'high', chart_type: 'line', display_order: 2,
  },
  {
    id: 'fed_balance_sheet', category_id: 'liquidity', name: 'Fed Balance Sheet', slug: 'fed_balance_sheet',
    description:
      'Total assets held by the Federal Reserve. Expansion (QE) injects liquidity and supports risk; contraction (QT) drains liquidity and tightens financial conditions.',
    unit: '$M', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'WALCL',
    metric_weight: 0.35, automation_status: 'automatic', expected_frequency: 'weekly',
    freshness_window_hours: 240, confidence_default: 'high', chart_type: 'line', display_order: 3,
  },
  {
    id: 'fed_funds', category_id: 'rates', name: 'Fed Funds Rate', slug: 'fed_funds',
    description:
      "The Federal Reserve's policy interest rate. Higher rates tighten financial conditions and pressure risk assets; cuts ease conditions and are typically risk-supportive.",
    unit: '%', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'FEDFUNDS',
    metric_weight: 0.5, automation_status: 'automatic', expected_frequency: 'monthly',
    freshness_window_hours: 1080, confidence_default: 'high', chart_type: 'line', display_order: 4,
  },
  {
    id: 'us2y', category_id: 'rates', name: '2Y Treasury Yield', slug: 'us2y',
    description:
      'Yield on the 2-year US Treasury. Closely tracks near-term rate-policy expectations — a falling 2Y often signals the market pricing in cuts.',
    unit: '%', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'DGS2',
    metric_weight: 0.5, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'high', chart_type: 'line', display_order: 5,
  },
  {
    id: 'us10y', category_id: 'bonds', name: '10Y Treasury Yield', slug: 'us10y',
    description:
      'Yield on the 10-year US Treasury — the benchmark long-term rate reflecting growth and inflation expectations. Sharp rises tighten conditions and pressure long-duration risk assets.',
    unit: '%', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'DGS10',
    metric_weight: 1.0, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'high', chart_type: 'line', display_order: 6,
  },
  {
    id: 'yield_curve_10y2y', category_id: 'yield_curve', name: '10Y-2Y Spread', slug: 'yield_curve_10y2y',
    description:
      'Slope of the yield curve (10-year minus 2-year). A negative spread (inversion) has historically preceded recessions; re-steepening from inversion is a recovery signal.',
    unit: '%', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'T10Y2Y',
    metric_weight: 1.0, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'high', chart_type: 'line', display_order: 7,
  },
  {
    id: 'hy_oas', category_id: 'credit', name: 'High Yield OAS', slug: 'hy_oas',
    description:
      'Option-adjusted spread of US high-yield (junk) bonds over Treasuries. Widening spreads signal credit stress and risk-off; tightening signals calm and risk appetite.',
    unit: 'bps', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'BAMLH0A0HYM2',
    metric_weight: 1.0, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'high', chart_type: 'line', display_order: 8,
  },
  {
    id: 'vix', category_id: 'volatility', name: 'VIX', slug: 'vix',
    description:
      "CBOE Volatility Index — the market's 30-day implied volatility on the S&P 500, the classic 'fear gauge'. Spikes signal fear and stress; a low or falling VIX supports risk appetite.",
    unit: 'index', source_primary_id: 'fred', source_fallback_id: null, source_symbol: 'VIXCLS',
    metric_weight: 1.0, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'high', chart_type: 'line', display_order: 9,
  },
  {
    id: 'dxy', category_id: 'dollar', name: 'DXY (Dollar Index)', slug: 'dxy',
    description:
      'US Dollar Index versus a basket of major currencies. A strong or rising dollar tightens global liquidity and pressures risk assets. Tracked via the UUP ETF (Invesco DB USD Bullish) on the Twelve Data free tier — moves directionally with DXY; scoring uses % change, so the regime signal is preserved.',
    unit: 'index', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'UUP',
    metric_weight: 1.0, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 10,
  },
  {
    id: 'sp500', category_id: 'equities', name: 'S&P 500', slug: 'sp500',
    description:
      'Broad US large-cap equity index — the core read on equity-market health and overall risk appetite. Tracked via the SPY ETF on the Twelve Data free tier (raw SPX is paid-plan only); SPY tracks the S&P 500 ~1:1 and scoring uses % change, so the regime signal is preserved.',
    unit: 'index', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'SPY',
    metric_weight: 0.5, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 11,
  },
  {
    id: 'ndx', category_id: 'equities', name: 'Nasdaq 100', slug: 'ndx',
    description:
      'US large-cap growth/technology index. Duration- and risk-sensitive — leads in risk-on, falls hardest in risk-off. Tracked via the QQQ ETF on the Twelve Data free tier (raw NDX is paid-plan only); QQQ tracks the Nasdaq 100 ~1:1 and scoring uses % change.',
    unit: 'index', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'QQQ',
    metric_weight: 0.3, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 12,
  },
  {
    id: 'rut', category_id: 'equities', name: 'Russell 2000', slug: 'rut',
    description:
      'US small-cap index. Sensitive to domestic growth and financial conditions; a read on the breadth/quality of a risk-on move. Tracked via the IWM ETF on the Twelve Data free tier (raw RUT is paid-plan only); IWM tracks the Russell 2000 ~1:1 and scoring uses % change.',
    unit: 'index', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'IWM',
    metric_weight: 0.2, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 13,
  },
  {
    id: 'gold', category_id: 'commodities', name: 'Gold', slug: 'gold',
    description:
      'Spot gold price. Acts as an inflation hedge, a fear hedge, and is sensitive to the dollar and real yields.',
    unit: 'USD', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'XAU/USD',
    metric_weight: 0.5, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 14,
  },
  {
    id: 'silver', category_id: 'commodities', name: 'Silver', slug: 'silver',
    description:
      'Silver price. Behaves like gold but with greater industrial/cyclical sensitivity, so it carries more growth signal. Tracked via the SLV ETF on the Twelve Data free tier (XAG/USD is paid-plan only); SLV tracks spot silver ~1:1 and scoring uses % change.',
    unit: 'USD', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'SLV',
    metric_weight: 0.5, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 15,
  },
  {
    id: 'btc', category_id: 'crypto', name: 'BTC', slug: 'btc',
    description:
      'Bitcoin price — a high-beta read on speculative risk appetite and crypto liquidity. Often leads broader risk sentiment at the margin.',
    unit: 'USD', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'BTC/USD',
    metric_weight: 0.6, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 16,
  },
  {
    id: 'eth', category_id: 'crypto', name: 'ETH', slug: 'eth',
    description:
      'Ethereum price. Speculative risk-appetite gauge, highly correlated with BTC but typically with more cyclical amplitude.',
    unit: 'USD', source_primary_id: 'twelve_data', source_fallback_id: null, source_symbol: 'ETH/USD',
    metric_weight: 0.4, automation_status: 'automatic', expected_frequency: 'daily',
    freshness_window_hours: 48, confidence_default: 'medium', chart_type: 'line', display_order: 17,
  },
]

// ---------------------------------------------------------------------------
// Conservative default scoring rules per metric (D8). Tuned later in Settings.
// ---------------------------------------------------------------------------
export const scoringRules: SeedScoringRule[] = [
  {
    metric_id: 'm2', rule_name: 'M2 monthly trend',
    rule_config: { score_range: [-5, 5], input: 'change_1m_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 0.6, score: 3, label: 'M2 expanding strongly' },
      { operator: '>=', value: 0.1, score: 1, label: 'M2 expanding' },
      { operator: '<=', value: -0.5, score: -3, label: 'M2 contracting sharply' },
      { operator: '<', value: 0, score: -1, label: 'M2 contracting' },
    ] },
  },
  {
    metric_id: 'weekly_m2', rule_name: 'Weekly M2 trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 0.3, score: 2, label: 'Weekly M2 rising' },
      { operator: '>', value: 0, score: 1, label: 'Weekly M2 firming' },
      { operator: '<=', value: -0.3, score: -2, label: 'Weekly M2 falling' },
      { operator: '<', value: 0, score: -1, label: 'Weekly M2 softening' },
    ] },
  },
  {
    metric_id: 'fed_balance_sheet', rule_name: 'Fed balance sheet trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 0.5, score: 2, label: 'Balance sheet expanding (liquidity add)' },
      { operator: '>', value: 0, score: 1, label: 'Balance sheet rising' },
      { operator: '<=', value: -0.5, score: -2, label: 'QT draining liquidity' },
      { operator: '<', value: 0, score: -1, label: 'Balance sheet shrinking' },
    ] },
  },
  {
    metric_id: 'fed_funds', rule_name: 'Policy rate direction',
    rule_config: { score_range: [-5, 5], input: 'change_1m', fallback_score: 0, rules: [
      { operator: '<=', value: -0.1, score: 3, label: 'Policy easing (cuts)' },
      { operator: '<', value: 0, score: 1, label: 'Policy bias easing' },
      { operator: '>=', value: 0.1, score: -3, label: 'Policy tightening (hikes)' },
      { operator: '>', value: 0, score: -1, label: 'Policy bias tightening' },
    ] },
  },
  {
    metric_id: 'us2y', rule_name: '2Y yield direction',
    rule_config: { score_range: [-5, 5], input: 'change_1w', fallback_score: 0, rules: [
      { operator: '<=', value: -0.15, score: 2, label: '2Y falling (easing priced)' },
      { operator: '<=', value: -0.03, score: 1, label: '2Y drifting lower' },
      { operator: '>=', value: 0.15, score: -2, label: '2Y rising (tightening priced)' },
      { operator: '>=', value: 0.03, score: -1, label: '2Y drifting higher' },
    ] },
  },
  {
    metric_id: 'us10y', rule_name: '10Y yield pressure',
    rule_config: { score_range: [-5, 5], input: 'change_1w', fallback_score: 0, rules: [
      { operator: '<=', value: -0.15, score: 1, label: '10Y easing, supportive' },
      { operator: '>=', value: 0.2, score: -2, label: '10Y spiking, tightening pressure' },
      { operator: '>=', value: 0.08, score: -1, label: '10Y rising' },
    ] },
  },
  {
    metric_id: 'yield_curve_10y2y', rule_name: 'Curve slope',
    rule_config: { score_range: [-5, 5], input: 'value', fallback_score: 0, rules: [
      { operator: '>=', value: 0.5, score: 2, label: 'Curve clearly positive' },
      { operator: '>=', value: 0, score: 1, label: 'Curve positive / normalising' },
      { operator: '<=', value: -0.5, score: -3, label: 'Deep inversion' },
      { operator: '<', value: 0, score: -1, label: 'Curve inverted' },
    ] },
  },
  {
    metric_id: 'hy_oas', rule_name: 'Credit spread direction',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '<=', value: -10, score: 3, label: 'Spreads tightening fast (risk-on)' },
      { operator: '<=', value: -3, score: 1, label: 'Spreads tightening' },
      { operator: '>=', value: 15, score: -4, label: 'Credit stress, spreads blowing out' },
      { operator: '>=', value: 5, score: -2, label: 'Spreads widening' },
    ] },
  },
  {
    metric_id: 'vix', rule_name: 'VIX direction',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '<=', value: -20, score: 4, label: 'Volatility collapsing, fear easing sharply' },
      { operator: '<=', value: -8, score: 2, label: 'Volatility falling, fear easing' },
      { operator: '>=', value: 25, score: -4, label: 'Volatility spiking, fear surging' },
      { operator: '>=', value: 10, score: -2, label: 'Volatility rising, fear building' },
    ] },
  },
  {
    metric_id: 'dxy', rule_name: 'Dollar direction',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '<=', value: -2, score: 2, label: 'Dollar weakening (risk-supportive)' },
      { operator: '<=', value: -0.5, score: 1, label: 'Dollar softening' },
      { operator: '>=', value: 2, score: -2, label: 'Dollar surging (risk headwind)' },
      { operator: '>=', value: 0.5, score: -1, label: 'Dollar firming' },
    ] },
  },
  {
    metric_id: 'sp500', rule_name: 'S&P 500 trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 3, score: 3, label: 'Strong weekly advance' },
      { operator: '>=', value: 0.5, score: 1, label: 'Constructive' },
      { operator: '<=', value: -5, score: -4, label: 'Sharp weekly decline' },
      { operator: '<=', value: -1.5, score: -2, label: 'Weakening' },
    ] },
  },
  {
    metric_id: 'ndx', rule_name: 'Nasdaq 100 trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 3, score: 3, label: 'Growth leadership strong' },
      { operator: '>=', value: 0.5, score: 1, label: 'Constructive' },
      { operator: '<=', value: -6, score: -4, label: 'Growth selloff' },
      { operator: '<=', value: -1.5, score: -2, label: 'Weakening' },
    ] },
  },
  {
    metric_id: 'rut', rule_name: 'Russell 2000 trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 3, score: 2, label: 'Small caps participating' },
      { operator: '>=', value: 0.5, score: 1, label: 'Constructive breadth' },
      { operator: '<=', value: -5, score: -3, label: 'Small-cap breakdown' },
      { operator: '<=', value: -1.5, score: -1, label: 'Breadth weakening' },
    ] },
  },
  {
    metric_id: 'gold', rule_name: 'Gold trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 0.5, score: 1, label: 'Gold firm (reflationary tone)' },
      { operator: '<=', value: -3, score: -1, label: 'Gold falling' },
    ] },
  },
  {
    metric_id: 'silver', rule_name: 'Silver trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 1, score: 1, label: 'Silver firm (growth/reflation)' },
      { operator: '<=', value: -4, score: -1, label: 'Silver falling' },
    ] },
  },
  {
    metric_id: 'btc', rule_name: 'BTC trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 8, score: 3, label: 'Strong speculative risk appetite' },
      { operator: '>=', value: 2, score: 1, label: 'Risk appetite firm' },
      { operator: '<=', value: -12, score: -3, label: 'Speculative risk-off' },
      { operator: '<=', value: -4, score: -1, label: 'Risk appetite softening' },
    ] },
  },
  {
    metric_id: 'eth', rule_name: 'ETH trend',
    rule_config: { score_range: [-5, 5], input: 'change_1w_percent', fallback_score: 0, rules: [
      { operator: '>=', value: 8, score: 3, label: 'Strong speculative risk appetite' },
      { operator: '>=', value: 2, score: 1, label: 'Risk appetite firm' },
      { operator: '<=', value: -14, score: -3, label: 'Speculative risk-off' },
      { operator: '<=', value: -5, score: -1, label: 'Risk appetite softening' },
    ] },
  },
]

// ---------------------------------------------------------------------------
// Regime thresholds — Spec §11, cover 0–100 with no gaps/overlaps
// ---------------------------------------------------------------------------
export const regimeThresholds: SeedRegimeThreshold[] = [
  { min_score: 80, max_score: 100, regime_label: 'Strong Risk-On', posture: 'Risk-On, monitor overheating', description: 'Conditions strongly support risk; watch for euphoria/crowding.', display_order: 1 },
  { min_score: 65, max_score: 79, regime_label: 'Risk-On', posture: 'Risk-On', description: 'Environment supports higher risk exposure.', display_order: 2 },
  { min_score: 55, max_score: 64, regime_label: 'Early Risk-On', posture: 'Cautious Risk-On', description: 'Improving but not fully confirmed; small tranches reasonable.', display_order: 3 },
  { min_score: 45, max_score: 54, regime_label: 'Neutral / Mixed', posture: 'Neutral', description: 'Signals conflict; do not chase, wait for clarity.', display_order: 4 },
  { min_score: 35, max_score: 44, regime_label: 'Weakening', posture: 'Defensive / Neutral', description: 'Conditions deteriorating; reduce risk into strength.', display_order: 5 },
  { min_score: 20, max_score: 34, regime_label: 'Risk-Off', posture: 'Defensive', description: 'Conditions pressure risk; hold more cash.', display_order: 6 },
  { min_score: 0, max_score: 19, regime_label: 'Panic / Stress', posture: 'Panic Watch', description: 'Severe stress; look for stabilization/bottoming signs.', display_order: 7 },
]

// ---------------------------------------------------------------------------
// AI prompt templates — verbatim from Spec §17
// ---------------------------------------------------------------------------
export const promptTemplates: SeedPromptTemplate[] = [
  {
    id: 'full_regime_interpretation',
    name: 'Full Regime Interpretation',
    slug: 'full_regime_interpretation',
    description: 'Interprets the latest snapshot — regime, drivers, posture.',
    variables: ['snapshot', 'category_scores', 'metrics', 'previous_snapshot'],
    output_format: 'structured_text',
    prompt_text: `You are analyzing a macro market regime dashboard.

Use only the provided data.
Separate raw data from interpretation.
Do not recommend specific securities.
Do not invent missing data.

Explain:
1. Current market regime
2. Market score and oscillator meaning
3. Main positive signals
4. Main negative signals
5. What changed since the previous snapshot
6. Whether the environment is improving or deteriorating
7. General investor posture only:
   Defensive, Neutral, Cautious Risk-On, Risk-On, Panic Watch, or Overheated

Return a structured explanation.`,
  },
  {
    id: 'metric_explanation',
    name: 'Metric Explanation',
    slug: 'metric_explanation',
    description: 'Explains a single metric and why it scored the way it did.',
    variables: ['metric_name', 'category', 'value', 'trend', 'score', 'source'],
    output_format: 'structured_text',
    prompt_text: `Explain this market regime metric.

Metric:
{metric_name}

Category:
{category}

Current value:
{value}

Trend:
{trend}

Score:
{score}

Source:
{source}

Explain:
1. What this metric measures
2. Why it matters for market regime
3. Why it received this score
4. Whether it supports Risk-On or Risk-Off
5. What would make the interpretation wrong`,
  },
  {
    id: 'weekly_review',
    name: 'Weekly Review',
    slug: 'weekly_review',
    description: 'Summarizes regime change across recent snapshots.',
    variables: ['snapshots'],
    output_format: 'structured_text',
    prompt_text: `Create a weekly macro regime review based only on the provided snapshots.

Focus on:
1. What improved
2. What deteriorated
3. Which categories drove the regime score
4. Whether the market is moving toward Risk-On, Risk-Off, Panic Watch, or Overheated
5. Whether the change is broad or narrow
6. General investor posture only

Do not recommend specific assets.
Do not add external facts unless they are provided in the input.`,
  },
  {
    id: 'crisis_mode',
    name: 'Crisis Mode',
    slug: 'crisis_mode',
    description: 'Stress-market analysis from the current metrics.',
    variables: ['snapshot', 'metrics'],
    output_format: 'structured_text',
    prompt_text: `Analyze whether the current market environment is in crisis mode.

Use the provided metrics only.

Check:
1. Volatility shock
2. Credit stress
3. Dollar squeeze
4. Equity breakdown
5. Market breadth collapse
6. Liquidity deterioration
7. Crypto/speculative risk collapse
8. Signs of stabilization

Output:
- Crisis status: inactive / watch / active / severe
- Stress level: low / medium / high / extreme
- Opportunity watch: no / early / active
- Explanation
- What needs to improve before risk appetite can return`,
  },
]

// ---------------------------------------------------------------------------
// app_settings — Spec §13 (freshness), §14 (confidence), D3 (AI)
// ---------------------------------------------------------------------------
export const appSettings: SeedAppSetting[] = [
  {
    id: 'freshness_windows',
    description: 'Default freshness windows by expected frequency (Spec §13).',
    value: { daily_hours: 48, weekly_days: 10, monthly_days: 45, manual: 'user_defined' },
  },
  {
    id: 'confidence_logic',
    description: 'How metric confidence is derived from source + freshness (Spec §14).',
    value: {
      high: 'Official / highly reliable source, fresh data',
      medium: 'Reliable but delayed, proxy, or semi-automatic source',
      low: 'Manual, scraped, stale, or uncertain data',
    },
  },
  {
    id: 'ai_usage',
    description: 'AI provider defaults (D3 — Anthropic Claude, server-side, manual trigger only).',
    value: { provider: 'anthropic', model: 'claude-sonnet-4-6', manual_only: true, max_tokens: 2000 },
  },
]
