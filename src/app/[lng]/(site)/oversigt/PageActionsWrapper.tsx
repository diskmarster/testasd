import { ModalBulkOutgoing } from '@/components/inventory/modal-bulk-outgoing'
import { ModalMoveInventory } from '@/components/inventory/modal-move-inventory'
import { ModalUpdateInventory } from '@/components/inventory/modal-update-inventory'
import { Skeleton } from '@/components/ui/skeleton'
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import {
	hasPermissionByPlan,
	hasPermissionByRank,
	UserRole,
} from '@/data/user.types'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { Batch, Placement } from '@/lib/database/schema/inventory'
import { User } from 'lucia'

interface Props {
	user: User
	customer: Customer
	lng: string
	placementsPromise: Promise<Placement[]>
	batchesPromise: Promise<Batch[]>
	customerSettings: Pick<CustomerSettings, 'useReference' | 'usePlacement'>
	inventoryPromise: Promise<FormattedInventory[]>
}

export async function PageActionsWrapper({
	user,
	customer,
	lng,
	placementsPromise,
	batchesPromise,
	customerSettings,
	inventoryPromise,
}: Props) {
	const placements = await placementsPromise
	const batches = await batchesPromise

	return (
		<>
			{hasPermissionByRank(user.role, 'bruger') && (
				<ModalUpdateInventory
					customer={customer}
					inventory={await inventoryPromise}
					placements={placements}
					batches={batches}
					lng={lng}
					settings={customerSettings}
				/>
			)}
			{hasPermissionByPlan(customer.plan, 'basis') &&
				customerSettings.usePlacement &&
				hasPermissionByRank(user.role, 'bruger') && (
					<>
						<ModalBulkOutgoing
							placements={placements}
							useBatch={hasPermissionByPlan(customer.plan, 'pro')}
							useReference={customerSettings.useReference.afgang}
						/>
						<ModalMoveInventory
							placements={placements}
							customer={customer}
							inventory={await inventoryPromise}
							batches={batches}
							settings={customerSettings}
						/>
					</>
				)}
		</>
	)
}

export function PageActionsSkeleton({
	role,
	plan,
	usePlacement,
}: {
	role: UserRole
	plan: Plan
	usePlacement: boolean
}) {
	return (
		<>
			{hasPermissionByRank(role, 'bruger') && (
				<Skeleton className='size-9 aspect-square border border-input shadow-sm'></Skeleton>
			)}
			{hasPermissionByPlan(plan, 'basis') &&
				usePlacement &&
				hasPermissionByRank(role, 'bruger') && (
					<div className='flex items-center gap-2'>
						<Skeleton className='size-9 aspect-square border border-input shadow-sm' />
						<Skeleton className='size-9 aspect-square border border-input shadow-sm' />
					</div>
				)}
		</>
	)
}
