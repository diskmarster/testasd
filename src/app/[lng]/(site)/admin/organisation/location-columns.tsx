import { TableLocationsActions } from '@/components/admin/table-locations-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LocationWithCounts } from '@/data/location.types'
import { UserRole } from '@/data/user.types'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableLocationsColumns(
  userRole: UserRole,
  lng: string,
  t: (key: string) => string,
): ColumnDef<LocationWithCounts>[] {
  const selectCol: ColumnDef<LocationWithCounts> = {
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

  const nameCol: ColumnDef<LocationWithCounts> = {
    accessorKey: 'name',
    header: ({ column }) => (
      <TableHeader
        column={column}
        title={t('location-columns.location-name')}
      />
    ),
    cell: ({ getValue }) => getValue<string>(),
    meta: {
      viewLabel: t('location-columns.location-name'),
    },
  }

  const statusCol: ColumnDef<LocationWithCounts> = {
    accessorKey: 'isBarred',
    header: ({ column }) => (
      <TableHeader column={column} title={t('location-columns.status')} />
    ),
    cell: ({ getValue }) => {
      const status = getValue<boolean>()
      const badgeVariant = status ? 'destructive' : 'secondary'

      return (
        <Badge variant={badgeVariant}>
          {status
            ? t('location-columns.inactive')
            : t('location-columns.active')}
        </Badge>
      )
    },
    meta: {
      viewLabel: t('location-columns.status'),
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue<boolean>(id))
    },
  }

  const updatedCol: ColumnDef<LocationWithCounts> = {
    accessorKey: 'updated',
    header: ({ column }) => (
      <TableHeader column={column} title={t('location-columns.updated')} />
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
      viewLabel: t('location-columns.updated'),
    },
  }

  const insertedCol: ColumnDef<LocationWithCounts> = {
    accessorKey: 'inserted',
    header: ({ column }) => (
      <TableHeader column={column} title={t('location-columns.created')} />
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
      viewLabel: t('location-columns.created'),
    },
  }

  const actionsCol: ColumnDef<LocationWithCounts> = {
    accessorKey: 'actions',
    header: () => null,
    cell: ({ table, row }) => <TableLocationsActions row={row} table={table} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      className: 'justify-end',
    },
  }

  const countCol: ColumnDef<LocationWithCounts> = {
    accessorKey: 'count',
    header: ({ column }) => (
      <TableHeader column={column} title={t('location-columns.users')} />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex items-center border rounded-md text-xs'>
          <TooltipProvider>
            <Tooltip delayDuration={250}>
              <TooltipTrigger>
                <div className='flex items-center gap-1 px-2 py-0.5 border-r-border border-r h-[22px]'>
                  <span className='font-semibold text-muted-foreground'>{t('location-columns.users-mod-short')}</span>
                  <span className='tabular-nums'>{row.original.modCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                <span>{t('location-columns.users-mod-long')}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip delayDuration={250}>
              <TooltipTrigger>
                <div className='flex items-center gap-1 px-2 py-0.5 border-r-border border-r h-[22px]'>
                  <span className='font-semibold text-muted-foreground'>{t('location-columns.users-user-short')}</span>
                  <span className='tabular-nums'>{row.original.userCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                <span>{t('location-columns.users-user-long')}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip delayDuration={250}>
              <TooltipTrigger>
                <div className='flex items-center gap-1 px-2 py-0.5 border-r-border border-r h-[22px]'>
                  <span className='font-semibold text-muted-foreground'>{t('location-columns.users-out-short')}</span>
                  <span className='tabular-nums'>{row.original.outgoingCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                <span>{t('location-columns.users-out-long')}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip delayDuration={250}>
              <TooltipTrigger>
                <div className='flex items-center gap-1 px-2 py-0.5 h-[22px]'>
                  <span className='font-semibold text-muted-foreground border-r-0'>{t('location-columns.users-read-short')}</span>
                  <span className='tabular-nums'>{row.original.readCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                <span>{t('location-columns.users-read-long')}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    meta: {
      viewLabel: t('location-columns.users'),
    }
  }


  return [selectCol, nameCol, statusCol, countCol, insertedCol, updatedCol, actionsCol]
}

export function getTableLocationsFilters(
  table: Table<LocationWithCounts>,
  lng: string,
  t: (key: string) => string,
): FilterField<LocationWithCounts>[] {
  const nameFilter: FilterField<LocationWithCounts> = {
    column: table.getColumn('name'),
    type: 'text',
    label: t('location-columns.location-name'),
    value: '',
    placeholder: t('location-columns.location-name-placeholder'),
  }

  const statusFilter: FilterField<LocationWithCounts> = {
    column: table.getColumn('isBarred'),
    type: 'select',
    label: t('location-columns.status'),
    value: '',
    options: [
      { label: t('location-columns.inactive'), value: true },
      { label: t('location-columns.active'), value: false },
    ],
  }

  const insertedFilter: FilterField<LocationWithCounts> = {
    column: table.getColumn('inserted'),
    type: 'date-range',
    label: t('location-columns.created'),
    value: '',
  }

  const updatedFilter: FilterField<LocationWithCounts> = {
    column: table.getColumn('updated'),
    type: 'date-range',
    label: t('location-columns.updated'),
    value: '',
  }

  return [nameFilter, statusFilter, insertedFilter, updatedFilter]
}
