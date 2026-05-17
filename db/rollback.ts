/**
 * Rollback runner — reverts the most recently applied migration.
 *
 *   npm run db:rollback           roll back the last applied migration
 *
 * Runs the matching NNNN_name.down.sql and removes the row from
 * schema_migrations, all inside one transaction.
 */
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL not set. Set it in .env.local before running rollback.')
    process.exit(1)
  }
  return postgres(url, { prepare: false, max: 1, onnotice: () => {} })
}

async function main() {
  const sql = getSql()
  try {
    const exists = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM information_schema.tables
      WHERE table_name = 'schema_migrations'
    `
    if (exists[0].count === 0) {
      console.log('No schema_migrations table — nothing to roll back.')
      return
    }

    const rows = await sql<{ version: string }[]>`
      SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1
    `
    if (rows.length === 0) {
      console.log('No applied migrations to roll back.')
      return
    }

    const version = rows[0].version
    const downFile = version.replace(/\.sql$/, '.down.sql')
    const content = await readFile(join(MIGRATIONS_DIR, downFile), 'utf8')

    console.log(`Rolling back ${version} (via ${downFile}) ...`)
    await sql.begin(async (tx) => {
      await tx.unsafe(content)
      await tx`DELETE FROM schema_migrations WHERE version = ${version}`
    })
    console.log(`  ✓ rolled back ${version}`)
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
