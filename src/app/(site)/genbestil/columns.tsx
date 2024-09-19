import { TableOverviewActions } from '@/components/inventory/table-overview-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { FormattedReorder } from '@/data/inventory.types'
import { UserRole } from '@/data/user.types'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { ColumnDef, Table } from '@tanstack/react-table'

export function getTableReorderColumns(
  userRole: UserRole,
): ColumnDef<FormattedReorder>[] {
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
    cell: ({ getValue }) => getValue<number>(),
    meta: {
      viewLabel: 'Beholdning',
      rightAlign: true,
    },
  }

  const actionsCol: ColumnDef<FormattedReorder> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableOverviewActions row={row} table={table} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  return [skuCol, barcodeCol, text1Col, quantityCol, actionsCol]
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
  const text1Filter: FilterField<FormattedReorder> = {
    column: table.getColumn('text1'),
    type: 'text',
    label: 'Varetekst 1',
    value: '',
    placeholder: 'Søg i varetekst 1',
  }
  const text2Filter: FilterField<FormattedReorder> = {
    column: table.getColumn('text2'),
    type: 'text',
    label: 'Varetekst 2',
    value: '',
    placeholder: 'Søg i varetekst 2',
  }
  const text3Filter: FilterField<FormattedReorder> = {
    column: table.getColumn('text3'),
    type: 'text',
    label: 'Varetekst 3',
    value: '',
    placeholder: 'Søg i varetekst 3',
  }
  const updatedFilter: FilterField<FormattedReorder> = {
    column: table.getColumn('updated'),
    type: 'date',
    label: 'Sidst opdateret',
    value: '',
  }

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
}
