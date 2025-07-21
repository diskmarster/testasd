import { ProductInventories } from '@/components/products/product-inventories'
import { UpdateDefaultPlacementModal } from '@/components/products/product-update-default-placement-modal'
import { hasPermissionByPlan } from '@/data/user.types'
import {
	Customer,
	CustomerSettings,
	LocationID,
} from '@/lib/database/schema/customer'
import { Placement, ProductID } from '@/lib/database/schema/inventory'
import { PartialRequired } from '@/lib/types'
import { tryParseInt } from '@/lib/utils'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { User } from 'lucia'
import { redirect } from 'next/navigation'

interface Props {
	id: string
	lng: string
	user: User
	customer: Customer
}

export async function ProductInventoryWrapper({
	lng,
	id,
	user,
	customer,
}: Props) {
	const productID: ProductID | undefined = tryParseInt(id)
	if (productID == undefined) {
		redirect(`/${lng}/oversigt`)
	}
	const settings: PartialRequired<CustomerSettings, 'usePlacement'> =
		(await customerService.getSettings(customer.id)) ?? {
			usePlacement: true,
		}
	const locations = await locationService.getAllActiveByUserID(user.id)

	const locationPlacementMap = new Map<LocationID, Placement[]>()
	for (const location of locations) {
		locationPlacementMap.set(
			location.id,
			await inventoryService.getActivePlacementsByID(location.id),
		)
	}

	const inventories = await inventoryService.getProductInventoryForLocations(
		productID,
		locations,
	)
	const defaultPlacements =
		await inventoryService.getDefaultPlacementForProduct(productID)

	const locationsWithInventories = Array.from(inventories.entries()).map(
		([loc, inv]) => ({
			...loc,
			inventories: inv.filter(
				inv =>
					inv.quantity != 0 ||
					defaultPlacements.some(dp => dp.placementID == inv.placementID),
			),
			defaultPlacements: defaultPlacements.filter(
				dp => dp.locationID == loc.id,
			),
		}),
	)

	const aggregatePlacements = !(
		hasPermissionByPlan(customer.plan, 'basis') && settings.usePlacement
	)
	const aggregateBatches = !hasPermissionByPlan(customer.plan, 'pro')

	return (
		<>
			<UpdateDefaultPlacementModal productID={productID} />
			<ProductInventories
				locations={locationsWithInventories}
				locationPlacementMap={locationPlacementMap}
				aggregationOptions={{
					aggregatePlacements,
					aggregateBatches,
				}}
				productID={productID}
			/>
		</>
	)
}
