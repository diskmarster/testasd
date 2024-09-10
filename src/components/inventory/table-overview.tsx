"use client"

import { getTableOverviewColumns } from '@/app/(site)/oversigt/columns'
import { FormattedInventory } from '@/data/inventory.types'
import { ColumnFiltersState, ExpandedState, flexRender, getCoreRowModel, getExpandedRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getGroupedRowModel, getPaginationRowModel, getSortedRowModel, GroupingState, RowSelectionState, SortingState, useReactTable } from '@tanstack/react-table'
import { User } from 'lucia'
import { useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableGroupedCell } from '../table/table-grouped-cell'
import { Plan } from '@/data/customer.types'
import { TableToolbar, FilterField } from '../table/table-toolbar'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { TablePagination } from '../table/table-pagination'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [100, 250, 500, 1000]

interface Props {
  data: FormattedInventory[]
  user: User
  plan: Plan
  units: Unit[]
  groups: Group[]
}

export function TableOverview({ data, user, plan, units, groups }: Props) {
  const columns = useMemo(() => getTableOverviewColumns(plan, user.role), [user.role, plan])

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [grouping, setGrouping] = useState<GroupingState>(['sku'])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

    groupedColumnMode: 'reorder',

    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,

    enableColumnFilters: COLUMN_FILTERS_ENABLED,
    enableRowSelection: ROW_SELECTION_ENABLED,

    autoResetExpanded: false,
    filterFromLeafRows: false,

    state: {
      columnFilters,
      rowSelection,
      sorting,
      grouping,
      expanded
    },

    meta: {
      user,
    },
  })

  const filterFields: FilterField<FormattedInventory>[] = [
    {
      column: table.getColumn('sku'),
      type: 'text',
      label: 'Varenr.',
      value: '',
      placeholder: 'Søg i varenr.'
    },
    {
      column: table.getColumn('barcode'),
      type: 'text',
      label: 'Stregkode',
      value: '',
      placeholder: 'Søg i stregkode'
    },
    {
      column: table.getColumn('unit'),
      type: 'select',
      label: 'Enhed',
      value: '',
      options: [
        ...units.map(unit => ({
          value: unit.id,
          label: unit.name
        }))
      ]
    },
    {
      column: table.getColumn('group'),
      type: 'select',
      label: 'Varegruppe',
      value: '',
      options: [
        ...groups.map(group => ({
          value: group.id,
          label: group.name
        }))
      ]
    },
    {
      column: table.getColumn('updated'),
      type: 'date',
      label: 'Sidst opdateret',
      value: ''
    },
  ]

  return (
    <div>
      <TableToolbar table={table} options={{ showExport: true, showHideShow: true, localStorageKey: "inventory-cols" }} filterFields={filterFields} />
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows && table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}>
                  <TableGroupedCell row={row} />
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'>
                  Ingen beholdning
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination table={table} pageSizes={ROW_PER_PAGE} />
    </div>
  )
}
