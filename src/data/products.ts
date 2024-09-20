import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
  groupTable,
  NewProduct,
  Product,
  productTable,
  unitTable,
} from '@/lib/database/schema/inventory'
import { eq, getTableColumns } from 'drizzle-orm'

export const product = {
  create: async function(
    newProduct: NewProduct,
    trx: TRX = db,
  ): Promise<Product | undefined> {
    const product = await trx
      .insert(productTable)
      .values(newProduct)
      .returning()
    return product[0]
  },
  getAllProducts: async (
    customerID: CustomerID,
  ): Promise<(Product & { unit: string; group: string })[]> => {
    const cols = getTableColumns(productTable)

    return await db
      .select({
        ...cols,
        unit: unitTable.name,
        group: groupTable.name,
      })
      .from(productTable)
      .innerJoin(unitTable, eq(productTable.unitID, unitTable.id))
      .innerJoin(groupTable, eq(productTable.unitID, groupTable.id))
      .where(eq(productTable.customerID, customerID))
  },
}
