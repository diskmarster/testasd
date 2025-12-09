#!/usr/bin/env tsx

/**
 * Script to create a user account directly for local testing
 *
 * Usage:
 *   pnpm tsx scripts/create-user.ts
 *
 * Or with custom parameters:
 *   pnpm tsx scripts/create-user.ts --email admin@test.com --password test123 --name "Admin User"
 */

import { db } from '@/lib/database'
import { authProviderTable, userTable } from '@/lib/database/schema/auth'
import {
	customerTable,
	linkLocationToUserTable,
	locationTable,
} from '@/lib/database/schema/customer'
import { hash } from '@node-rs/argon2'
import { eq } from 'drizzle-orm'

interface CreateUserOptions {
	email?: string
	password?: string
	pin?: string
	name?: string
	customerID?: number
	role?: 'administrator' | 'lager' | 'bruger'
}

async function createUser(options: CreateUserOptions = {}) {
	try {
		// Default values
		const email = options.email || 'admin@test.com'
		const password = options.password || 'password123'
		const pin = options.pin || '1234'
		const name = options.name || 'Test Admin'
		const customerID = options.customerID || 1
		const role = options.role || 'administrator'

		console.log('\n👤 Creating user account...\n')

		// Verify customer exists
		const customer = await db
			.select()
			.from(customerTable)
			.where(eq(customerTable.id, customerID))
			.limit(1)

		if (!customer || customer.length === 0) {
			console.error(`❌ Customer with ID ${customerID} not found!`)
			console.log('\nRun this first to create a test customer:')
			console.log('  pnpm test:customer\n')
			process.exit(1)
		}

		// Get customer's locations
		const locations = await db
			.select()
			.from(locationTable)
			.where(eq(locationTable.customerID, customerID))

		if (!locations || locations.length === 0) {
			console.error(`❌ No locations found for customer ${customerID}!`)
			process.exit(1)
		}

		// Hash password and PIN
		const hashedPassword = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		})

		const hashedPin = await hash(pin, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		})

		// Create user
		const [user] = await db
			.insert(userTable)
			.values({
				name: name,
				email: email.toLowerCase(),
				role: role,
				customerID: customerID,
				isActive: true,
				webAccess: true,
				appAccess: true,
				priceAccess: true,
			})
			.returning()

		console.log(`✅ User created:`)
		console.log(`   - ID: ${user.id}`)
		console.log(`   - Name: ${user.name}`)
		console.log(`   - Email: ${user.email}`)
		console.log(`   - Role: ${user.role}`)

		// Create password auth provider
		await db.insert(authProviderTable).values({
			userID: user.id,
			authID: hashedPassword,
			domain: 'pw',
		})

		console.log(`✅ Password set`)

		// Create PIN auth provider
		await db.insert(authProviderTable).values({
			userID: user.id,
			authID: hashedPin,
			domain: 'pin',
		})

		console.log(`✅ PIN set`)

		// Link user to all customer locations
		for (let i = 0; i < locations.length; i++) {
			await db.insert(linkLocationToUserTable).values({
				userID: user.id,
				locationID: locations[i].id,
				customerID: customerID,
				isPrimary: i === 0,
			})
		}

		console.log(`✅ Linked to ${locations.length} location(s)`)

		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('🎉 User account created successfully!\n')
		console.log('Login credentials:')
		console.log(`   Email:    ${email}`)
		console.log(`   Password: ${password}`)
		console.log(`   PIN:      ${pin}`)
		console.log('\nLogin URL:')
		console.log('   http://localhost:3000/log-ind')
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

		return user
	} catch (error) {
		console.error('❌ Error creating user:', error)
		throw error
	}
}

// Parse command line arguments
function parseArgs(): CreateUserOptions {
	const args = process.argv.slice(2)
	const options: CreateUserOptions = {}

	for (let i = 0; i < args.length; i += 2) {
		const key = args[i].replace('--', '')
		const value = args[i + 1]

		switch (key) {
			case 'email':
				options.email = value
				break
			case 'password':
				options.password = value
				break
			case 'pin':
				options.pin = value
				break
			case 'name':
				options.name = value
				break
			case 'customerID':
				options.customerID = parseInt(value, 10)
				break
			case 'role':
				options.role = value as any
				break
		}
	}

	return options
}

// Run the script
const options = parseArgs()
createUser(options)
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
