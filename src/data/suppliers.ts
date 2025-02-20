import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
  NewSupplier,
  NewSupplierHistory,
  Supplier,
  SupplierHisotry,
  supplierHistoryTable,
  SupplierID,
  supplierTable,
} from '@/lib/database/schema/suppliers'
import { and, eq } from 'drizzle-orm'

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
  },
  getAllByCustomerID: async function (
    id: CustomerID,
    tx: TRX = db,
  ): Promise<Supplier[]> {
    return await tx
      .select()
      .from(supplierTable)
      .where(eq(supplierTable.customerID, id))
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
}
