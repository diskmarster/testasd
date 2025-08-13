import { z } from 'zod'

export const signUpValidation = (t: (key: string, options?: any) => string) =>
	z
		.object({
			linkID: z.string(),
			clientID: z.coerce.number(),
			name: z
				.string()
				.min(2, { message: t('register.name-minLength', { minLength: 2 }) })
				.max(50, { message: t('register.name-maxLength', { maxLength: 50 }) }),
			email: z.string().email({ message: t('register.email') }),
			password: z.string().min(8, { message: t('register.password') }),
			confirmPassword: z.string().min(8, { message: t('register.password') }),
			pin: z.string().length(4, t('register.pin')),
		})
		.superRefine((val, ctx) => {
			if (!/^\d{4}$/.test(val.pin)) {
				ctx.addIssue({
					path: ['pin'],
					code: z.ZodIssueCode.custom,
					message: t('register.pin-must-be-number'),
				})
			}
		})
		.superRefine((val, ctx) => {
			if (val.password != val.confirmPassword) {
				ctx.addIssue({
					path: ['password'],
					code: z.ZodIssueCode.custom,
					message: t('register.confirm-password'),
				})
			}
		})
