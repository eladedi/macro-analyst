# Macro Market Regime Monitor — Build Progress

**File name:** `Macro-Market-Regime-Monitor_Build-Progress.md`
**Status:** Phases 0–10 complete — MVP DONE, committed & pushed
**Last updated:** 2026-05-18
**Source of truth:** `Macro-Market-Regime-Monitor_Product-Brief.md` + `..._MVP-Technical-Spec-v0.1.md` + `..._Implementation-Roadmap.md`

> Running log of what has actually been built and verified. Phase progress is
> authoritative in `git log`; this document is orientation + verification record.

---

## 1. Summary

The project is a Next.js 16 app backed by a live Supabase Postgres database.
**All 10 roadmap phases are complete, committed, and pushed to `origin/main`
— the MVP is done.** End-to-end on live FRED + Twelve Data + Supabase +
Claude: **Refresh Market Snapshot** fetches all 17 metrics, scores them,
persists a full snapshot; Dashboard/Metrics/Charts/Snapshots render live
data; **on-demand Claude interpretation** with editable prompts; the **full
scoring model is editable in Settings** (weights, thresholds, rules,
overrides) with no code change. All 16 Spec §19 / Brief §17 acceptance
criteria verified.

User-requested features beyond the original spec: an **"i" info button** on
every metric and dashboard category card, and a **column-reference legend**
under the Metrics table.

**MVP COMPLETE** (end of Phase 10). Remaining work is operational only:
deploy to Vercel, optionally rotate the Supabase password, post-MVP roadmap
(Spec §21 / Brief §18).

---

## 2. Resolved Decisions

| ID | Decision | Choice |
|---|---|---|
| D1 | Database | Supabase Postgres (cloud, free tier) |
| D2 | Auth | Simple private auth (single shared secret) — not yet implemented |
| D3 | AI provider | Anthropic Claude API (server-side only) |
| D6 | Deployment | Vercel + Supabase |
| D7 | Dev DB hosting | Supabase cloud free tier |
| D8 | Scoring rules | Seed conservative defaults per metric, user tunes in Settings |
| D9 | AI interpretation history | Append-only — every "Generate" inserts a new `ai_interpretations` row; newest surfaced, older still viewable (transparency over fewer rows) |
| D4 | Market-data provider | Resolved — **Twelve Data** for all 8 non-FRED metrics; CoinGecko/TradingView rejected (see D4-refinement) |
| D4-refinement | Free-tier coverage | Twelve Data free paywalls raw indices/DXY/XAG → use **ETF proxies**: SPY/QQQ/IWM/UUP/SLV + XAU/USD + BTC/USD + ETH/USD (scoring uses % change, so trend is preserved) |
| D5 | FRED API key | Resolved — `FRED_API_KEY` in `.env.local` (Phase 4 verified) |
| D3 | Anthropic key | Resolved — `ANTHROPIC_API_KEY` in `.env.local` (Phase 8 verified) |
| — | Twelve Data key | Resolved — `TWELVE_DATA_API_KEY` in `.env.local` (Phase 9 verified) |

**Open decisions:** none. All resolved.

---

## 3. Phase 0 — Project Setup  (commit `f5ff213`)

- Next.js 16 (App Router) + TypeScript + Tailwind CSS, created in a temp
  lowercase dir then moved into `D:\Macro-analyst` (npm rejects capitalised
  package names).
- Libraries: TanStack Query, TanStack Table, Zustand, Recharts, `postgres`,
  `@supabase/supabase-js`; dev: `tsx`, Prettier, ESLint.
- Folder structure: `app/`, `lib/db|fetchers|scoring|ai`,
  `components/ui|dashboard|charts`, `db/migrations`, `config/`.
- `.env.example` with all placeholders; `.env.local` is gitignored.
- Verified: `npm run build` clean.

---

## 4. Phase 1 — App Skeleton  (commit `7b699b0`)

- Global layout with persistent sidebar nav; root `/` redirects to `/dashboard`.
- Routes (placeholder data, clearly flagged with an amber banner):
  `/dashboard`, `/metrics`, `/charts`, `/ai`, `/snapshots`, `/settings`.
- Shared components: `RegimeLabel`, `FreshnessBadge`, `ConfidenceBadge`,
  `PlaceholderBanner`, `CategoryCard`.
- Zustand store skeleton + TanStack Query provider wired.
- Verified: all 7 routes return HTTP 200; build + typecheck clean.

---

## 5. Phase 2 — Database  (commit `26b956a`)

- `db/migrations/0001_init.sql` (+ `.down.sql`): 14 tables per Spec §8 with
  11 enums, foreign keys, the `unique(metric_id, timestamp, source_id)`
  constraint, and indexes.
- `db/migrate.ts`, `db/rollback.ts`, `db/smoke.ts`; tracked via a
  `schema_migrations` table.
- `lib/db/`: `postgres` client singleton + full TypeScript row types.
- `db/README.md`: setup + runner + rollback docs.
- **Verified on live Supabase:** migrate → smoke (insert/select all 14 tables +
  unique constraint enforced) → rollback → re-migrate, all clean.

**Security note:** the Supabase connection string was briefly placed in the
git-tracked `.env.example`; it was moved to the gitignored `.env.local` and the
example restored to an empty placeholder. The DB password appeared in plaintext
during setup — **recommended action: rotate the Supabase DB password** (Settings
→ Database → Reset password) and update `.env.local`.

---

## 6. Phase 3 — Seed Config  (commit `ba931f6`)

- `config/seed-data.ts` — **single source of truth**, consumed by both the DB
  seed and the UI so they never drift:
  - 3 data sources (FRED active; CoinGecko active; market-data pending = D4).
  - 12 categories, weights sum to exactly 1.0 (9 core, 3 supporting).
  - 17 MVP metrics with plain-language descriptions, source links, in-category
    weights, automation status, frequency, freshness windows.
  - 17 conservative scoring rules (D8) using a documented `rule_config` shape.
  - 7 regime thresholds covering 0–100 with no gaps/overlaps.
  - 4 AI prompt templates verbatim from Spec §17.
  - 3 app_settings entries (freshness windows, confidence logic, AI usage).
- `db/seed.ts` — idempotent, transactional, with built-in acceptance checks.
- **Verified on live Supabase (and idempotent on re-run):**
  - category weights sum = 1.0 ✓
  - every metric resolves to category + source + scoring rule ✓
  - regime thresholds cover 0–100, no gaps/overlaps ✓
  - 4 prompt templates present ✓
  - row counts: sources 3, categories 12, metrics 17, scoring_rules 17,
    thresholds 7, prompts 4, app_settings 3.

---

## 7. Scope Addition — Metric "i" Info Buttons  (in commit `ba931f6`)

User-requested, beyond the original spec docs.

- `components/ui/metric-info.tsx` — accessible "i" button + click/Esc-dismiss
  popover. Sections (all optional except the explanation):
  1. Plain-language explanation of the metric/category.
  2. Data source (name, symbol, type, reliability, pending flag) — shown on the
     Metrics page (per-metric).
  3. Constituent metrics with `SOURCE:SYMBOL` (e.g. `FRED:M2SL`) — shown on the
     dashboard category cards; "No MVP metrics yet" for Breadth/Sentiment.
- `app/metrics/page.tsx` and the dashboard category cards now read from
  `config/seed-data.ts`, replacing earlier fake placeholder rows/scores with
  real config (computed values/scores still arrive in Phases 4–5).
- Verified: typecheck + build clean; all 17 metric symbols correctly serialised
  into the UI. The popover opens client-side on click (not visible in
  server-rendered HTML — needs a browser to eyeball visually).

---

## 8. Phase 4 — FRED Integration  (commit `5f00be1`)

- `lib/fetchers/fred.ts` — server-side FRED API client; fetches the latest
  120 observations per series (covers >3M for Phase 5 change calc), drops
  FRED `.` missing values, 15s network timeout.
- `lib/fetchers/freshness.ts` — freshness (fresh ≤ window, delayed ≤ 2×,
  stale beyond) + confidence per Spec §13/§14, judged against each metric's
  `freshness_window_hours` so monthly series are not falsely stale.
- `lib/fetchers/run-fred-fetch.ts` — orchestrator: loads the 9 enabled
  FRED-sourced metrics, applies source-priority (primary → fallback →
  unavailable, never a silent swap), upserts each metric's window into
  `metric_values` in a single batched `unnest` statement.
- `app/api/fetch/fred/route.ts` — server-only POST trigger, dynamic/nodejs
  runtime, optional `AUTH_SECRET` header gate, key never sent to client.
- `db/fetch-fred.ts` + `npm run fetch:fred` — CLI calling the same orchestrator.

**Performance fix during build:** the first run hung doing ~1080 sequential
single-row upserts over the remote Supabase pooler (one round-trip each).
Persistence was rebuilt to batch each metric's window into one `unnest`
statement (9 round-trips total) and a 15s FRED fetch timeout was added.

**Verified on live FRED + Supabase:**

- All 9 FRED series populated `metric_values` — 1063 rows, correct timestamps.
- Freshness correct, no false stale on monthly: `m2` (2026-03-01) and
  `fed_funds` (2026-04-01) read **delayed**, not stale. Daily series ~delayed
  over the weekend gap; `fed_balance_sheet` **fresh**.
- Idempotent: re-run kept 1063 rows, 0 duplicate
  `(metric_id, timestamp, source_id)` groups (unique constraint holds).
- Some series store <120 rows (us2y/us10y 116, vix 117, hy_oas 118) — correct,
  FRED `.` missing values are filtered out.
- API key only read server-side; route is dynamic, not statically rendered.
- Typecheck + production build clean.

**Note:** Phase 4 only fetches/stores; the UI still shows "—" until Phase 6
wires it. Verify via `npm run fetch:fred`, `POST /api/fetch/fred`, or by
querying `metric_values` in Supabase.

---

## 9. Phase 5 — Scoring Engine  (commit `f8b40b3`)

Pure, unit-tested computation over the data already in the DB.

- `lib/scoring/changes.ts` — 1D/1W/1M/3M absolute & % change (Spec §12).
- `lib/scoring/rules.ts` — evaluates `scoring_rules.rule_config` (ordered,
  first match wins, fallback, clamp to score_range; Spec §8.10).
- `lib/scoring/regime.ts` — regime/posture selection (exact at integer
  boundaries + correct for fractional scores), market & metric trend
  (Spec §11/§12).
- `lib/scoring/confidence.ts` — snapshot freshness/confidence aggregation
  heuristic (Spec §14).
- `lib/scoring/engine.ts` — category score, weighted-raw, Market Score,
  Oscillator, per-metric contribution (Spec §10.2–§10.7).
- `lib/scoring/compute-snapshot.ts` — composes the full computed snapshot.
- `lib/scoring/scoring.test.ts` — 32 vitest tests (`npm test`).
- `db/score-preview.ts` + `npm run score:preview` — read-only engine run
  on live DB data (no persistence).

**Design decision:** Spec §10.3 literally sums category×weight, but the MVP
leaves Breadth (8%) + Sentiment (1%) unpopulated, which would silently cap
the score at ~91% of range. The weighted-raw is therefore **normalized over
active categories** (documented in `engine.ts`) — what the roadmap's
"exclude disabled correctly" requires.

**Verified:** 32/32 tests pass (Spec §10.4/§10.5 formulas, §10.7 worked
example 2×0.70×0.08 = 0.112, regime boundaries, change calc, rule fallback,
disabled exclusion). Live preview on real data: Market **54.7**, Oscillator
**+9.41**, **Neutral / Mixed** (math hand-verified; confidence low / freshness
stale because 8 non-FRED metrics have no data until Phase 9). Typecheck +
build clean.

---

## 10. Phase 6 — Snapshot Engine (core MVP loop)  (commit `5eff5fd`)

- `lib/snapshots/load-inputs.ts` — shared DB loader (preview CLI refactored
  onto it; no query drift).
- `lib/snapshots/what-changed.ts` — Δscore + biggest improvements/
  deteriorations vs the previous snapshot.
- `lib/snapshots/save-snapshot.ts` — transactional persist across
  `snapshots`/`metric_scores`/`category_scores`/`snapshot_metrics` (Brief §15).
- `lib/snapshots/refresh.ts` — the 14-step loop (Spec §15.3); FRED failure
  is non-fatal (scores on existing data).
- Routes: `POST /api/snapshots/refresh`, `GET /api/snapshots`,
  `/api/snapshots/[id]` (accepts `latest`), `/api/metrics`,
  `/api/metrics/latest`. `db/snapshot-refresh.ts` + `npm run snapshot:refresh`.
- Dashboard/Metrics/Snapshots rewritten as live client pages; **Refresh
  button functional**.

**Verified on live FRED + Supabase:** refresh persists a snapshot; 2nd
refresh creates a new one with trend `stable` (±5 rule) and Δscore 0;
payload shape matches Spec §15.3; history list + detail render saved data.

---

## 11. Phase 7 — Charts  (commit `5eff5fd`)

- `GET /api/metrics/history` — time series for charts + sparklines.
- `components/charts/line-chart.tsx` — Recharts, multi-series, optional
  rebase-to-100 for mixed-scale macro series.
- `components/charts/sparkline.tsx` — lightweight inline SVG (per table row).
- Charts page rewritten: Market Score + Oscillator from snapshots, 9 FRED
  metric charts, empty states for not-yet-fetched groups.
- Metrics table: sparkline column + a **column-reference legend** under the
  table (user-requested).

**Verified:** 9 FRED series (116–120 pts each) render; snapshot history
charts plot real data; empty states for DXY/equities/commodities/crypto.

---

## 12. Phase 8 — AI Layer  (commit `5eff5fd`)

- `lib/ai/client.ts` (server-only key), `lib/ai/interpret.ts` — loads the
  editable prompt from the DB, builds a minimal payload (Spec §20), calls
  Claude, persists append-only to `ai_interpretations` (D9), typed errors.
- Routes: `POST /api/ai/{interpret-snapshot,explain-metric,weekly-review,
  crisis-mode}`, `GET /api/ai/interpretations`, `GET/PUT
  /api/settings/prompts`. `db/ai-interpret.ts` + `npm run ai:interpret`.
- UI wired: AI page (4 actions + metric dropdown + history), dashboard
  "Generate AI Interpretation" button + result card, Settings prompt-template
  editor, Metrics per-row "Explain" modal.

**Design choices:** model read from `app_settings.ai_usage` (editable, not
hardcoded — seeded `claude-sonnet-4-6`); **no prompt caching** (templates
below Sonnet's 2048-token min cacheable prefix; would be a silent no-op);
**no extended thinking** (predictable token cost on a manual, cost-conscious
personal tool — Spec §4/§20).

**Verified on live Claude:** full regime interpretation persisted &
structured; guardrails fired (flagged stale/low-confidence, refused to invent
missing metrics, posture-only); `explain-metric` metric-specific (233-token
payload); prompt edit persists and is read fresh on the next call;
no AI key in the client bundle. Typecheck + 32 tests + build clean.

---

## 13. Phase 9 — Market Data Provider  (commit `45cc469`)

- `lib/fetchers/twelvedata.ts` — `/time_series` client (daily, 120 pts,
  15s timeout, handles Twelve Data's HTTP-200 error envelope + 429).
- `lib/fetchers/run-twelvedata-fetch.ts` — orchestrator mirroring FRED;
  8s rate spacing for the free 8-credit/min limit; batched `unnest` upsert.
- `config/seed-data.ts` consolidated to **Twelve Data** (D4); CoinGecko +
  market_data removed; `db/seed.ts` prunes stale data sources.
- **D4-refinement:** the free tier paywalls raw indices, DXY, and XAG/USD,
  so index-like metrics use **ETF proxies** — S&P 500→`SPY`,
  Nasdaq 100→`QQQ`, Russell 2000→`IWM`, DXY→`UUP`, Silver→`SLV`; gold
  `XAU/USD`, crypto `BTC/USD`/`ETH/USD`. Scoring uses % change, so the
  proxy preserves the regime signal. Noted in metric descriptions.
- `refresh.ts` runs FRED + Twelve Data (both non-fatal);
  `app/api/fetch/twelvedata` route + `npm run fetch:twelvedata`.

**Verified live:** all 17 metrics flow through scoring/snapshots; snapshot
confidence improved low→**medium**, freshness stale→**mixed**; paywalled
symbols degraded **visibly** (clear error, no silent substitution — the
Phase 9 acceptance).

---

## 14. Phase 10 — Settings, Overrides & MVP Close-out  (commit `25e7550`)

- `GET/PUT /api/settings/scoring` (Spec §15.8/§15.9) — edit category &
  metric weights, regime thresholds, scoring-rule JSON, enable flags. The
  engine reads these from the DB every refresh, so edits take effect with
  **no code change** (acceptance #9).
- `GET/POST/DELETE /api/settings/overrides` + applied in
  `load-inputs`/`compute-snapshot`: `score` (forced, clamped ±5), `weight`
  (replaces metric weight), `note` (annotation). DELETE disables, keeping
  the audit trail. 3 new unit tests.
- Settings page rewritten with **live editors** (scoring, prompts,
  overrides); dead `PlaceholderBanner` removed.
- **Security pass:** all 11 mutating routes AUTH_SECRET-gated; every
  provider/AI/DB secret is server-only (no `NEXT_PUBLIC_`, not in the
  client bundle); `.env.local` gitignored.
- Fix: the dashboard "Macro Regime Oscillator" was a leftover Phase-7
  placeholder — now a live `LineChart` from `/api/snapshots`.

**Verified:** edit volatility weight 0.08→0.25 ⇒ Market Score 52.88→52.43
(reverted by re-seed); manual score override forced VIX→+5 then disabled
back to rule; **all 16 Spec §19 / Brief §17 criteria pass**; 35 tests +
typecheck + build clean.

---

## 15. Git History

```
25e7550  Phase 10: settings editing, manual overrides, security - MVP close-out
45cc469  Phase 9: Twelve Data — single provider for the 8 non-FRED metrics
5eff5fd  Phases 6-8: snapshot engine, charts, AI layer
f8b40b3  Phase 5: scoring engine — metric/category/market scores + tests
5f00be1  Phase 4: FRED integration — fetch 9 series into metric_values
4fb4049  Add build-progress doc covering Phases 0-3
ba931f6  Phase 3: seed config + metric "i" info buttons
26b956a  Phase 2: database — 14-table schema, migrations, data layer
7b699b0  Phase 1: app skeleton — all routes, nav, and shared components
f5ff213  Phase 0: initialize Next.js 16 project with full stack setup
f6caa23  Add Macro Market Regime Monitor spec documents
```

All pushed to `origin/main` (https://github.com/eladedi/macro-analyst) —
**Phases 0–10, MVP complete.**

---

## 16. How to Run

```
npm run dev              # dev server at http://localhost:3000
npm run build            # production build (also typechecks)
npx tsc --noEmit         # typecheck only
npm test                 # vitest unit tests (scoring engine, 35)

npm run db:migrate       # apply pending migrations
npm run db:status        # applied / pending migrations
npm run db:rollback      # revert last migration
npm run db:smoke         # insert/select every table, then roll back
npm run db:seed          # idempotent seed + Phase 3 acceptance checks
npm run fetch:fred       # fetch 9 FRED series into metric_values
npm run fetch:twelvedata # fetch 8 non-FRED metrics (Twelve Data)
npm run score:preview    # run scoring engine on live data (read-only)
npm run snapshot:refresh # full refresh: FRED + Twelve Data → score → snapshot
npm run ai:interpret     # AI interpretation (daily|weekly|crisis) of latest
```

Scripts read `DATABASE_URL`, `FRED_API_KEY`, `TWELVE_DATA_API_KEY`, and
`ANTHROPIC_API_KEY` from `.env.local` (gitignored).

---

## 17. MVP Complete — What's Next

All 10 roadmap phases are done and the 16 acceptance criteria pass. Nothing
on the build itself is outstanding. Remaining items are operational /
post-MVP:

- **Deploy to Vercel** — set the four env vars + Supabase connection in the
  Vercel project; the app is deploy-ready (Spec §6.1, Brief §18).
- **Rotate the Supabase DB password** — it appeared in plaintext in the
  build chat during Phase 2 setup; rotate and update `.env.local` /
  Vercel. Security hygiene only (personal dev DB).
- **Implement D2 properly** — the single-shared-secret `AUTH_SECRET` gate
  is in place; full private auth (Supabase Auth) is post-MVP.
- **Post-MVP roadmap** (Spec §21 / Brief §18): portfolio overlay, thesis
  engine, alerts, backtesting, more breadth/sentiment metrics, public/SaaS
  mode. Per the spec, only after the core monitor runs reliably — it does.
