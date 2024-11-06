import { TableOverviewActions } from '@/components/inventory/table-group-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Group } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableGroupColumns(
  lng: string,
  t: (key: string) => string,
): ColumnDef<Group>[] {
  const groupCol: ColumnDef<Group> = {
    accessorKey: 'name',
    header: ({ column }) => (
      <TableHeader
        column={column}
        title={t('product-group-columns.product-group')}
      />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('product-group-columns.product-group'),
    },
  }

  const isBarredCol: ColumnDef<Group> = {
    accessorKey: 'isBarred',
    header: ({ column }) => (
      <TableHeader
        column={column}
        title={t('product-group-columns.product-group-barred')}
      />
    ),
    cell: ({ getValue }) => {

      const status = getValue<boolean>()
      const badgeVariant = status ? 'red' : 'gray'

      return (
        <Badge variant={badgeVariant}>
          {status
            ? t('product-group-columns.product-group-barred-yes')
            : t('product-group-columns.product-group-barred-no')}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<boolean>(id))
    },
    meta: {
      viewLabel: t('product-group-columns.product-group-barred'),
    },
  }

  const insertedCol: ColumnDef<Group> = {
    accessorKey: 'inserted',
    header: ({ column }) => (
      <TableHeader
        column={column}
        title={t('product-group-columns.product-group-created')}
      />
    ),
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value: DateRange) => {
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
    },
    meta: {
      viewLabel: t('product-group-columns.product-group-created'),
    },
  }

  const updatedCol: ColumnDef<Group> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader
        column={column}
        title={t('product-group-columns.product-group-updated')}
      />
    ),
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value: DateRange) => {
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
    },
    meta: {
      viewLabel: t('product-group-columns.product-group-updated'),
    },
  }
  const actionsCol: ColumnDef<Group> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ row }) => <TableOverviewActions row={row} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  return [groupCol, isBarredCol, insertedCol, updatedCol, actionsCol]
}

export function getTableGroupFilters(
  table: Table<Group>,
  groups: Group[],
  lng: string,
  t: (key: string) => string,
): FilterField<Group>[] {
  const groupFilter: FilterField<Group> = {
    column: table.getColumn('name'),
    type: 'select',
    label: t('product-group-columns.product-group'),
    value: '',
    options: [
      ...groups.map(group => ({
        value: group.name,
        label: group.name,
      })),
    ],
  }

  const isBarredFilter: FilterField<Group> = {
    column: table.getColumn('isBarred'),
    type: 'select',
    label: t('product-group-columns.product-group-barred'),
    value: '',
    options: [
      {
        value: true,
        label: t('product-group-columns.product-group-barred-yes'),
      },
      {
        value: false,
        label: t('product-group-columns.product-group-barred-no'),
      },
    ],
  }

  const insertedFilter: FilterField<Group> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: t('product-group-columns.product-group-created'),
    value: '',
  }

  const updatedFilter: FilterField<Group> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: t('product-group-columns.product-group-updated'),
    value: '',
  }

  return [groupFilter, isBarredFilter, insertedFilter, updatedFilter]
}
