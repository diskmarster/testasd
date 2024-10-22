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
import { t } from 'i18next'
import { DateRange } from 'react-day-picker'

export function getTableUsersColumns(
  userRole: UserRole,
  lng: string,
  t: (key: string) => string,
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
    header: ({ column }) => <TableHeader column={column} title={t('user-columns.user-name')} />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('user-columns.user-name'),
    },
  }

  const emailCol: ColumnDef<UserNoHash> = {
    accessorKey: 'email',
    header: ({ column }) => <TableHeader column={column} title={t('user-columns.email')} />,
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('user-columns.email'),
    },
  }

  const roleCol: ColumnDef<UserNoHash> = {
    accessorKey: 'role',
    header: ({ column }) => <TableHeader column={column} title={t('user-columns.user-role')} />,
    cell: ({ getValue }) => {
      const role = getValue<UserRole>()
      const badgeVariant =
        role == 'system_administrator'
          ? 'wow'
          : role == 'administrator'
            ? 'default'
            : role == 'moderator'
              ? 'secondary'
              : 'outline'

      return (
        <Badge variant={badgeVariant} className='capitalize'>
          {role.replace('_', ' ')}
        </Badge>
      )
    },
    meta: {
      viewLabel: t('user-columns.user-role'),
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  }

  const statusCol: ColumnDef<UserNoHash> = {
    accessorKey: 'isActive',
    header: ({ column }) => <TableHeader column={column} title={t('user-columns.status')} />,
    cell: ({ getValue }) => {
      const status = getValue<boolean>()
      const badgeVariant = status ? 'secondary' : 'destructive'

      return (
        <Badge variant={badgeVariant}>{status ? t('user-columns.active') : t('user-columns.inactive')}</Badge>
      )
    },
    meta: {
      viewLabel: t('user-columns.status'),
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  }

  const updatedCol: ColumnDef<UserNoHash> = {
    accessorKey: 'updated',
    header: ({ column }) => <TableHeader column={column} title={t('user-columns.updated')} />,
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
      viewLabel: t('user-columns.updated'),
    },
  }

  const insertedCol: ColumnDef<UserNoHash> = {
    accessorKey: 'inserted',
    header: ({ column }) => <TableHeader column={column} title={t('user-columns.created')} />,
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
      viewLabel: t('user-columns.created'),
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
  lng: string,
  t: (key: string) => string,
): FilterField<UserNoHash>[] {
  const nameFilter: FilterField<UserNoHash> = {
    column: table.getColumn('name'),
    type: 'text',
    label: t('user-columns.user-name'),
    value: '',
    placeholder: t('user-columns.user-name-placeholder'),
  }

  const emailFilter: FilterField<UserNoHash> = {
    column: table.getColumn('email'),
    type: 'text',
    label: t('user-columns.email'),
    value: '',
    placeholder: t('user-columns.email-placeholder'),
  }

  const roleFilter: FilterField<UserNoHash> = {
    column: table.getColumn('role'),
    type: 'select',
    label: t('user-columns.user-role'),
    value: '',
    options: [
      ...userRoles
        .filter(role => role != 'system_administrator')
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
    label: t('user-columns.status'),
    value: '',
    options: [
      { value: true, label: t('user-columns.active') },
      { value: false, label: t('user-columns.inactive') },
    ],
  }

  const insertedFilter: FilterField<UserNoHash> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: t('user-columns.created'), 
    value: '',
  }

  const updatedFilter: FilterField<UserNoHash> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: t('user-columns.updated'),
    value: '',
  }

  return [nameFilter, emailFilter, roleFilter, statusFilter, insertedFilter, updatedFilter]
}
