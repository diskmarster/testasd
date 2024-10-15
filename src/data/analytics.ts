import { db, TRX } from '@/lib/database'
import {
  ActionAnalytic,
  actionAnalyticsTable,
  NewActionAnalytic,
} from '@/lib/database/schema/analytics'
import { and, countDistinct, eq, gte, lte, sql, SQLWrapper } from 'drizzle-orm'
import { ActivePlatformUser, AnalyticsFilter } from './analytics.types'

export const analytics = {
  createActionAnalytic: async function(
    data: NewActionAnalytic,
    trx: TRX = db,
  ): Promise<ActionAnalytic | undefined> {
    const [res] = await trx
      .insert(actionAnalyticsTable)
      .values(data)
      .returning()

    return res
  },
  getDailyActiveUsers: async function(
    filter?: AnalyticsFilter,
    trx: TRX = db,
  ): Promise<ActivePlatformUser[]> {
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
    }

    return trx
      .select({
        users: countDistinct(actionAnalyticsTable.userID),
        date: sql<string>`date(${actionAnalyticsTable.inserted}, 'unixepoch') as date`,
      })
      .from(actionAnalyticsTable)
      .where(and(...whereClauses))
      .groupBy(sql`date`)
  },
}
