import { userRoleZodSchema } from '@/data/user.types'
import { z } from 'zod'

export const updateProfileValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		name: z
			.string({ message: t('updateProfile.name.required') })
			.min(2, {
				message: t('updateProfile.name.minLength', { minLength: 2 }),
			})
			.max(50, {
				message: t('updateProfile.name.maxLength', { maxLength: 50 }),
			}),
		email: z
			.string({ message: t('updateProfile.email.required') })
			.email({ message: t('updateProfile.email.email') }),
	})

export const adminUpdateProfileValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		userId: z.string(),
		name: z
			.string({ message: t('updateProfile.name.required') })
			.min(2, {
				message: t('updateProfile.name.minLength', { minLength: 2 }),
			})
			.max(50, {
				message: t('updateProfile.name.maxLength', { maxLength: 50 }),
			}),
		email: z.string().email({ message: 'Email skal være gyldig' }),
		role: userRoleZodSchema,
	})

export const deleteProfileValidation = z.object({
	userId: z.coerce.number(),
})

export const updatePasswordValidation = (
	t: (key: string, options?: any) => string,
) =>
	z
		.object({
			currentPassword: z.string(),
			newPassword: z
				.string()
				.regex(
					/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/,
					{
						message: t('updateProfile.new-password.required'),
					},
				),
			confirmPassword: z.string(),
		})
		.superRefine(({ newPassword, confirmPassword }, ctx) => {
			if (newPassword !== confirmPassword) {
				ctx.addIssue({
					code: 'custom',
					message: t('updateProfile.new-password.equal'),
					path: ['confirmPassword'],
				})
			}
		})
		.superRefine(({ newPassword, currentPassword }, ctx) => {
			if (newPassword == currentPassword) {
				ctx.addIssue({
					code: 'custom',
					message: t('updateProfile.new-password.same'),
					path: ['confirmPassword'],
				})
			}
		})

export const updatePinValidation = (
	t: (key: string, options?: any) => string,
) =>
	z
		.object({
			currentPin: z.string(),
			newPin: z.string().regex(/^\d{4}$/, {
				message: t('updateProfile.new-pin.required', { pinLength: 4 }),
			}),
			confirmPin: z.string(),
		})
		.superRefine(({ newPin, confirmPin }, ctx) => {
			if (newPin !== confirmPin) {
				ctx.addIssue({
					code: 'custom',
					message: t('updateProfile.new-pin.equal'),
					path: ['confirmPin'],
				})
			}
		})
		.superRefine(({ newPin, currentPin }, ctx) => {
			if (newPin == currentPin) {
				ctx.addIssue({
					code: 'custom',
					message: t('updateProfile.new-pin.same'),
					path: ['confirmPin'],
				})
			}
		})

export const updatePrimaryLocationValidation = z.object({
	locationID: z.string(),
})
