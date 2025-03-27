import { z } from 'zod'

export const createMailSetting = z
  .object({
    locationID: z.string(),
    email: z.string().email().nullable(),
    userID: z.coerce.number().nullable(),
    mails: z
      .object({
        sendStockMail: z.coerce.boolean(),
      })
      .superRefine((val, ctx) => {
        let hasSelectedEmail = false
        for (const key of Object.keys(val)) {
          if (val[key as keyof typeof val]) {
            hasSelectedEmail = true
            break
          }
        }

        if (!hasSelectedEmail) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Mindst én mail skal vælges',
            fatal: true,
          })
        }

        return z.NEVER
      }),
  })
  .superRefine((val, ctx) => {
    if (val.email && val.userID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Både e-mail og user ID kan ikke udfyldes',
      })
    } else if (!val.email && !val.userID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enten e-mail eller user ID skal udfyldes',
      })
    }
  })
