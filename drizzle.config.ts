import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env' })

export default defineConfig({
	schema: './src/lib/database/schema',
	out: './src/lib/database/migrations',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.TURSO_CONNECTION_URL as string,
		authToken: process.env.TURSO_AUTH_TOKEN as string,
	},
})
