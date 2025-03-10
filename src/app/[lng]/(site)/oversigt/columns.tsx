import { I18NLanguage } from '@/app/i18n/settings'
import { ModalShowProductLabel } from '@/components/inventory/modal-show-product-label'
import { TableOverviewActions } from '@/components/inventory/table-overview-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByRank } from '@/data/user.types'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { numberRangeFilterFn, stringSortingFn } from '@/lib/tanstack/filter-fns'
import { cn, formatNumber, numberToCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { User } from 'lucia'
import Link from 'next/link'

export function getTableOverviewColumns(
  plan: Plan,
  user: User,
  lng: I18NLanguage,
  t: (key: string, opts?: any) => string,
): ColumnDef<FormattedInventory>[] {
  const skuCol: ColumnDef<FormattedInventory> = {
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

  const attachmentsCol: ColumnDef<FormattedInventory> = {
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
    cell: () => null,
    meta: {
      rightAlign: true, 
      viewLabel: t('attachments')
    },
    enableHiding: false,
    enableSorting: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<number>(id)>0)
    },
  }

  const barcodeCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.barcode',
    id: 'barcode',
    header: ({ column }) => (
      <TableHeader column={column} title={t('barcode')} />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('barcode')), String(rb.getValue('barcode')))
    },
    meta: {
      viewLabel: t('barcode'),
    },
  }

  const groupCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.group',
    id: 'group',
    header: ({ column }) => (
      <TableHeader column={column} title={t('product-group')} />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
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

  const supplierCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.supplierName',
    id: 'supplierName',
    header: ({ column }) => (
      <TableHeader column={column} title={t('supplierName')} />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string | null>(),
    cell: () => null,
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

  const text1Col: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.text1',
    id: 'text1',
    header: ({ column }) => (
      <TableHeader column={column} title={t('product-text1')} />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('text1')), String(rb.getValue('text1')))
    },
    meta: {
      viewLabel: t('product-text1'),
      className: '[&>*]:block',
    },
  }

  const text2Col: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.text2',
    id: 'text2',
    header: ({ column }) => (
      <TableHeader column={column} title={t('product-text2')} />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('text2')), String(rb.getValue('text2')))
    },
    meta: {
      viewLabel: t('product-text2'),
    },
  }

  const text3Col: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.text3',
    id: 'text3',
    header: ({ column }) => (
      <TableHeader column={column} title={t('product-text3')} />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    sortingFn: (ra, rb) => {
      return stringSortingFn(String(ra.getValue('text3')), String(rb.getValue('text3')))

    },
    meta: {
      viewLabel: t('product-text3'),
    },
  }

  const placementCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'placement.name',
    id: 'placement',
    header: ({ column }) => (
      <TableHeader column={column} title={t('placement')} />
    ),
    aggregatedCell: ({ row }) => {
      const isSinglePlacement = row.getLeafRows().length == 1
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

  const batchCol: ColumnDef<FormattedInventory> = {
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

  const quantityCol: ColumnDef<FormattedInventory> = {
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

  const unitCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.unit',
    id: 'unit',
    header: ({ column }) => <TableHeader column={column} title={t('unit')} />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: ({ getValue }) => (
      <p className='text-muted-foreground'>{getValue<string>()}</p>
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

  const costPriceCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.costPrice',
    id: 'costPrice',
    header: ({ column }) => (
      <TableHeader column={column} title={t('cost-price')} />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
    cell: () => null,
    filterFn: (row, id, value) => numberRangeFilterFn(row, id, value),
    meta: {
      rightAlign: true,
      viewLabel: t('cost-price'),
    },
  }

  const salesPriceCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.salesPrice',
    id: 'salesPrice',
    aggregationFn: 'unique',
    header: ({ column }) => (
      <TableHeader column={column} title={t('sales-price')} />
    ),
    aggregatedCell: ({ getValue }) => numberToCurrency(getValue<number>(), lng),
    cell: () => null,
    filterFn: (row, id, value) => numberRangeFilterFn(row, id, value),
    meta: {
      rightAlign: true,
      viewLabel: t('sales-price'),
    },
  }

  const isBarredCol: ColumnDef<FormattedInventory> = {
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
  }

  const actionsCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'actions',
    header: () => null,
    aggregatedCell: ({ row }) => (
      <ModalShowProductLabel product={row.original.product} />
    ),
    cell: ({ table, row }) =>
      hasPermissionByRank(user.role, 'bruger') ? (
        <TableOverviewActions row={row} table={table} plan={plan} />
      ) : null,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  switch (plan) {
    case 'lite':
      const liteCols = [
        skuCol,
        attachmentsCol,
        barcodeCol,
        groupCol,
		supplierCol,
        text1Col,
        text2Col,
        text3Col,
        quantityCol,
        unitCol,
        costPriceCol,
        salesPriceCol,
        actionsCol,
        isBarredCol,
      ].filter(
        col =>
          user.priceAccess || (col !== costPriceCol && col !== salesPriceCol),
      )
      return liteCols
    case 'basis':
      const plusCols = [
        skuCol,
        attachmentsCol,
        barcodeCol,
        groupCol,
		supplierCol,
        text1Col,
        text2Col,
        text3Col,
        quantityCol,
        unitCol,
        costPriceCol,
        salesPriceCol,
        placementCol,
        actionsCol,
        isBarredCol,
      ].filter(
        col =>
          user.priceAccess || (col !== costPriceCol && col !== salesPriceCol),
      )
      return plusCols
    case 'pro':
      const proCols = [
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
        unitCol,
        placementCol,
        batchCol,
        actionsCol,
        isBarredCol,
      ].filter(
        col =>
          user.priceAccess || (col !== costPriceCol && col !== salesPriceCol),
      )
      return proCols
  }
}

export function getTableOverviewFilters(
  plan: Plan,
  table: Table<FormattedInventory>,
  units: Unit[],
  groups: Group[],
  placements: Placement[],
  batches: Batch[],
  t: (key: string) => string,
): FilterField<FormattedInventory>[] {
  const skuFilter: FilterField<FormattedInventory> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: t('product-No.'),
    value: '',
    placeholder: t('product-No.-placeholder'),
  }
  const attachmentsFilter: FilterField<FormattedInventory> = {
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
  const barcodeFilter: FilterField<FormattedInventory> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: t('barcode'),
    value: '',
    placeholder: t('barcode-placeholder'),
  }
  const unitFilter: FilterField<FormattedInventory> = {
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
  const groupFilter: FilterField<FormattedInventory> = {
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
  const supplierNameFilter: FilterField<FormattedInventory> = {
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
  const text1Filter: FilterField<FormattedInventory> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: t('product-text1'),
    value: '',
    placeholder: t('product-text1-placeholder'),
  }
  const text2Filter: FilterField<FormattedInventory> = {
    column: table.getColumn('text2'),
    type: 'text',
    label: t('product-text2'),
    value: '',
    placeholder: t('product-text2-placeholder'),
  }
  const text3Filter: FilterField<FormattedInventory> = {
    column: table.getColumn('text3'),
    type: 'text',
    label: t('product-text3'),
    value: '',
    placeholder: t('product-text3-placeholder'),
  }
  const placementFilter: FilterField<FormattedInventory> | null =
    plan === 'basis' || plan === 'pro'
      ? {
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
      : null

  const batchFilter: FilterField<FormattedInventory> | null =
    plan === 'pro'
      ? {
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
      : null

  const costPriceFilter: FilterField<FormattedInventory> | null =
    // @ts-ignore
    table.options.meta.user.priceAccess
      ? {
          column: table.getColumn('costPrice'),
          type: 'number-range',
          label: t('cost-price'),
          value: '',
        }
      : null

  const salesPriceFilter: FilterField<FormattedInventory> | null =
    // @ts-ignore
    table.options.meta.user.priceAccess
      ? {
          column: table.getColumn('salesPrice'),
          type: 'number-range',
          label: t('sales-price'),
          value: '',
        }
      : null

  const quantityFilter: FilterField<FormattedInventory> = {
    column: table.getColumn('quantity'),
    type: 'number-range',
    label: t('quantity'),
    value: '',
  }

  const isBarredFilter: FilterField<FormattedInventory> = {
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

  switch (plan) {
    case 'lite':
      return [
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
        isBarredFilter,
      ].filter(
        (filter): filter is FilterField<FormattedInventory> => filter !== null,
      )

    case 'basis':
      return [
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
        placementFilter,
        isBarredFilter,
      ].filter(
        (filter): filter is FilterField<FormattedInventory> => filter !== null,
      )
    case 'pro':
      return [
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
        placementFilter,
        batchFilter,
        isBarredFilter,
      ].filter(
        (filter): filter is FilterField<FormattedInventory> => filter !== null,
      )
  }
}
