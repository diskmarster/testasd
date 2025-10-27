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
	Product,
	ProductID,
	Unit,
} from '@/lib/database/schema/inventory'
import {
	NewSupplier,
	NewSupplierHistory,
	Supplier,
	SupplierHisotry,
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

		const { unit } = getUnit(data, units)

		const groups = await inventory.getActiveGroupsByID(data.customerID)
		let productGroup = groups.find(group => group.name === data.group)
		if (!productGroup) {
			const newProductGroup = await inventory.createProductGroup({
				name: data.group,
				customerID: data.customerID,
			})
			if (!newProductGroup) {
				throw new ActionError('product-new-group-not-created')
			}
			productGroup = newProductGroup
		}

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

		const units = await inventory.getActiveUnits()

		let groups = await inventory.getActiveGroupsByID(customerID)

		const preparedProducts: NewProduct[] = []

		for (const p of productData) {
			let productGroup = groups.find(group => group.name === p.group)
			if (!productGroup) {
				const newProductGroup = await inventory.createProductGroup({
					name: p.group,
					customerID: customerID,
				})
				if (!newProductGroup) {
					throw new ActionError('product-new-group-not-created')
				}
				productGroup = newProductGroup
				groups.push(newProductGroup)
			}

			const { unit } = getUnit(
				{ customerID, unit: p.unit, group: p.group },
				units,
			)
			if (!unit) {
				console.log(
					`Could not get unit: customerID = ${customerID}, unit = ${p.unit}`,
				)
				throw new ActionError(
					`Could not get unit: customerID = ${customerID}, unit = ${p.unit}`,
				)
			}

			preparedProducts.push({
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
			})
		}

		return db.transaction(async tx => {
			const upsertedProducts = await tryCatch(
				product.upsertMultipleWithNoLog(preparedProducts, tx),
			)
			if (!upsertedProducts.success) {
				console.log(
					`products from webhook was not upserted: ${upsertedProducts.error?.message}`,
				)
				throw new ActionError(
					`Could not upsert products: customerID = ${customerID}, error = ${upsertedProducts.error.message}`,
				)
			}

			let ids = []
			for (let upsertedProduct of upsertedProducts.data) {
				if (!inventories.has(upsertedProduct.id)) {
					ids.push(upsertedProduct.id)
				}
			}

			const insertedInventoryRes = await tryCatch(
				this.createZeroInventories(customerID, ids, tx),
			)
			if (!insertedInventoryRes.success) {
				console.log(
					`inventories from webhook was not inserted: ${insertedInventoryRes.error?.message}`,
				)
				throw new ActionError(
					`Could not create zero inventories: customerID = ${customerID}, error = ${insertedInventoryRes.error.message}`,
				)
			}

			return upsertedProducts.data
		})
	},
	createZeroInventories: async function (
		customerID: CustomerID,
		productIDs: ProductID[],
		tx?: TRX,
	): Promise<boolean> {
		if (productIDs.length === 0) return true
		async function execute(
			customerID: CustomerID,
			newProductsIDs: ProductID[],
			transaction?: TRX,
		) {
			let newInventories: NewInventory[] = []
			const locations = await location.getAllByCustomerID(
				customerID,
				transaction,
			)

			for (let location of locations) {
				const defaultPlacement = await inventory.getDefaultPlacementByID(
					location.id,
					transaction,
				)
				const defaultBatch = await inventory.getDefaultBatchByID(
					location.id,
					transaction,
				)

				let placementID = defaultPlacement?.id
				let batchID = defaultBatch?.id
				if (!defaultPlacement) {
					const newDefaultPlacement = await inventory.createPlacement(
						{
							name: '-',
							locationID: location.id,
						},
						transaction,
					)
					placementID = newDefaultPlacement.id
				}

				if (!defaultBatch) {
					const newBatch = await inventory.createBatch(
						{ batch: '-', locationID: location.id },
						transaction,
					)
					batchID = newBatch.id
				}

				newProductsIDs.map(pid =>
					newInventories.push({
						productID: pid,
						placementID: placementID,
						batchID: batchID,
						quantity: 0,
						customerID: customerID,
						locationID: location.id,
					}),
				)
			}

			const responses = await inventory.createInventories(
				newInventories,
				transaction,
			)
			return responses.length === newInventories.length
		}

		if (tx) {
			return await execute(customerID, productIDs, tx)
		} else {
			return await db.transaction(async trx => {
				return await execute(customerID, productIDs, trx)
			})
		}
	},
	upsertZeroInventory: async function (
		customerID: CustomerID,
		newProductID: ProductID,
		tx?: TRX,
	): Promise<boolean> {
		async function execute(
			customerID: CustomerID,
			productID: ProductID,
			transaction: TRX,
		) {
			const locations = await location.getAllByCustomerID(
				customerID,
				transaction,
			)
			for (const location of locations) {
				const defaultPlacement = await inventory.getDefaultPlacementByID(
					location.id,
					transaction,
				)
				const defaultBatch = await inventory.getDefaultBatchByID(
					location.id,
					transaction,
				)

				let placementID = defaultPlacement?.id
				let batchID = defaultBatch?.id
				if (!defaultPlacement) {
					const newDefaultPlacement = await inventory.createPlacement(
						{
							name: '-',
							locationID: location.id,
						},
						transaction,
					)
					placementID = newDefaultPlacement.id
				}

				if (!defaultBatch) {
					const newBatch = await inventory.createBatch(
						{ batch: '-', locationID: location.id },
						transaction,
					)
					batchID = newBatch.id
				}

				const newInventoryData: NewInventory = {
					productID: productID,
					placementID: placementID,
					batchID: batchID,
					quantity: 0,
					customerID: customerID,
					locationID: location.id,
				}
				await inventory.upsertInventory(newInventoryData, transaction)
			}
			return true
		}

		if (tx) {
			return await execute(customerID, newProductID, tx)
		} else {
			return await db.transaction(async trx => {
				return await execute(customerID, newProductID, trx)
			})
		}
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
			const logPromises: Promise<SupplierHisotry>[] = []
			const upsertedSuppliers = await suppliers.upsertMultiple(newSuppliers)

			for (const upserted of upsertedSuppliers) {
				logPromises.push(
					suppliers.createLog(
						{
							name: upserted.name,
							country: upserted.country,
							customerID: upserted.customerID,
							supplierID: upserted.id,
							type: 'synkroniseret',
							userID: upserted.userID,
							userName: upserted.userName,
							contactPerson: upserted.contactPerson,
							email: upserted.email,
							phone: upserted.phone,
							idOfClient: upserted.idOfClient,
							integrationId: upserted.integrationId,
						},
						tx,
					),
				)
			}
			await Promise.all(logPromises)

			return upsertedSuppliers
		})
	},
}

function getUnit(
	data: { customerID: CustomerID; group: string; unit: string | undefined },
	units: Unit[],
) {
	const unitMap = new Map(units.map(unit => [unit.name, unit]))

	const normalizedUnit = data.unit?.trim() ?? 'Stk'
	const allowedUnit = Object.entries(allowedUnitsMap).find(([_, values]) =>
		values.includes(normalizedUnit),
	)?.[0]

	let unit = (allowedUnit && unitMap.get(allowedUnit)) || unitMap.get('Stk')
	if (!unit) {
		throw new ActionError('product-unit-not-supported')
	}

	return {
		unit,
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
