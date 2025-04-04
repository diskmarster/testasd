import { CustomerID } from "@/lib/database/schema/customer"

export type AnalyticsPlatform = 'web' | 'app'
export type AnalyticsCategory = 'action'

export type ActiveUser = {
  desktopUsers: number,
  appUsers: number,
  label: string,
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
  customerID?: CustomerID,
  actionName?: string,
  executionTime?: {
    min?: number,
    max?: number,
  },
}
