'use server'

import { sysAdminAction } from '@/lib/safe-action'
import { getActiveUsersAnalyticsValidation } from './validation'
import { analyticsService } from '@/service/analytics'

export const getActiveUsersAnalyticsAction = sysAdminAction
	.schema(getActiveUsersAnalyticsValidation)
	.action(async ({ parsedInput }) => {
		const data = await analyticsService.getActiveUsers(parsedInput.start, parsedInput.end, parsedInput.groupBy)

		return data
	})
