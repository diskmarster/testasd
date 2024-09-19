import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Groups } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getTableGroupColumns(): ColumnDef<Groups>[] {
  const groupCol: ColumnDef<Groups> = {
    accessorKey: 'name',
    header: ({ column }) => <TableHeader column={column} title='Varegruppe' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varegruppe',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const isBarredCol: ColumnDef<Groups> = {
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
  }

  const insertedCol: ColumnDef<Groups> = {
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

  const updatedCol: ColumnDef<Groups> = {
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
  table: Table<Groups>,
  groups: Groups[],
): FilterField<Groups>[] {
  const groupFilter: FilterField<Groups> = {
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

  return [groupFilter]
}
