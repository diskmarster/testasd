import { planZodSchema } from '@/data/customer.types'
import { z } from 'zod'

export const createCustomerValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    company: z
      .string()
      .min(2, {
        message: t('create-customer.name-minLength', { minLength: 2 }),
      })
      .max(50, {
        message: t('create-customer.name-maxLength', { maxLength: 50 }),
      }),
    email: z.string().email({ message: t('create-customer.email') }),
    plan: planZodSchema,
    extraUsers: z.coerce.number().min(0).default(0),
  })

// DO NOT USE FOR ANYTHING OTHER THAN CREATING TYPES
const CreateCustomerValidationSchema = createCustomerValidation(() => '')

export type CreateCustomerValidationType = z.infer<
  typeof CreateCustomerValidationSchema
>
