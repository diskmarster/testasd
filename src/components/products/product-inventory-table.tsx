'use client'

import { I18NLanguage } from '@/app/i18n/settings'
import { useLanguage } from '@/context/language'
import { stringSortingFn } from '@/lib/tanstack/filter-fns'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import {
	ColumnDef,
	getCoreRowModel,
	getExpandedRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getGroupedRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { TableGroupedCell } from '../table/table-grouped-cell'
import { TableHeader as TableHeaderCell } from '../table/table-header'
import { TableHeaderGroup } from '../table/table-header-group'
import { TablePagination } from '../table/table-pagination'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../ui/table'
import { ProductInventoryWithDefault } from './product-inventories'

interface Props {
	data: ProductInventoryWithDefault[]
	t: TFunction
	aggregationOptions: {
		aggregatePlacements: boolean
		aggregateBatches: boolean
	}
}

const ROW_PER_PAGE = [25, 50, 75, 100]

export function ProductInventoryTable({ data, t, aggregationOptions }: Props) {
	const lng = useLanguage()
	const columns = useMemo(
		() => getTableColumnDefs(lng, t, aggregationOptions),
		[lng, t, aggregationOptions],
	)

	const [sorting, onSortingChange] = useState([
		{ id: 'placement', desc: true },
		{ id: 'quantity', desc: true },
	])

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

		onSortingChange,

		state: {
			sorting,
		},
	})

	const multiplePages = useMemo(
		() => data.length > table.getState().pagination.pageSize,
		[data, table.getState().pagination.pageSize],
	)

	return (
		<>
			<div className={multiplePages ? 'border-b shadow-sm' : ''}>
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
									{t('inventory')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{multiplePages && (
				<div className='px-4 mb-4'>
					<TablePagination table={table} pageSizes={ROW_PER_PAGE} />
				</div>
			)}
		</>
	)
}

function getTableColumnDefs(
	lng: I18NLanguage,
	t: TFunction,
	aggregationOptions: {
		aggregatePlacements: boolean
		aggregateBatches: boolean
	},
): ColumnDef<ProductInventoryWithDefault>[] {
	const quantityCol: ColumnDef<ProductInventoryWithDefault> = {
		accessorKey: 'quantity',
		header: ({ column }) => (
			<TableHeaderCell
				column={column}
				title={t('details-page.inventory.table.quantity')}
			/>
		),
		cell: ({ getValue }) => (
			<span className={cn(getValue<number>() < 0 && 'text-destructive')}>
				{formatNumber(getValue<number>(), lng)}
			</span>
		),
		meta: {
			rightAlign: true,
		},
	}
	const placementCol: ColumnDef<ProductInventoryWithDefault> = {
		accessorKey: 'placement.name',
		id: 'placement',
		header: ({ column }) => (
			<TableHeaderCell
				column={column}
				title={t('details-page.inventory.table.placement')}
			/>
		),
		cell: ({ getValue, row }) => (
			<div className='flex gap-2'>
				<p>{getValue<string>()}</p>
				{row.original.isDefaultPlacement && (
					<Badge variant={'blue'}>
						{t('details-page.inventory.table.is-default')}
					</Badge>
				)}
			</div>
		),
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('placement')),
				String(rb.getValue('placement')),
			)
		},
	}
	const batchCol: ColumnDef<ProductInventoryWithDefault> = {
		accessorKey: 'batch.batch',
		id: 'batch',
		header: ({ column }) => (
			<TableHeaderCell
				column={column}
				title={t('details-page.inventory.table.batch')}
			/>
		),
		cell: ({ getValue }) => getValue<string>(),
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('placement')),
				String(rb.getValue('placement')),
			)
		},
	}
	const updatedCol: ColumnDef<ProductInventoryWithDefault> = {
		accessorKey: 'updated',
		header: ({ column }) => (
			<TableHeaderCell
				column={column}
				title={t('details-page.inventory.table.updated')}
			/>
		),
		cell: ({ getValue }) => formatDate(getValue<Date>()),
		meta: {
			rightAlign: true,
		},
	}

	let allCols = [placementCol, batchCol, quantityCol, updatedCol]

	if (aggregationOptions.aggregatePlacements) {
		allCols = allCols.filter(c => c != placementCol)
	}
	if (aggregationOptions.aggregateBatches) {
		allCols = allCols.filter(c => c != batchCol)
	}

	return allCols
}
