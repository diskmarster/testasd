import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'

type Props<T extends string> = {
  selectedValue: T
  onSelectedValueChange: (value: T) => void
  searchValue: string
  onSearchValueChange: (value: string) => void
  items: { value: T; label: string }[]
  isLoading?: boolean
  emptyMessage?: string
  placeholder?: string
  onSelectSearchValue?: 'value' | 'label'
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  icon?: (option: { value: T; label: string }) => React.ReactNode
  iconOnInput?: boolean
}

export function AutoComplete<T extends string>({
  selectedValue,
  onSelectedValueChange,
  searchValue,
  onSearchValueChange,
  items,
  isLoading,
  emptyMessage = 'Intet fundet.',
  placeholder = 'Søg...',
  onSelectSearchValue = 'label',
  autoFocus = false,
  disabled = false,
  className = '',
  icon = undefined,
  iconOnInput = true,
}: Props<T>) {
  const [open, setOpen] = useState(false)

  const labels = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.value] = item.label
          return acc
        },
        {} as Record<string, string>,
      ),
    [items],
  )

  const selectedOption = useMemo(
    () => items.find(i => i.value == selectedValue),
    [items, selectedValue]
  )

  const reset = () => {
    setOpen(false)
    onSelectedValueChange('' as T)
    onSearchValueChange('')
  }

  const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (
      !e.relatedTarget?.hasAttribute('cmdk-list') &&
      (onSelectSearchValue == 'label'
        ? labels[selectedValue] !== searchValue
        : selectedValue !== searchValue)
    ) {
      reset()
    }
  }

  const onSelectItem = (inputValue: string) => {
    if (inputValue !== selectedValue) {
      onSelectedValueChange(inputValue as T)
      onSearchValueChange(
        onSelectSearchValue == 'label'
          ? (labels[inputValue] ?? '')
          : inputValue,
      )
    }
    setOpen(false)
  }

  return (
    <div className='flex items-center'>
      <Popover open={open} onOpenChange={setOpen}>
        <Command className='relative bg-transparent' shouldFilter={false}>
          {icon && iconOnInput && selectedOption && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
              {icon(selectedOption)}
            </div>
          )}
          <PopoverAnchor asChild>
            <CommandPrimitive.Input
              asChild
              className={cn('', className)}
              disabled={disabled}
              value={searchValue}
              onValueChange={onSearchValueChange}
              onKeyDown={e => setOpen(e.key != 'Escape' && e.key != 'Tab')}
              onMouseDown={() => setOpen(open => !!searchValue || !open)}
              //onFocus={() => setOpen(true)}
              //onBlur={onInputBlur}
              autoFocus={autoFocus}>
              <Input placeholder={placeholder} autoFocus={autoFocus} />
            </CommandPrimitive.Input>
          </PopoverAnchor>
          {!open && <CommandList aria-hidden='true' className='hidden' />}
          <PopoverContent
            asChild
            onOpenAutoFocus={e => e.preventDefault()}
            onInteractOutside={e => {
              if (
                e.target instanceof Element &&
                e.target.hasAttribute('cmdk-input')
              ) {
                e.preventDefault()
              }
            }}
            className='w-[--radix-popover-trigger-width] p-0'>
            <CommandList>
              {isLoading && (
                <CommandPrimitive.Loading>
                  <div className='p-1'>
                    <Skeleton className='h-6 w-full' />
                  </div>
                </CommandPrimitive.Loading>
              )}
              {items.length > 0 && !isLoading ? (
                <ScrollArea maxHeight='max-h-52'>
                  <CommandGroup>
                    {(items.length > 100 ? items.slice(0, 100) : items).map(
                      option => (
                        <CommandItem
                          key={option.value}
                          className={cn(
                            'capitalize grid gap-2',
                            icon ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[auto_1fr]'
                          )}
                          value={option.value}
                          onMouseDown={e => e.preventDefault()}
                          onSelect={onSelectItem}>
                          <Check
                            className={cn(
                              'size-4',
                              selectedValue === option.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {option.label}
                          {icon && (
                            <div className='size-max ml-auto'>
                              {icon(option)}
                            </div>
                          )}
                        </CommandItem>
                      ),
                    )}
                  </CommandGroup>
                </ScrollArea>
              ) : null}
              {!isLoading ? (
                <CommandEmpty>{emptyMessage ?? 'Ingen valgmuligheder'}</CommandEmpty>
              ) : null}
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  )
}
