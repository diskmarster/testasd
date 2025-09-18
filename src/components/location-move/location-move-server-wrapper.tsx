import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { productService } from '@/service/products'
import { User } from 'lucia'
import { Skeleton } from '../ui/skeleton'
import { LocationMoveClientWrapper } from './location-move-client-wrapper'

namespace LocationMoveWrapper {
	export interface Props {
		user: User
	}
}

export async function LocationMoveServerWrapper({
	user,
}: LocationMoveWrapper.Props) {
	const allLocations = await locationService.getAllByUserID(user.id)
	const currentLocation = await locationService.getLastVisited(user.id)
	const currentLocationInventories = await inventoryService.getInventory(
		user.customerID,
		currentLocation!,
	)
	let customerSettings = await customerService.getSettings(user.customerID)
	const useBatch = await productService
		.getBatchProducts(user.customerID)
		.then(p => p.length > 0)

	if (!customerSettings) {
		const today = new Date()
		customerSettings = {
			id: -1,
			inserted: today,
			updated: today,
			customerID: user.customerID,
			useReference: {
				flyt: true,
				regulering: true,
				tilgang: true,
				afgang: true,
			},
			usePlacement: true,
			authTimeoutMinutes: 1,
		}
	}

	return (
		<LocationMoveClientWrapper
			locations={allLocations}
			initialFromLocation={currentLocation!}
			initialFromInventories={currentLocationInventories}
			customerSettings={customerSettings}
			useBatch={useBatch}
		/>
	)
}

export function LocationMoveSkeleton() {
	return (
		<div className='space-y-4'>
			<div className='flex items-center gap-2'>
				<Skeleton className='h-9 w-52' />
				<Skeleton className='h-9 w-52' />
			</div>
			<div className='flex flex-col gap-1.5'>
				<Skeleton className='h-4 w-52' />
				<Skeleton className='h-9 w-32' />
			</div>
		</div>
	)
}
