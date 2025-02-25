import { SupplierActionsColumn } from '@/components/suppliers/actions-column'
import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Checkbox } from '@/components/ui/checkbox'
import { supplierContries, SupplierWithItemCount } from '@/data/suppliers.types'
import { formatDate } from '@/lib/utils'
import { ColumnDef, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import ReactCountryFlag from 'react-country-flag'
import { DateRange } from 'react-day-picker'

export function getSupplierColumns(
	t: (key: string, options?: any) => string,
): ColumnDef<SupplierWithItemCount>[] {
	const selectCol: ColumnDef<SupplierWithItemCount> = {
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

	const nameCol: ColumnDef<SupplierWithItemCount> = {
		accessorKey: 'name',
		header: ({ column }) => (
			<TableHeader column={column} title={t('table.col-name')} />
		),
		cell: ({ row }) => row.original.name,
		meta: {
			viewLabel: t('table.col-name'),
		},
	}

	const countryCol: ColumnDef<SupplierWithItemCount> = {
		accessorKey: 'country',
		header: ({ column }) => (
			<TableHeader column={column} title={t('table.col-country')} />
		),
		cell: ({ row }) => (
			<div className="flex items-center gap-1.5">
				<ReactCountryFlag
					className='!size-4 rounded-md'
					countryCode={row.original.country}
					svg
				/>
				{row.original.country}
			</div>
		),
		meta: {
			viewLabel: t('table.col-country'),
		},
	}

	const clientIDCol: ColumnDef<SupplierWithItemCount> = {
		accessorKey: 'idOfClient',
		header: ({ column }) => (
			<TableHeader column={column} title={t('table.col-client-id')} />
		),
		cell: ({ row }) => {
			const value = row.original.idOfClient

			return value ? (
				<p>{value}</p>
			) : (
				<p className='italic text-muted-foreground'>{t("table.col-no-value")}</p>
			)
		},
		meta: {
			viewLabel: t('table.col-client-id'),
		},
	}

	const insertedCol: ColumnDef<SupplierWithItemCount> = {
		accessorKey: 'inserted',
		header: ({ column }) => (
			<TableHeader column={column} title={t('table.col-inserted')} />
		),
		cell: ({ getValue }) => formatDate(getValue<number>()),
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
			viewLabel: t('table.col-inserted'),
			className: 'justify-start'
		},
	}

	const updatedCol: ColumnDef<SupplierWithItemCount> = {
		accessorKey: 'updated',
		header: ({ column }) => (
			<TableHeader column={column} title={t('table.col-updated')} />
		),
		cell: ({ getValue }) => formatDate(getValue<number>()),
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
			viewLabel: t('table.col-updated'),
			className: 'justify-start'
		},
	}

	const actionsCol: ColumnDef<SupplierWithItemCount> = {
		accessorKey: 'actions',
		header: () => null,
		cell: ({ table, row }) => <SupplierActionsColumn row={row} table={table} />,
		enableHiding: false,
		enableSorting: false,
		meta: {
			className: 'justify-end',
		},
	}

	return [
		selectCol,
		countryCol,
		nameCol,
		clientIDCol,
		insertedCol,
		updatedCol,
		actionsCol,
	]
}

export function getSupplierFilters(
	table: Table<SupplierWithItemCount>,
	t: (key: string, options?: any) => string,
): FilterField<SupplierWithItemCount>[] {
	const nameFilter: FilterField<SupplierWithItemCount> = {
		column: table.getColumn('name'),
		type: 'text',
		label: t('table.col-name'),
		value: '',
		placeholder: t('table.col-name-placeholder'),
	}

	const countryFilter: FilterField<SupplierWithItemCount> = {
		column: table.getColumn('country'),
		type: 'select',
		label: t('table.col-country'),
		value: '',
		placeholder: t('table.col-country-placeholder'),
		options: [
			...supplierContries.map(c => ({
				label: c,
				value: c
			}))
		]
	}

	const clientIDFilter: FilterField<SupplierWithItemCount> = {
		column: table.getColumn('idOfClient'),
		type: 'text',
		label: t('table.col-client-id'),
		value: '',
		placeholder: t('table.col-client-id-placeholder'),
	}

	const insertedFilter: FilterField<SupplierWithItemCount> = {
		column: table.getColumn('inserted'),
		type: 'date-range',
		label: t('table.col-inserted'),
		value: '',
	}

	const updatedFilter: FilterField<SupplierWithItemCount> = {
		column: table.getColumn('updated'),
		type: 'date-range',
		label: t('table.col-updated'),
		value: '',
	}

	return [
		nameFilter,
		countryFilter,
		clientIDFilter,
		insertedFilter,
		updatedFilter,
	]
}
