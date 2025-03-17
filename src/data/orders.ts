import { db, TRX } from '@/lib/database'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  groupTable,
  productTable,
  unitTable,
} from '@/lib/database/schema/inventory'
import {
  NewOrder,
  NewOrderLine,
  Order,
  OrderID,
  OrderLine,
  orderLinesTable,
  ordersTable,
} from '@/lib/database/schema/reorders'
import { supplierTable } from '@/lib/database/schema/suppliers'
import { and, count, desc, eq, getTableColumns, sql } from 'drizzle-orm'
import { FormattedOrderLine, OrderWithCount } from './orders.types'
import { formatDate } from 'date-fns'

export const orders = {
  createOrder: async function (data: Omit<NewOrder, 'id'>, tx: TRX = db): Promise<Order> {
    const [{ count }] = await tx.select({ count: sql<number>`COUNT(*)` })
        .from(ordersTable)
        .where(eq(ordersTable.customerID, data.customerID));

    const [res] = await tx
		.insert(ordersTable)
		.values({
			...data,
			id: ('0000'+data.customerID).slice(-4) + '-' + formatDate(Date.now(), 'yyMM') + '-' + ('0000'+count).slice(-4)
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
				lineCount: count(orderLinesTable)
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
  ): Promise<Order> {
    const [res] = await tx
      .select()
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
  ): Promise<FormattedOrderLine[]> {
    return tx
      .select({
        ...getTableColumns(orderLinesTable),
        product: {
          ...getTableColumns(productTable),
          unit: unitTable.name,
          group: groupTable.name,
          supplierName: supplierTable.name,
        },
        supplier: { ...getTableColumns(supplierTable) },
      })
      .from(orderLinesTable)
      .where(
        and(
          eq(orderLinesTable.customerID, customerID),
          eq(orderLinesTable.orderID, orderID),
        ),
      )
      .innerJoin(productTable, eq(productTable.id, orderLinesTable.productID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
      .leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
  },
}
