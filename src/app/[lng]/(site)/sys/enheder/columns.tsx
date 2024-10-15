import { TableOverviewActions } from '@/components/inventory/table-units-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Unit } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getTableUnitColumns(
  lng: string,
  t: (key: string) => string,
): ColumnDef<Unit>[] {
  const unitCol: ColumnDef<Unit> = {
    accessorKey: 'name',
    header: ({ column }) => (
      <TableHeader column={column} title={t('unit-columns-unit')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('unit-columns-unit'),
    },
  }

  const isBarredCol: ColumnDef<Unit> = {
    accessorKey: 'isBarred',
    header: ({ column }) => (
      <TableHeader column={column} title={t('unit-columns.is-barred')} />
    ),
    cell: ({ getValue }) =>
      getValue<boolean>()
        ? t('unit-columns.is-barred-yes')
        : t('unit-columns.is-barred-no'),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<boolean>(id))
    },
    meta: {
      viewLabel: t('unit-columns.is-barred'),
    },
  }

  const insertedCol: ColumnDef<Unit> = {
    accessorKey: 'inserted',
    header: ({ column }) => (
      <TableHeader column={column} title={t('unit-columns.created-at')} />
    ),
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: t('unit-columns.created-at'),
    },
  }

  const updatedCol: ColumnDef<Unit> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader column={column} title={t('unit-columns.updated-at')} />
    ),
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: t('unit-columns.updated-at'),
    },
  }
  const actionsCol: ColumnDef<Unit> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableOverviewActions table={table} row={row} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }
  return [unitCol, isBarredCol, insertedCol, updatedCol, actionsCol]
}

export function getTableUnitFilters(
  table: Table<Unit>,
  units: Unit[],
  lng: string,
  t: (key: string) => string,
): FilterField<Unit>[] {
  const unitFilter: FilterField<Unit> = {
    column: table.getColumn('name'),
    type: 'select',
    label: t('unit-columns.unit'),
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
    label: t('unit-columns.is-barred'),
    value: '',
    options: [
      { value: true, label: t('unit-columns.is-barred-yes') },
      { value: false, label: t('unit-columns.is-barred-no') },
    ],
  }

  const insertedFilter: FilterField<Unit> = {
    column: table.getColumn('inserted'),
    type: 'date',
    label: t('unit-columns.created-at'),
    value: '',
  }

  const updatedFilter: FilterField<Unit> = {
    column: table.getColumn('updated'),
    type: 'date',
    label: t('unit-columns.updated-at'),
    value: '',
  }

  return [unitFilter, isBarredFilter, insertedFilter, updatedFilter]
}
