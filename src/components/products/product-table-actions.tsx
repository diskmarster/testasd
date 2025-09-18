import { toggleBarredProductAction } from '@/app/[lng]/(site)/varer/produkter/actions'
import { useTranslation } from '@/app/i18n/client'
import {
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { FormattedProduct } from '@/data/products.types'
import { CustomerIntegrationSettings } from '@/lib/database/schema/integrations'
import { Row, Table } from '@tanstack/react-table'
import Link from 'next/link'
import { useTransition } from 'react'
import { emitCustomEvent } from 'react-custom-events'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
	integrationSettings: CustomerIntegrationSettings | undefined
	table: Table<FormattedProduct>
	row: Row<FormattedProduct>
}

export function TableOverviewActions({
	integrationSettings,
	table,
	row,
}: Props) {
	const [_, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	const handleToggleBar = () => {
		startTransition(async () => {
			const isCurrentlyBarred = row.original.isBarred
			const updatedBarredStatus = !isCurrentlyBarred
			const res = await toggleBarredProductAction({
				productID: row.original.id,
				isBarred: updatedBarredStatus,
			})

			if (res && res.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: res.serverError,
				})
				return
			}

			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: t('toasts.product-updated'),
			})
		})
	}

	const openDeleteProductModal = () => {
		emitCustomEvent('deleteProductByID', {
			id: row.original.id,
			sku: row.original.sku,
		})
	}

	return (
		<>
			<TableActionsWrapper>
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href={`/${lng}/varer/produkter/${row.original.id}`}>
							{t('view-product')}
						</Link>
					</DropdownMenuItem>
					{!integrationSettings?.useSyncProducts && (
						<DropdownMenuItem onClick={handleToggleBar}>
							{row.original.isBarred ? t('unbar-this') : t('bar-this')}
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>
				{!integrationSettings?.useSyncProducts && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								className='!text-destructive'
								onClick={openDeleteProductModal}>
								{t('delete-this')}
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</>
				)}
			</TableActionsWrapper>
		</>
	)
}
