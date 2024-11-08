import { Customer } from '@/lib/database/schema/customer'
import { z } from 'zod'

export const planZodSchema = z.enum(['lite', 'basis', 'pro'])
export type Plan = z.infer<typeof planZodSchema>
export const plans = planZodSchema.options as readonly Plan[]

export type CustomerWithUserCount = Customer & { userCount: number }
