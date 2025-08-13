import { ModalViewMore } from '@/components/errors/modal-view-more'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { FormattedError } from '@/data/errors.types'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function getTableErrorsColumns(
	t: (key: string) => string,
): ColumnDef<FormattedError>[] {
	const selectCol: ColumnDef<FormattedError> = {
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

	const insertedCol: ColumnDef<FormattedError> = {
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

	const companyCol: ColumnDef<FormattedError> = {
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

	const userCol: ColumnDef<FormattedError> = {
		accessorKey: 'user',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.user')} />
		),
		cell: ({ row }) => row.original.user,
		enableHiding: true,
		meta: {
			viewLabel: t('columns.user'),
		},
	}

	const typeColHidden: ColumnDef<FormattedError> = {
		accessorKey: 'type',
		header: () => null,
		cell: () => null,
		enableHiding: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const originColHidden: ColumnDef<FormattedError> = {
		accessorKey: 'origin',
		header: () => null,
		cell: () => null,
		enableHiding: false,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const pathCol: ColumnDef<FormattedError> = {
		accessorKey: 'path',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.path')} />
		),
		cell: ({ row }) => {
			const type = row.original.type
			const origin = row.original.origin

			return (
				<div className='flex items-center gap-1'>
					<Badge className='capitalize' variant='gray'>
						{type}
					</Badge>
					<Badge variant='blue'>{origin}</Badge>
				</div>
			)
		},
		enableHiding: true,
		meta: {
			viewLabel: t('columns.path'),
			className: 'max-w-fit',
		},
	}

	const viewCol: ColumnDef<FormattedError> = {
		accessorKey: 'more',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.more')} />
		),
		cell: ({ row }) => <ModalViewMore error={row.original} />,
	}

	return [
		selectCol,
		insertedCol,
		pathCol,
		companyCol,
		userCol,
		viewCol,
		typeColHidden,
		originColHidden,
	]
}

export function getTableErrorsFilters(
	table: Table<FormattedError>,
	t: (key: string) => string,
): FilterField<FormattedError>[] {
	const insertedFilter: FilterField<FormattedError> = {
		column: table.getColumn('inserted'),
		type: 'date-range',
		label: t('columns.inserted'),
		value: '',
	}

	const originFilter: FilterField<FormattedError> = {
		column: table.getColumn('origin'),
		type: 'text',
		label: t('columns.origin'),
		value: '',
		placeholder: t('columns.origin_placeholder'),
	}

	const companyFilter: FilterField<FormattedError> = {
		column: table.getColumn('company'),
		type: 'text',
		label: t('columns.company'),
		value: '',
		placeholder: t('columns.company_placeholder'),
	}

	const userFilter: FilterField<FormattedError> = {
		column: table.getColumn('user'),
		type: 'text',
		label: t('columns.user'),
		value: '',
		placeholder: t('columns.user_placeholder'),
	}

	const typeFilter: FilterField<FormattedError> = {
		column: table.getColumn('type'),
		type: 'select',
		label: t('columns.type'),
		value: '',
		options: [
			{
				value: 'action',
				label: 'Action',
			},
			{
				value: 'endpoint',
				label: 'Endpoint',
			},
		],
	}

	return [insertedFilter, typeFilter, originFilter, companyFilter, userFilter]
}
