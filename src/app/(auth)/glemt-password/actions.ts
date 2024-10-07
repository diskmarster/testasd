'use server'

import { publicAction } from '@/lib/safe-action'
import { ACTION_ERR_INTERNAL, ACTION_ERR_UNAUTHORIZED, ActionError } from '@/lib/safe-action/error'
import { passwordResetService } from '@/service/password-reset'
import { forgotPasswordValidation, resetPasswordValidation } from './validation'
import { isBefore } from 'date-fns'

export const forgotPasswordAction = publicAction
	.schema(forgotPasswordValidation)
	.action(async ({ parsedInput: { email } }) => {
		const linkCreated = await passwordResetService.createAndSendLink(email)
		if (!linkCreated) {
			throw new ActionError(
				`${ACTION_ERR_INTERNAL}. Kunne ikke oprette nulstillings link`,
			)
		}
	})

export const resetPasswordAction = publicAction
	.schema(resetPasswordValidation)
	.action(async ({ parsedInput: { link, password } }) => {
		if (isBefore(link.expiresAt, Date.now())) {
			throw new ActionError(
				`${ACTION_ERR_UNAUTHORIZED}. Link er udløbet`,
			)
		}

		const pwResat = await passwordResetService.reset(link.id, link.userId, password)
		if (!pwResat) {
			throw new ActionError(
				`${ACTION_ERR_INTERNAL}. Kunne ikke nulstille kodeord`,
			)
		}
	})
