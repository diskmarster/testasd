import { analytics } from '@/data/analytics'
import {
  ActiveUser,
  AnalyticsCategory,
  AnalyticsFilter,
  AnalyticsPlatform,
} from '@/data/analytics.types'
import {
  ActionAnalytic,
  NewActionAnalytic,
} from '@/lib/database/schema/analytics'
import { CustomerID } from '@/lib/database/schema/customer'
import * as dateFns from 'date-fns'

export type Duration = {
  seconds?: number
  minutes?: number
  hours?: number
  days?: number
  months?: number
  weeks?: number
  years?: number
}

export const analyticsService = {
  createAnalytic: async function(
    type: AnalyticsCategory,
    data: NewActionAnalytic,
  ): Promise<ActionAnalytic | undefined> {
    if (type == 'action') {
      return analytics.createActionAnalytic(data)
    } else {
      console.error(`tried to create analytic of unknown type '${type}'`)
    }
  },
  /**
   * @param start - Indicates the date from where the data will start default value is 6 days from current time
   * @param end - Indicates the date where the data will end. If not specified, current time is used
   */
  getActiveUsers: async function(
    start: Duration = { days: 6 },
    end?: Duration,
    groupBy: 'date' | 'week' | 'month' | 'year' = 'date',
  ): Promise<ActiveUser[]> {
    let dateFilter: {
      from: Date
      to: Date
    }
    const now = Date.now()
    const todayStart = dateFns.startOfDay(now)
    const todayEnd = dateFns.endOfDay(now)

    dateFilter = {
      from: dateFns.sub(todayStart, start),
      to: todayEnd,
    }

    if (end) {
      dateFilter.to = dateFns.add(todayEnd, end)
    }

    const desktopUsers = await analytics.getActiveUsers(
      {
        date: dateFilter,
        platform: 'web',
      },
      groupBy,
    )
    const appUsers = await analytics.getActiveUsers(
      {
        date: dateFilter,
        platform: 'app',
      },
      groupBy,
    )

    const duration = stringToDuration(groupBy)
    const dateFormat = stringToDateFormat(groupBy)

    const activeUsers: ActiveUser[] = []
    for (
      let date = dateFilter.from;
      !dateFns.isAfter(date, dateFilter.to);
      date = dateFns.add(date, duration)
    ) {
      const formattedDate = dateFns.format(date, dateFormat)

      activeUsers.push({
        label: formattedDate,
        desktopUsers: desktopUsers
          .filter(d => d.date == formattedDate)
          .reduce<number>((agg, cur) => agg + cur.users, 0),
        appUsers: appUsers
          .filter(d => d.date == formattedDate)
          .reduce<number>((agg, cur) => agg + cur.users, 0),
      })
    }

    return activeUsers
  },
  getFilteredAnalytics: async function(
    {
      start,
      end,
      platform,
      customerID,
      actionName,
      executionMin,
      executionMax,
    }: {
      start: Duration
      end?: Duration
      platform?: AnalyticsPlatform
      customerID?: CustomerID
      actionName?: string
      executionMin?: number
      executionMax?: number
    } = {
        start: { days: 6 },
      },
  ): Promise<ActionAnalytic[]> {
    const now = Date.now()
    const todayStart = dateFns.startOfDay(now)
    const todayEnd = dateFns.endOfDay(now)
    const analyticsFilter: AnalyticsFilter = {
      date:
        end == undefined
          ? dateFns.sub(todayStart, start)
          : {
            from: dateFns.sub(todayStart, start),
            to: dateFns.add(todayEnd, end),
          },
      platform,
      customerID,
      actionName,
      executionTime:
        executionMin != undefined || executionMax != undefined
          ? {
            min: executionMin,
            max: executionMax,
          }
          : undefined,
    }

    return await analytics.getFilteredAnalytics(analyticsFilter)
  },
}

function stringToDateFormat(
  val: 'date' | 'week' | 'month' | 'year' = 'date',
): string {
  switch (val) {
    case 'week':
      return 'II'
    case 'month':
      return 'MM'
    case 'year':
      return 'yyyy'

    default:
      return 'yyyy-MM-dd'
  }
}

function stringToDuration(
  val: 'date' | 'week' | 'month' | 'year' = 'date',
): Duration {
  switch (val) {
    case 'week':
      return { weeks: 1 }
    case 'month':
      return { months: 1 }
    case 'year':
      return { years: 1 }

    default:
      return { days: 1 }
  }
}
