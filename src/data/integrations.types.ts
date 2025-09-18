import { SyncProviderType } from '@/lib/integrations/sync/interfaces'

export const providerLogoMap: Record<SyncProviderType, string> = {
	'e-conomic': '/assets/e-conomic.png',
}

export type IntegrationLogStatus = 'success' | 'error'
