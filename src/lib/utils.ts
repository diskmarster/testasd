import { fallbackLng, I18NLanguage } from '@/app/i18n/settings'
import { BadgeProps } from '@/components/ui/badge'
import { Plan } from '@/data/customer.types'
import { clsx, type ClassValue } from 'clsx'
import { addDays, addMilliseconds, Locale } from 'date-fns'
import { da, enGB } from 'date-fns/locale'
import { emitCustomEvent } from 'react-custom-events'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | number, withTime: boolean = true) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined,
    timeZone: 'CET',
  }).format(date)
}

const lngToLocaleMap: Map<I18NLanguage, string> = new Map([
  ['da', 'da-DK'],
  ['en', 'en-GB'],
])

export function numberToCurrency(val: number, lng: I18NLanguage = fallbackLng): string {
  return new Intl.NumberFormat(lngToLocaleMap.get(lng) ?? 'da-dk', {
    style: 'currency',
    currency: 'DKK',
  }).format(val)
}

export function numberFormatter(lng: I18NLanguage = fallbackLng) {
  return new Intl.NumberFormat(lngToLocaleMap.get(lng) ?? 'da-DK', {
    style: 'decimal',
    maximumFractionDigits: 2,
  })
}

export function formatNumber(num: number, lng: I18NLanguage = fallbackLng): string {
  return numberFormatter(lng).format(num)
}

export function convertENotationToNumber(num: string): string {
  // thank god for stackoverflow
  const str = num.toString()
  const match = str.match(/^(\d+)(\.(\d+))?[eE]([-\+]?\d+)$/)
  if (!match) return str //number was not e notation or toString converted
  // we parse the e notation as (integer).(tail)e(exponent)
  const [, integer, , tail, exponentStr] = match
  const exponent = Number(exponentStr)
  const realInteger = integer + (tail || '')
  if (exponent > 0) {
    const realExponent = Math.abs(exponent + integer.length)
    return realInteger.padEnd(realExponent, '0')
  } else {
    const realExponent = Math.abs(exponent - (tail?.length || 0))
    return '0.' + realInteger.padStart(realExponent, '0')
  }
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  let arrayLength = array.length
  let tmpArray = []

  for (let index = 0; index < arrayLength; index += chunkSize) {
    const chunk = array.slice(index, index + chunkSize)
    tmpArray.push(chunk)
  }

  return tmpArray
}

export function updateChipCount() {
  emitCustomEvent('UpdateNavBadges')
}

export async function getChipCount(chip: string): Promise<number> {
  try {
    const request = await fetch(`/api/v1/chip/${chip}`)

    if (!request.ok) {
      return 0
    }

    if (request.status != 200) {
      console.error('chip request error', await request.json())
      return 0
    }

    const response = (await request.json()) as { count: number }
    return response.count
  } catch (error) {
    return 0
  }
}

export function obscureEmail(s: string): string {
  const parsed = z.string().email().safeParse(s)
  if (!parsed.success) return s
  const parts = parsed.data.split('@')
  return `${parts[0].substring(0, 1)}...${parts[0].substring(parts[0].length - 1)}@${parts[1]}`
}

// I did not write the following class, follow this link to read more about it.
// https://observablehq.com/@mbostock/localized-number-parsing
export class NumberParser {
  _group: RegExp
  _decimal: RegExp
  _numeral: RegExp
  _index: any
  constructor(locale: string) {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
    const numerals = [
      //@ts-ignore
      ...new Intl.NumberFormat(locale, { useGrouping: false }).format(
        9876543210,
      ),
    ].reverse()
    const index = new Map(numerals.map((d, i) => [d, i]))
    this._group = new RegExp(
      `[${parts.find(d => d.type === 'group')!.value}]`,
      'g',
    )
    this._decimal = new RegExp(
      `[${parts.find(d => d.type === 'decimal')!.value}]`,
    )
    this._numeral = new RegExp(`[${numerals.join('')}]`, 'g')
    this._index = (d: string) => index.get(d)
  }
  parse(string: string) {
    return (string = string
      .trim()
      .replace(this._group, '')
      .replace(this._decimal, '.')
      .replace(this._numeral, this._index))
      ? +string
      : NaN
  }
}

export function NewNumberParser(lng: I18NLanguage): NumberParser {
  let locale
  switch (lng) {
    case 'en':
      locale = 'en-GB'
      break

    default:
      locale = 'da-DK'
      break
  }

  return new NumberParser(locale)
}

export function tryParseInt(str: string | undefined): number | undefined {
  try {
    if (!str) {
      return undefined
    }

    return parseInt(str)
  } catch {
    return undefined
  }
}

export function excelDateToJSDate(excelDate: number): Date {
  const daysSinceZero = Math.floor(excelDate)
  const time = excelDate - daysSinceZero
  const zeroDay = new Date('01-01-1900')
  const dayInMS = 86399000

  const timeInMs = time * dayInMS
  const final = addMilliseconds(addDays(zeroDay, daysSinceZero - 2), timeInMs)
  return final
}

export function planToBadgeVariant(plan: Plan): BadgeProps['variant'] {
  switch(plan) {
    case 'basis':
      return 'blue'
    case 'pro':
      return 'violet'
    default:
      return 'default'
  }
}

export function clearTableSelection() {
  emitCustomEvent('ClearTableSelection')
}

const lngToDateFnsLocaleMap: Map<I18NLanguage, Locale> = new Map([
	['da', da],
	['en', enGB]
])

export function getDateFnsLocale(lng: I18NLanguage): Locale {
	const locale = lngToDateFnsLocaleMap.get(lng)
	return locale ?? da
}

export function isNullOrUndefined(val: unknown): boolean {
  return val === undefined || val === null
}
