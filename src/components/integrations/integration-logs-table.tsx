'use client'

import {
	getEventType,
	getTableIntegrationLogsColumns,
	getTableIntegrationLogsFilters,
} from '@/app/[lng]/(site)/administration/firma/integrationer/integration-log-columns'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { useUrlFiltering } from '@/hooks/use-url-filtering'
import { useUrlGlobalFiltering } from '@/hooks/use-url-global-filtering'
import { useUrlSorting } from '@/hooks/use-url-sorting'
import { IntegrationLog } from '@/lib/database/schema/integrations'
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
	Updater,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { TableGroupedCell } from '../table/table-grouped-cell'
import { TableHeaderGroup } from '../table/table-header-group'
import { TablePagination } from '../table/table-pagination'
import { TableToolbar } from '../table/table-toolbar'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../ui/table'

const COLUMN_FILTERS_ENABLED = true
const ROW_PER_PAGE = [25, 50, 75, 100]

interface Props {
	data: IntegrationLog[]
}

export function TableIntegrationLogs({ data }: Props) {
	const LOCALSTORAGE_KEY = 'integration_logs_cols'
	const FILTERS_KEY = 'integration_logs_filters'
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'organisation', {
		keyPrefix: 'integration-logs.table',
	})
	const columns = useMemo(() => getTableIntegrationLogsColumns(t), [t])

	const mutableSearchParams = new URLSearchParams(useSearchParams())
	const [globalFilter, handleGlobalFilterChange] =
		useUrlGlobalFiltering(mutableSearchParams)
	const [sorting, handleSortingChange] = useUrlSorting(mutableSearchParams)
	const [columnFilters, handleColumnFiltersChange] = useUrlFiltering(
		mutableSearchParams,
		[],
	)
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

		groupedColumnMode: 'reorder',

		onColumnFiltersChange: handleColumnFiltersChange,
		onSortingChange: handleSortingChange,
		onColumnVisibilityChange: handleVisibilityChange,
		onGlobalFilterChange: handleGlobalFilterChange,

		enableColumnFilters: COLUMN_FILTERS_ENABLED,

		autoResetExpanded: false,
		filterFromLeafRows: false,

		state: {
			globalFilter,
			columnFilters,
			sorting,
			columnVisibility,
		},
	})

	const filterFields = useMemo(
		() => getTableIntegrationLogsFilters(table, t),
		[table, t],
	)

	if (!mounted) {
		return null
	}

	return (
		<div>
			<TableToolbar
				table={table}
				options={{ showExport: false, showHideShow: true }}
				filterFields={filterFields}
				filterLocalStorageKey={FILTERS_KEY}
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
							table.getRowModel().rows.map(row => {
								const eventType = getEventType(row)
								return (
									<TableRow
										className={cn(
											(row.original.status == 'error' ||
												eventType == 'productEvent_delete') &&
												'bg-destructive/10 border-b-destructive/15 hover:bg-destructive/15 data-[state=selected]:bg-destructive/20',
										)}
										key={row.id}
										data-state={row.getIsSelected() && 'selected'}>
										<TableGroupedCell row={row} />
									</TableRow>
								)
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className={cn('h-24 text-center')}>
									Ingen logs fundet
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
