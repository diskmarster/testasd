#!/usr/bin/env tsx

/**
 * Script to create a user invitation link for testing on local database
 *
 * Usage:
 *   pnpm tsx scripts/create-invite-link.ts
 *
 * Or with custom parameters:
 *   pnpm tsx scripts/create-invite-link.ts --email test@example.com --customerID 1 --role administrator
 */

import { db } from '@/lib/database'
import { userLinkTable } from '@/lib/database/schema/auth'
import { customerTable, locationTable } from '@/lib/database/schema/customer'
import { eq } from 'drizzle-orm'
import { generateIdFromEntropySize } from 'lucia'

interface InviteLinkOptions {
	email?: string
	customerID?: number
	role?: 'administrator' | 'lager' | 'bruger'
	webAccess?: boolean
	appAccess?: boolean
	priceAccess?: boolean
}

async function createInviteLink(options: InviteLinkOptions = {}) {
	try {
		// Default values
		const email = options.email || `test+${Date.now()}@example.com`
		const customerID = options.customerID || 1
		const role = options.role || 'administrator'
		const webAccess = options.webAccess ?? true
		const appAccess = options.appAccess ?? true
		const priceAccess = options.priceAccess ?? true

		// Verify customer exists
		const customer = await db
			.select()
			.from(customerTable)
			.where(eq(customerTable.id, customerID))
			.limit(1)

		if (!customer || customer.length === 0) {
			console.error(`❌ Customer with ID ${customerID} not found!`)
			console.log('\nAvailable customers:')
			const allCustomers = await db.select().from(customerTable)
			allCustomers.forEach(c => {
				console.log(`  - ID: ${c.id}, Company: ${c.company}, Email: ${c.email}`)
			})
			process.exit(1)
		}

		// Get customer's locations
		const locations = await db
			.select()
			.from(locationTable)
			.where(eq(locationTable.customerID, customerID))

		if (!locations || locations.length === 0) {
			console.error(`❌ No locations found for customer ${customerID}!`)
			console.log('Create a location first or choose a different customer.')
			process.exit(1)
		}

		// Generate unique link ID
		const linkID = generateIdFromEntropySize(16)

		// Get all location IDs for this customer
		const locationIDs = locations.map(l => l.id)

		// Create the invite link in the database
		const [inviteLink] = await db
			.insert(userLinkTable)
			.values({
				id: linkID,
				customerID: customerID,
				email: email,
				role: role,
				locationIDs: locationIDs,
				webAccess: webAccess,
				appAccess: appAccess,
				priceAccess: priceAccess,
			})
			.onConflictDoUpdate({
				target: userLinkTable.email,
				set: {
					inserted: new Date(),
					locationIDs: locationIDs,
					role: role,
				},
			})
			.returning()

		// Generate the invitation URL
		const baseURL =
			process.env.VERCEL_ENV === 'production'
				? 'https://lager.nemunivers.app'
				: process.env.VERCEL_ENV === 'preview'
					? 'https://stage.lager.nemunivers.app'
					: 'http://localhost:3000'

		const inviteURL = `${baseURL}/invitering/${linkID}`

		console.log('\n✅ Invitation link created successfully!\n')
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log(`📧 Email:        ${email}`)
		console.log(`🏢 Customer:     ${customer[0].company} (ID: ${customerID})`)
		console.log(`👤 Role:         ${role}`)
		console.log(`📍 Locations:    ${locations.map(l => l.name).join(', ')}`)
		console.log(`🌐 Web Access:   ${webAccess}`)
		console.log(`📱 App Access:   ${appAccess}`)
		console.log(`💰 Price Access: ${priceAccess}`)
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log(`\n🔗 Invitation URL:\n${inviteURL}\n`)
		console.log('⏰ Link expires in 168 hours (7 days)\n')

		return inviteURL
	} catch (error) {
		console.error('❌ Error creating invite link:', error)
		throw error
	}
}

// Parse command line arguments
function parseArgs(): InviteLinkOptions {
	const args = process.argv.slice(2)
	const options: InviteLinkOptions = {}

	for (let i = 0; i < args.length; i += 2) {
		const key = args[i].replace('--', '')
		const value = args[i + 1]

		switch (key) {
			case 'email':
				options.email = value
				break
			case 'customerID':
				options.customerID = parseInt(value, 10)
				break
			case 'role':
				options.role = value as any
				break
			case 'webAccess':
				options.webAccess = value === 'true'
				break
			case 'appAccess':
				options.appAccess = value === 'true'
				break
			case 'priceAccess':
				options.priceAccess = value === 'true'
				break
		}
	}

	return options
}

// Run the script
const options = parseArgs()
createInviteLink(options)
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
