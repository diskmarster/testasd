import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
  groupTable,
  NewProduct,
  NewProductHistory,
  PartialProduct,
  Product,
  ProductHistory,
  productHistoryTable,
  ProductID,
  productTable,
  unitTable,
} from '@/lib/database/schema/inventory'
import { and, eq, getTableColumns, sql } from 'drizzle-orm'
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
      .values({
        ...newProduct,
        sku: sql`upper(${newProduct.sku})`,
        barcode: sql`upper(${newProduct.barcode})`,
      })
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
      .set({
        ...updatedProductData,
        sku: sql`upper(${updatedProductData.sku})`,
        barcode: sql`upper(${updatedProductData.barcode})`,
      })
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
      .values({
        ...newProductData,
        sku: sql`upper(${newProductData.sku})`,
        barcode: sql`upper(${newProductData.barcode})`,
      })
      .onConflictDoUpdate({
        target: [
          productTable.customerID,
          productTable.sku,
          productTable.barcode,
        ],
        set: {
          ...newProductData,
          sku: sql`upper(${newProductData.sku})`,
          barcode: sql`upper(${newProductData.barcode})`,
        },
      })
      .returning()
    return product[0]
  },
  createHistoryLog: async function(
    newProductLog: NewProductHistory,
    trx: TRX = db,
  ): Promise<ProductHistory | undefined> {
    const history = await trx
      .insert(productHistoryTable)
      .values(newProductLog)
      .returning()

    return history[0]
  },
  getHistoryLogsForCustomer: async function(
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<ProductHistory[]> {
    return await trx
      .select()
      .from(productHistoryTable)
      .where(eq(productHistoryTable.customerID, customerID))
  },
  getHistoryLogs: async function(
    customerID: CustomerID,
    productID: ProductID,
    trx: TRX = db,
  ): Promise<ProductHistory[]> {
    return await trx
      .select()
      .from(productHistoryTable)
      .where(
        and(
          eq(productHistoryTable.customerID, customerID),
          eq(productHistoryTable.productID, productID),
        ),
      )
  },
}
