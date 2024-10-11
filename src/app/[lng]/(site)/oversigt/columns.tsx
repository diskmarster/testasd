import { ModalShowProductCard } from '@/components/inventory/modal-show-product-card'
import { ModalShowProductLabel } from '@/components/inventory/modal-show-product-label'
import { TableOverviewActions } from '@/components/inventory/table-overview-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import { UserRole } from '@/data/user.types'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { cn, formatDate, formatNumber, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableOverviewColumns(
  plan: Plan,
  userRole: UserRole,
  lng: string,
  t: (key: string) => string,
): ColumnDef<FormattedInventory>[] {
  const skuCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.sku',
    id: 'sku',
    header: ({ column }) => (
      <TableHeader column={column} title={t('product-No.')} />
    ),
    cell: ({ row }) => <ModalShowProductCard product={row.original.product} />,
    enableHiding: false,
    meta: {
      viewLabel: t('product-No.'),
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
    meta: {
      viewLabel: t('product-group'),
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
    meta: {
      viewLabel: t('product-text1'),
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
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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
    meta: {
      viewLabel: t('batch'),
    },
  }

  const quantityCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <TableHeader column={column} title={t('quantity')} />
    ),
    cell: ({ getValue }) => (
      <span className={cn(getValue<number>() < 0 && 'text-destructive')}>
        {formatNumber(getValue<number>())}
      </span>
    ),
    filterFn: 'includesString',
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
    aggregatedCell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    cell: () => null,
    filterFn: 'includesString',
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
    aggregatedCell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    cell: () => null,
    filterFn: 'includesString',
    meta: {
      rightAlign: true,
      viewLabel: t('sales-price'),
    },
  }

  const updatedCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'updated',
    header: ({ column }) => <TableHeader column={column} title='Opdateret' />,
    aggregatedCell: ({ getValue }) => formatDate(getValue<Date[]>()[0]),
    cell: () => null,
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
      viewLabel: 'Opdateret',
    },
  }

  const actionsCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'actions',
    header: () => null,
    aggregatedCell: ({ table, row }) => (
      <ModalShowProductLabel product={row.original.product} />
    ),
    cell: ({ table, row }) => <TableOverviewActions row={row} table={table} />,
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
        barcodeCol,
        groupCol,
        text1Col,
        text2Col,
        text3Col,
        quantityCol,
        unitCol,
        costPriceCol,
        salesPriceCol,
        actionsCol,
      ]
      return liteCols
    case 'plus':
      const plusCols = [
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        text2Col,
        text3Col,
        quantityCol,
        unitCol,
        costPriceCol,
        salesPriceCol,
        placementCol,
        actionsCol,
      ]
      return plusCols
    case 'pro':
      const proCols = [
        skuCol,
        barcodeCol,
        groupCol,
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
      ]
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
): FilterField<FormattedInventory>[] {
  const skuFilter: FilterField<FormattedInventory> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: 'Varenr.',
    value: '',
    placeholder: 'Søg i varenr.',
  }
  const barcodeFilter: FilterField<FormattedInventory> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: 'Stregkode',
    value: '',
    placeholder: 'Søg i stregkode',
  }
  const unitFilter: FilterField<FormattedInventory> = {
    column: table.getColumn('unit'),
    type: 'select',
    label: 'Enhed',
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
    label: 'Varegruppe',
    value: '',
    options: [
      ...groups.map(group => ({
        value: group.name,
        label: group.name,
      })),
    ],
  }
  const text1Filter: FilterField<FormattedInventory> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: 'Varetekst 1',
    value: '',
    placeholder: 'Søg i varetekst 1',
  }
  const text2Filter: FilterField<FormattedInventory> = {
    column: table.getColumn('text2'),
    type: 'text',
    label: 'Varetekst 2',
    value: '',
    placeholder: 'Søg i varetekst 2',
  }
  const text3Filter: FilterField<FormattedInventory> = {
    column: table.getColumn('text3'),
    type: 'text',
    label: 'Varetekst 3',
    value: '',
    placeholder: 'Søg i varetekst 3',
  }
  const placementFilter: FilterField<FormattedInventory> | null =
    plan === 'plus' || plan === 'pro'
      ? {
          column: table.getColumn('placement'),
          type: 'select',
          label: 'Placering',
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
          label: 'Batchnr.',
          value: '',
          options: [
            ...batches.map(batch => ({
              value: batch.batch,
              label: batch.batch,
            })),
          ],
        }
      : null

  switch (plan) {
    case 'lite':
      return [
        skuFilter,
        barcodeFilter,
        unitFilter,
        groupFilter,
        text1Filter,
        text2Filter,
        text3Filter,
      ]
    case 'plus':
      return [
        skuFilter,
        barcodeFilter,
        unitFilter,
        groupFilter,
        text1Filter,
        text2Filter,
        text3Filter,
        placementFilter,
      ].filter(
        (filter): filter is FilterField<FormattedInventory> => filter !== null,
      )
    case 'pro':
      return [
        skuFilter,
        barcodeFilter,
        unitFilter,
        groupFilter,
        text1Filter,
        text2Filter,
        text3Filter,
        placementFilter,
        batchFilter,
      ].filter(
        (filter): filter is FilterField<FormattedInventory> => filter !== null,
      )
  }
}
