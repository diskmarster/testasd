import { NumberRange } from '@/components/table/table-toolbar'
import { Row } from '@tanstack/react-table'

export function numberRangeFilterFn<T>(
  row: Row<T>,
  id: string,
  value: NumberRange,
): boolean {
  const { to, from } = value
  const val = row.getValue<number>(id)

  if (!from && !to) {
    return false
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
