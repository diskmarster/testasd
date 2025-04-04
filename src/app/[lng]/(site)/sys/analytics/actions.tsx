'use server'

import { sysAdminAction } from '@/lib/safe-action'
import { analyticsService } from '@/service/analytics'
import {
	getActiveUsersAnalyticsValidation,
	getFilteredAnalyticsValidation,
} from './validation'

export const getActiveUsersAnalyticsAction = sysAdminAction
	.schema(getActiveUsersAnalyticsValidation)
	.action(async ({ parsedInput }) => {
		const data = await analyticsService.getActiveUsers(
			parsedInput.start,
			parsedInput.end,
			parsedInput.groupBy,
		)

		return data
	})

export const getFilteredAnalyticsAction = sysAdminAction
	.schema(getFilteredAnalyticsValidation)
	.action(async ({ parsedInput }) => {
		return await analyticsService.getFilteredAnalytics(parsedInput)
	})
