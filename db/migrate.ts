/**
 * Migration runner.
 *
 *   npm run db:migrate         apply all pending up migrations
 *   npm run db:migrate -- status   show applied / pending
 *
 * Migrations live in db/migrations/NNNN_name.sql (up) with a matching
 * NNNN_name.down.sql (rollback, applied by db/rollback.ts).
 * Applied migrations are tracked in the schema_migrations table.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL not set. Set it in .env.local before running migrations.')
    process.exit(1)
  }
  return postgres(url, { prepare: false, max: 1, onnotice: () => {} })
}

async function ensureTable(sql: postgres.Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `
}

async function listUpMigrations() {
  const files = await readdir(MIGRATIONS_DIR)
  return files
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort()
}

async function appliedVersions(sql: postgres.Sql): Promise<Set<string>> {
  const rows = await sql<{ version: string }[]>`SELECT version FROM schema_migrations`
  return new Set(rows.map((r) => r.version))
}

async function main() {
  const cmd = process.argv[2]
  const sql = getSql()
  try {
    await ensureTable(sql)
    const all = await listUpMigrations()
    const done = await appliedVersions(sql)

    if (cmd === 'status') {
      for (const f of all) {
        console.log(`${done.has(f) ? '[x]' : '[ ]'} ${f}`)
      }
      return
    }

    const pending = all.filter((f) => !done.has(f))
    if (pending.length === 0) {
      console.log('No pending migrations. Database is up to date.')
      return
    }

    for (const file of pending) {
      const content = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
      console.log(`Applying ${file} ...`)
      await sql.begin(async (tx) => {
        await tx.unsafe(content)
        await tx`INSERT INTO schema_migrations (version) VALUES (${file})`
      })
      console.log(`  ✓ ${file}`)
    }
    console.log(`Applied ${pending.length} migration(s).`)
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
