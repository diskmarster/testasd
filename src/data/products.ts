import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
  groupTable,
  NewProduct,
  PartialProduct,
  Product,
  ProductID,
  productTable,
  unitTable,
} from '@/lib/database/schema/inventory'
import { eq, getTableColumns } from 'drizzle-orm'
import { FormattedProduct } from './products.types'

const UNIT_COLS = getTableColumns(unitTable)
const GROUP_COLS = getTableColumns(groupTable)
const PRODUCT_COLS = getTableColumns(productTable)

export const product = {
  getAllByCustomerID: async function(
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<FormattedProduct[]> {
    const product: FormattedProduct[] = await trx
      .select({
        ...PRODUCT_COLS,
        unit: UNIT_COLS.name,
        group: GROUP_COLS.name,
      })
      .from(productTable)
      .where(eq(productTable.customerID, customerID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
    return product
  },
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
  updateByID: async function(
    productID: ProductID,
    updatedProductData: PartialProduct,
    trx: TRX = db,
  ): Promise<Product | undefined> {
    const product = await trx
      .update(productTable)
      .set({ ...updatedProductData })
      .where(eq(productTable.id, productID))
      .returning()
    return product[0]
  },
  getByID: async function(
    id: ProductID,
    trx: TRX = db,
  ): Promise<FormattedProduct | undefined> {
    const res = await trx
      .select({
        ...PRODUCT_COLS,
        unit: UNIT_COLS.name,
        group: GROUP_COLS.name,
      })
      .from(productTable)
      .innerJoin(unitTable, eq(productTable.unitID, unitTable.id))
      .innerJoin(groupTable, eq(productTable.unitID, groupTable.id))
      .where(eq(productTable.id, id))

    return res[0]
  },
  upsertProduct: async function(
    newProductData: NewProduct,
    trx: TRX = db,
  ): Promise<Product> {
    const product = await trx
      .insert(productTable)
      .values({ ...newProductData })
      .onConflictDoUpdate({
        target: [
          productTable.customerID,
          productTable.sku,
          productTable.barcode
        ],
        set: { ...newProductData },
      })
      .returning()
    return product[0]
  },
}
