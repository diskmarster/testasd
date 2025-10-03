import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { DeleteProductModal } from '@/components/products/product-delete-modal'
import { LocationWithCounts } from '@/data/location.types'
import { LocationID } from '@/lib/database/schema/customer'
import { Placement } from '@/lib/database/schema/inventory'
import { integrationsService } from '@/service/integrations'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { productService } from '@/service/products'
import { Suspense } from 'react'
import { PageActionsSkeleton, PageActionsWrapper } from './PageActionsWrapper'
import { TableWrapper } from './TableWrapper'
import { ModalProductLabel } from '@/components/inventory/modal-product-label'

interface PageProps extends WithAuthProps {
	params: {
		lng: string
	}
}
export const maxDuration = 60

async function Page({ params: { lng }, user, customer }: PageProps) {
	const { t } = await serverTranslation(lng, 'produkter')

	const units = inventoryService.getActiveUnits()
	const groups = inventoryService.getActiveGroupsByID(user.customerID)
	const products = productService.getAllByCustomerID(user.customerID)
	const integrationSettings = await integrationsService.getSettings(
		user.customerID,
	)

	const locationPromise = locationService
		.getByCustomerID(user.customerID)
		.then(locations => {
			return new Promise<[LocationWithCounts[], Map<LocationID, Placement[]>]>(
				async res => {
					const map = new Map<LocationID, Placement[]>()

					for (const location of locations) {
						map.set(
							location.id,
							await inventoryService.getActivePlacementsByID(location.id),
						)
					}

					res([locations, map])
				},
			)
		})

	return (
		<SiteWrapper
			title={t('product-title')}
			description={t('product-description')}
			actions={
				<Suspense
					fallback={
						!integrationSettings?.useSyncProducts && (
							<PageActionsSkeleton userRole={user.role} />
						)
					}>
					<PageActionsWrapper
						customerPlan={customer.plan}
						user={user}
						units={units}
						groups={groups}
						locationPromise={locationPromise}
					/>
				</Suspense>
			}>
			<Suspense fallback={<SkeletonTable />}>
				<TableWrapper
					user={user}
					customer={customer}
					units={units}
					groups={groups}
					products={products}
					integrationSettings={integrationSettings}
				/>
			</Suspense>
			<DeleteProductModal />
			<ModalProductLabel />
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'læseadgang')
