'use client'

import { getTableErrorsColumns, getTableErrorsFilters } from '@/app/[lng]/(site)/sys/fejlbeskeder/columns'
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
import { FormattedError } from '@/data/errors.types'
import {
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  GroupingState,
  RowSelectionState,
  Updater,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { TableFloatingBar } from '../table/table-floating-bar'
import { ExportSelectedButton } from '../inventory/button-export-selected'
import { useUrlSorting } from '@/hooks/use-url-sorting'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]

interface Props {
  data: FormattedError[]
}

export function TableErrors({
  data,
}: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'errors')
  const LOCALSTORAGE_KEY = 'inventory_cols'
  const FILTERS_KEY = 'inventory_filters'
  const columns = useMemo(() => getTableErrorsColumns(t), [t])

  const [sorting, handleSortingChange] = useUrlSorting()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const visibility = JSON.parse(
      //@ts-ignore
      localStorage.getItem(LOCALSTORAGE_KEY),
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
    onSortingChange: handleSortingChange,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: handleVisibilityChange,

    enableColumnFilters: COLUMN_FILTERS_ENABLED,
    enableRowSelection: ROW_SELECTION_ENABLED,

    autoResetExpanded: false,
    filterFromLeafRows: false,

    state: {
      columnFilters,
      rowSelection,
      sorting,
      grouping,
      expanded,
      columnVisibility,
    },
  })

  const filterFields = useMemo(() => getTableErrorsFilters(table, t), [table, t])

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
                  {t('table.no-rows')}
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
