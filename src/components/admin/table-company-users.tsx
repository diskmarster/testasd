'use client'

import {
  getTableUsersColumns,
  getTableUsersFilters,
} from '@/app/(site)/admin/firma/user_columns'
import { TableGroupedCell } from '@/components/table/table-grouped-cell'
import { TablePagination } from '@/components/table/table-pagination'
import { TableToolbar } from '@/components/table/table-toolbar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserNoHash } from '@/lib/database/schema/auth'
import { Customer } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  Updater,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { User } from 'lucia'
import { useEffect, useMemo, useState } from 'react'
import { ExportSelectedButton } from '../inventory/button-export-selected'
import { TableFloatingBar } from '../table/table-floating-bar'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]

interface Props {
  data: UserNoHash[]
  user: User
  customer: Customer
}

export function TableAdminUsers({ data, user, customer }: Props) {
  const LOCALSTORAGE_KEY = 'users_cols'
  const columns = useMemo(() => getTableUsersColumns(user.role), [user.role])

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const visibility = JSON.parse(
      localStorage.getItem(LOCALSTORAGE_KEY) || '{}',
    )
    setColumnVisibility(visibility)
  }, [LOCALSTORAGE_KEY, setColumnVisibility])

  const handleVisibilityChange = (updaterOrValue: Updater<VisibilityState>) => {
    if (LOCALSTORAGE_KEY) {
      if (typeof updaterOrValue === 'function') {
        const currentState = JSON.parse(
          localStorage.getItem(LOCALSTORAGE_KEY) || '{}',
        )

        const updatedState = updaterOrValue(currentState)
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updatedState))
        setColumnVisibility(updatedState)
      } else {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updaterOrValue))

        setColumnVisibility(updaterOrValue)
      }
    } else {
      setColumnVisibility(updaterOrValue)
    }
  }

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
    onColumnVisibilityChange: handleVisibilityChange,

    enableColumnFilters: COLUMN_FILTERS_ENABLED,
    enableRowSelection: ROW_SELECTION_ENABLED,

    autoResetExpanded: false,
    filterFromLeafRows: false,

    state: {
      columnFilters,
      rowSelection,
      sorting,
      columnVisibility,
    },

    meta: {
      user,
    },
  })

  const filterFields = useMemo(() => getTableUsersFilters(table), [table])

  if (!mounted) return null

  return (
    <div>
      <TableToolbar
        table={table}
        options={{ showExport: true, showHideShow: true }}
        filterFields={filterFields}
      />
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
                  className={cn('h-24 text-center')}>
                  Ingen min. beholdninger
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination table={table} pageSizes={ROW_PER_PAGE} />
      {ROW_SELECTION_ENABLED && (
        <TableFloatingBar table={table}>
          {table => <ExportSelectedButton table={table} />}
        </TableFloatingBar>
      )}
    </div>
  )
}
