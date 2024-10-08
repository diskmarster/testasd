import { z } from 'zod'

export const forgotPasswordValidation = z.object({
	email: z.string().email(),
})

export const resetPasswordValidation = z
	.object({
		link: z.object({
			id: z.string(),
			userId: z.number(),
			expiresAt: z.number(),
		}),
		password: z
			.string()
			.min(8, { message: 'Kodeord skal minimum være 8 karakterer' }),
		confirmPassword: z
			.string()
			.min(8, { message: 'Kodeord skal minimum være 8 karakterer' }),
	})
	.superRefine((val, ctx) => {
		if (val.password != val.confirmPassword) {
			ctx.addIssue({
				path: ['password'],
				code: z.ZodIssueCode.custom,
				message: 'Kodeord er ikke ens.',
			})
		}
	})
