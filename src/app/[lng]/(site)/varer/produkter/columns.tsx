import { I18NLanguage } from '@/app/i18n/settings'
import { ModalShowProductLabel } from '@/components/inventory/modal-show-product-label'
import { TableOverviewActions } from '@/components/products/product-table-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Plan } from '@/data/customer.types'
import { FormattedProduct } from '@/data/products.types'
import { hasPermissionByRank } from '@/data/user.types'
import { CustomerIntegrationSettings } from '@/lib/database/schema/integrations'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { stringSortingFn } from '@/lib/tanstack/filter-fns'
import { cn, formatDate, numberToCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { User } from 'lucia'
import Link from 'next/link'
import { DateRange } from 'react-day-picker'

export function getProductOverviewColumns(
	plan: Plan,
	user: User,
	integrationSettings: CustomerIntegrationSettings | undefined,
	lng: I18NLanguage,
	t: (key: string) => string,
): ColumnDef<FormattedProduct>[] {
	const skuCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'sku',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-No.')} />
		),
		cell: ({ row }) => (
			<Link
				href={`/${lng}/varer/produkter/${row.original.id}`}
				className='hover:underline'>
				{row.original.sku}
			</Link>
		),
		meta: {
			viewLabel: t('product-No.'),
		},
	}
	const attachmentsCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'fileCount',
		id: 'attachments',
		header: ({ column }) => (
			<TableHeader column={column} title={t('attachments')} />
		),
		cell: ({ row }) => (
			<div
				className={cn(
					'tabular-nums hidden rounded-full',
					row.original.fileCount != undefined &&
						row.original.fileCount > 0 &&
						'block',
				)}>
				<p>{`${row.original.fileCount}/5`}</p>
			</div>
		),

		meta: {
			rightAlign: true,
			viewLabel: t('attachments'),
		},
		enableHiding: false,
		enableSorting: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue<number>(id) > 0)
		},
	}
	const barcodeCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'barcode',
		header: ({ column }) => (
			<TableHeader column={column} title={t('barcode')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('barcode'),
		},
	}
	const groupCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'group',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-group')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('product-group'),
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const supplierCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'supplierName',
		header: ({ column }) => (
			<TableHeader column={column} title={t('supplierName')} />
		),
		aggregationFn: 'unique',
		cell: ({ row }) => (
			<div
				className={cn(
					!row.original.supplierName && 'italic text-muted-foreground flex',
				)}>
				{row.original.supplierName ? row.original.supplierName : t('no-value')}{' '}
				<div className='w-0.5'></div>
			</div>
		),
		sortingFn: (ra, rb) => {
			let aVal = ra.original.supplierName
			let bVal = rb.original.supplierName
			return stringSortingFn(aVal ?? '', bVal ?? '')
		},
		meta: {
			viewLabel: t('supplierName'),
			className: '[&>*]:block',
		},
	}

	const text1Col: ColumnDef<FormattedProduct> = {
		accessorKey: 'text1',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-text1')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('product-text1'),
			className: '[&>*]:block',
		},
	}

	const text2Col: ColumnDef<FormattedProduct> = {
		accessorKey: 'text2',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-text2')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('product-text2'),
		},
	}

	const text3Col: ColumnDef<FormattedProduct> = {
		accessorKey: 'text3',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-text3')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('product-text3'),
		},
	}
	const unitCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'unit',
		header: ({ column }) => <TableHeader column={column} title={t('unit')} />,
		cell: ({ getValue }) => getValue<string>(),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			viewLabel: t('unit'),
		},
	}

	const costPriceCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'costPrice',
		header: ({ column }) => (
			<TableHeader column={column} title={t('cost-price')} />
		),
		cell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
		filterFn: 'includesString',
		meta: {
			rightAlign: true,
			viewLabel: t('cost-price'),
		},
	}

	const salesPriceCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'salesPrice',
		header: ({ column }) => (
			<TableHeader column={column} title={t('sales-price')} />
		),
		cell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
		filterFn: 'includesString',
		meta: {
			rightAlign: true,
			viewLabel: t('sales-price'),
		},
	}
	const updatedCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'updated',
		header: ({ column }) => (
			<TableHeader column={column} title={t('updated-time')} />
		),
		cell: ({ getValue }) => formatDate(getValue<Date>()),
		filterFn: (row, id, value: DateRange) => {
			const rowDate: string | number | Date = row.getValue(id)

			if (!value.from && value.to) {
				return true
			}

			if (value.from && !value.to) {
				return isSameDay(rowDate, new Date(value.from))
			}

			if (value.from && value.to) {
				return (
					(isAfter(rowDate, new Date(value.from)) &&
						isBefore(rowDate, new Date(value.to))) ||
					isSameDay(rowDate, new Date(value.from)) ||
					isSameDay(rowDate, new Date(value.to))
				)
			}

			return true
		},
		meta: {
			viewLabel: t('updated-time'),
		},
	}

	const isBarredCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'isBarred',
		header: ({ column }) => <TableHeader column={column} title='Status' />,
		cell: ({ getValue }) => {
			const status = getValue<boolean>()
			const badgeVariant = status ? 'red' : 'gray'

			return (
				<Badge variant={badgeVariant}>
					{status ? t('barred-status-yes') : t('barred-status-no')}
				</Badge>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue<boolean>(id))
		},
		meta: {
			viewLabel: 'Status',
		},
	}

	const actionsCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'actions',
		header: () => null,
		cell: ({ table, row }) => (
			<>
				<ModalShowProductLabel product={row.original} />
				<TableOverviewActions
					integrationSettings={integrationSettings}
					table={table}
					row={row}
				/>
			</>
		),
		enableHiding: false,
		enableSorting: false,
	}

	const useBatchCol: ColumnDef<FormattedProduct> = {
		accessorKey: 'useBatch',
		id: 'useBatch',
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			isShadow: true,
		},
	}

	const columns = [
		skuCol,
		attachmentsCol,
		barcodeCol,
		groupCol,
		supplierCol,
		text1Col,
		text2Col,
		text3Col,
		unitCol,
		costPriceCol,
		salesPriceCol,
		updatedCol,
		useBatchCol,
		isBarredCol,
	].filter(
		col => user.priceAccess || (col !== costPriceCol && col !== salesPriceCol),
	)
	if (hasPermissionByRank(user.role, 'bruger')) columns.push(actionsCol)
	return columns
}

export function getProductTableOverviewFilters(
	plan: Plan,
	units: Unit[],
	groups: Group[],
	table: Table<FormattedProduct>,
	ing: string,
	t: (key: string) => string,
): FilterField<FormattedProduct>[] {
	const skuFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('sku'),
		type: 'text',
		label: t('product-No.'),
		value: '',
		placeholder: 'Søg i varenr.',
	}
	const barcodeFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('barcode'),
		type: 'text',
		label: t('barcode'),
		value: '',
		placeholder: 'Søg i stregkode',
	}
	const unitFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('unit'),
		type: 'select',
		label: t('unit'),
		value: '',
		options: [
			...units.map(unit => ({
				value: unit.name,
				label: unit.name,
			})),
		],
	}
	const groupFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('group'),
		type: 'select',
		label: t('product-group'),
		value: '',
		options: [
			...groups.map(group => ({
				value: group.name,
				label: group.name,
			})),
		],
	}

	const supplierNameFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('supplierName'),
		type: 'select',
		label: t('supplierName'),
		value: '',
		placeholder: t('supplierName'),
		options: [
			...Array.from(
				table.getColumn('supplierName')!.getFacetedUniqueValues().keys(),
			)
				.filter(Boolean)
				.map(opt => ({
					label: opt,
					value: opt,
				})),
		],
	}

	const text1Filter: FilterField<FormattedProduct> = {
		column: table.getColumn('text1'),
		type: 'text',
		label: t('product-text1'),
		value: '',
		placeholder: 'Søg i varetekst 1',
	}
	const text2Filter: FilterField<FormattedProduct> = {
		column: table.getColumn('text2'),
		type: 'text',
		label: t('product-text2'),
		value: '',
		placeholder: 'Søg i varetekst 2',
	}
	const text3Filter: FilterField<FormattedProduct> = {
		column: table.getColumn('text3'),
		type: 'text',
		label: t('product-text3'),
		value: '',
		placeholder: 'Søg i varetekst 3',
	}
	const updatedFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('updated'),
		type: 'date-range',
		label: t('updated-time'),
		value: '',
	}
	const costPriceFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('costPrice'),
		type: 'text',
		label: t('cost-price'),
		value: '',
		placeholder: 'Søg i kostpris.',
	}
	const salesPriceFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('salesPrice'),
		type: 'text',
		label: t('sales-price'),
		value: '',
		placeholder: 'Søg i salgspris.',
	}
	const barredFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('isBarred'),
		type: 'select',
		label: 'Status',
		value: '',
		options: [
			{ value: true, label: t('barred-status-yes') },
			{ value: false, label: t('barred-status-no') },
		],
	}
	const attachmentsFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('attachments'),
		type: 'select',
		label: t('attachments'),
		value: '',
		options: [
			{
				value: true,
				label: t('has-attach-yes'),
			},
			{
				value: false,
				label: t('has-attach-no'),
			},
		],
	}

	const useBatchFilter: FilterField<FormattedProduct> = {
		column: table.getColumn('useBatch'),
		type: 'select',
		label: t('useBatch'),
		value: '',
		options: [
			{
				value: true,
				label: t('useBatch-yes'),
			},
			{
				value: false,
				label: t('useBatch-no'),
			},
		],
		facetedUniqueColumnId: 'sku',
	}

	return [
		skuFilter,
		attachmentsFilter,
		barcodeFilter,
		groupFilter,
		supplierNameFilter,
		text1Filter,
		text2Filter,
		text3Filter,
		unitFilter,
		useBatchFilter,
		costPriceFilter,
		salesPriceFilter,
		updatedFilter,
		barredFilter,
	]
}
