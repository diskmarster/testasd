import { NumberRange } from '@/components/table/table-toolbar'
import { FilterFn, Row } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { rankItem } from '@tanstack/match-sorter-utils'

export function numberRangeFilterFn<T>(
  row: Row<T>,
  id: string,
  value: NumberRange,
): boolean {
  const { to, from } = value
  const val = row.getValue<number | null>(id) ?? -Infinity

  if (!from && !to) {
    return true
  } else if (!from && to) {
    return val <= to
  } else if (from && !to) {
    return val >= from
  } else if (from && to) {
    return val >= from && val <= to
  } else {
    return true
  }
}

export function dateRangeFilterFn<T>(
  row: Row<T>,
  id: string,
  value: DateRange,
): boolean {
  const rowDate: string | number | Date = row.getValue(id)

  if (!value.from && value.to) {
    return true
  }

  if (value.from && !value.to) {
    return isSameDay(rowDate, new Date(value.from))
  }

  if (value.from && value.to) {
    return (
      (isAfter(rowDate, new Date(value.from)) &&
        isBefore(rowDate, new Date(value.to))) ||
      isSameDay(rowDate, new Date(value.from)) ||
      isSameDay(rowDate, new Date(value.to))
    )
  }

  return true
}

export function stringSortingFn(rA: string, rB: string) {
  return rA.localeCompare(rB)
}

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}
