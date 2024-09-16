import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Plan } from '@/data/customer.types'
import {
  FormattedHistory,
  HistoryPlatform,
  HistoryType,
} from '@/data/inventory.types'
import { UserRole } from '@/data/user.types'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { cn, formatDate, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getTableHistoryColumns(
  plan: Plan,
  userRole: UserRole,
): ColumnDef<FormattedHistory>[] {
  const insertedCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'inserted',
    header: ({ column }) => <TableHeader column={column} title='Oprettet' />,
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: 'Oprettet',
    },
  }

  const skuCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.sku',
    id: 'sku',
    header: ({ column }) => <TableHeader column={column} title='Varenr.' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varenr.',
    },
  }

  const barcodeCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.barcode',
    id: 'barcode',
    header: ({ column }) => <TableHeader column={column} title='Stregkode' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Stregkode',
    },
  }

  const groupCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.group',
    id: 'group',
    header: ({ column }) => <TableHeader column={column} title='Varegruppe' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varegruppe',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const text1Col: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.text1',
    id: 'text1',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 1' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 1',
    },
  }

  const text2Col: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.text2',
    id: 'text2',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 2' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 2',
    },
  }

  const text3Col: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.text3',
    id: 'text3',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 3' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 3',
    },
  }

  const costPriceCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.costPrice',
    id: 'costPrice',
    header: ({ column }) => <TableHeader column={column} title='Kostpris' />,
    cell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    meta: {
      viewLabel: 'Kostpris',
      rightAlign: true,
    },
    filterFn: 'weakEquals',
  }

  const unitCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.unit',
    id: 'unit',
    header: ({ column }) => <TableHeader column={column} title='Enhed' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Enhed',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const typeCol: ColumnDef<FormattedHistory> = {
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
          {type}
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

  const amountCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'amount',
    header: ({ column }) => <TableHeader column={column} title='Antal' />,
    cell: ({ getValue }) => {
      const amount = getValue<number>()

      return (
        <span className={cn('', amount < 0 && 'text-destructive')}>
          {amount}
        </span>
      )
    },
    meta: {
      viewLabel: 'Antal',
      rightAlign: true,
    },
    filterFn: 'weakEquals',
  }

  const placementCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'placement.name',
    id: 'placement',
    header: ({ column }) => <TableHeader column={column} title='Placering' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Placering',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const batchCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'batch.batch',
    id: 'batch',
    header: ({ column }) => <TableHeader column={column} title='Batchnr.' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Batchnr.',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const platformCol: ColumnDef<FormattedHistory> = {
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

  const refCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'reference',
    header: ({ column }) => <TableHeader column={column} title='Reference' />,
    cell: ({ getValue }) => (
      <span className='max-w-48 truncate'>{getValue<string>()}</span>
    ),
    meta: {
      viewLabel: 'Reference',
    },
  }

  const userCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'user.name',
    id: 'user',
    header: ({ column }) => <TableHeader column={column} title='Bruger' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Bruger',
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
      ]
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
      ]
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
      ]
      return proCols
  }
}

export function getTableHistoryFilters(
  plan: Plan,
  table: Table<FormattedHistory>,
  units: Unit[],
  groups: Group[],
  placements: Placement[],
  batches: Batch[],
): FilterField<FormattedHistory>[] {
  const insertedFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('inserted'),
    type: 'date',
    label: 'Oprettet',
    value: '',
  }

  const skuFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: 'Varenr.',
    value: '',
    placeholder: 'Søg i varenr.',
  }

  const barcodeFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: 'Stregkode',
    value: '',
    placeholder: 'Søg i stregkode',
  }

  const groupFilter: FilterField<FormattedHistory> = {
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

  const text1Filter: FilterField<FormattedHistory> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: 'Varetekst 1',
    value: '',
    placeholder: 'Søg i varetekst 1',
  }

  const text2Filter: FilterField<FormattedHistory> = {
    column: table.getColumn('text2'),
    type: 'text',
    label: 'Varetekst 2',
    value: '',
    placeholder: 'Søg i varetekst 2',
  }

  const text3Filter: FilterField<FormattedHistory> = {
    column: table.getColumn('text3'),
    type: 'text',
    label: 'Varetekst 3',
    value: '',
    placeholder: 'Søg i varetekst 3',
  }

  const costPriceFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('costPrice'),
    type: 'text',
    label: 'Kostpris',
    value: '',
  }

  const unitFilter: FilterField<FormattedHistory> = {
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

  const typeFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('type'),
    type: 'select',
    label: 'Type',
    value: '',
    options: [
      { value: 'tilgang', label: 'Tilgang' },
      { value: 'afgang', label: 'Afgang' },
      { value: 'regulering', label: 'Regulering' },
    ],
  }

  const amountFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('amount'),
    type: 'text',
    label: 'Antal',
    value: '',
  }

  const placementFilter: FilterField<FormattedHistory> = {
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
  const batchFilter: FilterField<FormattedHistory> = {
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

  const refFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('reference'),
    type: 'text',
    label: 'Reference',
    value: '',
  }

  const platformFilter: FilterField<FormattedHistory> = {
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
