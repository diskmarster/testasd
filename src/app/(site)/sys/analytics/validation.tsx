import { z } from 'zod'

export const getActiveUsersAnalyticsValidation = z.object({
	start: z
		.object({
			seconds: z.coerce.number().optional(),
			minutes: z.coerce.number().optional(),
			hours: z.coerce.number().optional(),
			days: z.coerce.number().optional(),
			months: z.coerce.number().optional(),
			weeks: z.coerce.number().optional(),
			years: z.coerce.number().optional(),
		})
		.optional(),
	end: z
		.object({
			seconds: z.coerce.number().optional(),
			minutes: z.coerce.number().optional(),
			hours: z.coerce.number().optional(),
			days: z.coerce.number().optional(),
			months: z.coerce.number().optional(),
			weeks: z.coerce.number().optional(),
			years: z.coerce.number().optional(),
		})
		.optional(),
	groupBy: z.enum(['date', 'week', 'month', 'year']).optional(),
})
