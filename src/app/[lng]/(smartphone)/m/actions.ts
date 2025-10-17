'use server'

import { serverTranslation } from '@/app/i18n'
import { EmailSendReorder } from '@/components/email/email-reorder'
import { editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { emailService } from '@/service/email'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { productService } from '@/service/products'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateInventoryValidation } from './validation'

export const updateInventoryAction = editableAction
	.metadata({ actionName: 'updateInventorySmartphone' })
	.schema(async () => await getSchema(updateInventoryValidation, 'validation'))
	.action(
		async ({
			parsedInput: { productID, placementID, batchID, type, amount, reference },
			ctx,
		}) => {
			const { t } = await serverTranslation(ctx.lang, 'action-errors')
			const location = await locationService.getLastVisited(ctx.user.id)
			if (!location) {
				throw new ActionError(t('overview-action.location-not-found'))
			}
			const customer = await customerService.getByID(ctx.user.customerID)
			if (!customer) {
				throw new ActionError(t('overview-action.customer-not-found'))
			}

			if (typeof placementID != 'number') {
				const newPlacement = await inventoryService.createPlacement(
					{
						name: placementID,
						locationID: location,
					},
					ctx.lang,
				)
				if (!newPlacement) {
					throw new ActionError(t('overview-action.placement-not-created'))
				}
				placementID = newPlacement.id
			}

			if (typeof batchID != 'number') {
				const newBatch = await inventoryService.createBatch(
					{
						batch: batchID,
						locationID: location,
					},
					ctx.lang,
				)
				if (!newBatch) {
					throw new ActionError(t('overview-action.batch-not-created'))
				}
				batchID = newBatch.id
			}

			if (type == 'afgang') {
				const exactInventory = await inventoryService.getInventoryByIDs(
					productID,
					placementID,
					batchID,
				)
				if (!exactInventory) {
					throw new ActionError(t('overview-action.exact-inventory-not-found'))
				}
			}

			await inventoryService.upsertInventory(
				'web',
				customer.id,
				ctx.user.id,
				location,
				productID,
				placementID,
				batchID,
				type,
				type == 'afgang' ? -amount : amount,
				reference,
				null,
				ctx.lang,
			)
		},
	)

export const requestProductAction = editableAction
	.schema(
		z.object({
			productID: z.coerce.number(),
			orderAmount: z.coerce.number(),
		}),
	)
	.action(async ({ parsedInput, ctx }) => {
		const EMAIL_LINK_BASEURL =
			process.env.VERCEL_ENV === 'production'
				? 'https://lager.nemunivers.app'
				: process.env.VERCEL_ENV === 'preview'
					? 'stage.lager.nemunivers.app'
					: 'http://localhost:3000'

		const { t } = await serverTranslation(ctx.lang, 'common')

		const { productID, orderAmount } = parsedInput
		const { user } = ctx
		const locationID = await locationService.getLastVisited(user.id)
		if (!locationID) {
			throw new ActionError(
				t('route-translations-productid.error-location-notfound'),
			)
		}

		const location = await locationService.getByID(locationID)
		if (!location) {
			throw new ActionError(
				t('route-translations-productid.error-location-notfound'),
			)
		}
		if (location.customerID != user.customerID) {
			throw new ActionError(
				t('route-translations-productid.error-location-denied'),
			)
		}

		const product = await productService.getByID(productID)
		if (!product) {
			throw new ActionError(
				t('route-translations-productid.error-product-notfound'),
			)
		}
		if (product.isBarred) {
			throw new ActionError(
				t('route-translations-productid.error-product-barred'),
			)
		}

		const existingReorder = await inventoryService.getReorderByIDs(
			productID,
			user.customerID,
			user.id,
		)
		if (existingReorder) {
			const msg = existingReorder.isRequested
				? t('route-translations-productid.error-product-already-requested')
				: t('route-translations-productid.error-product-already-minimum', {
						num: existingReorder.minimum,
					})
			throw new ActionError(msg)
		}

		const reorder = await inventoryService.createReorder({
			customerID: user.customerID,
			productID: productID,
			locationID: locationID,
			minimum: 0,
			orderAmount: orderAmount,
			isRequested: true,
		})

		if (!reorder) {
			throw new ActionError(
				t('route-translations-productid.error-request-notcreated'),
			)
		}

		const otherReorders = await inventoryService
			.getReordersByID(locationID)
			.then(rs => rs.filter(r => r.productID != productID))

		if (
			otherReorders.every(
				r => !r.isRequested && r.minimum <= r.quantity + r.ordered,
			)
		) {
			const mailSettings = await customerService.getMailSettingsForIDs(
				user.customerID,
				locationID,
				'sendReorderMail',
			)

			const mailPromises = mailSettings.map(setting => {
				const email = setting.userID ? setting.userEmail! : setting.email!

				return emailService.sendRecursively(
					[email],
					'Der er nye varer til genbestil i NemLager',
					EmailSendReorder({
						mailInfo: setting,
						link: `${EMAIL_LINK_BASEURL}/${ctx.lang}/genbestil`,
					}),
				)
			})

			await Promise.all(mailPromises)
		}

		revalidatePath(`/${ctx.lang}/m/opslag`)
	})
