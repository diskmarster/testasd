"use client"

import { getTableOverviewColumns } from '@/app/(site)/oversigt/columns'
import { FormattedInventory } from '@/data/inventory.types'
import { ColumnDef, ColumnFiltersState, ExpandedState, flexRender, getCoreRowModel, getExpandedRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getGroupedRowModel, getPaginationRowModel, getSortedRowModel, GroupingState, RowSelectionState, SortingState, useReactTable } from '@tanstack/react-table'
import { User } from 'lucia'
import { useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableGroupedCell } from '../table/table-grouped-cell'
import { Plan } from '@/data/customer.types'
import { numberToDKCurrency } from '@/lib/utils'
import { TableToolbar, FilterField } from '../table/table-toolbar'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [100, 250, 500, 1000]

interface Props<TValue> {
  //columns: ColumnDef<FormattedInventory, TValue>[]
  data: FormattedInventory[]
  user: User
  plan: Plan
}

export function TableOverview<TValue>({ data, user, plan }: Props<TValue>) {
  const columns = useMemo(() => getTableOverviewColumns(plan, user.role), [user.role, plan])
  //const columns = getTableOverviewColumns(plan, user.role)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isFilered, setIsFiltered] = useState<boolean>(false)
  const [grouping, setGrouping] = useState<GroupingState>(['sku'])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const stockValue = data.reduce<number>(
    (agg, cur) => agg + (cur.quantity * cur.product.costPrice), 0
  )

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
      stockValue
    },
  })

  const filterFields: FilterField<FormattedInventory>[] = [
    {
      column: table.getColumn('sku'),
      type: 'text',
      label: 'Varenr.',
      placeholder: 'Søg i varenr.'
    },
    {
      column: table.getColumn('barcode'),
      type: 'text',
      label: 'Stregkode',
      placeholder: 'Søg i stregkode'
    },
    {
      column: table.getColumn('group'),
      type: 'select',
      label: 'Varegruppe',
      options: [
        { value: 0, label: "Stk" }, { value: 1, label: "Gram" }
      ]
    }
  ]

  return (
    <div>
      <TableToolbar table={table} options={{ showExport: true }} filterFields={filterFields} />
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
          {table.getRowModel().rows && table.getRowModel().rows.length > 0 && (

            <TableFooter className='w-max h-16'>
              <TableRow>
                <TableCell
                  colSpan={columns.length - 4}>
                  Lagerværdi
                </TableCell>
                <TableCell colSpan={1} className='text-right'>
                  {/* @ts-ignore */}
                  {numberToDKCurrency(table.options.meta?.stockValue)}
                </TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      {/* table pagination component */}
      {/* table floating bar component */}
    </div>
  )
}
