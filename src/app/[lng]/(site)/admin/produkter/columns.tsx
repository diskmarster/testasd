import { TableOverviewActions } from '@/components/products/product-table-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Plan } from '@/data/customer.types'
import { FormattedProduct } from '@/data/products.types'
import { UserRole } from '@/data/user.types'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { formatDate, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getProductOverviewColumns(
  plan: Plan,
  userRole: UserRole,
): ColumnDef<FormattedProduct>[] {
  const skuCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'sku',
    header: ({ column }) => <TableHeader column={column} title='Varenr.' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varenr.',
    },
  }
  const barcodeCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'barcode',
    header: ({ column }) => <TableHeader column={column} title='Stregkode' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Stregkode',
    },
  }
  const groupCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'group',
    header: ({ column }) => <TableHeader column={column} title='Varegruppe' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varegruppe',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  }

  const text1Col: ColumnDef<FormattedProduct> = {
    accessorKey: 'text1',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 1' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 1',
    },
  }

  const text2Col: ColumnDef<FormattedProduct> = {
    accessorKey: 'text2',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 2' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 2',
    },
  }

  const text3Col: ColumnDef<FormattedProduct> = {
    accessorKey: 'text3',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 3' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 3',
    },
  }
  const unitCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'unit',
    header: ({ column }) => <TableHeader column={column} title='Enhed' />,
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: 'Enhed',
    },
  }

  const costPriceCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'costPrice',
    header: ({ column }) => <TableHeader column={column} title='Kostpris' />,
    cell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    filterFn: 'includesString',
    meta: {
      rightAlign: true,
      viewLabel: 'Kostpris',
    },
  }

  const salesPriceCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'salesPrice',
    header: ({ column }) => <TableHeader column={column} title='Salgspris' />,
    cell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    filterFn: 'includesString',
    meta: {
      rightAlign: true,
      viewLabel: 'Salgspris',
    },
  }
  const updatedCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'updated',
    header: ({ column }) => <TableHeader column={column} title='Opdateret' />,
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
      viewLabel: 'Opdateret',
    },
  }

  const isBarredCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'isBarred',
    header: ({ column }) => <TableHeader column={column} title='Status' />,
    cell: ({ getValue }) => (getValue<boolean>() ? 'Spærret' : 'Aktiv'),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<boolean>(id))
    },
    meta: {
      viewLabel: 'Status',
    },
  }

  const actionsCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableOverviewActions table={table} row={row} />,
    enableHiding: false,
    enableSorting: false,
  }

  const columns = [
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
    isBarredCol,
  ]
  if (userRole != 'bruger') columns.push(actionsCol)
  return columns
}

export function getProductTableOverviewFilters(
  plan: Plan,
  units: Unit[],
  groups: Group[],
  table: Table<FormattedProduct>,
): FilterField<FormattedProduct>[] {
  const skuFilter: FilterField<FormattedProduct> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: 'Varenr.',
    value: '',
    placeholder: 'Søg i varenr.',
  }
  const barcodeFilter: FilterField<FormattedProduct> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: 'Stregkode',
    value: '',
    placeholder: 'Søg i stregkode',
  }
  const unitFilter: FilterField<FormattedProduct> = {
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
  const groupFilter: FilterField<FormattedProduct> = {
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
  const text1Filter: FilterField<FormattedProduct> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: 'Varetekst 1',
    value: '',
    placeholder: 'Søg i varetekst 1',
  }
  const text2Filter: FilterField<FormattedProduct> = {
    column: table.getColumn('text2'),
    type: 'text',
    label: 'Varetekst 2',
    value: '',
    placeholder: 'Søg i varetekst 2',
  }
  const text3Filter: FilterField<FormattedProduct> = {
    column: table.getColumn('text3'),
    type: 'text',
    label: 'Varetekst 3',
    value: '',
    placeholder: 'Søg i varetekst 3',
  }
  const updatedFilter: FilterField<FormattedProduct> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: 'Opdateret',
    value: '',
  }
  const costPriceFilter: FilterField<FormattedProduct> = {
    column: table.getColumn('costPrice'),
    type: 'text',
    label: 'Kostpris',
    value: '',
    placeholder: 'Søg i kostpris.',
  }
  const salesPriceFilter: FilterField<FormattedProduct> = {
    column: table.getColumn('salesPrice'),
    type: 'text',
    label: 'Salgspris',
    value: '',
    placeholder: 'Søg i salgspris.',
  }
  const barredFilter: FilterField<FormattedProduct> = {
    column: table.getColumn('isBarred'),
    type: 'select',
    label: 'Status',
    value: '',
    options: [
      { value: true, label: 'Spærret' },
      { value: false, label: 'Aktiv' },
    ],
  }

  return [
    skuFilter,
    barcodeFilter,
    groupFilter,
    text1Filter,
    text2Filter,
    text3Filter,
    unitFilter,
    costPriceFilter,
    salesPriceFilter,
    updatedFilter,
    barredFilter,
  ]
}
