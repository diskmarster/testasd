'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '../ui/button'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '../ui/drawer'
import { Icons } from '../ui/icons'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { ScrollArea } from '../ui/scroll-area'

export type Option = {
	label: string
	sub?: string
	value: string
}

export function DrawerList({
	title,
	options,
	selected,
	option,
	onSelect,
	searchable = false,
	placeholder,
	children,
}: PropsWithChildren<{
	title?: string
	options: Option[]
	selected: Option['value']
	searchable?: boolean
	placeholder?: string
	option?: React.ComponentType<{ option: Option; selected: boolean }>
	onSelect: (option: Option) => void
}>) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')

	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [debouncedSearch] = useDebounce(search, 500)
	const [filteredOptions, setFilteredOptions] = useState<Option[]>(options)

	function handleOnSelect(option: Option) {
		setOpen(false)
		onSelect(option)
	}

	function opt({ option, selected }: { option: Option; selected: boolean }) {
		return (
			<div
				className={cn(
					'px-3 py-2 min-h-14 flex flex-col justify-center',
					selected && 'bg-muted',
				)}>
				<p className='font-medium text-sm line-clamp-1'>{option.label}</p>
				{option.sub && (
					<p className='text-muted-foreground line-clamp-1 text-sm'>
						{option.sub}
					</p>
				)}
			</div>
		)
	}

	const Option = option ? option : opt

	const filterOptions = useCallback(
		(searchQuery: string) => {
			setFilteredOptions(
				options.filter(o => {
					return (
						o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
						o.sub?.toLowerCase().includes(searchQuery.toLowerCase())
					)
				}),
			)
		},
		[options],
	)

	useEffect(() => {
		filterOptions(debouncedSearch)
	}, [debouncedSearch])

	return (
		<Drawer
			open={open}
			onOpenChange={bool => {
				setOpen(bool)
				setSearch('')
			}}>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{title ? title : t('drawerList.title')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-4 flex flex-col gap-4'>
					{searchable && (
						<div className='grid'>
							<InputGroup autoFocus={false}>
								<InputGroupInput
									role='search'
									type='search'
									autoFocus={false}
									className='h-12'
									value={search}
									placeholder={
										placeholder
											? placeholder
											: t('drawerList.searchPlaceholder')
									}
									onChange={e => setSearch(e.target.value)}
								/>
								<InputGroupAddon align='inline-end'>
									<Icons.search />
								</InputGroupAddon>
							</InputGroup>
						</div>
					)}
					<ScrollArea
						maxHeight={searchable ? 'max-h-64' : 'max-h-96'}
						className='border rounded-lg flex shadow-md h-full [&>div>div]:divide-y'>
						{filteredOptions.map(opt => (
							<div key={opt.value} onClick={() => handleOnSelect(opt)}>
								<Option option={opt} selected={opt.value === selected} />
							</div>
						))}
					</ScrollArea>
				</div>
				<DrawerFooter>
					<DrawerClose>
						<Button type='button' variant='outline'>
							{t('drawerList.closeButton')}
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
