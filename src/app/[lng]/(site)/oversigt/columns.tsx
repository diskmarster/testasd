import { I18NLanguage } from '@/app/i18n/settings'
import { DurationHoverCard } from '@/components/inventory/duration-hover-card'
import { ModalShowProductLabel } from '@/components/inventory/modal-show-product-label'
import { TableOverviewActions } from '@/components/inventory/table-overview-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField, NumberRange } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan, hasPermissionByRank } from '@/data/user.types'
import { Attachment } from '@/lib/database/schema/attachments'
import { CustomerSettings } from '@/lib/database/schema/customer'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { numberRangeFilterFn, stringSortingFn } from '@/lib/tanstack/filter-fns'
import { cn, formatNumber, numberToCurrency } from '@/lib/utils'
import { ColumnDef, Row, Table } from '@tanstack/react-table'
import { intervalToDuration, isBefore } from 'date-fns'
import { TFunction } from 'i18next'
import { User } from 'lucia'
import Link from 'next/link'

export type InventoryTableRow = FormattedInventory & {
	disposable: number | null
	images: Attachment[]
	productHasDefaultPlacement: boolean
}

export function getTableOverviewColumns(
	plan: Plan,
	user: User,
	settings: Pick<CustomerSettings, 'useReference' | 'usePlacement'>,
	lng: I18NLanguage,
	t: TFunction<'oversigt'>,
): ColumnDef<InventoryTableRow>[] {
	const skuCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.sku',
		id: 'sku',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-No.')} />
		),
		cell: ({ row }) =>
			row.original.product.fileCount > 0 ? (
				<div className='flex items-center gap-1.5'>
					<HoverCard>
						<HoverCardTrigger asChild>
							<Link
								className='cursor-pointer hover:underline'
								href={`/${lng}/varer/produkter/${row.original.product.id}`}>
								<p>{row.original.product.sku}</p>
							</Link>
						</HoverCardTrigger>
						<HoverCardContent side='top' className='w-fit p-1'>
							{row.original.images.length > 0 ? (
								<img
									src={row.original.images[0].url}
									alt={row.original.images[0].name}
									className='rounded-sm max-h-40'
								/>
							) : (
								<p className='text-sm text-muted-foreground px-2 py-1'>
									Ingen billeder
								</p>
							)}
						</HoverCardContent>
					</HoverCard>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span
									className={cn(
										'hidden size-2 rounded-full bg-destructive/50 border border-destructive cursor-pointer',
										row.original.product.isBarred && 'block',
									)}
								/>
							</TooltipTrigger>
							<TooltipContent className='bg-foreground text-background'>
								{t('modal-show-product-card.barred-tooltip')}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			) : (
				<div className='flex items-center gap-1.5'>
					<Link
						className='cursor-pointer hover:underline'
						href={`/${lng}/varer/produkter/${row.original.product.id}`}>
						<p>{row.original.product.sku}</p>
					</Link>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span
									className={cn(
										'hidden size-2 rounded-full bg-destructive/50 border border-destructive cursor-pointer',
										row.original.product.isBarred && 'block',
									)}
								/>
							</TooltipTrigger>
							<TooltipContent className='bg-foreground text-background'>
								{t('modal-show-product-card.barred-tooltip')}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			),
		enableHiding: false,
		meta: {
			viewLabel: t('product-No.'),
		},
	}

	const attachmentsCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.fileCount',
		id: 'attachments',
		header: ({ column }) => (
			<TableHeader column={column} title={t('attachments')} />
		),
		aggregatedCell: ({ row }) => (
			<div
				className={cn(
					'tabular-nums hidden rounded-full',
					row.original.product.fileCount != undefined &&
						row.original.product.fileCount > 0 &&
						'block',
				)}>
				<p>{`${row.original.product.fileCount}/5`}</p>
			</div>
		),
		cell: ({ table, row }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : (
				<div
					className={cn(
						'tabular-nums hidden rounded-full',
						row.original.product.fileCount != undefined &&
							row.original.product.fileCount > 0 &&
							'block',
					)}>
					<p>{`${row.original.product.fileCount}/5`}</p>
				</div>
			),
		meta: {
			rightAlign: true,
			viewLabel: t('attachments'),
		},
		enableHiding: true,
		enableSorting: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue<number>(id) > 0)
		},
	}

	const barcodeCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.barcode',
		id: 'barcode',
		header: ({ column }) => (
			<TableHeader column={column} title={t('barcode')} />
		),
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => getValue<string>(),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>(),
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('barcode')),
				String(rb.getValue('barcode')),
			)
		},
		meta: {
			viewLabel: t('barcode'),
		},
	}

	const groupCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.group',
		id: 'group',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-group')} />
		),
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => getValue<string>(),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>(),
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('group')),
				String(rb.getValue('group')),
			)
		},
		meta: {
			viewLabel: t('product-group'),
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const supplierCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.supplierName',
		id: 'supplierName',
		header: ({ column }) => (
			<TableHeader column={column} title={t('supplierName')} />
		),
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => getValue<string | null>(),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string | null>(),
		sortingFn: (ra, rb) => {
			let aVal = ra.original.product.supplierName
			let bVal = rb.original.product.supplierName
			return stringSortingFn(aVal ?? '', bVal ?? '')
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			viewLabel: t('supplierName'),
			className: '[&>*]:block',
		},
	}

	const text1Col: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.text1',
		id: 'text1',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-text1')} />
		),
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => getValue<string>(),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>(),
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('text1')),
				String(rb.getValue('text1')),
			)
		},
		meta: {
			viewLabel: t('product-text1'),
			className: '[&>*]:block',
		},
	}

	const text2Col: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.text2',
		id: 'text2',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-text2')} />
		),
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => getValue<string>(),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>(),
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('text2')),
				String(rb.getValue('text2')),
			)
		},
		meta: {
			viewLabel: t('product-text2'),
		},
	}

	const text3Col: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.text3',
		id: 'text3',
		header: ({ column }) => (
			<TableHeader column={column} title={t('product-text3')} />
		),
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => getValue<string>(),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>(),
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('text3')),
				String(rb.getValue('text3')),
			)
		},
		meta: {
			viewLabel: t('product-text3'),
		},
	}

	const placementCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'placement.name',
		id: 'placement',
		header: ({ column }) => (
			<TableHeader column={column} title={t('placement')} />
		),
		aggregatedCell: ({ row }) => {
			const leafsWithQuantity = row
				.getLeafRows()
				.filter(
					leaf =>
						leaf.original.isDefaultPlacement ||
						leaf.getValue<number>('quantity') != 0,
				)

			const isSinglePlacement =
				new Set(
					[...leafsWithQuantity].map(r => r.getValue<string>('placement')),
				).size == 1
			if (!isSinglePlacement) return null

			const firstRow = leafsWithQuantity[0]
			const name = firstRow.original.placement.name
			const isBarred = firstRow.original.placement.isBarred
			const isDefaultPlacement = firstRow.original.isDefaultPlacement
			return (
				<div className='flex items-center gap-1.5'>
					{isBarred && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className='block size-2 rounded-full bg-destructive/50 border-destructive border cursor-pointer' />
								</TooltipTrigger>
								<TooltipContent className='bg-foreground text-background'>
									{t('modal-show-product-card.placement-barred-tooltip')}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{isDefaultPlacement && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className='block size-2 rounded-full bg-primary/50 border-primary border cursor-pointer' />
								</TooltipTrigger>
								<TooltipContent className='bg-foreground text-background'>
									{t('modal-show-product-card.default-placement-tooltip')}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					<p>{name}</p>
				</div>
			)
		},
		cell: ({ row }) => {
			const isBarred = row.original.placement.isBarred
			const name = row.original.placement.name
			const isDefaultPlacement = row.original.isDefaultPlacement
			return (
				<div className='flex items-center gap-1.5'>
					{isBarred && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className='block size-2 rounded-full bg-destructive/50 border-destructive border cursor-pointer' />
								</TooltipTrigger>
								<TooltipContent className='bg-foreground text-background'>
									{t('modal-show-product-card.placement-barred-tooltip')}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{isDefaultPlacement && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className='block size-2 rounded-full border-primary border cursor-pointer' />
								</TooltipTrigger>
								<TooltipContent className='bg-foreground text-background'>
									{t('modal-show-product-card.default-placement-tooltip')}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					<p>{name}</p>
				</div>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('placement')),
				String(rb.getValue('placement')),
			)
		},
		meta: {
			viewLabel: t('placement'),
		},
	}

	const batchCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'batch.batch',
		id: 'batch',
		header: ({ column }) => <TableHeader column={column} title={t('batch')} />,
		aggregatedCell: props => {
			const useBatch =
				props.row.getLeafRows().filter(r => r.original.product.useBatch)
					.length > 0
			return useBatch && <Badge variant='blue'>{t('useBatch-badge')}</Badge>
		},
		cell: ({ getValue, row }) => {
			if (!row.original.product.useBatch) return null

			const batch = row.original.batch
			const hasExpiry = batch.expiry != null
			const isExpired = hasExpiry && isBefore(batch.expiry!, Date.now())

			return (
				<div className='flex items-center gap-1.5'>
					{hasExpiry && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className={cn(
											'block size-2 rounded-full bg-success/50 border-success border cursor-pointer',
											isExpired && 'bg-destructive/50 border-destructive ',
										)}
									/>
								</TooltipTrigger>
								<TooltipContent className='bg-foreground text-background'>
									{t('batch-indicator-tooltip', {
										context: isExpired ? 'expired' : 'valid',
									})}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					<p>{getValue<string>()}</p>
				</div>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('batch')),
				String(rb.getValue('batch')),
			)
		},
		meta: {
			viewLabel: t('batch'),
		},
	}

	const quantityCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'quantity',
		header: ({ column }) => (
			<TableHeader column={column} title={t('quantity')} />
		),
		aggregatedCell: ({ getValue }) => (
			<span className={cn(getValue<number>() < 0 && 'text-destructive')}>
				{formatNumber(getValue<number>(), lng)}
			</span>
		),
		cell: ({ getValue }) => (
			<span className={cn(getValue<number>() < 0 && 'text-destructive')}>
				{formatNumber(getValue<number>(), lng)}
			</span>
		),
		filterFn: (row, id, value) => numberRangeFilterFn(row, id, value),
		meta: {
			rightAlign: true,
			viewLabel: t('quantity'),
		},
	}

	const totalQuantityCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'totalQuantity',
		header: ({ column }) => (
			<TableHeader
				tooltip={t('totalQuantity-tooltip')}
				column={column}
				title={t('totalQuantity')}
			/>
		),
		aggregatedCell: ({ row }) => {
			const total = row
				.getLeafRows()
				.map(r => r.original.quantity)
				.reduce((acc, cur) => acc + cur, 0)
			return (
				<p>
					<span className={cn(total < 0 && 'text-destructive')}>
						{formatNumber(total, lng)}
					</span>
					{' / '}
					<span
						className={cn(
							row.original.totalQuantity < 0 && 'text-destructive',
						)}>
						{formatNumber(row.original.totalQuantity, lng)}
					</span>
				</p>
			)
		},
		cell: () => null,
		filterFn: (row, id, value) => numberRangeFilterFn(row, id, value),
		meta: {
			rightAlign: true,
			viewLabel: t('totalQuantity'),
		},
	}

	const dispQuantityCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'disposible',
		header: ({ column }) => (
			<TableHeader column={column} title={t('disposible')} />
		),
		aggregatedCell: ({ row }) => {
			const value = row.original.disposable
			return value != null ? (
				<span className={cn(value < 0 && 'text-destructive')}>
					{formatNumber(value, lng)}
				</span>
			) : (
				<span>-</span>
			)
		},
		aggregationFn: 'unique',
		cell: ({ table, row }) => {
			/*@ts-ignore*/
			if (table.options.meta?.isGrouped) {
				return null
			}

			const value = row.original.disposable
			return value != null ? (
				<span className={cn(value < 0 && 'text-destructive')}>
					{formatNumber(value, lng)}
				</span>
			) : (
				<span>-</span>
			)
		},
		filterFn: (row, id, value) => numberRangeFilterFn(row, id, value),
		meta: {
			rightAlign: true,
			viewLabel: t('disposible'),
		},
	}

	const unitCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.unit',
		id: 'unit',
		header: ({ column }) => <TableHeader column={column} title={t('unit')} />,
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => getValue<string>(),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? (
				<p className='text-muted-foreground'>{getValue<string>()}</p>
			) : (
				getValue<string>()
			),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		sortingFn: (ra, rb) => {
			return stringSortingFn(
				String(ra.getValue('unit')),
				String(rb.getValue('unit')),
			)
		},
		meta: {
			viewLabel: t('unit'),
		},
	}

	const costPriceCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.costPrice',
		id: 'costPrice',
		header: ({ column }) => (
			<TableHeader column={column} title={t('cost-price')} />
		),
		aggregationFn: 'unique',
		aggregatedCell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped
				? null
				: numberToCurrency(getValue<number>(), lng),
		filterFn: (row, id, value) => numberRangeFilterFn(row, id, value),
		meta: {
			rightAlign: true,
			viewLabel: t('cost-price'),
		},
	}

	const salesPriceCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.salesPrice',
		id: 'salesPrice',
		aggregationFn: 'unique',
		header: ({ column }) => (
			<TableHeader column={column} title={t('sales-price')} />
		),
		aggregatedCell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
		cell: ({ table, getValue }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped
				? null
				: numberToCurrency(getValue<number>(), lng),
		filterFn: (row, id, value) => numberRangeFilterFn(row, id, value),
		meta: {
			rightAlign: true,
			viewLabel: t('sales-price'),
		},
	}

	const isBarredCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.isBarred',
		id: 'isBarred',
		header: () => null,
		aggregatedCell: () => null,
		cell: () => null,
		enableHiding: false,
		enableSorting: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			isShadow: true,
		},
	}

	const actionsCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'actions',
		header: () => null,
		aggregatedCell: ({ row }) => (
			<ModalShowProductLabel product={row.original.product} />
		),
		cell: ({ table, row }) =>
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? (
				hasPermissionByRank(user.role, 'bruger') ? (
					<TableOverviewActions
						row={row}
						table={table}
						plan={plan}
						settings={settings}
					/>
				) : null
			) : (
				<div className='flex gap-2'>
					<ModalShowProductLabel product={row.original.product} />
					{hasPermissionByRank(user.role, 'bruger') && (
						<TableOverviewActions
							row={row}
							table={table}
							plan={plan}
							settings={settings}
						/>
					)}
				</div>
			),
		enableHiding: false,
		enableSorting: false,
		meta: {
			className: 'justify-end',
		},
	}

	const useBatchCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'product.useBatch',
		id: 'useBatch',
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			isShadow: true,
		},
	}

	const latestRegCol: ColumnDef<InventoryTableRow> = {
		accessorKey: 'latestReg',
		header: ({ column }) => (
			<TableHeader column={column} title={t('lastRegistration')} />
		),
		aggregatedCell: ({ row }) => {
			const dates = processRegistrationDates(row)
			if (!dates.lastDate) return null

			return (
				<DurationHoverCard
					lng={lng}
					lastDate={dates.lastDate}
					incomingAt={dates.incomingAt}
					outgoingAt={dates.outgoingAt}
					regulatedAt={dates.regulatedAt}
				/>
			)
		},
		cell: ({ row }) => {
			const dates = processRegistrationDates(row)
			if (!dates.lastDate) return null

			return (
				<DurationHoverCard
					lng={lng}
					lastDate={dates.lastDate}
					incomingAt={dates.incomingAt}
					outgoingAt={dates.outgoingAt}
					regulatedAt={dates.regulatedAt}
				/>
			)
		},
		sortingFn: (a, b) => {
			const aLast = processRegistrationDates(a).lastDate
			const bLast = processRegistrationDates(b).lastDate

			if (!aLast && !bLast) return 0
			if (!bLast) return 1
			if (!aLast) return -1
			return Number(bLast) - Number(aLast)
		},
		filterFn: (row, id, value: NumberRange) => {
			function getLastDate(...dates: (Date | null)[]): Date | null {
				const sorted = dates
					.filter(d => d != null)
					.sort((a, b) => Number(b) - Number(a))
				return sorted.at(0) ? sorted.at(0)! : null
			}

			const lastDate = getLastDate(
				...[
					row.original.incomingAt,
					row.original.outgoingAt,
					row.original.regulatedAt,
				],
			)

			// if (!lastDate) return false

			const { from, to } = value
			const val =
				intervalToDuration({
					start: lastDate || new Date(), // just to please typescript, will not be used if lastDate is null
					end: new Date(),
				}).days || 0 + 1

			if (from == undefined && to == undefined) {
				return true
			} else if (from == undefined && lastDate == null && to != undefined) {
				return false
			} else if (from == undefined && to != undefined) {
				return val <= to
			} else if (from != undefined && to == undefined) {
				return val >= from
			} else if (from != undefined && to != undefined && !lastDate) {
				return false
			} else if (from != undefined && to != undefined) {
				return val >= from && val <= to
			} else {
				return true
			}
		},
	}

	let planCols: ColumnDef<InventoryTableRow>[] = [
		skuCol,
		attachmentsCol,
		barcodeCol,
		groupCol,
		supplierCol,
		text1Col,
		text2Col,
		text3Col,
		costPriceCol,
		salesPriceCol,
		quantityCol,
		totalQuantityCol,
		dispQuantityCol,
		unitCol,
		latestRegCol,
		placementCol,
		useBatchCol,
		batchCol,
		actionsCol,
		isBarredCol,
	]

	if (!user.priceAccess) {
		planCols = planCols.filter(
			col => col != costPriceCol && col != salesPriceCol,
		)
	}

	if (!(hasPermissionByPlan(plan, 'basis') && settings.usePlacement)) {
		planCols = planCols.filter(col => col != placementCol)
	}

	if (!hasPermissionByPlan(plan, 'pro')) {
		planCols = planCols.filter(
			col =>
				!(col === totalQuantityCol || col === batchCol || col === useBatchCol),
		)
	} else {
		planCols = planCols.filter(col => {
			if (
				!hasPermissionByRank(user.role, 'administrator') &&
				col === totalQuantityCol
			)
				return false
			return true
		})
	}

	return planCols
}

export function getTableOverviewFilters(
	plan: Plan,
	table: Table<InventoryTableRow>,
	units: Unit[],
	groups: Group[],
	placements: Placement[],
	batches: Batch[],
	user: User,
	settings: Pick<CustomerSettings, 'useReference' | 'usePlacement'>,
	t: (key: string) => string,
): FilterField<InventoryTableRow>[] {
	const skuFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('sku'),
		type: 'text',
		label: t('product-No.'),
		value: '',
		placeholder: t('product-No.-placeholder'),
	}
	const attachmentsFilter: FilterField<InventoryTableRow> = {
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
		facetedUniqueColumnId: 'sku',
	}
	const barcodeFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('barcode'),
		type: 'text',
		label: t('barcode'),
		value: '',
		placeholder: t('barcode-placeholder'),
	}
	const unitFilter: FilterField<InventoryTableRow> = {
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
		facetedUniqueColumnId: 'sku',
	}
	const groupFilter: FilterField<InventoryTableRow> = {
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
		facetedUniqueColumnId: 'sku',
	}
	const supplierNameFilter: FilterField<InventoryTableRow> = {
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
		facetedUniqueColumnId: 'sku',
	}
	const text1Filter: FilterField<InventoryTableRow> = {
		column: table.getColumn('text1'),
		type: 'text',
		label: t('product-text1'),
		value: '',
		placeholder: t('product-text1-placeholder'),
	}
	const text2Filter: FilterField<InventoryTableRow> = {
		column: table.getColumn('text2'),
		type: 'text',
		label: t('product-text2'),
		value: '',
		placeholder: t('product-text2-placeholder'),
	}
	const text3Filter: FilterField<InventoryTableRow> = {
		column: table.getColumn('text3'),
		type: 'text',
		label: t('product-text3'),
		value: '',
		placeholder: t('product-text3-placeholder'),
	}
	const placementFilter: FilterField<InventoryTableRow> = {
		column:
			hasPermissionByPlan(plan, 'basis') && settings.usePlacement
				? table.getColumn('placement')
				: undefined,
		type: 'select',
		label: t('placement'),
		value: '',
		options: [
			...placements.map(placement => ({
				value: placement.name,
				label: placement.name,
				icon: placement.isBarred ? (
					<span
						className={cn(
							'size-2 rounded-full bg-destructive/50 border border-destructive cursor-pointer block',
						)}
					/>
				) : undefined,
			})),
		],
	}

	const batchFilter: FilterField<InventoryTableRow> = {
		column: hasPermissionByPlan(plan, 'pro')
			? table.getColumn('batch')
			: undefined,
		type: 'select',
		label: t('batch'),
		value: '',
		options: [
			...batches.map(batch => ({
				value: batch.batch,
				label: batch.batch,
				icon: batch.isBarred ? (
					<span
						className={cn(
							'size-2 rounded-full bg-destructive/50 border border-destructive cursor-pointer block',
						)}
					/>
				) : undefined,
			})),
		],
	}

	const costPriceFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('costPrice'),
		type: 'number-range',
		label: t('cost-price'),
		value: '',
	}

	const salesPriceFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('salesPrice'),
		type: 'number-range',
		label: t('sales-price'),
		value: '',
	}

	const quantityFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('quantity'),
		type: 'number-range',
		label: t('quantity'),
		value: '',
	}

	const totalQuantityFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('totalQuantity'),
		type: 'number-range',
		label: t('totalQuantity'),
		value: '',
	}

	const dispQuantityFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('disposible'),
		type: 'number-range',
		label: t('disposible'),
		value: '',
	}

	const isBarredFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('isBarred'),
		type: 'select',
		label: t('isBarred'),
		value: '',
		options: [
			{
				value: true,
				label: t('isBarred-yes'),
			},
			{
				value: false,
				label: t('isBarred-no'),
			},
		],
		facetedUniqueColumnId: 'sku',
	}

	const useBatchFilter: FilterField<InventoryTableRow> = {
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

	const latestRegFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('latestReg'),
		type: 'number-range',
		label: t('lastRegistration'),
		value: '',
	}

	let planFilters: FilterField<InventoryTableRow>[] = [
		skuFilter,
		attachmentsFilter,
		barcodeFilter,
		unitFilter,
		groupFilter,
		supplierNameFilter,
		text1Filter,
		text2Filter,
		text3Filter,
		costPriceFilter,
		salesPriceFilter,
		quantityFilter,
		totalQuantityFilter,
		dispQuantityFilter,
		placementFilter,
		batchFilter,
		useBatchFilter,
		latestRegFilter,
		isBarredFilter,
	]

	if (!user.priceAccess) {
		planFilters = planFilters.filter(
			filter => filter != costPriceFilter && filter != salesPriceFilter,
		)
	}

	if (!(hasPermissionByPlan(plan, 'basis') && settings.usePlacement)) {
		planFilters = planFilters.filter(filter => filter != placementFilter)
	}

	if (!hasPermissionByPlan(plan, 'pro')) {
		planFilters = planFilters.filter(
			filter =>
				!(
					filter === totalQuantityFilter ||
					filter === batchFilter ||
					filter === useBatchFilter
				),
		)
	} else {
		planFilters = planFilters.filter(filter => {
			if (
				!hasPermissionByRank(user.role, 'administrator') &&
				filter === totalQuantityFilter
			)
				return false
			return true
		})
	}

	return planFilters
}

type RegistrationDates = {
	lastDate: Date | null
	incomingAt: Date | null
	outgoingAt: Date | null
	regulatedAt: Date | null
}

function processRegistrationDates(
	row: Row<InventoryTableRow>,
): RegistrationDates {
	const dates: RegistrationDates = row.getLeafRows().reduce(
		(acc, cur) => {
			function compareDates(
				accDate: Date | null,
				curDate: Date | null,
			): Date | null {
				if (!accDate) return curDate
				if (!curDate) return accDate
				return curDate > accDate ? curDate : accDate
			}

			function getLastDate(...dates: (Date | null)[]): Date | null {
				const sorted = dates
					.filter(d => d != null)
					.sort((a, b) => Number(b) - Number(a))
				return sorted.at(0) ? sorted.at(0)! : null
			}

			acc.incomingAt = compareDates(acc.incomingAt, cur.original.incomingAt)
			acc.outgoingAt = compareDates(acc.outgoingAt, cur.original.outgoingAt)
			acc.regulatedAt = compareDates(acc.regulatedAt, cur.original.regulatedAt)
			acc.lastDate = getLastDate(
				...[acc.incomingAt, acc.outgoingAt, acc.regulatedAt],
			)

			return acc
		},
		{
			lastDate: null,
			incomingAt: null,
			outgoingAt: null,
			regulatedAt: null,
		} as RegistrationDates,
	)
	return dates
}
