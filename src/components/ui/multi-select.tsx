'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import * as React from 'react'

export type Option = {
	label: string
	value: string
	disabled?: boolean
}

type MultiSelectProps = {
	options: Option[]
	selected: string[]
	onChange: (values: string[], option: Option) => void
	placeholder?: string
	searchPlaceholder?: string
	emptyMessage?: string
	disabled?: boolean
	isLoading?: boolean
	className?: string
	maxDisplayItems?: number
}

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = 'Select options',
	searchPlaceholder = 'Search options...',
	emptyMessage = 'No options found.',
	disabled = false,
	isLoading = false,
	className,
	maxDisplayItems,
}: MultiSelectProps) {
	const [open, setOpen] = React.useState(false)

	const handleUnselect = (value: string) => {
		const option = options.find(option => option.value === value)
		if (!option) return
		onChange(
			selected.filter(item => item !== value),
			option,
		)
	}

	const handleSelect = (value: string) => {
		const option = options.find(option => option.value === value)
		if (!option) return
		if (option.disabled) return

		if (selected.includes(value)) {
			onChange(
				selected.filter(item => item !== value),
				option,
			)
		} else {
			onChange([...selected, value], option)
		}
	}

	const displaySelected =
		maxDisplayItems && selected.length > maxDisplayItems
			? selected.slice(0, maxDisplayItems)
			: selected

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					role='combobox'
					aria-expanded={open}
					className={cn(
						'min-h-9 h-auto w-full justify-between px-3',
						className,
					)}
					disabled={disabled || isLoading}>
					<div className='flex flex-wrap gap-1'>
						{selected.length === 0 && (
							<span className='text-muted-foreground'>{placeholder}</span>
						)}
						{displaySelected.map(value => {
							const option = options.find(option => option.value === value)
							return (
								<Badge key={value} variant='lessGray' className='capitalize'>
									{option?.label}
									<div
										className='ml-1 grid place-items-center p-0 hover:bg-muted/50 rounded-sm'
										onClick={e => {
											e.stopPropagation()
											handleUnselect(value)
										}}
										aria-label={`Remove ${option?.label}`}>
										<X className='h-3 w-3' />
									</div>
								</Badge>
							)
						})}
						{maxDisplayItems && selected.length > maxDisplayItems && (
							<Badge variant='secondary' className='mb-1'>
								+{selected.length - maxDisplayItems} more
							</Badge>
						)}
					</div>
					<ChevronsUpDown className='size-3 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-full p-0' align='start'>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup className='max-h-64 overflow-auto'>
							{options.map(option => {
								const isSelected = selected.includes(option.value)
								return (
									<CommandItem
										key={option.value}
										value={option.value}
										onSelect={() => handleSelect(option.value)}
										disabled={option.disabled}
										className={cn(
											'flex items-center gap-2 capitalize',
											option.disabled && 'cursor-not-allowed opacity-60',
										)}>
										<div
											className={cn(
												'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
												isSelected
													? 'bg-primary text-primary-foreground'
													: 'opacity-50',
											)}>
											{isSelected && <Check className='h-3 w-3' />}
										</div>
										<span>{option.label}</span>
									</CommandItem>
								)
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
