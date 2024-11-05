import { Plan } from '@/data/customer.types'
import { addHours, isBefore } from 'date-fns'

export const planUserLimits: { readonly [Property in Plan]: number } = Object.freeze({
  lite: 1,
  basis: 5,
  pro: 10,
})

export function isLinkExpired(inserted: Date, durationHH: number): boolean {
  const expiration = addHours(inserted, durationHH)
  const now = new Date()
  return isBefore(now, expiration)
}

export function isLocationLimitReached(plan: Plan, num: number): boolean {
  const limits: { [key: string]: number } = {
    lite: 1,
    basis: 1,
    pro: Infinity,
  }

  return num >= limits[plan]
}

export function isUserLimitReached(
  plan: Plan,
  extra: number,
  num: number,
): boolean {
  return num >= planUserLimits[plan] + extra
}
