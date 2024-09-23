import { useEffect, useState } from 'react'

import { FilterField } from '@/components/table/table-toolbar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import { CaretSortIcon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { format } from 'date-fns'

type TableToolbarFiltersProps<T> = {
  table: Table<T>
  filterFields: FilterField<T>[]
}

function TableToolbarFilters<T>({
  table,
  filterFields,
}: TableToolbarFiltersProps<T>) {
  const [open, setOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<FilterField<T>[]>([])
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
  const filterDisplayValue: string =
    field.type === 'date'
      ? field.column?.getFilterValue()
        ? format(
          new Date(field.column.getFilterValue() as string),
          'dd/MM/yyyy',
        )
        : ''
      : field.type === 'select'
        ? Array.isArray(field.column?.getFilterValue())
          // @ts-ignore
          ? field.column
            ?.getFilterValue()
            // @ts-ignore    
            .map(val => field.options?.find(opt => opt.value == val)?.label)
            .join(', ')
          : field.options?.find(
            opt => opt.label == field.column?.getFilterValue(),
          )?.label
        : (field.column?.getFilterValue() as string)

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
            className='flex items-center gap-1 max-w-56'
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
        )}
        align='center'>
        {field.type === 'text' ? (
          <Input
            autoFocus
            size={12}
            placeholder={field.placeholder}
            value={field.column?.getFilterValue() as string}
            onChange={e => field.column?.setFilterValue(e.target.value)}
          />
        ) : field.type === 'select' ? (
          <FilterSelect field={field} />
        ) : field.type === 'date' ? (
          <FilterDate field={field} />
        ) : (
          'Unsupported type'
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
  * Remember to include filterFn in columnDef
  *
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
  */
function FilterDate<T>({ field }: { field: FilterField<T> }) {
  const [date, setDate] = useState<Date>()

  useEffect(() => {
    field.column?.setFilterValue(date?.toString())
  }, [date, field])

  return (
    <Calendar mode='single' selected={date} onSelect={setDate} initialFocus />
  )
}

function FilterSelect<T>({ field }: { field: FilterField<T> }) {
  const facets = field.column?.getFacetedUniqueValues()
  const selectedValues = new Set(field.column?.getFilterValue() as string[])

  return (
    <Command>
      <CommandList>
        <CommandEmpty>Ingen valgmuligheder</CommandEmpty>
        <CommandGroup>
          {field.options?.map(option => {
            const isSelected = selectedValues.has(option.value)
            return (
              <CommandItem
                key={option.label}
                onSelect={() => {
                  if (isSelected) {
                    selectedValues.delete(option.value)
                  } else {
                    selectedValues.add(option.value)
                  }
                  field.column?.setFilterValue(
                    Array.from(selectedValues).length
                      ? Array.from(selectedValues)
                      : undefined,
                  )
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
        {selectedValues.size > 0 && (
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
          <Icons.chevronDownUp className='mr-1 size-3.5 shrink-0' aria-hidden='true' />
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
