import { IntegrationsCard } from '@/components/integrations/integrations-card'
import { NoIntegrationsCard } from '@/components/integrations/no-integrations-card'
import { integrationsService } from '@/service/integrations'
import { User } from 'lucia'
import { IntegrationLogsTableWrapper } from './integration-logs-table-wrapper'

interface Props {
	user: User
}

export async function IntegrationsWrapper({ user }: Props) {
	const integrationSettings = await integrationsService.getSettings(
		user.customerID,
	)
	const integrationProviders = await integrationsService.getProviders(
		user.customerID,
	)
	const hasIntegrations = integrationSettings && integrationProviders.length > 0

	const economicAppInstallUrl = process.env.ECONOMIC_APP_INSTALL_URL!

	return hasIntegrations ? (
		<>
			<IntegrationsCard
				integrationSettings={integrationSettings}
				providers={integrationProviders}
			/>
			<IntegrationLogsTableWrapper customerID={user.customerID} />
		</>
	) : (
		<NoIntegrationsCard appInstallUrl={economicAppInstallUrl} />
	)
}
