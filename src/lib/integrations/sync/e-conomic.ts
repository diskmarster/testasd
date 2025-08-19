import { fallbackLng } from '@/app/i18n/settings'
import { db } from '@/lib/database'
import { ApiKey } from '@/lib/database/schema/apikeys'
import type { Customer } from '@/lib/database/schema/customer'
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

export type EconomicProductEventData = {
	oldParam: string | null
	newParam: string | null
}

export type EconomicProductEventAction =
	| { action: 'create'; sku: string }
	| { action: 'update'; sku: string }
	| { action: 'delete'; sku: string }
	| { action: 're-number'; oldSku: string; newSku: string }
	| { action: 'invalid' }

export class EconomicSyncProvider implements SyncProvider {
	private baseUrl = 'https://restapi.e-conomic.com'
	private appSecretToken = process.env.ECONOMIC_APP_SECRET!
	private agreementGrantToken: string

	constructor(config: SyncProviderConfig['e-conomic']) {
		this.agreementGrantToken = config.agreementGrantToken
	}

	private productEventAction(
		oldParam: string | null,
		newParam: string | null,
	): EconomicProductEventAction {
		if (!oldParam && newParam) {
			return { action: 'create', sku: newParam }
		} else if (!newParam && oldParam) {
			return { action: 'delete', sku: oldParam }
		} else if (oldParam && newParam && oldParam === newParam) {
			return { action: 'update', sku: newParam }
		} else if (oldParam && newParam && oldParam !== newParam) {
			return { action: 're-number', oldSku: oldParam, newSku: newParam }
		} else {
			return { action: 'invalid' }
		}
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

		const eventData = this.productEventAction(oldParam, newParam)
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
					economicProduct = await this.fetchProductBySku(eventData.sku)

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

						const didCreateZeroes = await webhookService.createZeroInventories(
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
					economicProduct = await this.fetchProductBySku(eventData.sku)

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
						eventData.sku,
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
					economicProduct = await this.fetchProductBySku(eventData.newSku)
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
	): Promise<SyncProviderResponse<'fullSync'>> {
		const productsRes = await tryCatch(this.fetchProducts())
		if (!productsRes.success) {
			console.error(`Economic::HandleFullSync failed: ${productsRes.error}`)
			return {
				success: false,
				message: 'full-fetch-products-failed-economic',
				eventData: null,
			}
		}
		const products = productsRes.data

		const upsertData = products.map(economicProduct => ({
			sku: economicProduct.productNumber,
			barcode: economicProduct.barCode ?? economicProduct.productNumber,
			costPrice: economicProduct.costPrice ?? 0,
			salesPrice: economicProduct.salesPrice ?? 0,
			text1: economicProduct.name,
			text2: economicProduct.description,
			unit: economicProduct.unit?.name ?? 'Stk',
			group: economicProduct.productGroup.name,
			isBarred: economicProduct.barred ?? false,
		}))

		const res = await tryCatch(
			webhookService.upsertProducts(customer.id, upsertData),
		)
		if (!res.success) {
			console.error(`Economic::HandleFullSync. Upsert failed: ${res.error}`)
			return {
				success: false,
				message: 'full-upsert-failed-economic',
				eventData: null,
			}
		}

		return { success: true, eventData: null }
	}
}
