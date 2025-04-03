import { z } from 'zod'

export const mailTypes = z.object({
  sendStockMail: z.coerce.boolean(),
})

export const createMailSetting = z
  .object({
    locationID: z.string(),
    email: z.string().email().nullable(),
    userID: z.coerce.number().nullable(),
    mails: mailTypes,
  })
  .superRefine((val, ctx) => {
    if (val.email && val.userID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'bruger ikke denne. har den bare for at formen ikke er valid',
      })
    } else if (!val.email && !val.userID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'bruger ikke denne. har den bare for at formen ikke er valid',
      })
    }
  })

export const updateMailSettingsValidation = z.array(
  z.object({
    id: z.coerce.number(),
    sendStockMail: z.coerce.boolean().nullish().optional(),
  }),
)
