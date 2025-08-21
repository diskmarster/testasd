import { CompanyInfoTab } from '@/components/admin/tab-company-info'
import { Customer } from '@/lib/database/schema/customer'
import { customerService } from '@/service/customer'

interface Props {
	customer: Customer
}

export async function CompanyInfoWrapper({ customer }: Props) {
	const settings = await customerService.getSettings(customer.id)

	return <CompanyInfoTab customer={customer} settings={settings} />
}
