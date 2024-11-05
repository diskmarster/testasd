import { I18NLanguage } from '@/app/i18n/settings'
import { clsx, type ClassValue } from 'clsx'
import { emitCustomEvent } from 'react-custom-events'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'CET',
  }).format(date)
}

export function formatNumber(num: number): string {
  if (num % 1 === 0) {
    return num.toString()
  } else {
    return num.toFixed(2)
  }
}

const dkCurrencyFormat = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
})

export function numberToDKCurrency(val: number): string {
  return dkCurrencyFormat.format(val)
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
