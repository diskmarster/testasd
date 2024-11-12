import { NumberRange } from '@/components/table/table-toolbar'
import { Row } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function numberRangeFilterFn<T>(
  row: Row<T>,
  id: string,
  value: NumberRange,
): boolean {
  const { to, from } = value
  const val = row.getValue<number>(id)

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
