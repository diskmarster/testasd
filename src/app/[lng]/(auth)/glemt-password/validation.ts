import { z } from 'zod'

export const forgotPasswordValidation = z.object({
  email: z.string().email(),
})

export const resetPasswordValidation = (
  t: (key: string, options?: any) => string,
) =>
  z
    .object({
      link: z.object({
        id: z.string(),
        userId: z.number(),
        expiresAt: z.number(),
      }),
      password: z.string().min(8, { message: t('reset-password.password') }),
      confirmPassword: z
        .string()
        .min(8, { message: t('reset-password.password') }),
    })
    .superRefine((val, ctx) => {
      if (val.password != val.confirmPassword) {
        ctx.addIssue({
          path: ['password'],
          code: z.ZodIssueCode.custom,
          message: t('reset-password.confirm-password'),
        })
      }
    })

export const resetPinValidation = (t: (key: string, options?: any) => string) =>
	z
		.object({
			link: z.object({
				id: z.string(),
				userId: z.number(),
				expiresAt: z.number(),
			}),
			password: z
				.string()
				.length(4, { message: t('reset-pin.pin', { length: 4 }) })
				.regex(/^\d{4}$/, {
					message: t('reset-pin.pin', { length: 4 }),
				}),
			confirmPassword: z
				.string()
				.length(4, { message: t('reset-pin.pin', { length: 4 }) })
				.regex(/^\d{4}$/, {
					message: t('reset-pin.pin', { length: 4 }),
				}),
		})
		.superRefine((val, ctx) => {
			if (val.password != val.confirmPassword) {
				ctx.addIssue({
					path: ['password'],
					code: z.ZodIssueCode.custom,
					message: t('reset-pin.confirm-pin'),
				})
			}
		})
