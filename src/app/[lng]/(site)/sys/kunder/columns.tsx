import { TableClientsActions } from '@/components/clients/table-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField, NumberRange } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomerWithUserCount, plans } from '@/data/customer.types'
import {
	dateRangeFilterFn,
	numberRangeFilterFn,
} from '@/lib/tanstack/filter-fns'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { DateRange } from 'react-day-picker'

export function getTableClientsColumns(
	t: (key: string, opts?: any) => string,
): ColumnDef<CustomerWithUserCount>[] {
	const selectCol: ColumnDef<CustomerWithUserCount> = {
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

	const insertedCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'inserted',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.inserted')} />
		),
		cell: ({ getValue }) => formatDate(getValue<Date>()),
		filterFn: (row, id, value: DateRange) => dateRangeFilterFn(row, id, value),
		meta: {
			viewLabel: t('columns.inserted'),
		},
	}

	const updatedCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'updated',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.updated')} />
		),
		cell: ({ getValue }) => formatDate(getValue<Date>()),
		filterFn: (row, id, value: DateRange) => dateRangeFilterFn(row, id, value),
		meta: {
			viewLabel: t('columns.updated'),
		},
	}

	const companyCol: ColumnDef<CustomerWithUserCount> = {
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

	const emailCol: ColumnDef<CustomerWithUserCount> = {
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

	const retailerCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'retailerId',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.retailer')} />
		),
		cell: ({ row }) => row.original.retailerId ? row.original.retailerId : t('columns.no-retailer'),
		enableHiding: true,
		meta: {
			viewLabel: t('columns.retailer'),
		},
	}

	const planCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'plan',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.plan')} />
		),
		cell: ({ row }) => {
			const plan = row.original.plan
			const variant =
				plan == 'pro' ? 'violet' : plan == 'basis' ? 'blue' : 'teal'

			return (
				<Badge className='capitalize' variant={variant}>
					{plan}
				</Badge>
			)
		},
		enableHiding: true,
		meta: {
			viewLabel: t('columns.plan'),
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	}

	const activeCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'isActive',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.active')} />
		),
		cell: ({ row }) => {
			const isActive = row.original.isActive
			const variant = isActive ? 'gray' : 'red'

			return (
				<Badge className='capitalize' variant={variant}>
					{t('columns.active', { context: isActive.toString() })}
				</Badge>
			)
		},
		enableHiding: true,
		meta: {
			viewLabel: t('columns.active'),
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	}

	const canUseIntegrationCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'canUseIntegration',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.integration')} />
		),
		cell: ({ getValue }) => {
			const canUseIntegration = getValue<boolean>()
			const variant = canUseIntegration ? 'green' : 'gray'

			return (
				<Badge className='capitalize' variant={variant}>
					{t('columns.integration', { context: canUseIntegration.toString() })}
				</Badge>
			)
		},
		enableHiding: true,
		meta: {
			viewLabel: t('columns.integration'),
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	}

	const extraUsersCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'extraUsers',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.extra')} />
		),
		cell: ({ row }) => {
			return <span className='tabular-nums'>{row.original.extraUsers}</span>
		},
		enableHiding: true,
		meta: {
			viewLabel: t('columns.extra'),
			rightAlign: true,
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	const usersCol: ColumnDef<CustomerWithUserCount> = {
		accessorKey: 'userCount',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.users')} />
		),
		cell: ({ row }) => {
			return <span className='tabular-nums'>{row.original.userCount}</span>
		},
		enableHiding: true,
		meta: {
			viewLabel: t('columns.users'),
			rightAlign: true,
		},
		filterFn: (row, id, value: NumberRange) =>
			numberRangeFilterFn(row, id, value),
	}

	const actionsCol: ColumnDef<CustomerWithUserCount> = {
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
		retailerCol,
		planCol,
		extraUsersCol,
		usersCol,
		activeCol,
		canUseIntegrationCol,
		insertedCol,
		updatedCol,
		actionsCol,
	]
}

export function getTableClientFilters(
	table: Table<CustomerWithUserCount>,
	t: (key: string, opts?: any) => string,
): FilterField<CustomerWithUserCount>[] {
	const companyFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('company'),
		label: t('columns.company'),
		value: '',
		type: 'text',
	}

	const emailFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('email'),
		label: t('columns.email'),
		value: '',
		type: 'text',
	}

	const planFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('plan'),
		label: t('columns.plan'),
		type: 'select',
		value: '',
		options: [
			...plans.map(p => ({
				label: p.substring(0, 1).toUpperCase() + p.substring(1),
				value: p,
			})),
		],
	}

	const extraUsersFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('extraUsers'),
		label: t('columns.extra'),
		type: 'number-range',
		value: '',
	}

	const regUsersFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('userCount'),
		label: t('columns.users'),
		type: 'number-range',
		value: '',
	}

	const activeFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('isActive'),
		label: t('columns.active'),
		type: 'select',
		value: '',
		options: [
			{ label: t('columns.active', { context: true.toString() }), value: true },
			{
				label: t('columns.active', { context: false.toString() }),
				value: false,
			},
		],
	}

	const insertedFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('inserted'),
		type: 'date-range',
		label: t('columns.inserted'),
		value: '',
	}

	const updatedFilter: FilterField<CustomerWithUserCount> = {
		column: table.getColumn('updated'),
		type: 'date-range',
		label: t('columns.updated'),
		value: '',
	}

	return [
		companyFilter,
		emailFilter,
		planFilter,
		extraUsersFilter,
		regUsersFilter,
		activeFilter,
		insertedFilter,
		updatedFilter,
	]
}
