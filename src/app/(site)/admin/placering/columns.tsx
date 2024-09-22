import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Placement } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

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

  const insertedCol: ColumnDef<Placement> = {
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

  const updatedCol: ColumnDef<Placement> = {
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

  return [placementCol, isBarredCol, insertedCol, updatedCol]
}

export function getTablePlacementFilters(
  table: Table<Placement>,
  placements: Placement[], // Ensure placements are passed in
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
      { value: 'Ja', label: 'Ja' },
      { value: 'Nej', label: 'Nej' },
    ],
  }

  const insertedFilter: FilterField<Placement> = {
    column: table.getColumn('inserted'),
    type: 'date',
    label: 'Oprettet',
    value: '',
  }

  const updatedFilter: FilterField<Placement> = {
    column: table.getColumn('updated'),
    type: 'date',
    label: 'Opdateret',
    value: '',
  }

  return [placementFilter, isBarredFilter, insertedFilter, updatedFilter]
}
