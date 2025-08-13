import { I18NLanguage } from '@/app/i18n/settings'
import { TableHeader } from '@/components/table/table-header'
import { FilterField, NumberRange } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Plan } from '@/data/customer.types'
import {
	HistoryPlatform,
	HistoryType,
	HistoryWithSums,
} from '@/data/inventory.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { CustomerSettings } from '@/lib/database/schema/customer'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { numberRangeFilterFn } from '@/lib/tanstack/filter-fns'
import { cn, formatDate, formatNumber, numberToCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { TFunction } from 'i18next'
import { User } from 'lucia'
import { DateRange } from 'react-day-picker'

export function getTableHistoryColumns(
	plan: Plan,
	user: User,
	settings: CustomerSettings,
	lng: I18NLanguage,
	t: TFunction<'historik', undefined>,
): ColumnDef<HistoryWithSums>[] {
	const insertedCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'inserted',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.created')} />
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
			viewLabel: t('history-columns.created'),
		},
	}

	const skuCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productSku',
		id: 'sku',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.productNo')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.productNo'),
		},
	}

	const barcodeCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productBarcode',
		id: 'barcode',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.barcode')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.barcode'),
		},
	}

	const groupCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productGroupName',
		id: 'group',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.product-group')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.product-group'),
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const text1Col: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productText1',
		id: 'text1',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.text1')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.text1'),
		},
	}

	const text2Col: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productText2',
		id: 'text2',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.text2')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.text2'),
		},
	}

	const text3Col: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productText3',
		id: 'text3',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.text3')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.text3'),
		},
	}

	const costPriceCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productCostPrice',
		id: 'costPrice',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.cost-price')} />
		),
		cell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
		meta: {
			viewLabel: t('history-columns.cost-price'),
			rightAlign: true,
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	const salePriceCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productSalesPrice',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.sale-price')} />
		),
		cell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
		meta: {
			viewLabel: t('history-columns.sale-price'),
			rightAlign: true,
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	const unitCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'productUnitName',
		id: 'unit',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.unit')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.unit'),
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const typeCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'type',
		header: ({ column }) => <TableHeader column={column} title='Type' />,
		cell: ({ getValue }) => {
			const type = getValue<HistoryType>()
			const variant =
				type == 'tilgang'
					? 'green'
					: type == 'afgang'
						? 'red'
						: type == 'slet'
							? 'destructive'
							: 'yellow'

			return (
				<Badge className='capitalize' variant={variant}>
					{t('history-columns.type', { context: type })}
				</Badge>
			)
		},
		meta: {
			viewLabel: 'Type',
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const amountCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'amount',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.quantity')} />
		),
		cell: ({ getValue, row }) => {
			if (row.original.type == 'slet') {
				return null
			}

			const amount = getValue<number>()

			return (
				<span className={cn('tabular-nums', amount < 0 && 'text-destructive')}>
					{formatNumber(amount, lng)}
				</span>
			)
		},
		meta: {
			viewLabel: t('history-columns.quantity'),
			rightAlign: true,
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	const currentQuantityCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'currentQuantity',
		header: ({ column }) => (
			<TableHeader
				column={column}
				title={t('history-columns.current-quantity')}
			/>
		),
		cell: ({ getValue, row }) => {
			if (row.original.type == 'slet') {
				return null
			}

			const amount = getValue<number>() ?? '-'

			return (
				<span className={cn('tabular-nums', amount < 0 && 'text-destructive')}>
					{typeof amount == 'number' ? formatNumber(amount, lng) : amount}
				</span>
			)
		},
		meta: {
			viewLabel: t('history-columns.current-quantity'),
			rightAlign: true,
			className: 'justify-end',
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	const placementCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'placementName',
		id: 'placement',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.placement')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.placement'),
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const batchCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'batchName',
		id: 'batch',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.batchNo')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.batchNo'),
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const platformCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'platform',
		header: ({ column }) => <TableHeader column={column} title='Platform' />,
		cell: ({ getValue }) => {
			const platform = getValue<HistoryPlatform>()

			function getVariant(platform: HistoryPlatform): string {
				switch (platform) {
					case 'web':
						return 'gray'
					case 'app':
						return 'lessGray'
					case 'ext':
						return 'moreGray'
					default:
						return 'outline'
				}
			}

			return (
				// @ts-ignore
				<Badge className='capitalize' variant={getVariant(platform)}>
					{platform}
				</Badge>
			)
		},
		meta: {
			viewLabel: 'Platform',
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const refCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'reference',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.reference')} />
		),
		cell: ({ getValue }) => (
			<span className='max-w-48 truncate'>{getValue<string>()}</span>
		),
		meta: {
			viewLabel: t('history-columns.reference'),
		},
	}

	const userCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'userName',
		id: 'user',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.user')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('history-columns.user'),
		},
	}

	const totalSalesCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'salesTotal',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.total-sales')} />
		),
		cell: ({ row }) => {
			if (row.original.type == 'slet') {
				return null
			}

			const amount = row.original.salesTotal

			return (
				<span className={cn('tabular-nums', amount < 0 && 'text-destructive')}>
					{numberToCurrency(amount, lng)}
				</span>
			)
		},
		meta: {
			viewLabel: t('history-columns.total-sales'),
			rightAlign: true,
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	const totalCostCol: ColumnDef<HistoryWithSums> = {
		accessorKey: 'costTotal',
		header: ({ column }) => (
			<TableHeader column={column} title={t('history-columns.total-costs')} />
		),
		cell: ({ row }) => {
			if (row.original.type == 'slet') {
				return null
			}

			const amount = row.original.costTotal

			return (
				<span className={cn('tabular-nums', amount < 0 && 'text-destructive')}>
					{numberToCurrency(amount, lng)}
				</span>
			)
		},
		meta: {
			viewLabel: t('history-columns.total-costs'),
			rightAlign: true,
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	let planCols = [
		insertedCol,
		skuCol,
		barcodeCol,
		groupCol,
		text1Col,
		text2Col,
		text3Col,
		costPriceCol,
		salePriceCol,
		unitCol,
		typeCol,
		amountCol,
		currentQuantityCol,
		placementCol,
		batchCol,
		platformCol,
		userCol,
		refCol,
		totalCostCol,
		totalSalesCol,
	]

	if (!user.priceAccess) {
		planCols = planCols.filter(
			col =>
				col != costPriceCol &&
				col != salePriceCol &&
				col != totalCostCol &&
				col != totalSalesCol,
		)
	}

	if (
		!(
			settings.useReference.tilgang ||
			settings.useReference.afgang ||
			settings.useReference.regulering ||
			settings.useReference.flyt
		)
	) {
		planCols = planCols.filter(col => col != refCol)
	}

	if (!(hasPermissionByPlan(plan, 'basis') && settings.usePlacement)) {
		planCols = planCols.filter(col => col != placementCol)
	}

	if (!hasPermissionByPlan(plan, 'pro')) {
		planCols = planCols.filter(col => col != batchCol)
	}

	return planCols
}

export function getTableHistoryFilters(
	plan: Plan,
	table: Table<HistoryWithSums>,
	units: Unit[],
	groups: Group[],
	placements: Placement[],
	batches: Batch[],
	user: User,
	settings: CustomerSettings,
	t: (key: string) => string,
): FilterField<HistoryWithSums>[] {
	const insertedFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('inserted'),
		type: 'date-range',
		label: t('history-columns.created'),
		value: '',
	}

	const skuFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('sku'),
		type: 'text',
		label: t('history-columns.productNo'),
		value: '',
		placeholder: t('history-columns.placeholders.productNo'),
	}

	const barcodeFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('barcode'),
		type: 'text',
		label: t('history-columns.barcode'),
		value: '',
		placeholder: t('history-columns.placeholders.barcode'),
	}

	const groupFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('group'),
		type: 'select',
		label: t('history-columns.product-group'),
		value: '',
		options: [
			...groups.map(group => ({
				value: group.name,
				label: group.name,
			})),
		],
	}

	const text1Filter: FilterField<HistoryWithSums> = {
		column: table.getColumn('text1'),
		type: 'text',
		label: t('history-columns.text1'),
		value: '',
		placeholder: t('history-columns.placeholders.text1'),
	}

	const text2Filter: FilterField<HistoryWithSums> = {
		column: table.getColumn('text2'),
		type: 'text',
		label: t('history-columns.text2'),
		value: '',
		placeholder: t('history-columns.placeholders.text2'),
	}

	const text3Filter: FilterField<HistoryWithSums> = {
		column: table.getColumn('text3'),
		type: 'text',
		label: t('history-columns.text3'),
		value: '',
		placeholder: t('history-columns.placeholders.text3'),
	}

	const costPriceFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('costPrice'),
		type: 'number-range',
		label: t('history-columns.cost-price'),
		value: '',
	}

	const salePriceFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('productSalesPrice'),
		type: 'number-range',
		label: t('history-columns.sale-price'),
		value: '',
	}

	const unitFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('unit'),
		type: 'select',
		label: t('history-columns.unit'),
		value: '',
		options: [
			...units.map(unit => ({
				value: unit.name,
				label: unit.name,
			})),
		],
	}

	const typeFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('type'),
		type: 'select',
		label: 'Type',
		value: '',
		options: [
			{ value: 'tilgang', label: t('history-columns.filters.type-incoming') },
			{ value: 'afgang', label: t('history-columns.filters.type-outgoing') },
			{
				value: 'regulering',
				label: t('history-columns.filters.type-adjustment'),
			},
			{ value: 'flyt', label: t('history-columns.filters.type-move') },
			{ value: 'slet', label: t('history-columns.filters.type-delete') },
		],
	}

	const amountFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('amount'),
		type: 'number-range',
		label: t('history-columns.quantity'),
		value: '',
	}

	const currentQuantityFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('currentQuantity'),
		type: 'number-range',
		label: t('history-columns.current-quantity'),
		value: '',
	}

	const placementFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('placement'),
		type: 'select',
		label: t('history-columns.placement'),
		value: '',
		options: [
			...placements.map(placement => ({
				value: placement.name,
				label: placement.name,
			})),
		],
	}
	const batchFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('batch'),
		type: 'select',
		label: t('history-columns.batchNo'),
		value: '',
		options: [
			...batches.map(batch => ({
				value: batch.batch,
				label: batch.batch,
			})),
		],
	}

	const userFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('user'),
		type: 'text',
		label: t('history-columns.user'),
		value: '',
	}

	const refFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('reference'),
		type: 'text',
		label: t('history-columns.reference'),
		placeholder: t('history-columns.placeholders.reference'),
		value: '',
	}

	const platformFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('platform'),
		type: 'select',
		label: 'Platform',
		value: '',
		options: [
			{ value: 'web', label: 'Web' },
			{ value: 'app', label: 'App' },
			{ value: 'ext', label: 'External' },
		],
	}

	const totalSalesFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('salesTotal'),
		type: 'number-range',
		label: t('history-columns.total-sales'),
		value: '',
	}

	const totalCostFilter: FilterField<HistoryWithSums> = {
		column: table.getColumn('costTotal'),
		type: 'number-range',
		label: t('history-columns.total-costs'),
		value: '',
	}

	let planFilters = [
		insertedFilter,
		skuFilter,
		barcodeFilter,
		groupFilter,
		text1Filter,
		text2Filter,
		text3Filter,
		costPriceFilter,
		salePriceFilter,
		unitFilter,
		typeFilter,
		amountFilter,
		currentQuantityFilter,
		placementFilter,
		batchFilter,
		platformFilter,
		refFilter,
		userFilter,
		totalCostFilter,
		totalSalesFilter,
	]

	if (!user.priceAccess) {
		planFilters = planFilters.filter(
			filter =>
				filter != costPriceFilter &&
				filter != salePriceFilter &&
				filter != totalCostFilter &&
				filter != totalSalesFilter,
		)
	}

	if (
		!(
			settings.useReference.tilgang ||
			settings.useReference.afgang ||
			settings.useReference.regulering ||
			settings.useReference.flyt
		)
	) {
		planFilters = planFilters.filter(filter => filter != refFilter)
	}

	if (!(hasPermissionByPlan(plan, 'basis') && settings.usePlacement)) {
		planFilters = planFilters.filter(filter => filter != placementFilter)
	}

	if (!hasPermissionByPlan(plan, 'pro')) {
		planFilters = planFilters.filter(filter => filter != batchFilter)
	}

	return planFilters
}
