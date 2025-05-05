import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
    DeletedProduct,
  deletedProductTable,
  groupTable,
  Inventory,
  inventoryTable,
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
import { and, count, desc, eq, getTableColumns, SQL, sql } from 'drizzle-orm'
import { FormattedProduct } from './products.types'
import { supplierTable } from '@/lib/database/schema/suppliers'
import { attachmentsTable } from '@/lib/database/schema/attachments'

const UNIT_COLS = getTableColumns(unitTable)
const GROUP_COLS = getTableColumns(groupTable)
const PRODUCT_COLS = getTableColumns(productTable)
const INVENTORY_COLS = getTableColumns(inventoryTable)

export const product = {
  getAllByCustomerID: async function(
    customerID: CustomerID,
		includeBarred: boolean = true,
    trx: TRX = db,
  ): Promise<FormattedProduct[]> {
    const product: FormattedProduct[] = await trx
      .select({
        ...PRODUCT_COLS,
        unit: UNIT_COLS.name,
        group: GROUP_COLS.name,
		    supplierName: supplierTable.name,
        fileCount: count(attachmentsTable.id),
      })
      .from(productTable)
      .where(
				and(
					eq(productTable.customerID, customerID),
					includeBarred ? undefined : eq(productTable.isBarred, false),
				))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
	    .leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
      .leftJoin(attachmentsTable,
        and(
        eq(attachmentsTable.refDomain, 'product'),
        eq(attachmentsTable.refID, productTable.id)
        )
      )
      .groupBy(productTable.id)
      
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
    const data: Partial<{
      isBarred: boolean | SQL<unknown>
      customerID: number | SQL<unknown>
      groupID: number | SQL<unknown>
      unitID: number | SQL<unknown>
      text1: string | SQL<unknown>
      text2: string | SQL<unknown>
      text3: string | SQL<unknown>
      sku: string | SQL<unknown>
      barcode: string | SQL<unknown>
      costPrice: number | SQL<unknown>
      salesPrice: number | SQL<unknown>
      note: string | SQL<unknown>
    }> = {
      ...updatedProductData
    }

    if (updatedProductData.sku != undefined) {
      data.sku = sql`upper(${updatedProductData.sku})`
    }
    if (updatedProductData.barcode != undefined) {
      data.barcode = sql`upper(${updatedProductData.barcode})`
    }

    const product = await trx
      .update(productTable)
      .set(data)
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
		supplierName: supplierTable.name,
      })
      .from(productTable)
      .innerJoin(unitTable, eq(productTable.unitID, unitTable.id))
      .innerJoin(groupTable, eq(productTable.groupID, groupTable.id))
	  .leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
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
	  .orderBy(desc(productHistoryTable.id))
  },
  getWithInventoryByCustomerID: async function(
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<(FormattedProduct & {inventory: Inventory})[]> {
    const product = await trx
      .select({
        ...PRODUCT_COLS,
        unit: UNIT_COLS.name,
        group: GROUP_COLS.name,
        supplierName: supplierTable.name,
        inventory: {
          ...INVENTORY_COLS,
        }
      })
      .from(productTable)
      .where(eq(productTable.customerID, customerID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
      .innerJoin(inventoryTable, eq(inventoryTable.productID, productTable.id))
      .leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
    return product
  },
  deleteProduct: async function (
    productID: ProductID,
    tx: TRX = db,
  ): Promise<Product | undefined> {
    const [product] = await tx
      .delete(productTable)
      .where(eq(productTable.id, productID))
      .returning()

    return product
  },
  insertDeletedProduct: async function(
    deletedProduct: DeletedProduct,
    tx: TRX = db,
  ): Promise<void> {
    await tx.insert(deletedProductTable).values(deletedProduct)
  },
}
