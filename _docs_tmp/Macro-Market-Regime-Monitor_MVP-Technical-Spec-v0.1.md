# Macro Market Regime Monitor — MVP Technical Specification v0.1

**File name:** `Macro-Market-Regime-Monitor_MVP-Technical-Spec-v0.1.md`  
**Version:** v0.1  
**Status:** Draft for implementation  
**Product type:** Personal macro market regime web application  
**Initial user:** Elad  
**Primary goal:** Build the first usable MVP of the Macro Market Regime Monitor.

---

## 1. Executive Summary

The **Macro Market Regime Monitor** is a web application that aggregates macro, market, liquidity, credit, volatility, dollar, equity, commodity, crypto, and sentiment indicators to produce a clear market-regime view.

The MVP should allow the user to click **Refresh Market Snapshot**, pull the latest available data, calculate metric scores, calculate category scores, calculate a final **Market Regime Score**, convert it into a **Macro Regime Oscillator**, save a historical snapshot, and optionally generate AI interpretation.

The MVP should be personal-first, transparent, controllable, and not a black box.

---

## 2. MVP Objectives

The MVP must answer these questions:

1. What is the current market regime?
2. Is the market environment improving, stable, or deteriorating?
3. Which metrics and categories are driving the score?
4. Are risk assets generally supported or pressured by the current environment?
5. What changed since the previous snapshot?
6. What does the AI interpretation say, if requested?
7. What weights and scoring rules produced the result?

---

## 3. Non-Goals for MVP

The MVP should **not** include:

- Stock picking
- Buy/sell recommendations
- Automated trading
- Broker integration
- Portfolio optimization
- Thesis engine
- Full portfolio module
- Backtesting
- Real-time alerting
- Multi-user SaaS logic
- Complex context-aware regime modeling
- Fully automated news/regulation interpretation

These can be added later after the core regime engine works reliably.

---

## 4. Core Product Principles

1. **Data first** — show metrics, charts, values, and sources.
2. **Transparent calculation second** — show scores, weights, and contribution.
3. **AI interpretation third** — only when manually requested.
4. **Manual refresh** — avoid unnecessary API calls and AI token usage.
5. **Editable assumptions** — weights, scoring rules, thresholds, and prompts must be visible and editable.
6. **Snapshots over streaming** — the product tracks market-regime changes through saved snapshots.
7. **Personal-first** — optimize for one user before expanding to a product.

---

## 5. MVP User Workflow

### 5.1 Daily Flow

```text
Open Dashboard
      ↓
Click "Refresh Market Snapshot"
      ↓
System fetches latest data
      ↓
System calculates metric trends
      ↓
System calculates metric scores
      ↓
System calculates category scores
      ↓
System calculates Market Regime Score
      ↓
System calculates Macro Regime Oscillator
      ↓
System assigns regime label and trend
      ↓
System saves snapshot
      ↓
User optionally clicks "Generate AI Interpretation"
```

### 5.2 Weekly Flow

```text
Open Weekly Review / AI Interpretation page
      ↓
Select last 7 days or last N snapshots
      ↓
Click "Generate Weekly Review"
      ↓
AI explains what improved, what deteriorated, and what regime the market is moving toward
      ↓
Save AI interpretation
```

### 5.3 Metric Explanation Flow

```text
Open Metrics page
      ↓
Choose a metric
      ↓
Click "Explain"
      ↓
AI explains what the metric measures, why it matters, why it received the score, and what would invalidate the interpretation
```

---

## 6. System Architecture

### 6.1 Recommended Stack

| Layer | Recommendation |
|---|---|
| Frontend | Next.js / React |
| Styling | Tailwind CSS |
| Charts | Recharts initially; TradingView embeds optional later |
| Tables | TanStack Table |
| Client state | Zustand |
| Server state | TanStack Query |
| Backend | Next.js API routes initially |
| Database | Supabase Postgres or PostgreSQL |
| Auth | Supabase Auth or simple private-auth mode |
| AI calls | Server-side only |
| Data fetching | Manual refresh endpoint |
| Config storage | Database tables and editable JSON |
| Deployment | Vercel + Supabase or similar |

### 6.2 High-Level Components

```text
Frontend Dashboard
      ↓
API Layer
      ↓
Data Fetchers
      ↓
Scoring Engine
      ↓
Snapshot Engine
      ↓
Database
      ↓
AI Interpretation Service
```

---

## 7. Core Pages

## 7.1 Dashboard Page

**Route:** `/dashboard`

### Purpose

Main daily/weekly operating screen.

### Required components

| Component | Description |
|---|---|
| Market Regime Score | 0–100 score |
| Macro Regime Oscillator | -100 to +100 index |
| Regime Label | Strong Risk-On / Risk-On / Early Risk-On / Neutral / Weakening / Risk-Off / Panic |
| Trend | Improving / Stable / Deteriorating |
| Confidence | High / Medium / Low |
| Last Updated | Timestamp of latest snapshot |
| Data Freshness | Fresh / Delayed / Stale |
| Refresh Market Snapshot button | Manually pulls and scores data |
| Generate AI Interpretation button | Runs AI interpretation on demand |
| Core category cards | Liquidity, Rates, Bonds, Yield Curve, Credit, Volatility, Dollar, Equities, Breadth |
| Supporting category cards | Commodities, Crypto, Sentiment |
| What Changed | Comparison vs previous snapshot |
| AI Summary | Last generated interpretation |

### Dashboard Layout

```text
--------------------------------------------------
Macro Market Regime Monitor
--------------------------------------------------

Market Score: 63 / 100
Oscillator: +26
Regime: Cautious Risk-On
Trend: Improving
Confidence: Medium
Last Updated: 2026-05-17 09:00

[Refresh Market Snapshot] [Generate AI Interpretation]

--------------------------------------------------
Macro Regime Oscillator Chart
--------------------------------------------------

Line chart of oscillator over time

--------------------------------------------------
Core Metrics
--------------------------------------------------

Liquidity      +1.8
Credit         +0.9
Rates          +1.2
Bonds/Yields   +0.4
Yield Curve    -0.2
Dollar         +2.4
Equities       +1.7
Breadth        -0.6
Volatility     +2.2

--------------------------------------------------
Supporting Metrics
--------------------------------------------------

Commodities    +0.7
Crypto         +1.1
Sentiment      -0.8

--------------------------------------------------
What Changed?
--------------------------------------------------

Biggest Improvements:
- VIX improved
- DXY weakened
- S&P trend improved

Biggest Deteriorations:
- Breadth remains weak
- Sentiment moved toward greed

--------------------------------------------------
AI Interpretation
--------------------------------------------------

Generated only on demand
```

---

## 7.2 Metrics Page

**Route:** `/metrics`

### Purpose

Full metric transparency.

### Required columns

| Column | Description |
|---|---|
| Category | Metric category |
| Metric | Metric name |
| Current Value | Latest raw value |
| Unit | %, index, USD, spread, etc. |
| 1D Change | If available |
| 1W Change | Weekly movement |
| 1M Change | Monthly movement |
| 3M Change | Medium trend |
| Trend | Up / Down / Flat |
| Raw Score | -5 to +5 |
| Category Weight | Weight of category in final score |
| Metric Weight | Weight of metric inside category |
| Weighted Contribution | Contribution to final regime score |
| Source | Preferred/fallback source |
| Freshness | Fresh / Delayed / Stale / Manual |
| Confidence | High / Medium / Low |
| Last Updated | Timestamp |
| Chart | Mini chart or link |
| Explain | AI explanation button |

---

## 7.3 Charts Page

**Route:** `/charts`

### Required charts

| Chart | Data |
|---|---|
| Macro Regime Oscillator | Snapshot history |
| Market Regime Score | Snapshot history |
| Liquidity | M2, Weekly M2, Fed balance sheet |
| Credit Stress | High Yield OAS |
| Volatility | VIX |
| Dollar | DXY |
| Treasury Yields | 10Y and 2Y |
| Yield Curve | 10Y-2Y |
| Equities | S&P 500, Nasdaq 100, Russell 2000 |
| Commodities | Gold, Silver |
| Crypto | BTC, ETH |

---

## 7.4 AI Interpretation Page

**Route:** `/ai`

### Purpose

Run AI interpretation only when requested.

### Required actions

| Action | Description |
|---|---|
| Generate Daily Brief | Interpret latest snapshot |
| Generate Weekly Review | Interpret recent snapshots |
| Explain Full Regime | Explain score/regime |
| Explain Metric | Explain selected metric |
| Compare Snapshots | Explain changes between snapshots |
| Crisis Mode Interpretation | Stress-market analysis |

---

## 7.5 Settings Page

**Route:** `/settings`

### Purpose

Expose all configurable assumptions.

### Required sections

| Section | Editable |
|---|---|
| Category weights | Yes |
| Metric weights | Yes |
| Scoring rules | Yes |
| Regime thresholds | Yes |
| Data sources | Yes |
| Fallback sources | Yes |
| Prompt templates | Yes |
| AI usage settings | Yes |
| Manual overrides | Yes |

---

## 7.6 Snapshots Page

**Route:** `/snapshots`

### Purpose

View historical market-regime snapshots.

### Required components

| Component | Description |
|---|---|
| Snapshot list | Date, score, oscillator, regime |
| Snapshot detail | Full saved metric values and scores |
| Compare snapshots | Compare two snapshots |
| Weekly summary | View weekly change |
| AI output | Show saved AI interpretation if available |

---

## 8. Data Model

## 8.1 Tables Overview

Required database tables:

```text
categories
metrics
data_sources
metric_values
metric_scores
category_scores
snapshots
snapshot_metrics
scoring_rules
regime_thresholds
prompt_templates
ai_interpretations
manual_overrides
app_settings
```

---

## 8.2 Table: categories

Stores metric categories and category-level weights.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | text / uuid | Primary key |
| name | text | Example: Liquidity |
| slug | text | Example: liquidity |
| description | text | Category explanation |
| weight | numeric | Final score category weight, e.g. 0.16 |
| is_core | boolean | Core or supporting |
| display_order | integer | UI ordering |
| enabled | boolean | Can disable category |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 8.3 Table: metrics

Stores metric definitions.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | text / uuid | Primary key |
| category_id | foreign key | categories.id |
| name | text | Example: VIX |
| slug | text | Example: vix |
| description | text | What it measures |
| unit | text | index, %, USD, spread |
| source_primary_id | foreign key | data_sources.id |
| source_fallback_id | foreign key | data_sources.id, nullable |
| source_symbol | text | Example: VIXCLS |
| metric_weight | numeric | Weight inside category |
| automation_status | enum | automatic / semi / manual |
| expected_frequency | enum | daily / weekly / monthly |
| freshness_window_hours | integer | Expected freshness |
| confidence_default | enum | high / medium / low |
| chart_type | text | line, gauge, bar |
| enabled | boolean | |
| display_order | integer | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 8.4 Table: data_sources

Stores data source configuration.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | text / uuid | Primary key |
| name | text | FRED, CoinGecko, etc. |
| type | enum | api / scrape / manual / embed |
| base_url | text | Nullable |
| requires_api_key | boolean | |
| reliability | enum | high / medium / low |
| notes | text | |
| enabled | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 8.5 Table: metric_values

Stores raw metric values.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| metric_id | foreign key | metrics.id |
| value | numeric | Raw value |
| value_text | text | Optional for non-numeric values |
| timestamp | timestamp/date | Date of observation |
| source_id | foreign key | data_sources.id |
| freshness | enum | fresh / delayed / stale / manual |
| confidence | enum | high / medium / low |
| metadata | jsonb | Raw response, extra fields |
| created_at | timestamp | |

### Unique constraint

```text
unique(metric_id, timestamp, source_id)
```

---

## 8.6 Table: metric_scores

Stores calculated metric scores.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| metric_id | foreign key | metrics.id |
| snapshot_id | foreign key | snapshots.id |
| raw_score | numeric | -5 to +5 |
| trend | enum | up / down / flat / unknown |
| change_1d | numeric | Nullable |
| change_1w | numeric | Nullable |
| change_1m | numeric | Nullable |
| change_3m | numeric | Nullable |
| score_reason | text | Rule label |
| weighted_contribution | numeric | Final weighted contribution |
| created_at | timestamp | |

---

## 8.7 Table: snapshots

Stores each market snapshot.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| created_at | timestamp | Snapshot time |
| market_score | numeric | 0–100 |
| oscillator_value | numeric | -100 to +100 |
| regime_label | text | Risk-On, Neutral, etc. |
| investor_posture | text | Optional |
| trend | enum | improving / stable / deteriorating / unknown |
| confidence | enum | high / medium / low |
| data_freshness | enum | good / mixed / stale |
| top_positive_signals | jsonb | Array of strings |
| top_negative_signals | jsonb | Array of strings |
| notes | text | Optional |
| created_by | text | Optional |

---

## 8.8 Table: snapshot_metrics

Links snapshots to metric values and scores.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| snapshot_id | foreign key | snapshots.id |
| metric_id | foreign key | metrics.id |
| metric_value_id | foreign key | metric_values.id |
| metric_score_id | foreign key | metric_scores.id |
| category_id | foreign key | categories.id |
| created_at | timestamp | |

---

## 8.9 Table: category_scores

Stores category-level score per snapshot.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| snapshot_id | foreign key | snapshots.id |
| category_id | foreign key | categories.id |
| raw_category_score | numeric | -5 to +5 |
| category_weight | numeric | e.g. 0.16 |
| weighted_contribution | numeric | raw score × weight |
| created_at | timestamp | |

---

## 8.10 Table: scoring_rules

Stores editable scoring logic.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| metric_id | foreign key | metrics.id |
| rule_name | text | |
| rule_config | jsonb | Condition rules |
| enabled | boolean | |
| version | text | v0.1 |
| created_at | timestamp | |
| updated_at | timestamp | |

### Example rule_config

```json
{
  "score_range": [-5, 5],
  "rules": [
    {
      "condition": "change_1w <= -15",
      "operator": "<=",
      "input": "change_1w_percent",
      "value": -15,
      "score": 4,
      "label": "VIX falling sharply"
    },
    {
      "condition": "change_1w >= 20",
      "operator": ">=",
      "input": "change_1w_percent",
      "value": 20,
      "score": -5,
      "label": "VIX spike"
    }
  ],
  "fallback_score": 0
}
```

---

## 8.11 Table: regime_thresholds

Stores editable regime thresholds.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| min_score | numeric | |
| max_score | numeric | |
| regime_label | text | |
| posture | text | |
| description | text | |
| display_order | integer | |
| enabled | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 8.12 Table: prompt_templates

Stores AI prompts.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid/text | Primary key |
| name | text | |
| slug | text | |
| description | text | |
| prompt_text | text | Editable |
| variables | jsonb | Expected variables |
| output_format | text/jsonb | |
| enabled | boolean | |
| version | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 8.13 Table: ai_interpretations

Stores AI-generated outputs.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| snapshot_id | foreign key | snapshots.id, nullable for weekly reviews |
| prompt_template_id | foreign key | prompt_templates.id |
| interpretation_type | enum | daily / weekly / metric / crisis / comparison |
| input_payload | jsonb | Data sent to AI |
| output_text | text | AI result |
| model | text | |
| token_usage | jsonb | Optional |
| created_at | timestamp | |

---

## 8.14 Table: manual_overrides

Stores user overrides.

### Fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| metric_id | foreign key | metrics.id |
| snapshot_id | foreign key | snapshots.id, nullable |
| override_type | enum | value / score / weight / note |
| original_value | jsonb | |
| override_value | jsonb | |
| reason | text | |
| enabled | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 9. Initial Metrics and Sources

## 9.1 MVP Metrics

| Category | Metric | Symbol / Source | Automation |
|---|---|---|---|
| Liquidity | M2 Money Supply | FRED `M2SL` | Automatic |
| Liquidity | Weekly M2 | FRED `WM2NS` | Automatic |
| Liquidity | Fed Balance Sheet | FRED `WALCL` | Automatic |
| Rates | Fed Funds Rate | FRED `FEDFUNDS` | Automatic |
| Rates | 2Y Treasury Yield | FRED `DGS2` | Automatic |
| Bonds | 10Y Treasury Yield | FRED `DGS10` | Automatic |
| Yield Curve | 10Y-2Y Spread | FRED `T10Y2Y` | Automatic |
| Credit | High Yield OAS | FRED `BAMLH0A0HYM2` | Automatic |
| Volatility | VIX | FRED `VIXCLS` | Automatic |
| Dollar | DXY | Market data provider | Semi/Automatic |
| Equities | S&P 500 | Market data provider | Semi/Automatic |
| Equities | Nasdaq 100 | Market data provider | Semi/Automatic |
| Equities | Russell 2000 | Market data provider | Semi/Automatic |
| Commodities | Gold | Market data provider | Semi/Automatic |
| Commodities | Silver | Market data provider | Semi/Automatic |
| Crypto | BTC | CoinGecko / CMC | Automatic |
| Crypto | ETH | CoinGecko / CMC | Automatic |

## 9.2 Later Metrics

| Category | Metric |
|---|---|
| Liquidity | Bank Reserves |
| Liquidity | Reverse Repo |
| Liquidity | Treasury General Account |
| Liquidity | Global Liquidity Proxy |
| Rates | Rate Cut Expectations |
| Bonds | MOVE Index |
| Yield Curve | 10Y-3M |
| Credit | Investment Grade OAS |
| Equities | Equal-Weight S&P 500 |
| Breadth | % above MA200 |
| Breadth | % above MA50 |
| Breadth | Advance/Decline Line |
| Breadth | New Highs vs New Lows |
| Commodities | Copper |
| Commodities | Oil |
| Crypto | Total Crypto Market Cap |
| Crypto | BTC Dominance |
| Crypto | Stablecoin Supply |
| Sentiment | Equity Fear & Greed |
| Sentiment | CMC Fear & Greed |
| Sentiment | AAII |
| Sentiment | Put/Call Ratio |

---

## 10. Scoring Engine

## 10.1 Metric Score Range

Each metric receives a raw score from **-5 to +5**.

| Score | Meaning |
|---:|---|
| +5 | Extremely supportive |
| +4 | Strongly supportive |
| +3 | Bullish |
| +2 | Mildly bullish |
| +1 | Slightly positive |
| 0 | Neutral / unclear |
| -1 | Slightly negative |
| -2 | Mildly bearish |
| -3 | Bearish |
| -4 | Strongly bearish |
| -5 | Severe stress / extremely bearish |

---

## 10.2 Category Score Formula

Each category score is the weighted average of its enabled metrics.

```text
Category Score =
Σ(metric_score × metric_weight_inside_category)
/
Σ(metric_weight_inside_category)
```

---

## 10.3 Weighted Raw Score Formula

```text
Weighted Raw Score =
Σ(category_score × category_weight)
```

Category weights should sum to 1.0.

---

## 10.4 Market Regime Score Formula

The weighted raw score ranges from -5 to +5.

Convert it to 0–100:

```text
Market Score =
((Weighted Raw Score + 5) / 10) × 100
```

---

## 10.5 Macro Regime Oscillator Formula

```text
Oscillator =
(Market Score - 50) × 2
```

Range:

```text
-100 to +100
```

---

## 10.6 Default Category Weights

| Category | Weight |
|---|---:|
| Liquidity | 16% |
| Credit | 14% |
| Rates | 12% |
| Dollar | 10% |
| Bonds / Yields | 10% |
| Equities | 8% |
| Market Breadth | 8% |
| Volatility | 8% |
| Yield Curve | 8% |
| Commodities | 3% |
| Crypto | 2% |
| Sentiment | 1% |

All weights must be editable.

---

## 10.7 Required Weight Visibility

The UI must show:

1. Category weight
2. Metric weight inside category
3. Metric raw score
4. Metric weighted contribution
5. Category score
6. Category weighted contribution
7. Total contribution to final Market Regime Score

Example:

```text
Metric: VIX
Raw score: +2
Metric weight inside Volatility: 70%
Volatility category weight: 8%
Final weighted contribution: +0.112
```

---

## 11. Default Regime Thresholds

| Market Score | Regime | Investor Posture |
|---:|---|---|
| 80–100 | Strong Risk-On | Risk-On, monitor overheating |
| 65–79 | Risk-On | Risk-On |
| 55–64 | Early Risk-On | Cautious Risk-On |
| 45–54 | Neutral / Mixed | Neutral |
| 35–44 | Weakening | Defensive / Neutral |
| 20–34 | Risk-Off | Defensive |
| 0–19 | Panic / Stress | Panic Watch |

---

## 12. Trend Calculation

The system should calculate trend using current score vs previous snapshot.

### Market trend

| Condition | Trend |
|---|---|
| Current score >= previous score + 5 | Improving |
| Current score <= previous score - 5 | Deteriorating |
| Difference between -5 and +5 | Stable |

### Metric trend

For each metric, calculate:

- 1D change if available
- 1W change
- 1M change
- 3M change

If a metric updates monthly, the system should not mark it stale just because it does not update daily. Freshness must respect expected frequency.

---

## 13. Data Freshness Logic

Each metric has an expected update frequency.

| Expected Frequency | Freshness Window |
|---|---|
| Daily | 48 hours |
| Weekly | 10 days |
| Monthly | 45 days |
| Manual | User-defined |

### Freshness labels

| Label | Meaning |
|---|---|
| Fresh | Updated within expected window |
| Delayed | Slightly outside expected window |
| Stale | Significantly outdated |
| Manual | User-provided value |

---

## 14. Confidence Logic

Each metric has confidence based on source and freshness.

| Confidence | Meaning |
|---|---|
| High | Official or highly reliable source, fresh data |
| Medium | Reliable but delayed, proxy, or semi-automatic source |
| Low | Manual, scraped, stale, or uncertain data |

The snapshot-level confidence should be calculated from metric confidence and freshness.

---

## 15. API Contract

## 15.1 GET /api/metrics

Returns all metric definitions.

### Response

```json
{
  "metrics": [
    {
      "id": "vix",
      "name": "VIX",
      "category": "volatility",
      "source": "FRED:VIXCLS",
      "metric_weight": 0.7,
      "enabled": true
    }
  ]
}
```

---

## 15.2 GET /api/metrics/latest

Returns latest metric values and scores.

### Response

```json
{
  "metrics": [
    {
      "metric_id": "vix",
      "name": "VIX",
      "value": 18.4,
      "timestamp": "2026-05-17",
      "trend": "down",
      "raw_score": 2,
      "source": "FRED",
      "freshness": "fresh",
      "confidence": "high"
    }
  ]
}
```

---

## 15.3 POST /api/snapshots/refresh

Main MVP endpoint.

### Purpose

Fetch latest data, calculate scores, save snapshot, and return dashboard-ready output.

### Request

```json
{
  "generate_ai": false,
  "force_refresh": true
}
```

### Processing steps

1. Load enabled metrics.
2. Fetch latest values from preferred sources.
3. Use fallback source if preferred source fails.
4. Store raw metric values.
5. Calculate metric changes.
6. Calculate metric raw scores.
7. Calculate category scores.
8. Calculate final Market Score.
9. Calculate Macro Regime Oscillator.
10. Assign regime label.
11. Calculate trend vs previous snapshot.
12. Detect top positive and negative signals.
13. Save snapshot.
14. Return snapshot payload.

### Response

```json
{
  "snapshot": {
    "id": "snapshot_123",
    "created_at": "2026-05-17T09:00:00+03:00",
    "market_score": 63,
    "oscillator_value": 26,
    "regime_label": "Early Risk-On",
    "trend": "Improving",
    "confidence": "Medium",
    "data_freshness": "Good"
  },
  "category_scores": [
    {
      "category": "volatility",
      "raw_category_score": 2.2,
      "category_weight": 0.08,
      "weighted_contribution": 0.176
    }
  ],
  "metrics": [
    {
      "metric_id": "vix",
      "value": 18.4,
      "raw_score": 2,
      "weighted_contribution": 0.112,
      "source": "FRED",
      "freshness": "fresh",
      "confidence": "high"
    }
  ],
  "what_changed": {
    "market_score_change": 5,
    "biggest_improvements": ["VIX", "DXY"],
    "biggest_deteriorations": ["Breadth"]
  }
}
```

---

## 15.4 GET /api/snapshots

Returns historical snapshots.

### Query params

| Param | Type | Notes |
|---|---|---|
| limit | number | Default 30 |
| from | date | Optional |
| to | date | Optional |

---

## 15.5 GET /api/snapshots/:id

Returns full snapshot details.

---

## 15.6 POST /api/ai/interpret-snapshot

Generates AI interpretation for a snapshot.

### Request

```json
{
  "snapshot_id": "snapshot_123",
  "prompt_template": "full_regime_interpretation"
}
```

### Response

```json
{
  "interpretation_id": "ai_123",
  "snapshot_id": "snapshot_123",
  "output_text": "The market is improving but not fully confirmed...",
  "created_at": "2026-05-17T09:05:00+03:00"
}
```

---

## 15.7 POST /api/ai/explain-metric

Explains one metric.

### Request

```json
{
  "metric_id": "vix",
  "snapshot_id": "snapshot_123"
}
```

---

## 15.8 GET /api/settings/scoring

Returns category weights, metric weights, rules, and thresholds.

---

## 15.9 PUT /api/settings/scoring

Updates scoring settings.

---

## 15.10 GET /api/settings/prompts

Returns prompt templates.

---

## 15.11 PUT /api/settings/prompts

Updates prompt templates.

---

## 16. Data Fetching Strategy

## 16.1 Source Priority

For every metric:

```text
1. Try preferred source
2. If unavailable, try fallback source
3. If no value is available, mark metric unavailable/stale
4. Never silently replace the source without showing it
```

## 16.2 FRED Fetcher

Initial FRED series:

| Metric | FRED Series |
|---|---|
| M2 | M2SL |
| Weekly M2 | WM2NS |
| Fed Balance Sheet | WALCL |
| Fed Funds | FEDFUNDS |
| 2Y Treasury | DGS2 |
| 10Y Treasury | DGS10 |
| 10Y-2Y | T10Y2Y |
| High Yield OAS | BAMLH0A0HYM2 |
| VIX | VIXCLS |

## 16.3 Market Data Fetcher

Needed for:

| Metric | Example Symbol |
|---|---|
| DXY | DXY / DX-Y.NYB |
| S&P 500 | ^GSPC |
| Nasdaq 100 | ^NDX |
| Russell 2000 | ^RUT |
| Gold | GC=F / XAUUSD |
| Silver | SI=F / XAGUSD |
| BTC | BTC-USD |
| ETH | ETH-USD |

The actual provider can be selected during implementation.

---

## 17. AI Prompt Templates

## 17.1 Full Regime Interpretation Prompt

```text
You are analyzing a macro market regime dashboard.

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

Return a structured explanation.
```

---

## 17.2 Metric Explanation Prompt

```text
Explain this market regime metric.

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
5. What would make the interpretation wrong
```

---

## 17.3 Weekly Review Prompt

```text
Create a weekly macro regime review based only on the provided snapshots.

Focus on:
1. What improved
2. What deteriorated
3. Which categories drove the regime score
4. Whether the market is moving toward Risk-On, Risk-Off, Panic Watch, or Overheated
5. Whether the change is broad or narrow
6. General investor posture only

Do not recommend specific assets.
Do not add external facts unless they are provided in the input.
```

---

## 17.4 Crisis Mode Prompt

```text
Analyze whether the current market environment is in crisis mode.

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
- What needs to improve before risk appetite can return
```

---

## 18. Implementation Phases

## Phase 1 — App Skeleton

Build:

- Next.js app
- Navigation
- Dashboard page
- Metrics page
- Charts page
- Settings page
- Snapshots page
- AI page
- Placeholder data

## Phase 2 — Database

Create tables:

- categories
- metrics
- data_sources
- metric_values
- metric_scores
- category_scores
- snapshots
- snapshot_metrics
- scoring_rules
- regime_thresholds
- prompt_templates
- ai_interpretations
- manual_overrides
- app_settings

## Phase 3 — Seed Config

Seed:

- Initial categories
- Initial metrics
- Default weights
- Default regime thresholds
- Initial scoring rules
- Initial prompt templates
- Data sources

## Phase 4 — FRED Integration

Implement FRED fetcher for:

- M2SL
- WM2NS
- WALCL
- FEDFUNDS
- DGS2
- DGS10
- T10Y2Y
- BAMLH0A0HYM2
- VIXCLS

## Phase 5 — Scoring Engine

Implement:

- Trend calculation
- Metric scoring
- Category scoring
- Final Market Score
- Oscillator
- Regime label
- Trend vs previous snapshot
- Confidence/freshness calculation

## Phase 6 — Snapshot Engine

Implement:

- Refresh endpoint
- Snapshot save
- Snapshot detail
- Snapshot list
- What Changed comparison

## Phase 7 — Charts

Implement:

- Oscillator chart
- Market Score chart
- Metric charts
- Category score charts

## Phase 8 — AI Layer

Implement:

- Full regime interpretation
- Metric explanation
- Weekly review
- Prompt template editor
- Save AI interpretation

## Phase 9 — Market Data Provider

Add DXY, S&P, Nasdaq, Russell, Gold, Silver, BTC, ETH.

---

## 19. MVP Acceptance Criteria

The MVP is complete when the user can:

1. Open the dashboard.
2. Click **Refresh Market Snapshot**.
3. Pull at least the first FRED metrics automatically.
4. See raw metric values.
5. See sources for each metric.
6. See freshness and confidence.
7. See metric scores from -5 to +5.
8. See category weights and metric weights.
9. Edit category and metric weights.
10. See final Market Regime Score.
11. See Macro Regime Oscillator.
12. Save a snapshot.
13. View snapshot history.
14. Generate AI interpretation on demand.
15. View and edit AI prompts.
16. Understand what changed from the previous snapshot.

---

## 20. Security and Privacy

Since the MVP is personal-first:

- Use simple private authentication.
- Store API keys server-side only.
- Do not expose AI keys to the frontend.
- Do not expose private config publicly.
- Keep AI prompts and interpretations private by default.
- Do not send unnecessary data to AI.
- Only send snapshot data needed for the requested interpretation.

---

## 21. Future Roadmap

After MVP:

| Version | Additions |
|---|---|
| v0.2 | More market data sources, commodities, crypto, DXY |
| v0.3 | Better market breadth data |
| v0.4 | Crisis Mode UI |
| v0.5 | Weekly review workflow |
| v0.6 | Portfolio overlay |
| v0.7 | Thesis engine |
| v0.8 | Alerts |
| v0.9 | Backtesting regime score vs market behavior |
| v1.0 | Stable personal product |
| v2.0 | Public / SaaS mode |

---

## 22. Final Implementation Rule

The MVP should be built around one principle:

> A macro investor should be able to understand the market regime, inspect the data behind it, control the scoring assumptions, and generate AI interpretation only when needed.
