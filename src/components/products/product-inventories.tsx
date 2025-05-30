'use client'

import { LocationWithPrimary } from "@/lib/database/schema/customer"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { TFunction } from "i18next"
import { Icons } from "../ui/icons"
import { useCallback, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "../ui/separator"
import { ProductInventoryTable } from "./product-inventory-table"
import { ProductInventory } from "@/data/inventory.types"

interface LocationWithInventories extends LocationWithPrimary {
	inventories: ProductInventory[]
}

interface Props {
	locations: LocationWithInventories[]
}

export function ProductInventories({ locations }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	return (
		<div className="flex flex-col gap-4">
			{locations.map(loc => (
				<InventoryGroup key={loc.id} location={loc} t={t} />
			))}
		</div>
	)
}

function InventoryGroup({location, t}: { location: LocationWithInventories, t: TFunction }) {
	const expandable = useMemo(() => location.inventories.length > 0, [location.inventories.length])
	const [expanded, setExpanded] = useState(false)

	const toggleExpanded = useCallback(() => {
		if (expandable) {
			setExpanded(cur => !cur)
		}
	}, [expandable])

	return (
		<div className="w-full border rounded-md grid grid-rows-[56px_1fr] overflow-y-hidden">
			<div className={cn('flex p-4 items-center gap-1.5 cursor-pointer', !expandable && 'cursor-default')} onClick={toggleExpanded}>
				<Icons.chevronRight className={cn('size-4 transition-transform rotate-0', expanded && 'rotate-90', !expandable && 'text-muted-foreground')} />
				<p>{location.name}</p>
				<span className='text-muted-foreground tabular-nums text-xs'>
					{t("details-page.inventory.inventory-count", { count: location.inventories.length })}
				</span>
			</div>
			<div className={cn("transition-all duration-300 max-h-0", expanded && "max-h-[73vh]")}>
				<Separator dir="horizontal" />
				<div className="w-full">
					<ProductInventoryTable t={t} data={location.inventories} />
				</div>
			</div>
		</div>
	)
}
