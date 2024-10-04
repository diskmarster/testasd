import { TableUsersActions } from '@/components/admin/table-users-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { UserRole, userRoles } from '@/data/user.types'
import { UserNoHash } from '@/lib/database/schema/auth'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableUsersColumns(
  userRole: UserRole,
): ColumnDef<UserNoHash>[] {
  const selectCol: ColumnDef<UserNoHash> = {
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

  const nameCol: ColumnDef<UserNoHash> = {
    accessorKey: 'name',
    header: ({ column }) => <TableHeader column={column} title='Navn' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Navn',
    },
  }

  const emailCol: ColumnDef<UserNoHash> = {
    accessorKey: 'email',
    header: ({ column }) => <TableHeader column={column} title='Email' />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: 'Email',
    },
  }

  const roleCol: ColumnDef<UserNoHash> = {
    accessorKey: 'role',
    header: ({ column }) => <TableHeader column={column} title='Brugerrolle' />,
    cell: ({ getValue }) => {
      const role = getValue<UserRole>()
      const badgeVariant =
        role == 'sys_admin'
          ? 'wow'
          : role == 'firma_admin'
            ? 'default'
            : role == 'lokal_admin'
              ? 'secondary'
              : 'outline'

      return (
        <Badge variant={badgeVariant} className='capitalize'>
          {role.replace('_', ' ')}
        </Badge>
      )
    },
    meta: {
      viewLabel: 'Brugerrolle',
    },
  }

  const statusCol: ColumnDef<UserNoHash> = {
    accessorKey: 'isActive',
    header: ({ column }) => <TableHeader column={column} title='Status' />,
    cell: ({ getValue }) => {
      const status = getValue<boolean>()
      const badgeVariant = status ? 'secondary' : 'destructive'

      return (
        <Badge variant={badgeVariant}>{status ? 'Aktiv' : 'Deaktiveret'}</Badge>
      )
    },
    meta: {
      viewLabel: 'Status',
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  }

  const updatedCol: ColumnDef<UserNoHash> = {
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

  const insertedCol: ColumnDef<UserNoHash> = {
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

  const actionsCol: ColumnDef<UserNoHash> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableUsersActions row={row} table={table} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  return [
    selectCol,
    nameCol,
    emailCol,
    roleCol,
    statusCol,
    insertedCol,
    updatedCol,
    actionsCol,
  ]
}

export function getTableUsersFilters(
  table: Table<UserNoHash>,
): FilterField<UserNoHash>[] {
  const nameFilter: FilterField<UserNoHash> = {
    column: table.getColumn('name'),
    type: 'text',
    label: 'Navn',
    value: '',
    placeholder: 'Søg i navn',
  }

  const emailFilter: FilterField<UserNoHash> = {
    column: table.getColumn('email'),
    type: 'text',
    label: 'Email',
    value: '',
    placeholder: 'Søg i email',
  }

  const roleFilter: FilterField<UserNoHash> = {
    column: table.getColumn('role'),
    type: 'select',
    label: 'Brugerrolle',
    value: '',
    options: [
      ...userRoles
        .filter(role => role != 'sys_admin')
        .map(role => ({
          value: role,
          label: role
            .split('_')
            .map(role => `${role.charAt(0).toUpperCase()}${role.substring(1)}`) // could have used capitalize tailwind class but too lazy now
            .join(' '),
        })),
    ],
  }

  const statusFilter: FilterField<UserNoHash> = {
    column: table.getColumn('isActive'),
    type: 'select',
    label: 'Status',
    value: '',
    options: [
      { value: true, label: 'Aktiv' },
      { value: false, label: 'Deaktiveret' },
    ],
  }

  const insertedFilter: FilterField<UserNoHash> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: 'Oprettet',
    value: '',
  }

  const updatedFilter: FilterField<UserNoHash> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: 'Opdateret',
    value: '',
  }

  return [nameFilter, emailFilter, roleFilter, statusFilter, insertedFilter, updatedFilter]
}
