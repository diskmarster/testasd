'use client'

import { useTranslation } from '@/app/i18n/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { FormattedReorder } from '@/data/inventory.types'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
	table: Table<FormattedReorder>
	row: Row<FormattedReorder>
}

export function TableReorderActions({ table, row }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'genbestil')

	return (
		<TableActionsWrapper>
			{!row.original.isRequested && (
				<DropdownMenuItem
					onClick={() => {
						emitCustomEvent('UpdateReorderByIDs', {
							locationID: row.original.locationID,
							productID: row.original.productID,
							customerID: row.original.customerID,
							minimum: row.original.minimum,
							orderAmount: row.original.orderAmount,
							maxOrderAmount: row.original.maxOrderAmount,
							text1: row.original.product.text1,
						})
					}}>
					{t('table-reorder-actions.update')}
				</DropdownMenuItem>
			)}
			<DropdownMenuItem
				className='!text-destructive'
				onClick={() => {
					emitCustomEvent('DeleteReorderByIDs', {
						locationID: row.original.locationID,
						productID: row.original.productID,
						text1: row.original.product.text1,
					})
				}}>
				{t('table-reorder-actions.delete')}
			</DropdownMenuItem>
		</TableActionsWrapper>
	)
}
