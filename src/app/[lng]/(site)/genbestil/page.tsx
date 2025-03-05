import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ModalAddOrderedReorder } from '@/components/inventory/modal-add-ordered-modal'
import { ModalCreateReorder } from '@/components/inventory/modal-create-reorder'
import { ModalDeleteReorder } from '@/components/inventory/modal-delete-reorder'
import { ModalBulkReorder } from '@/components/inventory/modal-reorder-bulk'
import { ModalUpdateReorder } from '@/components/inventory/modal-update-reorder'
import { TableReorder } from '@/components/inventory/table-reorder'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { ReorderPageActions } from './page-actions'

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, user, customer }: Props) {
	const { t } = await serverTranslation(lng, 'genbestil')

	const location = await locationService.getLastVisited(user.id)
	if (!location) {
		signOutAction()
		return
	}

	const [products, reorders, units, groups] = await Promise.all([
		inventoryService.getActiveProductsByID(customer.id),
		inventoryService.getReordersByID(location),
		inventoryService.getActiveUnits(),
		inventoryService.getActiveGroupsByID(customer.id),
	])

	const productsWithNoReorder = products.filter(
		prod => !reorders.some(reorder => prod.id === reorder.productID),
	)

	const redReorders = reorders.filter(
		r => r.quantity < r.minimum && r.ordered < r.orderAmount,
	)

	return (
		<SiteWrapper
			title={t('reorder-page.title')}
			description={t('reorder-page.description')}
			actions={
				<ReorderPageActions
					reorders={redReorders}
					productsWithNoReorder={productsWithNoReorder} 
				/>
			}>
			<TableReorder data={reorders} user={user} units={units} groups={groups} />

			{/* Modals without triggers that we open with custom events from row actions */}
			<ModalBulkReorder reorders={reorders} />
			<ModalUpdateReorder />
			<ModalDeleteReorder />
			<ModalAddOrderedReorder />
		</SiteWrapper>
	)
}

export default withAuth(Page, 'basis')
