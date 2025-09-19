import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import { productTable } from '@/lib/database/schema/inventory'
import {
	NewSupplier,
	NewSupplierHistory,
	Supplier,
	SupplierHisotry,
	supplierHistoryTable,
	SupplierID,
	supplierTable,
} from '@/lib/database/schema/suppliers'
import { and, asc, count, desc, eq, getTableColumns } from 'drizzle-orm'
import { SupplierWithItemCount } from './suppliers.types'

export const suppliers = {
	create: async function (data: NewSupplier, tx: TRX = db): Promise<Supplier> {
		const res = await tx.insert(supplierTable).values(data).returning()
		return res[0]
	},
	createLog: async function (
		data: NewSupplierHistory,
		tx: TRX = db,
	): Promise<SupplierHisotry> {
		const res = await tx.insert(supplierHistoryTable).values(data).returning()
		return res[0]
	},
	getByID: async function (
		id: SupplierID,
		customerID: CustomerID,
		tx: TRX = db,
	): Promise<Supplier> {
		const res = await tx
			.select()
			.from(supplierTable)
			.where(
				and(eq(supplierTable.id, id), eq(supplierTable.customerID, customerID)),
			)
			.limit(1)
		return res[0]
	},
	getLogsByID: async function (
		id: SupplierID,
		customerID: CustomerID,
		tx: TRX = db,
	): Promise<SupplierHisotry[]> {
		return await tx
			.select()
			.from(supplierHistoryTable)
			.where(
				and(
					eq(supplierHistoryTable.supplierID, id),
					eq(supplierHistoryTable.customerID, customerID),
				),
			)
			.orderBy(asc(supplierHistoryTable.id))
	},
	getAllByCustomerID: async function (
		id: CustomerID,
		tx: TRX = db,
	): Promise<SupplierWithItemCount[]> {
		return await tx
			.select({
				...getTableColumns(supplierTable),
				itemCount: count(productTable.id),
			})
			.from(supplierTable)
			.where(eq(supplierTable.customerID, id))
			.leftJoin(
				productTable,
				and(
					eq(productTable.supplierID, supplierTable.id),
					eq(productTable.customerID, supplierTable.customerID),
				),
			)
			.groupBy(supplierTable.id)
			.orderBy(desc(supplierTable.id))
	},
	updateByID: async function (
		id: SupplierID,
		customerID: CustomerID,
		data: Partial<Supplier>,
		tx: TRX = db,
	): Promise<Supplier> {
		const res = await tx
			.update(supplierTable)
			.set({ ...data })
			.where(
				and(eq(supplierTable.id, id), eq(supplierTable.customerID, customerID)),
			)
			.returning()
		return res[0]
	},
	deleteByID: async function (
		id: SupplierID,
		customerID: CustomerID,
		tx: TRX = db,
	): Promise<void> {
		await tx
			.delete(supplierTable)
			.where(
				and(eq(supplierTable.id, id), eq(supplierTable.customerID, customerID)),
			)
	},
	upsert: async function (data: NewSupplier, tx: TRX = db): Promise<Supplier> {
		const [supplier] = await tx
			.insert(supplierTable)
			.values(data)
			.onConflictDoUpdate({
				target: [supplierTable.customerID, supplierTable.integrationId],
				set: { ...data },
			})
			.returning()
		return supplier
	},
	deleteByIntegrationID: async function (
		customerID: CustomerID,
		integrationID: string,
		tx: TRX = db,
	): Promise<boolean> {
		const result = await tx
			.delete(supplierTable)
			.where(
				and(
					eq(supplierTable.customerID, customerID),
					eq(supplierTable.integrationId, integrationID),
				),
			)
		return result.rowsAffected == 1
	},
}
