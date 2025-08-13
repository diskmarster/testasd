'use server'

import { serverTranslation } from '@/app/i18n'
import { hasPermissionByRank } from '@/data/user.types'
import { syncProvidersImpl } from '@/lib/integrations/sync/interfaces'
import { adminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { tryCatch } from '@/lib/utils.server'
import { customerService } from '@/service/customer'
import { integrationsService } from '@/service/integrations'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createMailSetting, updateMailSettingsValidation } from './validation'

export const fetchLocationsForMailSettings = adminAction
	.schema(z.object({ customerID: z.coerce.number() }))
	.action(async ({ parsedInput, ctx: { user } }) => {
		if (hasPermissionByRank(user.role, 'administrator')) {
			const locations = await locationService.getByCustomerID(
				parsedInput.customerID,
			)
			return locations.map(l => ({ id: l.id, name: l.name }))
		} else {
			const locations = await locationService.getAllActiveByUserID(user.id)
			return locations.map(l => ({ id: l.id, name: l.name }))
		}
	})

export const fetchUsersAction = adminAction.action(
	async ({ ctx: { user } }) => {
		if (hasPermissionByRank(user.role, 'administrator')) {
			const users = await userService.getAllByCustomerID(user.customerID)
			return users
		} else {
			const users = await userService.getAllByCustomerIDFromAccess(
				user.customerID,
				user.id,
			)
			return users
		}
	},
)

export const createMailSettingAction = adminAction
	.schema(createMailSetting)
	.action(async ({ parsedInput, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'organisation')
		const mailSetting = await customerService.createMailSetting({
			...parsedInput.mails,
			email: parsedInput.email,
			userID: parsedInput.userID,
			locationID: parsedInput.locationID,
			customerID: ctx.user.customerID,
		})
		if (!mailSetting) {
			throw new ActionError(t('mail-settings.errors.create-settings-success'))
		}

		const settingWithExtra = await customerService.getExtraMailInfo(mailSetting)
		revalidatePath(`/${ctx.lang}/administration/firma`)
		return settingWithExtra
	})

export const deleteMailSettingAction = adminAction
	.schema(z.object({ settingID: z.coerce.number() }))
	.action(async ({ parsedInput: { settingID }, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'organisation')
		const deleted = await customerService.deleteMailSetting(settingID)
		if (!deleted) {
			throw new ActionError(t('mail-settings.errors.delete-settings-failed'))
		}
		revalidatePath(`/${ctx.lang}/administration/firma`)
	})

export const updateMultipleMailSettings = adminAction
	.schema(updateMailSettingsValidation)
	.action(async ({ parsedInput, ctx }) => {
		let updatePromises = []

		for (const setting of parsedInput) {
			updatePromises.push(
				customerService.updateMailSetting(setting.id, setting),
			)
		}

		const responses = await Promise.all(updatePromises)
		const updatedIDs = responses.filter(Boolean).map(r => r?.id)
		const fullUpdate = updatedIDs.length == updatePromises.length
		revalidatePath(`/${ctx.lang}/administration/firma`)

		return {
			fullUpdate,
			ids: updatedIDs,
		}
	})

export const createEconomicIntegration = adminAction
	.schema(
		z.object({
			config: z.object({
				agreementGrantToken: z.string().min(43).max(43),
			}),
		}),
	)
	.action(async ({ parsedInput: { config }, ctx: { user, lang } }) => {
		const { t } = await serverTranslation(lang, 'organisation', {
			keyPrefix: 'integrations.actions',
		})
		const didCreateIntegration =
			await integrationsService.newCustomerIntegration('e-conomic', {
				customerID: user.customerID,
				config: config,
			})
		if (!didCreateIntegration) {
			throw new ActionError(t('did-not-update-settings'))
		}

		revalidatePath(`/${lang}/administration/firma`)
	})

export const deleteIntegration = adminAction
	.schema(z.object({ integrationID: z.coerce.number() }))
	.action(async ({ parsedInput: { integrationID }, ctx: { user, lang } }) => {
		const { t } = await serverTranslation(lang, 'organisation', {
			keyPrefix: 'integrations.actions',
		})
		const didDelete = await integrationsService.deleteCustomerIntegration(
			user.customerID,
			integrationID,
		)
		if (!didDelete) {
			throw new ActionError(t('did-not-delete-settings'))
		}
		revalidatePath(`/${lang}/administration/firma`)
	})

export const updateIntegrationSettings = adminAction
	.schema(z.object({ useSyncProducts: z.coerce.boolean() }))
	.action(async ({ parsedInput: { useSyncProducts }, ctx: { user, lang } }) => {
		const { t } = await serverTranslation(lang, 'organisation', {
			keyPrefix: 'integrations.actions',
		})
		const currentSettings = await integrationsService.getSettings(
			user.customerID,
		)
		if (
			currentSettings == undefined ||
			currentSettings.useSyncProducts == useSyncProducts
		) {
			throw new ActionError(t('cannot-update-settings'))
		}
		const currentProvider = await integrationsService.getIntegration(
			currentSettings.integrationID,
		)
		if (
			currentProvider == undefined ||
			currentProvider.customerID != currentSettings.customerID
		) {
			throw new ActionError(t('cannot-update-settings'))
		}

		const didUpdate = await integrationsService.updateSettings(
			user.customerID,
			{ useSyncProducts },
		)
		if (!didUpdate) {
			throw new ActionError(t('did-not-update-settings'))
		}

		const lambdaResult = await integrationsService.createLambda(
			currentSettings.customerID,
			currentProvider.provider,
			currentSettings.integrationID,
		)
		if (!lambdaResult.success) {
			console.error(lambdaResult)
			await integrationsService.updateSettings(user.customerID, {
				useSyncProducts: !useSyncProducts,
			})
			throw new ActionError(t('did-not-update-settings'))
		}

		revalidatePath(`/${lang}/administration/firma`)
	})

export const syncProductCatalogueAction = adminAction
	.schema(z.object({ integrationID: z.coerce.number() }))
	.action(
		async ({ parsedInput: { integrationID }, ctx: { customer, lang } }) => {
			const { t } = await serverTranslation(lang, 'organisation', {
				keyPrefix: 'integrations.actions',
			})

			const i = await integrationsService.getIntegration(integrationID)
			if (customer == null || i == undefined || i.customerID != customer.id) {
				console.log({ customer, i })
				throw new ActionError(t('cannot-sync-catalogue'))
			}

			const config = integrationsService.decryptConfig(i.provider, i.config)
			const provider = new syncProvidersImpl[i.provider](config)

			const res = await tryCatch(provider.handleFullSync(customer))
			if (!res.success || !res.data.success) {
				console.error(
					`Full sync of '${i.provider}' failed for '${customer.company}' with message: ${res.error ?? res.data.message}`,
				)

				throw new ActionError(t('did-not-sync-catalogue'))
			}
		},
	)
