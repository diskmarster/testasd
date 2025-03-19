import { db, TRX } from '@/lib/database'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  NewOrder,
  NewOrderLine,
  Order,
  OrderID,
  OrderLine,
  orderLinesTable,
  ordersTable,
} from '@/lib/database/schema/reorders'
import { and, count, desc, eq, getTableColumns, gt, lt, sql } from 'drizzle-orm'
import { OrderWithCount } from './orders.types'
import { endOfMonth, formatDate, lastDayOfMonth, startOfMonth } from 'date-fns'

export const orders = {
  createOrder: async function (data: Omit<NewOrder, 'id'>, tx: TRX = db): Promise<Order> {
    const [{ count }] = await tx.select({ count: sql<number>`count(*)` })
		.from(ordersTable)
		.where(
			and(
				eq(ordersTable.customerID, data.customerID),
				gt(ordersTable.inserted,startOfMonth(new Date())),
				lt(ordersTable.inserted, endOfMonth(new Date()))
			)
		)

    const [res] = await tx
		.insert(ordersTable)
		.values({
			...data,
			id: ('0000'+data.customerID).slice(-4) + '-' + formatDate(Date.now(), 'yyMM') + '-' + ('0000'+(count+1)).slice(-4)
		})
		.returning()
    return res
  },
  createOrderLine: async function (
    data: NewOrderLine[],
    tx: TRX = db,
  ): Promise<OrderLine[]> {
    return await tx.insert(orderLinesTable).values(data).returning()
  },
getAllOrders: async function (
    customerID: CustomerID,
    locationID: LocationID,
    tx: TRX = db,
  ): Promise<OrderWithCount[]> {
    return await tx
      .select({
				...getTableColumns(ordersTable),
				lineCount: count(orderLinesTable),
				supplierCount: sql<number>`count(distinct ${orderLinesTable.supplierName})`
			})
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.locationID, locationID),
          eq(ordersTable.customerID, customerID),
        ),
      )
			.orderBy(desc(ordersTable.inserted))
			.innerJoin(orderLinesTable, eq(orderLinesTable.orderID, ordersTable.id))
			.groupBy(ordersTable.id)
  },
  getOrderByID: async function (
    customerID: CustomerID,
    orderID: OrderID,
    tx: TRX = db,
  ): Promise<OrderWithCount> {
    const [res] = await tx
      .select({
				...getTableColumns(ordersTable),
				lineCount: count(orderLinesTable),
				supplierCount: sql<number>`count(distinct ${orderLinesTable.supplierName})`
			})
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.customerID, customerID),
          eq(ordersTable.id, orderID),
        ),
      )
    return res
  },
  getAllLines: async function (
    customerID: CustomerID,
    orderID: OrderID,
    tx: TRX = db,
  ): Promise<OrderLine[]> {
    return tx
      .select()
      .from(orderLinesTable)
      .where(
        and(
          eq(orderLinesTable.customerID, customerID),
          eq(orderLinesTable.orderID, orderID),
        ),
      )
  },
}
