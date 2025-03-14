import { Details } from "@/components/orders/details"
import { ordersService } from "@/service/orders"

export async function DetailsWrapper({ id, customerID }: { id: string, customerID: number }) {
	const order = await ordersService.getByID(customerID, id)
	return (
		<Details order={order} />
	)
}
