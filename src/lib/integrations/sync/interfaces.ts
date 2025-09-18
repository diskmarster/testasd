import { ApiKey } from '@/lib/database/schema/apikeys'
import { Customer } from '@/lib/database/schema/customer'
import { NextRequest } from 'next/server'
import {
	EconomicProductEventAction,
	EconomicProductEventData,
	EconomicSyncProvider,
} from './e-conomic'

export function createProvider<T extends SyncProviderType>(
	type: T,
	config: SyncProviderConfig[T],
): SyncProvider {
	return new syncProvidersImpl[type](config)
}

export type SyncProviderResponse<
	TEventDataType extends SyncProviderEventType,
	TProviderType extends SyncProviderType = SyncProviderType,
> =
	| {
			success: true
			message?: string
			eventData: SyncProviderResponseEventData<TProviderType>[TEventDataType]
	  }
	| {
			success: false
			message: string
			eventData: SyncProviderResponseEventData<TProviderType>[TEventDataType]
	  }

export type SyncProviderResponseEventData<TType extends SyncProviderType> = {
	productEvent: SyncProviderProductEventData[TType]
	fullSync: null
}

export interface SyncProvider {
	handleProductEvent(
		customer: Customer,
		request: NextRequest,
		apiKey: ApiKey,
	): Promise<SyncProviderResponse<'productEvent'>>
	handleFullSync(customer: Customer): Promise<SyncProviderResponse<'fullSync'>>
}

export type SyncProviderType = 'e-conomic'

export type SyncProviderEvent = {
	[P in SyncProviderType]: {
		[E in SyncProviderEventType]: {
			provider: P
			type: E
			data: SyncProviderResponseEventData<P>[E]
		}
	}[SyncProviderEventType]
}[SyncProviderType]

export type SyncProviderEventType = 'productEvent' | 'fullSync'

export type SyncProviderProductEventData = {
	'e-conomic': {
		input: EconomicProductEventData
		action: EconomicProductEventAction
	}
}

export type SyncProviderConfig = {
	'e-conomic': { agreementGrantToken: string }
}

export const syncProviderConfigs: {
	[K in SyncProviderType]: SyncProviderConfig[K]
} = {
	'e-conomic': { agreementGrantToken: '' },
}

export const syncProvidersImpl: {
	[K in SyncProviderType]: new (config: SyncProviderConfig[K]) => SyncProvider
} = {
	'e-conomic': EconomicSyncProvider,
}
