import { SupplierDetails } from '@/components/suppliers/details'
import { suppliersService } from '@/service/suppliers'

interface Props {
	id: number
	customerID: number
}

export async function DetailsWrapper({ id, customerID }: Props) {
	const supplier = await suppliersService.getByID(id, customerID)
	return <SupplierDetails supplier={supplier} />
}
