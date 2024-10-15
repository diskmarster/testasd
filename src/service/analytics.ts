import { analytics } from '@/data/analytics'
import { ActiveUser, AnalyticsCategory } from '@/data/analytics.types'
import {
  ActionAnalytic,
  NewActionAnalytic,
} from '@/lib/database/schema/analytics'
import * as dateFns from 'date-fns'

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
  getDailyActiveUserOneWeek: async function(): Promise<ActiveUser[]> {
    const now = Date.now()
    const startDate = dateFns.subDays(now, 7)

    const desktopUsers = await analytics.getDailyActiveUsers({ date: startDate, platform: 'web' })
    const appUsers = await analytics.getDailyActiveUsers({ date: startDate, platform: 'app' })

    const activeUser: ActiveUser[] = []

    for (let date = startDate; !dateFns.isAfter(date, now); date = dateFns.addDays(date, 1)) {
      const formattedDate = dateFns.format(date, "yyyy-MM-dd")

      activeUser.push({
        date: formattedDate,
        desktopUsers: desktopUsers.find(d => d.date == formattedDate)?.users ?? 0,
        appUsers: appUsers.find(a => a.date == formattedDate)?.users ?? 0,
      })
    }

    return activeUser
  },
}
