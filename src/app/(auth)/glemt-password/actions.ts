'use server'

import { publicAction } from '@/lib/safe-action'
import { ACTION_ERR_INTERNAL, ActionError } from '@/lib/safe-action/error'
import { passwordResetService } from '@/service/password-reset'
import { forgotPasswordValidation } from './validation'

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
