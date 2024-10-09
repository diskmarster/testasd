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
import { Batch, Group, History, Placement, Unit } from '@/lib/database/schema/inventory'
import { cn, formatDate, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableHistoryColumns(
  plan: Plan,
  userRole: UserRole,
): ColumnDef<History>[] {
  const insertedCol: ColumnDef<History> = {
    accessorKey: 'inserted',
    header: ({ column }) => <TableHeader column={column} title='Oprettet' />,
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
      viewLabel: 'Oprettet',
    },
  }

  const skuCol: ColumnDef<History> = {
    accessorKey: 'productSku',
    id: 'sku',
    header: ({ column }) => <TableHeader column={column} title='Varenr.' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varenr.',
    },
  }

  const barcodeCol: ColumnDef<History> = {
    accessorKey: 'productBarcode',
    id: 'barcode',
    header: ({ column }) => <TableHeader column={column} title='Stregkode' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Stregkode',
    },
  }

  const groupCol: ColumnDef<History> = {
    accessorKey: 'productGroupName',
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

  const text1Col: ColumnDef<History> = {
    accessorKey: 'productText1',
    id: 'text1',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 1' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 1',
    },
  }

  const text2Col: ColumnDef<History> = {
    accessorKey: 'productText2',
    id: 'text2',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 2' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 2',
    },
  }

  const text3Col: ColumnDef<History> = {
    accessorKey: 'productText3',
    id: 'text3',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 3' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 3',
    },
  }

  const costPriceCol: ColumnDef<History> = {
    accessorKey: 'productCostPrice',
    id: 'costPrice',
    header: ({ column }) => <TableHeader column={column} title='Kostpris' />,
    cell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    meta: {
      viewLabel: 'Kostpris',
      rightAlign: true,
    },
    filterFn: 'weakEquals',
  }

  const unitCol: ColumnDef<History> = {
    accessorKey: 'productUnit',
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

  const amountCol: ColumnDef<History> = {
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

  const placementCol: ColumnDef<History> = {
    accessorKey: 'placementName',
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

  const batchCol: ColumnDef<History> = {
    accessorKey: 'batchName',
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
    header: ({ column }) => <TableHeader column={column} title='Konto/sag' />,
    cell: ({ getValue }) => (
      <span className='max-w-48 truncate'>{getValue<string>()}</span>
    ),
    meta: {
      viewLabel: 'Konto/sag',
    },
  }

  const userCol: ColumnDef<History> = {
    accessorKey: 'userName',
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
  table: Table<History>,
  units: Unit[],
  groups: Group[],
  placements: Placement[],
  batches: Batch[],
): FilterField<History>[] {
  const insertedFilter: FilterField<History> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: 'Oprettet',
    value: '',
  }

  const skuFilter: FilterField<History> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: 'Varenr.',
    value: '',
    placeholder: 'Søg i varenr.',
  }

  const barcodeFilter: FilterField<History> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: 'Stregkode',
    value: '',
    placeholder: 'Søg i stregkode',
  }

  const groupFilter: FilterField<History> = {
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

  const text1Filter: FilterField<History> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: 'Varetekst 1',
    value: '',
    placeholder: 'Søg i varetekst 1',
  }

  const text2Filter: FilterField<History> = {
    column: table.getColumn('text2'),
    type: 'text',
    label: 'Varetekst 2',
    value: '',
    placeholder: 'Søg i varetekst 2',
  }

  const text3Filter: FilterField<History> = {
    column: table.getColumn('text3'),
    type: 'text',
    label: 'Varetekst 3',
    value: '',
    placeholder: 'Søg i varetekst 3',
  }

  const costPriceFilter: FilterField<History> = {
    column: table.getColumn('costPrice'),
    type: 'text',
    label: 'Kostpris',
    value: '',
  }

  const unitFilter: FilterField<History> = {
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

  const typeFilter: FilterField<History> = {
    column: table.getColumn('type'),
    type: 'select',
    label: 'Type',
    value: '',
    options: [
      { value: 'tilgang', label: 'Tilgang' },
      { value: 'afgang', label: 'Afgang' },
      { value: 'regulering', label: 'Regulering' },
      { value: 'flyt', label: 'Flyt' },
    ],
  }

  const amountFilter: FilterField<History> = {
    column: table.getColumn('amount'),
    type: 'text',
    label: 'Antal',
    value: '',
  }

  const placementFilter: FilterField<History> = {
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
  const batchFilter: FilterField<History> = {
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

  const refFilter: FilterField<History> = {
    column: table.getColumn('reference'),
    type: 'text',
    label: 'Konto/sag',
    placeholder: 'Søg i konto/sag',
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
