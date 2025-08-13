import { TableBatchActions } from '@/components/inventory/table-batchnumber-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { hasPermissionByRank } from '@/data/user.types'
import { Batch } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { User } from 'lucia'
import { DateRange } from 'react-day-picker'

export function getTableBatchColumns(
	lng: string,
	t: (key: string) => string,
	user: User,
): ColumnDef<Batch>[] {
	const batchCol: ColumnDef<Batch> = {
		accessorKey: 'batch',
		header: ({ column }) => <TableHeader column={column} title='Batch' />,
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('batch-columns.batch-number'),
		},
	}

	const isBarredCol: ColumnDef<Batch> = {
		accessorKey: 'isBarred',
		header: ({ column }) => (
			<TableHeader column={column} title={t('batch-columns.barred')} />
		),
		cell: ({ getValue }) => {
			const isBarred = getValue<boolean>()
			return (
				<Badge variant={isBarred ? 'red' : 'gray'}>
					{isBarred ? t('batch-columns.yes') : t('batch-columns.no')}
				</Badge>
			)
		},
		meta: {
			viewLabel: t('batch-columns.barred'),
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const expiryCol: ColumnDef<Batch> = {
		accessorKey: 'expiry',
		header: ({ column }) => (
			<TableHeader column={column} title={t('batch-columns.expiration-date')} />
		),
		cell: ({ getValue }) =>
			getValue() == null ? '-' : formatDate(getValue<Date>(), false),
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
			viewLabel: t('batch-columns.expiration-date'),
		},
	}

	const instertedCol: ColumnDef<Batch> = {
		accessorKey: 'inserted',
		header: ({ column }) => (
			<TableHeader column={column} title={t('batch-columns.created-at')} />
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
			viewLabel: t('batch-columns.created-at'),
		},
	}

	const updatedCol: ColumnDef<Batch> = {
		accessorKey: 'updated',
		header: ({ column }) => (
			<TableHeader column={column} title={t('batch-columns.updated-at')} />
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
			viewLabel: t('batch-columns.updated-at'),
		},
	}
	const actionsCol: ColumnDef<Batch> = {
		accessorKey: 'actions',
		header: () => null,
		cell: ({ row }) =>
			hasPermissionByRank(user.role, 'bruger') ? (
				<TableBatchActions row={row} />
			) : null,
		enableHiding: false,
		enableSorting: false,
		meta: {
			className: 'justify-end',
		},
	}

	if (!hasPermissionByRank(user.role, 'bruger'))
		return [batchCol, isBarredCol, expiryCol, instertedCol, updatedCol]

	return [
		batchCol,
		isBarredCol,
		expiryCol,
		instertedCol,
		updatedCol,
		actionsCol,
	]
}

export function getTableBatchFilters(
	table: Table<Batch>,
	batches: Batch[],
	lng: string,
	t: (key: string) => string,
): FilterField<Batch>[] {
	const batchFilter: FilterField<Batch> = {
		column: table.getColumn('batch'),
		type: 'select',
		label: 'Batch',
		value: '',
		options: [
			...batches.map(batch => ({
				value: batch.batch,
				label: batch.batch,
			})),
		],
	}

	const isBarredFilter: FilterField<Batch> = {
		column: table.getColumn('isBarred'),
		type: 'select',
		label: t('batch-columns.barred'),
		value: '',
		options: [
			{ value: true, label: t('batch-columns.yes') },
			{ value: false, label: t('batch-columns.no') },
		],
	}

	const expiryFilter: FilterField<Batch> = {
		column: table.getColumn('expiry'),
		type: 'date-range',
		label: t('batch-columns.expiration-date'),
		value: '',
	}

	const insertedFilter: FilterField<Batch> = {
		column: table.getColumn('inserted'),
		type: 'date-range',
		label: t('batch-columns.created-at'),
		value: '',
	}

	const updatedFilter: FilterField<Batch> = {
		column: table.getColumn('updated'),
		type: 'date-range',
		label: t('batch-columns.updated-at'),
		value: '',
	}

	return [
		batchFilter,
		isBarredFilter,
		expiryFilter,
		insertedFilter,
		updatedFilter,
	]
}
