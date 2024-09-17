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
import { FormattedProduct } from './products.types'

const UNIT_COLS = getTableColumns(unitTable)
const GROUP_COLS = getTableColumns(groupTable)
const PRODUCT_COLS = getTableColumns(productTable)

export const products = {
  getAllByCustomerID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<FormattedProduct[]> {
    const products: FormattedProduct[] = await trx
      .select({
        ...PRODUCT_COLS,
        unit: UNIT_COLS.name,
        group: GROUP_COLS.name,
      })
      .from(productTable)
      .where(eq(productTable.customerID, customerID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))

    return products
  },
}

export const product = {
  create: async function (
    newProduct: NewProduct,
    trx: TRX = db,
  ): Promise<Product | undefined> {
    const product = await trx
      .insert(productTable)
      .values(newProduct)
      .returning()
    return product[0]
  },
  getAllByID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<Product[]> {
    const product = await trx
      .select()
      .from(productTable)
      .where(eq(productTable.customerID, customerID))
    return product
  },
}
