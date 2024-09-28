"use client"

import { Column, Table } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { exportTableToCSV } from "@/lib/export/csv";
import { useTransition } from "react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TableToolbarFilters from "@/components/table/table-filters";

type ToolbarOptions = {
  showExport?: boolean
  showHideShow?: boolean
}
type FilterOption = {
  label: string
  value: any
  icon?: React.ComponentType<{ className?: string }>
}

export type FilterField<TRow> = {
  column: Column<TRow> | undefined
  type: 'text' | 'date' | 'select' | 'date-range'
  label: string
  value: any
  placeholder?: string
  options?: FilterOption[]
}

interface Props<T> {
  table: Table<T>
  options?: ToolbarOptions
  filterFields?: FilterField<T>[]
}

export function TableToolbar<T>({ table, options, filterFields = [] }: Props<T>) {

  return (
    <div className="flex items-center gap-2 py-4">
      <div className="mr-auto">
        <TableToolbarFilters table={table} filterFields={filterFields} />
      </div>
      {options && (
        <div className="ml-auto flex items-center gap-2">
          {options.showExport && (
            <DownloadButton table={table} />
          )}
          {options.showHideShow && (
            <ViewOptions table={table} />
          )}
        </div>
      )}
    </div>
  )
}

function DownloadButton<T>({ table }: { table: Table<T> }) {
  const [pending, startTransition] = useTransition()
  return (
    <TooltipProvider>
      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() => {
              startTransition(() => {
                // BUG: when table has grouped rows, filter out the grouped row so only leaf rows are exported
                exportTableToCSV(table, {
                  excludeColumns: ['select', 'actions'],
                })
              })
            }}>
            {pending
              ? <Icons.spinner className="size-4 animate-spin" />
              : <Icons.download className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Eksporter alt data</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ViewOptions<T>({ table, }: { table: Table<T>, }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon" >
          <Icons.columns className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuLabel>Gem/vis kollonner</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={e => e.preventDefault()}>
                {/* @ts-ignore */}
                {column.columnDef.meta?.viewLabel ?? column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

