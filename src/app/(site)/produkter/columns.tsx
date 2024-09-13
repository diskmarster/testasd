import { TableHeader } from '@/components/table/table-header'
import { Plan } from '@/data/customer.types'
import { Product } from '@/lib/database/schema/inventory'
import { formatDate, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getProductOverviewColumns(plan: Plan): ColumnDef<Product>[] {
  const skuCol: ColumnDef<Product> = {
    accessorKey: 'sku',
    id: 'sku',
    header: ({ column }) => <TableHeader column={column} title='Varenr.' />,
    cell: ({ getValue }) => getValue<string>(),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varenr.',
    },
  }
  const barcodeCol: ColumnDef<Product> = {
    accessorKey: 'barcode',
    id: 'barcode',
    header: ({ column }) => <TableHeader column={column} title='Stregkode' />,
    aggregationFn: 'unique',
    cell: ({ getValue }) => getValue<string>(),
    aggregatedCell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Stregkode',
    },
  }
  const groupCol: ColumnDef<Product> = {
    accessorKey: 'groupID',
    id: 'groupID',
    header: ({ column }) => <TableHeader column={column} title='Varegruppe' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varegruppe',
    },
  }

  const text1Col: ColumnDef<Product> = {
    accessorKey: 'text1',
    id: 'text1',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 1' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varetekst 1',
    },
  }

  const text2Col: ColumnDef<Product> = {
    accessorKey: 'text2',
    id: 'text2',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 2' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varetekst 2',
    },
  }

  const text3Col: ColumnDef<Product> = {
    accessorKey: 'text3',
    id: 'text3',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 3' />,
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    meta: {
      viewLabel: 'Varetekst 3',
    },
  }
  const unitCol: ColumnDef<Product> = {
    accessorKey: 'unitID',
    id: 'unitID',
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

  const costPriceCol: ColumnDef<Product> = {
    accessorKey: 'costPrice',
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

  const salesPriceCol: ColumnDef<Product> = {
    accessorKey: 'salesPrice',
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
  const updatedCol: ColumnDef<Product> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader column={column} title='Sidst opdateret' />
    ),
    aggregatedCell: ({ getValue }) => formatDate(getValue<Date[]>()[0]),
    cell: () => null,
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: 'Sidst opdateret',
    },
  }

  switch (plan) {
    case 'lite':
      const liteCols = [
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        unitCol,
        costPriceCol,
        salesPriceCol,
        updatedCol,
      ]
      return liteCols
    case 'plus':
      const plusCols = [
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        unitCol,
        costPriceCol,
        salesPriceCol,
        updatedCol,
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
        unitCol,
        costPriceCol,
        salesPriceCol,
        updatedCol,
      ]
      return proCols
  }
}
