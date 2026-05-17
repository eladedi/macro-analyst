# Macro Market Regime Monitor — Product Brief

**File name:** `Macro-Market-Regime-Monitor_Product-Brief.md`  
**Version:** v0.1  
**Product type:** Personal macro-investing web application  
**Initial user:** Elad  
**Future direction:** Potential SaaS / public product later, but MVP is personal-first.

---

## 1. Product Summary

**Macro Market Regime Monitor** is a web-based macro dashboard designed to help a macro-driven investor understand the current state of the market.

The tool aggregates market, macro, liquidity, credit, volatility, sentiment, commodities, and crypto-related indicators from reliable online sources and translates them into a clearer picture of the current market regime.

The product does **not** start as a stock-picking tool, trading bot, portfolio optimizer, or recommendation engine.

Its first purpose is simple:

> Help the user understand whether the market environment is Risk-On, Risk-Off, Neutral, Overheated, or in Panic Watch.

---

## 2. Core Problem

Macro investors often track many separate indicators across many different websites:

- Liquidity indicators
- Interest rates
- Bond yields
- Yield curve
- Credit spreads
- Volatility
- Dollar strength
- Equity indices
- Market breadth
- Commodities
- Crypto risk appetite
- Sentiment indicators
- Macro event calendars

The problem is not only collecting the data.

The real problem is understanding:

1. What is the market regime right now?
2. Is the regime improving or deteriorating?
3. Are risk assets supported by macro conditions?
4. Are there signs of market stress, panic, or opportunity?
5. Which indicators are driving the current market view?
6. How much weight does each metric have in the final score?
7. Can the user inspect and control the assumptions behind the scoring model?

This product exists to turn scattered market data into a clear, transparent, and controllable market-regime view.

---

## 3. Primary User

The initial user is a macro-driven investor who:

- Thinks in terms of market regimes, liquidity, risk appetite, rates, credit, and cycles.
- Wants to understand the state of the market before making investment decisions.
- Uses both daily and weekly market reviews.
- Prefers structured, data-backed interpretation.
- Wants AI interpretation, but only when requested.
- Wants the scoring model, weights, prompts, and assumptions to be visible and editable.
- Does not want a black-box system.

---

## 4. Main Product Goal

The product should answer four core questions:

1. **Market state:** Is the market currently Risk-On, Risk-Off, Neutral, Panic Watch, or Overheated?
2. **Direction:** Is the market environment improving, stable, or deteriorating?
3. **Drivers:** Which indicators are pushing the score up or down?
4. **Interpretation:** What does the data mean from a macro-investing perspective?

The output should help the user understand the environment before making investment decisions.

---

## 5. MVP Scope

The MVP should focus only on market-regime monitoring.

### Included in MVP

- Clean dashboard
- Manual refresh button
- Market Regime Score
- Macro Regime Oscillator
- Core metrics table
- Metric charts
- Metric weights
- Editable scoring rules
- Visible source per metric
- Data freshness status
- Confidence level per metric
- Historical snapshots
- AI interpretation on demand
- Prompt visibility and editability

### Not included in MVP

- Stock picking
- Portfolio allocation engine
- Automated trading
- Broker integration
- Advanced portfolio risk engine
- Full thesis engine
- Alerts
- Multi-user SaaS mode
- Backtesting
- Fully automated context-aware scoring

---

## 6. Core Product Principle

The product should follow this principle:

> Show the data first, calculate transparently second, and interpret with AI only when requested.

This means:

1. The user first sees raw metrics and charts.
2. The system then calculates normalized scores.
3. The user can inspect how the score was calculated.
4. The AI layer explains the result only when the user requests it.

---

## 7. User Workflow

### Daily workflow

1. User opens the dashboard.
2. User clicks **Refresh Market Snapshot**.
3. The system pulls available market and macro data.
4. The system updates charts and metric values.
5. The system calculates metric scores.
6. The system calculates category scores.
7. The system calculates the final Market Regime Score.
8. The system updates the Macro Regime Oscillator.
9. The system saves a historical snapshot.
10. User may optionally click **Generate AI Interpretation**.

### Weekly workflow

1. User opens the weekly review view.
2. The system compares recent snapshots.
3. User clicks **Generate Weekly Review**.
4. AI summarizes what improved, what deteriorated, and what the current market regime means.

---

## 8. Key Outputs

### 8.1 Market Regime Score

A normalized score from **0 to 100**.

| Score Range | Regime |
|---:|---|
| 80–100 | Strong Risk-On |
| 65–79 | Risk-On |
| 55–64 | Early / Cautious Risk-On |
| 45–54 | Neutral / Mixed |
| 35–44 | Weakening |
| 20–34 | Risk-Off |
| 0–19 | Panic / Stress |

---

### 8.2 Macro Regime Oscillator

A custom market-state oscillator from **-100 to +100**.

| Oscillator Zone | Meaning |
|---:|---|
| +70 to +100 | Strong Risk-On / possible overheating |
| +30 to +70 | Healthy Risk-On |
| -30 to +30 | Neutral / transition |
| -70 to -30 | Risk-Off |
| -100 to -70 | Panic / severe stress / opportunity watch |

Formula:

```text
Oscillator = (Market Score - 50) × 2
```

---

### 8.3 General Investor Posture

The AI interpretation may include a general posture, but not specific investment recommendations.

Allowed posture labels:

| Posture | Meaning |
|---|---|
| Defensive | Reduce risk / hold more cash |
| Neutral | Do not chase, wait for clarity |
| Cautious Risk-On | Small tranches may be reasonable |
| Risk-On | Environment supports higher risk exposure |
| Panic Watch | Look for bottoming/stabilization signs |
| Overheated | Be careful of euphoria and crowded risk |

---

## 9. Metrics Universe

The tool should track the following categories.

### Core categories

| Category | Purpose |
|---|---|
| Liquidity | Measures whether more or less money is available in the system |
| Rates | Measures cost of money and policy direction |
| Bonds / Yields | Measures Treasury yield pressure or support |
| Yield Curve | Measures recession/recovery expectations |
| Credit | Measures stress or calm in credit markets |
| Volatility | Measures fear and uncertainty |
| Dollar | Measures global dollar pressure |
| Equities | Measures broad equity-market health |
| Market Breadth | Measures whether market participation is broad or narrow |

### Supporting categories

| Category | Purpose |
|---|---|
| Commodities | Measures inflation, growth, fear, and dollar sensitivity |
| Crypto | Measures speculative risk appetite and crypto liquidity |
| Sentiment | Measures investor psychology and possible crowding |
| Events | Measures macro event risk |

Crypto is treated as a **supporting indicator**, not a core market-regime driver in v1.

---

## 10. Metric Weights Requirement

The user must be able to **see, inspect, and control the weight of each metric**.

This is a core product requirement.

The product should not hide the scoring model.

### 10.1 Required weight controls

The settings page must allow the user to view and edit:

1. **Category weights**
2. **Metric weights inside each category**
3. **Final score contribution per metric**
4. **Final score contribution per category**
5. **Regime thresholds**
6. **Scoring rules**
7. **Manual overrides**

### 10.2 Category-level weights

Example category weights:

| Category | Default Weight |
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

These weights must be editable.

---

### 10.3 Metric-level weights

Each metric inside a category should also have its own weight.

Example:

| Category | Metric | Metric Weight Inside Category |
|---|---|---:|
| Liquidity | M2 | 30% |
| Liquidity | Weekly M2 | 20% |
| Liquidity | Fed Balance Sheet | 20% |
| Liquidity | Bank Reserves | 15% |
| Liquidity | Reverse Repo | 10% |
| Liquidity | TGA | 5% |

The system should show both:

1. The metric’s weight inside its category.
2. The metric’s total impact on the final Market Regime Score.

Example:

```text
Metric: VIX
Category: Volatility
Metric weight inside category: 70%
Category weight: 8%
Total final score influence: 5.6%
```

---

### 10.4 Weight transparency

Every metric card should show:

- Current value
- Direction
- Score
- Category
- Category weight
- Metric weight
- Final weighted contribution
- Source
- Freshness
- Confidence

Example:

```text
VIX
Current value: 18.4
Trend: Falling
Raw score: +2
Category: Volatility
Category weight: 8%
Metric weight inside category: 70%
Final contribution: +0.112
Source: FRED / CBOE
Freshness: Fresh
Confidence: High
```

---

### 10.5 Editable scoring configuration

Weights and rules should be stored in editable configuration, preferably JSON.

Example:

```json
{
  "category": "volatility",
  "category_weight": 0.08,
  "metrics": [
    {
      "metric_id": "vix",
      "metric_weight": 0.70,
      "score_range": [-5, 5],
      "enabled": true
    },
    {
      "metric_id": "vix_1w_change",
      "metric_weight": 0.30,
      "score_range": [-5, 5],
      "enabled": true
    }
  ]
}
```

The user should be able to modify these weights from the UI without changing code.

---

## 11. Data Sources

The product should use one preferred source per metric, with fallback only if the preferred source is unavailable.

Each metric should display:

- Source name
- Source type
- Last updated time
- Data freshness
- Confidence level

### Source strategy

```text
1. Try preferred source
2. If unavailable, try fallback source
3. If still unavailable, mark metric as stale or unavailable
4. Never silently replace a data source without showing the user
```

---

## 12. AI Layer

AI should be used for interpretation only.

AI should not continuously run in the background.

AI should be triggered manually through buttons such as:

- Generate AI Interpretation
- Explain This Metric
- Generate Weekly Review
- Explain What Changed
- Crisis Mode Interpretation

### AI rules

The AI must:

1. Use only provided data.
2. Separate data from interpretation.
3. Avoid specific buy/sell recommendations.
4. Provide general market posture only.
5. Explain uncertainty clearly.
6. Mention missing or stale data when relevant.
7. Not invent unavailable metrics.

---

## 13. Prompt Transparency

All AI prompts must be visible and editable in a dedicated settings page.

The user should be able to see and control:

- Full regime interpretation prompt
- Metric explanation prompt
- Weekly review prompt
- Crisis mode prompt
- Prompt variables
- Output format instructions

This is required because the user wants the system to be inspectable and controllable.

---

## 14. Data vs Interpretation Separation

The UI must clearly separate:

| Layer | Example |
|---|---|
| Raw data | VIX = 18.4 |
| Direction | Falling |
| Score | +2 |
| Interpretation | Fear is easing |
| AI explanation | The decline in volatility supports risk appetite |
| Caveat | If credit spreads rise, this signal is weaker |

The system should never present AI interpretation as raw data.

---

## 15. Snapshot History

Every refresh should create a snapshot.

A snapshot should include:

- Timestamp
- Raw metric values
- Metric scores
- Category scores
- Metric weights
- Category weights
- Final Market Score
- Macro Regime Oscillator
- Regime label
- Trend direction
- Data freshness
- Confidence
- AI interpretation, if generated

This allows the user to track how the market regime evolves over time.

---

## 16. Main Pages

### 16.1 Dashboard

Purpose: clean daily/weekly view.

Includes:

- Market Score
- Macro Regime Oscillator
- Regime Label
- Trend
- Confidence
- Last updated
- Refresh button
- AI interpretation button
- Core metric cards
- Supporting metric cards
- What changed section

---

### 16.2 Metrics

Purpose: full metric visibility.

Includes:

- Metric table
- Values
- Trends
- Scores
- Weights
- Sources
- Freshness
- Confidence
- Mini charts
- Explanation buttons

---

### 16.3 Charts

Purpose: visual analysis.

Includes charts for:

- Macro Regime Oscillator
- Market Score history
- Liquidity
- Credit spreads
- VIX
- DXY
- Treasury yields
- Yield curve
- Equity indices
- Breadth
- Commodities
- Crypto

---

### 16.4 AI Interpretation

Purpose: on-demand macro explanation.

Includes:

- Daily brief
- Weekly review
- Full regime interpretation
- Metric explanation
- Snapshot comparison

---

### 16.5 Crisis Mode

Purpose: stress-market analysis.

Checks:

- Volatility spike
- Credit stress
- Dollar squeeze
- Equity breakdown
- Breadth collapse
- Liquidity stress
- Crypto/speculative crash
- Stabilization signs
- Opportunity watch

---

### 16.6 Settings

Purpose: transparency and control.

Includes:

- Category weights
- Metric weights
- Scoring rules
- Regime thresholds
- Source priority
- AI prompt templates
- Manual overrides
- Token/AI usage settings

---

## 17. MVP Success Criteria

The MVP is successful if the user can:

1. Open the dashboard.
2. Refresh market data manually.
3. See a clear Market Regime Score.
4. See the custom Macro Regime Oscillator.
5. Understand which categories are driving the score.
6. Inspect every metric’s value, source, score, and weight.
7. Edit category and metric weights.
8. Save historical snapshots.
9. Generate AI interpretation on demand.
10. Review how the market regime changed over time.

---

## 18. Product Direction

The first version is a personal macro dashboard.

Future versions may add:

- Portfolio overlay
- Thesis engine
- Asset watchlist
- Decision journal
- Alerts
- Scenario builder
- Backtesting
- Multi-user SaaS mode
- Public-facing macro dashboard

But those should come only after the core market-regime monitor works reliably.

---

## 19. One-Sentence Definition

**Macro Market Regime Monitor is a transparent macro dashboard that aggregates key market indicators, lets the user control the weight and scoring of each metric, and converts the data into a clear market-regime view with optional AI interpretation.**
