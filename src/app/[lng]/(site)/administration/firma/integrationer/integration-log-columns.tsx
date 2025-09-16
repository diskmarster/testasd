import { TableHeader } from '@/components/table/table-header'
import { FilterField } from '@/components/table/table-toolbar'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import { IntegrationLogStatus } from '@/data/integrations.types'
import { IntegrationLog } from '@/lib/database/schema/integrations'
import { EconomicOldNewEventAction } from '@/lib/integrations/sync/e-conomic'
import { cn, formatDate } from '@/lib/utils'
import { ColumnDef, Row, Table } from '@tanstack/react-table'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { TFunction } from 'i18next'
import { DateRange } from 'react-day-picker'

export function getTableIntegrationLogsColumns(
	t: TFunction<'organisation', 'integration-logs.table'>,
): ColumnDef<IntegrationLog>[] {
	const insertedCol: ColumnDef<IntegrationLog> = {
		accessorKey: 'inserted',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.inserted')} />
		),
		cell: ({ getValue }) => formatDate(getValue<Date>(), true, true),
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
	}

	const statusCol: ColumnDef<IntegrationLog> = {
		accessorKey: 'status',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.status')} />
		),
		cell: ({ getValue }) => {
			const status = getValue<IntegrationLogStatus>()
			const variant: BadgeVariant = status === 'success' ? 'green' : 'red'

			return <Badge variant={variant}>{t('status', { context: status })}</Badge>
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
	}

	const eventTypeCol: ColumnDef<IntegrationLog> = {
		accessorKey: 'event.type',
		id: 'eventType',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.event-type')} />
		),
		cell: ({ row }) => {
			const eventType = getEventType(row)

			return <p>{t('event-type', { context: eventType })}</p>
		},
	}

	const infoCol: ColumnDef<IntegrationLog> = {
		accessorKey: 'event',
		id: 'eventInfo',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.event-info')} />
		),
		cell: ({ row }) => getEventInfo(row, t),
		meta: {
			fillMaxWidth: true,
		},
	}

	const messageCol: ColumnDef<IntegrationLog> = {
		accessorKey: 'message',
		header: ({ column }) => (
			<TableHeader column={column} title={t('columns.message')} />
		),
		cell: ({ getValue, row }) => {
			const eventType = getEventType(row)

			return (
				<p
					className={cn(
						eventType == 'productEvent_re-number' && 'text-destructive',
					)}>
					{t('message', { context: getValue<string>() })}
				</p>
			)
		},
		meta: {
			fillMaxWidth: true,
		},
	}

	return [insertedCol, statusCol, eventTypeCol, infoCol, messageCol]
}

export function getEventType(
	row: Row<IntegrationLog>,
): 'fullSync' | `productEvent_${EconomicOldNewEventAction['action']}` | `supplierEvent_${EconomicOldNewEventAction['action']}` | '' {
	const event = row.original.event
	if (event.type == 'fullSync') {
		return event.type
	} else if ((event.type == 'productEvent' || event.type == 'supplierEvent') && event.provider == 'e-conomic') {
		return `${event.type}_${event.data.action.action}`
	}

	return ''
}

function getEventInfo(
	row: Row<IntegrationLog>,
	t: TFunction<'organisation', 'integration-logs.table'>,
): string {
	const event = row.original.event

	if (event.type == 'fullSync') {
		return t('event-info', { context: 'none' })
	} else if ((event.type == 'productEvent' || event.type == 'supplierEvent') && event.provider == 'e-conomic') {
		const data = event.data

		switch (data.action.action) {
			case 'create':
				return t('event-info', { context: 'create', sku: data.input.newParam })
			case 'update':
				return t('event-info', { context: 'update', sku: data.input.oldParam })
			case 'delete':
				return t('event-info', { context: 'delete', sku: data.input.oldParam })
			case 're-number':
				return t('event-info', {
					context: 're-number',
					from: data.input.oldParam,
					to: data.input.newParam,
				})
			case 'invalid':
				return t('event-info', { context: 'none' })
		}
	}

	return t('event-info', { context: 'none' })
}

export function getTableIntegrationLogsFilters(
	table: Table<IntegrationLog>,
	t: TFunction<'organisation', 'integration-logs.table'>,
): FilterField<IntegrationLog>[] {
	const insertedFilter: FilterField<IntegrationLog> = {
		column: table.getColumn('inserted'),
		type: 'date-range',
		label: t('columns.inserted'),
		value: '',
	}

	const statusFilter: FilterField<IntegrationLog> = {
		column: table.getColumn('status'),
		type: 'select',
		label: t('columns.status'),
		value: '',
		options: [
			{ value: 'success', label: t('status', { context: 'success' }) },
			{ value: 'error', label: t('status', { context: 'error' }) },
		],
	}

	return [insertedFilter, statusFilter]
}
