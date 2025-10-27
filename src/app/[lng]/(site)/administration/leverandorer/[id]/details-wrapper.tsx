import { SupplierDetails } from '@/components/suppliers/details'
import { integrationsService } from '@/service/integrations'
import { suppliersService } from '@/service/suppliers'

interface Props {
	id: number
	customerID: number
}

export async function DetailsWrapper({ id, customerID }: Props) {
	const supplier = await suppliersService.getByID(id, customerID)
	const integrationSettings = await integrationsService.getSettings(customerID)
	return (
		<SupplierDetails
			integrationSettings={integrationSettings}
			supplier={supplier}
		/>
	)
}
