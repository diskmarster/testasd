import { ProductOverview } from '@/components/products/table-overview'
import { FormattedProduct } from '@/data/products.types'
import { Customer } from '@/lib/database/schema/customer'
import { CustomerIntegrationSettings } from '@/lib/database/schema/integrations'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { User } from 'lucia'

interface Props {
	user: User
	customer: Customer
	products: Promise<FormattedProduct[]>
	units: Promise<Unit[]>
	groups: Promise<Group[]>
	integrationSettings: CustomerIntegrationSettings | undefined
}

export async function TableWrapper({
	user,
	customer,
	products,
	units,
	groups,
	integrationSettings,
}: Props) {
	return (
		<ProductOverview
			data={await products}
			user={user}
			plan={customer.plan}
			units={await units}
			groups={await groups}
			integrationSettings={integrationSettings}
		/>
	)
}
