import React, { SetStateAction, useEffect, useState } from 'react'

import { Command as CommandPrimitive } from 'cmdk'
import { useDebounce, useDebouncedCallback } from 'use-debounce'
import { FilterField } from '@/components/table/table-toolbar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Table } from '@tanstack/react-table'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { ScrollArea } from '../ui/scroll-area'

type TableToolbarFiltersProps<T> = {
  table: Table<T>
  filterFields: FilterField<T>[]
}

function TableToolbarFilters<T>({
  table,
  filterFields,
}: TableToolbarFiltersProps<T>) {
  const [open, setOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<FilterField<T>[]>(
    filterFields.filter(f =>
      table.getState().columnFilters.some(cf => cf.id == f.column?.id),
    ),
  )
  const [activeIndex, setActiveIndex] = useState<number>()

  const handleClearAllFilters = () => {
    setSelectedFields([])
    table.setColumnFilters([])
  }

  const handleSelectField = (field: FilterField<T>) => {
    setOpen(false)
    setSelectedFields(prev => [...prev, { ...field }])
    setActiveIndex(selectedFields.length)
  }

  const handleRemoveField = (field: FilterField<T>) => {
    field.column?.setFilterValue(undefined)
    setSelectedFields(prev => prev.filter(f => f.label !== field.label))
  }

  return (
    <div className='flex items-center gap-2'>
      {selectedFields.map((field, i) => (
        <FilterPopover
          key={i}
          field={field}
          isActive={i === activeIndex}
          setActiveIndex={setActiveIndex}
          onRemoveField={handleRemoveField}
          index={i}
        />
      ))}

      {selectedFields.length !== filterFields.length && (
        <AddFilterPopover
          open={open}
          setOpen={setOpen}
          filterFields={filterFields}
          selectedFields={selectedFields}
          onSelectField={handleSelectField}
        />
      )}

      {selectedFields.length > 0 && (
        <Button
          variant='ghost'
          className='gap-1'
          onClick={handleClearAllFilters}>
          <Icons.cross className='size-4' />
          <span className='hidden md:block'>Nulstil</span>
        </Button>
      )}
    </div>
  )
}

function FilterPopover<T>({
  field,
  isActive,
  setActiveIndex,
  onRemoveField,
  index,
}: {
  field: FilterField<T>
  isActive: boolean
  setActiveIndex: (index?: number) => void
  onRemoveField: (field: FilterField<T>) => void
  index: number
}) {
  const [value, setSearched] = useState<string>('')
  const [selectValue, setSelectValue] = useState<string[]>((field.column?.getFilterValue() ?? []) as any[])
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })

  const isSelect = field.type === 'select'
  const isDateRange = field.type === 'date-range'

  const getSelectDisplayValue = (value: any[]): string => {
    if (value.length == 0) {
      return `Vælg ${field.label.toLowerCase()}`
    }

    return value
      .map((val: any) => field.options?.find(opt => opt.value === val)?.label)
      .filter(Boolean)
      .join(', ')
  }

  const getDateRangeDisplayValue = (range: DateRange): string => {
    if (!range || (!range.from && !range.to)) return 'Vælg datoer'
    if (range.from && !range.to)
      return `${format(range.from, 'dd/MM/yyyy')}`
    if (range.from && range.to)
      return `${format(range.from, 'dd/MM/yyyy')} - ${format(range.to, 'dd/MM/yyyy')}`
    return 'Vælg datoer'
  }

  const filterDisplayValue: string = isSelect
    ? getSelectDisplayValue(selectValue)
    : isDateRange
      ? getDateRangeDisplayValue(date as DateRange)
      : (value as string) || ''

  return (
    <Popover
      open={isActive}
      onOpenChange={isOpen => !isOpen && setActiveIndex(undefined)}>
      <PopoverTrigger asChild>
        <div className='relative group'>
          <div
            onClick={() => onRemoveField(field)}
            className='size-4 rounded-full cursor-pointer bg-foreground flex items-center justify-center absolute -right-1.5 -top-1.5 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <Icons.cross strokeWidth={3} className='size-3 text-background' />
          </div>
          <Button
            variant='outline'
            className={cn(
              'flex items-center gap-1 max-w-56',
              field.type == 'date-range' && 'max-w-72',
              field.type == 'select' && 'max-w-72',
            )}
            onClick={() => setActiveIndex(isActive ? undefined : index)}>
            <span>{field.label}:</span>
            <span className='opacity-50 truncate'>{filterDisplayValue}</span>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'space-y-1 p-2 max-w-56',
          field.type === 'date' && 'w-auto p-0 max-w-max',
          field.type === 'date-range' && 'w-auto p-0 max-w-max',
        )}
        align='center'>
        {field.type === 'text' ? (
          <FilterText field={field} search={value} setSearched={setSearched} />
        ) : field.type === 'select' ? (
          <FilterSelect field={field} setSelectedValues={setSelectValue} selectedValues={selectValue} />
        ) : field.type === 'date-range' ? (
          <FilterDateRange field={field} date={date} setDate={setDate} />
        ) : (
          'Unsupported type'
        )}
      </PopoverContent>
    </Popover>
  )
}

function FilterText<T>({ field, search, setSearched }: { field: FilterField<T>, search: string, setSearched: React.Dispatch<React.SetStateAction<string>> }) {
  const debouncedSeteFilter = useDebouncedCallback((val) => {
    field.column?.setFilterValue(val)
  }, 250)

  return (
    <Input
      autoFocus
      size={12}
      placeholder={field.placeholder}
      value={search}
      onChange={e => {
        setSearched(e.target.value)
        debouncedSeteFilter(e.target.value)
      }}
    />
  )
}

/**
  * Remember to include filterFn in columnDef
  * FilterFn implements filtering by one day or a date range
  *
    filterFn: (row, id, value: DateRange) => {
      const rowDate: string | number | Date = row.getValue(id)

      if (!value.from && !value.to) {
        return true
      }

      if (value.from && !value.to) {
        return isSameDay(rowDate, value.from)
      }

      return isAfter(rowDate, value.from) && isBefore(rowDate, value.to)
    },
  */
function FilterDateRange<T>({ field, date, setDate }: { field: FilterField<T>, date: DateRange | undefined, setDate: React.Dispatch<SetStateAction<DateRange | undefined>> }) {
  const debouncedCallback = useDebouncedCallback(val => field.column?.setFilterValue(val), 500)

  return (
    <Calendar mode='range' selected={date} onSelect={(dateRange) => {
      setDate(dateRange)
      debouncedCallback(dateRange)
    }} initialFocus />
  )
}

function FilterSelect<T>({ field, selectedValues, setSelectedValues }: { field: FilterField<T>, selectedValues: string[], setSelectedValues: React.Dispatch<React.SetStateAction<string[]>> }) {
  const [search, setSearch] = useState<string>('')
  const facets = field.column?.getFacetedUniqueValues()
  const debouncedSetFilter = useDebouncedCallback((val) => field.column?.setFilterValue(val), 500)

  const filtered = field.options?.filter(f => f.value.toString().toLowerCase().includes(search.toLowerCase())).slice(0, 20)

  return (
    <Command>
      <CommandInput value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>Ingen valgmuligheder</CommandEmpty>
        <ScrollArea maxHeight='max-h-52'>
          <CommandGroup>
            {filtered && filtered.map(option => {

              const isSelected = selectedValues.some(val => val == option.value)
              return (
                <CommandItem
                  value={option.value}
                  key={option.label}
                  onSelect={() => {
                    if (isSelected) {
                      const newSelected = selectedValues.filter(val => val != option.value)
                      debouncedSetFilter(newSelected.length == 0 ? undefined : newSelected)
                      setSelectedValues(newSelected)
                    } else {
                      const newSelected = [...selectedValues, option.value]
                      debouncedSetFilter(newSelected)
                      setSelectedValues(newSelected)
                    }
                  }}>
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )}>
                    <Icons.check className={cn('h-4 w-4')} />
                  </div>
                  {option.icon && (
                    <option.icon className='mr-2 h-4 w-4 text-muted-foreground' />
                  )}
                  <span>{option.label}</span>
                  {facets?.get(option.value) && (
                    <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                      {facets.get(option.value)}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </ScrollArea>
        {selectedValues.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => field.column?.setFilterValue(undefined)}
                className='justify-center text-center'>
                Nulstil filter
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}

function AddFilterPopover<T>({
  open,
  setOpen,
  filterFields,
  selectedFields,
  onSelectField,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  filterFields: FilterField<T>[]
  selectedFields: FilterField<T>[]
  onSelectField: (field: FilterField<T>) => void
}) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' className='capitalize'>
          <Icons.chevronDownUp
            className='mr-1 size-3.5 shrink-0'
            aria-hidden='true'
          />
          Tilføj filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[12.5rem] p-0' align='center'>
        <Command>
          <CommandList>
            <CommandEmpty>Ingen filtrer fundet.</CommandEmpty>
            <CommandGroup>
              {filterFields
                .filter(
                  field =>
                    !selectedFields.some(
                      selectedField => selectedField.label === field.label,
                    ),
                )
                .map(field => (
                  <CommandItem
                    key={field.label}
                    className='capitalize'
                    value={field.label}
                    onSelect={() => onSelectField(field)}>
                    {(field.options?.length ?? 0 > 0) ? (
                      <Icons.list className='mr-2 size-4' aria-hidden='true' />
                    ) : field.type === 'text' ? (
                      <Icons.text className='mr-2 size-4' aria-hidden='true' />
                    ) : (
                      <Icons.calendar
                        className='mr-2 size-4'
                        aria-hidden='true'
                      />
                    )}
                    {field.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default TableToolbarFilters
