import { TableReorderActions } from '@/components/inventory/table-reorder-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Checkbox } from '@/components/ui/checkbox'
import { FormattedReorder } from '@/data/inventory.types'
import { UserRole } from '@/data/user.types'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { cn, formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableReorderColumns(
  userRole: UserRole,
): ColumnDef<FormattedReorder>[] {
  const selectCol: ColumnDef<FormattedReorder> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        className='data-[state=checked]:mt-[13px] data-[state=indeterminate]:mt-[13px]'
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
        className='-translate-y-1 data-[state=checked]:translate-y-0.5'
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
    header: ({ column }) => <TableHeader column={column} title='Varenr.' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varenr.',
    },
  }

  const barcodeCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.barcode',
    id: 'barcode',
    header: ({ column }) => <TableHeader column={column} title='Stregkode' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Stregkode',
    },
  }

  const text1Col: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.text1',
    id: 'text1',
    header: ({ column }) => <TableHeader column={column} title='Varetekst 1' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Varetekst 1',
    },
  }

  const quantityCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'quantity',
    header: ({ column }) => <TableHeader column={column} title='Beholdning' />,
    cell: ({ getValue, row }) => (
      <span
        className={cn(
          row.original.quantity < row.original.minimum && 'text-destructive',
        )}>
        {getValue<number>()}
      </span>
    ),
    filterFn: 'weakEquals',
    meta: {
      viewLabel: 'Beholdning',
      rightAlign: true,
    },
  }

  const unitCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.unit',
    id: 'unit',
    header: ({ column }) => <TableHeader column={column} title='Enhed' />,
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: 'Enhed',
    },
  }

  const groupCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'product.group',
    id: 'group',
    header: ({ column }) => <TableHeader column={column} title='Varegruppe' />,
    cell: ({ getValue }) => getValue<string>(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      viewLabel: 'Varegruppe',
    },
  }

  const minimumCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'minimum',
    header: ({ column }) => (
      <TableHeader column={column} title='Min. beholdning' />
    ),
    cell: ({ getValue }) => getValue<number>(),
    filterFn: 'weakEquals',
    meta: {
      viewLabel: 'Min. beholdning',
      rightAlign: true,
    },
  }

  const recAmountCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'recommended',
    header: ({ column }) => (
      <TableHeader column={column} title='Anbefalet genbestil' />
    ),
    cell: ({ getValue }) => getValue<string>(),
    filterFn: 'weakEquals',
    meta: {
      viewLabel: 'Anbefalet genbestil',
      rightAlign: true,
      className: 'justify-end',
    },
  }

  const factorCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'buffer',
    header: ({ column }) => <TableHeader column={column} title='Faktor (%)' />,
    cell: ({ getValue }) => (getValue<number>() * 100).toFixed(2) + '%',
    meta: {
      viewLabel: 'Faktor (%)',
      rightAlign: true,
    },
    filterFn: (row, id, value) => {
      const adjustedSearchValue = (value / 100).toFixed(2)
      return adjustedSearchValue == row.getValue(id)
    },
  }

  const orderedCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'ordered',
    header: ({ column }) => <TableHeader column={column} title='Bestilt' />,
    cell: ({ getValue }) => getValue<number>(),
    filterFn: 'weakEquals',
    meta: {
      viewLabel: 'Bestilt',
      rightAlign: true,
    },
  }

  const updatedCol: ColumnDef<FormattedReorder> = {
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
    factorCol,
    recAmountCol,
    orderedCol,
    updatedCol,
    actionsCol,
  ]
}

export function getTableReorderFilters(
  table: Table<FormattedReorder>,
  units: Unit[],
  groups: Group[],
): FilterField<FormattedReorder>[] {
  const skuFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('sku'),
    type: 'text',
    label: 'Varenr.',
    value: '',
    placeholder: 'Søg i varenr.',
  }
  const barcodeFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('barcode'),
    type: 'text',
    label: 'Stregkode',
    value: '',
    placeholder: 'Søg i stregkode',
  }
  const unitFilter: FilterField<FormattedReorder> = {
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
  const groupFilter: FilterField<FormattedReorder> = {
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

  const quantityFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('quantity'),
    type: 'text',
    label: 'Beholdning',
    value: '',
    placeholder: 'Søg i beholdning',
  }

  const minimumFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('minimum'),
    type: 'text',
    label: 'Min. beholdning',
    value: '',
    placeholder: 'Søg i min. beholdning',
  }

  const text1Filter: FilterField<FormattedReorder> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: 'Varetekst 1',
    value: '',
    placeholder: 'Søg i varetekst 1',
  }
  const updatedFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: 'Opdateret',
    value: '',
  }

  const orderedFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('ordered'),
    type: 'text',
    label: 'Bestilt',
    value: '',
    placeholder: 'Søg i bestilt',
  }

  const recAmountFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('recommended'),
    type: 'text',
    label: 'Anbefalet',
    value: '',
    placeholder: 'Søg i anbefalet genbestil',
  }

  const factorFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('buffer'),
    type: 'text',
    label: 'Faktor (%)',
    value: '',
    placeholder: 'Søg i faktor',
  }

  return [
    skuFilter,
    barcodeFilter,
    text1Filter,
    groupFilter,
    quantityFilter,
    unitFilter,
    minimumFilter,
    factorFilter,
    recAmountFilter,
    orderedFilter,
    updatedFilter,
  ]
}
