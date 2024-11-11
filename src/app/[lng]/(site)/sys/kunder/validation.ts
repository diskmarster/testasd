import { planZodSchema } from '@/data/customer.types'
import { z } from 'zod'

export const createClientValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    company: z
      .string({
        message: t('create-validation.company-required'),
      })
      .min(3, {
        message: t('create-validation.company-min', { minLength: 3 }),
      })
      .max(50, {
        message: t('create-validation.company-max', { maxLength: 50 }),
      }),
    email: z
      .string({
        message: t('create-validation.email-required'),
      })
      .email({
        message: t('create-validation.email.invalid'),
      }),
    plan: planZodSchema,
    extraUsers: z.coerce.number().min(0).default(0),
  })

export const toggleClientStatusValidation = z.object({
  customerID: z.coerce.number(),
  isActive: z.coerce.boolean(),
})

export const deleteClientStatusValidation = z.object({
  customerID: z.coerce.number(),
})

export const updateClientValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    customerID: z.coerce.number(),
    company: z
      .string({
        message: t('create-validation.company-required'),
      })
      .min(3, {
        message: t('create-validation.company-min', { minLength: 3 }),
      })
      .max(50, {
        message: t('create-validation.company-max', { maxLength: 50 }),
      }),
    email: z
      .string({
        message: t('create-validation.email-required'),
      })
      .email({
        message: t('create-validation.email.invalid'),
      }),
    plan: planZodSchema,
    extraUsers: z.coerce.number().min(0).default(0),
  })
