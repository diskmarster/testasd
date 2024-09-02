import { isBefore, addHours } from 'date-fns'

export function isLinkExpired(inserted: Date, durationHH: number): boolean {
  const expiration = addHours(inserted, durationHH)
  const now = new Date()
  return isBefore(now, expiration)
}
