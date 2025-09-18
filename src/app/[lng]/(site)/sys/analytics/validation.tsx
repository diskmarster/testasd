import { z } from 'zod'

const durationSchema = z.object({
	seconds: z.coerce.number().optional(),
	minutes: z.coerce.number().optional(),
	hours: z.coerce.number().optional(),
	days: z.coerce.number().optional(),
	months: z.coerce.number().optional(),
	weeks: z.coerce.number().optional(),
	years: z.coerce.number().optional(),
})

export const getActiveUsersAnalyticsValidation = z.object({
	start: durationSchema.optional(),
	end: durationSchema.optional(),
	groupBy: z.enum(['date', 'week', 'month', 'year']).optional(),
})

export const getFilteredAnalyticsValidation = z.object({
	start: durationSchema,
	end: durationSchema.optional(),
	platform: z.enum(['web', 'app']).optional(),
	customerID: z.coerce.number().optional(),
	actionName: z.string().optional(),
	executionMin: z.coerce.number().optional(),
	executionMax: z.coerce.number().optional(),
})

export type AnalyticsFilterDTO = z.infer<typeof getFilteredAnalyticsValidation>
