import { ProductInventories } from '@/components/products/product-inventories'
import { hasPermissionByPlan } from '@/data/user.types'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { ProductID } from '@/lib/database/schema/inventory'
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

export async function ProductInventoryWrapper({ lng, id, user, customer }: Props) {
	const productID: ProductID | undefined = tryParseInt(id)
	if (productID == undefined) {
		redirect(`/${lng}/oversigt`)
	}
	const settings: PartialRequired<CustomerSettings, 'usePlacement' | 'useBatch'> = await customerService.getSettings(customer.id) ?? {
		usePlacement: true,
		useBatch: true,
	}
	const locations = await locationService.getAllActiveByUserID(user.id)

	const inventories = await inventoryService.getProductInventoryForLocations(
		productID,
		locations,
	)

	const locationsWithInventories = Array.from(inventories.entries()).map(
		([loc, inv]) => ({
			...loc,
			inventories: inv.filter(inv => inv.quantity != 0),
		}),
	)

	const aggregatePlacements = !(hasPermissionByPlan(customer.plan, 'basis') && settings.usePlacement)
	const aggregateBatches = !(hasPermissionByPlan(customer.plan, 'pro') && settings.useBatch)

	return <ProductInventories locations={locationsWithInventories} aggregationOptions={{
		aggregatePlacements,
		aggregateBatches,
	}} />
}
