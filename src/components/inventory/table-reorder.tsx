'use client'

import {
  getTableReorderColumns,
  getTableReorderFilters,
} from '@/app/[lng]/(site)/genbestil/columns'
import { useTranslation } from '@/app/i18n/client'
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
import { useLanguage } from '@/context/language'
import { FormattedReorder } from '@/data/inventory.types'
import { useUrlFiltering } from '@/hooks/use-url-filtering'
import { useUrlGlobalFiltering } from '@/hooks/use-url-global-filtering'
import { useUrlSorting } from '@/hooks/use-url-sorting'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { cn } from '@/lib/utils'
import {
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
  Updater,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { User } from 'lucia'
import { useEffect, useMemo, useState } from 'react'
import { TableFloatingBar } from '../table/table-floating-bar'
import { ExportSelectedButton } from './button-export-selected'
import { useSearchParams } from 'next/navigation'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]

interface Props {
  data: FormattedReorder[]
  user: User
  units: Unit[]
  groups: Group[]
}

export function TableReorder({ data, user, units, groups }: Props) {
  const FILTERS_KEY = 'reorder_filters'
  const LOCALSTORAGE_KEY = 'reorder_cols'
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')
  const columns = useMemo(
    () => getTableReorderColumns(user, lng, t),
    [user.role, lng, t],
  )
  const mutableSearchParams = new URLSearchParams(useSearchParams())

  const [globalFilter, setGlobalFilter] = useUrlGlobalFiltering(mutableSearchParams,'')
  const [sorting, handleSortingChange] = useUrlSorting(mutableSearchParams,[
    { id: 'quantity', desc: false },
  ])
  const [columnFilters, handleColumnFiltersChange] = useUrlFiltering(mutableSearchParams)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({'shouldReorder': false})
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

    onColumnFiltersChange: handleColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleVisibilityChange,
    onGlobalFilterChange: setGlobalFilter,

    enableColumnFilters: COLUMN_FILTERS_ENABLED,
    enableRowSelection: ROW_SELECTION_ENABLED,

    autoResetExpanded: false,
    filterFromLeafRows: false,

    state: {
      globalFilter,
      columnFilters,
      rowSelection,
      sorting,
      columnVisibility,
    },

    meta: {
      user,
    },
  })

  const filterFields = useMemo(
    () => getTableReorderFilters(table, units, groups, lng, t),
    [table, units, groups, lng, t],
  )

  if (!mounted) return null

  return (
    <div>
      <TableToolbar
        table={table}
        options={{ showExport: true, showHideShow: true }}
        filterFields={filterFields}
        filterLocalStorageKey={FILTERS_KEY}
        defaultGlobalFilter={globalFilter}
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
                  className={cn(
										row.original.shouldReorder &&
                      'bg-destructive/10 border-b-destructive/15 hover:bg-destructive/15 data-[state=selected]:bg-destructive/20',
                  )}
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
