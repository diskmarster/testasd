'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { OrderWithCount } from '@/data/orders.types'
import { formatDate, getDateFnsLocale } from '@/lib/utils'
import { formatRelative } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '../ui/button'
import {
	DialogContentV2,
	DialogDescriptionV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'

export function ModalListOrders({ orders }: { orders: OrderWithCount[] }) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'genbestil')
	const tr = (key: string) => t(`list-orders.${key}`)
	const [search, setSearch] = useState<string>('')
	const [dSearch] = useDebounce(search, 300)

	const filteredOrders = orders.filter(
		o =>
			o.id.toLowerCase().includes(dSearch.toLowerCase()) ||
			o.userName.toLowerCase().includes(dSearch.toLowerCase()) ||
			formatDate(o.inserted).includes(dSearch.toLowerCase()),
	)

	return (
		<DialogV2>
			<DialogTriggerV2 asChild>
				<Button size='icon' variant='outline' tooltip={tr('tooltip')}>
					<Icons.list className='size-4' />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className='max-w-2xl'>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.list className='size-4 text-primary' />
						<DialogTitleV2>{tr('title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className='space-y-4 px-3 pb-4'>
					<DialogDescriptionV2 className='text-sm text-muted-foreground'>
						{tr('description')}
					</DialogDescriptionV2>
					<div className='flex items-center justify-between'>
						<p className='text-sm font-medium'>
							{tr('amount-orders')} ({orders.length})
						</p>
						<Input
							value={search}
							onChange={event => setSearch(event.target.value)}
							placeholder='Søg i bestillinger'
							className='w-32 text-xs h-6 border-t-0 border-l-0 border-r-0 rounded-none border-b shadow-none focus-visible:ring-0 px-1'
						/>
					</div>
					<div>
						<div className='grid grid-cols-4 font-medium text-xs text-muted-foreground px-2'>
							<p>{tr('order-number')}</p>
							<p>{tr('lines-amount')}</p>
							<p>{tr('user')}</p>
							<p>{tr('inserted')}</p>
						</div>
						<Separator className='my-2' />
						<ScrollArea maxHeight='max-h-96'>
							{filteredOrders.slice(0, 50).map(o => (
								<OrderComp key={o.id} order={o} />
							))}
						</ScrollArea>
					</div>
				</div>
			</DialogContentV2>
		</DialogV2>
	)
}

function OrderComp({ order }: { order: OrderWithCount }) {
	const lng = useLanguage()
	return (
		<article className='grid grid-cols-4 px-2 py-1 text-sm'>
			<div>
				<Link
					href={`/${lng}/genbestil/${order.id}`}
					className='hover:underline'>
					{order.id}
				</Link>
			</div>
			<p>{order.lineCount}</p>
			<p>{order.userName}</p>
			<p>
				{formatRelative(order.inserted, Date.now(), {
					locale: getDateFnsLocale(lng),
				})}
			</p>
		</article>
	)
}
