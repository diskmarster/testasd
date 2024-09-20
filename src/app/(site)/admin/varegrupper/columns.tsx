import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Group } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getTableGroupColumns(): ColumnDef<Group>[] {
  const groupCol: ColumnDef<Group> = {
    accessorKey: 'name',
    header: ({ column }) => <TableHeader column={column} title='Varegruppe' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varegruppe',
    },
  }

  const isBarredCol: ColumnDef<Group> = {
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

  const insertedCol: ColumnDef<Group> = {
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

  const updatedCol: ColumnDef<Group> = {
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

  return [groupCol, isBarredCol, insertedCol, updatedCol]
}

export function getTableGroupFilters(
  table: Table<Group>,
  groups: Group[],
): FilterField<Group>[] {
  const groupFilter: FilterField<Group> = {
    column: table.getColumn('name'),
    type: 'select',
    label: 'Varegruppe',
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
    label: 'Spærret',
    value: '',
    options: [
      { value: 'Ja', label: 'Ja' },
      { value: 'Nej', label: 'Nej' },
    ],
  }

  const insertedFilter: FilterField<Group> = {
    column: table.getColumn('inserted'),
    type: 'date',
    label: 'Oprettet',
    value: '',
  }

  const updatedFilter: FilterField<Group> = {
    column: table.getColumn('updated'),
    type: 'date',
    label: 'Opdateret',
    value: '',
  }

  return [groupFilter, isBarredFilter, insertedFilter, updatedFilter]
}
