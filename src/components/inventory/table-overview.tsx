'use client'

import {fuzzyFilter} from '@/lib/tanstack/filter-fns'
import {
  getTableOverviewColumns,
  getTableOverviewFilters,
} from '@/app/[lng]/(site)/oversigt/columns'
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
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import { useUrlFiltering } from '@/hooks/use-url-filtering'
import { useUrlGlobalFiltering } from '@/hooks/use-url-global-filtering'
import { useUrlSorting } from '@/hooks/use-url-sorting'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
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
  GroupingState,
  RowSelectionState,
  Updater,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { User } from 'lucia'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CustomerSettings } from '@/lib/database/schema/customer'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]

const defaultVisibility = {
  barcode: false,
  group: false,
  text3: false,
}

interface Props {
  data: FormattedInventory[]
  user: User
  plan: Plan
  units: Unit[]
  groups: Group[]
  placements: Placement[]
  batches: Batch[]
  customerSettings: Pick<CustomerSettings, 'useReference' | 'usePlacement' | 'useBatch'>,
  isGrouped: boolean
}

export function TableOverview({
  data,
  user,
  plan,
  units,
  groups,
  placements,
  batches,
  customerSettings,
  isGrouped,
}: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'oversigt')
  const LOCALSTORAGE_KEY = 'inventory_cols'
  const FILTERS_KEY = 'inventory_filters'
  const columns = useMemo(
    () => getTableOverviewColumns(plan, user, customerSettings, lng, t),
    [user, plan, customerSettings, lng, t],
  )

  const mutableSearchParams = new URLSearchParams(useSearchParams())

  const [globalFilter, setGlobalFilter] = useUrlGlobalFiltering(mutableSearchParams, '')
  const [sorting, handleSortingChange] = useUrlSorting(mutableSearchParams)
  const [columnFilters, handleColumnFiltersChange] = useUrlFiltering(mutableSearchParams,[
    { id: 'isBarred', value: [false] },
  ])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [grouping, setGrouping] = useState<GroupingState>(
    (isGrouped)
      ? ['sku']
      : []
  )
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(defaultVisibility)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const visibility = JSON.parse(
      //@ts-ignore
      localStorage.getItem(LOCALSTORAGE_KEY),
    )
    setColumnVisibility(visibility ?? defaultVisibility)
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
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: handleVisibilityChange,
    onGlobalFilterChange: setGlobalFilter,

    enableColumnFilters: COLUMN_FILTERS_ENABLED,
    enableRowSelection: ROW_SELECTION_ENABLED,

    autoResetExpanded: false,
    filterFromLeafRows: false,

		filterFns: {
			fuzzy: fuzzyFilter,
		},
		// @ts-ignore
		globalFilterFn: 'fuzzy',

    state: {
      globalFilter,
      columnFilters,
      rowSelection,
      sorting,
      grouping,
      expanded,
      columnVisibility,
    },

    meta: {
      user,
      isGrouped, 
    },
  })

  const filterFields = useMemo(
    () =>
      getTableOverviewFilters(
        plan,
        table,
        units,
        groups,
        placements,
        batches,
        user,
        customerSettings,
        t,
      ),
    [plan, table, units, groups, placements, batches, user, customerSettings, t],
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
                  {t('inventory')}
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
