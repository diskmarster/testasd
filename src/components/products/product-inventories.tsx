'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import {
	FormattedDefaultPlacement,
	ProductInventory,
} from '@/data/inventory.types'
import { LocationID, LocationWithPrimary } from '@/lib/database/schema/customer'
import {
	Placement,
	PlacementID,
	ProductID,
} from '@/lib/database/schema/inventory'
import { cn, tryParseInt } from '@/lib/utils'
import { max } from 'date-fns'
import { TFunction } from 'i18next'
import { useCallback, useMemo, useState } from 'react'
import { emitCustomEvent, useCustomEventListener } from 'react-custom-events'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { Separator } from '../ui/separator'
import { ProductInventoryTable } from './product-inventory-table'
import { RemoveDefaultPlacementModal } from './product-remove-default-placement'

interface LocationWithInventories extends LocationWithPrimary {
	inventories: ProductInventory[]
	defaultPlacements: FormattedDefaultPlacement[]
}

interface AggregationOptions {
	aggregatePlacements: boolean
	aggregateBatches: boolean
}

export interface ProductInventoryWithDefault extends ProductInventory {
	isDefaultPlacement: boolean
}

interface Props {
	locations: LocationWithInventories[]
	aggregationOptions: AggregationOptions
	locationPlacementMap: Map<LocationID, Placement[]>
	productID: ProductID
}

export function ProductInventories({
	locations,
	aggregationOptions,
	locationPlacementMap,
	productID,
}: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	return (
		<div className='flex flex-col gap-4'>
			{locations.map(loc => (
				<InventoryGroup
					key={loc.id}
					location={loc}
					placements={locationPlacementMap.get(loc.id) ?? []}
					t={t}
					aggregationOptions={aggregationOptions}
					productID={productID}
				/>
			))}
		</div>
	)
}

function InventoryGroup({
	location,
	placements,
	t,
	aggregationOptions: { aggregatePlacements, aggregateBatches },
	productID,
}: {
	location: LocationWithInventories
	placements: Placement[]
	t: TFunction
	aggregationOptions: AggregationOptions
	productID: ProductID
}) {
	const expandable = useMemo(
		() => location.inventories.length > 0,
		[location.inventories.length],
	)
	const [expanded, setExpanded] = useState(false)
	const inventories = useMemo(() => {
		const grouped: Record<string, ProductInventoryWithDefault> = {}

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
					isDefaultPlacement: location.defaultPlacements.some(
						dp => dp.placementID == inv.placementID,
					),
				}
			}

			grouped[key].quantity += inv.quantity
			grouped[key].updated = max([inv.updated, grouped[key].updated])
		}

		return Object.values(grouped)
	}, [location.inventories, aggregatePlacements, aggregateBatches])
	const totalQty = useMemo(
		() => inventories.map(i => i.quantity).reduce((acc, cur) => acc + cur, 0),
		[inventories],
	)

	const toggleExpanded = useCallback(() => {
		if (expandable) {
			setExpanded(cur => !cur)
		}
	}, [expandable])

	const defaultPlacementID = useMemo(
		() => location.defaultPlacements.at(0)?.placementID,
		[location],
	)
	const [selectedPlacementID, setSelectedPlacementID] = useState(
		defaultPlacementID?.toString() ?? '',
	)

	useCustomEventListener(
		`DefaultPlacementUpdated-${location.id}`,
		(data: { placementID: PlacementID }) => {
			setSelectedPlacementID(data.placementID.toString())
		},
	)

	return (
		<div className='w-full border rounded-md grid grid-rows-[auto_1fr] overflow-y-hidden'>
			<div className='grid grid-cols-[1fr_auto]'>
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
					<div className='grid'>
						<p>{location.name}</p>
						<span className='text-muted-foreground tabular-nums text-xs'>
							{t('details-page.inventory.inventory-count', {
								totalQty,
								count: inventories.length,
							})}
						</span>
					</div>
				</div>
				<div className='grid gap-2 p-3 justify-items-end'>
					<Label>{t('details-page.inventory.default-placement-label')}</Label>
					<div className='flex gap-2 ml-auto items-center'>
						<RemoveDefaultPlacementModal
							placements={placements}
							defaultPlacementID={defaultPlacementID}
							locationID={location.id}
							productID={productID}
							setSelectedPlacementID={setSelectedPlacementID}
						/>
						<DefaultPlacementSelect
							t={t}
							placements={placements}
							selectedPlacementID={selectedPlacementID}
						/>
					</div>
				</div>
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

function DefaultPlacementSelect({
	t,
	placements,
	selectedPlacementID,
}: {
	t: TFunction<'produkter'>
	placements: Placement[]
	selectedPlacementID: string
}) {
	const handleValueChange = (id: string) => {
		const parsedId = tryParseInt(id)
		const selectedPlacement = placements.find(p => p.id == parsedId)
		if (selectedPlacement) {
			emitCustomEvent('UpdateDefaultPlacement', selectedPlacement)
		}
	}

	return (
		<Select value={selectedPlacementID} onValueChange={handleValueChange}>
			<SelectTrigger className='w-[25ch]'>
				<SelectValue
					placeholder={t('details-page.inventory.no-default-placement')}
				/>
			</SelectTrigger>
			<SelectContent className='w-[25ch]'>
				{placements.map(placement => (
					<SelectItem
						key={`${placement.locationID}_${placement.id}`}
						value={placement.id.toString()}>
						{placement.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
