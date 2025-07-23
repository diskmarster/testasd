import { db } from '@/lib/database'
import {
  Announcement,
  announcementTable,
} from '@/lib/database/schema/announcements'
import { and, eq, gt } from 'drizzle-orm'

export const announcements = {
  getActive: async function (): Promise<Announcement | undefined> {
    const result = await db
      .select()
      .from(announcementTable)
      .where(
        and(
          eq(announcementTable.active, true),
          gt(announcementTable.activeUntil, new Date()),
        ),
      )
      .limit(1)

    return result.at(0)
  },
}
