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

const dkCurrencyFormat = new Intl.NumberFormat("da-DK", {
  style: 'currency',
  currency: 'DKK',
})

export function numberToDKCurrency(val: number): string {
  return dkCurrencyFormat.format(val)
}
