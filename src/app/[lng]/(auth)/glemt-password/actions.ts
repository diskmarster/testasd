'use server'

import { serverTranslation } from '@/app/i18n'
import { getSchema, publicAction } from '@/lib/safe-action'
import {
	ACTION_ERR_INTERNAL,
	ACTION_ERR_UNAUTHORIZED,
	ActionError,
} from '@/lib/safe-action/error'
import { passwordResetService } from '@/service/password-reset'
import { isBefore } from 'date-fns'
import {
	forgotPasswordValidation,
	resetPasswordValidation,
	resetPinValidation,
} from './validation'

export const forgotPasswordAction = publicAction
	.metadata({ actionName: 'forgotPassword' })
	.schema(forgotPasswordValidation)
	.action(async ({ parsedInput: { email }, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')
		const linkCreated = await passwordResetService.createAndSendLink(email)
		if (!linkCreated) {
			throw new ActionError(
				`${ACTION_ERR_INTERNAL}. ${t('forgot-password-action.error')}`,
			)
		}
	})

export const resetPasswordAction = publicAction
	.metadata({ actionName: 'resetPassword' })
	.schema(async () => await getSchema(resetPasswordValidation, 'validation'))
	.action(async ({ parsedInput: { link, password }, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')
		if (isBefore(link.expiresAt, Date.now())) {
			throw new ActionError(
				`${ACTION_ERR_UNAUTHORIZED}. ${t('forgot-password-action.expired')}`,
			)
		}

		const pwResat = await passwordResetService.reset(
			link.id,
			link.userId,
			password,
			ctx.lang,
		)
		if (!pwResat) {
			throw new ActionError(
				`${ACTION_ERR_INTERNAL}. ${t('forgot-password-action.pw-reset')}`,
			)
		}
	})

export const resetPinAction = publicAction
	.metadata({ actionName: 'resetPin' })
	.schema(async () => getSchema(resetPinValidation, 'validation'))
	.action(async ({ parsedInput: { link, password }, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')
		if (isBefore(link.expiresAt, Date.now())) {
			throw new ActionError(
				`${ACTION_ERR_UNAUTHORIZED}. ${t('forgot-password-action.expired')}`,
			)
		}

		const pwResat = await passwordResetService.reset(
			link.id,
			link.userId,
			password,
			ctx.lang,
		)
		if (!pwResat) {
			throw new ActionError(
				`${ACTION_ERR_INTERNAL}. ${t('forgot-password-action.pw-reset')}`,
			)
		}
	})
