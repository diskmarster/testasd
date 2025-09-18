'use client'

import { refreshTableAction } from '@/app/actions'
import { useTranslation } from '@/app/i18n/client'
import TableToolbarFilters from '@/components/table/table-filters'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icons } from '@/components/ui/icons'
import { LanguageContext } from '@/context/language'
import { exportTableToCSV } from '@/lib/export/csv'
import { cn } from '@/lib/utils'
import { Column, Table } from '@tanstack/react-table'
import { t } from 'i18next'
import { usePathname } from 'next/navigation'
import { ReactElement, useContext, useState, useTransition } from 'react'

type ToolbarOptions = {
	showExport?: boolean
	showHideShow?: boolean
}
type FilterOption = {
	label: string
	value: any
	icon?: ReactElement
}

export type NumberRange = {
	from: number | undefined
	to?: number | undefined
}

export type FilterField<TRow> = {
	column: Column<TRow> | undefined
	type: 'text' | 'date' | 'select' | 'date-range' | 'number-range'
	label: string
	value: any
	placeholder?: string
	options?: FilterOption[]
	numRange?: NumberRange
	facetedUniqueColumnId?: string
}

interface Props<T> {
	table: Table<T>
	options?: ToolbarOptions
	filterFields?: FilterField<T>[]
	filterLocalStorageKey?: string
	defaultGlobalFilter?: string
}

export function TableToolbar<T>({
	table,
	options,
	filterFields = [],
	filterLocalStorageKey,
	defaultGlobalFilter = '',
}: Props<T>) {
	return (
		<div className='flex items-center gap-2 py-4'>
			<div className='mr-auto max-sm:overflow-y-auto'>
				<TableToolbarFilters
					table={table}
					filterFields={filterFields}
					filterLocalStorageKey={filterLocalStorageKey}
					defaultGlobalFilter={defaultGlobalFilter}
				/>
			</div>
			{options && (
				<div className='ml-auto flex items-center gap-2'>
					<ButtonRefreshOverview />
					{options.showExport && <DownloadButton table={table} />}
					{options.showHideShow && <ViewOptions table={table} />}
				</div>
			)}
		</div>
	)
}

function DownloadButton<T>({ table }: { table: Table<T> }) {
	const [pending, startTransition] = useTransition()
	const lng = useContext(LanguageContext)
	const { t } = useTranslation(lng, 'other')
	return (
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
			}}
			tooltip={t('tooltips.download-inventory')}>
			{pending ? (
				<Icons.spinner className='size-4 animate-spin' />
			) : (
				<Icons.download className='size-4' />
			)}
		</Button>
	)
}

export function ViewOptions<T>({ table }: { table: Table<T> }) {
	const lng = useContext(LanguageContext)
	const { t } = useTranslation(lng, 'common')
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='outline'
					size='icon'
					tooltip={t('tooltips.show-hide-show')}>
					<Icons.columns className='size-4' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-auto'>
				<DropdownMenuLabel>
					{t('table-toolbar.show-hide-columns')}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter(
						column =>
							typeof column.accessorFn !== 'undefined' && column.getCanHide(),
					)
					.map(column => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className='capitalize'
								checked={column.getIsVisible()}
								onCheckedChange={value => column.toggleVisibility(!!value)}
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
export function ButtonRefreshOverview() {
	const [isAnimating, setIsAnimating] = useState(false)
	const [pending, startTransition] = useTransition()
	const pathName = usePathname()

	const onSubmit = () => {
		setIsAnimating(true)
		setTimeout(() => {
			setIsAnimating(false)
		}, 600)
		startTransition(async () => {
			await refreshTableAction({ pathName })
		})
	}

	return (
		<>
			<Button
				tabIndex={-1}
				size='icon'
				type='button'
				variant='outline'
				className='flex items-center justify-center'
				onClick={onSubmit}
				disabled={pending}
				tooltip={t('tooltips.refresh')}>
				<Icons.refresh
					className={cn('size-4', isAnimating && 'animate-spin-refresh')}
				/>
			</Button>
		</>
	)
}
