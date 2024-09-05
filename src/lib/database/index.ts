import { createClient, ResultSet } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from 'dotenv';
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { ExtractTablesWithRelations } from "drizzle-orm";

config({ path: '.env' });

const libsql = createClient({
  url: process.env.TURSO_CONNECTION_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string
})

export const db = drizzle(libsql)

export type TRX = SQLiteTransaction<"async", ResultSet, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>
