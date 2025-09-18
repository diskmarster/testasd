'use server'

import { signUpValidation } from '@/app/[lng]/(auth)/registrer/[linkID]/validation'
import { serverTranslation } from '@/app/i18n'
import { getSchema, publicAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { isUserLimitReached } from '@/service/customer.utils'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

export const signUpAction = publicAction
	.metadata({ actionName: 'signUp' })
	.schema(async () => await getSchema(signUpValidation, 'validation'))
	.action(async ({ parsedInput, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'action-errors')
		const activationLink = await customerService.getActivationLinkByID(
			parsedInput.linkID,
		)
		if (!activationLink) {
			throw new ActionError(t('register-action.link-no-longer-exists'))
		}

		const isLinkValid = customerService.validateActivationLink(
			activationLink.inserted,
		)
		if (!isLinkValid) {
			throw new ActionError(t('register-action.expired-link'))
		}

		const users = await userService.getAllByCustomerID(parsedInput.clientID)
		const existingCustomer = await customerService.getByID(parsedInput.clientID)
		if (!existingCustomer) {
			throw new ActionError(t('register-action.company-account-doesnt-exist'))
		}

		if (
			isUserLimitReached(
				existingCustomer.plan,
				existingCustomer.extraUsers,
				users.length,
			)
		) {
			throw new ActionError(t('register-action.company-user-limit-reached'))
		}

		const existingUser = await userService.getByEmail(parsedInput.email)
		if (existingUser) {
			throw new ActionError(t('register-action.existing-user-mail'))
		}

		const newUser = await userService.register({
			customerID: parsedInput.clientID,
			name: parsedInput.name,
			email: parsedInput.email,
			hash: parsedInput.password,
			pin: parsedInput.pin,
			role: activationLink.role,
			isActive: true,
		})
		if (!newUser) {
			throw new ActionError(t('register-action.user-not-created'))
		}

		if (!existingCustomer.isActive) {
			const isCustomerToggled = await customerService.toggleActivationByID(
				existingCustomer.id,
			)
			if (!isCustomerToggled) {
				throw new ActionError(
					t('register-action.company-account-not-activated'),
				)
			}
		}

		const isAccessAdded = await locationService.addAccess({
			userID: newUser.id,
			locationID: activationLink.locationID,
			customerID: existingCustomer.id,
			isPrimary: true,
		})
		if (!isAccessAdded) {
			throw new ActionError(t('register-action.user-no-location-access'))
		}

		const isLinkDeleted = await customerService.deleteActivationLink(
			parsedInput.linkID,
		)
		if (!isLinkDeleted) {
			// NOTE: What to do?
		}

		locationService.setCookie(activationLink.locationID)
		await sessionService.create(newUser.id)

		redirect(`/${ctx.lang}/oversigt`)
	})
