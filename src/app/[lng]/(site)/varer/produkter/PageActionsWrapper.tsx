import { ModalImportProducts } from '@/components/inventory/modal-import-products'
import { CreateProductsForm } from '@/components/products/create-product-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Plan } from '@/data/customer.types'
import { LocationWithCounts } from '@/data/location.types'
import { hasPermissionByRank, UserRole } from '@/data/user.types'
import { LocationID } from '@/lib/database/schema/customer'
import { Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { integrationsService } from '@/service/integrations'
import { User } from 'lucia'

interface Props {
	user: User
	customerPlan: Plan
	units: Promise<Unit[]>
	groups: Promise<Group[]>
	locationPromise: Promise<[LocationWithCounts[], Map<LocationID, Placement[]>]>
}

export async function PageActionsWrapper({
	user,
	customerPlan,
	units: unitsPromise,
	groups,
	locationPromise,
}: Props) {
	const [locations, locationPlacementMap] = await locationPromise
	const units = await unitsPromise
	const integrationSettings = await integrationsService.getSettings(
		user.customerID,
	)

	return (
		!integrationSettings?.useSyncProducts && (
			<>
				{hasPermissionByRank(user.role, 'bruger') && (
					<ModalImportProducts
						allUnits={units.map(u => u.name.toLowerCase())}
					/>
				)}

				{hasPermissionByRank(user.role, 'bruger') && (
					<CreateProductsForm
						customerPlan={customerPlan}
						units={units}
						groups={await groups}
						locations={locations}
						locationPlacementMap={locationPlacementMap}
					/>
				)}
			</>
		)
	)
}

export function PageActionsSkeleton({ userRole }: { userRole: UserRole }) {
	return (
		<>
			{hasPermissionByRank(userRole, 'bruger') && (
				<Skeleton className='size-9 aspect-square border border-input shadow-sm'>
					{' '}
				</Skeleton>
			)}
			{hasPermissionByRank(userRole, 'bruger') && (
				<Skeleton className='size-9 aspect-square border border-input shadow-sm'>
					{' '}
				</Skeleton>
			)}
		</>
	)
}
