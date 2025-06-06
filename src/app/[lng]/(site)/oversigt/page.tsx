import { serverTranslation } from '@/app/i18n/index'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { attachmentService } from '@/service/attachments'
import { Suspense } from 'react'
import { PageActionsSkeleton, PageActionsWrapper } from './PageActionsWrapper'
import { OverviewTableWrapper } from './TableWrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'

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
  const placements = inventoryService.getActivePlacementsByID(location)
  const batches = inventoryService.getActiveBatchesByID(location)
  const products = inventoryService.getActiveProductsByID(customer.id)
  const customerSettings = (await customerService.getSettings(customer.id)) ?? {
    usePlacement: true,
    useBatch: true,
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
    (hasPermissionByPlan(customer.plan, 'pro') && customerSettings.useBatch)

	let inventory = inventoryService
		.getInventory(location)
		.then(inventory => {
			// Group inventories by product
			let groupedInventories = inventory.reduce(
					(acc, cur) => {
						if (acc[cur.product.id] == undefined) {
							acc[cur.product.id] = []
						}

						acc[cur.product.id].push(cur)

						return acc
					},
					{} as Record<number, FormattedInventory[]>,
				)

			// take inventories where quantity != 0 if any inventory != 0
			let inventories = Object.values(groupedInventories).flatMap(invs =>
				invs.some(inv => inv.quantity != 0)
					? invs.filter(inv => inv.quantity != 0)
					: invs,
			)

			// build map of inventories
			// grouped by product id and placement/batch if they are in use
			let inventoryMap = inventories.reduce(
					(acc, cur) => {
						const keyParts = [String(cur.product.id)]
						if (
							hasPermissionByPlan(customer.plan, 'basis') &&
								customerSettings.usePlacement
						)
							keyParts.push(String(cur.placement.id))
						if (
							hasPermissionByPlan(customer.plan, 'pro') &&
								customerSettings.useBatch
						)
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
					},
					new Map<string, FormattedInventory>(),
				)

			// sort grouped inventories and return
			return Array.from(
				inventoryMap.values()
			).sort((a, b) => {
					const skuCompare = a.product.sku.localeCompare(b.product.sku)

					if (skuCompare == 0) {
						return b.placement.name.localeCompare(a.placement.name)
					} else {
						return skuCompare
					}
				}
			)
		})

  const reorders = inventoryService.getReordersByID(location, {
    withRequested: false,
  })

  const images = attachmentService.getByCustomerID(customer.id, 'product', 'image')

  return (
    <SiteWrapper
      title={t('overview')}
      description={t('overview-description')}
      actions={
				<Suspense fallback={<PageActionsSkeleton role={user.role} plan={customer.plan} usePlacement={customerSettings.usePlacement} />}>
					<PageActionsWrapper 
						user={user}
						customer={customer}
						lng={lng}
						productsPromise={products}
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
