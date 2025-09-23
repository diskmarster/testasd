import { inventory } from '@/data/inventory'
import { ProductHistoryType } from '@/data/inventory.types'
import { location } from '@/data/location'
import { product } from '@/data/products'
import { suppliers } from '@/data/suppliers'
import { db, TRX } from '@/lib/database'
import { ApiKey } from '@/lib/database/schema/apikeys'
import { CustomerID } from '@/lib/database/schema/customer'
import {
	NewInventory,
	NewProduct,
	NewProductHistory,
	PlacementID,
	Product,
	ProductID,
	Unit,
} from '@/lib/database/schema/inventory'
import {
	NewSupplier,
	NewSupplierHistory,
	Supplier,
} from '@/lib/database/schema/suppliers'
import { ActionError } from '@/lib/safe-action/error'
import { tryCatch } from '@/lib/utils.server'

export const webhookService = {
	upsertProduct: async function (
		data: Omit<NewProduct, 'unitID' | 'groupID'> & {
			unit: string | undefined
			group: string
		},
		tx: TRX = db,
	): Promise<Product> {
		const units = await inventory.getActiveUnits(tx)

		const { unit, productGroup } = await getUnitAndGroup(data, units, tx)

		const newProductData: NewProduct = {
			customerID: data.customerID,
			text1: data.text1,
			text2: data.text2,
			text3: data.text3,
			sku: data.sku,
			barcode: data.barcode,
			isBarred: data.isBarred,
			costPrice: data.costPrice,
			salesPrice: data.salesPrice,
			groupID: productGroup.id,
			unitID: unit.id,
		}

		const newProduct = await product.upsertWithNoLog(newProductData, tx)
		if (!newProduct) {
			throw new ActionError('product from webhook was not upserted')
		}

		return newProduct
	},
	upsertProducts: async function (
		customerID: CustomerID,
		productData: (Omit<NewProduct, 'customerID' | 'unitID' | 'groupID'> & {
			unit: string | undefined
			group: string
		})[],
	): Promise<Product[]> {
		const inventories = await inventory
			.getInventoriesByCustomerID(customerID)
			.then(invs =>
				invs.reduce((acc, cur) => {
					if (!acc.has(cur.productID)) {
						acc.set(cur.productID, true)
					}
					return acc
				}, new Map<ProductID, boolean>()),
			)

		return db.transaction(async tx => {
			const units = await inventory.getActiveUnits(tx)

			const newProductPromises: Promise<Product>[] = []

			for (const p of productData) {
				const unitGroupRes = await tryCatch(
					getUnitAndGroup(
						{ customerID, unit: p.unit, group: p.group },
						units,
						tx,
					),
				)

				if (!unitGroupRes.success) {
					throw new ActionError(
						`Could not get unit and group: customerID = ${customerID}, group = ${p.group}, unit = ${p.unit}, error = ${unitGroupRes.error}`,
					)
				}
				const { unit, productGroup } = unitGroupRes.data

				const newProductData: NewProduct = {
					customerID: customerID,
					text1: p.text1,
					text2: p.text2,
					text3: p.text3,
					sku: p.sku,
					barcode: p.barcode,
					isBarred: p.isBarred,
					costPrice: p.costPrice,
					salesPrice: p.salesPrice,
					groupID: productGroup.id,
					unitID: unit.id,
				}

				const newProductPromise: Promise<Product> = new Promise(async res => {
					const newProduct = await product.upsertWithNoLog(newProductData, tx)
					if (!newProduct) {
						try {
							tx.rollback()
						} catch (_err) {}
						throw new ActionError('product from webhook was not upserted')
					}
					if (!inventories.has(newProduct.id)) {
						const zeroInventory = await this.createZeroInventories(
							customerID,
							newProduct.id,
						)
						if (!zeroInventory) {
							try {
								tx.rollback()
							} catch (_err) {}
							throw new ActionError(
								`product from webhook was created but zero inventories not created (product id: ${newProduct.id})`,
							)
						}
					}
					res(newProduct)
				})

				newProductPromises.push(newProductPromise)
			}

			return await Promise.all(newProductPromises)
		})
	},
	createZeroInventories: async function (
		customerID: CustomerID,
		newProductID: ProductID,
		tx: TRX = db,
	): Promise<boolean> {
		return await tx.transaction(async trx => {
			const locations = await location.getAllByCustomerID(customerID, trx)
			for (const location of locations) {
				const placementIDs: PlacementID[] = []

				const defaultPlacement = await inventory.getDefaultPlacementByID(
					location.id,
					trx,
				)
				const defaultBatch = await inventory.getDefaultBatchByID(
					location.id,
					trx,
				)

				let placementID = defaultPlacement?.id
				let batchID = defaultBatch?.id
				if (!defaultPlacement) {
					const newDefaultPlacement = await inventory.createPlacement(
						{
							name: '-',
							locationID: location.id,
						},
						trx,
					)
					placementID = newDefaultPlacement.id
				}

				placementIDs.push(placementID)

				if (!defaultBatch) {
					const newBatch = await inventory.createBatch(
						{ batch: '-', locationID: location.id },
						trx,
					)
					batchID = newBatch.id
				}

				await Promise.all(
					placementIDs.map(async placementID => {
						const newInventoryData: NewInventory = {
							productID: newProductID,
							placementID: placementID,
							batchID: batchID,
							quantity: 0,
							customerID: customerID,
							locationID: location.id,
						}
						await inventory.upsertInventory(newInventoryData, trx)
					}),
				)
			}
			return true
		})
	},
	createProductHistoryLog: async function (
		p: Product & { groupName: string; unitName: string },
		apiKey: ApiKey,
		logType: ProductHistoryType,
		tx: TRX = db,
	): Promise<boolean> {
		const data: NewProductHistory = {
			userID: -1,
			userName: apiKey.name,
			productID: p.id,
			userRole: 'apiKey',
			productGroupName: p.groupName,
			productUnitName: p.unitName,
			productText1: p.text1,
			productText2: p.text2,
			productText3: p.text3,
			productSku: p.sku,
			productBarcode: p.barcode,
			productCostPrice: p.costPrice,
			productSalesPrice: p.salesPrice,
			type: logType,
			productIsBarred: p.isBarred,
			productNote: p.note,
			isImport: false,
			customerID: apiKey.customerID,
		}

		const historyLog = await product.createHistoryLog(data, tx)

		return historyLog != undefined
	},
	createSupplier: async function (data: NewSupplier): Promise<Supplier> {
		return await suppliers.create(data)
	},
	upsertSupplier: async function (data: NewSupplier): Promise<Supplier> {
		return await suppliers.upsert(data)
	},
	createSupplierLog: async function (data: NewSupplierHistory) {
		return await suppliers.createLog(data)
	},
	deleteSupplier: async function (
		customerId: CustomerID,
		integrationId: string,
	): Promise<boolean> {
		return await suppliers.deleteByIntegrationID(customerId, integrationId)
	},
	updateSupplierByIntegrationId: async function (
		customerId: CustomerID,
		integrationId: string,
		data: Partial<Omit<Supplier, 'id' | 'customerID' | 'updated' | 'inserted'>>,
	): Promise<Supplier> {
		return await suppliers.updateByIntegrationID(
			integrationId,
			customerId,
			data,
		)
	},
	getSupplierByIntegrationId: async function (
		customerId: CustomerID,
		integrationId: string,
	): Promise<Supplier> {
		return await suppliers.getByIntegrationID(integrationId, customerId)
	},
	upsertSuppliers: async function (
		newSuppliers: NewSupplier[],
	): Promise<Supplier[]> {
		return await db.transaction(async tx => {
			const promises: Promise<Supplier>[] = []
			for (const newSupplier of newSuppliers) {
				promises.push(suppliers.upsert(newSupplier, tx))
			}
			return await Promise.all(promises)
		})
	},
}

async function getUnitAndGroup(
	data: { customerID: CustomerID; group: string; unit: string | undefined },
	units: Unit[],
	tx: TRX = db,
) {
	const groups = await inventory.getActiveGroupsByID(data.customerID, tx)
	let productGroup = groups.find(group => group.name === data.group)
	if (!productGroup) {
		const newProductGroup = await inventory.createProductGroup(
			{
				name: data.group,
				customerID: data.customerID,
			},
			tx,
		)
		if (!newProductGroup) {
			throw new ActionError('product-new-group-not-created')
		}
		productGroup = newProductGroup
	}

	const unitMap = new Map(units.map(unit => [unit.name, unit]))

	const normalizedUnit = data.unit?.trim() ?? 'Stk'
	const allowedUnit = Object.entries(allowedUnitsMap).find(([_, values]) =>
		values.includes(normalizedUnit),
	)?.[0]

	const unit = allowedUnit && unitMap.get(allowedUnit)
	if (!unit) {
		throw new ActionError('product-unit-not-supported')
	}

	return {
		unit,
		productGroup,
	}
}

const allowedUnitsMap: Record<string, string[]> = {
	Stk: [
		'Stk',
		'Stk.',
		'stk',
		'stk.',
		'styk',
		'piece',
		'pieces',
		'pcs',
		'pcs.',
		'pc',
		'pc.',
		'ea',
		'each',
	],
	Kg: ['Kg', 'kg', 'KG', 'kilo', 'kilogram', 'kilos', 'kilograms'],
	Kasse: [
		'Kasse',
		'kasse',
		'box',
		'boxes',
		'case',
		'cases',
		'carton',
		'cartons',
	],
	Gram: ['Gram', 'gram', 'g', 'G', 'gr', 'grams'],
	Pose: ['Pose', 'pose', 'poser', 'bag', 'bags', 'sack', 'sacks'],
	Plade: [
		'Plade',
		'plade',
		'plader',
		'plate',
		'plates',
		'sheet',
		'sheets',
		'panel',
		'panels',
		'board',
		'boards',
	],
	Meter: ['Meter', 'meter', 'metre', 'm', 'M', 'mt', 'mtr', 'meters', 'metres'],
	Liter: ['Liter', 'liter', 'litre', 'l', 'L', 'lt', 'ltr', 'liters', 'litres'],
	Ark: ['Ark', 'ark', 'sheet', 'sheets', 'leaf', 'leaves'],
	Rulle: ['Rulle', 'rulle', 'roller', 'roll', 'rolls', 'reel', 'reels'],
	Pakke: [
		'Pakke',
		'pakke',
		'pakker',
		'pack',
		'packs',
		'package',
		'packages',
		'pkg',
		'pkgs',
	],
	M2: [
		'M2',
		'm2',
		'M²',
		'm²',
		'sqm',
		'SQM',
		'square meter',
		'square metre',
		'square meters',
		'square metres',
		'kvadratmeter',
		'kvm',
	],
	Palle: ['Palle', 'palle', 'pallet', 'pallets', 'skid', 'skids'],
	Sæt: ['Sæt', 'sæt', 'set', 'sets', 'kit', 'kits'],
	Kolli: ['Kolli', 'kolli', 'parcel', 'parcels', 'shipment', 'shipments'],
}
