import { announcements } from '@/data/announcement'
import { Announcement } from '@/lib/database/schema/annountments'
import { tryParseInt } from '@/lib/utils'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const announcementService = {
  getActive: cache(async function (): Promise<Announcement | undefined> {
    return announcements.getActive()
  }),
  setCookie: function (id: number) {
    cookies().set('hidden_announcement', id.toString())
  },
  getCookie: function (): number | undefined {
    const c = cookies().get('hidden_announcement')
    const id = tryParseInt(c?.value)
    return id
  },
}
