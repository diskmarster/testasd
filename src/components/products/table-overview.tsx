'use client'

import { TableGroupedCell } from '@/components/table/table-grouped-cell'
import { TablePagination } from '@/components/table/table-pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plan } from '@/data/customer.types'
import { FormattedProduct } from '@/data/products.types'
import { Group, Unit } from '@/lib/database/schema/inventory'
import {
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
  Updater,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { User } from 'lucia'
import { useEffect, useMemo, useState } from 'react'
import { TableToolbar } from '../table/table-toolbar'
import { useLanguage } from '@/context/language'
import { useTranslation } from '@/app/i18n/client'
import { getProductOverviewColumns, getProductTableOverviewFilters } from '@/app/[lng]/(site)/varer/produkter/columns'
import { useUrlSorting } from '@/hooks/use-url-sorting'
import { useUrlFiltering } from '@/hooks/use-url-filtering'
import { useSearchParams } from 'next/navigation'
import { useUrlGlobalFiltering } from '@/hooks/use-url-global-filtering'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]
interface Props {
  data: FormattedProduct[]
  plan: Plan
  user: User
  units: Unit[]
  groups: Group[]
}

export function ProductOverview({ data, plan, user, units, groups }: Props) {
  const LOCALSTORAGE_KEY = 'product_cols'
  const FILTERS_KEY = 'product_filters'
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'produkter')
  const columns = useMemo(
    () => getProductOverviewColumns(plan, user, lng, t),
    [user, plan, lng, t],
  )

	const mutableSearchParams = new URLSearchParams(useSearchParams())
  const [globalFilter, setGlobalFilter] = useUrlGlobalFiltering(mutableSearchParams, '')
  const [sorting, handleSortingChange] = useUrlSorting(mutableSearchParams)
  const [columnFilters, handleColumnFiltersChange] = useUrlFiltering(mutableSearchParams,[
    { id: 'isBarred', value: [false] },
  ])
  const [expanded, setExpanded] = useState<ExpandedState>({})
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
  }, [LOCALSTORAGE_KEY])

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
    onSortingChange: handleSortingChange,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: handleVisibilityChange,
    onGlobalFilterChange: setGlobalFilter,

    enableColumnFilters: COLUMN_FILTERS_ENABLED,
    enableRowSelection: ROW_SELECTION_ENABLED,

    autoResetExpanded: false,
    filterFromLeafRows: false,

    state: {
			globalFilter,
      columnFilters,
      sorting,
      expanded,
      columnVisibility,
    },

    meta: {
      user,
      units,
      groups,
    },
  })

  const filterFields = useMemo(
    () => getProductTableOverviewFilters(plan, units, groups, table, lng, t),
    [plan, units, groups, table, lng, t],
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
                  {t('table-no-values')}
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
