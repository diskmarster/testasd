import { suppliers } from '@/data/suppliers'
import { SupplierWithItemCount, SupplierWithLogs } from '@/data/suppliers.types'
import { db } from '@/lib/database'
import { UserID } from '@/lib/database/schema/auth'
import { CustomerID } from '@/lib/database/schema/customer'
import {
	NewSupplier,
	NewSupplierHistory,
	Supplier,
	SupplierHisotry,
	SupplierHistoryID,
	SupplierID,
} from '@/lib/database/schema/suppliers'

export const suppliersService = {
	create: async function (data: NewSupplier): Promise<Supplier> {
		return await db.transaction(async tx => {
			const supplier = await suppliers.create(data, tx)
			await suppliers.createLog(
				{ ...data, type: 'oprettet', supplierID: supplier.id },
				tx,
			)
			return supplier
		})
	},
	getCombinedByID: async function (
		id: SupplierID,
		customerID: CustomerID,
	): Promise<SupplierWithLogs> {
		return await db.transaction(async tx => {
			const supplier = await suppliers.getByID(id, customerID, tx)
			const logs = await suppliers.getLogsByID(id, customerID, tx)
			return {
				...supplier,
				logs,
			}
		})
	},
	getByID: async function (
		id: SupplierID,
		customerID: CustomerID,
	): Promise<Supplier> {
		return await suppliers.getByID(id, customerID)
	},
	getLogsID: async function (
		id: SupplierHistoryID,
		customerID: CustomerID,
	): Promise<SupplierHisotry[]> {
		return await suppliers.getLogsByID(id, customerID)
	},
	updateByID: async function (
		id: SupplierID,
		customerID: CustomerID,
		userID: UserID,
		userName: string,
		data: Partial<Supplier>,
	): Promise<Supplier> {
		return await db.transaction(async tx => {
			const supplier = await suppliers.updateByID(id, customerID, data, tx)
			const log: NewSupplierHistory = {
				type: 'opdateret',
				customerID: supplier.customerID,
				userID: userID,
				userName: userName,
				supplierID: supplier.id,
				name: supplier.name,
				country: supplier.country,
				idOfClient: supplier.idOfClient,
				contactPerson: supplier.contactPerson,
				phone: supplier.phone,
				email: supplier.email,
			}
			await suppliers.createLog(log, tx)
			return supplier
		})
	},
	deleteByID: async function (
		id: SupplierID,
		customerID: CustomerID,
	): Promise<void> {
		await suppliers.deleteByID(id, customerID)
	},
	getAllByCustomerID: async function (
		customerID: CustomerID,
	): Promise<SupplierWithItemCount[]> {
		return await suppliers.getAllByCustomerID(customerID)
	},
}
