import { TableOverviewActions } from "@/components/inventory/table-overview-actions";
import { TableHeader } from "@/components/table/table-header";
import { Plan } from "@/data/customer.types";
import { FormattedInventory } from "@/data/inventory.types";
import { UserRole } from "@/data/user.types";
import { formatDate, numberToDKCurrency } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { isSameDay } from 'date-fns'

export function getTableOverviewColumns(plan: Plan, userRole: UserRole): ColumnDef<FormattedInventory>[] {
  const skuCol: ColumnDef<FormattedInventory> = {
    accessorKey: "product.sku",
    id: 'sku',
    header: ({ column }) => (
      <TableHeader column={column} title="Varenr." />
    ),
    cell: ({ getValue }) => getValue<string>(),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>()
  }

  const barcodeCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.barcode',
    id: 'barcode',
    header: ({ column }) => (
      <TableHeader column={column} title='Stregkode' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null
  }

  const groupCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.group',
    id: 'group',
    header: ({ column }) => (
      <TableHeader column={column} title='Varegruppe' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null
  }

  const text1Col: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.text1',
    id: 'text1',
    header: ({ column }) => (
      <TableHeader column={column} title='Varetekst 1' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null
  }

  const text2Col: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.text2',
    id: 'text2',
    header: ({ column }) => (
      <TableHeader column={column} title='Varetekst 2' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null
  }

  const text3Col: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.text3',
    id: 'text3',
    header: ({ column }) => (
      <TableHeader column={column} title='Varetekst 3' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null
  }

  const placementCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'placement.name',
    id: 'placement',
    header: ({ column }) => (
      <TableHeader column={column} title='Placering' />
    ),
    cell: ({ getValue }) => getValue<string>(),
  }

  const batchCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'batch.batch',
    id: 'batch',
    header: ({ column }) => (
      <TableHeader column={column} title='Batchnr.' />
    ),
    cell: ({ getValue }) => getValue<string>(),
  }

  const quantityCol: ColumnDef<FormattedInventory> = {
    accessorKey: "quantity",
    header: ({ column }) => (
      <TableHeader column={column} title="Beholdning" />
    ),
    cell: ({ getValue }) => getValue<number>(),
    meta: {
      rightAlign: true
    },
  }

  const unitCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.unit',
    id: 'unit',
    header: ({ column }) => (
      <TableHeader column={column} title='Enhed' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => getValue<string>(),
    cell: () => null,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const costPriceCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.costPrice',
    id: 'costPrice',
    header: ({ column }) => (
      <TableHeader column={column} title='Kostpris' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    cell: () => null,
    meta: {
      rightAlign: true
    }
  }

  const salesPriceCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'product.salesPrice',
    id: 'salesPrice',
    header: ({ column }) => (
      <TableHeader column={column} title='Salgspris' />
    ),
    aggregationFn: 'unique',
    aggregatedCell: ({ getValue }) => numberToDKCurrency(getValue<number>()),
    cell: () => null,
    meta: {
      rightAlign: true
    }
  }

  const updatedCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader column={column} title='Sidst opdateret' />
    ),
    aggregatedCell: ({ getValue }) => formatDate(getValue<Date[]>()[0]),
    cell: () => null,
    filterFn: (row, id, value) => {
      return isSameDay(value, row.getValue(id))
    },
  }

  const actionsCol: ColumnDef<FormattedInventory> = {
    accessorKey: 'actions',
    header: () => null,
    aggregatedCell: ({ table, row }) => <TableOverviewActions table={table} row={row} />,
    enableHiding: false,
    enableSorting: false,
  }

  switch (plan) {
    case "lite":
      const liteCols = [
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        quantityCol,
        unitCol,
        costPriceCol,
        salesPriceCol,
        updatedCol,
      ]
      if (userRole != 'bruger') liteCols.push(actionsCol)
      return liteCols
    case "plus":
      const plusCols = [
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        placementCol,
        quantityCol,
        unitCol,
        costPriceCol,
        salesPriceCol,
        updatedCol,
      ]
      if (userRole != 'bruger') plusCols.push(actionsCol)
      return plusCols
    case "pro":
      const proCols = [
        skuCol,
        barcodeCol,
        groupCol,
        text1Col,
        text2Col,
        text3Col,
        placementCol,
        batchCol,
        quantityCol,
        unitCol,
        costPriceCol,
        salesPriceCol,
        updatedCol,
      ]
      if (userRole != 'bruger') proCols.push(actionsCol)
      return proCols
  }

}
