import { TableClientsActions } from "@/components/clients/table-actions";
import { TableReorderActions } from "@/components/inventory/table-reorder-actions";
import { TableHeader } from "@/components/table/table-header";
import { FilterField } from "@/components/table/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { plans } from "@/data/customer.types";
import { Customer } from "@/lib/database/schema/customer";
import { formatDate } from "@/lib/utils";
import { ColumnDef, Table } from "@tanstack/react-table";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { DateRange } from "react-day-picker";

export function getTableClientsColumns(
  t: (key: string, opts?: any) => string,
): ColumnDef<Customer>[] {
  const selectCol: ColumnDef<Customer> = {
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

  const insertedCol: ColumnDef<Customer> = {
    accessorKey: 'inserted',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.inserted')} />
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
      viewLabel: t('columns.inserted'),
    },
  }

  const updatedCol: ColumnDef<Customer> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.updated')} />
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
      viewLabel: t('columns.updated'),
    },
  }

  const companyCol: ColumnDef<Customer> = {
    accessorKey: 'company',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.company')} />
    ),
    cell: ({ row }) => row.original.company,
    enableHiding: true,
    meta: {
      viewLabel: t('columns.company'),
    },
  }

  const emailCol: ColumnDef<Customer> = {
    accessorKey: 'email',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.email')} />
    ),
    cell: ({ row }) => row.original.email,
    enableHiding: true,
    meta: {
      viewLabel: t('columns.email'),
    },
  }

  const planCol: ColumnDef<Customer> = {
    accessorKey: 'plan',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.plan')} />
    ),
    cell: ({ row }) => {
      const plan = row.original.plan
      const variant = plan == 'pro'
        ? 'violet'
        : plan == 'basis'
          ? 'blue'
          : 'teal'

      return (
        <Badge className="capitalize" variant={variant}>{plan}</Badge>
      )
    },
    enableHiding: true,
    meta: {
      viewLabel: t('columns.plan'),
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id))
  }

  const activeCol: ColumnDef<Customer> = {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.active')} />
    ),
    cell: ({ row }) => {
      const isActive = row.original.isActive
      const variant = isActive ? 'gray' : 'red'

      return (
        <Badge className="capitalize" variant={variant}>
          {t('columns.active', { context: isActive.toString() })}
        </Badge>
      )
    },
    enableHiding: true,
    meta: {
      viewLabel: t('columns.active'),
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id))
  }

  const extraUsersCol: ColumnDef<Customer> = {
    accessorKey: 'extraUsers',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.extra')} />
    ),
    cell: ({ row }) => {
      return (
        <span className="tabular-nums">{row.original.extraUsers}</span>
      )
    },
    enableHiding: true,
    meta: {
      viewLabel: t('columns.extra'),
      rightAlign: true
    }
  }

  const actionsCol: ColumnDef<Customer> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableClientsActions row={row} table={table} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  return [
    selectCol,
    companyCol,
    emailCol,
    planCol,
    extraUsersCol,
    activeCol,
    insertedCol,
    updatedCol,
    actionsCol
  ]
}

export function getTableClientFilters(
  table: Table<Customer>,
  t: (key: string, opts?: any) => string,
): FilterField<Customer>[] {

  const companyFilter: FilterField<Customer> = {
    column: table.getColumn('company'),
    label: t('columns.company'),
    value: '',
    type: 'text'
  }

  const emailFilter: FilterField<Customer> = {
    column: table.getColumn('email'),
    label: t('columns.email'),
    value: '',
    type: 'text'
  }

  const planFilter: FilterField<Customer> = {
    column: table.getColumn('plan'),
    label: t('columns.plan'),
    type: 'select',
    value: '',
    options: [
      ...plans.map(p => ({
        label: p.substring(0, 1).toUpperCase() + p.substring(1),
        value: p
      }))
    ]
  }

  const activeFilter: FilterField<Customer> = {
    column: table.getColumn('isActive'),
    label: t('columns.active'),
    type: 'select',
    value: '',
    options: [
      { label: t('columns.active', { context: true.toString() }), value: true },
      { label: t('columns.active', { context: false.toString() }), value: false },
    ]
  }

  const insertedFilter: FilterField<Customer> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: t('columns.inserted'),
    value: '',
  }

  const updatedFilter: FilterField<Customer> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: t('columns.updated'),
    value: '',
  }

  return [
    companyFilter,
    emailFilter,
    planFilter,
    activeFilter,
    insertedFilter,
    updatedFilter
  ]
}
