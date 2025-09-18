import { userRoleZodSchema } from '@/data/user.types'
import { z } from 'zod'

export const deleteUserByIDValidation = z.object({ userID: z.coerce.number() })

export const inviteNewUserValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		email: z.string().email({ message: t('organisation.email-valid') }),
		role: userRoleZodSchema,
		locationIDs: z
			.array(z.string())
			.min(1, { message: t('organisation.minimum-location') }),
		webAccess: z.coerce.boolean(),
		appAccess: z.coerce.boolean(),
		priceAccess: z.coerce.boolean(),
	})

export const changeUserStatusValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		userIDs: z.array(z.coerce.number()).min(1, {
			message: t('organisation.couldnt-find-customer-information'),
		}),
		status: z.enum(['active', 'inactive']),
	})

export const createNewLocationValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		name: z
			.string()
			.min(3, {
				message: t('organisation.location-name-minLength', { minLength: 3 }),
			})
			.max(50, {
				message: t('organisation.location-name-maxLength', { maxLength: 50 }),
			}),
		customerID: z.coerce.number(),
		userIDs: z
			.array(z.coerce.number())
			.min(1, { message: t('organisation.minimum-location') }),
		pathname: z.string().min(1),
	})

export const editLocationValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		locationID: z.string().min(1, {
			message: t('organisation.couldnt-find-location-information'),
		}),
		name: z
			.string()
			.min(3, {
				message: t('organisation.location-name-minLength', { minLength: 3 }),
			})
			.max(50, {
				message: t('organisation.location-name-maxLength', { maxLength: 50 }),
			}),
		customerID: z.coerce.number(),
		userIDs: z
			.array(z.coerce.number())
			.min(1, { message: t('organisation.minimum-user') }),
	})

export const changeLocationStatusValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		locationIDs: z
			.array(z.string())
			.min(1, { message: t('organisation.minimum-location') }),
		status: z.enum(['active', 'inactive']),
	})

export const updateCustomerValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		company: z
			.string()
			.min(2, {
				message: t('organisation.company-name-minLength', { minLength: 2 }),
			})
			.max(50, {
				message: t('organisation.company-name-maxLength', { maxLength: 50 }),
			}),
		email: z.string().email({ message: t('organisation.email-valid') }),
	})

export const updateCustomerSettingsValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		id: z.coerce.number({
			message: t('organisation.required', { fieldName: 'customerSettingsID' }),
		}),
		customerID: z.coerce.number({
			message: t('organisation.required', { fieldName: 'customerID' }),
		}),
		settings: z.object({
			useReference: z.object(
				{
					tilgang: z.coerce.boolean(),
					afgang: z.coerce.boolean(),
					regulering: z.coerce.boolean(),
					flyt: z.coerce.boolean(),
				},
				{ message: t('organisation.required', { fieldName: 'useReference' }) },
			),
			usePlacement: z.coerce.boolean({
				message: t('organisation.required', { fieldName: 'usePlacement' }),
			}),
			authTimeoutMinutes: z.coerce.number({
				message: t('organisation.required', {
					fieldName: 'authTimeoutMinutes',
				}),
			}),
		}),
	})

export const resetUserPasswordValidation = z.object({
	userID: z.coerce.number(),
	email: z.string().email(),
})

export const editUserValidation = (t: (key: string, options?: any) => string) =>
	z.object({
		userID: z.coerce.number(),
		data: z.object({
			name: z.string().min(2, {
				message: t('modal-edit-user.validation.name', { count: 2 }),
			}),
			email: z
				.string()
				.email({ message: t('modal-edit-user.validation.email') }),
			role: userRoleZodSchema,
			locationIDs: z.array(z.string()).min(1, {
				message: t('modal-edit-user.validation.locationIDs', { count: 1 }),
			}),
			webAccess: z.coerce.boolean(),
			appAccess: z.coerce.boolean(),
			priceAccess: z.coerce.boolean(),
		}),
	})

export const getLocationsByUserIDValidation = z.object({
	userID: z.coerce.number(),
	customerID: z.coerce.number(),
})
