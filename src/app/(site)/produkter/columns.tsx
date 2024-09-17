import { TableOverviewActions } from '@/components/products/product-table-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Plan } from '@/data/customer.types'
import { FormattedProduct } from '@/data/products.types'
import { UserRole } from '@/data/user.types'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { formatDate, numberToDKCurrency } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isSameDay } from 'date-fns'

export function getProductOverviewColumns(
  plan: Plan,
  userRole: UserRole
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
    header: ({ column }) => (
      <TableHeader column={column} title='Sidst opdateret' />
    ),
    cell: ({ getValue }) => formatDate(getValue<Date>()),
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
    meta: {
      viewLabel: 'Sidst opdateret',
    },
  }
  const actionsCol: ColumnDef<FormattedProduct> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableOverviewActions table={table} row={row} />,
    enableHiding: false,
    enableSorting: false,
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
      if (userRole != 'bruger') liteCols.push(actionsCol)
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
      if (userRole != 'bruger') plusCols.push(actionsCol)
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
      if (userRole != 'bruger') proCols.push(actionsCol)
      return proCols
  }
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
        value: unit.id,
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
        value: group.id,
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
    type: 'date',
    label: 'Sidst opdateret',
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
  switch (plan) {
    case 'lite':
      return [
        skuFilter,
        barcodeFilter,
        groupFilter,
        text1Filter,
        unitFilter,
        costPriceFilter,
        salesPriceFilter,
        updatedFilter,
      ]
    case 'plus':
      return [
        skuFilter,
        barcodeFilter,
        groupFilter,
        text1Filter,
        unitFilter,
        costPriceFilter,
        salesPriceFilter,
        updatedFilter,
      ]
    case 'pro':
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
      ]
  }
}
