import { TableReorderActions } from '@/components/inventory/table-reorder-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Unit } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getTableUnitColumns(): ColumnDef<Unit>[] {
  const unitCol: ColumnDef<Unit> = {
    accessorKey: 'name',
    header: ({ column }) => <TableHeader column={column} title='Enhed' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Enhed',
    },
  }

  const isBarredCol: ColumnDef<Unit> = {
    accessorKey: 'isBarred',
    header: ({ column }) => <TableHeader column={column} title='Spærret' />,
    cell: ({ getValue }) => {
      const isBarred = getValue<boolean>()
      return (
        <Badge variant={isBarred ? 'destructive' : 'outline'}>
          {isBarred ? 'Ja' : 'Nej'}
        </Badge>
      )
    },
    meta: {
      viewLabel: 'Spærret',
    },
    filterFn: (row, id, value) => {
      const isBarredValue = value == 'Ja'
      return row.getValue(id) === isBarredValue
    },
  }

  const insertedCol: ColumnDef<Unit> = {
    accessorKey: 'inserted',
    header: ({ column }) => <TableHeader column={column} title='Oprettet' />,
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: 'Oprettet',
    },
  }

  const updatedCol: ColumnDef<Unit> = {
    accessorKey: 'updated',
    header: ({ column }) => <TableHeader column={column} title='Opdateret' />,
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: 'Opdateret',
    },
  }
  /* const actionsCol: ColumnDef<Unit> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableOverviewActions table={table} row={row} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  } */
  

  return [unitCol, isBarredCol, insertedCol, updatedCol, /* actionsCol ADD AFTER MERGE */]
}

export function getTableUnitFilters(
  table: Table<Unit>,
  units: Unit[],
): FilterField<Unit>[] {
  const unitFilter: FilterField<Unit> = {
    column: table.getColumn('name'),
    type: 'select',
    label: 'enhed',
    value: '',
    options: [
      ...units.map(unit => ({
        value: unit.name,
        label: unit.name,
      })),
    ],
  }

  const isBarredFilter: FilterField<Unit> = {
    column: table.getColumn('isBarred'),
    type: 'select',
    label: 'Spærret',
    value: '',
    options: [
      { value: 'Ja', label: 'Ja' },
      { value: 'Nej', label: 'Nej' },
    ],
  }

  const insertedFilter: FilterField<Unit> = {
    column: table.getColumn('inserted'),
    type: 'date',
    label: 'Oprettet',
    value: '',
  }

  const updatedFilter: FilterField<Unit> = {
    column: table.getColumn('updated'),
    type: 'date',
    label: 'Opdateret',
    value: '',
  }

  return [unitFilter, isBarredFilter, insertedFilter, updatedFilter]
}
