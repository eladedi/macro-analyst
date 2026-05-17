# Macro Market Regime Monitor — Build Progress

**File name:** `Macro-Market-Regime-Monitor_Build-Progress.md`
**Status:** Phases 0–4 complete (Phase 4 verified, not yet committed) · Phase 5 next
**Last updated:** 2026-05-17
**Source of truth:** `Macro-Market-Regime-Monitor_Product-Brief.md` + `..._MVP-Technical-Spec-v0.1.md` + `..._Implementation-Roadmap.md`

> Running log of what has actually been built and verified. Phase progress is
> authoritative in `git log`; this document is orientation + verification record.

---

## 1. Summary

The project is a Next.js 16 app backed by a live Supabase Postgres database.
Phases 0–3 are committed and pushed to `origin/main`; Phase 4 is built and
verified but not yet committed. The database schema (14 tables) is live and
seeded with the full default, editable configuration, and real FRED data for
the 9 FRED series is now flowing into `metric_values`.

A user-requested feature beyond the original spec was added: an **"i" info
button** on every metric and every dashboard category card.

**Earliest usable product** is end of Phase 6; **MVP complete** is end of
Phase 10.

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

| D5 | FRED API key | Resolved — user added `FRED_API_KEY` to `.env.local` (Phase 4 verified) |

**Still open (deferred until reached):**

- **D4** — Market-data provider for DXY / equities / gold / silver (decided at Phase 9).

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

## 8. Phase 4 — FRED Integration  (built + verified, NOT yet committed)

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

**Note on what is testable now:** Phase 4 only fetches/stores. The
dashboard/metrics pages still show "—"; wiring the UI to live values is
**Phase 6**. Verify Phase 4 via `npm run fetch:fred`, the
`POST /api/fetch/fred` endpoint, or by querying `metric_values` in Supabase.

---

## 9. Git History

```
ba931f6  Phase 3: seed config + metric "i" info buttons
26b956a  Phase 2: database — 14-table schema, migrations, data layer
7b699b0  Phase 1: app skeleton — all routes, nav, and shared components
f5ff213  Phase 0: initialize Next.js 16 project with full stack setup
f6caa23  Add Macro Market Regime Monitor spec documents
```

Pushed to `origin/main` (https://github.com/eladedi/macro-analyst) through
Phase 3. **Phase 4 is verified but not yet committed/pushed.**

---

## 10. How to Run

```
npm run dev          # dev server at http://localhost:3000
npm run build        # production build (also typechecks)
npx tsc --noEmit     # typecheck only

npm run db:migrate   # apply pending migrations
npm run db:status    # applied / pending migrations
npm run db:rollback  # revert last migration
npm run db:smoke     # insert/select every table, then roll back
npm run db:seed      # idempotent seed + Phase 3 acceptance checks
npm run fetch:fred   # fetch 9 FRED series into metric_values (idempotent)
```

Scripts read `DATABASE_URL` and `FRED_API_KEY` from `.env.local` (gitignored).

---

## 11. Next — Phase 5 (Scoring Engine)

**Goal:** turn the stored `metric_values` into scores — per-metric change
calc (1D/1W/1M/3M), raw scores from `scoring_rules`, category scores, the
final Market Score (0–100), the Oscillator (−100..+100), regime label, and
trend vs the previous snapshot (Spec §10, §12, §14).

No external blockers — all inputs (seeded rules + real FRED data) are in the
database.
