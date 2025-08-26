import { serverTranslation } from '@/app/i18n/index'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { ProductID } from '@/lib/database/schema/inventory'
import { attachmentService } from '@/service/attachments'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { Suspense } from 'react'
import { PageActionsSkeleton, PageActionsWrapper } from './PageActionsWrapper'
import { OverviewTableWrapper } from './TableWrapper'

interface PageProps extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Home({ params: { lng }, user, customer }: PageProps) {
	const { t } = await serverTranslation(lng, 'oversigt')

	const location = await locationService.getLastVisited(user.id!)
	if (!location) return null

	const units = inventoryService.getActiveUnits()
	const groups = inventoryService.getActiveGroupsByID(customer.id)
	const placements = inventoryService.getAllPlacementsByID(location)
	const batches = inventoryService.getActiveBatchesByID(location)
	const customerSettings = (await customerService.getSettings(customer.id)) ?? {
		usePlacement: true,
		useReference: {
			tilgang: true,
			afgang: true,
			regulering: true,
			flyt: true,
		},
	}

	const isGrouped =
		(hasPermissionByPlan(customer.plan, 'basis') &&
			customerSettings.usePlacement) ||
		hasPermissionByPlan(customer.plan, 'pro')

	let inventory = inventoryService
		.getInventory(customer.id, location)
		.then(groupInventoriesByProduct)
		.then(filterGroupedInventories)
		.then(sumQuantities(customerSettings, customer))
		.then(sortInventories)

	const reorders = inventoryService.getReordersByID(location, {
		withRequested: false,
	})

	const images = attachmentService.getByCustomerID(
		customer.id,
		'product',
		'image',
	)
	return (
		<SiteWrapper
			title={t('overview')}
			description={t('overview-description')}
			actions={
				<Suspense
					fallback={
						<PageActionsSkeleton
							role={user.role}
							plan={customer.plan}
							usePlacement={customerSettings.usePlacement}
						/>
					}>
					<PageActionsWrapper
						user={user}
						customer={customer}
						lng={lng}
						placementsPromise={placements}
						batchesPromise={batches}
						customerSettings={customerSettings}
						inventoryPromise={inventory}
					/>
				</Suspense>
			}>
			<Suspense fallback={<SkeletonTable />}>
				<OverviewTableWrapper
					user={user}
					customer={customer}
					units={units}
					groups={groups}
					placements={placements}
					batches={batches}
					customerSettings={customerSettings}
					reordersPromise={reorders}
					imagesPromise={images}
					inventoryPromise={inventory}
					isGrouped={isGrouped}
				/>
			</Suspense>
		</SiteWrapper>
	)
}

export default withAuth(Home)

async function groupInventoriesByProduct(
	inventory: FormattedInventory[],
): Promise<Record<ProductID, FormattedInventory[]>> {
	return inventory.reduce(
		(acc, cur) => {
			if (acc[cur.product.id] == undefined) {
				acc[cur.product.id] = []
			}

			acc[cur.product.id].push(cur)

			return acc
		},
		{} as Record<ProductID, FormattedInventory[]>,
	)
}

async function filterGroupedInventories(
	groupedInventories: Record<ProductID, FormattedInventory[]>,
): Promise<FormattedInventory[]> {
	// take inventories where quantity != 0 if any inventory != 0
	let inventories: FormattedInventory[] = Object.values(
		groupedInventories,
	).flatMap(invs => {
		let filtered = invs
		if (filtered.some(inv => inv.isDefaultPlacement)) {
			filtered = filtered.filter(inv => inv.isDefaultPlacement)
		}

		const totalQty: number = filtered.reduce(
			(acc, cur) => acc + cur.quantity,
			0,
		)
		if (totalQty != 0) {
			filtered = filtered.filter(i => i.quantity != 0)
		}

		return filtered
	})

	return inventories
}

function sumQuantities(
	customerSettings: Pick<CustomerSettings, 'usePlacement'>,
	customer: Customer,
) {
	return async function (
		inventories: FormattedInventory[],
	): Promise<Map<string, FormattedInventory>> {
		// build map of inventories
		// grouped by product id and placement/batch if they are in use
		let inventoryMap = inventories.reduce((acc, cur) => {
			const keyParts = [String(cur.product.id)]
			if (
				hasPermissionByPlan(customer.plan, 'basis') &&
				customerSettings.usePlacement
			)
				keyParts.push(String(cur.placement.id))
			if (hasPermissionByPlan(customer.plan, 'pro') && cur.product.useBatch)
				keyParts.push(String(cur.batch.id))

			const key = keyParts.join('|')

			if (acc.has(key)) {
				const current = acc.get(key)!
				current.quantity += cur.quantity
				acc.set(key, current)
			} else {
				acc.set(key, cur)
			}

			return acc
		}, new Map<string, FormattedInventory>())

		return inventoryMap
	}
}

async function sortInventories(
	inventoryMap: Map<string, FormattedInventory>,
): Promise<FormattedInventory[]> {
	return Array.from(inventoryMap.values()).sort((a, b) => {
		const skuCompare = a.product.sku.localeCompare(b.product.sku)

		if (skuCompare == 0) {
			return b.placement.name.localeCompare(a.placement.name)
		} else {
			return skuCompare
		}
	})
}
