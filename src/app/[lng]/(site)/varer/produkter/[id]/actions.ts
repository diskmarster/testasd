'use server'

import { serverTranslation } from '@/app/i18n'
import { fallbackLng, strIsI18NLanguage } from '@/app/i18n/settings'
import { attachmentRefTypeValidation } from '@/data/attachments'
import { hasPermissionByPlan } from '@/data/user.types'
import { adminAction, editableAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { attachmentService } from '@/service/attachments'
import { fileService } from '@/service/file'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { productService } from '@/service/products'
import { suppliersService } from '@/service/suppliers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createAttachmentValidation = z.object({
	name: z.string(),
	refType: attachmentRefTypeValidation,
	refID: z.coerce.number(),
	type: z.enum(['image', 'pdf', 'excel']),
	key: z.string(),
	url: z.string(),
})

const deleteAttachmentValidation = z.object({
	id: z.coerce.number(),
})

const uploadFileValidation = z.object({
	key: z.string(),
	type: z.string(),
	body: z.string(),
})

export const uploadFileAction = editableAction
	.schema(uploadFileValidation)
	.action(
		async ({ parsedInput: { key, type, body }, ctx: { customer, lang } }) => {
			const { t } = await serverTranslation(lang, 'produkter')

			if (customer && !hasPermissionByPlan(customer.plan, 'basis')) {
				throw new ActionError(t('details-page.server.attachment-not-allowed'))
			}

			const b = Buffer.from(body, 'base64url')
			const arraybuffer = new Uint8Array(b)

			return await fileService.upload({
				key,
				mimeType: type,
				body: arraybuffer,
			})
		},
	)

export const createAttachmentAction = editableAction
	.schema(createAttachmentValidation)
	.action(async ({ parsedInput, ctx: { user, customer, lang } }) => {
		const { t } = await serverTranslation(lang, 'produkter')

		if (customer && !hasPermissionByPlan(customer.plan, 'basis')) {
			throw new ActionError(t('details-page.server.attachment-not-allowed'))
		}

		const newAttachment = await attachmentService.create({
			customerID: user.customerID,
			refDomain: parsedInput.refType,
			refID: String(parsedInput.refID),
			name: parsedInput.name,
			type: parsedInput.type,
			key: parsedInput.key,
			url: parsedInput.url,
			userID: user.id,
			userName: user.name,
		})

		if (!newAttachment) {
			throw new ActionError(t('details-page.server.attachment-not-created'))
		}

		return {
			success: true,
			attachment: newAttachment,
		}
	})

export const deleteAttachmentAction = editableAction
	.schema(deleteAttachmentValidation)
	.action(async ({ parsedInput, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'produkter')

		const attachment = await attachmentService.getByID(parsedInput.id)
		if (!attachment) {
			throw new ActionError(t('details-page.server.file-not-found'))
		}

		if (attachment.customerID != ctx.user.customerID) {
			throw new ActionError(t('details-page.server.file-not-yours'))
		}

		const didDelete = await attachmentService.deleteByID(parsedInput.id)
		if (!didDelete) {
			throw new ActionError(t('details-page.server.file-not-deleted'))
		}
	})

export const deleteAttachmentAndFileAction = editableAction
	.schema(z.object({ id: z.coerce.number() }))
	.action(async ({ parsedInput: { id }, ctx: { user, lang } }) => {
		const { t } = await serverTranslation(lang, 'produkter')
		const attachment = await attachmentService.getByID(id)
		if (!attachment) {
			throw new ActionError(t('details-page.server.file-not-found'))
		}

		if (attachment.customerID != user.customerID) {
			throw new ActionError(t('details-page.server.file-not-yours'))
		}

		const s3DeletePromise = fileService.delete({ key: attachment.key })
		const attachmentDeletePromise = attachmentService.deleteByID(id)

		const [s3Delete, attachDelete] = await Promise.all([
			s3DeletePromise,
			attachmentDeletePromise,
		])

		if (s3Delete.success && !attachDelete) {
			throw new ActionError(t('details-page.server.file-not-deleted-database'))
		}

		if (!s3Delete.success && attachDelete) {
			throw new ActionError(t('details-page.server.file-not-deleted-bucket'))
		}

		if (!s3Delete.success && !attachDelete) {
			throw new ActionError(t('details-page.server.file-not-deleted-both'))
		}
	})

export const fetchActiveUnitsAction = editableAction.action(async () => {
	const units = await inventoryService.getActiveUnits()
	return units
})

export const fetchActiveGroupsAction = editableAction.action(
	async ({ ctx: { user } }) => {
		const groups = await inventoryService.getActiveGroupsByID(user.customerID)
		return groups
	},
)

export const fetchProductHistory = editableAction
	.schema(z.object({ id: z.coerce.number() }))
	.action(async ({ parsedInput: { id }, ctx: { user } }) => {
		const history = await productService.getHistoryLogs(user.customerID, id)
		return history
	})

export const fetchProductFiles = editableAction
	.schema(z.object({ id: z.coerce.number() }))
	.action(async ({ parsedInput: { id } }) => {
		const files = await attachmentService.getByRefID('product', id)
		return files
	})

export const fetchSuppliersAction = editableAction.action(
	async ({ ctx: { user } }) => {
		const suppliers = await suppliersService.getAllByCustomerID(user.customerID)
		return suppliers
	},
)

export const upsertDefaultPlacement = adminAction
	.schema(
		z.object({
			productID: z.coerce.number(),
			placementID: z.coerce.number(),
			locationID: z.coerce.string(),
		}),
	)
	.action(
		async ({
			parsedInput: { productID, placementID, locationID },
			ctx: { user, lang },
		}) => {
			await inventoryService.upsertDefaultPlacement(
				[productID, placementID, locationID],
				user.customerID,
				user.id,
				'web',
				strIsI18NLanguage(lang) ? lang : fallbackLng,
			)

			revalidatePath(`${lang}/varer/produkter/${productID}`)
		},
	)

export const deleteDefaultPlacement = adminAction
	.schema(
		z.object({
			productID: z.coerce.number(),
			placementID: z.coerce.number(),
			locationID: z.coerce.string(),
		}),
	)
	.action(
		async ({
			parsedInput: { productID, placementID, locationID },
			ctx: { lang },
		}) => {
			const { t } = await serverTranslation(lang, 'produkter', {
				keyPrefix: 'details-page.inventory.remove-default-placement-dialog',
			})
			console.log(
				`Remove default placement: [${productID}, ${placementID}, ${locationID}]`,
			)

			const success = await inventoryService.deleteDefaultPlacement([
				productID,
				placementID,
				locationID,
			])

			if (!success) {
				throw new ActionError(t('toasts.default-placement-not-removed'))
			}

			revalidatePath(`${lang}/varer/produkter/${productID}`)
		},
	)

export const deleteReorderAction = editableAction
	.metadata({ actionName: 'deleteReorderFromProductPage' })
	.schema(z.object({ productID: z.coerce.number() }))
	.action(async ({ parsedInput: { productID }, ctx: { user, lang } }) => {
		const { t } = await serverTranslation(lang, 'action-errors')
		const currentLocation = await locationService.getLastVisited(user.id)
		if (!currentLocation) {
			throw new ActionError(t('restock-action.company-location-not-found'))
		}

		const existsLocation = await locationService.getByID(currentLocation)
		if (!existsLocation) {
			throw new ActionError(t('restock-action.company-location-not-found'))
		}
		if (existsLocation.customerID != user.customerID) {
			throw new ActionError(
				t('restock-action.company-location-belongs-to-your-company'),
			)
		}

		const didDelete = await inventoryService.deleteReorderByIDs(
			productID,
			currentLocation,
			user.customerID,
		)
		if (!didDelete) {
			throw new ActionError(t('minimum-stock-action.minimum-stock-not-deleted'))
		}

		revalidatePath(`/${lang}/varer/produkter/${productID}`)
	})
