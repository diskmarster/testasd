import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
  NewProduct,
  Product,
  productTable,
} from '@/lib/database/schema/inventory'
import { eq } from 'drizzle-orm'

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
  getAllProducts: async (customerID: CustomerID): Promise<Product[]> => {
    return await db
      .select()
      .from(productTable)
      .where(eq(productTable.customerID, customerID))
  },
}
