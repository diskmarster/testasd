import { TableLocationsActions } from '@/components/admin/table-locations-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { UserRole } from '@/data/user.types'
import { Location } from '@/lib/database/schema/customer'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableLocationsColumns(
  userRole: UserRole,
): ColumnDef<Location>[] {
  const selectCol: ColumnDef<Location> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }

  const nameCol: ColumnDef<Location> = {
    accessorKey: 'name',
    header: ({ column }) => <TableHeader column={column} title='Navn' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Navn',
    },
  }

  const statusCol: ColumnDef<Location> = {
    accessorKey: 'isBarred',
    header: ({ column }) => <TableHeader column={column} title='Status' />,
    cell: ({ getValue }) => {
      const status = getValue<boolean>()
      const badgeVariant = status ? 'destructive' : 'secondary'

      return (
        <Badge variant={badgeVariant}>{status ? 'Deaktiveret' : 'Aktiv'}</Badge>
      )
    },
    meta: {
      viewLabel: 'Status',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<boolean>(id))
    },
  }

  const updatedCol: ColumnDef<Location> = {
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

  const insertedCol: ColumnDef<Location> = {
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

  const actionsCol: ColumnDef<Location> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableLocationsActions row={row} table={table} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  return [selectCol, nameCol, statusCol, insertedCol, updatedCol, actionsCol]
}

export function getTableLocationFilters(
  table: Table<Location>,
): FilterField<Location>[] {
  const nameFilter: FilterField<Location> = {
    column: table.getColumn('name'),
    type: 'text',
    label: 'Navn',
    value: '',
    placeholder: 'Søg i navn',
  }

  const statusFilter: FilterField<Location> = {
    column: table.getColumn('isBarred'),
    type: 'select',
    label: 'Status',
    value: '',
    options: [
      { label: 'Deaktiveret', value: true },
      { label: 'Aktiv', value: false },
    ],
  }

  const insertedFilter: FilterField<Location> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: 'Oprettet',
    value: '',
  }

  const updatedFilter: FilterField<Location> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: 'Opdateret',
    value: '',
  }

  return [nameFilter, statusFilter, insertedFilter, updatedFilter]
}
