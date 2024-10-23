import { ModalShowProductCard } from '@/components/inventory/modal-show-product-card'
import { TableReorderActions } from '@/components/inventory/table-reorder-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Checkbox } from '@/components/ui/checkbox'
import { FormattedReorder } from '@/data/inventory.types'
import { UserRole } from '@/data/user.types'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { User } from 'lucia'
import { DateRange } from 'react-day-picker'

export function getTableReorderColumns(
  user: User,
  lng: string,
  t: (key: string) => string,
): ColumnDef<FormattedReorder>[] {
  const selectCol: ColumnDef<FormattedReorder> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }

  const skuCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.sku',
    id: 'sku',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.productNo')} />
    ),
    cell: ({ row }) => <ModalShowProductCard product={row.original.product} user={user} />,
    enableHiding: false,
    meta: {
      viewLabel: t('reorder-columns.productNo'),
    },
  }

  const barcodeCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.barcode',
    id: 'barcode',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.barcode')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('reorder-columns.barcode'),
    },
  }

  const text1Col: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.text1',
    id: 'text1',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.text1')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('reorder-columns.text1'),
    },
  }

  const quantityCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.quantity')} />
    ),
    cell: ({ getValue, row }) => (
      <span
        className={cn(
          row.original.quantity < row.original.minimum && 'text-destructive',
        )}>
        {getValue<number>()}
      </span>
    ),
    filterFn: 'includesString',
    meta: {
      viewLabel: t('reorder-columns.quantity'),
      rightAlign: true,
    },
  }

  const unitCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.unit',
    id: 'unit',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.unit')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: t('reorder-columns.unit'),
    },
  }

  const groupCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.group',
    id: 'group',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.product-group')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: t('reorder-columns.product-group'),
    },
  }

  const minimumCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'minimum',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.minimum-stock')} />
    ),
    cell: ({ getValue }) => formatNumber(getValue<number>()),
    filterFn: 'includesString',
    meta: {
      viewLabel: t('reorder-columns.minimum-stock'),
      rightAlign: true,
    },
  }

  const disposibleCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'disposible',
    header: ({ column }) => (
      <TableHeader
        column={column}
        title={t('reorder-columns.disposible-stock')}
      />
    ),
    cell: ({ getValue }) => formatNumber(getValue<number>()),
    filterFn: 'includesString',
    meta: {
      viewLabel: t('reorder-columns.disposible-stock'),
      rightAlign: true,
    },
  }

  const recAmountCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'recommended',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.recommended')} />
    ),
    cell: ({ getValue }) => formatNumber(getValue<number>()),
    filterFn: 'includesString',
    meta: {
      viewLabel: t('reorder-columns.recommended'),
      rightAlign: true,
      className: 'justify-end',
    },
  }

  const factorCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'buffer',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.buffer')} />
    ),
    cell: ({ getValue }) => formatNumber(getValue<number>() * 100) + '%',
    meta: {
      viewLabel: t('reorder-columns.buffer'),
      rightAlign: true,
    },
    filterFn: (row, id, value) => {
      const adjustedSearchValue = (value / 100).toFixed(2)
      return adjustedSearchValue == row.getValue(id)
    },
  }

  const orderedCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'ordered',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.ordered')} />
    ),
    cell: ({ getValue }) => formatNumber(getValue<number>()),
    filterFn: 'includesString',
    meta: {
      viewLabel: t('reorder-columns.ordered'),
      rightAlign: true,
    },
  }

  const updatedCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader column={column} title={t('reorder-columns.updated')} />
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
      viewLabel: t('reorder-columns.updated'),
    },
  }

  const actionsCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableReorderActions row={row} table={table} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  return [
    selectCol,
    skuCol,
    barcodeCol,
    text1Col,
    groupCol,
    quantityCol,
    unitCol,
    minimumCol,
    recAmountCol,
    orderedCol,
    disposibleCol,
    factorCol,
    updatedCol,
    actionsCol,
  ]
}

export function getTableReorderFilters(
  table: Table<FormattedReorder>,
  units: Unit[],
  groups: Group[],
  lng: string,
  t: (key: string) => string,
): FilterField<FormattedReorder>[] {
  const skuFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: t('reorder-columns.productNo'),
    value: '',
    placeholder: t('filter-placeholders.productNo'),
  }
  const barcodeFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: t('reorder-columns.barcode'),
    value: '',
    placeholder: t('filter-placeholders.barcode'),
  }
  const unitFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('unit'),
    type: 'select',
    label: t('reorder-columns.unit'),
    value: '',
    options: [
      ...units.map(unit => ({
        value: unit.name,
        label: unit.name,
      })),
    ],
  }
  const groupFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('group'),
    type: 'select',
    label: t('reorder-columns.product-group'),
    value: '',
    options: [
      ...groups.map(group => ({
        value: group.name,
        label: group.name,
      })),
    ],
  }

  const quantityFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('quantity'),
    type: 'text',
    label: t('reorder-columns.quantity'),
    value: '',
    placeholder: t('filter-placeholders.quantity'),
  }

  const minimumFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('minimum'),
    type: 'text',
    label: t('reorder-columns.minimum-stock'),
    value: '',
    placeholder: t('filter-placeholders.minimum-stock'),
  }

  const text1Filter: FilterField<FormattedReorder> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: t('reorder-columns.text1'),
    value: '',
    placeholder: t('filter-placeholders.text1'),
  }
  const updatedFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: t('reorder-columns.updated'),
    value: '',
  }

  const orderedFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('ordered'),
    type: 'text',
    label: t('reorder-columns.ordered'),
    value: '',
    placeholder: t('filter-placeholders.ordered'),
  }

  const recAmountFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('recommended'),
    type: 'text',
    label: t('reorder-columns.recommended'),
    value: '',
    placeholder: t('filter-placeholders.recommended'),
  }

  const disposibleFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('disposible'),
    type: 'text',
    label: t('reorder-columns.disposible-stock'),
    value: '',
    placeholder: t('filter-placeholders.disposible'),
  }

  const factorFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('buffer'),
    type: 'text',
    label: t('reorder-columns.buffer'),
    value: '',
    placeholder: t('filter-placeholders.buffer'),
  }

  return [
    skuFilter,
    barcodeFilter,
    text1Filter,
    groupFilter,
    quantityFilter,
    unitFilter,
    minimumFilter,
    recAmountFilter,
    orderedFilter,
    disposibleFilter,
    factorFilter,
    updatedFilter,
  ]
}
