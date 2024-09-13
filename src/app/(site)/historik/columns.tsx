import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Plan } from '@/data/customer.types'
import { FormattedHistory } from '@/data/inventory.types'
import { UserRole } from '@/data/user.types'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { cn, formatDate, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getTableHistoryColumns(
  plan: Plan,
  userRole: UserRole,
): ColumnDef<FormattedHistory>[] {
  const skuCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.sku',
    id: 'sku',
    header: ({ column }) => <TableHeader column={column} title='Varenr.' />,
    cell: ({ getValue }) => getValue<string>(),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varenr.',
    },
  }

  const barcodeCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.barcode',
    id: 'barcode',
    header: ({ column }) => <TableHeader column={column} title='Stregkode' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Stregkode',
    },
  }

  const groupCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.group',
    id: 'group',
    header: ({ column }) => <TableHeader column={column} title='Varegruppe' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varegruppe',
    },
  }

  const text1Col: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.text1',
    id: 'text1',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 1' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varetekst 1',
    },
  }

  const text2Col: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.text2',
    id: 'text2',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 2' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varetekst 2',
    },
  }

  const text3Col: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.text3',
    id: 'text3',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 3' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varetekst 3',
    },
  }

  const placementCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'placement.name',
    id: 'placement',
    header: ({ column }) => <TableHeader column={column} title='Placering' />,
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: 'Placering',
    },
  }

  const batchCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'batch.batch',
    id: 'batch',
    header: ({ column }) => <TableHeader column={column} title='Batchnr.' />,
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: 'Batchnr.',
    },
  }

  const quantityCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'quantity',
    header: ({ column }) => <TableHeader column={column} title='Beholdning' />,
    cell: ({ getValue }) => (
      <span className={cn(getValue<number>() < 0 && 'text-destructive')}>
        {getValue<number>()}
      </span>
    ),
    meta: {
      rightAlign: true,
      viewLabel: 'Beholdning',
    },
  }

  const unitCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.unit',
    id: 'unit',
    header: ({ column }) => <TableHeader column={column} title='Enhed' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: ({ getValue }) => (
      <p className='text-muted-foreground'>{getValue<string>()}</p>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: 'Enhed',
    },
  }

  const costPriceCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.costPrice',
    id: 'costPrice',
    header: ({ column }) => <TableHeader column={column} title='Kostpris' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    cell: () => null,
    meta: {
      rightAlign: true,
      viewLabel: 'Kostpris',
    },
  }

  const salesPriceCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'product.salesPrice',
    id: 'salesPrice',
    header: ({ column }) => <TableHeader column={column} title='Salgspris' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    cell: () => null,
    meta: {
      rightAlign: true,
      viewLabel: 'Salgspris',
    },
  }

  const insertedCol: ColumnDef<FormattedHistory> = {
    accessorKey: 'inserted',
    header: ({ column }) => <TableHeader column={column} title='Oprettet' />,
    aggregatedCell: ({ getValue }) => formatDate(getValue<Date>()),
    cell: () => null,
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: 'Oprettet',
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
        insertedCol,
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
        insertedCol,
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
        insertedCol,
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
  const unitFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('unit'),
    type: 'select',
    label: 'Enhed',
    value: '',
    options: [
      ...units.map(unit => ({
        value: unit.id,
        label: unit.name,
      })),
    ],
  }
  const groupFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('group'),
    type: 'select',
    label: 'Varegruppe',
    value: '',
    options: [
      ...groups.map(group => ({
        value: group.id,
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
  const placementFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('placement'),
    type: 'select',
    label: 'Placering',
    value: '',
    options: [
      ...placements.map(placement => ({
        value: placement.id,
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
        value: batch.id,
        label: batch.batch,
      })),
    ],
  }
  const updatedFilter: FilterField<FormattedHistory> = {
    column: table.getColumn('inserted'),
    type: 'date',
    label: 'Oprettet',
    value: '',
  }

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
        updatedFilter,
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
        updatedFilter,
      ]
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
        updatedFilter,
      ]
  }
}
