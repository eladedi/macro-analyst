# Macro Market Regime Monitor — Build Progress

**File name:** `Macro-Market-Regime-Monitor_Build-Progress.md`
**Status:** Phases 0–3 complete · Phase 4 next
**Last updated:** 2026-05-17
**Source of truth:** `Macro-Market-Regime-Monitor_Product-Brief.md` + `..._MVP-Technical-Spec-v0.1.md` + `..._Implementation-Roadmap.md`

> Running log of what has actually been built and verified. Phase progress is
> authoritative in `git log`; this document is orientation + verification record.

---

## 1. Summary

The project is a Next.js 16 app backed by a live Supabase Postgres database.
Phases 0–3 of the 10-phase roadmap are done, committed, and pushed to
`origin/main`. The database schema (14 tables) is live and seeded with the full
default, editable configuration (categories, metrics, scoring rules, regime
thresholds, AI prompt templates, settings).

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

**Still open (deferred until reached):**

- **D4** — Market-data provider for DXY / equities / gold / silver (decided at Phase 9).
- **D5** — FRED API key. User must place a free key in `.env.local` as `FRED_API_KEY` before Phase 4 can be verified.

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

## 8. Git History

```
ba931f6  Phase 3: seed config + metric "i" info buttons
26b956a  Phase 2: database — 14-table schema, migrations, data layer
7b699b0  Phase 1: app skeleton — all routes, nav, and shared components
f5ff213  Phase 0: initialize Next.js 16 project with full stack setup
f6caa23  Add Macro Market Regime Monitor spec documents
```

All pushed to `origin/main` (https://github.com/eladedi/macro-analyst).

---

## 9. How to Run

```
npm run dev          # dev server at http://localhost:3000
npm run build        # production build (also typechecks)
npx tsc --noEmit     # typecheck only

npm run db:migrate   # apply pending migrations
npm run db:status    # applied / pending migrations
npm run db:rollback  # revert last migration
npm run db:smoke     # insert/select every table, then roll back
npm run db:seed      # idempotent seed + Phase 3 acceptance checks
```

Scripts read `DATABASE_URL` from `.env.local` (gitignored).

---

## 10. Next — Phase 4 (FRED Integration)

**Goal:** fetch and persist real values for the 9 FRED series
(`M2SL`, `WM2NS`, `WALCL`, `FEDFUNDS`, `DGS2`, `DGS10`, `T10Y2Y`,
`BAMLH0A0HYM2`, `VIXCLS`) with source-priority + freshness handling into
`metric_values`.

**Blocker for verification:** decision **D5** — a free FRED API key must be in
`.env.local` as `FRED_API_KEY`. Code can be written without it; the Phase 4
acceptance run needs it.
