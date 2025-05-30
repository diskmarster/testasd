import { ProductInventories } from '@/components/products/product-inventories'
import { ProductID } from '@/lib/database/schema/inventory'
import { tryParseInt } from '@/lib/utils'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { User } from 'lucia'
import { redirect } from 'next/navigation'

interface Props {
	id: string
	lng: string
	user: User
}

export async function ProductInventoryWrapper({ lng, id, user }: Props) {
	const productID: ProductID | undefined = tryParseInt(id)
	if (productID == undefined) {
		redirect(`/${lng}/oversigt`)
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

	return <ProductInventories locations={locationsWithInventories} />
}
