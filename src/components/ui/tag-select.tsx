'use client'

import { Loader2, X } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Command as CommandPrimitive } from 'cmdk'
import { Dispatch, SetStateAction } from 'react'

type Item = Record<'value' | 'label', string>

interface Props {
	searchValue: string
	setSearchValue: Dispatch<SetStateAction<string>>
	selectedItems: Item[]
	setSelectedItems: Dispatch<SetStateAction<Item[]>>
	items: Item[]
	placeholder: string
	isLoading?: boolean
	isDisabled?: boolean
	onChange?: (items: Item[]) => void
}

export function TagSelect({
	items,
	selectedItems,
	setSelectedItems,
	searchValue,
	setSearchValue,
	placeholder = 'Søg...',
	isLoading = false,
	isDisabled = false,
	onChange,
}: Props) {
	const inputRef = React.useRef<HTMLInputElement>(null)
	const [open, setOpen] = React.useState(false)

	const handleUnselect = React.useCallback((item: Item) => {
		setSelectedItems(prev => prev.filter(s => s.value !== item.value))
	}, [])

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current
			if (input) {
				if (e.key === 'Delete' || e.key === 'Backspace') {
					if (input.value === '') {
						setSelectedItems(prev => {
							const newSelected = [...prev]
							newSelected.pop()
							if (onChange) onChange(newSelected)
							return newSelected
						})
					}
				}
				// This is not a default behaviour of the <input /> field
				if (e.key === 'Escape') {
					input.blur()
				}
			}
		},
		[],
	)

	return (
		<Command
			onKeyDown={handleKeyDown}
			className='overflow-visible bg-transparent'>
			<div className='group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'>
				<div className='flex flex-wrap gap-1'>
					{selectedItems.map(items => {
						return (
							<Badge key={items.value} variant='secondary'>
								{items.label}
								<button
									className='ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2'
									onKeyDown={e => {
										if (e.key === 'Enter') {
											handleUnselect(items)
										}
									}}
									onMouseDown={e => {
										e.preventDefault()
										e.stopPropagation()
									}}
									onClick={() => handleUnselect(items)}>
									<X className='h-3 w-3 text-muted-foreground dark:text-background/80 hover:text-foreground' />
								</button>
							</Badge>
						)
					})}
					{/* Avoid having the "Search" Icon */}
					<CommandPrimitive.Input
						disabled={isLoading || isDisabled}
						ref={inputRef}
						value={searchValue}
						onValueChange={setSearchValue}
						onBlur={() => setOpen(false)}
						onFocus={() => setOpen(true)}
						placeholder={placeholder}
						className='flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:opacity-50'
					/>
					{isLoading && (
						<Loader2 className='animate-spin size-4 mt-0.5 text-muted-foreground' />
					)}
				</div>
			</div>
			<div className='relative mt-2'>
				<CommandList>
					{open && items.length > 0 ? (
						<div className='absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in'>
							<CommandGroup className='h-full overflow-auto'>
								{items.map(items => {
									return (
										<CommandItem
											key={items.value}
											onMouseDown={e => {
												e.preventDefault()
												e.stopPropagation()
											}}
											onSelect={() => {
												setSearchValue('')
												setSelectedItems(prev => {
													if (onChange) onChange([...prev, items])
													return [...prev, items]
												})
											}}
											className={'cursor-pointer'}>
											{items.label}
										</CommandItem>
									)
								})}
							</CommandGroup>
						</div>
					) : null}
				</CommandList>
			</div>
		</Command>
	)
}
