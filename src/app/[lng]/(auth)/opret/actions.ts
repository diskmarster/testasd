'use server'

import { createCustomerValidation } from '@/app/[lng]/(auth)/opret/validation'
import { serverTranslation } from '@/app/i18n'
import { EmailWelcomeCustomer } from '@/components/email/email-welcome-customer'
import { getSchema, publicAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { generateIdFromEntropySize } from 'lucia'
import { cookies } from 'next/headers'

export const createCustomerAction = publicAction
	.metadata({ actionName: 'createCustomer' })
	.schema(async () => await getSchema(createCustomerValidation, 'validation'))
	.action(async ({ parsedInput, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')
		const existingCustomer = await customerService.getByEmail(parsedInput.email)
		if (existingCustomer) {
			throw new ActionError(t('create-action.customer-email-exists'))
		}

		const existingUser = await userService.getByEmail(parsedInput.email)
		if (existingUser) {
			throw new ActionError(t('create-action.user-email-exists'))
		}

		const retailerId = cookies().get('retailer')?.value
		const newCustomer = await customerService.create({
			...parsedInput,
			retailerId,
		})
		if (!newCustomer) {
			throw new ActionError(t('create-action.customer-not-created'))
		}

		const newLocationID = generateIdFromEntropySize(8)
		const newLocation = await locationService.create({
			id: newLocationID,
			customerID: newCustomer.id,
			name: 'Hovedlokation',
		})
		if (!newLocation) {
			throw new ActionError(t('create-action.location-not-created'))
		}

		const activationLink = await customerService.createActivationLink({
			customerID: newCustomer.id,
			email: newCustomer.email,
			locationID: newLocation.id,
			role: 'administrator',
		})
		if (!activationLink) {
			throw new ActionError(t('create-action.activation-mail-not-sent'))
		}

		await emailService.sendRecursively(
			[parsedInput.email],
			'Velkommen til Nem Lager',
			EmailWelcomeCustomer({
				company: newCustomer.company,
				link: activationLink,
			}),
		)
	})
