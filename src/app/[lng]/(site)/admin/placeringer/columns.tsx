import { TableOverviewActions } from '@/components/inventory/table-placement-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Placement } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTablePlacementColumns(): ColumnDef<Placement>[] {
  const placementCol: ColumnDef<Placement> = {
    accessorKey: 'name',
    header: ({ column }) => <TableHeader column={column} title='Placering' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Placering',
    },
  }

  const isBarredCol: ColumnDef<Placement> = {
    accessorKey: 'isBarred',
    header: ({ column }) => <TableHeader column={column} title='Spærret' />,
    cell: ({ getValue }) => (getValue<boolean>() ? 'Ja' : 'Nej'),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<boolean>(id))
    },
    meta: {
      viewLabel: 'Spærret',
    },
  }

  const insertedCol: ColumnDef<Placement> = {
    accessorKey: 'inserted',
    header: ({ column }) => <TableHeader column={column} title='Oprettet' />,
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
      viewLabel: 'Oprettet',
    },
  }

  const updatedCol: ColumnDef<Placement> = {
    accessorKey: 'updated',
    header: ({ column }) => <TableHeader column={column} title='Opdateret' />,
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
      viewLabel: 'Opdateret',
    },
  }

  const actionsCol: ColumnDef<Placement> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ row }) => <TableOverviewActions row={row} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  return [placementCol, isBarredCol, insertedCol, updatedCol, actionsCol]
}

export function getTablePlacementFilters(
  table: Table<Placement>,
  placements: Placement[],
): FilterField<Placement>[] {
  const placementFilter: FilterField<Placement> = {
    column: table.getColumn('name'),
    type: 'select',
    label: 'Placering',
    value: '',
    options: [
      ...placements.map(placement => ({
        value: placement.name,
        label: placement.name,
      })),
    ],
  }

  const isBarredFilter: FilterField<Placement> = {
    column: table.getColumn('isBarred'),
    type: 'select',
    label: 'Spærret',
    value: '',
    options: [
      { value: true, label: 'Ja' },
      { value: false, label: 'Nej' },
    ],
  }

  const insertedFilter: FilterField<Placement> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: 'Oprettet',
    value: '',
  }

  const updatedFilter: FilterField<Placement> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: 'Opdateret',
    value: '',
  }

  return [placementFilter, isBarredFilter, insertedFilter, updatedFilter]
}
