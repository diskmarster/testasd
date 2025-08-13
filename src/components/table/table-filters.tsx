import React, { SetStateAction, useEffect, useState } from 'react'

import { useTranslation } from '@/app/i18n/client'
import { FilterField, NumberRange } from '@/components/table/table-toolbar'
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
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { Table } from '@tanstack/react-table'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useDebouncedCallback } from 'use-debounce'
import { ScrollArea } from '../ui/scroll-area'

type TableToolbarFiltersProps<T> = {
	table: Table<T>
	filterFields: FilterField<T>[]
	filterLocalStorageKey?: string
	defaultGlobalFilter: string
}

function TableToolbarFilters<T>({
	table,
	filterFields,
	filterLocalStorageKey,
	defaultGlobalFilter,
}: TableToolbarFiltersProps<T>) {
	const [open, setOpen] = useState(false)
	const [selectedFields, setSelectedFields] = useState<FilterField<T>[]>(
		filterFields.filter(f =>
			table.getState().columnFilters.some(cf => cf.id == f.column?.id),
		),
	)

	useEffect(() => {
		if (filterLocalStorageKey) {
			const savedFilters: string[] = JSON.parse(
				localStorage.getItem(filterLocalStorageKey) || '[]',
			)
			if (selectedFields.length > 0) {
				selectedFields.forEach(sf => savedFilters.push(sf.column?.id || ''))
			}
			const unqFilters = new Set(savedFilters)
			const fields = filterFields.filter(ff =>
				unqFilters.has(ff.column?.id || ''),
			)
			setSelectedFields(fields)
		}
	}, [filterLocalStorageKey])

	const [activeIndex, setActiveIndex] = useState<number>()

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'common')

	const handleClearAllFilters = () => {
		setSelectedFields([])
		table.setColumnFilters([])
		table.setGlobalFilter('')
		if (filterLocalStorageKey) localStorage.removeItem(filterLocalStorageKey)
	}

	const handleSelectField = (field: FilterField<T>) => {
		setOpen(false)
		setSelectedFields(prev => {
			const newFields = [...prev, { ...field }]
			const fieldIDs = newFields.map(f => f.column?.id)
			if (filterLocalStorageKey)
				localStorage.setItem(filterLocalStorageKey, JSON.stringify(fieldIDs))
			return newFields
		})
		setActiveIndex(selectedFields.length)
	}

	const handleRemoveField = (field: FilterField<T>) => {
		field.column?.setFilterValue(undefined)
		setSelectedFields(prev => {
			const newFields = prev.filter(f => f.label !== field.label)
			const fieldIDs = newFields.map(f => f.column?.id)
			if (filterLocalStorageKey)
				localStorage.setItem(filterLocalStorageKey, JSON.stringify(fieldIDs))
			return newFields
		})
	}

	return (
		<div className='flex items-center gap-2'>
			<GlobalFilter defaultValue={defaultGlobalFilter} table={table} t={t} />

			{selectedFields.map((field, i) => (
				<FilterPopover
					key={`${field.label}_${i}`}
					field={field}
					isActive={i === activeIndex}
					setActiveIndex={setActiveIndex}
					onRemoveField={handleRemoveField}
					index={i}
					t={t}
				/>
			))}

			{selectedFields.length !== filterFields.length && (
				<AddFilterPopover
					open={open}
					setOpen={setOpen}
					filterFields={filterFields}
					selectedFields={selectedFields}
					onSelectField={handleSelectField}
					t={t}
				/>
			)}

			{(selectedFields.length > 0 || defaultGlobalFilter != '') && (
				<Button
					variant='ghost'
					className='gap-1'
					onClick={handleClearAllFilters}>
					<Icons.cross className='size-4' />
					<span className='hidden md:block'>
						{t('table-filters.clear', {
							count:
								selectedFields.length +
								(defaultGlobalFilter.length > 0 ? 1 : 0),
						})}
					</span>
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
	t,
}: {
	field: FilterField<T>
	isActive: boolean
	setActiveIndex: (index?: number) => void
	onRemoveField: (field: FilterField<T>) => void
	index: number
	t: (key: string, opts?: any) => string
}) {
	const [value, setSearched] = useState<string>(
		(field.column?.getFilterValue() ?? '') as string,
	)
	const [selectValue, setSelectValue] = useState<string[]>(
		(field.column?.getFilterValue() ?? []) as any[],
	)
	const [date, setDate] = useState<DateRange | undefined>(
		(field.column?.getFilterValue() ?? {
			from: undefined,
			to: undefined,
		}) as DateRange | undefined,
	)

	const [numRange, setNumRange] = useState<NumberRange>(
		(field.column?.getFilterValue() ?? {
			from: undefined,
			to: undefined,
		}) as NumberRange,
	)

	const isSelect = field.type === 'select'
	const isDateRange = field.type === 'date-range'
	const isNumberRange = field.type === 'number-range'

	const getSelectDisplayValue = (value: any[]): string => {
		if (value.length == 0) {
			return `${t('table-filters.choose')} ${field.label.toLowerCase()}`
		}

		return value
			.map(
				(val: any) =>
					field.options?.find(opt => opt.value === val)?.label ||
					`${t('table-filters.choose')} ${field.label.toLowerCase()}`,
			)
			.filter(Boolean)
			.join(', ')
	}

	const getNumberRangeDisplayValue = (value: NumberRange): string => {
		const { from, to } = value

		if (from == undefined && to == undefined) {
			return t('table-filters.number-range-empty', { label: field.label })
		} else if (from == undefined && to != undefined) {
			return t('table-filters.number-range-to', { to })
		} else if (from != undefined && to == undefined) {
			return t('table-filters.number-range-from', { from })
		} else {
			return t('table-filters.number-range-both', { from, to })
		}
	}

	const getDateRangeDisplayValue = (range: DateRange): string => {
		if (!range || (!range.from && !range.to))
			return t('table-filters.choose-dates')
		if (range.from && !range.to) return `${format(range.from, 'dd/MM/yyyy')}`
		if (range.from && range.to)
			return `${format(range.from, 'dd/MM/yyyy')} - ${format(range.to, 'dd/MM/yyyy')}`
		return t('table-filters.choose-dates')
	}

	const getTextFilterDisplayValue = (value: string): string => {
		if (value == '') {
			return `${t('table-filters.search')} ${field.label.toLowerCase()}`
		} else {
			return value
		}
	}

	const filterDisplayValue: string = isSelect
		? getSelectDisplayValue(selectValue)
		: isDateRange
			? getDateRangeDisplayValue(date as DateRange)
			: isNumberRange
				? getNumberRangeDisplayValue(numRange)
				: getTextFilterDisplayValue(value as string) || ''

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
							field.type == 'number-range' && 'max-w-96',
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
					field.type === 'number-range' && 'max-w-48',
				)}
				align='center'>
				{field.type === 'text' ? (
					<FilterText field={field} search={value} setSearched={setSearched} />
				) : field.type === 'select' ? (
					<FilterSelect
						field={field}
						setSelectedValues={setSelectValue}
						selectedValues={selectValue}
						t={t}
					/>
				) : field.type === 'date-range' ? (
					<FilterDateRange field={field} date={date} setDate={setDate} />
				) : field.type === 'number-range' ? (
					<FilterNumberRange
						field={field}
						numberRange={numRange}
						setNumberRange={setNumRange}
						t={t}
					/>
				) : (
					'Unsupported type'
				)}
			</PopoverContent>
		</Popover>
	)
}

function FilterNumberRange<T>({
	field,
	numberRange,
	setNumberRange,
	t,
}: {
	field: FilterField<T>
	numberRange: NumberRange
	setNumberRange: React.Dispatch<React.SetStateAction<NumberRange>>
	t: (key: string) => string
}) {
	const debouncedSeteFilter = useDebouncedCallback((val: NumberRange) => {
		field.column?.setFilterValue(val)
	}, 250)

	return (
		<div className='flex items-center justify-between gap-3'>
			<Input
				autoFocus
				placeholder={field.placeholder}
				type='number'
				value={numberRange.from?.toString() ?? ''}
				className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
				onChange={e => {
					setNumberRange(prev => ({
						from: !isNaN(e.target.valueAsNumber)
							? e.target.valueAsNumber
							: undefined,
						to: prev.to,
					}))
					debouncedSeteFilter({
						from: !isNaN(e.target.valueAsNumber)
							? e.target.valueAsNumber
							: undefined,
						to: numberRange.to,
					})
				}}
			/>
			<span className='text-sm text-muted-foreground'>
				{t('table-filters.number-range')}
			</span>
			<Input
				placeholder={field.placeholder}
				type='number'
				value={numberRange.to?.toString() ?? ''}
				className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
				onChange={e => {
					setNumberRange(prev => ({
						from: prev.from,
						to: !isNaN(e.target.valueAsNumber)
							? e.target.valueAsNumber
							: undefined,
					}))
					debouncedSeteFilter({
						from: numberRange.from,
						to: !isNaN(e.target.valueAsNumber)
							? e.target.valueAsNumber
							: undefined,
					})
				}}
			/>
		</div>
	)
}

function FilterText<T>({
	field,
	search,
	setSearched,
}: {
	field: FilterField<T>
	search: string
	setSearched: React.Dispatch<React.SetStateAction<string>>
}) {
	const debouncedSeteFilter = useDebouncedCallback((val: string) => {
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

function GlobalFilter<T>({
	table,
	t,
	defaultValue,
}: {
	table: Table<T>
	t: (key: string, opts?: any) => string
	defaultValue: string
}) {
	const [search, setSearch] = useState<string>(defaultValue)
	const debouncedSeteFilter = useDebouncedCallback((val: string) => {
		table.setGlobalFilter(val)
	}, 250)

	const [isFocused, setIsFocsued] = useState(false)

	useEffect(() => {
		setSearch(table.getState().globalFilter)
	}, [table.getState().globalFilter])

	return (
		<div className='relative'>
			<Icons.search
				className={cn(
					'transition-all absolute right-1/2 top-1/2 size-4 -translate-y-1/2 translate-x-1/2 pointer-events-none',
					(isFocused || search != '') &&
						'right-3 translate-x-0 rotate-90 text-muted-foreground',
				)}
			/>
			<Input
				type='text'
				size={12}
				placeholder={t('table-filters.search-placeholder')}
				id='table-searchbar'
				className={cn(
					'transition-all w-9 placeholder:opacity-0 cursor-pointer',
					isFocused && 'w-52 placeholder:opacity-100 cursor-text',
					search != '' && 'min-w-52 w-fit cursor-text',
					!isFocused && search == '' && 'hover:bg-accent',
				)}
				onFocus={() => setIsFocsued(true)}
				onBlur={() => setIsFocsued(false)}
				value={search}
				onChange={e => {
					setSearch(e.target.value)
					debouncedSeteFilter(e.target.value)
				}}
			/>
		</div>
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
function FilterDateRange<T>({
	field,
	date,
	setDate,
}: {
	field: FilterField<T>
	date: DateRange | undefined
	setDate: React.Dispatch<SetStateAction<DateRange | undefined>>
}) {
	const debouncedCallback = useDebouncedCallback(
		(val: DateRange | undefined) => field.column?.setFilterValue(val),
		500,
	)

	return (
		<Calendar
			mode='range'
			selected={date}
			onSelect={dateRange => {
				setDate(dateRange)
				debouncedCallback(dateRange)
			}}
			initialFocus
		/>
	)
}

function getFilterFieldFacetedUniqueValues<T>(
	field: FilterField<T>,
): Map<any, number> | undefined {
	if (field.column == undefined) {
		console.error(
			`Column for filter with label: '${field.label}' was undefined`,
		)
		return undefined
	}

	if (field.facetedUniqueColumnId == undefined) {
		return field.column?.getFacetedUniqueValues()
	}

	const uniqueColumnId = field.facetedUniqueColumnId
	const columnId = field.column?.id
	const facetedRowModel = field.column?.getFacetedRowModel()

	const map = new Map<string, any>()
	for (let row of facetedRowModel?.flatRows ?? []) {
		const unique = row.getValue(uniqueColumnId)
		const col = row.getValue(columnId)
		const key = `${unique}_${col}`

		if (!map.has(key)) {
			map.set(key, col)
		}
	}

	const customFacets = new Map<any, number>()
	for (let facet of Array.from(map.values())) {
		if (!customFacets.has(facet)) {
			customFacets.set(facet, 0)
		}

		const cur = customFacets.get(facet)!
		customFacets.set(facet, cur + 1)
	}

	return customFacets
}

function FilterSelect<T>({
	field,
	selectedValues,
	setSelectedValues,
	t,
}: {
	field: FilterField<T>
	selectedValues: string[]
	setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>
	t: (key: string) => string
}) {
	const [search, setSearch] = useState<string>('')
	const facets = getFilterFieldFacetedUniqueValues(field)
	const debouncedSetFilter = useDebouncedCallback(
		(val: string[] | undefined) => field.column?.setFilterValue(val),
		500,
	)

	const filtered = field.options
		?.filter(f =>
			f.value.toString().toLowerCase().includes(search.toLowerCase()),
		)
		.slice(0, 50)

	return (
		<Command>
			<CommandInput value={search} onValueChange={setSearch} />
			<CommandList>
				<CommandEmpty>{t('table-filters.no-filter-choice')}</CommandEmpty>
				<ScrollArea maxHeight='max-h-72'>
					<CommandGroup>
						{filtered &&
							filtered.map(option => {
								const isSelected = selectedValues.some(
									val => val == option.value,
								)
								return (
									<CommandItem
										value={option.value}
										key={option.label}
										onSelect={() => {
											if (isSelected) {
												const newSelected = selectedValues.filter(
													val => val != option.value,
												)
												debouncedSetFilter(
													newSelected.length == 0 ? undefined : newSelected,
												)
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
										<span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
											{facets?.get(option.value) ?? 0}
										</span>
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
								onSelect={() => {
									debouncedSetFilter(undefined)
									setSelectedValues([])
								}}
								className='justify-center text-center'>
								{t('table-filters.clear-filter')}
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
	t,
}: {
	open: boolean
	setOpen: (open: boolean) => void
	filterFields: FilterField<T>[]
	selectedFields: FilterField<T>[]
	onSelectField: (field: FilterField<T>) => void
	t: (key: string) => string
}) {
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' role='combobox' className='capitalize'>
					<Icons.chevronDownUp
						className='mr-1 size-3.5 shrink-0'
						aria-hidden='true'
					/>
					{t('table-filters.add-filter')}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[12.5rem] p-0' align='center'>
				<Command>
					<CommandList>
						<CommandEmpty>{t('table-filters.no-filter-found')}</CommandEmpty>
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
										) : field.type === 'number-range' ? (
											<Icons.hash className='mr-2 size-4' />
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
