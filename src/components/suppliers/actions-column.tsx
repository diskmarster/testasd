'use client'

import { useTranslation } from '@/app/i18n/client'
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { SupplierWithItemCount } from '@/data/suppliers.types'
import { Row, Table } from '@tanstack/react-table'
import Link from 'next/link'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
	table: Table<SupplierWithItemCount>
	row: Row<SupplierWithItemCount>
}

export function SupplierActionsColumn({ row }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'leverandører')

	return (
		<TableActionsWrapper>
			<DropdownMenuItem asChild>
				<Link href={`/${lng}/administration/leverandorer/${row.original.id}`}>
					{t('table.col-actions-show')}
				</Link>
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				className='!text-destructive'
				onClick={() => {
					emitCustomEvent('DeleteSupplierByID', {
						id: row.original.id,
						itemCount: row.original.itemCount,
					})
				}}>
				{t('table.col-actions-delete')}
			</DropdownMenuItem>
		</TableActionsWrapper>
	)
}
