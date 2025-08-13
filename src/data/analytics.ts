import { db, TRX } from '@/lib/database'
import {
	ActionAnalytic,
	actionAnalyticsTable,
	NewActionAnalytic,
} from '@/lib/database/schema/analytics'
import { and, countDistinct, eq, gte, lte, sql, SQLWrapper } from 'drizzle-orm'
import { ActivePlatformUser, AnalyticsFilter } from './analytics.types'

export const analytics = {
	createActionAnalytic: async function (
		data: NewActionAnalytic,
		trx: TRX = db,
	): Promise<ActionAnalytic | undefined> {
		const [res] = await trx
			.insert(actionAnalyticsTable)
			.values(data)
			.returning()

		return res
	},
	getActiveUsers: async function (
		filter?: Pick<AnalyticsFilter, 'date' | 'platform'>,
		groupBy: 'date' | 'week' | 'month' | 'year' = 'date',
		trx: TRX = db,
	): Promise<ActivePlatformUser[]> {
		const whereClauses: SQLWrapper[] = []

		let dateFormat: string

		switch (groupBy) {
			case 'date':
				dateFormat = '%F'
				break
			case 'month':
				dateFormat = '%m'
				break
			case 'week':
				dateFormat = '%W'
				break
			case 'year':
				dateFormat = '%Y'
				break

			default:
				return []
		}

		if (filter) {
			if (filter.date instanceof Date) {
				whereClauses.push(gte(actionAnalyticsTable.inserted, filter.date))
			} else if (filter.date) {
				whereClauses.push(gte(actionAnalyticsTable.inserted, filter.date.from))
				whereClauses.push(lte(actionAnalyticsTable.inserted, filter.date.to))
			}

			if (filter.platform) {
				whereClauses.push(eq(actionAnalyticsTable.platform, filter.platform))
			}
		}

		return trx
			.select({
				users: countDistinct(actionAnalyticsTable.userID),
				date: sql<string>`strftime(${dateFormat}, ${actionAnalyticsTable.inserted}, 'unixepoch') as date`,
			})
			.from(actionAnalyticsTable)
			.where(and(...whereClauses))
			.groupBy(sql`date`)
	},
	getFilteredAnalytics: async function (
		filter?: AnalyticsFilter,
		trx: TRX = db,
	): Promise<ActionAnalytic[]> {
		const whereClauses: SQLWrapper[] = []

		if (filter) {
			if (filter.date instanceof Date) {
				whereClauses.push(gte(actionAnalyticsTable.inserted, filter.date))
			} else if (filter.date) {
				whereClauses.push(gte(actionAnalyticsTable.inserted, filter.date.from))
				whereClauses.push(lte(actionAnalyticsTable.inserted, filter.date.to))
			}

			if (filter.platform) {
				whereClauses.push(eq(actionAnalyticsTable.platform, filter.platform))
			}

			if (filter.customerID) {
				whereClauses.push(
					eq(actionAnalyticsTable.customerID, filter.customerID),
				)
			}

			if (filter.actionName) {
				whereClauses.push(
					eq(actionAnalyticsTable.actionName, filter.actionName),
				)
			}

			if (filter.executionTime) {
				if (filter.executionTime.max != undefined) {
					whereClauses.push(
						lte(actionAnalyticsTable.executionTimeMS, filter.executionTime.max),
					)
				}
				if (filter.executionTime.min != undefined) {
					whereClauses.push(
						gte(actionAnalyticsTable.executionTimeMS, filter.executionTime.min),
					)
				}
			}
		}

		return trx
			.select()
			.from(actionAnalyticsTable)
			.where(and(...whereClauses))
	},
}
