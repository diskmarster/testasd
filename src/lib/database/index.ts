import { ResultSet } from '@libsql/client'
import { config } from 'dotenv'
import { ExtractTablesWithRelations } from 'drizzle-orm'
import { LibSQLDatabase } from 'drizzle-orm/libsql'
import { drizzle } from 'drizzle-orm/libsql/web'
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core'

let envPostfix = ''
switch (process.env.NODE_ENV) {
  case 'test':
    envPostfix = '.test'
    break
  default:
    envPostfix = ''
    break
}

config({ path: `.env${envPostfix}` })

export const db = drizzle({
  connection: {
    url: process.env.TURSO_CONNECTION_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  },
})

export type TRX =
  | SQLiteTransaction<
      'async',
      ResultSet,
      Record<string, never>,
      ExtractTablesWithRelations<Record<string, never>>
    >
  | LibSQLDatabase<Record<string, never>>
