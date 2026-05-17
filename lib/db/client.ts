import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env.local and set the Supabase Postgres connection string.'
  )
}

// Single shared connection. `prepare: false` keeps it compatible with the
// Supabase transaction pooler (port 6543). Safe for the direct port too.
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> }

export const sql =
  globalForDb.sql ?? postgres(connectionString, { prepare: false, max: 10, onnotice: () => {} })

if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql
