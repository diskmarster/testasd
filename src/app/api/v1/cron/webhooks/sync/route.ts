import { getVercelRequestID } from '@/lib/api/request'
import { apiResponse } from '@/lib/api/response'
import { syncProvidersImpl } from '@/lib/integrations/sync/interfaces'
import { tryParseInt } from '@/lib/utils'
import { tryCatch } from '@/lib/utils.server'
import { customerService } from '@/service/customer'
import { integrationsService } from '@/service/integrations'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

const CRON_SECRET = process.env.NL_CRON_SECRET

export async function POST(request: NextRequest) {
	const reqID = getVercelRequestID(headers())
	const secret = request.headers.get('Authorization')

	if (!secret) {
		return apiResponse.unauthorized('authorization is missing', reqID)
	}

	const parts = secret.split(' ', 2)
	if (parts[0] != 'Bearer') {
		return apiResponse.unauthorized('authorization is malformed', reqID)
	}

	if (parts[1] != CRON_SECRET) {
		return apiResponse.unauthorized('authorization is denied', reqID)
	}

	const searchParams = request.nextUrl.searchParams
	const customerIDParam = searchParams.get('customerid') ?? undefined

	if (customerIDParam == undefined) {
		console.log("missing query param 'customerid'")
		return apiResponse.badRequest(`missing query param 'customerid'`, reqID)
	}

	const customerID = tryParseInt(customerIDParam)
	if (customerID == undefined) {
		console.log("malformed query param 'customerid': must be an integer")
		return apiResponse.badRequest(
			`malformed query param 'customerid': must be an integer`,
			reqID,
		)
	}

	const integrations =
		await integrationsService.getIntegrationsWithSettings(customerID)
	if (integrations.length == 0) {
		console.log('No integrations found for customer id')
		return apiResponse.badRequest(
			'No integrations found for customer id',
			reqID,
		)
	}

	const jobs = await Promise.all(
		integrations.map(async i => {
			const customer = await customerService.getByID(i.customerID)
			if (!customer) {
				return
			}

			const config = integrationsService.decryptConfig(i.provider, i.config)
			const provider = new syncProvidersImpl[i.provider](config)

			const res = await tryCatch(provider.handleFullSync(customer, i))

			const log = await integrationsService.createIntegrationLog({
				customerID: customer.id,
				integrationID: i.integrationID,
				status: res.success && res.data.success ? 'success' : 'error',
				message:
					res.success && res.data.success
						? 'full-product-sync-successfull'
						: (res.error?.message ?? res.data?.message ?? 'unknown error'),
				provider: i.provider,
				eventType: 'fullSync',
				eventData: null,
			})
			if (log == undefined) {
				console.error(
					`INTEGRATION LOG FOR FULL SYNC OF CUSTOMER ${customer.id} NOT CREATED!`,
				)
			}

			if (!res.success || !res.data.success) {
				console.error(
					`Full sync of '${i.provider}' failed for '${customer.company}' with message: ${res.error ?? res.data.message}`,
				)

				return false
			}

			return true
		}),
	)
	const fails = jobs.filter(res => res == false)

	if (fails.length > 0) {
		console.error(`error in request with id: ${reqID}`)

		return apiResponse.internal(`${fails.length} jobs failed`, reqID)
	} else {
		return apiResponse.ok({ message: 'Success' })
	}
}
