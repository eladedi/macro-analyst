# Macro Market Regime Monitor — Implementation Roadmap

**File name:** `Macro-Market-Regime-Monitor_Implementation-Roadmap.md`
**Version:** v0.1
**Status:** Planning — start-to-end implementation plan
**Source of truth:** `Macro-Market-Regime-Monitor_Product-Brief.md` + `Macro-Market-Regime-Monitor_MVP-Technical-Spec-v0.1.md`

> This roadmap operationalizes the 9 phases in the Technical Spec into concrete,
> sequenced deliverables with acceptance checks. It does not change product
> direction. Where the spec leaves a choice open, it is flagged as an
> **Open Decision** to confirm before that phase starts.

---

## 0. Conventions Used in This Roadmap

- **Deliverables** — what exists when the phase is done.
- **Acceptance** — observable checks proving the phase works.
- **Depends on** — phases that must complete first.
- **Open Decision** — a choice to confirm with the user before/at phase start.
- **Spec ref** — section(s) in the Technical Spec or Product Brief.

Status legend for tracking later: `[ ] not started` · `[~] in progress` · `[x] done`

---

## Phase 0 — Decisions & Project Setup

**Goal:** Lock the open choices and stand up an empty, runnable Next.js project.

### Decisions (RESOLVED 2026-05-17)

| # | Decision | **Resolved choice** |
|---|---|---|
| D1 | Database | **Supabase Postgres** (managed; built-in Auth available; Vercel-friendly) |
| D2 | Auth | **Simple private auth** — single shared secret gate (personal-first, Spec §20) |
| D3 | AI provider | **Anthropic Claude API** — server-side only, key in env |
| D4 | Market-data provider | OPEN — deferred to Phase 9 (FRED-only until then) |
| D5 | FRED API key | ACTION — user obtains free FRED API key before Phase 4 |
| D6 | Deployment target | **Vercel + Supabase** (follows from D1) |
| D7 | Dev DB hosting | **Supabase cloud project** (free tier) |
| D8 | Scoring rules | **Seed conservative defaults** per metric; user tunes in Settings |

### Deliverables

- Next.js + TypeScript app initialized (App Router).
- Tailwind CSS configured.
- Core libs installed: TanStack Query, TanStack Table, Zustand, Recharts, DB client (Supabase JS or `pg`/Prisma).
- Project structure: `app/`, `lib/`, `components/`, `db/`, `config/`.
- `.env.example` with placeholders: `FRED_API_KEY`, `ANTHROPIC_API_KEY`, DB connection vars, auth secret.
- `.gitignore`, base `README` pointer to spec + roadmap.
- Lint/format config (ESLint + Prettier).
- First git commit.

### Acceptance

- `npm run dev` serves a blank app at `http://localhost:3000` with no errors.
- Tailwind utility classes render.
- Env files are git-ignored; `.env.example` is committed.

---

## Phase 1 — App Skeleton

**Spec ref:** Spec §18 Phase 1, §7 (all pages), Brief §16
**Depends on:** Phase 0

**Goal:** All pages and navigation exist with placeholder data; no real data or DB yet.

### Deliverables

- Global layout with persistent navigation across all routes.
- Routes with static/placeholder content:
  - `/dashboard` — Market Score, Oscillator, Regime Label, Trend, Confidence, Last Updated, Data Freshness, Refresh button, Generate AI button, core + supporting category cards, "What Changed", AI summary block (layout per Spec §7.1).
  - `/metrics` — full metric table with all columns from Spec §7.2 (placeholder rows).
  - `/charts` — chart placeholders for each chart in Spec §7.3.
  - `/ai` — action buttons per Spec §7.4 (non-functional).
  - `/settings` — sections per Spec §7.5 (read-only placeholders).
  - `/snapshots` — list + detail + compare placeholders per Spec §7.6.
  - Crisis Mode view placeholder (Brief §16.5) — can live under `/ai` or its own route.
- Shared UI components: `ScoreGauge`, `OscillatorBadge`, `MetricCard`, `CategoryCard`, `DataTable`, `FreshnessBadge`, `ConfidenceBadge`, `RegimeLabel`.
- Zustand store skeleton + TanStack Query provider wired (not yet fetching).

### Acceptance

- Every route in Spec §7 is reachable from navigation and renders without error.
- Dashboard visually matches the layout intent of Spec §7.1.
- Placeholder data is clearly marked as placeholder (not mistakable for real data).

---

## Phase 2 — Database

**Spec ref:** Spec §18 Phase 2, §8 (full data model)
**Depends on:** Phase 0 (D1, D7 confirmed)

**Goal:** All 14 tables exist with correct schema, keys, and constraints.

### Deliverables

- Migration scripts creating, with fields exactly per Spec §8.2–§8.14:
  `categories`, `metrics`, `data_sources`, `metric_values`, `metric_scores`,
  `category_scores`, `snapshots`, `snapshot_metrics`, `scoring_rules`,
  `regime_thresholds`, `prompt_templates`, `ai_interpretations`,
  `manual_overrides`, `app_settings`.
- Foreign keys and the `unique(metric_id, timestamp, source_id)` constraint on `metric_values` (Spec §8.5).
- Enums: freshness, confidence, automation_status, expected_frequency, trend, override_type, interpretation_type, data_source type, snapshot trend/freshness.
- DB client/data-access layer in `lib/db`.
- Migration runner + rollback path documented.

### Acceptance

- Migrations apply cleanly to an empty database and roll back cleanly.
- Schema matches Spec §8 field-by-field (types, nullability, FKs, unique constraint).
- A smoke insert/select works for each table via the data-access layer.

---

## Phase 3 — Seed Config

**Spec ref:** Spec §18 Phase 3, §9.1, §10.6, §11, §8.10 example, §17
**Depends on:** Phase 2

**Goal:** Database is seeded with default, editable configuration.

### Deliverables

- **Categories** (12) with default weights from Spec §10.6 (Liquidity 16%, Credit 14%, Rates 12%, Dollar 10%, Bonds/Yields 10%, Equities 8%, Breadth 8%, Volatility 8%, Yield Curve 8%, Commodities 3%, Crypto 2%, Sentiment 1%) — must sum to 1.0; `is_core` set correctly.
- **MVP metrics** (Spec §9.1) seeded with category links, units, source symbols, automation status, expected frequency, freshness windows, default confidence, metric weights inside category.
- **Data sources**: FRED seeded; market-data + CoinGecko/CMC seeded as defined-but-pending.
- **Regime thresholds** from Spec §11 (7 bands + postures).
- **Scoring rules** seeded per metric (JSON `rule_config` per Spec §8.10 pattern), starting with VIX example and a defined rule set for each MVP metric.
- **Prompt templates**: Full Regime Interpretation, Metric Explanation, Weekly Review, Crisis Mode (verbatim from Spec §17), with declared variables + output format.
- **app_settings**: AI usage defaults, freshness windows (Spec §13), confidence logic config (Spec §14).
- Idempotent re-seed (safe to run repeatedly).

### Acceptance

- Category weights sum to exactly 1.0.
- Every MVP metric resolves to a valid category, primary source, and a scoring rule.
- Regime thresholds cover 0–100 with no gaps/overlaps.
- All 4 prompt templates present and match Spec §17 text.

> **D8 resolved:** Seed conservative default rule sets per MVP metric (threshold →
> score), following the Spec §8.10 VIX pattern. User reviews and tunes them in
> Settings (Phase 10) — no code change required to adjust.

---

## Phase 4 — FRED Integration

**Spec ref:** Spec §18 Phase 4, §16.1–§16.2, §11 (Brief §11 source strategy)
**Depends on:** Phase 3, D5 (FRED API key)

**Goal:** Fetch and store real values for the 9 FRED series with source-priority + freshness handling.

### Deliverables

- FRED fetcher service (server-side) for: `M2SL`, `WM2NS`, `WALCL`, `FEDFUNDS`, `DGS2`, `DGS10`, `T10Y2Y`, `BAMLH0A0HYM2`, `VIXCLS`.
- Source-priority logic (Spec §16.1): try primary → fallback → mark unavailable/stale; never silently swap source.
- Persist into `metric_values` (raw value, timestamp, source_id, freshness, confidence, metadata) respecting the unique constraint.
- Freshness logic per expected frequency (Spec §13) — monthly series not marked stale for not updating daily (Spec §12 note).
- Internal endpoint to trigger a FRED-only fetch.

### Acceptance

- A fetch run populates `metric_values` for all 9 FRED metrics with correct timestamps.
- Stale/unavailable handling produces correct freshness labels (no false "stale" on monthly series).
- Re-running a fetch does not create duplicate rows (unique constraint holds).
- No API key leaks to client; all FRED calls are server-side.

---

## Phase 5 — Scoring Engine

**Spec ref:** Spec §18 Phase 5, §10, §12, §13, §14
**Depends on:** Phase 4

**Goal:** Turn stored values into metric scores, category scores, Market Score, Oscillator, regime label, and trend.

### Deliverables

- Change calculation: 1D / 1W / 1M / 3M per metric (Spec §12).
- Metric raw scoring (−5..+5) from `scoring_rules.rule_config` with `score_reason` label and `fallback_score`.
- Category score = weighted avg of enabled metrics (Spec §10.2).
- Weighted raw score = Σ(category_score × category_weight) (Spec §10.3).
- Market Score = `((weighted_raw + 5) / 10) × 100` (Spec §10.4).
- Oscillator = `(Market Score − 50) × 2` (Spec §10.5).
- Regime label from `regime_thresholds` (Spec §11).
- Market trend vs previous snapshot (±5 rule, Spec §12).
- Confidence (Spec §14) + snapshot-level freshness/confidence aggregation.
- Per-metric weighted contribution to final score (Spec §10.7) computed and exposed.

### Acceptance

- Worked example reproduces Spec §10.7: VIX raw +2, metric weight 70%, Volatility category weight 8% → final contribution +0.112.
- Market Score and Oscillator math verified by unit tests against spec formulas.
- Disabled metrics/categories are excluded from weighting correctly.
- Regime label selection matches threshold bands exactly at boundaries.

---

## Phase 6 — Snapshot Engine

**Spec ref:** Spec §18 Phase 6, §15.3–§15.5, Brief §15
**Depends on:** Phase 5

**Goal:** The core MVP loop — `Refresh Market Snapshot` end to end.

### Deliverables

- `POST /api/snapshots/refresh` implementing the 14 processing steps (Spec §15.3): load enabled metrics → fetch → store → changes → scores → category scores → Market Score → Oscillator → regime label → trend → top signals → save snapshot → return payload.
- Snapshot persistence across `snapshots`, `snapshot_metrics`, `metric_scores`, `category_scores` with full saved values (Brief §15).
- "What Changed" comparison vs previous snapshot (biggest improvements/deteriorations).
- `GET /api/snapshots` (limit/from/to), `GET /api/snapshots/:id`, `GET /api/metrics`, `GET /api/metrics/latest`.
- Dashboard, Metrics, and Snapshots pages wired to real endpoints (replace placeholders); Refresh button functional.

### Acceptance

- Clicking **Refresh Market Snapshot** produces a saved snapshot and updates the dashboard with real FRED-backed numbers.
- Response payload shape matches Spec §15.3 example.
- Snapshot history list and detail render saved data; "What Changed" is correct between two snapshots.
- A second refresh creates a new snapshot and computes trend vs the prior one.

---

## Phase 7 — Charts

**Spec ref:** Spec §18 Phase 7, §7.3
**Depends on:** Phase 6 (needs snapshot history + stored values)

**Goal:** Visual analysis pages backed by real data.

### Deliverables

- Recharts components for: Macro Regime Oscillator (history), Market Score (history), Liquidity (M2/Weekly M2/Fed BS), Credit (HY OAS), Volatility (VIX), Treasury Yields (10Y/2Y), Yield Curve (10Y-2Y). Category-score charts.
- Mini charts on metric cards / Metrics table (Spec §7.2 "Chart" column).
- Empty/low-history states handled gracefully.

### Acceptance

- Oscillator and Market Score charts plot real snapshot history.
- Each FRED-backed metric chart renders from stored `metric_values`.
- Charts update after a new refresh without manual reload.

---

## Phase 8 — AI Layer

**Spec ref:** Spec §18 Phase 8, §15.6–§15.7, §15.10–§15.11, §17; Brief §12–§14
**Depends on:** Phase 6, D3 (AI provider)

**Goal:** On-demand AI interpretation with full prompt transparency.

### Deliverables

- Server-side AI service (key in env, never exposed to client).
- `POST /api/ai/interpret-snapshot` (full regime interpretation) and `POST /api/ai/explain-metric`.
- Weekly Review + Crisis Mode interpretations.
- Persist outputs to `ai_interpretations` (input payload, output, model, token usage).
- Prompt template editor: `GET/PUT /api/settings/prompts` + Settings UI; prompts editable and used at runtime.
- AI page actions functional (Spec §7.4); AI summary surfaces on dashboard when generated.
- Guardrails enforced (Brief §12–§14): only provided data, no security recommendations, posture-only, flag stale/missing data, never present AI text as raw data.
- Only necessary snapshot data sent to AI (Spec §20).

### Acceptance

- "Generate AI Interpretation" returns a structured interpretation saved and viewable later.
- Editing a prompt in Settings changes the next AI output accordingly.
- "Explain This Metric" returns a metric-specific explanation.
- No AI key reachable from the browser; payload contains only needed data.

---

## Phase 9 — Market Data Provider

**Spec ref:** Spec §18 Phase 9, §9.1, §16.3; Roadmap v0.2
**Depends on:** Phase 6, D4 (provider choice)

**Goal:** Add the remaining MVP metrics beyond FRED.

### Deliverables

- Provider integration for DXY, S&P 500, Nasdaq 100, Russell 2000, Gold, Silver, BTC, ETH (CoinGecko/CMC for crypto per Spec §9.1).
- Source-priority + fallback wired identically to FRED path (Spec §16.1).
- These metrics flow through scoring, snapshots, and charts automatically.

### Acceptance

- All Spec §9.1 metrics produce values, scores, and chart data.
- Provider failure degrades gracefully to stale/unavailable with visible source — no silent substitution.

---

## Phase 10 — Settings, Editing & Hardening (MVP Close-out)

**Spec ref:** Spec §15.8–§15.9, §7.5, §19, §20; Brief §10
**Depends on:** Phases 5–9

**Goal:** Make the model fully inspectable/editable and verify all MVP acceptance criteria.

### Deliverables

- `GET/PUT /api/settings/scoring` + Settings UI to view/edit category weights, metric weights, scoring rules, regime thresholds, source priority, manual overrides (Brief §10.1, Spec §7.5).
- Weight transparency surfaced everywhere (Brief §10.4): value, direction, score, category, category weight, metric weight, final contribution, source, freshness, confidence.
- Manual overrides (`manual_overrides`) honored in scoring with reason + audit.
- Security/privacy pass (Spec §20): keys server-side, private config not exposed, single-user auth enforced.
- Full run-through of Spec §19 acceptance criteria (1–16) and Brief §17 success criteria (1–10).

### Acceptance — MVP DONE when all true (Spec §19 / Brief §17)

1. Open dashboard.
2. Click Refresh Market Snapshot.
3. Pull FRED metrics automatically.
4. See raw values.
5. See per-metric sources.
6. See freshness + confidence.
7. See metric scores −5..+5.
8. See category + metric weights.
9. Edit category + metric weights (no code change).
10. See final Market Regime Score.
11. See Macro Regime Oscillator.
12. Save a snapshot.
13. View snapshot history.
14. Generate AI interpretation on demand.
15. View + edit AI prompts.
16. Understand what changed vs previous snapshot.

---

## Dependency Flow (Critical Path)

```text
Phase 0 (setup + decisions)
   ↓
Phase 1 (skeleton) ──┐
   ↓                 │
Phase 2 (DB)         │
   ↓                 │
Phase 3 (seed)       │
   ↓                 │
Phase 4 (FRED)       │
   ↓                 │
Phase 5 (scoring)    │
   ↓                 │
Phase 6 (snapshots) ←┘  ← core MVP loop usable here
   ↓
 ├── Phase 7 (charts)
 ├── Phase 8 (AI layer)
 └── Phase 9 (market data)
        ↓
Phase 10 (settings/editing + MVP acceptance)  → MVP COMPLETE
```

**Earliest usable product:** end of Phase 6 (refresh → score → snapshot with FRED data).
**MVP complete:** end of Phase 10 (all Spec §19 criteria pass).

---

## Open Decisions Summary

| ID | Decision | Status | Needed by |
|---|---|---|---|
| D1 | Supabase vs local Postgres | ✅ Supabase | Phase 2 |
| D2 | Auth approach | ✅ Simple private auth | Phase 0/10 |
| D3 | AI provider | ✅ Anthropic Claude API | Phase 8 |
| D4 | Market-data provider | ⏳ Open — decide at Phase 9 | Phase 9 |
| D5 | FRED API key obtained | ⚠️ Action — user to provide | Phase 4 |
| D6 | Deployment target | ✅ Vercel + Supabase | Pre-launch |
| D7 | Dev DB hosting | ✅ Supabase cloud (free tier) | Phase 2 |
| D8 | Per-metric scoring rule sets | ✅ Seed conservative defaults | Phase 3 |

---

## Out of Scope (MVP) — per Spec §3 / Brief §5

Stock picking · buy/sell recommendations · automated trading · broker integration ·
portfolio optimization · thesis engine · backtesting · real-time alerting ·
multi-user SaaS · complex context-aware regime modeling · automated news interpretation.

These belong to the post-MVP roadmap (Spec §21 / Brief §18) and must not creep into MVP work.
