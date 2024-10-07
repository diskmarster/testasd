'use server'

import { publicAction } from '@/lib/safe-action'
import { passwordResetService } from '@/service/password-reset'
import { forgotPasswordValidation } from './validation'

export const forgotPasswordAction = publicAction
	.schema(forgotPasswordValidation)
	.action(async ({ parsedInput: { email } }) => {
		await passwordResetService.createAndSendLink(email)
	})
