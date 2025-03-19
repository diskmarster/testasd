import { Details } from "@/components/orders/details"
import { Customer } from "@/lib/database/schema/customer"
import { ordersService } from "@/service/orders"
import { User } from "lucia"

interface Props {
	id: string
	customer: Customer
	user: User
}

export async function DetailsWrapper({ id, customer, user }: Props) {
	const order = await ordersService.getByID(user.customerID, id)
	return (
		<Details order={order} user={user} customer={customer} />
	)
}
