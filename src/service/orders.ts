import { orders } from '@/data/orders'
import { FormattedOrder, OrderWithCount } from '@/data/orders.types'
import { db } from '@/lib/database'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
	NewOrder,
	NewOrderLine,
	Order,
	OrderID,
} from '@/lib/database/schema/reorders'

export const ordersService = {
	create: async function (
		meta: Omit<NewOrder, 'id'>,
		lines: Omit<NewOrderLine, 'orderID'>[],
	): Promise<Order> {
		return await db.transaction(async tx => {
			const newOrder = await orders.createOrder(meta, tx)
			const linesWithID = lines.map(l => ({ ...l, orderID: newOrder.id }))
			await orders.createOrderLine(linesWithID, tx)
			return newOrder
		})
	},
	getAll: async function (
		customerID: CustomerID,
		locationID: LocationID,
	): Promise<OrderWithCount[]> {
		return await orders.getAllOrders(customerID, locationID)
	},
	getByID: async function (
		customerID: CustomerID,
		orderID: OrderID,
	): Promise<FormattedOrder> {
		return await db.transaction(async tx => {
			const order = await orders.getOrderByID(customerID, orderID, tx)
			const lines = await orders.getAllLines(customerID, orderID, tx)
			return {
				...order,
				lines,
			}
		})
	},
}
