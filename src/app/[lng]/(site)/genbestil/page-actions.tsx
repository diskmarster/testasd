'use client'

import { useTranslation } from '@/app/i18n/client'
import { ModalCreateReorder } from '@/components/inventory/modal-create-reorder'
import { ModalListOrders } from '@/components/inventory/modal-list-orders'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { useLanguage } from '@/context/language'
import { FormattedReorder } from '@/data/inventory.types'
import { OrderWithCount } from '@/data/orders.types'
import { Product } from '@/lib/database/schema/inventory'
import { emitCustomEvent } from 'react-custom-events'

interface Props {
	reorders: FormattedReorder[]
	productsWithNoReorder: Product[]
	orders: OrderWithCount[]
}

export function ReorderPageActions({ reorders, productsWithNoReorder, orders }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'genbestil')

	return (
		<>
			<ModalListOrders orders={orders} />
			<Button
				variant='outline'
				size='icon'
				tooltip={t('bulk.tooltip')}
				onClick={() => {
					emitCustomEvent('BulkReorder', { reorders })
				}}>
				<Icons.listPlus className='size-4' />
			</Button>
			<ModalCreateReorder products={productsWithNoReorder} />
		</>
	)
}
