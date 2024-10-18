import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

const dkCurrencyFormat = new Intl.NumberFormat("da-DK", {
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
