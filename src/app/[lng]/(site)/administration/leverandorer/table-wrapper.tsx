import { SuppliersTable } from "@/components/suppliers/table"
import { suppliersService } from "@/service/suppliers"
import { User } from "lucia"

interface Props {
	user: User
}

export async function TableWrapper({ user }: Props) {
	const suppliers = await suppliersService.getAllByCustomerID(user.customerID)
	return (
		<SuppliersTable suppliers={suppliers} />
	)
}
