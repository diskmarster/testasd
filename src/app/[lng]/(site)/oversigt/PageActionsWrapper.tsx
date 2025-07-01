import { ModalMoveInventory } from "@/components/inventory/modal-move-inventory";
import { ModalUpdateInventory } from "@/components/inventory/modal-update-inventory";
import { Skeleton } from "@/components/ui/skeleton";
import { Plan } from "@/data/customer.types";
import { FormattedInventory } from "@/data/inventory.types";
import { hasPermissionByPlan, hasPermissionByRank, UserRole } from "@/data/user.types";
import { Customer, CustomerSettings } from "@/lib/database/schema/customer";
import { Batch, Placement, Product } from "@/lib/database/schema/inventory";
import { User } from "lucia";

interface Props {
	user: User,
	customer: Customer,
	lng: string,
	productsPromise: Promise<Product[]>,
	placementsPromise: Promise<Placement[]>,
	batchesPromise: Promise<Batch[]>,
	customerSettings: Pick<CustomerSettings, 'useReference' | 'usePlacement' | 'useBatch'>,
	inventoryPromise: Promise<FormattedInventory[]>,
}

export async function PageActionsWrapper({
	user,
	customer,
	lng,
	productsPromise,
	placementsPromise,
	batchesPromise,
	customerSettings,
	inventoryPromise,
}: Props) {
	const products = await productsPromise
	const placements = await placementsPromise
	const batches = await batchesPromise

	return (
		<>
			{hasPermissionByRank(user.role, 'bruger') && (
				<ModalUpdateInventory
					customer={customer}
					products={products}
					placements={placements}
					batches={batches}
					lng={lng}
					settings={customerSettings}
				/>
			)}
			{hasPermissionByPlan(customer.plan, 'basis') &&
				customerSettings.usePlacement &&
				hasPermissionByRank(user.role, 'bruger') && (
					<ModalMoveInventory
						placements={placements}
						customer={customer}
						inventory={await inventoryPromise}
						batches={batches}
						settings={customerSettings}
					/>
				)}
		</>
	)
}

export function PageActionsSkeleton({role, plan, usePlacement}: {role: UserRole, plan: Plan, usePlacement: boolean}) {
	return (
		<>
			{hasPermissionByRank(role, 'bruger') && (
				<Skeleton className="size-9 aspect-square border border-input shadow-sm">
				</Skeleton>
			)}
			{hasPermissionByPlan(plan, 'basis') &&
				usePlacement &&
				hasPermissionByRank(role, 'bruger') && (
				<Skeleton className="size-9 aspect-square border border-input shadow-sm">
				</Skeleton>
				)}
		</>
	)
}
