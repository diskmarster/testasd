'use client'

import {
	getTableHistoryColumns,
	getTableHistoryFilters,
} from '@/app/[lng]/(site)/historik/columns'
import { useTranslation } from '@/app/i18n/client'
import { TableGroupedCell } from '@/components/table/table-grouped-cell'
import { TablePagination } from '@/components/table/table-pagination'
import { TableToolbar } from '@/components/table/table-toolbar'
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/context/language'
import { Plan } from '@/data/customer.types'
import { HistoryWithSums } from '@/data/inventory.types'
import { useUrlFiltering } from '@/hooks/use-url-filtering'
import { useUrlGlobalFiltering } from '@/hooks/use-url-global-filtering'
import { useUrlSorting } from '@/hooks/use-url-sorting'
import { CustomerSettings } from '@/lib/database/schema/customer'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { cn } from '@/lib/utils'
import {
	getCoreRowModel,
	getExpandedRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getGroupedRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	RowSelectionState,
	Updater,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table'
import { User } from 'lucia'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { TableHeaderGroup } from '../table/table-header-group'

const ROW_SELECTION_ENABLED = true
const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]

interface Props {
	data: HistoryWithSums[]
	user: User
	plan: Plan
	units: Unit[]
	groups: Group[]
	placements: Placement[]
	batches: Batch[]
	customerSettings: CustomerSettings
}

export function TableHistory({
	data,
	user,
	plan,
	units,
	groups,
	placements,
	batches,
	customerSettings,
}: Props) {
	const LOCALSTORAGE_KEY = 'history_cols'
	const FILTERS_KEY = 'history_filters'
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'historik')
	const columns = useMemo(
		() => getTableHistoryColumns(plan, user, customerSettings, lng, t),
		[user, plan, customerSettings, lng, t],
	)
	const mutableSearchParams = new URLSearchParams(useSearchParams())

	const [globalFilter, setGlobalFilter] = useUrlGlobalFiltering(
		mutableSearchParams,
		'',
	)
	const [sorting, handleSortingChange] = useUrlSorting(mutableSearchParams)
	const [columnFilters, handleColumnFiltersChange] =
		useUrlFiltering(mutableSearchParams)
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		const visibility = JSON.parse(
			localStorage.getItem(LOCALSTORAGE_KEY) || '{}',
		)
		setColumnVisibility(visibility)
	}, [LOCALSTORAGE_KEY, setColumnVisibility])

	const handleVisibilityChange = (updaterOrValue: Updater<VisibilityState>) => {
		if (LOCALSTORAGE_KEY) {
			if (typeof updaterOrValue === 'function') {
				const currentState = JSON.parse(
					localStorage.getItem(LOCALSTORAGE_KEY) || '{}',
				)

				const updatedState = updaterOrValue(currentState)
				localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updatedState))
				setColumnVisibility(updatedState)
			} else {
				localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updaterOrValue))

				setColumnVisibility(updaterOrValue)
			}
		} else {
			setColumnVisibility(updaterOrValue)
		}
	}

	const table = useReactTable({
		data,
		columns,

		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),

		onColumnFiltersChange: handleColumnFiltersChange,
		onRowSelectionChange: setRowSelection,
		onSortingChange: handleSortingChange,
		onColumnVisibilityChange: handleVisibilityChange,
		onGlobalFilterChange: setGlobalFilter,

		enableColumnFilters: COLUMN_FILTERS_ENABLED,
		enableRowSelection: ROW_SELECTION_ENABLED,

		autoResetExpanded: false,
		filterFromLeafRows: false,

		state: {
			globalFilter,
			columnFilters,
			rowSelection,
			sorting,
			columnVisibility,
		},

		meta: {
			user,
		},
	})

	const filterFields = useMemo(
		() =>
			getTableHistoryFilters(
				plan,
				table,
				units,
				groups,
				placements,
				batches,
				user,
				customerSettings,
				t,
			),
		[
			plan,
			table,
			units,
			groups,
			placements,
			batches,
			user,
			customerSettings,
			t,
		],
	)

	if (!mounted) return null

	return (
		<div>
			<TableToolbar
				table={table}
				options={{ showExport: true, showHideShow: true }}
				filterFields={filterFields}
				filterLocalStorageKey={FILTERS_KEY}
				defaultGlobalFilter={globalFilter}
			/>
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableHeaderGroup
								key={headerGroup.id}
								headerGroup={headerGroup}
							/>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows && table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map(row => (
								<TableRow
									className={cn(
										row.original.type == 'slet' &&
											'bg-destructive/10 border-b-destructive/15 hover:bg-destructive/15 data-[state=selected]:bg-destructive/20',
									)}
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}>
									<TableGroupedCell row={row} />
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center'>
									{t('table-history.no-history')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<TablePagination table={table} pageSizes={ROW_PER_PAGE} />
		</div>
	)
}
