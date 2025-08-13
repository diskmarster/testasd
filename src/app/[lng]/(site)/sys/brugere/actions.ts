'use server'

import { serverTranslation } from '@/app/i18n'
import { EmailInviteUser } from '@/components/email/email-invite-user'
import { EmailCreatedUser } from '@/components/email/email-user-created'
import { siteConfig } from '@/config/site'
import { sysAdminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { isUserLimitReached } from '@/service/customer.utils'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
	deleteInviteLinkValidation,
	deleteUserByIDValidation,
	inviteOrCreateUserValidation,
	refreshInviteLinkValidation,
} from './validation'

export const deleteUserAction = sysAdminAction
	.metadata({ actionName: 'deleteUserAction', excludeAnalytics: true })
	.schema(deleteUserByIDValidation)
	.action(async ({ parsedInput: { userID }, ctx: { user, lang } }) => {
		if (user.id == userID) {
			throw new ActionError('Du kan ikke slette din egen bruger')
		}

		const deleted = await userService.deleteByID(userID)
		if (!deleted) {
			throw new ActionError('Brugeren blev ikke slettet')
		}

		revalidatePath(`/${lang}/sys/brugere`)
	})

export const deleteInviteLinkAction = sysAdminAction
	.metadata({ actionName: 'deleteInviteLinkAction', excludeAnalytics: true })
	.schema(deleteInviteLinkValidation)
	.action(async ({ parsedInput: { linkID }, ctx: { lang } }) => {
		const deleted = await userService.deleteUserLink(linkID)
		if (!deleted) {
			throw new ActionError('Link blev ikke slettet')
		}
		revalidatePath(`/${lang}/sys/brugere`)
	})

export const refreshInviteLinkAction = sysAdminAction
	.schema(refreshInviteLinkValidation)
	.action(async ({ parsedInput: { linkID }, ctx: { lang } }) => {
		const link = await userService.getInviteLinkByID(linkID)
		link!.inserted = new Date()
		const refreshedLink = await userService.createUserLink(link!)
		revalidatePath(`/${lang}/sys/brugere`)
	})

export const fetchCustomersAction = sysAdminAction.action(async () => {
	return await customerService.getAll()
})

export const resendInviteLinkAction = sysAdminAction
	.schema(z.object({ linkID: z.string() }))
	.action(async ({ parsedInput: { linkID }, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'sys-bruger')

		const link = await userService.getInviteLinkByID(linkID)

		if (!link) {
			throw new ActionError('Kunne ikke finde link informationer')
		}

		const users = await userService.getAllByCustomerID(link.customerID)
		const customer = await customerService.getByID(link.customerID)
		if (!customer) {
			throw new ActionError(t('invite-create-action.client-not-found'))
		}

		if (isUserLimitReached(customer.plan, customer.extraUsers, users.length)) {
			throw new ActionError(t('invite-create-action.client-user-limit'))
		}

		const userInviteLink = await userService.createUserLink({
			email: link.email,
			role: link.role,
			customerID: link.customerID,
			locationIDs: link.locationIDs,
			webAccess: link.webAccess,
			appAccess: link.appAccess,
			priceAccess: link.priceAccess,
		})
		if (!userInviteLink) {
			throw new ActionError(t('invite-create-action.link-not-created'))
		}

		const subject = t('invite-create-action.email-subject', {
			app: siteConfig.name,
			customer: customer.company,
		})

		await emailService.sendRecursively(
			[link.email],
			subject,
			EmailInviteUser({ company: customer.company, link: userInviteLink }),
		)

		revalidatePath(`/${ctx.lang}/sys/brugere`)
	})

export const inviteOrCreateAction = sysAdminAction
	.schema(inviteOrCreateUserValidation)
	.action(async ({ parsedInput, ctx }) => {
		const { t } = await serverTranslation(ctx.lang, 'sys-bruger')

		const {
			customerID,
			locationsID,
			email,
			role,
			name,
			password,
			pin,
			webAccess,
			appAccess,
			priceAccess,
			mail,
		} = parsedInput

		const existingUser = await userService.getByEmail(parsedInput.email)
		if (existingUser) {
			throw new ActionError(t('invite-create-action.email-already-exists'))
		}

		const users = await userService.getAllByCustomerID(customerID)
		const customer = await customerService.getByID(customerID)
		if (!customer) {
			throw new ActionError(t('invite-create-action.client-not-found'))
		}

		if (isUserLimitReached(customer.plan, customer.extraUsers, users.length)) {
			throw new ActionError(t('invite-create-action.client-user-limit'))
		}

		if (parsedInput.isInvite) {
			const userInviteLink = await userService.createUserLink({
				email: email,
				role: role,
				customerID: customerID,
				locationIDs: locationsID,
				webAccess: webAccess,
				appAccess: appAccess,
				priceAccess: priceAccess,
			})
			if (!userInviteLink) {
				throw new ActionError(t('invite-create-action.link-not-created'))
			}

			const subject = t('invite-create-action.email-subject', {
				app: siteConfig.name,
				customer: customer.company,
			})

			await emailService.sendRecursively(
				[parsedInput.email],
				subject,
				EmailInviteUser({ company: customer.company, link: userInviteLink }),
			)
		} else {
			const newUser = await userService.register({
				customerID: customerID,
				name: name!,
				email: email,
				role: role,
				webAccess: webAccess,
				appAccess: appAccess,
				priceAccess: priceAccess,
				pin: pin!,
				hash: password!,
				isActive: true,
			})
			if (!newUser) {
				throw new ActionError(t('invite-create-action.user-not-created'))
			}

			for (let i = 0; i < locationsID.length; i++) {
				await locationService.addAccess({
					locationID: locationsID[i],
					userID: newUser.id,
					isPrimary: i == 0,
					customerID: customerID,
				})
			}

			if (mail) {
				const subject = t('invite-create-action.email-subject', {
					app: siteConfig.name,
					customer: customer.company,
				})

				await emailService.sendRecursively(
					[parsedInput.email],
					subject,
					EmailCreatedUser({
						company: customer.company,
						password: password!,
						pin: pin!,
					}),
				)
			}
		}

		revalidatePath(`/${ctx.lang}/sys/brugere`)
	})
