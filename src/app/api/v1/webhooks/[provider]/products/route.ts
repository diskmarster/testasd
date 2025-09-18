import { getVercelRequestID, validateWebhook } from '@/lib/api/request'
import { apiResponse } from '@/lib/api/response'
import {
	createProvider,
	syncProvidersImpl,
	SyncProviderType,
} from '@/lib/integrations/sync/interfaces'
import { integrationsService } from '@/service/integrations'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

export async function POST(
	request: NextRequest,
	context: { params: { provider: SyncProviderType } },
) {
	const key = request.nextUrl.searchParams.get('key')
	if (!key) {
		console.error('key param is missing', context.params.provider)
		return apiResponse.unauthorized(
			'access denied',
			getVercelRequestID(headers()),
		)
	}

	if (syncProvidersImpl[context.params.provider] == undefined) {
		console.error('invalid provider', context.params.provider)
		return apiResponse.unauthorized(
			'access denied',
			getVercelRequestID(headers()),
		)
	}

	try {
		const { customer, apikey } = await validateWebhook(key)
		if (!customer) {
			console.error('customer not found', context.params.provider)
			return apiResponse.unauthorized(
				'access denied',
				getVercelRequestID(headers()),
			)
		}
		const integrationSettings = await integrationsService.getSettings(
			customer.id,
		)
		if (!integrationSettings) {
			console.error(
				'integration settings are missing for customer',
				customer.id,
			)
			return apiResponse.internal(
				'integration settings are missing',
				getVercelRequestID(headers()),
			)
		}

		if (!integrationSettings.useSyncProducts) {
			return apiResponse.ok<{ message: string }>({
				message: 'product sync is disabled',
			})
		}

		const customerProvider = await integrationsService.getProviderByType(
			customer.id,
			context.params.provider,
		)
		if (customerProvider == undefined) {
			console.error('Could not find integration for customer', customer.id)
			return apiResponse.internal(
				'integration is missing',
				getVercelRequestID(headers()),
			)
		}
		const providerConfig = integrationsService.decryptConfig(
			context.params.provider,
			customerProvider.config,
		)

		const provider = createProvider(context.params.provider, providerConfig)

		const result = await provider.handleProductEvent(customer, request, apikey)

		const log = await integrationsService.createIntegrationLog({
			customerID: customer.id,
			integrationID: customerProvider.id,
			status: result.success ? 'success' : 'error',
			message: result.success
				? (result.message ?? 'product-sync-successful')
				: result.message,
			provider: context.params.provider,
			eventType: 'productEvent',
			eventData: result.eventData,
		})
		if (log == undefined) {
			console.error('INTEGRATION LOG NOT CREATED!')
		}

		if (!result.success) {
			console.error('error message', result.message)
			return apiResponse.internal(result.message, getVercelRequestID(headers()))
		}
	} catch (err) {
		console.error('unknown error', err)
		const errMsg = (err as Error).message ?? 'unknown error occured'
		return apiResponse.internal(errMsg, getVercelRequestID(headers()))
	}

	return apiResponse.ok<{ message: string }>({ message: 'ok' })
}
