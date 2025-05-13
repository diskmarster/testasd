'use client'

import { useTranslation } from '@/app/i18n/client'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { CustomerWithUserCount } from '@/data/customer.types'

interface Props {
	table: Table<CustomerWithUserCount>
	row: Row<CustomerWithUserCount>
}

export function TableClientsActions({ row }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'kunder')

	return (
		<TableActionsWrapper>
			<DropdownMenuItem
				onClick={() => {
					emitCustomEvent('UpdateClientByID', {
						customerID: row.original.id,
						company: row.original.company,
						email: row.original.email,
						plan: row.original.plan,
						extraUsers: row.original.extraUsers
					})
				}}>
				{t('row-actions.update')}
			</DropdownMenuItem>
			<DropdownMenuItem
				onClick={() => {
					emitCustomEvent('ToggleClientByID', {
						customerID: row.original.id,
						isActive: row.original.isActive
					})
				}}>
				{t('row-actions.toggle', { context: row.original.isActive.toString() })}
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				onClick={() => {
					emitCustomEvent('ImportClientInventoryByID', {
						customerID: row.original.id,
					})
				}}>
				{t('row-actions.import-inventory')}
			</DropdownMenuItem>
			<DropdownMenuItem
				onClick={() => {
					emitCustomEvent('ImportClientHistoryByID', {
						customerID: row.original.id,
					})
				}}>
				{t('row-actions.import-history')}
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem
			disabled={!row.original.isActive}
				onClick={() => {
					emitCustomEvent('CreateApiKeyByID', {
						customerID: row.original.id,
					})
				}}>
				Opret API nøgle
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				className='!text-destructive'
				onClick={() => {
					emitCustomEvent('DeleteClientByID', {
						customerID: row.original.id,
					})
				}}>
				{t('row-actions.delete')}
			</DropdownMenuItem>
		</TableActionsWrapper>
	)
}
