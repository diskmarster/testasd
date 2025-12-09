#!/usr/bin/env tsx

/**
 * Script to create a test customer with location for local development
 *
 * Usage:
 *   pnpm tsx scripts/create-test-customer.ts
 *
 * Or with custom parameters:
 *   pnpm tsx scripts/create-test-customer.ts --company "Test Company" --email "company@test.com"
 */

import { db } from '@/lib/database'
import {
	customerSettingsTable,
	customerTable,
	locationTable,
} from '@/lib/database/schema/customer'
import { generateIdFromEntropySize } from 'lucia'

interface TestCustomerOptions {
	company?: string
	email?: string
	plan?: 'gratis' | 'starter' | 'standard' | 'premium'
}

async function createTestCustomer(options: TestCustomerOptions = {}) {
	try {
		// Default values
		const company = options.company || 'Test Company'
		const email = options.email || `test-company-${Date.now()}@example.com`
		const plan = options.plan || 'premium'

		console.log('\n🏗️  Creating test customer...\n')

		// Create customer
		const [customer] = await db
			.insert(customerTable)
			.values({
				company: company,
				email: email,
				plan: plan,
				isActive: true,
				canUseIntegration: true,
				extraUsers: 0,
			})
			.returning()

		console.log(`✅ Customer created:`)
		console.log(`   - ID: ${customer.id}`)
		console.log(`   - Company: ${customer.company}`)
		console.log(`   - Email: ${customer.email}`)
		console.log(`   - Plan: ${customer.plan}`)

		// Create default location
		const locationID = generateIdFromEntropySize(8)
		const [location] = await db
			.insert(locationTable)
			.values({
				id: locationID,
				customerID: customer.id,
				name: 'Hovedlager',
				isBarred: false,
			})
			.returning()

		console.log(`\n✅ Location created:`)
		console.log(`   - ID: ${location.id}`)
		console.log(`   - Name: ${location.name}`)

		// Create customer settings
		const [settings] = await db
			.insert(customerSettingsTable)
			.values({
				customerID: customer.id,
				useReference: {
					tilgang: true,
					afgang: true,
					regulering: true,
					flyt: true,
				},
				usePlacement: true,
				defaultRegulationType: 'manuel',
			})
			.returning()

		console.log(`\n✅ Customer settings created`)

		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('🎉 Test customer setup complete!\n')
		console.log('You can now create invite links with:')
		console.log(`   pnpm invite:create -- --customerID ${customer.id}`)
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

		return customer
	} catch (error) {
		console.error('❌ Error creating test customer:', error)
		throw error
	}
}

// Parse command line arguments
function parseArgs(): TestCustomerOptions {
	const args = process.argv.slice(2)
	const options: TestCustomerOptions = {}

	for (let i = 0; i < args.length; i += 2) {
		const key = args[i].replace('--', '')
		const value = args[i + 1]

		switch (key) {
			case 'company':
				options.company = value
				break
			case 'email':
				options.email = value
				break
			case 'plan':
				options.plan = value as any
				break
		}
	}

	return options
}

// Run the script
const options = parseArgs()
createTestCustomer(options)
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
