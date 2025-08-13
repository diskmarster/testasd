import { TableOverviewActions } from '@/components/inventory/table-placement-actions'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge } from '@/components/ui/badge'
import { hasPermissionByRank } from '@/data/user.types'
import { Placement } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { User } from 'lucia'
import { DateRange } from 'react-day-picker'

export function getTablePlacementColumns(
	lng: string,
	t: (key: string) => string,
	user: User,
): ColumnDef<Placement>[] {
	const placementCol: ColumnDef<Placement> = {
		accessorKey: 'name',
		header: ({ column }) => (
			<TableHeader column={column} title={t('placement-columns.placement')} />
		),
		cell: ({ getValue }) => getValue<string>(),
		meta: {
			viewLabel: t('placement-columns.placement'),
		},
	}

	const isBarredCol: ColumnDef<Placement> = {
		accessorKey: 'isBarred',
		header: ({ column }) => (
			<TableHeader column={column} title={t('placement-columns.is-barred')} />
		),
		cell: ({ getValue }) => {
			const status = getValue<boolean>()
			const badgeVariant = status ? 'red' : 'gray'

			return (
				<Badge variant={badgeVariant}>
					{status
						? t('placement-columns.is-barred-yes')
						: t('placement-columns.is-barred-no')}
				</Badge>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue<boolean>(id))
		},
		meta: {
			viewLabel: t('placement-columns.is-barred'),
		},
	}

	const insertedCol: ColumnDef<Placement> = {
		accessorKey: 'inserted',
		header: ({ column }) => (
			<TableHeader column={column} title={t('placement-columns.inserted')} />
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
			viewLabel: t('placement-columns.inserted'),
		},
	}

	const updatedCol: ColumnDef<Placement> = {
		accessorKey: 'updated',
		header: ({ column }) => (
			<TableHeader column={column} title={t('placement-columns.updated')} />
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
			viewLabel: t('placement-columns.updated'),
		},
	}

	const actionsCol: ColumnDef<Placement> = {
		accessorKey: 'actions',
		header: () => null,
		cell: ({ table, row }) =>
			hasPermissionByRank(user.role, 'bruger') ? (
				<TableOverviewActions row={row} />
			) : null,
		enableHiding: false,
		enableSorting: false,
		meta: {
			className: 'justify-end',
		},
	}

	if (!hasPermissionByRank(user.role, 'bruger')) {
		return [placementCol, isBarredCol, insertedCol, updatedCol]
	}
	return [placementCol, isBarredCol, insertedCol, updatedCol, actionsCol]
}

export function getTablePlacementFilters(
	table: Table<Placement>,
	placements: Placement[],
	lng: string,
	t: (key: string) => string,
): FilterField<Placement>[] {
	const placementFilter: FilterField<Placement> = {
		column: table.getColumn('name'),
		type: 'select',
		label: t('placement-columns.placement'),
		value: '',
		options: [
			...placements.map(placement => ({
				value: placement.name,
				label: placement.name,
			})),
		],
	}

	const isBarredFilter: FilterField<Placement> = {
		column: table.getColumn('isBarred'),
		type: 'select',
		label: t('placement-columns.is-barred'),
		value: '',
		options: [
			{ value: true, label: t('placement-columns.is-barred-yes') },
			{ value: false, label: t('placement-columns.is-barred-no') },
		],
	}

	const insertedFilter: FilterField<Placement> = {
		column: table.getColumn('inserted'),
		type: 'date-range',
		label: t('placement-columns.inserted'),
		value: '',
	}

	const updatedFilter: FilterField<Placement> = {
		column: table.getColumn('updated'),
		type: 'date-range',
		label: t('placement-columns.updated'),
		value: '',
	}

	return [placementFilter, isBarredFilter, insertedFilter, updatedFilter]
}
