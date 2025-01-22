import { TableSysUsersActions } from '@/components/sys/table-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserNoHashWithCompany, UserRole, userRoles } from '@/data/user.types'
import { formatDate } from '@/lib/utils'
import { isLinkExpired } from '@/service/customer.utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableSysUsersColumns(
  t: (key: string, options?: any) => string,
): ColumnDef<UserNoHashWithCompany>[] {
  const selectCol: ColumnDef<UserNoHashWithCompany> = {
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

  const nameCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'name',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.user-name')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('columns.user-name'),
    },
  }

  const companyCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'company',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.company')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('columns.company'),
    },
  }

  const emailCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'email',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.email')} />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('columns.email'),
    },
  }

  const roleCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'role',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.user-role')} />
    ),
    cell: ({ getValue }) => {
      const role = getValue<UserRole>()
      const badgeVariant =
        role == 'system_administrator'
          ? 'violet'
          : role == 'administrator'
            ? 'blue'
            : role == 'moderator'
              ? 'teal'
              : role == 'bruger'
                ? 'orange'
                : role == 'afgang'
                  ? 'rose'
                  : 'lessGray'

      return (
        <Badge variant={badgeVariant} className='capitalize'>
          {role.replace('_', ' ')}
        </Badge>
      )
    },
    meta: {
      viewLabel: t('columns.user-role'),
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  }

  const statusCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.status')} />
    ),
    cell: ({ getValue, row }) => {
      const value = getValue<boolean | null>()
      const badgeVariant = value == null
        ? !isLinkExpired(new Date(row.original.inserted * 1000), 8)
          ? 'orange'
          : 'yellow'
        : value == true
          ? 'gray'
          : 'red'

      const label = value == null
        ? !isLinkExpired(new Date(row.original.inserted * 1000), 8)
          ? t('columns.expired')
          : t('columns.waiting')
        : value == true
          ? t('columns.active')
          : t('columns.inactive')

      return (
        <Badge variant={badgeVariant}>{label}</Badge>
      )
    },
    meta: {
      viewLabel: t('columns.status'),
      className: "justify-start"
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const accessCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'access',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.access')} />
    ),
    cell: ({ row }) => {
      const web = row.getValue<boolean>('webAccess')
      const app = row.getValue<boolean>('appAccess')
      const price = row.getValue<boolean>('priceAccess')

      return (
        <div className='grid grid-cols-3 items-center gap-0.5'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className={'relative overflow-none size-6'}>
                  {web ? (
                    <Icons.monitor className='size-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2' />
                  ) : (
                    <>
                      <Icons.monitor className={'size-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2'} />
                      <Icons.ban className={'size-6 absolute text-destructive top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2'} />
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                {t('columns.access-web')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <div className={'relative overflow-none size-6'}>
                  {app ? (
                    <Icons.smartphone className='size-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2' />
                  ) : (
                    <>
                      <Icons.smartphone className={'size-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2'} />
                      <Icons.ban className={'size-6 absolute text-destructive top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2'} />
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                {t('columns.access-app')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <div className={'relative overflow-none size-6'}>
                  {price ? (
                    <Icons.dollarSign className='size-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2' />
                  ) : (
                    <>
                      <Icons.dollarSign className={'size-4 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2'} />
                      <Icons.ban className={'size-6 absolute text-destructive top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2'} />
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                {t('columns.access-price')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    meta: {
      viewLabel: t('columns.access'),
    },
    filterFn: (row, _id, value) => {
      return [
        row.getValue('webAccess') ? 'web' : undefined,
        row.getValue('appAccess') ? 'app' : undefined,
        row.getValue('priceAccess') ? 'price' : undefined,
      ].some(val => value.includes(val))
    },
  }

  const webAccessCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'webAccess',
    header: () => null,
    cell: () => null,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const appAccessCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'appAccess',
    header: () => null,
    cell: () => null,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const priceAccessCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'priceAccess',
    header: () => null,
    cell: () => null,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  }

  const updatedCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.updated')} />
    ),
    cell: ({ getValue }) => {
      return getValue() == '-' ? getValue() : formatDate(getValue<number>() * 1000)
    },
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
      className: 'justify-start'
    },
  }

  const insertedCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'inserted',
    header: ({ column }) => (
      <TableHeader column={column} title={t('columns.created')} />
    ),
    cell: ({ getValue }) => getValue() == '-' ? getValue() : formatDate(getValue<number>() * 1000),
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
      viewLabel: t('columns.created'),
      className: 'justify-start'
    },
  }

  const actionsCol: ColumnDef<UserNoHashWithCompany> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableSysUsersActions row={row} table={table} />,
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
    companyCol,
    roleCol,
    statusCol,
    accessCol,
    insertedCol,
    updatedCol,
    webAccessCol,
    appAccessCol,
    priceAccessCol,
    actionsCol,
  ]
}

export function getTableSysUsersFilters(
  table: Table<UserNoHashWithCompany>,
  t: (key: string, options?: any) => string,
): FilterField<UserNoHashWithCompany>[] {
  const nameFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('name'),
    type: 'text',
    label: t('columns.user-name'),
    value: '',
    placeholder: t('columns.user-name-placeholder'),
  }

  const emailFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('email'),
    type: 'text',
    label: t('columns.email'),
    value: '',
    placeholder: t('columns.email-placeholder'),
  }

  const companyFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('company'),
    type: 'text',
    label: t('columns.company'),
    value: '',
    placeholder: t('columns.company-placeholder'),
  }

  const roleFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('role'),
    type: 'select',
    label: t('columns.user-role'),
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

  const statusFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('isActive'),
    type: 'select',
    label: t('columns.status'),
    value: '',
    options: [
      { value: true, label: t('columns.active') },
      { value: false, label: t('columns.inactive') },
    ],
  }

  const accessFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('access'),
    type: 'select',
    label: t('columns.access'),
    value: '',
    options: [
      { value: 'web', label: t('columns.access-web') },
      { value: 'app', label: t('columns.access-app') },
      { value: 'price', label: t('columns.access-price') },
    ],
  }

  const insertedFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: t('columns.created'),
    value: '',
  }

  const updatedFilter: FilterField<UserNoHashWithCompany> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: t('columns.updated'),
    value: '',
  }

  return [
    nameFilter,
    emailFilter,
    companyFilter,
    roleFilter,
    statusFilter,
    accessFilter,
    insertedFilter,
    updatedFilter,
  ]
}
