"use client"

import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"
import { Customer } from "@/lib/database/schema/customer"
import { ColumnFiltersState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, SortingState, Updater, useReactTable, VisibilityState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { TableToolbar } from "../table/table-toolbar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { TableGroupedCell } from "../table/table-grouped-cell"
import { TablePagination } from "../table/table-pagination"
import { TableFloatingBar } from "../table/table-floating-bar"
import { ExportSelectedButton } from "../inventory/button-export-selected"
import { getTableClientFilters, getTableClientsColumns } from "@/app/[lng]/(site)/sys/kunder/columns"

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]
const LOCALSTORAGE_KEY = 'clients_cols'

interface Props {
  data: Customer[]
}

export function TableClients({ data }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'kunder')

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

  const columns = useMemo(() => getTableClientsColumns(t), [t])

  const table = useReactTable({
    data,
    columns,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

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
  })

  const filterFields = useMemo(() => getTableClientFilters(table, t), [table, t])

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
