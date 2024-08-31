import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

config({ path: '.env' });

async function main() {
  console.info('Migration started')

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL ?? '',
    authToken: process.env.TURSO_AUTH_TOKEN ?? '',
  })

  const db = drizzle(client)

  await migrate(db, { migrationsFolder: './src/lib/database/migrations' })

  console.info('Migration completed')

  process.exit(0)
}

main().catch(error => {
  console.error('Migration failed')
  console.error('Did you add "IF NOT EXISTS" to the migration files? 🤔')

  console.error(error)
  process.exit(1)
})
