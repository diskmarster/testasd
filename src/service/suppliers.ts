import { suppliers } from '@/data/suppliers'
import { SupplierWithLogs } from '@/data/suppliers.types'
import { db } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
  NewSupplier,
  Supplier,
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
  getByID: async function (
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
  updateByID: async function (
    id: SupplierID,
    customerID: CustomerID,
    data: Partial<Supplier>,
  ): Promise<Supplier> {
    return await db.transaction(async tx => {
      const supplier = await suppliers.updateByID(id, customerID, data, tx)
      await suppliers.createLog(
        { ...supplier, type: 'opdateret', supplierID: supplier.id },
        tx,
      )
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
  ): Promise<Supplier[]> {
    return await suppliers.getAllByCustomerID(customerID)
  },
}
