import { I18NLanguage } from '@/app/i18n/settings'
import { ModalShowProductLabel } from '@/components/inventory/modal-show-product-label'
import { TableOverviewActions } from '@/components/inventory/table-overview-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan, hasPermissionByRank } from '@/data/user.types'
import { CustomerSettings } from '@/lib/database/schema/customer'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { numberRangeFilterFn, stringSortingFn } from '@/lib/tanstack/filter-fns'
import { cn, formatNumber, numberToCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { User } from 'lucia'
import Link from 'next/link'

export type InventoryTableRow = FormattedInventory & {
	disposable: number | null
}

export function getTableOverviewColumns(
  plan: Plan,
  user: User,
  settings: Pick<CustomerSettings, 'useReference' | 'usePlacement' | 'useBatch'>,
  lng: I18NLanguage,
  t: (key: string, opts?: any) => string,
): ColumnDef<InventoryTableRow>[] {
  const skuCol: ColumnDef<InventoryTableRow> = {
    accessorKey: 'product.sku',
    id: 'sku',
    header: ({ column }) => (
      <TableHeader column={column} title={t('product-No.')} />
    ),
    cell: ({ row }) => (
			<Link className='flex items-center gap-1 cursor-pointer hover:underline' href={`/${lng}/varer/produkter/${row.original.product.id}`}>
				<p>{row.original.product.sku}</p>	
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className={cn('hidden size-1.5 rounded-full bg-destructive cursor-pointer', row.original.product.isBarred && 'block')} />
						</TooltipTrigger>
						<TooltipContent className='bg-foreground text-background'>
							{t('modal-show-product-card.barred-tooltip')}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</Link>
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
							<div className={cn('tabular-nums hidden rounded-full', (row.original.product.fileCount != undefined && row.original.product.fileCount > 0) && 'block',)}> 
                <p>{`${row.original.product.fileCount}/5`}</p>
							</div>
    ),
		cell: ({ table, row }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped 
				? null 
				: (
					<div className={cn('tabular-nums hidden rounded-full', (row.original.product.fileCount != undefined && row.original.product.fileCount > 0) && 'block',)}> 
						<p>{`${row.original.product.fileCount}/5`}</p>
					</div>
				)
		),
    meta: {
      rightAlign: true, 
      viewLabel: t('attachments')
    },
    enableHiding: true,
    enableSorting: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<number>(id)>0)
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
		cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>()
		),
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('barcode')), String(rb.getValue('barcode')))
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
		cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>()
		),
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('group')), String(rb.getValue('group')))
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
    cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string | null>()
		),
    sortingFn: (ra, rb) => {
		let aVal = ra.original.product.supplierName
		let bVal = rb.original.product.supplierName
		return stringSortingFn(aVal ?? "", bVal ?? "")
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
    cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>()
		),
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('text1')), String(rb.getValue('text1')))
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
    cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>()
		),
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('text2')), String(rb.getValue('text2')))
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
		cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped ? null : getValue<string>()
		),
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('text3')), String(rb.getValue('text3')))

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
      const isSinglePlacement = 
				row.getLeafRows()
					.filter(leaf => leaf.getValue<number>('quantity') != 0)
					.length == 1
      if (!isSinglePlacement) return null
      return row.original.placement.name
    },
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('placement')), String(rb.getValue('placement')))
    },
    meta: {
      viewLabel: t('placement'),
    },
  }

  const batchCol: ColumnDef<InventoryTableRow> = {
    accessorKey: 'batch.batch',
    id: 'batch',
    header: ({ column }) => <TableHeader column={column} title={t('batch')} />,
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('batch')), String(rb.getValue('batch')))
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

	const dispQuantityCol: ColumnDef<InventoryTableRow> = {
    accessorKey: 'disposible',
    header: ({ column }) => (
      <TableHeader column={column} title={t('disposible')} />
    ),
    aggregatedCell: ({row}) => {
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
    cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped 
				? (<p className='text-muted-foreground'>{getValue<string>()}</p>) 
				: getValue<string>()
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('unit')), String(rb.getValue('unit')))
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
    cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped 
				? null
				: numberToCurrency(getValue<number>(), lng)
		),
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
    cell: ({ table, getValue }) => (
			/*@ts-ignore*/
			table.options.meta?.isGrouped 
				? null
				: numberToCurrency(getValue<number>(), lng)
		),
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
			isShadow: true
		}
  }

  const actionsCol: ColumnDef<InventoryTableRow> = {
    accessorKey: 'actions',
    header: () => null,
    aggregatedCell: ({ row }) => (
      <ModalShowProductLabel product={row.original.product} />
    ),
		cell: ({ table, row }) =>(
			/*@ts-ignore*/
			table.options.meta?.isGrouped 
				? (
					hasPermissionByRank(user.role, 'bruger') ? (
						<TableOverviewActions row={row} table={table} plan={plan} settings={settings} />
					) : null
				): (
					<div className='flex gap-2'>
						<ModalShowProductLabel product={row.original.product} />
						{hasPermissionByRank(user.role, 'bruger') && (
							<TableOverviewActions row={row} table={table} plan={plan} settings={settings} />
						)}
					</div>
			)
		),
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
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
		dispQuantityCol,
		unitCol,
		placementCol,
		batchCol,
		actionsCol,
		isBarredCol,
	]

  if (!user.priceAccess) {
    planCols = planCols.filter(
      col =>
        col != costPriceCol && col != salesPriceCol,
    )
  }

  if (!(hasPermissionByPlan(plan, 'basis') && settings.usePlacement)) {
    planCols = planCols.filter(col => col != placementCol)
  }

  if (!(hasPermissionByPlan(plan, 'pro') && settings.useBatch)) {
    planCols = planCols.filter(col => col != batchCol)
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
  settings: Pick<CustomerSettings, 'useReference' | 'usePlacement' | 'useBatch'>,
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
    options: [{
      value: true,
      label: t('has-attach-yes'),
    },
  {
    value: false,
    label: t('has-attach-no'),
  }],
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
  }
  const supplierNameFilter: FilterField<InventoryTableRow> = {
	  column: table.getColumn('supplierName'),
	  type: 'select',
	  label: t('supplierName'),
	  value: '',
	  placeholder: t('supplierName'),
	  options: [
		  ...Array.from(
			  table
			  .getColumn('supplierName')!
			  .getFacetedUniqueValues()
			  .keys()
		  )
		  .filter(Boolean)
		  .map(opt => ({
			  label: opt,
			  value: opt,
		  }))
	  ]
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
		column: table.getColumn('placement'),
		type: 'select',
		label: t('placement'),
		value: '',
		options: [
			...placements.map(placement => ({
				value: placement.name,
				label: placement.name,
			})),
		],
	}

	const batchFilter: FilterField<InventoryTableRow> = {
		column: table.getColumn('batch'),
		type: 'select',
		label: t('batch'),
		value: '',
		options: [
			...batches.map(batch => ({
				value: batch.batch,
				label: batch.batch,
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
		dispQuantityFilter,
		placementFilter,
		batchFilter,
		isBarredFilter,
	]

  if (!user.priceAccess) {
    planFilters = planFilters.filter(
      filter =>
        filter != costPriceFilter && filter != salesPriceFilter,
    )
  }

  if (!(hasPermissionByPlan(plan, 'basis') && settings.usePlacement)) {
    planFilters = planFilters.filter(filter => filter != placementFilter)
  }

  if (!(hasPermissionByPlan(plan, 'pro') && settings.useBatch)) {
    planFilters = planFilters.filter(filter => filter != batchFilter)
  }

  return planFilters
}
