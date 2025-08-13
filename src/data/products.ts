import { db, TRX } from '@/lib/database'
import { attachmentsTable } from '@/lib/database/schema/attachments'
import { CustomerID, locationTable } from '@/lib/database/schema/customer'
import {
	batchTable,
	defaultPlacementTable,
	DeletedProduct,
	deletedProductTable,
	groupTable,
	Inventory,
	inventoryTable,
	NewProduct,
	NewProductHistory,
	PartialProduct,
	placementTable,
	Product,
	ProductHistory,
	productHistoryTable,
	ProductID,
	productTable,
	unitTable,
} from '@/lib/database/schema/inventory'
import { supplierTable } from '@/lib/database/schema/suppliers'
import {
	and,
	count,
	desc,
	eq,
	exists,
	getTableColumns,
	inArray,
	or,
	SQL,
	sql,
	SQLWrapper,
} from 'drizzle-orm'
import { FormattedProduct, ProductFilters } from './products.types'

const UNIT_COLS = getTableColumns(unitTable)
const GROUP_COLS = getTableColumns(groupTable)
const PRODUCT_COLS = getTableColumns(productTable)
const INVENTORY_COLS = getTableColumns(inventoryTable)

export const product = {
	getAllByCustomerID: async function (
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
				),
			)
			.innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
			.innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
			.leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
			.leftJoin(
				attachmentsTable,
				and(
					eq(attachmentsTable.refDomain, 'product'),
					eq(attachmentsTable.refID, productTable.id),
				),
			)
			.groupBy(productTable.id)

		return product
	},
	create: async function (
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
	updateByID: async function (
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
			useBatch: boolean | SQL<unknown>
		}> = {
			...updatedProductData,
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
	getByID: async function (
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
	upsertProduct: async function (
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
	createHistoryLog: async function (
		newProductLog: NewProductHistory,
		trx: TRX = db,
	): Promise<ProductHistory | undefined> {
		const history = await trx
			.insert(productHistoryTable)
			.values(newProductLog)
			.returning()

		return history[0]
	},
	getHistoryLogsForCustomer: async function (
		customerID: CustomerID,
		trx: TRX = db,
	): Promise<ProductHistory[]> {
		return await trx
			.select()
			.from(productHistoryTable)
			.where(eq(productHistoryTable.customerID, customerID))
	},
	getHistoryLogs: async function (
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
	getWithInventoryByCustomerID: async function (
		customerID: CustomerID,
		filters?: ProductFilters,
		trx: TRX = db,
	): Promise<
		(FormattedProduct & {
			inventory: Inventory & {
				locationName: string
				placementName: string
				batchName: string
				isDefaultPlacement: boolean
			}
		})[]
	> {
		const whereStmt: SQLWrapper[] = []

		if (filters) {
			if (filters.group) {
				whereStmt.push(inArray(groupTable.name, filters.group))
			}
		}

		const product = await trx
			.select({
				...PRODUCT_COLS,
				unit: UNIT_COLS.name,
				group: GROUP_COLS.name,
				supplierName: supplierTable.name,
				inventory: {
					...INVENTORY_COLS,
					locationName: locationTable.name,
					placementName: placementTable.name,
					batchName: batchTable.batch,
					isDefaultPlacement: sql`${exists(
						trx
							.select()
							.from(defaultPlacementTable)
							.where(
								and(
									eq(defaultPlacementTable.productID, inventoryTable.productID),
									eq(
										defaultPlacementTable.placementID,
										inventoryTable.placementID,
									),
									eq(
										defaultPlacementTable.locationID,
										inventoryTable.locationID,
									),
								),
							),
					)}`.mapWith(Boolean),
				},
			})
			.from(productTable)
			.innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
			.innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
			.innerJoin(inventoryTable, eq(inventoryTable.productID, productTable.id))
			.innerJoin(locationTable, eq(locationTable.id, inventoryTable.locationID))
			.innerJoin(
				placementTable,
				eq(placementTable.id, inventoryTable.placementID),
			)
			.innerJoin(batchTable, eq(batchTable.id, inventoryTable.batchID))
			.leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
			.where(and(eq(productTable.customerID, customerID), ...whereStmt))
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
	insertDeletedProduct: async function (
		deletedProduct: DeletedProduct,
		tx: TRX = db,
	): Promise<void> {
		await tx.insert(deletedProductTable).values(deletedProduct)
	},
	getBySkuOrBarcode: async function (
		customerID: CustomerID,
		skuOrBarcode: string,
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
			.where(
				and(
					eq(productTable.customerID, customerID),
					or(
						eq(productTable.sku, skuOrBarcode),
						eq(productTable.barcode, skuOrBarcode),
					),
				),
			)

		return res[0]
	},
	getBatchProducts: async function (
		customerID: CustomerID,
		trx: TRX = db,
	): Promise<FormattedProduct[]> {
		return await trx
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
			.where(
				and(
					eq(productTable.customerID, customerID),
					eq(productTable.useBatch, true),
				),
			)
	},
	upsertWithNoLog: async function (
		data: NewProduct,
		tx: TRX = db,
	): Promise<Product | undefined> {
		const result = await tx
			.insert(productTable)
			.values(data)
			.onConflictDoUpdate({
				target: [productTable.customerID, productTable.sku],
				set: { ...data },
			})
			.returning()

		return result.at(0)
	},
}
