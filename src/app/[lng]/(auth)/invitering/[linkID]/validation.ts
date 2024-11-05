import { z } from 'zod'

export const signUpInvitedValidation = (
  t: (key: string, options?: any) => string,
) =>
  z
    .object({
      linkID: z.string(),
      clientID: z.coerce.number(),
      name: z
        .string()
        .min(2, {
          message: t('sign-up-invited.name-minLength', { minLength: 2 }),
        })
        .max(50, {
          message: t('sign-up-invited.name-maxLength', { maxLength: 50 }),
        }),
      email: z.string().email({ message: t('sign-up-invited.email') }),
      password: z.string().min(8, { message: t('sign-up-invited.password') }),
      confirmPassword: z
        .string()
        .min(8, { message: t('sign-up-invited.password') }),
      pin: z.string().length(4, t('sign-up-invited.pin')),
    })
    .superRefine((val, ctx) => {
      if (!/^\d{4}$/.test(val.pin)) {
        ctx.addIssue({
          path: ['pin'],
          code: z.ZodIssueCode.custom,
          message: t('sign-up-invited.pin-must-be-number'),
        })
      }
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
      if (password != confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          message: t('sign-up-invited.confirm-password'),
          path: ['confirmPassword'],
        })
      }
    })
