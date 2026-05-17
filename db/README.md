# Database — migrations & rollback

Postgres schema for the Macro Market Regime Monitor (Spec §8). 14 tables +
enums + foreign keys. Decisions D1/D7: Supabase Postgres (cloud free tier).

## One-time setup

1. Create a Supabase project (free tier).
2. Project Settings → Database → Connection string → copy the **Transaction
   pooler** string (port `6543`).
3. Copy `.env.example` to `.env.local` and set:

   ```
   DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:6543/postgres
   ```

## Commands

| Command | Effect |
|---|---|
| `npm run db:migrate` | Apply all pending up-migrations (transactional, tracked in `schema_migrations`) |
| `npm run db:status` | List applied `[x]` / pending `[ ]` migrations |
| `npm run db:rollback` | Revert the most recently applied migration via its `.down.sql` |
| `npm run db:smoke` | Insert + select one row in every table, verify the unique constraint, then roll back (DB left unchanged) |

Scripts auto-load `.env.local` via `tsx --env-file`.

## Migration files

```
db/migrations/
  0001_init.sql        up   — enums + 14 tables + indexes
  0001_init.down.sql   down — drops everything in reverse dependency order
```

Add a new migration as `NNNN_name.sql` with a matching `NNNN_name.down.sql`.
Files apply in lexical order; each runs inside its own transaction and is
recorded in `schema_migrations`.

## Verification (Phase 2 acceptance)

```
npm run db:migrate    # applies cleanly to an empty DB
npm run db:smoke      # insert/select per table + unique constraint
npm run db:rollback   # 0001 reverts cleanly
npm run db:migrate    # re-applies cleanly (idempotent via tracking)
```
