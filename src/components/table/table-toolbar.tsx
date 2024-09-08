"use client"

import { Column, Table } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Icons } from "../ui/icons";
import { exportTableToCSV } from "@/lib/export/csv";
import { useState, useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CaretSortIcon, ChevronDownIcon, PlusIcon, TextIcon } from "@radix-ui/react-icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ListIcon } from "lucide-react";

type ToolbarOptions = {
  showExport?: boolean
  showHideShow?: false
} | {
  showExport?: boolean
  showHideShow?: true
  localStorageKey: string
}

type FilterOption = {
  label: string
  value: any
  icon?: React.ComponentType<{ className?: string }>
}

export type FilterField<TRow> = {
  column: Column<TRow>
  type: 'text' | 'date' | 'select'
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
        <div className="ml-auto">
          {options.showExport && (
            <DownloadButton table={table} />
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

function TableToolbarFilters<T>({ table, filterFields }: { table: Table<T>, filterFields: FilterField<T>[] }) {
  const [open, setOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<FilterField<T>[]>([])
  const [activeIndex, setActiveIndex] = useState<number>()

  return (
    <div className="flex items-center gap-2">
      {selectedFields.map((field, i) => (
        <Popover key={i} open={i == activeIndex} onOpenChange={(isOpen) => {
          if (!isOpen) setActiveIndex(undefined)
        }}>
          <PopoverTrigger asChild>
            <Button variant='outline' className="flex items-center gap-1" onClick={() => setActiveIndex(i)}>
              <span>{field.label}:</span>
              <span className="opacity-50">{field.column.getFilterValue() as string}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-w-44 p-3 space-y-1" align="center">
            <div className="flex items-center justify-between">
              <Label>{field.label}</Label>
              <Button variant='ghost' size='icon' onClick={() => {
                field.column.setFilterValue(undefined)
                setSelectedFields((prev) => [...prev.filter(f => f.label != field.label)])
              }}>
                <Icons.trash className="size-4" />
              </Button>
            </div>
            <Input
              autoFocus
              size={12}
              key={field.label}
              placeholder={field.placeholder}
              value={field.column.getFilterValue() as string} onChange={(e) => field.column.setFilterValue(e.target.value)}
            />
          </PopoverContent>
        </Popover>
      ))}

      {selectedFields.length != filterFields.length && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="capitalize"
            >
              <CaretSortIcon
                className="mr-1 size-4 shrink-0"
                aria-hidden="true"
              />
              Tilføj filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[12.5rem] p-0" align="center">
            <Command>
              <CommandInput placeholder="Filtrer på..." />
              <CommandList>
                <CommandEmpty>Ingen filtrer fundet.</CommandEmpty>
                <CommandGroup>
                  {filterFields
                    .filter(
                      (field) =>
                        !selectedFields.some(
                          (selectedField) => selectedField.label === field.label
                        )
                    )
                    .map((field) => (
                      <CommandItem
                        key={field.label}
                        className="capitalize"
                        value={field.label}
                        onSelect={(currentValue) => {
                          setOpen(false)
                          setSelectedFields((prev) => {
                            return [...prev, { ...field }]
                          })
                          setActiveIndex(selectedFields.length)
                        }}
                      >
                        {field.options?.length ?? 0 > 0 ? (
                          <ListIcon
                            className="mr-2 size-4"
                            aria-hidden="true"
                          />
                        ) : (
                          <TextIcon className="mr-2 size-4" aria-hidden="true" />
                        )}
                        {field.label}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {selectedFields.length > 0 && (
        <Button variant='ghost' className="gap-1" onClick={() => {
          setSelectedFields([])
          table.setColumnFilters([])
        }}>
          <Icons.cross className="size-4" />
          <span>Nulstil</span>
        </Button>
      )}
    </div>
  )
}
