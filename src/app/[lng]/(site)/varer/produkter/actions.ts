'use server'

import { serverTranslation } from '@/app/i18n'
import { LocationID } from '@/lib/database/schema/customer'
import { PlacementID } from '@/lib/database/schema/inventory'
import { adminAction, editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { integrationsService } from '@/service/integrations'
import { inventoryService } from '@/service/inventory'
import { productService } from '@/service/products'
import { revalidatePath } from 'next/cache'
import {
	createProductValidation,
	deleteProductValidation,
	importProductsValidation,
	productToggleBarredValidation,
	updateProductValidation,
} from './validation'

export const createProductAction = editableAction
	.metadata({ actionName: 'createProduct' })
	.schema(async () => await getSchema(createProductValidation, 'validation'))
	.action(async ({ parsedInput: { defaults, ...parsed }, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')

		const integrationSettings = await integrationsService.getSettings(
			ctx.user.customerID,
		)
		if (integrationSettings?.useSyncProducts) {
			throw new ActionError(t('product-action.sync-is-on'))
		}

		const defaultPlacementMap = defaults?.reduce<Map<LocationID, PlacementID>>(
			(acc, cur) => {
				acc.set(cur.locationID, cur.placementID)
				return acc
			},
			new Map<LocationID, PlacementID>(),
		)

		const newProduct = await productService.create(
			parsed,
			ctx.user.customerID,
			ctx.user.id,
			ctx.lang,
			defaultPlacementMap,
		)
		if (!newProduct) {
			throw new ActionError(t('product-action.product-not-created'))
		}
		revalidatePath(`/${ctx.lang}/varer/produkter`)
	})

export const updateProductAction = editableAction
	.metadata({ actionName: 'updateProduct' })
	.schema(async () => await getSchema(updateProductValidation, 'validation'))
	.action(
		async ({
			ctx: { user, lang },
			parsedInput: { productID, data: updatedProductData, dirtyFields },
		}) => {
			const { t } = await serverTranslation(lang, 'action-errors')
			const integrationSettings = await integrationsService.getSettings(user.id)
			if (integrationSettings?.useSyncProducts) {
				throw new ActionError(t('product-action.sync-is-on'))
			}

			if (updatedProductData.supplierID == -1) {
				updatedProductData.supplierID = null
			}

			if (dirtyFields?.useBatch == true && !updatedProductData.useBatch) {
				const moveSuccess =
					await inventoryService.moveInventoriesToDefaultBatch(
						user.customerID,
						user.id,
						productID,
						lang,
					)
				if (!moveSuccess) {
					throw new ActionError(t('product-action.product-not-updated'))
				}
			}

			const updatedProduct = await productService.updateByID(
				productID,
				updatedProductData,
				user.id,
			)

			if (!updatedProduct) {
				throw new ActionError(t('product-action.product-not-updated'))
			}
		},
	)

export const toggleBarredProductAction = editableAction
	.metadata({ actionName: 'productToggleBarred' })
	.schema(productToggleBarredValidation)
	.action(
		async ({ parsedInput: { productID, isBarred }, ctx: { user, lang } }) => {
			const { t } = await serverTranslation(lang, 'action-errors')

			const integrationSettings = await integrationsService.getSettings(user.customerID)
			if (integrationSettings?.useSyncProducts) {
				throw new ActionError(t('product-action.sync-is-on'))
			}

			const updatedProduct = await productService.updateBarredStatus(
				productID,
				isBarred,
				user.id,
			)

			if (!updatedProduct) {
				throw new ActionError(t('product-action.product-not-updated-barred'))
			}

			revalidatePath(`/${lang}/varer/produkter`)
		},
	)

export const importProductsAction = adminAction
	.metadata({ actionName: 'importProducts', excludeAnalytics: true })
	.schema(importProductsValidation)
	.action(async ({ parsedInput: importedData, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')

		const integrationSettings = await integrationsService.getSettings(
			ctx.user.customerID,
		)
		if (integrationSettings?.useSyncProducts) {
			throw new ActionError(t('product-action.sync-is-on'))
		}

		const importRes = await productService.importProducts(
			ctx.user.customerID,
			ctx.user.id,
			importedData,
		)

		revalidatePath(`/${ctx.lang}/varer/produkter`)
		return importRes
	})

export const finishProductsAction = adminAction
	.metadata({ actionName: 'importProductAction' })
	.action(async ({ ctx }) => {
		console.log(
			`imported products finished for ${ctx.user.customerID} by ${ctx.user.name}`,
		)
	})

export const deleteProductAction = adminAction
	.metadata({ actionName: 'deleteProductAction' })
	.schema(deleteProductValidation)
	.action(async ({ parsedInput: { productID }, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')

		const integrationSettings = await integrationsService.getSettings(
			ctx.user.customerID,
		)
		if (integrationSettings?.useSyncProducts) {
			throw new ActionError(t('product-action.sync-is-on'))
		}

		const res = await productService.softDeleteProduct(
			productID,
			ctx.user.customerID,
			ctx.user,
			null,
			ctx.lang,
			'web',
		)

		if (!res) {
			throw new ActionError(t('product-action.product-not-deleted'))
		}

		revalidatePath(`${ctx.lang}/varer/produkter`)
	})
