import { fallbackLng } from '@/app/i18n/settings'
import { supplierCountriesSchema } from '@/data/suppliers.types'
import { db } from '@/lib/database'
import { ApiKey } from '@/lib/database/schema/apikeys'
import type { Customer } from '@/lib/database/schema/customer'
import { CustomerIntegrationSettings } from '@/lib/database/schema/integrations'
import { NewProduct } from '@/lib/database/schema/inventory'
import {
	NewSupplier,
	NewSupplierHistory,
} from '@/lib/database/schema/suppliers'
import { tryCatch } from '@/lib/utils.server'
import { productService } from '@/service/products'
import { webhookService } from '@/service/webhook'
import type { NextRequest } from 'next/server'
import type {
	SyncProvider,
	SyncProviderConfig,
	SyncProviderResponse,
} from './interfaces'

type EconomicProduct = {
	productNumber: string
	barCode: string
	barred: boolean
	costPrice: number
	salesPrice: number
	description: string
	name: string
	productGroup: {
		name: string
	}
	unit:
		| {
				name: string
		  }
		| undefined
}

type EconomicSupplier = {
	supplierNumber: number
	address: string | undefined
	country: string | undefined
	email: string | undefined // can be multiple emails in e-conomic separated by spaces
	name: string
	phone: string | undefined
	attention:
		| {
				number: number
				self: string
		  }
		| undefined
	supplierContact:
		| {
				number: number
				self: string
		  }
		| undefined
}

export type EconomicProductEventData = {
	oldParam: string | null
	newParam: string | null
}

export type EconomicOldNewEventAction =
	| { action: 'create'; param: string }
	| { action: 'update'; param: string }
	| { action: 'delete'; param: string }
	| { action: 're-number'; oldParam: string; newParam: string }
	| { action: 'invalid' }

export type EconomicSupplierEventData = {
	oldParam: string | null
	newParam: string | null
}

export class EconomicSyncProvider implements SyncProvider {
	private baseUrl = 'https://restapi.e-conomic.com'
	private appSecretToken = process.env.ECONOMIC_APP_SECRET!
	private agreementGrantToken: string

	constructor(config: SyncProviderConfig['e-conomic']) {
		this.agreementGrantToken = config.agreementGrantToken
	}

	private oldNewEventAction(
		oldParam: string | null,
		newParam: string | null,
	): EconomicOldNewEventAction {
		if (!oldParam && newParam) {
			return { action: 'create', param: newParam }
		} else if (!newParam && oldParam) {
			return { action: 'delete', param: oldParam }
		} else if (oldParam && newParam && oldParam === newParam) {
			return { action: 'update', param: newParam }
		} else if (oldParam && newParam && oldParam !== newParam) {
			return { action: 're-number', oldParam: oldParam, newParam: newParam }
		} else {
			return { action: 'invalid' }
		}
	}

	private async fetchSupplierByNumber(
		supplierNumber: string,
	): Promise<EconomicSupplier> {
		const response = await fetch(
			`${this.baseUrl}/suppliers/${supplierNumber}`,
			{
				headers: {
					'X-AppSecretToken': this.appSecretToken,
					'X-AgreementGrantToken': this.agreementGrantToken,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			console.log(await response.json())
			throw Error(`e-conomic response failed with status ${response.status}`)
		}

		const contentType = response.headers.get('Content-Type')

		if (!contentType?.includes('application/json')) {
			throw Error('e-conomic response is not application/json')
		}

		const json = await response.json()

		return json as EconomicSupplier
	}

	private async fetchSuppliersFromUrl(
		url: string,
	): Promise<EconomicSupplier[]> {
		const response = await fetch(url, {
			headers: {
				'X-AppSecretToken': this.appSecretToken,
				'X-AgreementGrantToken': this.agreementGrantToken,
				Accept: 'application/json',
			},
		})
		if (!response.ok) {
			throw Error(
				`fetchSuppliersFromUrl(): e-conomic request failed with status ${response.status}`,
			)
		}

		const contentType = response.headers.get('Content-Type')

		if (!contentType?.includes('application/json')) {
			throw Error('e-conomic response is not application/json')
		}

		const json = await response.json()
		let collection: EconomicSupplier[] = json.collection

		const nextPage = json.pagination.nextPage
		if (nextPage != undefined) {
			const next = await this.fetchSuppliersFromUrl(nextPage)
			collection = [...collection, ...next]
		}

		return collection
	}

	private async fetchSuppliers(): Promise<EconomicSupplier[]> {
		return await this.fetchSuppliersFromUrl(
			`${this.baseUrl}/suppliers?skippages=0&pagesize=1000`,
		)
	}

	private async fetchProductBySku(sku: string): Promise<EconomicProduct> {
		const response = await fetch(`${this.baseUrl}/products/${sku}`, {
			headers: {
				'X-AppSecretToken': this.appSecretToken,
				'X-AgreementGrantToken': this.agreementGrantToken,
				'Content-Type': 'application/json',
			},
		})

		if (!response.ok) {
			throw Error(`e-conomic response failed with status ${response.status}`)
		}

		const contentType = response.headers.get('Content-Type')

		if (!contentType?.includes('application/json')) {
			throw Error('e-conomic response is not application/json')
		}

		const json = await response.json()

		console.log('product from e-conomic', json)

		return json as EconomicProduct
	}

	private async fetchProductsFromUrl(url: string): Promise<EconomicProduct[]> {
		const response = await fetch(url, {
			headers: {
				'X-AppSecretToken': this.appSecretToken,
				'X-AgreementGrantToken': this.agreementGrantToken,
				Accept: 'application/json',
			},
		})
		if (!response.ok) {
			throw Error(
				`fetchProducts(): e-conomic request failed with status ${response.status}`,
			)
		}

		const contentType = response.headers.get('Content-Type')

		if (!contentType?.includes('application/json')) {
			throw Error('e-conomic response is not application/json')
		}

		const json = await response.json()
		let collection: EconomicProduct[] = json.collection

		const nextPage = json.pagination.nextPage
		if (nextPage != undefined) {
			const next = await this.fetchProductsFromUrl(nextPage)
			collection = [...collection, ...next]
		}

		return collection
	}

	private async fetchProducts(): Promise<EconomicProduct[]> {
		return await this.fetchProductsFromUrl(
			`${this.baseUrl}/products?skippages=0&pagesize=1000`,
		)
	}

	async handleProductEvent(
		customer: Customer,
		r: NextRequest,
		apiKey: ApiKey,
	): Promise<SyncProviderResponse<'productEvent', 'e-conomic'>> {
		const searchParams = r.nextUrl.searchParams
		const oldParam = searchParams.get('old')
		const newParam = searchParams.get('new')
		const inputData: EconomicProductEventData = {
			oldParam,
			newParam,
		}

		let economicProduct: EconomicProduct

		const eventData = this.oldNewEventAction(oldParam, newParam)
		if (eventData.action == 'invalid') {
			return {
				success: false,
				message: 'product-invalid-economic-webhook',
				eventData: {
					input: inputData,
					action: eventData,
				},
			}
		}

		try {
			switch (eventData.action) {
				case 'create': {
					economicProduct = await this.fetchProductBySku(eventData.param)

					const res:
						| SyncProviderResponse<'productEvent', 'e-conomic'>
						| undefined = await db.transaction(async tx => {
						const newProductResult = await tryCatch(
							webhookService.upsertProduct(
								{
									customerID: customer.id,
									sku: economicProduct.productNumber,
									barcode:
										economicProduct.barCode ?? economicProduct.productNumber,
									costPrice: economicProduct.costPrice ?? 0,
									salesPrice: economicProduct.salesPrice ?? 0,
									text1: economicProduct.name,
									text2: economicProduct.description,
									unit: economicProduct.unit?.name,
									group: economicProduct.productGroup.name,
									isBarred: economicProduct.barred ?? false,
								},
								tx,
							),
						)

						if (!newProductResult.success) {
							let errMsgKey = 'product-not-created-economic'
							if (
								newProductResult.error.message.includes(
									'UNIQUE constraint failed: nl_product.customer_id, nl_product.barcode',
								)
							) {
								errMsgKey = 'product-dublicate-barcode'
							} else if (
								newProductResult.error.message ==
									'product-new-group-not-created' ||
								newProductResult.error.message == 'product-unit-not-supported'
							) {
								errMsgKey = newProductResult.error.message
							}
							return {
								success: false,
								message: errMsgKey,
								eventData: {
									input: inputData,
									action: eventData,
								},
							}
						}

						const didCreateZeroes = await webhookService.upsertZeroInventory(
							customer.id,
							newProductResult.data.id,
							tx,
						)
						if (!didCreateZeroes) {
							console.error(
								`product with id ${newProductResult.data.id} has no zero inventories created`,
							)

							return {
								success: false,
								message: 'product-zero-inv-not-created',
								eventData: {
									input: inputData,
									action: eventData,
								},
							}
						}

						const didCreateHistoryLog =
							await webhookService.createProductHistoryLog(
								{
									...newProductResult.data,
									groupName: economicProduct.productGroup.name,
									unitName: economicProduct.unit?.name ?? 'Stk',
								},
								apiKey,
								'oprettelse',
								tx,
							)
						if (!didCreateHistoryLog) {
							console.error(
								`product with id ${newProductResult.data.id} has no history log created`,
							)
							return {
								success: false,
								message: 'product-no-history-log',
								eventData: {
									input: inputData,
									action: eventData,
								},
							}
						}
					})
					if (res != undefined) {
						return res
					}
					break
				}
				case 'update': {
					economicProduct = await this.fetchProductBySku(eventData.param)

					const res:
						| SyncProviderResponse<'productEvent', 'e-conomic'>
						| undefined = await db.transaction(async tx => {
						const updateProductResult = await tryCatch(
							webhookService.upsertProduct(
								{
									customerID: customer.id,
									sku: economicProduct.productNumber,
									barcode:
										economicProduct.barCode ?? economicProduct.productNumber,
									costPrice: economicProduct.costPrice ?? 0,
									salesPrice: economicProduct.salesPrice ?? 0,
									text1: economicProduct.name,
									text2: economicProduct.description,
									unit: economicProduct.unit?.name,
									group: economicProduct.productGroup.name,
									isBarred: economicProduct.barred ?? false,
								},
								tx,
							),
						)

						if (!updateProductResult.success) {
							let errMsgKey = 'product-not-updated-economic'
							if (
								updateProductResult.error.message.includes(
									'UNIQUE constraint failed: nl_product.customer_id, nl_product.barcode',
								)
							) {
								errMsgKey = 'product-dublicate-barcode'
							} else if (
								updateProductResult.error.message ==
									'product-new-group-not-created' ||
								updateProductResult.error.message ==
									'product-unit-not-supported'
							) {
								errMsgKey = updateProductResult.error.message
							}
							return {
								success: false,
								message: errMsgKey,
								eventData: {
									input: inputData,
									action: eventData,
								},
							}
						}

						const didCreateHistoryLog =
							await webhookService.createProductHistoryLog(
								{
									...updateProductResult.data,
									groupName: economicProduct.productGroup.name,
									unitName: economicProduct.unit?.name ?? 'Stk',
								},
								apiKey,
								'opdatering',
								tx,
							)
						if (!didCreateHistoryLog) {
							console.error(
								`product with id ${updateProductResult.data.id} has no history log created`,
							)
							return {
								success: false,
								message: 'product-no-history-log',
								eventData: {
									input: inputData,
									action: eventData,
								},
							}
						}
					})
					if (res != undefined) {
						return res
					}
					break
				}
				case 'delete': {
					const nemLagerProduct = await productService.getBySkuOrBarcode(
						customer.id,
						eventData.param,
					)
					if (!nemLagerProduct) {
						return {
							success: true,
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}
					const didSoftDelete = await productService.softDeleteProduct(
						nemLagerProduct.id,
						customer.id,
						null,
						`e-conomic integration (${apiKey.name})`,
						fallbackLng,
						'ext',
					)
					if (!didSoftDelete) {
						return {
							success: false,
							message: 'product-not-deleted-economic',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}
					break
				}
				case 're-number': {
					economicProduct = await this.fetchProductBySku(eventData.newParam)
					return {
						success: true,
						message: 'product-renumber-not-supported-economic',
						eventData: {
							input: inputData,
							action: eventData,
						},
					}
				}
			}
		} catch (err) {
			const errMsg =
				(err as Error).message ??
				'unknown error occured when handling products webhook'

			console.error('Economic::handleProductEvent:', errMsg)
			return {
				success: false,
				message: 'product-unknown-error-economic',
				eventData: {
					input: inputData,
					action: eventData,
				},
			}
		}

		return {
			success: true,
			eventData: {
				input: inputData,
				action: eventData,
			},
		}
	}

	async handleFullSync(
		customer: Customer,
		integrationSettings: CustomerIntegrationSettings,
	): Promise<SyncProviderResponse<'fullSync'>> {
		if (integrationSettings.useSyncSuppliers) {
			const economicSuppliersRes = await tryCatch(this.fetchSuppliers())
			if (!economicSuppliersRes.success) {
				console.error(
					`Economic::HandleFullSync failed: ${economicSuppliersRes.error}`,
				)
				return {
					success: false,
					message: 'full-fetch-suppliers-failed-economic',
					eventData: null,
				}
			}

			const nemLagerSuppliers: NewSupplier[] = []
			for (const economicSupplier of economicSuppliersRes.data) {
				const countryValidation = supplierCountriesSchema.safeParse(
					economicSupplier.country,
				)

				nemLagerSuppliers.push({
					name: economicSupplier.name,
					customerID: customer.id,
					idOfClient: '',
					country: countryValidation.success ? countryValidation.data : 'UNK',
					userID: -1,
					userName: 'Cron',
					contactPerson: '',
					email: economicSupplier.email,
					phone: economicSupplier.phone,
					integrationId: economicSupplier.supplierNumber.toString(),
				})
			}
			const upsertedSuppliersRes = await tryCatch(
				webhookService.upsertSuppliers(nemLagerSuppliers),
			)
			if (!upsertedSuppliersRes.success) {
				console.error(
					`Economic::HandleFullSync failed: ${upsertedSuppliersRes.error}`,
				)
				return {
					success: false,
					message: 'full-upsert-suppliers-failed-economic',
					eventData: null,
				}
			}
		}

		if (integrationSettings.useSyncProducts) {
			const productsRes = await tryCatch(this.fetchProducts())
			if (!productsRes.success) {
				console.error(`Economic::HandleFullSync failed: ${productsRes.error}`)
				return {
					success: false,
					message: 'full-fetch-products-failed-economic',
					eventData: null,
				}
			}

			const products = Array.from(
				productsRes.data
					.reduce(
						(acc, cur) => {
							if (cur.barred) return acc

							let identifier = cur.barCode
							if (!identifier || identifier === '') {
								identifier = cur.productNumber
							}

							if (!acc.has(identifier)) {
								acc.set(identifier, {
									sku: cur.productNumber,
									barcode: cur.barCode ?? cur.productNumber,
									costPrice: cur.costPrice ?? 0,
									salesPrice: cur.salesPrice ?? 0,
									text1: cur.name,
									text2: cur.description,
									unit: cur.unit?.name ?? 'Stk',
									group: cur.productGroup.name,
									isBarred: cur.barred ?? false,
								})
							}

							return acc
						},
						new Map() as Map<
							string,
							Omit<NewProduct, 'customerID' | 'unitID' | 'groupID'> & {
								unit: string | undefined
								group: string
							}
						>,
					)
					.values(),
			)

			const res = await tryCatch(
				webhookService.upsertProducts(customer.id, products),
			)
			if (!res.success) {
				console.error(`Economic::HandleFullSync. Upsert failed: ${res.error}`)
				return {
					success: false,
					message: 'full-upsert-products-failed-economic',
					eventData: null,
				}
			}
		}

		return { success: true, eventData: null }
	}

	async handleSupplierEvent(
		customer: Customer,
		r: NextRequest,
		apiKey: ApiKey,
	): Promise<SyncProviderResponse<'supplierEvent', 'e-conomic'>> {
		const searchParams = r.nextUrl.searchParams
		const oldParam = searchParams.get('old')
		const newParam = searchParams.get('new')
		const inputData: EconomicSupplierEventData = {
			oldParam,
			newParam,
		}

		const eventData = this.oldNewEventAction(oldParam, newParam)
		if (eventData.action == 'invalid') {
			return {
				success: false,
				message: 'supplier-invalid-economic-webhook',
				eventData: {
					input: inputData,
					action: eventData,
				},
			}
		}

		let economicSupplier: EconomicSupplier

		try {
			switch (eventData.action) {
				case 'create':
					economicSupplier = await this.fetchSupplierByNumber(eventData.param)

					const countryValidation = supplierCountriesSchema.safeParse(
						economicSupplier.country,
					)

					const newSupplier: NewSupplier = {
						name: economicSupplier.name,
						customerID: customer.id,
						idOfClient: '',
						country: countryValidation.success ? countryValidation.data : 'UNK',
						userID: -1,
						userName: apiKey.name,
						contactPerson: '',
						email: economicSupplier.email,
						phone: economicSupplier.phone,
						integrationId: economicSupplier.supplierNumber.toString(),
					}

					const createRes = await tryCatch(
						webhookService.upsertSupplier(newSupplier),
					)
					if (!createRes.success) {
						console.error(
							`Economic::handleSupplierEvent. Upsert (create) failed: ${createRes.error}`,
						)
						return {
							success: false,
							message: 'supplier-not-created-economic',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}

					const createLog: NewSupplierHistory = {
						country: createRes.data.country,
						customerID: apiKey.customerID,
						name: createRes.data.name,
						supplierID: createRes.data.id,
						type: 'oprettet',
						userID: -1,
						userName: apiKey.name,
						contactPerson: createRes.data.contactPerson,
						email: createRes.data.email,
						idOfClient: createRes.data.idOfClient,
						phone: createRes.data.phone,
						integrationId: createRes.data.integrationId,
					}

					const createLogRes = await tryCatch(
						webhookService.createSupplierLog(createLog),
					)
					if (!createLogRes.success) {
						console.error(
							`Economic::handleSupplierEvent. Log for creating supplier failed: ${createLogRes.error}`,
						)

						return {
							success: false,
							message: 'supplier-no-history-log',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}
					break
				case 'update':
					economicSupplier = await this.fetchSupplierByNumber(eventData.param)

					const updateCountryValidation = supplierCountriesSchema.safeParse(
						economicSupplier.country,
					)

					const updateData: NewSupplier = {
						name: economicSupplier.name,
						customerID: customer.id,
						idOfClient: '',
						country: updateCountryValidation.success
							? updateCountryValidation.data
							: 'UNK',
						userID: -1,
						userName: apiKey.name,
						contactPerson: '',
						email: economicSupplier.email,
						phone: economicSupplier.phone,
						integrationId: economicSupplier.supplierNumber.toString(),
					}

					const updateRes = await tryCatch(
						webhookService.upsertSupplier(updateData),
					)
					if (!updateRes.success) {
						console.error(
							`Economic::handleSupplierEvent. Upsert (update) failed: ${updateRes.error}`,
						)
						return {
							success: false,
							message: 'supplier-not-updated-economic',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}

					const updateLog: NewSupplierHistory = {
						country: updateRes.data.country,
						customerID: apiKey.customerID,
						name: updateRes.data.name,
						supplierID: updateRes.data.id,
						type: 'opdateret',
						userID: -1,
						userName: apiKey.name,
						contactPerson: updateRes.data.contactPerson,
						email: updateRes.data.email,
						idOfClient: updateRes.data.idOfClient,
						phone: updateRes.data.phone,
						integrationId: updateRes.data.integrationId,
					}

					const updateLogRes = await tryCatch(
						webhookService.createSupplierLog(updateLog),
					)
					if (!updateLogRes.success) {
						console.error(
							`Economic::handleSupplierEvent. Log for updating supplier failed: ${updateLogRes.error}`,
						)

						return {
							success: false,
							message: 'supplier-no-history-log',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}
					break
				case 'delete':
					const supplier = await webhookService.getSupplierByIntegrationId(
						customer.id,
						eventData.param,
					)

					const deleteRes = await tryCatch(
						webhookService.deleteSupplier(apiKey.customerID, eventData.param),
					)
					if (!deleteRes.success) {
						console.error(`Economic::handleSupplierEvent. Delete failed`)

						return {
							success: false,
							message: 'supplier-not-deleted-economic',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}

					const deleteLog: NewSupplierHistory = {
						country: supplier.country,
						customerID: apiKey.customerID,
						name: supplier.name,
						supplierID: supplier.id,
						type: 'slettet',
						userID: -1,
						userName: apiKey.name,
						contactPerson: supplier.contactPerson,
						email: supplier.email,
						idOfClient: supplier.idOfClient,
						phone: supplier.phone,
						integrationId: supplier.integrationId,
					}

					const deleteLogRes = await tryCatch(
						webhookService.createSupplierLog(deleteLog),
					)
					if (!deleteLogRes.success) {
						console.error(
							`Economic::handleSupplierEvent. Log for deleting supplier failed: ${deleteLogRes.error}`,
						)

						return {
							success: false,
							message: 'supplier-no-history-log',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}
					break
				case 're-number':
					economicSupplier = await this.fetchSupplierByNumber(
						eventData.newParam,
					)

					const renumberCountryValidation = supplierCountriesSchema.safeParse(
						economicSupplier.country,
					)

					const renumberSupplier: NewSupplier = {
						name: economicSupplier.name,
						customerID: customer.id,
						idOfClient: '',
						country: renumberCountryValidation.success
							? renumberCountryValidation.data
							: 'UNK',
						userID: -1,
						userName: apiKey.name,
						contactPerson: '',
						email: economicSupplier.email,
						phone: economicSupplier.phone,
						integrationId: economicSupplier.supplierNumber.toString(),
					}

					const renumberRes = await tryCatch(
						webhookService.updateSupplierByIntegrationId(
							customer.id,
							eventData.oldParam,
							renumberSupplier,
						),
					)
					if (!renumberRes.success) {
						console.error(
							`Economic::handleSupplierEvent. Update (renumber) failed: ${renumberRes.error}`,
						)
						return {
							success: false,
							message: 'supplier-not-updated-economic',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}

					const renumberLog: NewSupplierHistory = {
						country: renumberRes.data.country,
						customerID: apiKey.customerID,
						name: renumberRes.data.name,
						supplierID: renumberRes.data.id,
						type: 'opdateret',
						userID: -1,
						userName: apiKey.name,
						contactPerson: renumberRes.data.contactPerson,
						email: renumberRes.data.email,
						idOfClient: renumberRes.data.idOfClient,
						phone: renumberRes.data.phone,
						integrationId: renumberRes.data.integrationId,
					}

					const renumberLogRes = await tryCatch(
						webhookService.createSupplierLog(renumberLog),
					)
					if (!renumberLogRes.success) {
						console.error(
							`Economic::handleSupplierEvent. Log for renumber supplier failed: ${renumberLogRes.error}`,
						)

						return {
							success: false,
							message: 'supplier-no-history-log',
							eventData: {
								input: inputData,
								action: eventData,
							},
						}
					}
			}
		} catch (err) {
			const errMsg =
				(err as Error).message ??
				'unknown error occured when handling supplier webhook'

			console.error('Economic::handleSupplierEvent:', errMsg)
			return {
				success: false,
				message: 'supplier-unknown-error-economic',
				eventData: {
					input: inputData,
					action: eventData,
				},
			}
		}

		return {
			success: true,
			eventData: {
				input: inputData,
				action: eventData,
			},
		}
	}
}
