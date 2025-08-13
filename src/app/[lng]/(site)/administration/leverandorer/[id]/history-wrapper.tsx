import { SupplierLogs } from '@/components/suppliers/history'
import { suppliersService } from '@/service/suppliers'

interface Props {
	id: number
	customerID: number
}

export async function SupplierHistoryWrapper({ id, customerID }: Props) {
	const supplierLogs = await suppliersService.getLogsID(id, customerID)
	return <SupplierLogs logs={supplierLogs} />
}
