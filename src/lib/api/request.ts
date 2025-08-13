import { customerService } from '@/service/customer'
import { isAfter } from 'date-fns'
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'
import { ApiKey } from '../database/schema/apikeys'
import { Customer } from '../database/schema/customer'
import { hasher } from '../hash/hasher'

export function getVercelRequestID(headers: ReadonlyHeaders): string {
	let id = headers.get('x-vercel-id')
	if (id == null) {
		return 'DEV_' + crypto.randomUUID()
	} else {
		return id.split('::')[1]
	}
}

export async function validatePublicRequest(
	headers: ReadonlyHeaders,
): Promise<
	{ customer: Customer; apikey: ApiKey } | { customer: null; apikey: null }
> {
	const authheader = headers.get('authorization')
	if (authheader == null) {
		return {
			customer: null,
			apikey: null,
		}
	}

	const authparts = authheader.split(' ')
	if (authparts.length != 2 || authparts[0].toLowerCase() != 'bearer') {
		return {
			customer: null,
			apikey: null,
		}
	}

	const tokenhash = hasher.hash(authparts[1])
	const apikey = await customerService.getApiKey(tokenhash)
	if (!apikey) {
		return {
			customer: null,
			apikey: null,
		}
	}

	const customer = await customerService.getByID(apikey.customerID)
	if (!customer) {
		return {
			customer: null,
			apikey: null,
		}
	}

	if (apikey.expiry != null && isAfter(new Date(), apikey.expiry)) {
		return {
			customer: null,
			apikey: null,
		}
	}

	return { customer, apikey }
}

export async function validateWebhook(
	token: string,
): Promise<
	{ customer: Customer; apikey: ApiKey } | { customer: null; apikey: null }
> {
	const tokenhash = hasher.hash(token)
	const apikey = await customerService.getApiKey(tokenhash)
	if (!apikey) {
		return {
			customer: null,
			apikey: null,
		}
	}

	const customer = await customerService.getByID(apikey.customerID)
	if (!customer) {
		return {
			customer: null,
			apikey: null,
		}
	}

	if (apikey.expiry != null && isAfter(new Date(), apikey.expiry)) {
		return {
			customer: null,
			apikey: null,
		}
	}

	return { customer, apikey }
}
