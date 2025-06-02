'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { ProductInventory } from '@/data/inventory.types'
import { LocationWithPrimary } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { max } from 'date-fns'
import { TFunction } from 'i18next'
import { useCallback, useMemo, useState } from 'react'
import { Icons } from '../ui/icons'
import { Separator } from '../ui/separator'
import { ProductInventoryTable } from './product-inventory-table'

interface LocationWithInventories extends LocationWithPrimary {
	inventories: ProductInventory[]
}

interface AggregationOptions {
	aggregatePlacements: boolean
	aggregateBatches: boolean
}

interface Props {
	locations: LocationWithInventories[]
	aggregationOptions: AggregationOptions
}

export function ProductInventories({ locations, aggregationOptions }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	return (
		<div className='flex flex-col gap-4'>
			{locations.map(loc => (
				<InventoryGroup
					key={loc.id}
					location={loc}
					t={t}
					aggregationOptions={aggregationOptions}
				/>
			))}
		</div>
	)
}

function InventoryGroup({
	location,
	t,
	aggregationOptions: { aggregatePlacements, aggregateBatches },
}: {
	location: LocationWithInventories
	t: TFunction
	aggregationOptions: AggregationOptions
}) {
	const expandable = useMemo(
		() => location.inventories.length > 0,
		[location.inventories.length],
	)
	const [expanded, setExpanded] = useState(false)
	const inventories = useMemo(() => {
		const grouped: Record<string, ProductInventory> = {}

		for (const inv of location.inventories) {
			let key = inv.productID.toString(10)

			if (!aggregatePlacements) {
				key += inv.placementID.toString(10)
			}
			if (!aggregateBatches) {
				key += inv.batchID.toString(10)
			}

			if (grouped[key] == undefined) {
				grouped[key] = {
					...inv,
					quantity: 0,
				}
			}

			grouped[key].quantity += inv.quantity
			grouped[key].updated = max([inv.updated, grouped[key].updated])
		}

		return Object.values(grouped)
	}, [location.inventories, aggregatePlacements, aggregateBatches])

	const toggleExpanded = useCallback(() => {
		if (expandable) {
			setExpanded(cur => !cur)
		}
	}, [expandable])

	return (
		<div className='w-full border rounded-md grid grid-rows-[56px_1fr] overflow-y-hidden'>
			<div
				className={cn(
					'flex p-4 items-center gap-1.5 cursor-pointer',
					!expandable && 'cursor-default',
				)}
				onClick={toggleExpanded}>
				<Icons.chevronRight
					className={cn(
						'size-4 transition-transform rotate-0',
						expanded && 'rotate-90',
						!expandable && 'text-muted-foreground',
					)}
				/>
				<p>{location.name}</p>
				<span className='text-muted-foreground tabular-nums text-xs'>
					{t('details-page.inventory.inventory-count', {
						count: inventories.length,
					})}
				</span>
			</div>
			<div
				className={cn(
					'transition-all duration-300 max-h-0',
					expanded && 'max-h-[73vh]',
				)}>
				<Separator dir='horizontal' />
				<div className='w-full'>
					<ProductInventoryTable
						t={t}
						data={inventories}
						aggregationOptions={{ aggregatePlacements, aggregateBatches }}
					/>
				</div>
			</div>
		</div>
	)
}
