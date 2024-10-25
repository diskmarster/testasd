import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Plan } from '@/data/customer.types'
import {
  HistoryPlatform,
  HistoryType,
} from '@/data/inventory.types'
import { Batch, Group, History, Placement, Unit } from '@/lib/database/schema/inventory'
import { cn, formatDate, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { TFunction } from 'i18next'
import { User } from 'lucia'
import { DateRange } from 'react-day-picker'

export function getTableHistoryColumns(
  plan: Plan,
  user: User,
  lng: string,
  t: TFunction<'historik', undefined>,
): ColumnDef<History>[] {
  const insertedCol: ColumnDef<History> = {
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

  const skuCol: ColumnDef<History> = {
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

  const barcodeCol: ColumnDef<History> = {
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

  const groupCol: ColumnDef<History> = {
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

  const text1Col: ColumnDef<History> = {
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

  const text2Col: ColumnDef<History> = {
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

  const text3Col: ColumnDef<History> = {
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

  const costPriceCol: ColumnDef<History> = {
    accessorKey: 'productCostPrice',
    id: 'costPrice',
    header: ({ column }) => (
      <TableHeader column={column} title={t('history-columns.cost-price')} />
    ),
    cell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    meta: {
      viewLabel: t('history-columns.cost-price'),
      rightAlign: true,
    },
    filterFn: 'weakEquals',
  }

  const unitCol: ColumnDef<History> = {
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

  const typeCol: ColumnDef<History> = {
    accessorKey: 'type',
    header: ({ column }) => <TableHeader column={column} title='Type' />,
    cell: ({ getValue }) => {
      const type = getValue<HistoryType>()
      const variant =
        type == 'tilgang'
          ? 'success'
          : type == 'afgang'
            ? 'destructive'
            : 'warning'

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

  const amountCol: ColumnDef<History> = {
    accessorKey: 'amount',
    header: ({ column }) => (
      <TableHeader column={column} title={t('history-columns.quantity')} />
    ),
    cell: ({ getValue }) => {
      const amount = getValue<number>()

      return (
        <span className={cn('', amount < 0 && 'text-destructive')}>
          {amount}
        </span>
      )
    },
    meta: {
      viewLabel: t('history-columns.quantity'),
      rightAlign: true,
    },
    filterFn: 'weakEquals',
  }

  const placementCol: ColumnDef<History> = {
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

  const batchCol: ColumnDef<History> = {
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

  const platformCol: ColumnDef<History> = {
    accessorKey: 'platform',
    header: ({ column }) => <TableHeader column={column} title='Platform' />,
    cell: ({ getValue }) => {
      const platform = getValue<HistoryPlatform>()
      const variant = platform == 'web' ? 'secondary' : 'outline'

      return (
        <Badge className='capitalize' variant={variant}>
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

  const refCol: ColumnDef<History> = {
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

  const userCol: ColumnDef<History> = {
    accessorKey: 'userName',
    id: 'user',
    header: ({ column }) => (
      <TableHeader column={column} title={t('history-columns.user')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('history-columns.user'),
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  switch (plan) {
    case 'lite':
      const liteCols = [
        insertedCol,
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        text2Col,
        text3Col,
        costPriceCol,
        unitCol,
        typeCol,
        amountCol,
        platformCol,
        userCol,
        refCol,
      ].filter(col => user.priceAccess || col !== costPriceCol)
      return liteCols
    case 'plus':
      const plusCols = [
        insertedCol,
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        text2Col,
        text3Col,
        costPriceCol,
        unitCol,
        typeCol,
        amountCol,
        placementCol,
        platformCol,
        userCol,
        refCol,
      ].filter(col => user.priceAccess || col !== costPriceCol)
      return plusCols
    case 'pro':
      const proCols = [
        insertedCol,
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        text2Col,
        text3Col,
        costPriceCol,
        unitCol,
        typeCol,
        amountCol,
        placementCol,
        batchCol,
        platformCol,
        userCol,
        refCol,
      ].filter(col => user.priceAccess || col !== costPriceCol)
      return proCols
  }
}

export function getTableHistoryFilters(
  plan: Plan,
  table: Table<History>,
  units: Unit[],
  groups: Group[],
  placements: Placement[],
  batches: Batch[],
  lng: string,
  t: (key: string) => string,
): FilterField<History>[] {
  const insertedFilter: FilterField<History> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: t('history-columns.created'),
    value: '',
  }

  const skuFilter: FilterField<History> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: t('history-columns.productNo'),
    value: '',
    placeholder: t('history-columns.placeholders.productNo'),
  }

  const barcodeFilter: FilterField<History> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: t('history-columns.barcode'),
    value: '',
    placeholder: t('history-columns.placeholders.barcode'),
  }

  const groupFilter: FilterField<History> = {
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

  const text1Filter: FilterField<History> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: t('history-columns.text1'),
    value: '',
    placeholder: t('history-columns.placeholders.text1'),
  }

  const text2Filter: FilterField<History> = {
    column: table.getColumn('text2'),
    type: 'text',
    label: t('history-columns.text2'),
    value: '',
    placeholder: t('history-columns.placeholders.text2'),
  }

  const text3Filter: FilterField<History> = {
    column: table.getColumn('text3'),
    type: 'text',
    label: t('history-columns.text3'),
    value: '',
    placeholder: t('history-columns.placeholders.text3'),
  }

  const costPriceFilter: FilterField<History> = {
    column: table.getColumn('costPrice'),
    type: 'text',
    label: t('history-columns.cost-price'),
    value: '',
  }

  const unitFilter: FilterField<History> = {
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

  const typeFilter: FilterField<History> = {
    column: table.getColumn('type'),
    type: 'select',
    label: 'Type',
    value: '',
    options: [
      { value: 'tilgang', label: t('history-columns.type.incoming') },
      { value: 'afgang', label: t('history-columns.type.outgoing') },
      { value: 'regulering', label: t('history-columns.type.regulation') },
      { value: 'flyt', label: t('history-columns.type.move') },
    ],
  }

  const amountFilter: FilterField<History> = {
    column: table.getColumn('amount'),
    type: 'text',
    label: t('history-columns.quantity'),
    value: '',
  }

  const placementFilter: FilterField<History> = {
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
  const batchFilter: FilterField<History> = {
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

  const refFilter: FilterField<History> = {
    column: table.getColumn('reference'),
    type: 'text',
    label: t('history-columns.reference'),
    placeholder: t('history-columns.placeholders.reference'),
    value: '',
  }

  const platformFilter: FilterField<History> = {
    column: table.getColumn('platform'),
    type: 'select',
    label: 'Platform',
    value: '',
    options: [
      { value: 'web', label: 'Web' },
      { value: 'app', label: 'App' },
    ],
  }

  switch (plan) {
    case 'lite':
      return [
        insertedFilter,
        skuFilter,
        barcodeFilter,
        groupFilter,
        text1Filter,
        text2Filter,
        text3Filter,
        costPriceFilter,
        unitFilter,
        typeFilter,
        amountFilter,
        platformFilter,
        refFilter,
      ]
    case 'plus':
      return [
        insertedFilter,
        skuFilter,
        barcodeFilter,
        groupFilter,
        text1Filter,
        text2Filter,
        text3Filter,
        costPriceFilter,
        unitFilter,
        typeFilter,
        amountFilter,
        placementFilter,
        platformFilter,
        refFilter,
      ]
    case 'pro':
      return [
        insertedFilter,
        skuFilter,
        barcodeFilter,
        groupFilter,
        text1Filter,
        text2Filter,
        text3Filter,
        costPriceFilter,
        unitFilter,
        typeFilter,
        amountFilter,
        placementFilter,
        batchFilter,
        platformFilter,
        refFilter,
      ]
  }
}
