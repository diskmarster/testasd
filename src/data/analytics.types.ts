export type AnalyticsPlatform = 'web' | 'app'
export type AnalyticsCategory = 'action'

export type ActiveUser = {
  desktopUsers: number,
  appUsers: number,
  date: string,
}

export type ActivePlatformUser = {
  users: number,
  date: string,
}

export type AnalyticsFilter = {
  date?: Date | {
    from: Date,
    to: Date,
  },
  platform?: AnalyticsPlatform,
}
