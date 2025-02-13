'use client'

import {
  getTableBatchColumns,
  getTableBatchFilters,
} from '@/app/[lng]/(site)/varer/batch/columns'
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
import { useUrlSorting } from '@/hooks/use-url-sorting'
import { Batch } from '@/lib/database/schema/inventory'
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
  Updater,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { User } from 'lucia'
import { useEffect, useMemo, useState } from 'react'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [100, 250, 500, 1000]

interface Props {
  data: Batch[]
  user: User
}

export function TableBatch({ data, user }: Props) {
  const LOCALSTORAGE_KEY = 'batch_cols'
  const FILTERS_KEY = 'batch_filters'
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'batch')
  const columns = useMemo(
    () => getTableBatchColumns(lng, t, user),
    [lng, t, user],
  )
  const filteredData = useMemo(() => {
    return data.filter(batch => batch.batch !== '-')
  }, [data])
  const [sorting, handleSortingChange] = useUrlSorting()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: 'isBarred', value: [false] },
  ])
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
    data: filteredData,
    columns,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
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

  const filterFields = useMemo(
    () => getTableBatchFilters(table, data, lng, t),
    [table, data, lng, t],
  )

  if (!mounted) return null

  return (
    <div>
      <TableToolbar
        table={table}
        options={{ showExport: true, showHideShow: true }}
        filterFields={filterFields}
        filterLocalStorageKey={FILTERS_KEY}
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
                  className='h-24 text-center'>
                  {t('batch-columns.no-batches')}
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
